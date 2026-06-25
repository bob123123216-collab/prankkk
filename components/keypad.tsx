"use client"

import { Delete } from "lucide-react"
import { cn } from "@/lib/utils"

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const

export function Keypad({
  onPress,
  tone = "default",
}: {
  onPress: (key: string) => void
  tone?: "default" | "onGreen"
}) {
  const onGreen = tone === "onGreen"
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-1">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPress(k)}
          aria-label={k === "back" ? "Delete" : k}
          className={cn(
            "flex h-16 items-center justify-center rounded-2xl text-3xl font-medium transition-colors",
            onGreen
              ? "text-cash-ink active:bg-black/10"
              : "text-foreground active:bg-muted",
          )}
        >
          {k === "back" ? <Delete className="h-7 w-7" aria-hidden="true" /> : k}
        </button>
      ))}
    </div>
  )
}
