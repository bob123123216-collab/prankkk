"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { validateAndLoad, type SessionProfile, type SessionTransaction } from "@/app/actions/session"
import { getHwid, getSavedKey, setSavedKey, clearSavedKey } from "@/lib/hwid"
import { KeyEntry } from "./key-entry"
import { CashApp } from "./cash-app"
import { PhoneFrame } from "./phone-frame"

type Loaded = {
  key: string
  hwid: string
  profile: SessionProfile
  transactions: SessionTransaction[]
}

function reasonText(reason: "invalid" | "revoked" | "hwid") {
  switch (reason) {
    case "invalid":
      return "That key isn't valid. Double-check it and try again."
    case "revoked":
      return "This key has been deactivated."
    case "hwid":
      return "This key is already locked to another device."
  }
}

export function KeyGate() {
  const [status, setStatus] = useState<"loading" | "locked" | "ready">("loading")
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  const attempt = async (key: string) => {
    const hwid = getHwid()
    const res = await validateAndLoad(key, hwid)
    if (res.ok) {
      setSavedKey(key)
      setLoaded({ key, hwid, profile: res.profile, transactions: res.transactions })
      setError(null)
      setStatus("ready")
    } else {
      clearSavedKey()
      setError(reasonText(res.reason))
      setStatus("locked")
    }
  }

  useEffect(() => {
    // Imperative auth bootstrap: re-validate any saved key against the server
    // (this also re-checks the HWID lock and revocation status on every load).
    const saved = getSavedKey()
    if (!saved) {
      setStatus("locked")
      return
    }
    let active = true
    ;(async () => {
      const hwid = getHwid()
      const res = await validateAndLoad(saved, hwid)
      if (!active) return
      if (res.ok) {
        setLoaded({ key: saved, hwid, profile: res.profile, transactions: res.transactions })
        setStatus("ready")
      } else {
        clearSavedKey()
        setError(reasonText(res.reason))
        setStatus("locked")
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleInvalidated = () => {
    clearSavedKey()
    setLoaded(null)
    setError("Your access to this key has ended.")
    setStatus("locked")
  }

  return (
    <PhoneFrame>
      {status === "loading" ? (
        <div className="flex h-full items-center justify-center bg-cash-green text-cash-green-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </div>
      ) : status === "locked" || !loaded ? (
        <KeyEntry onSubmit={attempt} error={error} />
      ) : (
        <CashApp
          keyValue={loaded.key}
          hwid={loaded.hwid}
          initialProfile={loaded.profile}
          initialTransactions={loaded.transactions}
          onInvalidated={handleInvalidated}
        />
      )}
    </PhoneFrame>
  )
}
