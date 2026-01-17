import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ServerSession } from "@/lib/auth0-session"

type AppShellProps = {
  session: ServerSession
  isAdmin: boolean
  title: string
  subtitle?: string
  children: React.ReactNode
}

function initialsFrom(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AppShell({
  session,
  isAdmin,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const user = session?.user
  const displayName = user?.name ?? user?.email ?? "User"
  const displayEmail = user?.email ?? ""

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Auth0 Console
              </div>
              <div className="text-2xl font-semibold">{title}</div>
              {subtitle ? (
                <div className="text-sm text-muted-foreground">{subtitle}</div>
              ) : null}
            </div>
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-none border border-border bg-background px-3 py-2">
                <Avatar size="sm">
                  {user?.picture ? (
                    <AvatarImage src={user.picture} alt={displayName} />
                  ) : null}
                  <AvatarFallback>{initialsFrom(displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">
                    {displayName}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {displayEmail}
                  </div>
                </div>
              {isAdmin ? <Badge variant="secondary">Admin</Badge> : null}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/logout">Sign out</Link>
            </Button>
          </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">My profile</Link>
            </Button>
            {isAdmin ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/users">User management</Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Overview</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  )
}
