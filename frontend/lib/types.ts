/** User role types supported by AI Samajh */
export type UserRole = 'student' | 'professional' | 'business' | 'investor' | 'citizen'

/** Article category types */
export type ArticleCategory = 'research' | 'product' | 'funding' | 'regulation' | 'opinion'

/** User profile stored in Supabase */
export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  goal: string
  language: string
  industry?: string
  ai_score: number
  created_at: string
}

/** Article from the articles table */
export interface Article {
  id: string
  title: string
  url: string
  source: string
  category: ArticleCategory
  original_text: string
  eli5: string
  credibility: number
  published_at: string
  processed_at: string
  relevance_scores: {
    student: number
    professional: number
    business: number
    investor: number
    citizen: number
  }
}

/** Action item for an article context */
export interface ActionItem {
  label: string
  description: string
  url: string
  type: 'tool' | 'tutorial' | 'job' | 'analysis'
  time_estimate: string
}

/** Role-specific context for an article */
export interface ArticleContext {
  id: string
  article_id: string
  user_role: UserRole
  why_it_matters: string
  action_items: ActionItem[]
  language: string
  localized_eli5?: string
}

/** Combined article with its role-specific context */
export interface ArticleWithContext extends Article {
  context?: ArticleContext
}

/** Chat message */
export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  message: string
  created_at: string
}
