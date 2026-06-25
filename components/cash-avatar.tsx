import { cn } from "@/lib/utils"

export function CashAvatar({
  avatar,
  username,
  className,
}: {
  avatar: string | null
  username: string
  className?: string
}) {
  const initial = (username || "?").charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full bg-cash-green text-cash-green-foreground font-semibold select-none",
        className,
      )}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar || "/placeholder.svg"} alt={`${username} avatar`} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
