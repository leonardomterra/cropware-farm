-- Cropware Farm - signup com 3 CCs default (em vez de so "Geral").
--
-- Decisao 2026-05-30: pivot pra modelo CC-only de organizacao financeira.
-- Fazenda fica como conceito legado (tabela mantida, rota /fazendas
-- valida, mas escondida do menu). CC e' o bucket universal pra qualquer
-- perfil de usuario (produtor solo, agronomo, revenda).
--
-- Pra novo signup (caminho B - owner novo, sem invite) criamos 3 CCs
-- arquetipicos em vez de 1 "Geral" cinza. Mostra ao usuario a flexi-
-- bilidade do conceito desde o primeiro acesso. Sobram 3 dos 6 slots
-- pra customizacao (ex: "Fazenda Boa Vista", "Reembolsos").
--
-- Caminho A (signup via invite) nao muda - CCs vem do invite_rec.

create or replace function public.handle_new_farm_user()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
declare
  invite_code text;
  invite_rec public.farm_org_invites%rowtype;
  new_org_id uuid;
  trial_end timestamptz;
  signup_farm_name text;
  signup_full_name text;
  cc_id uuid;
begin
  invite_code := nullif(trim(new.raw_user_meta_data ->> 'farm_invite_code'), '');

  -- (A) Fluxo de convite
  if invite_code is not null then
    select * into invite_rec
      from public.farm_org_invites
      where code = invite_code and used = false and expires_at > now()
      limit 1;

    if not found then
      raise exception 'Codigo de convite invalido ou expirado.';
    end if;

    insert into public.users_meta (user_id, organization_id, role, full_name, phone)
    values (
      new.id,
      invite_rec.organization_id,
      invite_rec.role,
      coalesce(new.raw_user_meta_data ->> 'full_name', invite_rec.invited_name, ''),
      new.raw_user_meta_data ->> 'phone'
    );

    if array_length(invite_rec.cost_center_ids, 1) > 0 then
      foreach cc_id in array invite_rec.cost_center_ids loop
        insert into public.farm_user_cost_centers (user_id, cost_center_id, organization_id)
          values (new.id, cc_id, invite_rec.organization_id)
          on conflict do nothing;
      end loop;
    end if;

    update public.farm_org_invites
      set used = true, used_by = new.id, used_at = now()
      where id = invite_rec.id;

    return new;
  end if;

  -- (B) Fluxo de signup normal (owner novo)
  if (new.raw_user_meta_data ->> 'farm_signup') is null then
    return new;
  end if;

  signup_farm_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'farm_name'), ''), 'Minha Conta');
  signup_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  trial_end := now() + interval '14 days';

  insert into public.organizations (name, type, trial_started_at, trial_ends_at)
  values (signup_farm_name, 'farm', now(), trial_end)
  returning id into new_org_id;

  insert into public.users_meta (user_id, organization_id, role, full_name, phone, cpf)
  values (
    new.id,
    new_org_id,
    'owner',
    signup_full_name,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'cpf'
  );

  -- farms row legado (V1) - mantido por enquanto pra nao quebrar acesso
  -- direto a /fazendas e caso usuario antigo dependa. Nao mostrado no menu.
  insert into public.farms (organization_id, name)
  values (new_org_id, signup_farm_name);

  -- Seed inicial de 3 CCs arquetipos (cores tailwind-500).
  -- "Operacional" e' is_default=true (cai aqui receipts sem CC explicito).
  insert into public.farm_cost_centers (organization_id, slug, name, is_default, color) values
    (new_org_id, 'operacional', 'Operacional', true, '#10b981'),
    (new_org_id, 'pessoal', 'Pessoal', false, '#3b82f6'),
    (new_org_id, 'escritorio', 'Escritório', false, '#f59e0b');

  return new;
end;
$$;
