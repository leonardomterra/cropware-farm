-- Cropware Farm V2 - Fix recursao RLS em users_meta.
-- A policy "members read same org" da migration 20260528110000_farm_rbac.sql
-- referenciava users_meta no proprio USING, causando RLS recursivo
-- (qualquer SELECT em users_meta dispara avaliacao da policy que precisa
-- de outro SELECT em users_meta -> falha). Sintoma: GET /auth/me retornava
-- 403 "no_organization" pra todos os usuarios mesmo com row valida.
--
-- Fix: funcao SECURITY DEFINER que bypassa RLS pra resolver o org_id do
-- user atual, e a policy passa a comparar com o retorno dela.

create or replace function public.farm_current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.users_meta where user_id = auth.uid() limit 1;
$$;

drop policy if exists "members read same org" on public.users_meta;

create policy "members read same org" on public.users_meta
  for select using (
    organization_id = public.farm_current_org_id()
  );
