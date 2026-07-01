import { NextResponse } from 'next/server'
import { fetchEspnResults } from '@/lib/espn'
import { isAdminRequest } from '@/lib/session'

export async function GET() {
  if (!(await isAdminRequest())) {
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
