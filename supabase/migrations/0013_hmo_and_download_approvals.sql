create table if not exists public.hmo_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_by uuid references public.staff(id),
  created_at timestamptz not null default now()
);

create unique index if not exists hmo_providers_name_lower_uidx
  on public.hmo_providers (lower(name));

insert into public.hmo_providers (name)
values
  ('Dot'),
  ('Nem'),
  ('Avon'),
  ('Bastion'),
  ('Hygiea'),
  ('Health partners'),
  ('Healthcare international (Hci)'),
  ('Greenshield'),
  ('Clear line'),
  ('Kennedia'),
  ('Pro health')
on conflict do nothing;

alter table public.patients
  add column if not exists insurance_type text not null default 'non_hmo',
  add column if not exists hmo_provider_id uuid references public.hmo_providers(id) on delete restrict;

alter table public.patients
  drop constraint if exists patients_insurance_type_check,
  drop constraint if exists patients_insurance_provider_check,
  add constraint patients_insurance_type_check
    check (insurance_type in ('hmo', 'non_hmo')),
  add constraint patients_insurance_provider_check
    check (
      (insurance_type = 'hmo' and hmo_provider_id is not null)
      or (insurance_type = 'non_hmo' and hmo_provider_id is null)
    );

alter table public.hmo_providers enable row level security;

create policy "hmo_providers_select_active_staff" on public.hmo_providers
  for select using (
    exists (
      select 1 from public.staff
      where staff.id = auth.uid() and staff.status = 'active'
    )
  );

create policy "hmo_providers_admin_manage" on public.hmo_providers
  for all using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.hmo_providers to authenticated;

create table if not exists public.download_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.staff(id) on delete cascade,
  resource_type text not null check (resource_type in ('intake_document', 'billing_export', 'payment_receipt', 'case_note_page')),
  resource_id text,
  resource_label text not null,
  location_id uuid references public.locations(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  reviewed_by uuid references public.staff(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists download_requests_status_created_idx
  on public.download_requests (status, created_at desc);
create index if not exists download_requests_requester_created_idx
  on public.download_requests (requester_id, created_at desc);

alter table public.download_requests enable row level security;

create policy "download_requests_select_requester_or_admin" on public.download_requests
  for select using (requester_id = auth.uid() or public.is_admin());

create policy "download_requests_insert_own_pending" on public.download_requests
  for insert with check (
    requester_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.staff
      where staff.id = auth.uid() and staff.status = 'active'
    )
  );

create policy "download_requests_admin_review" on public.download_requests
  for update using (public.is_admin())
  with check (public.is_admin() and reviewed_by = auth.uid());

grant select, insert, update on public.download_requests to authenticated;

create or replace function public.consume_download_approval(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  update public.download_requests
  set status = 'completed',
      updated_at = now()
  where id = p_request_id
    and requester_id = auth.uid()
    and status = 'approved'
    and exists (
      select 1 from public.staff
      where staff.id = auth.uid() and staff.status = 'active'
    );

  return found;
end;
$function$;

revoke all on function public.consume_download_approval(uuid) from public;
grant execute on function public.consume_download_approval(uuid) to authenticated;

drop policy if exists "case_note_pages_approved_downloads" on storage.objects;
create policy "case_note_pages_approved_downloads" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'Toothcom Bucket'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.case_note_pages as page
        join public.download_requests as request
          on request.resource_type = 'case_note_page'
          and request.resource_id = page.id::text
          and request.requester_id = auth.uid()
          and request.status in ('approved', 'completed')
        where page.gcs_object_path = storage.objects.name
      )
    )
  );

drop policy if exists "case_note_pages_require_download_approval" on storage.objects;
create policy "case_note_pages_require_download_approval" on storage.objects
  as restrictive for select to authenticated
  using (
    bucket_id <> 'Toothcom Bucket'
    or public.is_admin()
    or exists (
      select 1
      from public.case_note_pages as page
      join public.download_requests as request
        on request.resource_type = 'case_note_page'
        and request.resource_id = page.id::text
        and request.requester_id = auth.uid()
        and request.status in ('approved', 'completed')
      where page.gcs_object_path = storage.objects.name
    )
  );