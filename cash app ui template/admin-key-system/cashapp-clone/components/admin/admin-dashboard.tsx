"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Copy,
  Eye,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  RotateCcw,
  Trash2,
  Ban,
  CheckCircle2,
} from "lucide-react"
import {
  adminLogout,
  createKey,
  deleteKey,
  getKeys,
  resetHwid,
  setKeyStatus,
  type AdminKey,
} from "@/app/actions/admin"

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 30000
}

function relativeTime(iso: string | null) {
  if (!iso) return "never"
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

export function AdminDashboard() {
  const router = useRouter()
  const { data: keys, mutate, isLoading } = useSWR<AdminKey[]>("admin-keys", () => getKeys(), {
    refreshInterval: 4000,
  })

  const [label, setLabel] = useState("")
  const [balance, setBalance] = useState("1842.50")
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleCreate = async () => {
    setCreating(true)
    const res = await createKey(label, Number.parseFloat(balance) || 0)
    setNewKey(res.key)
    setLabel("")
    setCreating(false)
    mutate()
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard?.writeText(value)
    } catch {
      // Clipboard API can be blocked by permissions policy (e.g. in an iframe).
      // Fall back to a temporary textarea + execCommand.
      try {
        const textarea = document.createElement("textarea")
        textarea.value = value
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      } catch {
        // Ignore — still show the copied confirmation so the UI doesn't break.
      }
    }
    setCopied(value)
    setTimeout(() => setCopied(null), 1500)
  }

  const logout = async () => {
    await adminLogout()
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-foreground">Key & Session Admin</h1>
            <p className="text-xs text-muted-foreground">{keys?.length ?? 0} keys total</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground active:bg-muted"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-6">
        {/* Create key */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <Plus className="h-4 w-4" aria-hidden="true" /> Generate a new key
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Label (who is this for?)</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Jake"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:w-40">
              <span className="text-xs font-medium text-muted-foreground">Starting balance</span>
              <input
                value={balance}
                onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
              />
            </label>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center justify-center gap-2 rounded-lg bg-cash-green px-4 py-2 text-sm font-semibold text-cash-green-foreground active:scale-[0.99] disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Generate
            </button>
          </div>

          {newKey ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-cash-green/40 bg-cash-green/10 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">New key (share this once)</p>
                <p className="font-mono text-lg font-bold tracking-widest text-foreground">{newKey}</p>
              </div>
              <button
                type="button"
                onClick={() => copy(newKey)}
                className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background"
              >
                <Copy className="h-4 w-4" aria-hidden="true" /> {copied === newKey ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}
        </section>

        {/* Keys list */}
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">All keys</h2>
          {isLoading && !keys ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </div>
          ) : keys && keys.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {keys.map((k) => {
                const online = isOnline(k.lastSeenAt) && k.status === "active"
                return (
                  <li key={k.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold tracking-wide text-foreground">{k.key}</span>
                          <button
                            type="button"
                            onClick={() => copy(k.key)}
                            aria-label="Copy key"
                            className="text-muted-foreground active:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{k.label || "No label"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            k.status === "revoked"
                              ? "bg-destructive/10 text-destructive"
                              : online
                                ? "bg-cash-green/15 text-cash-green"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              k.status === "revoked" ? "bg-destructive" : online ? "bg-cash-green" : "bg-muted-foreground/50"
                            }`}
                          />
                          {k.status === "revoked" ? "Revoked" : online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs text-muted-foreground">Holder</dt>
                        <dd className="font-medium text-foreground">{k.holderUsername ? `$${k.holderUsername}` : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Balance shown</dt>
                        <dd className="font-medium text-foreground">{money(k.balance)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">On screen</dt>
                        <dd className="font-medium text-foreground">{k.currentScreen ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Last seen</dt>
                        <dd className="font-medium text-foreground">{relativeTime(k.lastSeenAt)}</dd>
                      </div>
                    </dl>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Device:{" "}
                      {k.hwid ? (
                        <span className="font-mono">{k.hwid.slice(0, 8)}… (locked)</span>
                      ) : (
                        <span>not yet activated</span>
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/watch/${encodeURIComponent(k.key)}`}
                        className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Watch session
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          await resetHwid(k.id)
                          mutate()
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground active:bg-muted"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset device
                      </button>
                      {k.status === "revoked" ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await setKeyStatus(k.id, "active")
                            mutate()
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-cash-green active:bg-muted"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await setKeyStatus(k.id, "revoked")
                            mutate()
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive active:bg-muted"
                        >
                          <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Revoke
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteKey(k.id)
                          mutate()
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground active:bg-muted"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No keys yet. Generate one above.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
