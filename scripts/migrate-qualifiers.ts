import { GROUPS } from '../data/groups'

// Build reverse map: team code → group letter
const TEAM_TO_GROUP: Record<string, string> = {}
for (const [group, teams] of Object.entries(GROUPS)) {
  for (const team of teams) TEAM_TO_GROUP[team] = group
}

/**
 * Convert old qualifier rows (match_id like 'M74', predicted_winner is a team code)
 * into a set of advancing group letters.
 */
export function migrateQualifiers(
  qualifierRows: Array<{ predicted_winner: string }>
): Set<string> {
  const groups = new Set<string>()
  for (const row of qualifierRows) {
    const group = TEAM_TO_GROUP[row.predicted_winner]
    if (group) groups.add(group)
  }
  return groups
}

// When run directly: execute migration against Supabase DB
async function runMigration() {
  // Read DB connection from env
  // Parse .env.local manually
  try {
    const fs = require('fs')
    const path = require('path')
    const envFile = path.join(__dirname, '../.env.local')
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8')
      for (const line of content.split('\n')) {
        const m = line.match(/^([A-Z_]+)=(.*)$/)
        if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch {}

  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all qualifier rows (match_id contains ':qualifier')
  const { data: rows, error } = await supabase
    .from('bracket_predictions')
    .select('bracket_id, match_id, predicted_winner')
    .like('match_id', '%:qualifier')
  if (error) { console.error(error); process.exit(1) }
  if (!rows?.length) { console.log('No qualifier rows found'); return }

  // Group by bracket_id
  const byBracket: Record<string, Array<{ predicted_winner: string }>> = {}
  for (const row of rows) {
    if (!byBracket[row.bracket_id]) byBracket[row.bracket_id] = []
    byBracket[row.bracket_id].push({ predicted_winner: row.predicted_winner })
  }

  for (const [bracketId, qualRows] of Object.entries(byBracket)) {
    const groups = migrateQualifiers(qualRows)
    const groupArray = Array.from(groups)
    const wildcards = groupArray.map((g, i) => ({
      bracket_id: bracketId,
      match_id: `WILDCARD_${i + 1}`,
      predicted_winner: g,
    }))
    if (wildcards.length) {
      const { error: upsertErr } = await supabase
        .from('bracket_predictions')
        .upsert(wildcards, { onConflict: 'bracket_id,match_id' })
      if (upsertErr) { console.error(`Bracket ${bracketId}:`, upsertErr); continue }
    }
    console.log(`Bracket ${bracketId}: migrated ${groups.size} groups →`, groupArray.join(', '))
  }
  console.log('Migration complete')
}

if (require.main === module) {
  runMigration().catch(e => { console.error(e); process.exit(1) })
}
