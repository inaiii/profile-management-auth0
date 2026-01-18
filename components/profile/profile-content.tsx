"use client"

import * as React from "react"
import type {
  Auth0AuthenticationMethod,
  Auth0Enrollment,
  Auth0EnrollmentTicket,
  Auth0Session,
  Auth0User,
} from "@/lib/auth0-types"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons"
import { ProfileForm } from "@/components/profile/profile-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

type ProfileContentProps = {
  user: Auth0User
  permissions: string[]
  view: "self" | "admin"
}

type RequestState = "idle" | "loading" | "success" | "error"

function initialsFrom(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function ProfileContent({
  user,
  permissions,
  view,
}: ProfileContentProps) {
  const apiUserId = view === "self" ? "me" : user.user_id

  const hasAny = (permissionList: string[]) =>
    permissionList.some((permission) => permissions.includes(permission))

  const canEditProfile =
    view === "admin"
      ? hasAny(["profile:write"])
      : hasAny(["profile:write_self", "profile:write"])

  const canReadSecurity =
    view === "admin"
      ? hasAny(["security:read"])
      : hasAny(["security:read_self", "security:read"])
  const canWriteSecurity =
    view === "admin"
      ? hasAny(["security:write"])
      : hasAny(["security:write_self", "security:write"])
  const canChangePassword =
    view === "admin"
      ? hasAny(["security:force_password_reset", "security:set_password"])
      : hasAny([
        "security:change_password_self",
        "security:force_password_reset",
        "security:set_password",
      ])
  const canResetMfa =
    view === "admin"
      ? hasAny(["security:reset_mfa"])
      : hasAny(["security:reset_mfa_self", "security:reset_mfa"])
  const canManagePasskeys =
    view === "admin"
      ? hasAny(["security:manage_passkeys"])
      : hasAny(["security:manage_passkeys_self", "security:manage_passkeys"])
  const canReadSessions =
    view === "admin"
      ? hasAny(["sessions:read"])
      : hasAny(["sessions:read_self", "sessions:read"])
  const canRevokeSessions =
    view === "admin"
      ? hasAny(["sessions:revoke"])
      : hasAny(["sessions:revoke_self", "sessions:revoke"])

  const showSecurityTab =
    canReadSecurity || canWriteSecurity || canChangePassword || canResetMfa
  const showSessionsTab = canReadSessions || canRevokeSessions

  const [authMethods, setAuthMethods] = React.useState<
    Auth0AuthenticationMethod[]
  >([])
  const [authMethodsState, setAuthMethodsState] =
    React.useState<RequestState>("idle")
  const [authMethodsError, setAuthMethodsError] = React.useState<string | null>(
    null
  )
  const [passkeyActionState, setPasskeyActionState] =
    React.useState<RequestState>("idle")
  const [passkeyError, setPasskeyError] = React.useState<string | null>(null)
  const [revokePasskeyId, setRevokePasskeyId] = React.useState<string | null>(
    null
  )

  const [sessions, setSessions] = React.useState<Auth0Session[]>([])
  const [sessionsState, setSessionsState] =
    React.useState<RequestState>("idle")
  const [sessionsError, setSessionsError] = React.useState<string | null>(null)
  const [sessionsActionState, setSessionsActionState] =
    React.useState<RequestState>("idle")
  const [revokeSessionId, setRevokeSessionId] = React.useState<string | null>(
    null
  )

  const [passwordState, setPasswordState] =
    React.useState<RequestState>("idle")
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordTicket, setPasswordTicket] = React.useState<string | null>(null)

  const [enrollments, setEnrollments] = React.useState<Auth0Enrollment[]>([])
  const [enrollmentsState, setEnrollmentsState] =
    React.useState<RequestState>("idle")
  const [enrollmentsError, setEnrollmentsError] = React.useState<string | null>(
    null
  )
  const [enrollmentActionState, setEnrollmentActionState] =
    React.useState<RequestState>("idle")
  const [revokeEnrollmentId, setRevokeEnrollmentId] =
    React.useState<string | null>(null)
  const [enrollmentTicket, setEnrollmentTicket] =
    React.useState<Auth0EnrollmentTicket | null>(null)
  const [enrollmentTicketState, setEnrollmentTicketState] =
    React.useState<RequestState>("idle")
  const [enrollmentTicketError, setEnrollmentTicketError] =
    React.useState<string | null>(null)

  const passkeyMethods = React.useMemo(
    () => authMethods.filter((method) => method.type === "passkey"),
    [authMethods]
  )

  React.useEffect(() => {
    setPasswordTicket(null)
    setPasswordState("idle")
    setPasswordError(null)
    setAuthMethodsState("idle")
    setAuthMethodsError(null)
    setPasskeyActionState("idle")
    setPasskeyError(null)
    setRevokePasskeyId(null)
    setEnrollmentsState("idle")
    setEnrollmentsError(null)
    setEnrollmentActionState("idle")
    setRevokeEnrollmentId(null)
    setEnrollmentTicket(null)
    setEnrollmentTicketState("idle")
    setEnrollmentTicketError(null)
    setSessionsState("idle")
    setSessionsError(null)
    setSessionsActionState("idle")
    setRevokeSessionId(null)
  }, [user.user_id])

  const formatProviderName = (value: string) =>
    value
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())

  const formatAuthMethodDate = (value?: string) =>
    value ? new Date(value).toLocaleString() : "—"

  const formatAuthMethodName = (method: Auth0AuthenticationMethod) =>
    method.name ?? method.id

  const formatEnrollmentName = (enrollment: Auth0Enrollment) =>
    enrollment.name ??
    enrollment.phone_number ??
    enrollment.identifier ??
    formatProviderName(enrollment.auth_method ?? enrollment.type ?? "mfa")

  const formatEnrollmentDate = (value?: string) =>
    value ? new Date(value).toLocaleString() : "—"

  const formatSessionDate = (value?: string) =>
    value ? new Date(value).toLocaleString() : "—"

  const formatSessionDevice = (session: Auth0Session) =>
    session.device?.last_user_agent ||
    session.device?.initial_user_agent ||
    "Unknown device"

  const formatSessionLocation = (session: Auth0Session) =>
    session.device?.last_ip?.ip || session.device?.initial_ip?.ip || "—"

  const loadAuthMethods = React.useCallback(async () => {
    if (!showSecurityTab || !canReadSecurity) {
      setAuthMethods([])
      return
    }

    setAuthMethodsState("loading")
    setAuthMethodsError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(
          apiUserId
        )}/authentication-methods`
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to load authentication methods.")
      }

      const data = (await response.json()) as {
        methods?: Auth0AuthenticationMethod[]
      }
      setAuthMethods(data.methods ?? [])
      setAuthMethodsState("success")
    } catch (error) {
      setAuthMethodsState("error")
      setAuthMethodsError(
        error instanceof Error ? error.message : "Failed to load MFA data."
      )
    }
  }, [apiUserId, canReadSecurity, showSecurityTab])

  const loadEnrollments = React.useCallback(async () => {
    if (!showSecurityTab || !canReadSecurity) {
      setEnrollments([])
      return
    }

    setEnrollmentsState("loading")
    setEnrollmentsError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(apiUserId)}/enrollments`
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to load MFA enrollments.")
      }

      const data = (await response.json()) as {
        enrollments?: Auth0Enrollment[]
      }
      setEnrollments(data.enrollments ?? [])
      setEnrollmentsState("success")
    } catch (error) {
      setEnrollmentsState("error")
      setEnrollmentsError(
        error instanceof Error ? error.message : "Failed to load MFA enrollments."
      )
    }
  }, [apiUserId, canReadSecurity, showSecurityTab])

  const handleRevokePasskey = async (method: Auth0AuthenticationMethod) => {
    if (!canManagePasskeys) {
      return
    }

    setRevokePasskeyId(method.id)
    setPasskeyActionState("loading")
    setPasskeyError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(
          apiUserId
        )}/authentication-methods/${encodeURIComponent(method.id)}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to revoke passkey.")
      }

      setAuthMethods((current) =>
        current.filter((item) => item.id !== method.id)
      )
      setPasskeyActionState("success")
    } catch (error) {
      setPasskeyActionState("error")
      setPasskeyError(
        error instanceof Error ? error.message : "Failed to revoke passkey."
      )
    } finally {
      setRevokePasskeyId(null)
    }
  }

  const loadSessions = React.useCallback(async () => {
    if (!showSessionsTab || !canReadSessions) {
      setSessions([])
      return
    }

    setSessionsState("loading")
    setSessionsError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(apiUserId)}/sessions`
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to load sessions.")
      }

      const data = (await response.json()) as {
        sessions?: Auth0Session[]
      }
      setSessions(data.sessions ?? [])
      setSessionsState("success")
    } catch (error) {
      setSessionsState("error")
      setSessionsError(
        error instanceof Error ? error.message : "Failed to load sessions."
      )
    }
  }, [apiUserId, canReadSessions, showSessionsTab])

  React.useEffect(() => {
    loadAuthMethods()
  }, [loadAuthMethods])

  React.useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  React.useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handlePasswordReset = async () => {
    if (!canChangePassword) {
      return
    }

    setPasswordState("loading")
    setPasswordError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(
          apiUserId
        )}/security/password-reset`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to generate reset link.")
      }

      const data = (await response.json()) as { ticket: string }
      setPasswordTicket(data.ticket)
      setPasswordState("success")

      if (view === "self" && data.ticket) {
        window.open(data.ticket, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      setPasswordState("error")
      setPasswordError(
        error instanceof Error ? error.message : "Password reset failed."
      )
    }
  }

  const handleCreateEnrollmentTicket = async () => {
    if (!canWriteSecurity) {
      return
    }

    setEnrollmentTicketState("loading")
    setEnrollmentTicketError(null)

    try {
      const response = await fetch(
        "/api/management/guardian/enrollments/ticket",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            userId: view === "admin" ? user.user_id : undefined,
          }),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to create enrollment ticket.")
      }

      const data = (await response.json()) as {
        ticket?: Auth0EnrollmentTicket
      }
      const ticket = data.ticket ?? null
      setEnrollmentTicket(ticket)
      setEnrollmentTicketState("success")

      if (ticket?.ticket_url) {
        window.open(ticket.ticket_url, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      setEnrollmentTicketState("error")
      setEnrollmentTicketError(
        error instanceof Error
          ? error.message
          : "Failed to create enrollment ticket."
      )
    }
  }

  const handleRevokeEnrollment = async (enrollment: Auth0Enrollment) => {
    if (!canResetMfa) {
      return
    }

    setRevokeEnrollmentId(enrollment.id)
    setEnrollmentActionState("loading")
    setEnrollmentsError(null)

    try {
      const response = await fetch(
        `/api/management/guardian/enrollments/${encodeURIComponent(
          enrollment.id
        )}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to revoke enrollment.")
      }

      setEnrollments((current) =>
        current.filter((item) => item.id !== enrollment.id)
      )
      setEnrollmentActionState("success")
    } catch (error) {
      setEnrollmentActionState("error")
      setEnrollmentsError(
        error instanceof Error ? error.message : "Failed to revoke enrollment."
      )
    } finally {
      setRevokeEnrollmentId(null)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!canRevokeSessions) {
      return
    }

    setSessionsActionState("loading")
    setSessionsError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(apiUserId)}/sessions`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to revoke sessions.")
      }

      setSessions([])
      setSessionsActionState("success")
    } catch (error) {
      setSessionsActionState("error")
      setSessionsError(
        error instanceof Error ? error.message : "Failed to revoke sessions."
      )
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!canRevokeSessions) {
      return
    }

    setRevokeSessionId(sessionId)
    setSessionsError(null)

    try {
      const response = await fetch(
        `/api/management/sessions/${encodeURIComponent(sessionId)}/revoke`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to revoke session.")
      }

      setSessions((current) =>
        current.filter((session) => session.id !== sessionId)
      )
    } catch (error) {
      setSessionsError(
        error instanceof Error ? error.message : "Failed to revoke session."
      )
    } finally {
      setRevokeSessionId(null)
    }
  }


  return (
    <div className="space-y-6">
      <Card >
        <CardContent className="grid gap-6  md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex items-center gap-4">
            <Avatar data-size="size-20">
              {user.picture ? (
                <AvatarImage src={user.picture} alt={user.name ?? ""} />
              ) : null}
              <AvatarFallback>
                {initialsFrom(user.name ?? user.email ?? "U")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="text-xl font-medium">{user.name ?? "Unnamed"}</div>
              <div className="flex ">
                <span className="text-muted-foreground">user_id:</span>
                {/* <span className="font-medium">{user.user_id}</span> */}
                <Badge variant={'secondary'}>{user.user_id}</Badge>
              </div>
            </div>
          </div>
          <div className="justify-self-end">
            <Badge className="h-10" variant={user.blocked ? "destructive" : "secondary"}>
              {user.blocked ? "Blocked" : "Active"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList variant="line">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {showSecurityTab ? (
            <TabsTrigger value="security">Security</TabsTrigger>
          ) : null}
          {showSessionsTab ? (
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm user={user} canEdit={canEditProfile} />
        </TabsContent>

        {showSecurityTab ? (
          <TabsContent value="security">
            {!canReadSecurity ? (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Security access</CardTitle>
                  <CardDescription>
                    You do not have permission to view security settings.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Password</div>
                      <p className="text-xs text-muted-foreground">
                        {view === "admin"
                          ? "Generate a reset link for this account."
                          : "Request a password reset link issued by Auth0."}
                      </p>
                      {passwordTicket ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">Reset link ready</Badge>
                          <Button asChild variant="outline" size="xs">
                            <a
                              href={passwordTicket}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open link
                            </a>
                          </Button>
                        </div>
                      ) : null}
                      {passwordError ? (
                        <div className="text-destructive text-xs">
                          {passwordError}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      onClick={handlePasswordReset}
                      disabled={!canChangePassword || passwordState === "loading"}
                    >
                      {passwordState === "loading"
                        ? "Generating..."
                        : view === "admin"
                          ? "Generate reset link"
                          : "Change password"}
                    </Button>
                  </div>
                </Card>

                <Card className="space-y-3 p-4">
                  <div>
                    <div className="text-sm font-medium">Passkeys</div>
                    <p className="text-xs text-muted-foreground">
                      Manage FIDO2 passkeys associated with this account.
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Last used</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authMethodsState === "loading" ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-muted-foreground"
                          >
                            Loading passkeys...
                          </TableCell>
                        </TableRow>
                      ) : passkeyMethods.length ? (
                        passkeyMethods.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell>
                              <div className="text-xs font-medium">
                                {formatAuthMethodName(method)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {method.user_agent ?? "Unknown device"}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatAuthMethodDate(
                                method.last_auth_at ?? method.enrolled_at
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="xs">
                                    <HugeiconsIcon
                                      icon={MoreHorizontalIcon}
                                      strokeWidth={2}
                                      aria-hidden="true"
                                    />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleRevokePasskey(method)}
                                    disabled={
                                      !canManagePasskeys ||
                                      passkeyActionState === "loading" ||
                                      revokePasskeyId === method.id
                                    }
                                  >
                                    {revokePasskeyId === method.id
                                      ? "Revoking..."
                                      : "Revoke passkey"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-muted-foreground"
                          >
                            No passkeys registered.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {passkeyError ? (
                    <div className="text-destructive text-xs">
                      {passkeyError}
                    </div>
                  ) : null}
                  {authMethodsError ? (
                    <div className="text-destructive text-xs">
                      {authMethodsError}
                    </div>
                  ) : null}
                </Card>

                <Card className="space-y-3 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">MFA</div>
                      <p className="text-xs text-muted-foreground">
                        Manage multi-factor enrollments for this account.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCreateEnrollmentTicket}
                      disabled={
                        !canWriteSecurity ||
                        enrollmentTicketState === "loading"
                      }
                    >
                      {enrollmentTicketState === "loading"
                        ? "Generating..."
                        : "Add MFA"}
                    </Button>
                  </div>
                  {enrollmentTicket?.ticket_url ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Enrollment link ready</Badge>
                      <Button asChild variant="outline" size="xs">
                        <a
                          href={enrollmentTicket.ticket_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open link
                        </a>
                      </Button>
                    </div>
                  ) : null}
                  {enrollmentTicketError ? (
                    <div className="text-destructive text-xs">
                      {enrollmentTicketError}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">MFA enabled</span>
                    <Switch checked={enrollments.length > 0} disabled />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last used</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollmentsState === "loading" ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-muted-foreground"
                          >
                            Loading enrollments...
                          </TableCell>
                        </TableRow>
                      ) : enrollments.length ? (
                        enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell>
                              <div className="text-xs font-medium">
                                {formatEnrollmentName(enrollment)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {formatProviderName(
                                  enrollment.auth_method ??
                                    enrollment.type ??
                                    "mfa"
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  enrollment.status === "confirmed"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {enrollment.status ?? "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatEnrollmentDate(
                                enrollment.last_auth ?? enrollment.enrolled_at
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="xs">
                                    <HugeiconsIcon
                                      icon={MoreHorizontalIcon}
                                      strokeWidth={2}
                                      aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                      Open menu
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleRevokeEnrollment(enrollment)
                                    }
                                    disabled={
                                      !canResetMfa ||
                                      enrollmentActionState === "loading" ||
                                      revokeEnrollmentId === enrollment.id
                                    }
                                  >
                                    {revokeEnrollmentId === enrollment.id
                                      ? "Revoking..."
                                      : "Revoke MFA"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-muted-foreground"
                          >
                            No MFA enrollments found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {enrollmentsError ? (
                    <div className="text-destructive text-xs">
                      {enrollmentsError}
                    </div>
                  ) : null}
                </Card>
              </div>
            )}
          </TabsContent>
        ) : null}

        {showSessionsTab ? (
          <TabsContent value="sessions">
            {!canReadSessions ? (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Session access</CardTitle>
                  <CardDescription>
                    You do not have permission to view session activity.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="space-y-3 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium">Active sessions</div>
                    <p className="text-xs text-muted-foreground">
                      Review devices and revoke active sessions.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRevokeAllSessions}
                    disabled={
                      !canRevokeSessions || sessionsActionState === "loading"
                    }
                  >
                    {sessionsActionState === "loading"
                      ? "Revoking..."
                      : "Revoke all"}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsState === "loading" ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-muted-foreground"
                        >
                          Loading sessions from Auth0...
                        </TableCell>
                      </TableRow>
                    ) : sessions.length ? (
                      sessions.map((session) => {
                        const lastActive =
                          session.last_interacted_at ||
                          session.authenticated_at ||
                          session.created_at

                        return (
                          <TableRow key={session.id}>
                            <TableCell className="text-muted-foreground">
                              {formatSessionDevice(session)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatSessionLocation(session)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatSessionDate(lastActive)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Active</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="xs">
                                    <HugeiconsIcon
                                      icon={MoreHorizontalIcon}
                                      strokeWidth={2}
                                      aria-hidden="true"
                                    />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleRevokeSession(session.id)}
                                    disabled={
                                      !canRevokeSessions ||
                                      revokeSessionId === session.id ||
                                      sessionsActionState === "loading"
                                    }
                                  >
                                    {revokeSessionId === session.id
                                      ? "Revoking..."
                                      : "Revoke session"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-muted-foreground"
                        >
                          No active sessions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="text-xs text-muted-foreground">
                  {sessionsError ?? "Sessions are sourced from Auth0."}
                </div>
              </Card>
            )}
          </TabsContent>
        ) : null}

      </Tabs>
    </div>
  )
}
