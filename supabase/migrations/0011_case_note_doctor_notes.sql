alter table public.case_notes
  add column if not exists staff_note text;

create table if not exists public.case_note_doctor_notes (
  id uuid primary key default gen_random_uuid(),
  case_note_id uuid not null references public.case_notes(id) on delete cascade,
  note text not null,
  created_by uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists case_note_doctor_notes_case_note_id_created_at_idx
  on public.case_note_doctor_notes (case_note_id, created_at);

alter table public.case_note_doctor_notes enable row level security;

drop policy if exists "case_note_doctor_notes_all_authenticated" on public.case_note_doctor_notes;
create policy "case_note_doctor_notes_all_authenticated" on public.case_note_doctor_notes
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

insert into public.case_note_doctor_notes (case_note_id, note, created_by)
select case_notes.id, case_notes.staff_note, case_notes.created_by
from public.case_notes
where nullif(trim(case_notes.staff_note), '') is not null
  and not exists (
    select 1
    from public.case_note_doctor_notes
    where case_note_doctor_notes.case_note_id = case_notes.id
      and case_note_doctor_notes.note = case_notes.staff_note
  );