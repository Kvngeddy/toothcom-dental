create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id),
  created_at timestamptz not null default now(),
  primary key (appointment_id, service_id)
);

alter table public.appointment_services enable row level security;

create policy "appointment_services_authenticated_access" on public.appointment_services
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);
