import { NextResponse } from "next/server"
import { z } from "zod"

import { auth0 } from "@/lib/auth0"
import { createGuardianEnrollmentTicket } from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

const ticketSchema = z
  .object({
    userId: z.string().min(1).optional(),
    factor: z.string().min(1).optional(),
    sendMail: z.boolean().optional(),
  })
  .strict()

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const permissions = await getAccessTokenPermissions()
  const canWriteAny = permissions.includes("security:write")
  const canWriteSelf = permissions.includes("security:write_self")

  const rawBody = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >
  const parsed = ticketSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const targetUserId = parsed.data.userId ?? session.user.sub
  const isSelf = targetUserId === session.user.sub
  if (!canWriteAny && !(isSelf && canWriteSelf)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ticket = await createGuardianEnrollmentTicket({
    user_id: targetUserId,
    allow_multiple_enrollments: true,
    send_mail: parsed.data.sendMail ?? false,
    factor: parsed.data.factor,
  })

  return NextResponse.json({ ticket })
}
