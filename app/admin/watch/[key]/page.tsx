import { redirect } from "next/navigation"
import { isAdmin } from "@/app/actions/admin"
import { SessionWatcher } from "@/components/admin/session-watcher"

export const dynamic = "force-dynamic"

export default async function WatchPage({ params }: { params: Promise<{ key: string }> }) {
  if (!(await isAdmin())) redirect("/admin")
  const { key } = await params
  return <SessionWatcher keyValue={decodeURIComponent(key)} />
}
