'use client'

import { ArticleContext } from '@/lib/types'

interface WhyItMattersBoxProps {
  context: ArticleContext
}

export default function WhyItMattersBox({ context }: WhyItMattersBoxProps) {
  return (
    <div className="bg-indigo-50/60 border-l-4 border-indigo-400 rounded-r-lg p-4">
      <h4 className="text-sm font-semibold text-indigo-900 mb-1.5">
        Why this matters to YOU
      </h4>
      <p className="text-sm text-indigo-800 leading-relaxed">
        {context.why_it_matters}
      </p>
    </div>
  )
}
