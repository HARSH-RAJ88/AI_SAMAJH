import { UserRole, ArticleCategory } from './types'

/** Role display configuration */
export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: string }> = {
  student: { label: 'Student', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🎓' },
  professional: { label: 'Professional', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '💼' },
  business: { label: 'Business', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '🏢' },
  investor: { label: 'Investor', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '📈' },
  citizen: { label: 'Citizen', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: '🏠' },
}

/** Category display configuration */
export const CATEGORY_CONFIG: Record<ArticleCategory, { label: string; color: string; bg: string }> = {
  research: { label: 'Research', color: 'text-blue-600', bg: 'bg-blue-50' },
  product: { label: 'Product', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  funding: { label: 'Funding', color: 'text-amber-600', bg: 'bg-amber-50' },
  regulation: { label: 'Regulation', color: 'text-red-600', bg: 'bg-red-50' },
  opinion: { label: 'Opinion', color: 'text-purple-600', bg: 'bg-purple-50' },
}

/** Supported languages */
export const LANGUAGES = [
  'english', 'hindi', 'tamil', 'telugu', 'bengali',
  'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'odia'
]

/** Credibility badge from score */
export function getCredibilityBadge(score: number): { badge: string; label: string } {
  if (score >= 80) return { badge: '⭐⭐⭐⭐⭐', label: 'Highly Credible' }
  if (score >= 50) return { badge: '⭐⭐⭐', label: 'Credible' }
  return { badge: '⚠️', label: 'Unverified' }
}

/** Format date for display */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Recently'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return 'Recently'
  }
}
