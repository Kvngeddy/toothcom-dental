create or replace function public.submit_intake(
  p_token text,
  p_registration jsonb,
  p_medical_history jsonb,
  p_dental_history jsonb,
  p_consent_name text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_link public.patient_intake_links%rowtype;
  v_submission_id uuid;
  v_date_of_birth date;
begin
  select * into v_link
  from public.patient_intake_links
  where token = p_token
  for update;

  if not found then
    raise exception 'This intake link is invalid.';
  end if;

  if v_link.expires_at < now() then
    raise exception 'This intake link has expired. Please ask the clinic for a new one.';
  end if;

  if v_link.used_at is not null then
    raise exception 'This intake form has already been submitted.';
  end if;

  if p_consent_name is null or btrim(p_consent_name) = '' then
    raise exception 'A consent signature name is required.';
  end if;

  if nullif(btrim(p_registration->>'dateOfBirth'), '') is null then
    raise exception 'Date of birth is required.';
  end if;

  v_date_of_birth := (p_registration->>'dateOfBirth')::date;
  if v_date_of_birth > current_date then
    raise exception 'Date of birth cannot be in the future.';
  end if;

  insert into public.patient_intake_submissions (
    link_id,
    patient_id,
    registration,
    medical_history,
    dental_history,
    consent_name
  ) values (
    v_link.id,
    v_link.patient_id,
    p_registration,
    p_medical_history,
    p_dental_history,
    btrim(p_consent_name)
  )
  returning id into v_submission_id;

  update public.patients
  set date_of_birth = v_date_of_birth,
      gender = coalesce(nullif(btrim(p_registration->>'sex'), ''), gender),
      address = coalesce(nullif(btrim(p_registration->>'homeAddress'), ''), address),
      email = coalesce(nullif(btrim(p_registration->>'email'), ''), email),
      phone = coalesce(
        nullif(btrim(p_registration->>'whatsappNo'), ''),
        nullif(btrim(p_registration->>'officePhone'), ''),
        phone
      ),
      emergency_contact_name = coalesce(nullif(btrim(p_registration->>'nextOfKinName'), ''), emergency_contact_name),
      emergency_contact_phone = coalesce(nullif(btrim(p_registration->>'nextOfKinPhone'), ''), emergency_contact_phone),
      updated_at = now()
  where id = v_link.patient_id;

  insert into public.case_notes (
    patient_id,
    intake_submission_id,
    title,
    note_date,
    category,
    page_count,
    location_id
  )
  select
    patient.id,
    v_submission_id,
    'Completed Patient Intake',
    current_date,
    'Intake Form',
    0,
    patient.location_id
  from public.patients as patient
  where patient.id = v_link.patient_id;

  update public.patient_intake_links
  set used_at = now()
  where id = v_link.id;

  return v_submission_id;
end;
$function$;

create table if not exists public.case_note_xrays (
  id uuid primary key default gen_random_uuid(),
  case_note_id uuid not null references public.case_notes(id) on delete cascade,
  object_path text not null unique,
  file_name text not null,
  file_type text not null check (file_type like 'image/%'),
  uploaded_by uuid not null references public.staff(id),
  uploaded_at timestamptz not null default now()
);

create index if not exists case_note_xrays_case_note_id_uploaded_at_idx
  on public.case_note_xrays (case_note_id, uploaded_at);

alter table public.case_note_xrays enable row level security;
grant select, insert on public.case_note_xrays to authenticated;

drop policy if exists case_note_xrays_select_active_staff on public.case_note_xrays;
create policy case_note_xrays_select_active_staff on public.case_note_xrays
  for select to authenticated
  using (
    exists (
      select 1 from public.staff
      where staff.id = auth.uid() and staff.status = 'active'
    )
  );

drop policy if exists case_note_xrays_insert_active_staff on public.case_note_xrays;
create policy case_note_xrays_insert_active_staff on public.case_note_xrays
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.staff
      where staff.id = auth.uid() and staff.status = 'active'
    )
  );

drop policy if exists case_note_xrays_storage_select_active_staff on storage.objects;
create policy case_note_xrays_storage_select_active_staff on storage.objects
  for select to authenticated
  using (
    bucket_id = 'Toothcom Bucket'
    and exists (
      select 1 from public.case_note_xrays as xray
      join public.staff on staff.id = auth.uid() and staff.status = 'active'
      where xray.object_path = storage.objects.name
    )
  );

drop policy if exists case_note_xrays_storage_insert_active_staff on storage.objects;
create policy case_note_xrays_storage_insert_active_staff on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'Toothcom Bucket'
    and name like 'case_note_xrays/%'
    and exists (
      select 1 from public.staff
      where staff.id = auth.uid() and staff.status = 'active'
    )
  );

drop policy if exists case_note_pages_require_download_approval on storage.objects;
create policy case_note_pages_require_download_approval on storage.objects
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
    or exists (
      select 1
      from public.case_note_xrays as xray
      join public.staff on staff.id = auth.uid() and staff.status = 'active'
      where xray.object_path = storage.objects.name
    )
  );