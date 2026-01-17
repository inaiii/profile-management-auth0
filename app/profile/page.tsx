import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProfileForm } from "@/components/profile/profile-form"
import { auth0 } from "@/lib/auth0"
import { getUser } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

function initialsFrom(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

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

  const admin = permissions.includes("admin_ui:access")
  const user = await getUser(session.user.sub)

  return (
    <AppShell
      session={session}
      isAdmin={admin}
      title="My profile"
      subtitle="Manage your Auth0 identity data and shared metadata."
    >
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ProfileForm user={user} />
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Current identity</CardTitle>
            <CardDescription>Auth0 account summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <Avatar>
                {user.picture ? (
                  <AvatarImage src={user.picture} alt={user.name ?? ""} />
                ) : null}
                <AvatarFallback>
                  {initialsFrom(user.name ?? user.email ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">
                  {user.name ?? "Unnamed"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.email ?? user.user_id}
                </div>
              </div>
            </div>
            <div className="grid gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-medium">{user.user_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last login</span>
                <span className="font-medium">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleString()
                    : "No activity"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Logins</span>
                <span className="font-medium">{user.logins_count ?? 0}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={user.blocked ? "destructive" : "secondary"}>
                {user.blocked ? "Blocked" : "Active"}
              </Badge>
              <Badge variant="outline">
                {user.user_metadata?.locale ?? "Locale: default"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
