create extension if not exists pgcrypto;

create table if not exists public.kelo_state (
  workspace text primary key,
  revision bigint not null default 0,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.kelo_inventory (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  vertical text not null check (vertical in ('watches','zara','moissanite')),
  sku text not null,
  variant_key text not null default 'default',
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique(workspace,vertical,sku,variant_key)
);

create table if not exists public.kelo_orders (
  id text primary key,
  workspace text not null,
  client_id text,
  vertical text not null check (vertical in ('watches','zara','moissanite')),
  status text not null default 'draft',
  total numeric(12,2) not null default 0,
  payment_provider_id text,
  payment_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kelo_messages (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  channel text not null check (channel in ('sms','whatsapp')),
  direction text not null check (direction in ('in','out')),
  to_address text,
  from_address text,
  body text not null default '',
  provider_id text,
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.kelo_audit (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  event_type text not null,
  object_type text,
  object_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kelo_inventory_lookup on public.kelo_inventory(workspace,vertical,sku,variant_key);
create index if not exists kelo_orders_workspace_status on public.kelo_orders(workspace,status,updated_at desc);
create index if not exists kelo_messages_workspace_created on public.kelo_messages(workspace,created_at desc);
create index if not exists kelo_audit_workspace_created on public.kelo_audit(workspace,created_at desc);

alter table public.kelo_state enable row level security;
alter table public.kelo_inventory enable row level security;
alter table public.kelo_orders enable row level security;
alter table public.kelo_messages enable row level security;
alter table public.kelo_audit enable row level security;

-- Deliberately no public RLS policies. The Edge Functions use a secret server-side key.
-- Browser clients never receive database secret keys and cannot query these tables directly.
