create table if not exists public.kelo_catalog (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  vertical text not null check (vertical in ('watches','zara','moissanite')),
  sku text not null,
  name text not null,
  active boolean not null default true,
  pricing jsonb not null default '{}'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(workspace, vertical, sku)
);

create index if not exists kelo_catalog_workspace_vertical
  on public.kelo_catalog(workspace, vertical, active);

alter table public.kelo_catalog enable row level security;

insert into public.kelo_catalog (workspace,vertical,sku,name,active,pricing,attributes)
values
('default','watches','WATCH-CORE','Relojes',true,
 '{"currency":"USD","base_price":200,"with_box_price":285}'::jsonb,
 '{"variant_dimensions":["model","style","box"],"fulfillment":["pickup","delivery"],"stock_required":true}'::jsonb),
('default','zara','ZARA-UNIT','Ropa Zara',true,
 '{"currency":"USD","tiers":[{"min_qty":1,"unit_price":25},{"min_qty":28,"unit_price":19},{"min_qty":200,"unit_price":15}]}'::jsonb,
 '{"variant_dimensions":["category","size","color"],"fulfillment":["pickup","delivery"],"stock_required":true}'::jsonb),
('default','moissanite','MOISS-EARRINGS','Aretes de moissanita',true,
 '{"currency":"USD","requires_configured_price":true}'::jsonb,
 '{"variant_dimensions":["stone_size","metal","finish"],"fulfillment":["pickup","delivery"],"stock_required":true}'::jsonb)
on conflict (workspace,vertical,sku) do update set
  name=excluded.name,
  active=excluded.active,
  pricing=excluded.pricing,
  attributes=excluded.attributes,
  updated_at=now();

-- Catalog stays private to the Data API. Edge Functions use the server secret.
-- Deliberately no anon/authenticated RLS policy.