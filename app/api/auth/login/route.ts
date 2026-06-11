import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, pin } = await req.json()

  const clean = username?.trim().toLowerCase()
  if (!clean || typeof pin !== 'string') {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: player } = await supabase
    .from('players')
    .select('id, username, pin_hash')
    .eq('username', clean)
    .single()

  if (!player) return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 })

  const valid = await bcrypt.compare(pin, player.pin_hash)
  if (!valid) return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 })

  const session = await getSession()
  session.playerId = player.id
  session.username = player.username
  await session.save()

  return NextResponse.json({ username: player.username })
}
