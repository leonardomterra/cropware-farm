-- Cropware Farm V1 - trigger handle_new_farm_user.
--
-- Ao inserir em auth.users com flag farm_signup=true em raw_user_meta_data,
-- cria organization + users_meta + farm automaticamente. Bypassa RLS via
-- SECURITY DEFINER. Studio signups (sem o flag) sao ignorados.
--
-- Em commit 7, edge function /farm-api/auth/signup vai assumir essa
-- responsabilidade. Este trigger fica como rede de seguranca / path direto
-- via supabase.auth.signUp.

create or replace function public.handle_new_farm_user()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
declare
  new_org_id uuid;
  trial_end timestamptz;
  signup_farm_name text;
  signup_full_name text;
begin
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

  return new;
end;
$$;

create trigger on_auth_user_created_farm
after insert on auth.users
for each row execute function public.handle_new_farm_user();
