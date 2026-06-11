create table players (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

create table rooms (
  id text primary key,
  name text not null,
  created_by uuid references players(id) not null,
  created_at timestamptz default now()
);

create table room_members (
  room_id text references rooms(id) not null,
  player_id uuid references players(id) not null,
  joined_at timestamptz default now(),
  primary key (room_id, player_id)
);

create table brackets (
  id uuid primary key default gen_random_uuid(),
  player_id uuid unique references players(id) not null,
  submitted_at timestamptz,
  locked boolean not null default false
);

create table group_predictions (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid references brackets(id) not null,
  group_code text not null,
  team_code text not null,
  predicted_pos int not null check (predicted_pos between 1 and 3),
  unique (bracket_id, group_code, predicted_pos)
);

create table knockout_predictions (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid references brackets(id) not null,
  match_id text not null,
  predicted_winner text not null,
  unique (bracket_id, match_id)
);

create table actual_results (
  id uuid primary key default gen_random_uuid(),
  result_type text not null check (result_type in ('group', 'knockout')),
  ref_id text not null,
  team_code text not null,
  position int,
  entered_at timestamptz default now()
);
