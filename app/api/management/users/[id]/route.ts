import { NextResponse } from "next/server"
import { z } from "zod"

import { getUser, updateUser } from "@/lib/auth0-management"
import { auth0 } from "@/lib/auth0"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

const userMetadataSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  department: z.string().min(2).max(80).optional(),
  locale: z.string().min(2).max(16).optional(),
  timezone: z.string().min(2).max(64).optional(),
  bio: z.string().max(160).optional(),
})

const updateSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    nickname: z.string().min(2).max(80).optional(),
    given_name: z.string().min(2).max(80).optional(),
    family_name: z.string().min(2).max(80).optional(),
    picture: z.string().url().optional(),
    blocked: z.boolean().optional(),
    user_metadata: userMetadataSchema.optional(),
  })
  .strict()

type RouteParams = {
  params: {
    id: string
  }
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

type RouteContext = {
  params: Promise<RouteParams["params"]>
}

export async function GET(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const targetUserId = resolveUserId(session.user.sub, id)
  const permissions = await getAccessTokenPermissions()
  const canReadAny = permissions.includes("profile:read")
  const canReadSelf = permissions.includes("profile:read_self")
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

  const user = await getUser(targetUserId)
  return NextResponse.json({ user })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const targetUserId = resolveUserId(session.user.sub, id)
  const permissions = await getAccessTokenPermissions()
  const canWriteAny = permissions.includes("profile:write")
  const canWriteSelf = permissions.includes("profile:write_self")
  const isSelf = session.user.sub === targetUserId
  if (!canWriteAny && !(isSelf && canWriteSelf)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rawBody = (await request.json()) as Record<string, unknown>
  if ("email" in rawBody) {
    return NextResponse.json(
      { error: "Email updates are disabled for now." },
      { status: 400 }
    )
  }

  if (!canWriteAny && "blocked" in rawBody) {
    return NextResponse.json(
      { error: "Blocked status can only be modified by admins." },
      { status: 403 }
    )
  }

  const parsed = updateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const user = await updateUser(targetUserId, parsed.data)
  return NextResponse.json({ user })
}
