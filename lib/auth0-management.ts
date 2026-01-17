import "server-only"

import type { Auth0User } from "@/lib/auth0-types"

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

  return response.json() as Promise<T>
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
