import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { email, role, goal, language } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    const validRoles = ['student', 'professional', 'business', 'investor', 'citizen']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        email,
        role,
        goal: goal || `Exploring AI as a ${role}`,
        language: language || 'english',
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate email
      if (error.code === '23505') {
        // User already exists — fetch existing profile
        const { data: existing } = await supabase
          .from('user_profiles')
          .select()
          .eq('email', email)
          .single()

        if (existing) {
          return NextResponse.json({ user: existing })
        }
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data })
  } catch (error: unknown) {
    console.error('Onboard API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
