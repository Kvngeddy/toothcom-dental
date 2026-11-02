alter table public.case_notes
  add column if not exists intake_submission_id uuid
    references public.patient_intake_submissions(id) on delete set null;

create unique index if not exists case_notes_intake_submission_uidx
  on public.case_notes (intake_submission_id)
  where intake_submission_id is not null;

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
  submission.patient_id,
  submission.id,
  'Completed Patient Intake',
  submission.submitted_at::date,
  'Intake Form',
  0,
  patient.location_id
from public.patient_intake_submissions as submission
join public.patients as patient on patient.id = submission.patient_id
where not exists (
  select 1
  from public.case_notes as note
  where note.intake_submission_id = submission.id
);

alter table public.patient_intake_submissions enable row level security;
grant select on public.patient_intake_submissions to authenticated;

drop policy if exists patient_intake_submissions_select_authenticated
  on public.patient_intake_submissions;
create policy patient_intake_submissions_select_authenticated
  on public.patient_intake_submissions
  for select
  using (auth.uid() is not null);

create or replace function public.get_intake_patient(p_token text)
returns table(valid boolean, expired boolean, used boolean, patient_name text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.patient_intake_links%rowtype;
  v_name text;
begin
  select * into v_row
  from public.patient_intake_links
  where token = p_token;

  if not found then
    return query select false, false, false, null::text;
    return;
  end if;

  select full_name into v_name
  from public.patients
  where id = v_row.patient_id;

  return query select
    true,
    (v_row.expires_at < now()),
    (v_row.used_at is not null),
    v_name;
end;
$function$;

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