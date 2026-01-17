import { redirect } from "next/navigation"

import { ProfileContent } from "@/components/profile/profile-content"
import { auth0 } from "@/lib/auth0"
import { getUser } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  if (!rawId || rawId === "undefined") {
    redirect("/admin/users")
  }

  let userId = rawId
  try {
    userId = decodeURIComponent(rawId)
  } catch {
    userId = rawId
  }

  const session = await auth0.getSession()
  if (!session) {
    const encodedId = encodeURIComponent(userId)
    redirect(`/auth/login?returnTo=/admin/users/${encodedId}/profile`)
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

  const user = await getUser(userId)

  return <ProfileContent user={user} />
}
