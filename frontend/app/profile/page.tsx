'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/lib/types'
import { ROLE_CONFIG, LANGUAGES } from '@/lib/constants'
import Avatar from '@/components/Avatar'
import Navbar from '@/components/Navbar'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, updateProfile, switchRole } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'citizen' as UserRole,
    goal: '',
    language: 'english',
    industry: '',
  })

  // Load user data on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login')
      return
    }

    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      goal: user.goal || '',
      language: user.language || 'english',
      industry: user.industry || '',
    })
  }, [user, isAuthenticated, router])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // If role changed, call switchRole
      if (formData.role !== user?.role) {
        await switchRole(formData.role)
      }

      // Update other fields
      const updates: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        goal: formData.goal,
        language: formData.language,
        industry: formData.industry,
      }

      if (formData.role !== user?.role) {
        updates.role = formData.role
      }

      await updateProfile(updates)
      setSuccess('Profile updated successfully!')

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return

    try {
      await logout()
      router.push('/')
    } catch (err) {
      setError('Logout failed')
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Avatar Preview */}
          <section>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
              Your Avatar
            </h2>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <Avatar
                firstName={formData.first_name}
                lastName={formData.last_name}
                role={formData.role}
                size="md"
              />
            </div>
          </section>

          {/* Personal Information */}
          <section className="border-t pt-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email (Read-only)
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </section>

          {/* Role & Preferences */}
          <section className="border-t pt-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
              Role & Preferences
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Role
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => {
                  const config = ROLE_CONFIG[r]
                  const selected = formData.role === r
                  return (
                    <button
                      key={r}
                      onClick={() =>
                        setFormData({ ...formData, role: r })
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{config.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {config.label}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={formData.language}
                  onChange={e =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Industry (Optional)
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={e =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="e.g., Software, Finance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Goal
              </label>
              <textarea
                value={formData.goal}
                onChange={e =>
                  setFormData({ ...formData, goal: e.target.value })
                }
                placeholder="What do you want to achieve with AI news?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </section>

          {/* Actions */}
          <section className="border-t pt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
