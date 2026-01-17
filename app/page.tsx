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
  const admin = await hasPermission("admin_ui:access")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
        <header className="space-y-4">
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-[0.32em]"
          >
            Auth0 Profile Management
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">
              Identity operations console
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Manage Auth0 user profiles, metadata, and account access policies
              from a unified dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {session ? (
              <>
                <Button asChild size="sm">
                  <Link href="/profile">Go to my profile</Link>
                </Button>
                {admin ? (
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
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
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
            <CardFooter>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/users">Open admin console</Link>
              </Button>
              {!admin ? (
                <Badge variant="secondary" className="ml-auto">
                  Admins only
                </Badge>
              ) : null}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
