create sequence if not exists public.patient_electronic_case_note_number_seq;

alter table public.patients
  add column if not exists electronic_case_note_number text;

with patients_to_number as (
  select id, nextval('public.patient_electronic_case_note_number_seq') as number
  from public.patients
  where electronic_case_note_number is null
  order by created_at, id
)
update public.patients as patient
set electronic_case_note_number = 'T/' || lpad(patients_to_number.number::text, 6, '0')
from patients_to_number
where patient.id = patients_to_number.id;

alter table public.patients
  alter column electronic_case_note_number set not null;

create unique index if not exists patients_electronic_case_note_number_uidx
  on public.patients (electronic_case_note_number);

create or replace function public.assign_patient_electronic_case_note_number()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.electronic_case_note_number is null then
    new.electronic_case_note_number := 'T/' || lpad(
      nextval('public.patient_electronic_case_note_number_seq')::text,
      6,
      '0'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists patients_assign_electronic_case_note_number on public.patients;
create trigger patients_assign_electronic_case_note_number
  before insert on public.patients
  for each row
  execute function public.assign_patient_electronic_case_note_number();
