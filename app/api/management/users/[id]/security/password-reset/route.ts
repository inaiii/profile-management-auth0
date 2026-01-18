import { NextResponse } from "next/server"

import { auth0 } from "@/lib/auth0"
import { createPasswordChangeTicket } from "@/lib/auth0-management"
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

export async function POST(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const targetUserId = resolveUserId(session.user.sub, id)
  if (!targetUserId) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
  }

  const permissions = await getAccessTokenPermissions()
  const isSelf = session.user.sub === targetUserId
  const canSelf = permissions.includes("security:change_password_self")
  const canAdmin =
    permissions.includes("security:force_password_reset") ||
    permissions.includes("security:set_password")

  if (!canAdmin && !(isSelf && canSelf)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ticket = await createPasswordChangeTicket(targetUserId)
  return NextResponse.json({ ticket: ticket.ticket })
}
