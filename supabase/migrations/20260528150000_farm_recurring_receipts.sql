-- Cropware Farm R1.3 - Recibo recorrente.
-- Tabela farm_recurring_receipts (assinaturas mensais: energia, internet, salario...)
-- + SQL function idempotente que gera farm_receipts pendentes na data alvo.
-- + pg_cron diario as 07:00 UTC (04:00 BRT) chamando a function.

create extension if not exists pg_cron with schema extensions;

create table public.farm_recurring_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cost_center_id uuid references public.farm_cost_centers(id) on delete set null,
  name text not null,
  direction text not null check (direction in ('expense','income')),
  total_value numeric not null check (total_value > 0),
  category text,
  vendor text,
  description text,
  payment_method text,
  frequency text not null default 'monthly' check (frequency = 'monthly'),
  day_of_month int not null check (day_of_month between 1 and 28),
  next_run_date date not null,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index farm_recurring_org_idx on public.farm_recurring_receipts(organization_id) where active = true;
create index farm_recurring_due_idx on public.farm_recurring_receipts(next_run_date) where active = true;

alter table public.farm_recurring_receipts enable row level security;

create policy "recurring read by org members" on public.farm_recurring_receipts
  for select using (
    organization_id in (select organization_id from public.users_meta where user_id = auth.uid())
  );

create policy "recurring write by admins" on public.farm_recurring_receipts
  for all using (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_recurring_receipts.organization_id
        and role in ('owner','admin')
    )
  ) with check (
    exists (
      select 1 from public.users_meta
      where user_id = auth.uid()
        and organization_id = farm_recurring_receipts.organization_id
        and role in ('owner','admin')
    )
  );

grant select, insert, update, delete on public.farm_recurring_receipts to authenticated;

alter table public.farm_receipts add column if not exists recurring_id uuid
  references public.farm_recurring_receipts(id) on delete set null;
create index if not exists farm_receipts_recurring_idx on public.farm_receipts(recurring_id);

create or replace function public.farm_process_recurring()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
  cnt int := 0;
begin
  for rec in
    select * from public.farm_recurring_receipts
      where active = true and next_run_date <= current_date
      order by next_run_date
  loop
    insert into public.farm_receipts (
      organization_id, created_by, cost_center_id, doc_type, direction, status,
      total_value, currency, transaction_date, due_date,
      vendor, payment_method, description, category, source, recurring_id
    ) values (
      rec.organization_id, rec.created_by, rec.cost_center_id, 'outro', rec.direction,
      case when rec.direction = 'income' then 'a_receber' else 'a_pagar' end,
      rec.total_value, 'BRL', rec.next_run_date, rec.next_run_date,
      rec.vendor, rec.payment_method,
      coalesce(rec.description, rec.name) || ' (recorrente)',
      rec.category, 'recurring', rec.id
    );

    update public.farm_recurring_receipts
      set next_run_date = (rec.next_run_date + interval '1 month')::date,
          updated_at = now()
      where id = rec.id;

    cnt := cnt + 1;
  end loop;
  return cnt;
end;
$$;

grant execute on function public.farm_process_recurring() to authenticated, service_role;

select cron.schedule(
  'farm-process-recurring',
  '0 7 * * *',
  $$select public.farm_process_recurring();$$
);
