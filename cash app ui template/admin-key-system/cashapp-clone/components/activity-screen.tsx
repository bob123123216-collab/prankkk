"use client"

import { ArrowLeft, ArrowUpRight } from "lucide-react"
import type { Transaction } from "@/hooks/use-cash-store"

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export function ActivityScreen({
  transactions,
  onBack,
}: {
  transactions: Transaction[]
  onBack: () => void
}) {
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
        <h1 className="text-lg font-semibold text-foreground">Activity</h1>
      </header>

      <div className="mt-4 flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="mt-20 text-center text-muted-foreground">No payments yet</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 rounded-2xl px-2 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground">
                  <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">${tx.username}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
                <p className="font-semibold tabular-nums text-foreground">-{formatMoney(tx.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
