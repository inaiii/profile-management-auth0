import { NextResponse } from "next/server"

import { auth0 } from "@/lib/auth0"
import { listUserSessions, revokeUserSessions } from "@/lib/auth0-management"
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
  canAny: boolean,
  canSelf: boolean
) {
  if (canAny) {
    return true
  }
  return sessionUserId === targetUserId && canSelf
}

export async function GET(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const targetUserId = resolveUserId(session.user.sub, id)
  const permissions = await getAccessTokenPermissions()
  const canReadAny = permissions.includes("sessions:read")
  const canReadSelf = permissions.includes("sessions:read_self")

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

  const sessions = await listUserSessions(targetUserId)
  return NextResponse.json(sessions)
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const targetUserId = resolveUserId(session.user.sub, id)
  const permissions = await getAccessTokenPermissions()
  const canRevokeAny = permissions.includes("sessions:revoke")
  const canRevokeSelf = permissions.includes("sessions:revoke_self")

  if (
    !canAccessUser(
      session.user.sub,
      targetUserId,
      canRevokeAny,
      canRevokeSelf
    )
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await revokeUserSessions(targetUserId)
  return NextResponse.json({ ok: true })
}
