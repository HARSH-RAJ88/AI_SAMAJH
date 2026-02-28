'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserProfile } from '@/lib/types'
import * as authLib from '@/lib/auth'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<void>
  logout: () => Promise<void>
  switchRole: (newRole: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount — check localStorage first, then verify with API
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try localStorage first (instant, no network)
        const cached = localStorage.getItem('ai_samajh_user')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setUser(parsed)
          } catch { /* ignore parse errors */ }
        }

        // Then verify with Supabase session
        const token = await authLib.getAccessToken()
        if (token) {
          const profile = await authLib.fetchProfile(token)
          if (profile) {
            setUser(profile)
            localStorage.setItem('ai_samajh_user', JSON.stringify(profile))
          } else if (!cached) {
            // No profile and no cache — not logged in
            setUser(null)
          }
        } else if (!cached) {
          setUser(null)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await authLib.loginWithEmail(email, password)
    setUser(loggedInUser)
    localStorage.setItem('ai_samajh_user', JSON.stringify(loggedInUser))
  }

  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string
  ) => {
    const { user: newUser } = await authLib.signUp(email, password, firstName, lastName, role)
    setUser(newUser)
    localStorage.setItem('ai_samajh_user', JSON.stringify(newUser))
  }

  const logout = async () => {
    await authLib.logout()
    setUser(null)
    localStorage.removeItem('ai_samajh_user')
  }

  const switchRole = async (newRole: string) => {
    if (!user) throw new Error('No user logged in')
    const updated = await authLib.switchRole(user.id, newRole)
    setUser(updated)
    localStorage.setItem('ai_samajh_user', JSON.stringify(updated))
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')
    const updated = await authLib.updateUserProfile(user.id, updates)
    setUser(updated)
    localStorage.setItem('ai_samajh_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
