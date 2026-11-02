create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.locations (name)
values ('Toothcom Amuwo-Odofin'), ('Toothcom Adelabu')
on conflict (name) do nothing;

alter table if exists public.patients
  add column if not exists location_id uuid references public.locations(id);
alter table if exists public.staff
  add column if not exists location_id uuid references public.locations(id);
alter table if exists public.appointments
  add column if not exists location_id uuid references public.locations(id);
alter table if exists public.services
  add column if not exists location_id uuid references public.locations(id);
alter table if exists public.invoices
  add column if not exists location_id uuid references public.locations(id);
alter table if exists public.case_notes
  add column if not exists location_id uuid references public.locations(id);

do $$
declare
  relation_name text;
  amuwo_id uuid;
begin
  select id into amuwo_id
  from public.locations
  where name = 'Toothcom Amuwo-Odofin';

  foreach relation_name in array array['patients', 'staff', 'appointments', 'services', 'invoices', 'case_notes']
  loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format(
        'update public.%I set location_id = $1 where location_id is null',
        relation_name
      ) using amuwo_id;
    end if;
  end loop;
end;
$$;

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array['patients', 'staff', 'appointments', 'services', 'invoices', 'case_notes']
  loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format(
        'create index if not exists %I on public.%I(location_id)',
        relation_name || '_location_id_idx',
        relation_name
      );
    end if;
  end loop;
end;
$$;

alter table public.locations enable row level security;

create policy "locations_read_authenticated" on public.locations
  for select using (auth.uid() is not null);
create policy "locations_insert_admin_only" on public.locations
  for insert with check (is_admin());
create policy "locations_update_admin_only" on public.locations
  for update using (is_admin()) with check (is_admin());
create policy "locations_delete_admin_only" on public.locations
  for delete using (is_admin());