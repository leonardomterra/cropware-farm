-- Cropware Farm V2 - trigger handle_new_farm_user atualizado.
-- Suporta dois caminhos: signup com invite_code (consome invite) ou
-- signup normal (cria org + owner + CC "Geral").

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
  general_cc_id uuid;
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

  signup_farm_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'farm_name'), ''), 'Minha Fazenda');
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

  insert into public.farms (organization_id, name)
  values (new_org_id, signup_farm_name);

  insert into public.farm_cost_centers (organization_id, slug, name, is_default, color)
    values (new_org_id, 'geral', 'Geral', true, '#64748b')
    returning id into general_cc_id;

  return new;
end;
$$;
