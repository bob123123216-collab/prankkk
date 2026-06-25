import type React from "react"

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-0 sm:p-6">
      <div className="relative h-screen w-full max-w-md overflow-hidden bg-background sm:h-[860px] sm:rounded-[2.5rem] sm:border-8 sm:border-foreground/90 sm:shadow-2xl">
        {children}
      </div>
    </main>
  )
}
