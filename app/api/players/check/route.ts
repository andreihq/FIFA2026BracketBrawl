import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim().toLowerCase()
  if (!username || username.length < 2 || username.length > 20) {
    return NextResponse.json({ available: false, error: 'Username must be 2–20 characters' }, { status: 400 })
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, error: 'Only letters, numbers, underscores' }, { status: 400 })
  }
  const supabase = createServerClient()
  const { data } = await supabase.from('players').select('id').eq('username', username).single()
  return NextResponse.json({ available: !data })
}
