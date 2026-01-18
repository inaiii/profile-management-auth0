import Link from "next/link"

import { Button } from "@/components/ui/button"
import { auth0 } from "@/lib/auth0"

export default async function Page() {
  const session = await auth0.getSession()
  const displayName = session?.user?.name ?? session?.user?.nickname ?? "Guest"

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {session ? (
          <>
            <h1 className="text-xl font-semibold">Welcome, {displayName}</h1>
            <p className="text-muted-foreground">Track profile updates, metadata changes, and
              access requests from a single view.</p>
          </>
        ) : <h1 className="text-xl font-semibold">Sign in required</h1>}
        <div className="flex flex-wrap gap-2 mt-8">
          {session ? (
            <>
              <Button asChild size="sm">
                <Link href="/profile">Go to my profile</Link>
              </Button>
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
      </div>
    </div>
  )
}
