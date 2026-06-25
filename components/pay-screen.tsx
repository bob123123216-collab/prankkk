"use client"

import { useState } from "react"
import { ArrowLeft, BadgeCheck, Loader2, Search } from "lucide-react"
import { useCashProfileLookup, type LookedUpProfile } from "@/hooks/use-cash-profile-lookup"

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

function ProfileAvatar({
  profile,
  fallbackInitial,
  className = "h-11 w-11 text-base",
}: {
  profile: LookedUpProfile | null
  fallbackInitial: string
  className?: string
}) {
  const initial = (profile?.initial || fallbackInitial || "?").toUpperCase()
  const accent = profile?.accentColor || undefined

  if (profile?.avatarUrl) {
    return (
      <div className={`overflow-hidden rounded-full ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl || "/placeholder.svg"}
          alt=""
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-black/80 ${className}`}
      style={{ backgroundColor: accent ?? "#00C244" }}
    >
      {initial}
    </div>
  )
}

export function PayScreen({
  amount,
  balance,
  onBack,
  onConfirm,
}: {
  amount: number
  balance: number
  onBack: () => void
  onConfirm: (username: string, note: string) => void
}) {
  const [query, setQuery] = useState("")
  const [recipient, setRecipient] = useState<{ username: string; profile: LookedUpProfile | null } | null>(null)
  const [note, setNote] = useState("")

  const cleaned = query.trim().replace(/^\$/, "")
  const insufficient = amount > balance
  const { profile, loading } = useCashProfileLookup(query)

  if (recipient) {
    const rp = recipient.profile
    const displayName = rp?.displayName || `$${recipient.username}`
    const cashtag = rp?.cashtag || `$${recipient.username}`
    return (
      <div className="flex h-full flex-col px-5 pb-6 pt-4">
        <header className="flex items-center">
          <button
            type="button"
            onClick={() => setRecipient(null)}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-muted"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ProfileAvatar profile={rp} fallbackInitial={recipient.username.charAt(0)} className="h-20 w-20 text-2xl" />
          <p className="mt-4 flex items-center gap-1 text-xl font-semibold text-foreground">
            {displayName}
            {rp?.isVerified && <BadgeCheck className="h-5 w-5 text-cash-green" aria-label="Verified" />}
          </p>
          <p className="text-sm text-muted-foreground">{cashtag}</p>
          <p className="mt-6 text-6xl font-semibold tabular-nums text-foreground">{formatMoney(amount)}</p>
          {insufficient && (
            <p className="mt-4 text-sm font-medium text-destructive">Not enough balance for this payment</p>
          )}
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For pizza 🍕"
          className="mb-4 w-full rounded-2xl bg-muted px-4 py-3 text-center text-base text-foreground outline-none placeholder:text-muted-foreground"
        />

        <button
          type="button"
          disabled={insufficient}
          onClick={() => onConfirm(recipient.username, note)}
          className="h-14 rounded-full bg-cash-green text-lg font-semibold text-cash-green-foreground transition-opacity disabled:opacity-40"
        >
          Pay {formatMoney(amount)}
        </button>
      </div>
    )
  }

  const showRow = cleaned.length > 0
  const matched = profile?.found ? profile : null

  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-muted"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <p className="text-lg font-semibold text-foreground">To</p>
      </header>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="$Cashtag, name, or phone"
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 flex-1 overflow-y-auto">
        {showRow && (
          <>
            {loading && (
              <div className="flex items-center gap-3 px-2 py-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span className="text-sm">Searching Cash App…</span>
              </div>
            )}

            {!loading && (
              <button
                type="button"
                onClick={() => setRecipient({ username: cleaned, profile: matched })}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left active:bg-muted"
              >
                <ProfileAvatar profile={matched} fallbackInitial={cleaned.charAt(0)} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-semibold text-foreground">
                    <span className="truncate">{matched?.displayName || `$${cleaned}`}</span>
                    {matched?.isVerified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-cash-green" aria-label="Verified" />
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {matched
                      ? `${matched.cashtag} · Send ${formatMoney(amount)}`
                      : `No Cash App account found · Send ${formatMoney(amount)}`}
                  </p>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
