'use client'

import { UserRole, UserProfile } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import Avatar from './Avatar'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

interface NavbarProps {
  role?: UserRole
  language?: string
}

export default function Navbar({ role: defaultRole, language: defaultLanguage }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth()

  const currentRole = user?.role || defaultRole || 'citizen'
  const currentLanguage = user?.language || defaultLanguage || 'english'

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await logout()
        window.location.href = '/'
      } catch (err) {
        console.error('Logout error:', err)
      }
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">AI</span>
          <span className="text-xl font-bold text-gray-900">Samajh</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Avatar with initials */}
              <Link href="/profile" className="hover:opacity-80 transition-opacity">
                <Avatar 
                  firstName={user.first_name} 
                  lastName={user.last_name} 
                  role={currentRole}
                  size="sm"
                />
              </Link>

              {/* Lab link */}
              <Link
                href="/lab"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
              >
                Lab
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="text-xs text-gray-600 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

