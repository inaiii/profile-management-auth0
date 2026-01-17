import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth0 } from "@/lib/auth0"
import { hasPermission } from "@/lib/auth0-permissions"

export default async function Page() {
  const session = await auth0.getSession()
  const isAdmin = session ? await hasPermission("admin_ui:access") : false
  const displayName = session?.user?.name ?? session?.user?.nickname ?? "Guest"
  const statusLabel = session ? "Signed in" : "Signed out"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Console overview</CardTitle>
          <CardDescription>
            Identity operations workspace for Auth0 profile governance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={session ? "secondary" : "outline"}>
              {statusLabel}
            </Badge>
            <Badge variant={isAdmin ? "secondary" : "outline"}>
              {isAdmin ? "Admin access" : "Standard access"}
            </Badge>
          </div>
          <p>
            Welcome, {displayName}. Track profile updates, metadata changes, and
            access requests from a single view.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {session ? (
            <>
              <Button asChild size="sm">
                <Link href="/profile">Go to my profile</Link>
              </Button>
              {isAdmin ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/users">Open user management</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/logout">Sign out</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">Sign in with Auth0</Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>My profile</CardTitle>
            <CardDescription>
              View and update your personal profile data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <p>Update profile fields stored in Auth0.</p>
            <p>Maintain locale, department, and time zone metadata.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">Open profile editor</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>User management</CardTitle>
            <CardDescription>
              Admin view to manage all users in the tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <p>Search, review, and update user records.</p>
            <p>Control access by blocking or unblocking accounts.</p>
          </CardContent>
          <CardFooter className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/users">Open admin console</Link>
            </Button>
            {!isAdmin ? (
              <Badge variant="secondary" className="ml-auto">
                Admins only
              </Badge>
            ) : null}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Security review</CardTitle>
            <CardDescription>
              Audit recent profile updates and account events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <p>Monitor suspicious access patterns and changes.</p>
            <p>Export activity snapshots for compliance review.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/users">Review activity</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
