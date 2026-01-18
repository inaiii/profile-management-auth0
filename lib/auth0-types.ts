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
  multifactor?: string[]
  identities?: Auth0Identity[]
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

export type Auth0Identity = {
  provider: string
  user_id: string
  connection?: string
  isSocial?: boolean
  profileData?: Record<string, unknown>
}

export type Auth0AuthenticationMethod = {
  id: string
  type: string
  name?: string
  created_at?: string
  enrolled_at?: string
  last_auth_at?: string
  confirmed?: boolean
  user_agent?: string
  credential_device_type?: string
  credential_backed_up?: boolean
  relying_party_identifier?: string
  aaguid?: string
}

export type Auth0Session = {
  id: string
  user_id?: string
  created_at?: string
  authenticated_at?: string
  last_interacted_at?: string
  expires_at?: string
  idle_expires_at?: string
  device?: {
    initial_user_agent?: string
    last_user_agent?: string
    initial_ip?: {
      ip?: string
    }
    last_ip?: {
      ip?: string
    }
  }
}

export type Auth0SessionsResponse = {
  sessions: Auth0Session[]
  next?: string
}

export type Auth0Enrollment = {
  id: string
  auth_method?: string
  status?: string
  type?: string
  name?: string
  identifier?: string
  phone_number?: string
  enrolled_at?: string
  last_auth?: string
}

export type Auth0EnrollmentTicket = {
  ticket_id?: string
  ticket_url?: string
}
