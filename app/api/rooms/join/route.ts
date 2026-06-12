import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase'
import { isValidRoomCode } from '@/lib/room-code'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomId } = await req.json()
  if (!roomId || !isValidRoomCode(roomId)) {
    return NextResponse.json({ error: 'Invalid room code format' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: room } = await supabase.from('rooms').select('id').eq('id', roomId).single()
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const { data: existing } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('player_id', session.playerId)
    .single()

  if (!existing) {
    await supabase.from('room_members').insert({ room_id: roomId, player_id: session.playerId })
  }

  return NextResponse.json({ roomId })
}
