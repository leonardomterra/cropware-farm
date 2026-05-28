-- Cropware Farm V2 - Convites por codigo de 6 digitos.

create table public.farm_org_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null unique,
  invited_by uuid not null references auth.users(id),
  invited_name text,
  invited_email text,
  role text not null default 'member' check (role in ('admin','member')),
  cost_center_ids uuid[] not null default '{}',
  used boolean not null default false,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index foi_code_active_idx on public.farm_org_invites(code) where used = false;
create index foi_org_idx on public.farm_org_invites(organization_id);

alter table public.farm_org_invites enable row level security;

create policy "invites managed by admins" on public.farm_org_invites
  for all using (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_org_invites.organization_id
        and role in ('owner','admin')
    )
  ) with check (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_org_invites.organization_id
        and role in ('owner','admin')
    )
  );

grant select, insert, update on public.farm_org_invites to authenticated;
