"use client"

import { useCallback, useEffect, useState } from "react"

export type Transaction = {
  id: string
  username: string
  amount: number
  type: "sent" | "received"
  date: number
}

export type CashProfile = {
  username: string
  balance: number
  avatar: string | null // data URL or null
}

const STORAGE_KEY = "cashclone.profile.v1"
const TX_KEY = "cashclone.transactions.v1"

const DEFAULT_PROFILE: CashProfile = {
  username: "yourname",
  balance: 1842.5,
  avatar: null,
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function loadArray<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function useCashStore() {
  const [profile, setProfile] = useState<CashProfile>(DEFAULT_PROFILE)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProfile(load<CashProfile>(STORAGE_KEY, DEFAULT_PROFILE))
    setTransactions(loadArray<Transaction>(TX_KEY))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile, hydrated])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(TX_KEY, JSON.stringify(transactions))
  }, [transactions, hydrated])

  const updateProfile = useCallback((patch: Partial<CashProfile>) => {
    setProfile((p) => ({ ...p, ...patch }))
  }, [])

  const sendMoney = useCallback((username: string, amount: number) => {
    setProfile((p) => ({ ...p, balance: Math.round((p.balance - amount) * 100) / 100 }))
    setTransactions((tx) => [
      {
        id: crypto.randomUUID(),
        username: username.replace(/^\$/, ""),
        amount,
        type: "sent",
        date: Date.now(),
      },
      ...tx,
    ])
  }, [])

  return { profile, transactions, hydrated, updateProfile, sendMoney }
}
