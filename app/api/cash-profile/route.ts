import { NextResponse } from "next/server"

// Looks up a REAL Cash App profile by cashtag. Cash App's public profile page
// (https://cash.app/$cashtag) embeds a `var profile = {...}` JSON blob that
// contains the display name, avatar photo, initial, and accent color. We fetch
// that page server-side (browser-like headers are required or Cash App returns
// a generic 404) and parse the blob out.

export const runtime = "nodejs"

type CashProfileResult = {
  found: boolean
  cashtag: string // e.g. "$Sarah"
  displayName: string | null
  avatarUrl: string | null
  initial: string | null
  accentColor: string | null
  isVerified: boolean
}

const BROWSER_HEADERS: Record<string, string> = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

function extractProfileJson(html: string): Record<string, unknown> | null {
  // The page contains: var profile = {...};
  const marker = "var profile = "
  const start = html.indexOf(marker)
  if (start === -1) return null

  let i = start + marker.length
  if (html[i] !== "{") return null

  // Walk forward to find the matching closing brace (handles nested objects
  // and braces inside strings).
  let depth = 0
  let inString = false
  let escaped = false
  for (; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) {
        const jsonStr = html.slice(start + marker.length, i + 1)
        try {
          return JSON.parse(jsonStr)
        } catch {
          return null
        }
      }
    }
  }
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = (searchParams.get("tag") ?? "").trim()
  const clean = raw.replace(/^\$/, "").trim()

  const empty: CashProfileResult = {
    found: false,
    cashtag: clean ? `$${clean}` : "",
    displayName: null,
    avatarUrl: null,
    initial: clean ? clean.charAt(0).toUpperCase() : null,
    accentColor: null,
    isVerified: false,
  }

  // Cash App cashtags must be 1-20 chars, letters/numbers/_/-. Bail early on junk.
  if (!clean || !/^[a-zA-Z0-9_-]{1,20}$/.test(clean)) {
    return NextResponse.json(empty)
  }

  try {
    const res = await fetch(`https://cash.app/$${encodeURIComponent(clean)}`, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      // Avoid hanging forever on a slow upstream.
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json(empty)
    }

    const html = await res.text()
    const profile = extractProfileJson(html)
    if (!profile) {
      return NextResponse.json(empty)
    }

    const avatar = (profile.avatar ?? {}) as Record<string, unknown>
    const formattedCashtag =
      typeof profile.formatted_cashtag === "string" ? profile.formatted_cashtag : `$${clean}`

    const result: CashProfileResult = {
      found: true,
      cashtag: formattedCashtag,
      displayName: typeof profile.display_name === "string" ? profile.display_name : null,
      avatarUrl: typeof avatar.image_url === "string" ? avatar.image_url : null,
      initial:
        typeof avatar.initial === "string" && avatar.initial
          ? avatar.initial
          : clean.charAt(0).toUpperCase(),
      accentColor: typeof avatar.accent_color === "string" ? avatar.accent_color : null,
      isVerified: profile.is_verified_account === true,
    }

    return NextResponse.json(result, {
      headers: { "cache-control": "public, max-age=600, s-maxage=600" },
    })
  } catch {
    return NextResponse.json(empty)
  }
}
