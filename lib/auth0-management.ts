import "server-only"

import type {
  Auth0AuthenticationMethod,
  Auth0Session,
  Auth0SessionsResponse,
  Auth0User,
} from "@/lib/auth0-types"

type TokenCache = {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function getManagementAudience(domain: string) {
  return process.env.AUTH0_MANAGEMENT_AUDIENCE ?? `https://${domain}/api/v2/`
}

async function getManagementToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (tokenCache && tokenCache.expiresAt - 60 > now) {
    return tokenCache.accessToken
  }

  const domain = requireEnv("AUTH0_DOMAIN")
  const clientId = requireEnv("AUTH0_M2M_CLIENT_ID")
  const clientSecret = requireEnv("AUTH0_M2M_CLIENT_SECRET")
  const audience = getManagementAudience(domain)

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Auth0 token request failed: ${response.status} ${errorText}`
    )
  }

  const data = (await response.json()) as {
    access_token: string
    expires_in: number
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in,
  }

  return tokenCache.accessToken
}

async function callManagementApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const domain = requireEnv("AUTH0_DOMAIN")
  const token = await getManagementToken()
  const url = `https://${domain}/api/v2${path}`

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Auth0 management API error (${response.status}): ${errorText}`
    )
  }

  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  if (!text) {
    return null as T
  }

  return JSON.parse(text) as T
}

export async function listUsers(query?: string): Promise<Auth0User[]> {
  const params = new URLSearchParams({ per_page: "25" })
  if (query) {
    params.set("q", query)
    params.set("search_engine", "v3")
  }

  return callManagementApi<Auth0User[]>(`/users?${params.toString()}`)
}

export async function getUser(userId: string): Promise<Auth0User> {
  return callManagementApi<Auth0User>(`/users/${encodeURIComponent(userId)}`)
}

export async function updateUser(
  userId: string,
  payload: Record<string, unknown>
): Promise<Auth0User> {
  return callManagementApi<Auth0User>(
    `/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export async function listUserAuthenticationMethods(
  userId: string
): Promise<Auth0AuthenticationMethod[]> {
  const result = await callManagementApi<unknown>(
    `/users/${encodeURIComponent(userId)}/authentication-methods`
  )

  if (Array.isArray(result)) {
    return result as Auth0AuthenticationMethod[]
  }

  if (result && typeof result === "object" && "authenticators" in result) {
    const authenticators = (result as {
      authenticators?: Auth0AuthenticationMethod[]
    }).authenticators
    return authenticators ?? []
  }

  return []
}

export async function listUserSessions(
  userId: string
): Promise<Auth0SessionsResponse> {
  return callManagementApi<Auth0SessionsResponse>(
    `/users/${encodeURIComponent(userId)}/sessions`
  )
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await callManagementApi<void>(
    `/users/${encodeURIComponent(userId)}/sessions`,
    {
      method: "DELETE",
    }
  )
}

export async function getSession(sessionId: string): Promise<Auth0Session> {
  return callManagementApi<Auth0Session>(
    `/sessions/${encodeURIComponent(sessionId)}`
  )
}

export async function revokeSession(sessionId: string): Promise<void> {
  await callManagementApi<void>(
    `/sessions/${encodeURIComponent(sessionId)}/revoke`,
    {
      method: "POST",
    }
  )
}

type PasswordChangeTicketResponse = {
  ticket: string
}

export async function createPasswordChangeTicket(
  userId: string
): Promise<PasswordChangeTicketResponse> {
  const payload: Record<string, string> = {
    user_id: userId,
  }

  const connectionId = process.env.AUTH0_PASSWORD_CONNECTION_ID
  if (connectionId) {
    payload.connection_id = connectionId
  }

  const resultUrl = process.env.AUTH0_PASSWORD_RESET_REDIRECT_URL
  if (resultUrl) {
    payload.result_url = resultUrl
  }

  return callManagementApi<PasswordChangeTicketResponse>(
    "/tickets/password-change",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function resetUserMfa(userId: string): Promise<string[]> {
  const user = await getUser(userId)
  const providers = user.multifactor ?? []

  if (!providers.length) {
    return []
  }

  await Promise.all(
    providers.map((provider) =>
      callManagementApi<void>(
        `/users/${encodeURIComponent(userId)}/multifactor/${encodeURIComponent(
          provider
        )}`,
        {
          method: "DELETE",
        }
      )
    )
  )

  return providers
}

export async function unlinkUserIdentity(
  userId: string,
  provider: string,
  identityUserId: string
): Promise<void> {
  await callManagementApi<void>(
    `/users/${encodeURIComponent(userId)}/identities/${encodeURIComponent(
      provider
    )}/${encodeURIComponent(identityUserId)}`,
    {
      method: "DELETE",
    }
  )
}
