import { NextResponse } from "next/server"

import { auth0 } from "@/lib/auth0"
import {
  deleteGuardianEnrollment,
  getGuardianEnrollment,
  listUserEnrollments,
} from "@/lib/auth0-management"
import { getAccessTokenPermissions } from "@/lib/auth0-permissions"

type RouteContext = {
  params: Promise<{ id: string }>
}

async function canAccessEnrollment(
  sessionUserId: string,
  enrollmentId: string,
  canAny: boolean
) {
  if (canAny) {
    return true
  }

  const enrollments = await listUserEnrollments(sessionUserId)
  return enrollments.some((enrollment) => enrollment.id === enrollmentId)
}

export async function GET(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Invalid enrollment id" }, { status: 400 })
  }

  const permissions = await getAccessTokenPermissions()
  const canReadAny = permissions.includes("security:read")
  const canReadSelf = permissions.includes("security:read_self")
  if (!canReadAny && !canReadSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!(await canAccessEnrollment(session.user.sub, id, canReadAny))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const enrollment = await getGuardianEnrollment(id)
  return NextResponse.json({ enrollment })
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Invalid enrollment id" }, { status: 400 })
  }

  const permissions = await getAccessTokenPermissions()
  const canResetAny = permissions.includes("security:reset_mfa")
  const canResetSelf = permissions.includes("security:reset_mfa_self")
  if (!canResetAny && !canResetSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!(await canAccessEnrollment(session.user.sub, id, canResetAny))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await getGuardianEnrollment(id)
  await deleteGuardianEnrollment(id)
  return NextResponse.json({ ok: true })
}
