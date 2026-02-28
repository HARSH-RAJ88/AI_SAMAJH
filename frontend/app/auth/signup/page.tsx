'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/lib/types'
import { ROLE_CONFIG, LANGUAGES } from '@/lib/constants'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Name + Role
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<UserRole | null>(null)

  // Step 2: Email + Password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [language, setLanguage] = useState('english')

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password || !role) {
      setError('Please fill all required fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signup(email, password, firstName, lastName, role)
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to{' '}
            <span className="text-indigo-600">AI Samajh</span>
          </h1>
          <p className="mt-2 text-gray-500">Join us to personalize your AI news</p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div
              className={`w-16 h-1 rounded-full transition-colors ${
                step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
            <div
              className={`w-16 h-1 rounded-full transition-colors ${
                step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Step {step} of 2</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Name + Role */}
        {step === 1 && (
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g., Harsh"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g., Raj"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a... *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => {
                  const config = ROLE_CONFIG[r]
                  const selected = role === r
                  return (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
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
                        <div className="text-xs text-gray-500">
                          {r === 'student' && 'Learning & career growth'}
                          {r === 'professional' && 'Skill development'}
                          {r === 'business' && 'Revenue & strategy'}
                          {r === 'investor' && 'Market trends & ROI'}
                          {r === 'citizen' && 'Awareness & impact'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => {
                if (!firstName || !lastName || !role) {
                  setError('Please fill all fields')
                  return
                }
                setError('')
                setStep(2)
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Email + Password */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preferred Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password (min 8 chars) *
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Use a strong password with uppercase, numbers, and symbols</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            {/* Back button */}
            <button
              onClick={() => {
                setError('')
                setStep(1)
              }}
              className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Login link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  )
}
