# FIFA 2026 World Cup Bracket Predictor

A web app for predicting the FIFA 2026 World Cup bracket. Users register, fill in their group stage rankings and knockout picks, join private leagues to compete with friends, and accumulate points as real results come in.

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Postgres database)
- **iron-session** (encrypted cookie auth)
- **Tailwind CSS**
- **dnd-kit** (drag-and-drop bracket editing)

## Features

- Register / login with username and password
- Predict all 12 group stage rankings and every knockout round up to the champion
- Submit bracket before the configurable deadline
- Create or join private leagues with a short code; live leaderboard with scores
- Admin panel at `/admin` to enter actual results and set the submission deadline
- Automatic scoring as results are entered

## Local Development

**1. Clone and install**

```bash
git clone <repo-url>
cd fifa2026bracketpreditor
npm install
```

**2. Create a Supabase project**

Go to [supabase.com](https://supabase.com), create a new project, then run all migrations in order from the Supabase SQL editor:

```
supabase/migrations/001_initial.sql
supabase/migrations/002_rename_rooms_to_leagues.sql
supabase/migrations/003_settings_table.sql
supabase/migrations/004_cleanup_stale_predictions.sql
supabase/migrations/005_remove_best3rd_entries.sql
supabase/migrations/006_rename_pin_hash_to_password_hash.sql
```

**3. Set up environment variables**

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `SESSION_SECRET` | Any random 32+ character string: `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | A password you choose for the `/admin` panel |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

**4. Run**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add all five environment variables in Vercel → Settings → Environment Variables
4. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://yourapp.vercel.app`)
5. Deploy — Vercel auto-detects Next.js and runs `next build`

## Admin Panel

Go to `/admin` and enter the `ADMIN_PASSWORD` to:

- Enter group stage results (drag teams into final order per group)
- Enter knockout round winners
- Set the bracket submission deadline

Once the deadline passes, all brackets are locked and no further changes are allowed.
