"use client"

import { useEffect } from "react"
import { Check } from "lucide-react"

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

export function SuccessScreen({
  amount,
  username,
  onDone,
}: {
  amount: number
  username: string
  onDone: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <button
      type="button"
      onClick={onDone}
      className="flex h-full w-full flex-col items-center justify-center bg-cash-green px-6 text-center text-cash-green-foreground"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cash-green-foreground/20">
        <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
      </div>
      <p className="mt-6 text-4xl font-semibold tabular-nums">{formatMoney(amount)}</p>
      <p className="mt-2 text-lg opacity-90">Paid to ${username}</p>
      <p className="mt-10 text-sm opacity-70">Tap to continue</p>
    </button>
  )
}
