import { NextResponse } from "next/server"

import { auth0 } from "@/lib/auth0"
import { getSession, revokeSession } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 })
  }

  const permissions = await getAccessTokenPermissions()
  const canRevokeAny = permissions.includes("sessions:revoke")
  const canRevokeSelf = permissions.includes("sessions:revoke_self")

  if (!canRevokeAny && !canRevokeSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!canRevokeAny) {
    const target = await getSession(id)
    if (target.user_id !== session.user.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  await revokeSession(id)
  return NextResponse.json({ ok: true })
}
