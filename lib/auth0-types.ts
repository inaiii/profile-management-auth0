export type Auth0User = {
  user_id: string
  email?: string
  name?: string
  given_name?: string
  family_name?: string
  nickname?: string
  picture?: string
  last_login?: string
  logins_count?: number
  blocked?: boolean
  created_at?: string
  updated_at?: string
  user_metadata?: {
    title?: string
    department?: string
    locale?: string
    timezone?: string
    bio?: string
  }
  app_metadata?: {
    roles?: string[]
  }
}
