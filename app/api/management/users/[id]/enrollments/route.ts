import { NextResponse } from "next/server"

import { auth0 } from "@/lib/auth0"
import { listUserEnrollments } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

type RouteContext = {
  params: Promise<{ id: string }>
}

function resolveUserId(sessionUserId: string | undefined, id: string) {
  if (id === "me" && sessionUserId) {
    return sessionUserId
  }
  return id
}

function canAccessUser(
  sessionUserId: string | undefined,
  targetUserId: string,
  canReadAny: boolean,
  canReadSelf: boolean
) {
  if (canReadAny) {
    return true
  }
  return sessionUserId === targetUserId && canReadSelf
}

export async function GET(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const targetUserId = resolveUserId(session.user.sub, id)
  const permissions = await getAccessTokenPermissions()
  const canReadAny = permissions.includes("security:read")
  const canReadSelf = permissions.includes("security:read_self")

  if (
    !canAccessUser(
      session.user.sub,
      targetUserId,
      canReadAny,
      canReadSelf
    )
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const enrollments = await listUserEnrollments(targetUserId)
  return NextResponse.json({ enrollments })
}
