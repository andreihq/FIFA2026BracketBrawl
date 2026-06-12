import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/room-code'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Room name required' }, { status: 400 })

  const supabase = createServerClient()

  let id = generateRoomCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase.from('rooms').select('id').eq('id', id).single()
    if (!existing) break
    id = generateRoomCode()
    attempts++
  }

  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ id, name: name.trim(), created_by: session.playerId })
    .select()
    .single()

  if (error || !room) return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })

  await supabase.from('room_members').insert({ room_id: room.id, player_id: session.playerId })

  return NextResponse.json({ roomId: room.id })
}
