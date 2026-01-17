import { Auth0Client } from "@auth0/nextjs-auth0/server"

const audience = process.env.AUTH0_API_AUDIENCE
const scope = process.env.AUTH0_API_SCOPE ?? "openid profile email"

export const auth0 = new Auth0Client({
  authorizationParameters: audience
    ? {
        audience,
        scope,
      }
    : {
        scope,
      },
})
