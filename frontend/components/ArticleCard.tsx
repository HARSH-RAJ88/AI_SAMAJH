'use client'

import { ArticleWithContext, ArticleCategory } from '@/lib/types'
import { CATEGORY_CONFIG, getCredibilityBadge, formatDate } from '@/lib/constants'
import WhyItMattersBox from './WhyItMattersBox'
import ActionItemsList from './ActionItemsList'
import Link from 'next/link'

interface ArticleCardProps {
  article: ArticleWithContext
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const categoryConfig = CATEGORY_CONFIG[article.category as ArticleCategory] || CATEGORY_CONFIG.opinion
  const credibility = getCredibilityBadge(article.credibility)
  const relevance = article.context
    ? Math.round((article.relevance_scores?.[article.context.user_role] ?? 50))
    : 50

  return (
    <article className="bg-white rounded-xl border border-gray-200/80 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Header: Category + Credibility + Relevance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryConfig.bg} ${categoryConfig.color}`}>
              {categoryConfig.label}
            </span>
            <span className="text-xs text-gray-400" title={credibility.label}>
              {credibility.badge}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${relevance}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{relevance}%</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/article/${article.id}`}>
          <h2 className="text-lg font-semibold text-gray-900 leading-snug hover:text-indigo-600 transition-colors cursor-pointer">
            {article.title}
          </h2>
        </Link>

        {/* Source + Date */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium text-gray-500">{article.source || 'Unknown'}</span>
          <span>·</span>
          <span>{formatDate(article.published_at)}</span>
        </div>

        {/* ELI5 */}
        {article.eli5 && (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
            {article.eli5.length > 280 ? article.eli5.slice(0, 280) + '...' : article.eli5}
          </p>
        )}

        {/* Why it matters */}
        {article.context && (
          <WhyItMattersBox context={article.context} />
        )}

        {/* Action items */}
        {article.context?.action_items && article.context.action_items.length > 0 && (
          <ActionItemsList items={article.context.action_items.slice(0, 3)} />
        )}

        {/* Read more */}
        <div className="pt-1">
          <Link
            href={`/article/${article.id}`}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Read full analysis →
          </Link>
        </div>
      </div>
    </article>
  )
}
