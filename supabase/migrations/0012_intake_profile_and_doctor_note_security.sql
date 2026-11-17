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
  set gender = coalesce(nullif(btrim(p_registration->>'sex'), ''), gender),
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

drop policy if exists "case_note_doctor_notes_all_authenticated" on public.case_note_doctor_notes;
drop policy if exists "case_note_doctor_notes_select_authenticated" on public.case_note_doctor_notes;
drop policy if exists "case_note_doctor_notes_insert_clinicians" on public.case_note_doctor_notes;

create policy "case_note_doctor_notes_select_authenticated" on public.case_note_doctor_notes
  for select using (
    exists (
      select 1
      from public.staff
      where staff.id = auth.uid()
        and staff.status = 'active'
    )
  );

create policy "case_note_doctor_notes_insert_clinicians" on public.case_note_doctor_notes
  for insert with check (
    exists (
      select 1
      from public.staff
      where staff.id = auth.uid()
        and staff.status = 'active'
        and staff.role in ('doctor', 'admin')
    )
      and created_by = auth.uid()
  );