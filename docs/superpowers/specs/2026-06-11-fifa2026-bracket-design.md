# FIFA 2026 World Cup Bracket Predictor — Design Spec

**Date:** 2026-06-11  
**Submission deadline:** 2026-06-14 23:59  
**Stack:** Next.js 14 (App Router) + Supabase (Postgres) + Vercel

---

## 1. Overview

A web app where friend groups create rooms, each player submits one bracket prediction before the tournament starts, and the leaderboard tracks who predicted best as results come in.

---

## 2. Pages & Routing

### Unauthenticated (redirect all other routes to `/`)

| Route | Description |
|---|---|
| `/` | Landing — Register button + Login button only. No room previews. |
| `/register` | Pick username (check availability in real time) → set 4-digit PIN → create account |
| `/login` | Enter username + PIN → set session cookie → redirect to `/dashboard` |

### Authenticated

| Route | Description |
|---|---|
| `/dashboard` | My bracket status + deadline countdown + my rooms list + create/join room |
| `/bracket` | My bracket — editable before deadline, read-only after |
| `/room/[roomId]` | Room leaderboard + player list — click a player name to view their bracket |
| `/player/[username]` | Read-only bracket view for any player |
| `/admin` | Password-protected — enter actual match results, triggers score recalculation |

All authenticated routes redirect to `/` if no valid session is present.

---

## 3. Authentication

- Players register with a **username** (unique, checked on input) and a **4-digit PIN**.
- PIN is stored as a **bcrypt hash** — never plain text.
- On login, a signed **session cookie** (via Next.js `iron-session` or similar) is set. No third-party auth service.
- A player's bracket is the same across all rooms they join — one bracket per player globally.

---

## 4. Rooms

- Room IDs are generated on creation as `FIFA-` + 4 random uppercase alphanumeric characters (e.g. `FIFA-4X9K`). Collision is checked against existing IDs at creation time.
- Any authenticated player can create a room (they become its creator).
- Any authenticated player can join a room by entering the code from the dashboard.
- A room has a name and a list of members. There is no room admin role beyond the creator — all members see the same leaderboard.

---

## 5. Bracket Structure

### Tournament format — FIFA 2026

- **48 teams**, **12 groups** (A–L) of 4 teams each.
- Top 2 from each group advance automatically (24 teams). Best 8 third-placed teams also advance. Total 32 teams in knockout stage.
- Knockout rounds: **Round of 32** (16 matches) → **Round of 16** (8) → **Quarter-finals** (4) → **Semi-finals** (2) → **3rd place match** (1) + **Final** (1) = 32 knockout matches.

### Group Stage tab

- Player ranks all 4 teams in each of the 12 groups by **drag-to-rank**.
- Positions 1st, 2nd, 3rd are scored. 4th place is not scored and is visually de-emphasised.
- 36 predictions total (12 groups × 3 positions).

### Knockouts tab

- Pre-structured bracket with 32 matches hardcoded to match the official FIFA 2026 R32 seedings. All team data and bracket slot labels are hardcoded app constants (no external API).
- **Slots where both teams are determined by group rank** (e.g. "Group A 1st vs Group B 2nd") auto-populate team names from the player's group stage predictions.
- **Slots involving a 3rd-place wildcard** (FIFA assigns 8 of 12 third-place teams to specific R32 matches based on which groups they come from) are labeled with their official slot description (e.g. "Best 3rd from Groups A/B/C/D"). The player selects any team they expect to fill that slot and win — their group-stage 3rd-place predictions are shown as a hint but do not auto-fill these slots, since which 3rd-place teams actually advance is determined by group stage results.
- Player clicks to select the winner of each match, progressing left to right: R32 → R16 → QF → SF → 3rd place + Final.
- 32 predictions total.
- Knockout predictions cannot be saved until Group Stage is fully filled (all 36 positions set).

### Deadline & locking

- All predictions must be submitted by **2026-06-14 23:59** (hard-coded).
- After this timestamp, all brackets are locked. The edit page becomes read-only. The bracket `locked` flag is set server-side on any save attempt after the deadline.
- Players can save progress and return before the deadline — the bracket is not considered "submitted" until the player explicitly clicks Submit.

---

## 6. Scoring

Scores are **computed on read** by joining a player's predictions against the `actual_results` table. No cached score columns.

| Prediction | Points |
|---|---|
| Correct 1st/2nd/3rd place in a group | 1 pt each |
| Correct knockout match winner | 1 pt each |
| **Max possible** | **68 pts** (36 group + 32 knockout) |

The leaderboard shows Group Stage points and Knockout points as separate columns plus a Total column.

---

## 7. Data Model (Supabase Postgres)

### `players`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `username` | text UNIQUE | |
| `pin_hash` | text | bcrypt |
| `created_at` | timestamptz | |

### `rooms`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | e.g. `FIFA-4X9K` |
| `name` | text | |
| `created_by` | uuid FK → players | |
| `created_at` | timestamptz | |

### `room_members`
| Column | Type | Notes |
|---|---|---|
| `room_id` | text FK → rooms | PK composite |
| `player_id` | uuid FK → players | PK composite |
| `joined_at` | timestamptz | |

### `brackets`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `player_id` | uuid UNIQUE FK → players | one per player |
| `submitted_at` | timestamptz nullable | null = draft |
| `locked` | bool default false | set after deadline |

### `group_predictions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `bracket_id` | uuid FK → brackets | |
| `group_code` | text | "A"–"L" |
| `team_code` | text | e.g. "BRA" |
| `predicted_pos` | int | 1, 2, or 3 |

36 rows per player. Unique constraint on `(bracket_id, group_code, predicted_pos)` — one team per position per group.

### `knockout_predictions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `bracket_id` | uuid FK → brackets | |
| `match_id` | text | e.g. "R32-M1", "R16-M1", "QF-M1", "SF-M1", "3RD", "FINAL" |
| `predicted_winner` | text | team_code |

32 rows per player. Unique constraint on `(bracket_id, match_id)` — one prediction per match.

### `actual_results`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `result_type` | text | "group" or "knockout" |
| `ref_id` | text | group_code ("A") or match_id ("R32-M1") |
| `team_code` | text | winning team / placed team |
| `position` | int nullable | 1/2/3 for group results, null for knockout |
| `entered_at` | timestamptz | |

---

## 8. Admin Panel (`/admin`)

- Protected by a hard-coded environment variable password (`ADMIN_PASSWORD`).
- **Group results:** Select a group → assign 1st/2nd/3rd from a dropdown of the group's 4 teams → save. Can be entered incrementally as groups finish.
- **Knockout results:** Select a round → for each match, pick the winner from the two competing teams → save. Each save triggers score recomputation on next leaderboard load.
- Saving results does not require all matches in a round to be complete — partial entry is allowed.

---

## 9. Key UX Rules

- **Dashboard — bracket not submitted:** Shows a prominent deadline countdown and a large "Fill in my bracket →" CTA. Joining/creating rooms is available regardless of bracket status.
- **Dashboard — bracket submitted:** Shows current rank in each room, links to view/edit bracket (edit disabled after deadline).
- **Room view:** Leaderboard table with Rank / Player / GS pts / KO pts / Total. Clicking a player name navigates to `/player/[username]`. Logged-in player's row is highlighted with a "you" badge.
- **Bracket view for others:** Always read-only. Back button returns to the room the player was browsing.
- **Stage progress indicators:** Room view shows which stages have results entered (Group Stage done ✓, Round of 16 live ●, etc.).

---

## 10. Out of Scope

- Email notifications
- Social login / OAuth
- Mobile app
- Real-time websocket leaderboard updates (standard HTTP fetch on page load is sufficient)
- Ability to change username or PIN after registration
- Deleting a room or leaving a room
