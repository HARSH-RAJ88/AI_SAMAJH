'use client'

import { ActionItem } from '@/lib/types'
import { ExternalLink, Clock } from 'lucide-react'

interface ActionItemsListProps {
  items: ActionItem[]
}

const TYPE_ICONS: Record<string, string> = {
  tool: '🔧',
  tutorial: '📚',
  job: '💼',
  analysis: '📊',
}

export default function ActionItemsList({ items }: ActionItemsListProps) {
  // Handle items being a JSON string instead of array
  let parsed = items
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed) } catch { parsed = [] }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Actions
      </h4>
      {parsed.map((item, idx) => (
        <a
          key={idx}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all group"
        >
          <span className="text-lg mt-0.5">{TYPE_ICONS[item.type] || '📌'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {item.label}
              </span>
              <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-indigo-400" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
            {item.time_estimate && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-400">{item.time_estimate}</span>
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
