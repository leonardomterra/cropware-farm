-- Cropware Farm V2 - Centros de Custo (Fase 1).
-- Tabela CC + limite de 6 ativos por org + ALTER farm_receipts + backfill "Geral".

create table public.farm_cost_centers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  color text default '#64748b',
  icon text,
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz default now(),
  unique (organization_id, slug)
);

create index farm_cc_org_active_idx
  on public.farm_cost_centers(organization_id)
  where archived_at is null;

-- Limite de 6 CCs ativos por org (V1 hardcoded; V2 -> coluna em organizations).
create or replace function public.farm_cc_check_limit()
returns trigger language plpgsql as $$
declare cnt int;
begin
  select count(*) into cnt
    from public.farm_cost_centers
    where organization_id = new.organization_id and archived_at is null;
  if cnt >= 6 then
    raise exception 'Limite de 6 centros de custo ativos atingido. Arquive um antes de criar outro.';
  end if;
  return new;
end $$;

create trigger farm_cc_limit
  before insert on public.farm_cost_centers
  for each row execute function public.farm_cc_check_limit();

alter table public.farm_cost_centers enable row level security;

create policy "cc read by org members" on public.farm_cost_centers
  for select using (
    organization_id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
  );

create policy "cc write by admins" on public.farm_cost_centers
  for all using (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_cost_centers.organization_id
        and role in ('owner','admin')
    )
  ) with check (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_cost_centers.organization_id
        and role in ('owner','admin')
    )
  );

grant select, insert, update, delete on public.farm_cost_centers to authenticated;

-- ALTER farm_receipts: cost_center_id
alter table public.farm_receipts
  add column cost_center_id uuid references public.farm_cost_centers(id) on delete set null;

create index farm_receipts_cc_idx on public.farm_receipts(cost_center_id);

-- Backfill: criar CC "Geral" por org e atribuir aos receipts existentes.
do $$
declare org_rec record; new_cc_id uuid;
begin
  for org_rec in select id from public.organizations loop
    insert into public.farm_cost_centers (organization_id, slug, name, is_default, color)
      values (org_rec.id, 'geral', 'Geral', true, '#64748b')
      on conflict (organization_id, slug) do nothing
      returning id into new_cc_id;
    if new_cc_id is null then
      select id into new_cc_id
        from public.farm_cost_centers
        where organization_id = org_rec.id and slug = 'geral';
    end if;
    update public.farm_receipts
      set cost_center_id = new_cc_id
      where organization_id = org_rec.id and cost_center_id is null;
  end loop;
end $$;
