'use client'

import { UserRole } from '@/lib/types'
import { ROLE_CONFIG } from '@/lib/constants'

interface AvatarProps {
  firstName: string
  lastName: string
  role: UserRole
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ firstName, lastName, role, size = 'md' }: AvatarProps) {
  const roleConfig = ROLE_CONFIG[role]
  
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  return (
    <div className="flex items-center gap-2">
      {/* Avatar with initials */}
      <div className={`${sizeClasses[size]} rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 border border-indigo-200`}>
        {initials}
      </div>
      
      {/* Role badge */}
      <span className={`inline-flex items-center gap-1 rounded-full border text-xs font-medium px-2 py-0.5 ${roleConfig.bg} ${roleConfig.color}`}>
        <span>{roleConfig.icon}</span>
        <span>{roleConfig.label}</span>
      </span>
    </div>
  )
}
