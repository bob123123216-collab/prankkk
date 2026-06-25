"use client"

import useSWR from "swr"
import Link from "next/link"
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  LogIn,
  Navigation,
  Settings as SettingsIcon,
  Smartphone,
  UserCog,
} from "lucide-react"
import { getKeyDetail, type ActivityEntry, type AdminKey } from "@/app/actions/admin"

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 30000
}

function relativeTime(iso: string) {
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

const screenLabel: Record<string, string> = {
  home: "Home",
  pay: "Payment",
  success: "Payment Sent",
  settings: "Settings",
  activity: "Activity",
}

function eventVisual(event: string) {
  switch (event) {
    case "payment":
      return { icon: CreditCard, tone: "text-cash-green" }
    case "navigate":
      return { icon: Navigation, tone: "text-foreground" }
    case "profile_update":
      return { icon: UserCog, tone: "text-foreground" }
    case "redeem":
      return { icon: LogIn, tone: "text-cash-green" }
    default:
      return { icon: Navigation, tone: "text-muted-foreground" }
  }
}

function describe(entry: ActivityEntry): string {
  if (entry.event === "payment") {
    try {
      const p = JSON.parse(entry.detail ?? "{}") as { username?: string; amount?: number; note?: string }
      const base = `Sent ${money(p.amount ?? 0)} to $${p.username ?? "someone"}`
      return p.note ? `${base} — "${p.note}"` : base
    } catch {
      return "Sent a payment"
    }
  }
  return entry.detail ?? entry.event
}

export function SessionWatcher({ keyValue }: { keyValue: string }) {
  const { data, isLoading } = useSWR(
    ["watch", keyValue],
    () => getKeyDetail(keyValue),
    { refreshInterval: 2000 },
  )

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
    )
  }

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-muted-foreground">This key no longer exists.</p>
        <Link href="/admin" className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
          Back to dashboard
        </Link>
      </main>
    )
  }

  const key: AdminKey = data.key
  const activity = data.activity
  const online = isOnline(key.lastSeenAt) && key.status === "active"
  const currentScreen = key.currentScreen ? (screenLabel[key.currentScreen] ?? key.currentScreen) : "—"

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <Link
          href="/admin"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground active:bg-muted"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold leading-tight text-foreground">
            Watching <span className="font-mono">{key.key}</span>
          </h1>
          <p className="text-xs text-muted-foreground">{key.label || "No label"}</p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            key.status === "revoked"
              ? "bg-destructive/10 text-destructive"
              : online
                ? "bg-cash-green/15 text-cash-green"
                : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              key.status === "revoked"
                ? "bg-destructive"
                : online
                  ? "animate-pulse bg-cash-green"
                  : "bg-muted-foreground/50"
            }`}
          />
          {key.status === "revoked" ? "Revoked" : online ? "Live" : "Offline"}
        </span>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        {/* Live snapshot */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" /> On screen
            </div>
            <p className="mt-1 text-lg font-bold text-card-foreground">{currentScreen}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Balance shown</p>
            <p className="mt-1 text-lg font-bold text-card-foreground">{money(key.balance)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Holder</p>
            <p className="mt-1 text-lg font-bold text-card-foreground">
              {key.holderUsername ? `$${key.holderUsername}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Last seen</p>
            <p className="mt-1 text-lg font-bold text-card-foreground">
              {key.lastSeenAt ? relativeTime(key.lastSeenAt) : "never"}
            </p>
          </div>
        </section>

        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Locked device (HWID)</p>
          <p className="mt-1 font-mono text-sm text-card-foreground">
            {key.hwid ? key.hwid : "Not activated on any device yet"}
          </p>
        </div>

        {/* Live activity feed */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Live activity</h2>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> updating
            </span>
          </div>

          {activity.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {activity.map((entry) => {
                const { icon: Icon, tone } = eventVisual(entry.event)
                return (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className={`mt-0.5 ${tone}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-card-foreground">{describe(entry)}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(entry.createdAt)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No activity yet. Actions will appear here in real time as the user moves around the app.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
