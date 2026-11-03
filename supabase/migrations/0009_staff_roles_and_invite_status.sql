do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.staff'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%role%' or pg_get_constraintdef(oid) ilike '%status%')
  loop
    execute format('alter table public.staff drop constraint %I', constraint_row.conname);
  end loop;
end;
$$;

alter table public.staff
  add column if not exists status text default 'active';

update public.staff
set status = case when status in ('invited', 'pending') then 'invited' else 'active' end
where status is null or status not in ('invited', 'active');

alter table public.staff
  alter column status set default 'active',
  alter column status set not null;

update public.staff
set role = case when role = 'admin' then 'admin' else 'front_desk' end
where role not in ('admin', 'doctor', 'nurse', 'front_desk');

alter table public.staff
  alter column role set default 'front_desk';

alter table public.staff
  add constraint staff_role_supported_check
    check (role in ('admin', 'doctor', 'nurse', 'front_desk')),
  add constraint staff_status_supported_check
    check (status in ('invited', 'active'));

create or replace function public.mark_staff_active()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.staff
  set status = 'active'
  where id = auth.uid();
$$;

grant execute on function public.mark_staff_active() to authenticated;
