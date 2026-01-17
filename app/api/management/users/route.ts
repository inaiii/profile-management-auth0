import { NextResponse } from "next/server"

import { listUsers } from "@/lib/auth0-management"
import { auth0 } from "@/lib/auth0"
import { hasPermission } from "@/lib/auth0-permissions"

export async function GET(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await hasPermission("profile:read"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? undefined

  const users = await listUsers(query)
  return NextResponse.json({ users })
}
