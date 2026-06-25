import { isAdmin } from "@/app/actions/admin"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const authed = await isAdmin()
  if (!authed) return <AdminLogin />
  return <AdminDashboard />
}
