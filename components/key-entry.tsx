"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, KeyRound, Shield } from "lucide-react"

export function KeyEntry({
  onSubmit,
  error,
}: {
  onSubmit: (key: string) => Promise<void>
  error: string | null
}) {
  const [key, setKey] = useState("")
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim() || loading) return
    setLoading(true)
    await onSubmit(key.trim())
    setLoading(false)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-cash-green px-6 text-cash-green-foreground">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cash-green-foreground/15">
          <KeyRound className="h-8 w-8" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enter your access key</h1>
          <p className="mt-1 text-sm text-cash-green-foreground/80 text-pretty">
            This app is locked. Enter the key you were given to activate it on this device.
          </p>
        </div>
      </div>

      <form onSubmit={handle} className="flex w-full max-w-xs flex-col gap-3">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          autoComplete="off"
          aria-label="Access key"
          className="w-full rounded-xl bg-cash-green-foreground px-4 py-3 text-center font-mono text-lg tracking-widest text-foreground outline-none placeholder:text-foreground/40"
        />
        {error ? (
          <p role="alert" className="rounded-lg bg-cash-green-foreground/15 px-3 py-2 text-center text-sm">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !key.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-base font-semibold text-background transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
          {loading ? "Checking..." : "Unlock"}
        </button>
      </form>

      <a
        href="/admin"
        className="flex items-center gap-1.5 text-sm font-medium text-cash-green-foreground/70 underline-offset-4 transition hover:text-cash-green-foreground hover:underline"
      >
        <Shield className="h-4 w-4" aria-hidden="true" />
        Admin login
      </a>
    </div>
  )
}
