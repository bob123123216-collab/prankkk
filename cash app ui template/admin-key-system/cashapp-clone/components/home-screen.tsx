"use client"

import { Clock, QrCode, Search } from "lucide-react"
import { CashAvatar } from "./cash-avatar"
import { Keypad } from "./keypad"
import type { CashProfile } from "@/hooks/use-cash-store"

export function HomeScreen({
  profile,
  amount,
  onKey,
  onPay,
  onRequest,
  onOpenSettings,
  onOpenActivity,
}: {
  profile: CashProfile
  amount: string
  onKey: (key: string) => void
  onPay: () => void
  onRequest: () => void
  onOpenSettings: () => void
  onOpenActivity: () => void
}) {
  const display = amount === "" ? "0" : amount

  return (
    <div className="flex h-full flex-col bg-cash-green px-5 pb-3 pt-4 text-cash-ink">
      <header className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Scan QR code"
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-black/10"
        >
          <QrCode className="h-7 w-7" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPay}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-black/10"
          >
            <Search className="h-6 w-6" aria-hidden="true" />
          </button>
          <button type="button" onClick={onOpenSettings} aria-label="Open profile settings">
            <CashAvatar avatar={profile.avatar} username={profile.username} className="h-10 w-10 text-base" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-8xl font-bold tabular-nums tracking-tight">${display}</span>
      </div>

      <Keypad onPress={onKey} tone="onGreen" />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRequest}
          className="h-14 rounded-full bg-black/10 text-lg font-semibold text-cash-ink active:bg-black/15"
        >
          Pool
        </button>
        <button
          type="button"
          onClick={onRequest}
          className="h-14 rounded-full bg-black/10 text-lg font-semibold text-cash-ink active:bg-black/15"
        >
          Request
        </button>
      </div>

      <button
        type="button"
        onClick={onPay}
        className="mt-3 h-14 rounded-full bg-foreground text-lg font-semibold text-background active:opacity-90"
      >
        Pay
      </button>

      <nav className="mt-2 flex items-center justify-between px-6 pt-2" aria-label="Primary">
        <button type="button" className="text-xl font-bold text-cash-ink-muted" aria-label="Money">
          $5
        </button>
        <button type="button" className="text-2xl font-bold text-cash-ink" aria-label="Payments">
          $
        </button>
        <button
          type="button"
          onClick={onOpenActivity}
          aria-label="Activity, 5 new"
          className="relative text-cash-ink-muted"
        >
          <Clock className="h-7 w-7" aria-hidden="true" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-cash-green-foreground">
            5
          </span>
        </button>
      </nav>
    </div>
  )
}
