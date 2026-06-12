import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'deadline').single()
  return NextResponse.json({ deadline: data?.value ?? null })
}
