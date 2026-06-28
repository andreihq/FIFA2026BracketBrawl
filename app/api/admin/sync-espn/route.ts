import { NextRequest, NextResponse } from 'next/server'
import { fetchEspnResults } from '@/lib/espn'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await fetchEspnResults()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'ESPN fetch failed' },
      { status: 502 },
    )
  }
}
