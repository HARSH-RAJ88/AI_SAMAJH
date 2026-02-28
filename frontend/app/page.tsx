'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-gray-500">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo */}
        <div>
          <h1 className="text-5xl font-bold">
            <span className="text-indigo-600">AI</span>{' '}
            <span className="text-gray-900">Samajh</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            AI News That Makes Sense — For Every Indian
          </p>
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">
          Stop drowning in AI noise. Get personalized, contextualized AI news
          tailored to your role — whether you&apos;re a student, professional,
          business owner, investor, or citizen.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-2xl mb-1">🧠</div>
            <div className="text-sm font-medium text-gray-700">Understand</div>
            <div className="text-xs text-gray-400 mt-0.5">ELI5 for every article</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm font-medium text-gray-700">Relevance</div>
            <div className="text-xs text-gray-400 mt-0.5">Personalized for you</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-sm font-medium text-gray-700">Action</div>
            <div className="text-xs text-gray-400 mt-0.5">What to do next</div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          🇮🇳 Made for India · 10+ languages · Free forever
        </p>
      </div>
    </main>
  )
}
