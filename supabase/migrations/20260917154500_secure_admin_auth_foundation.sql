create table if not exists public.kelo_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','operator')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kelo_admins enable row level security;

-- No browser-facing policy: membership is checked only by server-side Edge Functions.
-- A user must possess both a valid Supabase Auth session and an active row here.