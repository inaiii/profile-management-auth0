import "server-only"

import { auth0 } from "@/lib/auth0"

export type ServerSession = Awaited<ReturnType<typeof auth0.getSession>>

export async function getServerSession() {
  return auth0.getSession()
}
