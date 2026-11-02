-- Toothcom Dental Clinics — initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push`.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'staff')) default 'staff',
  created_at timestamptz default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date,
  gender text,
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  created_by uuid references staff(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- A case note = one scanned paper record, which can span multiple pages
create table if not exists case_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  title text not null,
  note_date date,
  category text,
  page_count int default 0,
  created_by uuid references staff(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Individual scanned pages belonging to a case note (file itself lives in GCS)
create table if not exists case_note_pages (
  id uuid primary key default gen_random_uuid(),
  case_note_id uuid references case_notes(id) on delete cascade,
  page_number int not null,
  gcs_object_path text not null,
  file_type text,
  uploaded_by uuid references staff(id),
  uploaded_at timestamptz default now(),
  unique (case_note_id, page_number)
);

-- ============================================================
-- Helper: keep case_notes.page_count in sync
-- ============================================================

create or replace function increment_case_note_page_count(p_case_note_id uuid)
returns void
language sql
security definer
as $$
  update case_notes
  set page_count = page_count + 1,
      updated_at = now()
  where id = p_case_note_id;
$$;

-- ============================================================
-- Helper: is the current user an admin?
-- ============================================================

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from staff where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table staff enable row level security;
alter table patients enable row level security;
alter table case_notes enable row level security;
alter table case_note_pages enable row level security;

-- staff: admins see/manage everyone; staff see only their own row
create policy "staff_select_own_or_admin" on staff
  for select using (id = auth.uid() or is_admin());

create policy "staff_insert_admin_only" on staff
  for insert with check (is_admin());

create policy "staff_update_admin_only" on staff
  for update using (is_admin());

create policy "staff_delete_admin_only" on staff
  for delete using (is_admin());

-- patients: any authenticated staff/admin can read/write
create policy "patients_all_authenticated" on patients
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- case_notes: any authenticated staff/admin can read/write
create policy "case_notes_all_authenticated" on case_notes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- case_note_pages: any authenticated staff/admin can read/write
create policy "case_note_pages_all_authenticated" on case_note_pages
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- Bootstrap: manually promote your first admin after they sign up, e.g.
--   insert into staff (id, full_name, email, role)
--   values ('<auth-user-uuid>', 'Your Name', 'you@toothcom.clinic', 'admin');
-- ============================================================
