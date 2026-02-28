'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Article, ArticleWithContext, ArticleContext, UserRole, ArticleCategory } from '@/lib/types'
import { CATEGORY_CONFIG } from '@/lib/constants'
import Navbar from '@/components/Navbar'
import ArticleCard from '@/components/ArticleCard'
import Chat from '@/components/Chat'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [articles, setArticles] = useState<ArticleWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<ArticleCategory | 'all'>('all')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch articles and contexts
  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const role: UserRole = user.role

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(50)

      if (articlesError) throw articlesError

      // Fetch contexts for user role
      const articleIds = (articlesData || []).map((a: Article) => a.id)
      let contextsData: ArticleContext[] = []

      if (articleIds.length > 0) {
        const { data: contexts } = await supabase
          .from('article_contexts')
          .select('*')
          .eq('user_role', role)
          .in('article_id', articleIds)

        contextsData = contexts || []
      }

      // Merge articles with contexts
      const contextMap = new Map(contextsData.map(c => [c.article_id, c]))
      const merged: ArticleWithContext[] = (articlesData || []).map((article: Article) => ({
        ...article,
        context: contextMap.get(article.id),
      }))

      // Sort by relevance for current role
      merged.sort((a, b) => {
        const scoreA = a.relevance_scores?.[role] ?? 50
        const scoreB = b.relevance_scores?.[role] ?? 50
        return scoreB - scoreA
      })

      setArticles(merged)
    } catch (err) {
      console.error('Error fetching articles:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  const filteredArticles = filter === 'all'
    ? articles
    : articles.filter(a => a.category === filter)

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  // Should not reach here due to redirect, but just in case
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <p className="text-gray-400">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Greeting + Refresh */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Your AI News Feed
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sorted by relevance for you · {filteredArticles.length} articles
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_CONFIG) as ArticleCategory[]).map(cat => {
            const config = CATEGORY_CONFIG[cat]
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                  filter === cat
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {config.label}
              </button>
            )
          })}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-20 bg-gray-100 rounded mb-3" />
                <div className="h-16 bg-indigo-50 rounded" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No articles found</p>
            <p className="text-sm">Run the pipeline to ingest articles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      <Chat />
    </div>
  )
}
