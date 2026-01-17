import { redirect } from "next/navigation"

import { UsersTable } from "@/components/admin/users-table"
import { auth0 } from "@/lib/auth0"
import { listUsers } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

export default async function AdminUsersPage() {
  const session = await auth0.getSession()
  if (!session) {
    redirect("/auth/login?returnTo=/admin/users")
  }

  const permissions = await getAccessTokenPermissions()
  const admin = permissions.includes("admin_ui:access")
  if (!admin) {
    redirect("/profile")
  }

  const canRead = permissions.includes("profile:read")
  if (!canRead) {
    redirect("/profile")
  }

  const users = await listUsers()

  return <UsersTable users={users} />
}
