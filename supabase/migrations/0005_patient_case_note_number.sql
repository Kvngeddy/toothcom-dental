alter table public.patients
  add column if not exists case_note_number text;

create unique index if not exists patients_location_case_note_number_uidx
  on public.patients (location_id, case_note_number)
  where case_note_number is not null;