import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_KEY!

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // Create client with token and verify user
    const supabaseUser = createClient(supabaseUrl, anonKey)
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Use service role to fetch profile (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    let profile = profiles && profiles.length > 0 ? profiles[0] : null

    // If no profile exists, create a minimal one
    if (!profile) {
      console.log(`Creating fallback profile for user ${user.id}`)
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
          role: user.user_metadata?.role || 'student',
          language: user.user_metadata?.language || 'English',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create fallback profile:', insertError)
        // Return minimal user object so they can still log in
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || 'User',
            last_name: user.user_metadata?.last_name || '',
            role: user.user_metadata?.role || 'student',
            language: user.user_metadata?.language || 'English',
          },
        })
      }

      profile = newProfile
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('GET /api/auth/user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    const { updates } = await req.json()

    // Create client with token and verify user
    const supabaseUser = createClient(supabaseUrl, anonKey)
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Use service role to update profile (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)
    const { data: profiles, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 400 }
      )
    }

    const profile = profiles && profiles.length > 0 ? profiles[0] : null

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('PUT /api/auth/user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
