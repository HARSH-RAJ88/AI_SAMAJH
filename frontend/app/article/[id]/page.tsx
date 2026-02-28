'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Article, ArticleContext, UserProfile, UserRole } from '@/lib/types'
import { CATEGORY_CONFIG, getCredibilityBadge, formatDate, ROLE_CONFIG } from '@/lib/constants'
import WhyItMattersBox from '@/components/WhyItMattersBox'
import ActionItemsList from '@/components/ActionItemsList'
import Chat from '@/components/Chat'

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [context, setContext] = useState<ArticleContext | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ai_samajh_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (!id) return
    const fetchArticle = async () => {
      setLoading(true)
      try {
        const role: UserRole = user?.role || 'citizen'

        const { data: articleData } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single()

        if (articleData) {
          setArticle(articleData)

          const { data: contextData } = await supabase
            .from('article_contexts')
            .select('*')
            .eq('article_id', id)
            .eq('user_role', role)
            .single()

          if (contextData) setContext(contextData)
        }
      } catch (err) {
        console.error('Error fetching article:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [id, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading article…</div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400 text-lg">Article not found</p>
        <button onClick={() => router.push('/dashboard')} className="text-indigo-600 text-sm hover:underline">
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const categoryConfig = CATEGORY_CONFIG[article.category]
  const cred = getCredibilityBadge(article.credibility)
  const role: UserRole = user?.role || 'citizen'
  const roleConfig = ROLE_CONFIG[role]
  const relevance = article.relevance_scores?.[role] ?? 50

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Back
          </button>
          <Link href="/dashboard" className="text-sm font-bold text-indigo-600">
            AI Samajh
          </Link>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Category + Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryConfig.bg} ${categoryConfig.color}`}>
            {categoryConfig.label}
          </span>
          <span className="text-xs text-gray-400">{formatDate(article.published_at)}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{article.source}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
          {article.title}
        </h1>

        {/* Credibility + Relevance row */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>{cred.badge}</span>
            <span>{cred.label}</span>
            <span className="text-gray-300 ml-1">({article.credibility}/100)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>{roleConfig.icon}</span>
            <span>{relevance}% relevant for {roleConfig.label}</span>
          </div>
        </div>

        {/* Relevance bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-8">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${Math.min(relevance, 100)}%` }}
          />
        </div>

        {/* ELI5 */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Simple Explanation
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-700 leading-relaxed">{article.eli5}</p>
          </div>
        </section>

        {/* Localized ELI5 (if available and not English) */}
        {context?.localized_eli5 && user?.language && user.language !== 'english' && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              In {user.language.charAt(0).toUpperCase() + user.language.slice(1)}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-700 leading-relaxed">{context.localized_eli5}</p>
            </div>
          </section>
        )}

        {/* Why It Matters */}
        {context?.why_it_matters && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Why It Matters — {roleConfig.icon} {roleConfig.label}
            </h2>
            <WhyItMattersBox context={context} />
          </section>
        )}

        {/* Action Items */}
        {context?.action_items && context.action_items.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              What You Can Do
            </h2>
            <ActionItemsList items={context.action_items} />
          </section>
        )}

        {/* Original Text (collapsible) */}
        <section className="mb-8">
          <details className="group">
            <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors">
              Full Original Text ▸
            </summary>
            <div className="mt-3 bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {article.original_text}
              </p>
            </div>
          </details>
        </section>

        {/* Source link */}
        <div className="border-t border-gray-100 pt-4">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Read original source →
          </a>
        </div>
      </main>

      <Chat />
    </div>
  )
}
