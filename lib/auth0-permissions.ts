import "server-only"

import { auth0 } from "@/lib/auth0"

type AccessTokenClaims = {
  permissions?: string[]
  scope?: string
}

function decodeAccessToken(token: string): AccessTokenClaims | null {
  const parts = token.split(".")
  if (parts.length < 2) {
    return null
  }

  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8")
    return JSON.parse(payload) as AccessTokenClaims
  } catch {
    return null
  }
}

export async function getAccessTokenPermissions(): Promise<string[]> {
  const session = await auth0.getSession()
  if (!session) {
    return []
  }

  try {
    const { token } = await auth0.getAccessToken({
      audience: process.env.AUTH0_API_AUDIENCE,
      scope: process.env.AUTH0_API_SCOPE,
    })

    const claims = decodeAccessToken(token)
    if (!claims) {
      return []
    }

    if (Array.isArray(claims.permissions)) {
      return claims.permissions
    }

    if (claims.scope) {
      return claims.scope.split(" ").filter(Boolean)
    }

    return []
  } catch {
    return []
  }
}

export async function hasPermission(
  required: string | string[]
): Promise<boolean> {
  const permissions = await getAccessTokenPermissions()
  const requiredList = Array.isArray(required) ? required : [required]
  return requiredList.every((permission) => permissions.includes(permission))
}
