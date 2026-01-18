import { NextResponse } from "next/server"

import { auth0 } from "@/lib/auth0"
import { deleteUserAuthenticationMethod } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

type RouteContext = {
  params: Promise<{ id: string; methodId: string }>
}

function resolveUserId(sessionUserId: string | undefined, id: string) {
  if (id === "me" && sessionUserId) {
    return sessionUserId
  }
  return id
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, methodId } = await params
  if (!methodId) {
    return NextResponse.json({ error: "Invalid authentication method id" }, { status: 400 })
  }

  const targetUserId = resolveUserId(session.user.sub, id)
  const permissions = await getAccessTokenPermissions()
  const isSelf = session.user.sub === targetUserId
  const canSelf = permissions.includes("security:manage_passkeys_self")
  const canAdmin = permissions.includes("security:manage_passkeys")

  if (!canAdmin && !(isSelf && canSelf)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await deleteUserAuthenticationMethod(targetUserId, methodId)
  return NextResponse.json({ ok: true })
}
