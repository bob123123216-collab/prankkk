"use server"

import { query } from "@/lib/db"

export type SessionProfile = {
  username: string
  balance: number
  avatar: string | null
}

export type SessionTransaction = {
  id: string
  username: string
  amount: number
  note: string
  date: number
}

type KeyRow = {
  key: string
  status: string
  hwid: string | null
  holder_username: string | null
  holder_avatar: string | null
  balance_cents: string
}

function normalizeKey(key: string) {
  return key.trim().toUpperCase()
}

function rowToProfile(row: KeyRow): SessionProfile {
  return {
    username: row.holder_username || "yourname",
    balance: Number.parseInt(row.balance_cents, 10) / 100,
    avatar: row.holder_avatar,
  }
}

/**
 * Looks up a key, binds it to this device (HWID) on first use, and returns the
 * holder's current state. Subsequent calls must come from the same device.
 */
export async function validateAndLoad(rawKey: string, hwid: string) {
  const key = normalizeKey(rawKey)
  if (!key || !hwid) return { ok: false as const, reason: "invalid" as const }

  const rows = await query<KeyRow>("SELECT * FROM keys WHERE key = $1", [key])
  const row = rows[0]
  if (!row) return { ok: false as const, reason: "invalid" as const }
  if (row.status === "revoked") return { ok: false as const, reason: "revoked" as const }

  if (!row.hwid) {
    // First redemption: bind to this device.
    await query(
      "UPDATE keys SET hwid = $2, redeemed_at = now(), last_seen_at = now() WHERE key = $1 AND hwid IS NULL",
      [key, hwid],
    )
    await query("INSERT INTO activity (key, event, detail) VALUES ($1, 'redeem', $2)", [
      key,
      "Activated on a new device",
    ])
    row.hwid = hwid
  } else if (row.hwid !== hwid) {
    return { ok: false as const, reason: "hwid" as const }
  } else {
    await query("UPDATE keys SET last_seen_at = now() WHERE key = $1", [key])
  }

  const txRows = await query<{ id: number; detail: string; created_at: string }>(
    "SELECT id, detail, created_at FROM activity WHERE key = $1 AND event = 'payment' ORDER BY created_at DESC LIMIT 100",
    [key],
  )

  const transactions: SessionTransaction[] = txRows.map((t) => {
    let parsed: { username?: string; amount?: number; note?: string } = {}
    try {
      parsed = JSON.parse(t.detail)
    } catch {
      // ignore malformed rows
    }
    return {
      id: String(t.id),
      username: parsed.username || "",
      amount: parsed.amount || 0,
      note: parsed.note || "",
      date: new Date(t.created_at).getTime(),
    }
  })

  return { ok: true as const, profile: rowToProfile(row), transactions }
}

/** Verifies the key is active and bound to this device. */
async function verify(key: string, hwid: string): Promise<KeyRow | null> {
  const rows = await query<KeyRow>("SELECT * FROM keys WHERE key = $1 AND hwid = $2 AND status = 'active'", [key, hwid])
  return rows[0] ?? null
}

export async function syncProfile(rawKey: string, hwid: string, patch: Partial<SessionProfile>) {
  const key = normalizeKey(rawKey)
  const row = await verify(key, hwid)
  if (!row) return { ok: false as const }

  const username = patch.username ?? row.holder_username
  const avatar = patch.avatar !== undefined ? patch.avatar : row.holder_avatar
  const balanceCents = patch.balance !== undefined ? Math.round(patch.balance * 100) : Number.parseInt(row.balance_cents, 10)

  await query(
    "UPDATE keys SET holder_username = $2, holder_avatar = $3, balance_cents = $4, last_seen_at = now() WHERE key = $1",
    [key, username, avatar, balanceCents],
  )

  const changes: string[] = []
  if (patch.username !== undefined && patch.username !== row.holder_username) changes.push(`username → $${patch.username}`)
  if (patch.balance !== undefined && Math.round(patch.balance * 100) !== Number.parseInt(row.balance_cents, 10))
    changes.push(`balance → $${patch.balance.toFixed(2)}`)
  if (patch.avatar !== undefined && patch.avatar !== row.holder_avatar) changes.push("changed profile photo")

  if (changes.length) {
    await query("INSERT INTO activity (key, event, detail, path) VALUES ($1, 'profile_update', $2, 'settings')", [
      key,
      changes.join(", "),
    ])
  }
  return { ok: true as const }
}

export async function recordPayment(
  rawKey: string,
  hwid: string,
  payment: { username: string; amount: number; note: string },
) {
  const key = normalizeKey(rawKey)
  const row = await verify(key, hwid)
  if (!row) return { ok: false as const }

  const newCents = Number.parseInt(row.balance_cents, 10) - Math.round(payment.amount * 100)
  await query("UPDATE keys SET balance_cents = $2, last_seen_at = now() WHERE key = $1", [key, newCents])
  await query("INSERT INTO activity (key, event, detail, path) VALUES ($1, 'payment', $2, 'pay')", [
    key,
    JSON.stringify({ username: payment.username, amount: payment.amount, note: payment.note }),
  ])

  return { ok: true as const, balance: newCents / 100 }
}

export async function heartbeat(rawKey: string, hwid: string, screen: string) {
  const key = normalizeKey(rawKey)
  const rows = await query<{ current_screen: string | null }>(
    "SELECT current_screen FROM keys WHERE key = $1 AND hwid = $2 AND status = 'active'",
    [key, hwid],
  )
  const row = rows[0]
  if (!row) return { ok: false as const }

  await query("UPDATE keys SET current_screen = $2, last_seen_at = now() WHERE key = $1", [key, screen])
  if (row.current_screen !== screen) {
    await query("INSERT INTO activity (key, event, detail, path) VALUES ($1, 'navigate', $2, $3)", [
      key,
      `Opened ${screen}`,
      screen,
    ])
  }
  return { ok: true as const }
}
