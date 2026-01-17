import { redirect } from "next/navigation"

import { ProfileContent } from "@/components/profile/profile-content"
import { auth0 } from "@/lib/auth0"
import { getUser } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

export default async function ProfilePage() {
  const session = await auth0.getSession()
  if (!session) {
    redirect("/auth/login?returnTo=/profile")
  }

  const permissions = await getAccessTokenPermissions()
  const canReadProfile =
    permissions.includes("profile:read") ||
    permissions.includes("profile:read_self")
  if (!canReadProfile) {
    redirect("/")
  }

  const user = await getUser(session.user.sub)

  return <ProfileContent user={user} />
}
