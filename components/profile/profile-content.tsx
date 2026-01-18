"use client"

import * as React from "react"
import type {
  Auth0AuthenticationMethod,
  Auth0Identity,
  Auth0Session,
  Auth0User,
} from "@/lib/auth0-types"
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
import { Separator } from "@/components/ui/separator"
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
  const canManageSocial =
    view === "admin"
      ? hasAny(["security:manage_social_links"])
      : hasAny([
        "security:manage_social_links_self",
        "security:manage_social_links",
      ])

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
  const showSocialTab = canReadSecurity || canManageSocial

  const baseIdentities = React.useMemo(
    () => user.identities ?? [],
    [user.identities]
  )
  const initialSocialIdentities = React.useMemo(
    () => baseIdentities.filter((identity) => identity.provider !== "auth0"),
    [baseIdentities]
  )

  const [authMethods, setAuthMethods] = React.useState<
    Auth0AuthenticationMethod[]
  >([])
  const [authMethodsState, setAuthMethodsState] =
    React.useState<RequestState>("idle")
  const [authMethodsError, setAuthMethodsError] = React.useState<string | null>(
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

  const [mfaState, setMfaState] = React.useState<RequestState>("idle")
  const [mfaError, setMfaError] = React.useState<string | null>(null)

  const [linkedIdentities, setLinkedIdentities] = React.useState<Auth0Identity[]>(
    () => initialSocialIdentities
  )
  const [socialState, setSocialState] = React.useState<RequestState>("idle")
  const [socialError, setSocialError] = React.useState<string | null>(null)

  const mfaMethods = React.useMemo(
    () =>
      authMethods.filter(
        (method) => method.type !== "passkey" && method.type !== "password"
      ),
    [authMethods]
  )
  const passkeyMethods = React.useMemo(
    () => authMethods.filter((method) => method.type === "passkey"),
    [authMethods]
  )

  React.useEffect(() => {
    setLinkedIdentities(initialSocialIdentities)
    setPasswordTicket(null)
    setPasswordState("idle")
    setPasswordError(null)
    setAuthMethodsState("idle")
    setAuthMethodsError(null)
    setMfaState("idle")
    setMfaError(null)
    setSessionsState("idle")
    setSessionsError(null)
    setSessionsActionState("idle")
    setRevokeSessionId(null)
    setSocialState("idle")
    setSocialError(null)
  }, [user.user_id, initialSocialIdentities])

  const formatProviderName = (value: string) =>
    value
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())

  const formatAuthMethodLabel = (method: Auth0AuthenticationMethod) =>
    method.name?.trim().length ? method.name : formatProviderName(method.type)

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

  const handleResetMfa = async () => {
    if (!canResetMfa) {
      return
    }

    setMfaState("loading")
    setMfaError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(
          apiUserId
        )}/security/mfa/reset`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to reset MFA.")
      }

      setMfaState("success")
      await loadAuthMethods()
    } catch (error) {
      setMfaState("error")
      setMfaError(error instanceof Error ? error.message : "MFA reset failed.")
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

  const handleUnlinkIdentity = async (identity: Auth0Identity) => {
    if (!canManageSocial) {
      return
    }

    setSocialState("loading")
    setSocialError(null)

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(apiUserId)}/identities`,
        {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            provider: identity.provider,
            identityUserId: identity.user_id,
          }),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to unlink identity.")
      }

      setLinkedIdentities((current) =>
        current.filter(
          (item) =>
            !(
              item.provider === identity.provider &&
              item.user_id === identity.user_id
            )
        )
      )
      setSocialState("success")
    } catch (error) {
      setSocialState("error")
      setSocialError(
        error instanceof Error ? error.message : "Unlink failed."
      )
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
          {showSocialTab ? (
            <TabsTrigger value="social">Social links</TabsTrigger>
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
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="border-b">
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                      Manage password reset and account recovery options.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6 text-xs text-muted-foreground">
                    {view === "admin" ? (
                      <p>
                        Generate a reset link for this account from Auth0.
                      </p>
                    ) : (
                      <p>
                        Request a password reset link issued by Auth0.
                      </p>
                    )}
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
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
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
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>MFA</CardTitle>
                    <CardDescription>
                      Require multi-factor authentication for sign-in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">MFA required</span>
                      <Switch checked={mfaMethods.length > 0} disabled />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {authMethodsState === "loading" ? (
                        <Badge variant="outline">Loading MFA</Badge>
                      ) : mfaMethods.length ? (
                        mfaMethods.map((method) => (
                          <Badge key={method.id} variant="outline">
                            {formatAuthMethodLabel(method)}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">No MFA enrollments</Badge>
                      )}
                    </div>
                    {authMethodsError ? (
                      <div className="text-destructive text-xs">
                        {authMethodsError}
                      </div>
                    ) : null}
                    {mfaError ? (
                      <div className="text-destructive text-xs">{mfaError}</div>
                    ) : null}
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetMfa}
                      disabled={!canResetMfa || mfaState === "loading"}
                    >
                      {mfaState === "loading" ? "Resetting..." : "Reset MFA"}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader className="border-b">
                    <CardTitle>Passkeys</CardTitle>
                    <CardDescription>
                      Manage FIDO2 passkeys associated with this account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6 text-xs text-muted-foreground">
                    {authMethodsState === "loading" ? (
                      <p>Loading passkeys...</p>
                    ) : passkeyMethods.length ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {passkeyMethods.map((method, index) => (
                            <Badge
                              key={method.id}
                              variant="outline"
                            >
                              {method.name ?? `Passkey ${index + 1}`}
                            </Badge>
                          ))}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span>Registered</span>
                          <span className="font-medium">
                            {passkeyMethods.length}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p>No passkeys registered.</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={!canManagePasskeys}>
                      Add passkey
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canManagePasskeys}
                    >
                      Remove passkey
                    </Button>
                  </CardFooter>
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
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Active sessions</CardTitle>
                  <CardDescription>
                    Review devices and revoke active sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
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
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleRevokeSession(session.id)}
                                  disabled={
                                    !canRevokeSessions ||
                                    revokeSessionId === session.id ||
                                    sessionsActionState === "loading"
                                  }
                                >
                                  {revokeSessionId === session.id
                                    ? "Revoking..."
                                    : "Revoke"}
                                </Button>
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
                </CardContent>
                <CardFooter className="justify-between">
                  <span className="text-xs text-muted-foreground">
                    {sessionsError ?? "Sessions are sourced from Auth0."}
                  </span>
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
                      : "Revoke all sessions"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        ) : null}

        {showSocialTab ? (
          <TabsContent value="social">
            {!canReadSecurity && !canManageSocial ? (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Social links</CardTitle>
                  <CardDescription>
                    You do not have permission to manage identity links.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Linked identities</CardTitle>
                  <CardDescription>
                    Connect or revoke social login providers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedIdentities.map((identity) => (
                        <TableRow
                          key={`${identity.provider}-${identity.user_id}`}
                        >
                          <TableCell>
                            {formatProviderName(identity.provider)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Linked</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleUnlinkIdentity(identity)}
                              disabled={
                                !canManageSocial || socialState === "loading"
                              }
                            >
                              {socialState === "loading"
                                ? "Updating..."
                                : "Unlink"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!linkedIdentities.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-muted-foreground"
                          >
                            No linked identities found.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Linked identities are managed via Auth0 connections.
                  </span>
                  {socialError ? (
                    <span className="text-destructive">{socialError}</span>
                  ) : null}
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
