"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { HomeScreen } from "./home-screen"
import { PayScreen } from "./pay-screen"
import { SuccessScreen } from "./success-screen"
import { SettingsScreen } from "./settings-screen"
import { ActivityScreen } from "./activity-screen"
import type { CashProfile, Transaction } from "@/hooks/use-cash-store"
import {
  heartbeat,
  recordPayment,
  syncProfile,
  type SessionProfile,
  type SessionTransaction,
} from "@/app/actions/session"

type View = "home" | "pay" | "success" | "settings" | "activity"

export function CashApp({
  keyValue,
  hwid,
  initialProfile,
  initialTransactions,
  onInvalidated,
}: {
  keyValue: string
  hwid: string
  initialProfile: SessionProfile
  initialTransactions: SessionTransaction[]
  onInvalidated: () => void
}) {
  const [profile, setProfile] = useState<CashProfile>({
    username: initialProfile.username,
    balance: initialProfile.balance,
    avatar: initialProfile.avatar,
  })
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions.map((t) => ({
      id: t.id,
      username: t.username,
      amount: t.amount,
      type: "sent",
      date: t.date,
    })),
  )
  const [view, setView] = useState<View>("home")
  const [amount, setAmount] = useState("")
  const [lastPaid, setLastPaid] = useState<{ amount: number; username: string }>({ amount: 0, username: "" })

  const invalidated = useRef(false)
  const guard = useCallback(
    (ok: boolean) => {
      if (!ok && !invalidated.current) {
        invalidated.current = true
        onInvalidated()
      }
    },
    [onInvalidated],
  )

  // Report the current screen to the server (this is what powers live session
  // watching) and keep the key's "last seen" fresh on a heartbeat.
  useEffect(() => {
    let active = true
    heartbeat(keyValue, hwid, view).then((r) => active && guard(r.ok))
    const interval = setInterval(() => {
      heartbeat(keyValue, hwid, view).then((r) => active && guard(r.ok))
    }, 15000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [view, keyValue, hwid, guard])

  const handleKey = (key: string) => {
    setAmount((prev) => {
      if (key === "back") return prev.slice(0, -1)
      if (key === ".") {
        if (prev.includes(".")) return prev
        return prev === "" ? "0." : prev + "."
      }
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev
      if (prev === "0") return key
      return prev + key
    })
  }

  const handleConfirm = async (username: string, note: string) => {
    const value = Number(amount)
    const cleanUser = username.replace(/^\$/, "")
    // Optimistic update for snappy UX; server is the source of truth.
    setProfile((p) => ({ ...p, balance: Math.round((p.balance - value) * 100) / 100 }))
    setTransactions((tx) => [
      { id: crypto.randomUUID(), username: cleanUser, amount: value, type: "sent", date: Date.now() },
      ...tx,
    ])
    setLastPaid({ amount: value, username: cleanUser })
    setView("success")

    const res = await recordPayment(keyValue, hwid, { username: cleanUser, amount: value, note })
    if (!res.ok) {
      guard(false)
      return
    }
    setProfile((p) => ({ ...p, balance: res.balance }))
  }

  const handleSaveProfile = async (patch: Partial<CashProfile>) => {
    setProfile((p) => ({ ...p, ...patch }))
    const res = await syncProfile(keyValue, hwid, patch)
    guard(res.ok)
  }

  const resetToHome = () => {
    setAmount("")
    setView("home")
  }

  return (
    <div className="h-full">
      {view === "home" ? (
        <HomeScreen
          profile={profile}
          amount={amount}
          onKey={handleKey}
          onPay={() => setView("pay")}
          onRequest={() => setView("pay")}
          onOpenSettings={() => setView("settings")}
          onOpenActivity={() => setView("activity")}
        />
      ) : view === "pay" ? (
        <PayScreen amount={Number(amount)} balance={profile.balance} onBack={() => setView("home")} onConfirm={handleConfirm} />
      ) : view === "success" ? (
        <SuccessScreen amount={lastPaid.amount} username={lastPaid.username} onDone={resetToHome} />
      ) : view === "settings" ? (
        <SettingsScreen profile={profile} onBack={() => setView("home")} onSave={handleSaveProfile} />
      ) : (
        <ActivityScreen transactions={transactions} onBack={() => setView("home")} />
      )}
    </div>
  )
}
