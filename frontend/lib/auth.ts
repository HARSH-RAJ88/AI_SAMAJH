import { supabase } from './supabase'
import { UserProfile, UserRole } from './types'

/**
 * Sign up a new user with email, password, and profile info
 */
export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string
): Promise<{ user: UserProfile; session: any }> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Failed to create user')

  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: authData.user.id,
      email,
      firstName,
      lastName,
      role,
    }),
  })

  const result = await res.json()
  if (result.error) throw new Error(result.error)

  return {
    user: result.user,
    session: authData.session,
  }
}

/**
 * Log in user with email and password
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: UserProfile; session: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)
  if (!data.user || !data.session) throw new Error('Login failed')

  // Fetch profile via server API (bypasses RLS)
  const res = await fetch('/api/auth/user', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${data.session.access_token}`,
    },
  })

  if (!res.ok) throw new Error('Failed to load profile')

  const json = await res.json()
  if (!json?.user) throw new Error('No profile found')

  return {
    user: json.user,
    session: data.session,
  }
}

/**
 * Log out current user
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

/**
 * Get current session token
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

/**
 * Fetch current user profile using stored token
 */
export async function fetchProfile(token: string): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/auth/user', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.user || null
  } catch {
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const token = await getAccessToken()
  if (!token) throw new Error('No active session')

  const res = await fetch('/api/auth/user', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ updates }),
  })

  if (!res.ok) throw new Error(`Failed to update profile: ${res.status}`)

  const json = await res.json()
  return json?.user || {}
}

/**
 * Switch user role
 */
export async function switchRole(
  userId: string,
  newRole: string
): Promise<UserProfile> {
  return updateUserProfile(userId, { role: newRole as UserRole })
}
