'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/types'
import { ROLE_CONFIG, LANGUAGES } from '@/lib/constants'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<UserRole | null>(null)
  const [goal, setGoal] = useState('')
  const [language, setLanguage] = useState('english')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!role || !email) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          goal: goal || `Exploring AI as a ${role}`,
          language,
        }),
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      // Store user in localStorage for session
      localStorage.setItem('ai_samajh_user', JSON.stringify(result.user))
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome to <span className="text-indigo-600">AI Samajh</span></h1>
          <p className="mt-2 text-gray-500">Let&apos;s personalize your experience</p>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-16 h-1 rounded-full transition-colors ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Select Role */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 text-center">I am a...</h2>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => {
                const config = ROLE_CONFIG[r]
                const selected = role === r
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{config.label}</div>
                      <div className="text-xs text-gray-500">
                        {r === 'student' && 'Learning, career growth, portfolio building'}
                        {r === 'professional' && 'Productivity, skill development, tools'}
                        {r === 'business' && 'Revenue, competitive advantage, strategy'}
                        {r === 'investor' && 'Market trends, ROI, opportunities'}
                        {r === 'citizen' && 'Societal impact, personal use, awareness'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => role && setStep(2)}
              disabled={!role}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Goal + Language */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What&apos;s your goal with AI news?
              </label>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder={`e.g., Stay updated on AI tools for my ${role} work`}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preferred language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 capitalize"
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l} className="capitalize">{l}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Email + Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Your Profile</h3>
              <div className="text-sm text-gray-600">
                <div>Role: <span className="font-medium capitalize">{role}</span></div>
                <div>Goal: <span className="font-medium">{goal || 'Exploring AI'}</span></div>
                <div>Language: <span className="font-medium capitalize">{language}</span></div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors"
              >
                {loading ? 'Setting up...' : 'Start Reading'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
