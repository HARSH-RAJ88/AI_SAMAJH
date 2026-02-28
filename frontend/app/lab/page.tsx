'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserProfile } from '@/lib/types'

interface LabResult {
  summary?: string
  answer?: string
  category?: string
  credibility_estimate?: number
  key_points?: string[]
  relevance_note?: string
}

export default function LabPage() {
  const [text, setText] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<LabResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('ai_samajh_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
  }, [])

  const handleAnalyze = async () => {
    if (!text.trim() || !question.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          question: question.trim(),
          role: user?.role || 'citizen',
        }),
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data.result)
      }
    } catch {
      setError('Failed to analyze. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Dashboard
          </Link>
          <span className="text-sm font-bold text-indigo-600">AI Samajh Lab</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Lab</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Paste any AI news text and ask questions about it
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Paste article or text
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste any AI news article, press release, or text here…"
              rows={6}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Your question
            </label>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. How does this affect Indian startups?"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim() || !question.trim()}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5">
            {/* Answer */}
            {result.answer && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Answer
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{result.answer}</p>
                </div>
              </section>
            )}

            {/* Summary */}
            {result.summary && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Summary
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
                </div>
              </section>
            )}

            {/* Key Points */}
            {result.key_points && result.key_points.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Key Points
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <ul className="space-y-2">
                    {result.key_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Relevance Note */}
            {result.relevance_note && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Relevance for You
                </h2>
                <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
                  <p className="text-sm text-indigo-800 leading-relaxed">{result.relevance_note}</p>
                </div>
              </section>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-4 pt-2 text-xs text-gray-400">
              {result.category && (
                <span>Category: <span className="text-gray-600">{result.category}</span></span>
              )}
              {result.credibility_estimate !== undefined && (
                <span>Credibility: <span className="text-gray-600">{result.credibility_estimate}/100</span></span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
