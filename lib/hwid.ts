"use client"

// A persistent per-device identifier. Once generated it is stored in
// localStorage so the same browser/device always reports the same HWID,
// which is what lets a key lock to a single device.
const HWID_KEY = "cashclone.hwid.v1"
const SAVED_KEY = "cashclone.key.v1"

export function getHwid(): string {
  if (typeof window === "undefined") return ""
  let id = window.localStorage.getItem(HWID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(HWID_KEY, id)
  }
  return id
}

export function getSavedKey(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(SAVED_KEY) || ""
}

export function setSavedKey(key: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SAVED_KEY, key)
}

export function clearSavedKey() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(SAVED_KEY)
}
