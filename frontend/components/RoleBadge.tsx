'use client'

import { UserRole } from '@/lib/types'
import { ROLE_CONFIG } from '@/lib/constants'

interface RoleBadgeProps {
  role: UserRole
  size?: 'sm' | 'md'
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role]
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bg} ${config.color} ${sizeClasses}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
