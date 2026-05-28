-- Cropware Farm V2 - RBAC multi-usuario (Fase 1).
-- Roles owner/admin/member + junction farm_user_cost_centers + RLS role/CC-aware.

-- 1) Enum de role em users_meta.
alter table public.users_meta
  add constraint users_meta_role_check check (role in ('owner','admin','member'));

-- 2) Junction: subset de CCs por user.
create table public.farm_user_cost_centers (
  user_id uuid not null references auth.users(id) on delete cascade,
  cost_center_id uuid not null references public.farm_cost_centers(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, cost_center_id)
);

create index fucc_user_idx on public.farm_user_cost_centers(user_id);
create index fucc_org_idx on public.farm_user_cost_centers(organization_id);

alter table public.farm_user_cost_centers enable row level security;

create policy "fucc read self or admin" on public.farm_user_cost_centers
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_user_cost_centers.organization_id
        and role in ('owner','admin')
    )
  );

create policy "fucc write by admins" on public.farm_user_cost_centers
  for all using (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_user_cost_centers.organization_id
        and role in ('owner','admin')
    )
  ) with check (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_user_cost_centers.organization_id
        and role in ('owner','admin')
    )
  );

grant select, insert, delete on public.farm_user_cost_centers to authenticated;

-- 3) Helper SQL: user atual pode acessar este CC?
create or replace function public.farm_user_can_access_cc(p_user_id uuid, p_cc_id uuid)
returns boolean language sql stable as $$
  select
    exists (
      select 1 from public.users_meta um
      join public.farm_cost_centers cc on cc.organization_id = um.organization_id
      where um.user_id = p_user_id and cc.id = p_cc_id and um.role in ('owner','admin')
    )
    or exists (
      select 1 from public.farm_user_cost_centers
      where user_id = p_user_id and cost_center_id = p_cc_id
    );
$$;

-- 4) RLS de farm_receipts: org + (admin/owner OR cc liberado OR cc IS NULL legacy)
drop policy if exists "receipts scoped to org" on public.farm_receipts;

create policy "receipts scoped by role and cc" on public.farm_receipts
  for all using (
    organization_id in (
      select organization_id from public.users_meta where user_id = auth.uid()
    )
    and (
      exists (
        select 1 from public.users_meta
        where user_id = auth.uid()
          and organization_id = farm_receipts.organization_id
          and role in ('owner','admin')
      )
      or cost_center_id is null
      or public.farm_user_can_access_cc(auth.uid(), farm_receipts.cost_center_id)
    )
  );

-- 5) users_meta RLS: admin le/edita role+org de membros da propria org
create policy "members read same org" on public.users_meta
  for select using (
    organization_id in (
      select organization_id from public.users_meta um where um.user_id = auth.uid()
    )
  );

create policy "admin updates members" on public.users_meta
  for update using (
    exists (
      select 1 from public.users_meta um
      where um.user_id = auth.uid()
        and um.organization_id = users_meta.organization_id
        and um.role in ('owner','admin')
    )
  );
