"use server"

import { randomBytes, randomUUID } from "crypto"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { query } from "@/lib/db"

const ADMIN_USER = "Admin"
const ADMIN_PASS = "Edwards1985."
const COOKIE = "cash_admin"

function cookieOpts() {
  const dev = process.env.NODE_ENV !== "production"
  return {
    httpOnly: true,
    secure: true,
    sameSite: dev ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  }
}

export async function adminLogin(username: string, password: string) {
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return { ok: false as const }
  }
  const token = randomUUID()
  await query("INSERT INTO admin_sessions (token) VALUES ($1)", [token])
  const store = await cookies()
  store.set(COOKIE, token, cookieOpts())
  return { ok: true as const }
}

export async function adminLogout() {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (token) await query("DELETE FROM admin_sessions WHERE token = $1", [token])
  store.delete(COOKIE)
}

export async function isAdmin() {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return false
  const rows = await query("SELECT token FROM admin_sessions WHERE token = $1", [token])
  return rows.length > 0
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized")
}

function genKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(12)
  let out = ""
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) out += "-"
    out += chars[bytes[i] % chars.length]
  }
  return out
}

export type AdminKey = {
  id: number
  key: string
  label: string | null
  status: string
  hwid: string | null
  holderUsername: string | null
  holderAvatar: string | null
  balance: number
  currentScreen: string | null
  createdAt: string
  redeemedAt: string | null
  lastSeenAt: string | null
}

type DbKey = {
  id: number
  key: string
  label: string | null
  status: string
  hwid: string | null
  holder_username: string | null
  holder_avatar: string | null
  balance_cents: string
  current_screen: string | null
  created_at: string
  redeemed_at: string | null
  last_seen_at: string | null
}

function mapKey(r: DbKey): AdminKey {
  return {
    id: r.id,
    key: r.key,
    label: r.label,
    status: r.status,
    hwid: r.hwid,
    holderUsername: r.holder_username,
    holderAvatar: r.holder_avatar,
    balance: Number.parseInt(r.balance_cents, 10) / 100,
    currentScreen: r.current_screen,
    createdAt: r.created_at,
    redeemedAt: r.redeemed_at,
    lastSeenAt: r.last_seen_at,
  }
}

export async function getKeys(): Promise<AdminKey[]> {
  await requireAdmin()
  const rows = await query<DbKey>("SELECT * FROM keys ORDER BY created_at DESC")
  return rows.map(mapKey)
}

export async function createKey(label: string, balanceDollars: number) {
  await requireAdmin()
  const key = genKey()
  const cents = Math.round((balanceDollars || 0) * 100)
  await query("INSERT INTO keys (key, label, balance_cents) VALUES ($1, $2, $3)", [key, label || null, cents])
  revalidatePath("/admin")
  return { key }
}

export async function setKeyStatus(id: number, status: "active" | "revoked") {
  await requireAdmin()
  await query("UPDATE keys SET status = $2 WHERE id = $1", [id, status])
  revalidatePath("/admin")
}

export async function resetHwid(id: number) {
  await requireAdmin()
  await query("UPDATE keys SET hwid = NULL, current_screen = NULL, redeemed_at = NULL WHERE id = $1", [id])
  revalidatePath("/admin")
}

export async function deleteKey(id: number) {
  await requireAdmin()
  const rows = await query<{ key: string }>("SELECT key FROM keys WHERE id = $1", [id])
  if (rows[0]) await query("DELETE FROM activity WHERE key = $1", [rows[0].key])
  await query("DELETE FROM keys WHERE id = $1", [id])
  revalidatePath("/admin")
}

export type ActivityEntry = {
  id: number
  event: string
  detail: string | null
  path: string | null
  createdAt: string
}

export async function getKeyDetail(keyValue: string) {
  await requireAdmin()
  const rows = await query<DbKey>("SELECT * FROM keys WHERE key = $1", [keyValue])
  if (!rows[0]) return null
  const activity = await query<{ id: number; event: string; detail: string | null; path: string | null; created_at: string }>(
    "SELECT id, event, detail, path, created_at FROM activity WHERE key = $1 ORDER BY created_at DESC LIMIT 200",
    [keyValue],
  )
  return {
    key: mapKey(rows[0]),
    activity: activity.map((a) => ({
      id: a.id,
      event: a.event,
      detail: a.detail,
      path: a.path,
      createdAt: a.created_at,
    })) as ActivityEntry[],
  }
}
