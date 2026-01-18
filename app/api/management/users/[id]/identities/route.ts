import { NextResponse } from "next/server"
import { z } from "zod"

import { auth0 } from "@/lib/auth0"
import { unlinkUserIdentity } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

const unlinkSchema = z.object({
  provider: z.string().min(1),
  identityUserId: z.string().min(1),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

function resolveUserId(sessionUserId: string | undefined, id: string) {
  if (id === "me" && sessionUserId) {
    return sessionUserId
  }
  return id
}

export async function DELETE(request: Request, { params }: RouteContext) {
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
  const canSelf = permissions.includes("security:manage_social_links_self")
  const canAdmin = permissions.includes("security:manage_social_links")

  if (!canAdmin && !(isSelf && canSelf)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rawBody = (await request.json()) as Record<string, unknown>
  const parsed = unlinkSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  await unlinkUserIdentity(
    targetUserId,
    parsed.data.provider,
    parsed.data.identityUserId
  )

  return NextResponse.json({ ok: true })
}
