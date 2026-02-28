import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { userId, email, firstName, lastName, role } = await req.json()

    if (!userId || !email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create user profile in user_profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        language: 'english',
        goal: `Exploring AI as a ${role}`,
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ user: profileData })
  } catch (error: unknown) {
    console.error('Signup API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Signup failed'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
