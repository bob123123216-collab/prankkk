"use client"

import { useRef, useState } from "react"
import { ArrowLeft, Camera, Check } from "lucide-react"
import { CashAvatar } from "./cash-avatar"
import type { CashProfile } from "@/hooks/use-cash-store"

export function SettingsScreen({
  profile,
  onBack,
  onSave,
}: {
  profile: CashProfile
  onBack: () => void
  onSave: (patch: Partial<CashProfile>) => void
}) {
  const [username, setUsername] = useState(profile.username)
  const [balance, setBalance] = useState(String(profile.balance))
  const [avatar, setAvatar] = useState<string | null>(profile.avatar)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const parsed = Number.parseFloat(balance)
    onSave({
      username: username.trim().replace(/^\$/, "") || "yourname",
      balance: Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : profile.balance,
      avatar,
    })
    setSaved(true)
    setTimeout(onBack, 600)
  }

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
        <h1 className="text-lg font-semibold text-foreground">Profile & Settings</h1>
      </header>

      <div className="mt-6 flex flex-col items-center">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative" aria-label="Change photo">
          <CashAvatar avatar={avatar} username={username} className="h-24 w-24 text-3xl" />
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <Camera className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <p className="mt-3 text-sm text-muted-foreground">Tap photo to change</p>
      </div>

      <div className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">$Cashtag</span>
          <div className="flex items-center rounded-2xl bg-muted px-4 py-3">
            <span className="text-lg font-semibold text-cash-green">$</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="ml-1 w-full bg-transparent text-lg font-semibold text-foreground outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Balance shown</span>
          <div className="flex items-center rounded-2xl bg-muted px-4 py-3">
            <span className="text-lg font-semibold text-foreground">$</span>
            <input
              value={balance}
              onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="ml-1 w-full bg-transparent text-lg font-semibold text-foreground outline-none"
            />
          </div>
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="mt-auto flex h-14 items-center justify-center gap-2 rounded-full bg-cash-green text-lg font-semibold text-cash-green-foreground"
      >
        {saved ? (
          <>
            <Check className="h-5 w-5" aria-hidden="true" /> Saved
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  )
}
