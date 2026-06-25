"use client"

import { useEffect, useState } from "react"

export type LookedUpProfile = {
  found: boolean
  cashtag: string
  displayName: string | null
  avatarUrl: string | null
  initial: string | null
  accentColor: string | null
  isVerified: boolean
}

/**
 * Debounced lookup of a REAL Cash App profile by cashtag. As the user types a
 * $cashtag we hit our /api/cash-profile route, which scrapes the live Cash App
 * profile page and returns the real photo, display name, and accent color.
 */
export function useCashProfileLookup(query: string) {
  const clean = query.trim().replace(/^\$/, "")
  const [profile, setProfile] = useState<LookedUpProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clean) {
      setProfile(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cash-profile?tag=${encodeURIComponent(clean)}`)
        const data = (await res.json()) as LookedUpProfile
        if (active) setProfile(data)
      } catch {
        if (active) setProfile(null)
      } finally {
        if (active) setLoading(false)
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [clean])

  return { profile, loading }
}
