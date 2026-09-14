-- Kelo Associates universal CRM schema
-- Designed for PostgreSQL / Supabase. Frontend V0.1 still runs locally.

create extension if not exists pgcrypto;

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  status text not null default 'warm' check (status in ('hot','warm','cold','inactive')),
  owner_id uuid references agents(id) on delete set null,
  source text,
  followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_phone_idx on clients(phone);
create index if not exists clients_owner_idx on clients(owner_id);

create table if not exists client_interests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  vertical text not null,
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  account_name text not null,
  external_identifier text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  channel_id uuid not null references channels(id) on delete restrict,
  external_id text,
  status text not null default 'open',
  unread_count integer not null default 0,
  lead_temperature text default 'warm',
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists conversations_client_idx on conversations(client_id);
create index if not exists conversations_channel_idx on conversations(channel_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  external_id text,
  direction text not null check (direction in ('in','out')),
  body text,
  status text,
  sent_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists messages_conversation_time_idx on messages(conversation_id,sent_at desc);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  vertical text not null,
  date_time timestamptz not null,
  location text,
  status text not null default 'scheduled',
  assigned_agent_id uuid references agents(id) on delete set null,
  estimated_value numeric(12,2) not null default 0,
  notes text,
  vertical_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists appointments_date_idx on appointments(date_time);
create index if not exists appointments_client_idx on appointments(client_id);

create table if not exists appointment_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  prepared boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'pending',
  priority text not null default 'medium',
  kind text not null default 'manual',
  assigned_agent_id uuid references agents(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists tasks_due_idx on tasks(status,due_at);

create table if not exists reminder_rules (
  id uuid primary key default gen_random_uuid(),
  organization_key text not null default 'default',
  rule_key text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  unique(organization_key,rule_key)
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  vertical text not null,
  estimated_value numeric(12,2) not null default 0,
  stage text not null,
  source text,
  assigned_agent_id uuid references agents(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  object_type text not null,
  object_id uuid not null,
  agent_id uuid references agents(id) on delete set null,
  assigned_by uuid references agents(id) on delete set null,
  assigned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  opportunity_id uuid references opportunities(id) on delete set null,
  vertical text not null,
  amount numeric(12,2) not null default 0,
  commission numeric(12,2) not null default 0,
  agent_id uuid references agents(id) on delete set null,
  channel_id uuid references channels(id) on delete set null,
  closed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  actor_agent_id uuid references agents(id) on delete set null,
  type text not null,
  text text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists timeline_client_time_idx on timeline_events(client_id,created_at desc);

create table if not exists integration_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  display_name text not null,
  external_identifier text,
  status text not null default 'disconnected',
  secret_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Secrets must live in server-side secret storage. Never put provider access tokens in this table,
-- the browser bundle, localStorage, or repository.
