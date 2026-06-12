import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const clean = username?.trim().toLowerCase()
  if (!clean || clean.length < 2 || clean.length > 20 || !/^[a-z0-9_]+$/.test(clean)) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: existing } = await supabase.from('players').select('id').eq('username', clean).single()
  if (existing) return NextResponse.json({ error: 'Username taken' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, 10)
  const { data: player, error } = await supabase
    .from('players')
    .insert({ username: clean, password_hash })
    .select()
    .single()

  if (error || !player) {
    console.error('[register] insert error:', error)
    return NextResponse.json({ error: 'Registration failed', detail: error?.message }, { status: 500 })
  }

  const session = await getSession()
  session.playerId = player.id
  session.username = player.username
  await session.save()

  return NextResponse.json({ username: player.username })
}
