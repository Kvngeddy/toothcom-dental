# Toothcom Dental Clinics — Staff/Admin Portal (v1)

React + Vite + TypeScript + Tailwind frontend, Supabase (Postgres/Auth/Edge Functions) backend,
Google Cloud Storage for scanned patient case note pages.

## Stack
- Frontend: React 19, Vite, TypeScript, Tailwind CSS v4, React Router
- Backend: Supabase (Auth, Postgres with RLS, Edge Functions)
- File storage: Google Cloud Storage (private bucket, signed URLs only)

## 1. Local setup

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings
npm run dev
```

## 2. Vercel deployment

1. Import this repository into Vercel. Set the Root Directory to the folder containing
  `package.json` if the repository has a parent folder around this app.
2. Keep the framework preset as Vite, with build command `npm run build` and output directory
  `dist`.
3. Add these environment variables for Production, Preview, and Development, using values from
  your Supabase project's API settings:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Vercel serves `vercel.json`, which sends application routes such as `/intake/:token`
  back to the SPA entry point. Intake links are built from the current browser origin, so links
  generated in production use the deployed site URL rather than a local development address.
5. In Supabase, open **Authentication → URL Configuration**. Set **Site URL** to the production
  URL and add the production URL, its `/set-password` route, and any Vercel Preview URLs you use
  to **Redirect URLs**.
6. Replace the example origin in `supabase/cors.json` with the production website origin, then
  apply the updated policy to the Google Cloud Storage bucket using the command in the next
  section. Include a separate origin if you use a custom domain.

## 3. Supabase setup

1. Create a project at supabase.com.
2. In the SQL editor, run the files in `supabase/migrations` in numeric order. The later
  migrations add location support, patient case note numbers, intake case notes, and
  multi-service appointments, generated electronic patient numbers, staff invite roles/status,
  and multiple doctor notes per case note. Migration `0011_case_note_doctor_notes.sql` also
  preserves existing internal staff notes when upgrading. If the app reports a missing database
  column or relation, apply the migrations and refresh the Supabase API schema cache or wait for it to reload.
  Paper case note numbers
  are optional; electronic numbers are generated in `T/000001` format. If the app reports that
  a patient case number field is missing from the schema cache, confirm that
  `0005_patient_case_note_number.sql` and `0008_patient_electronic_case_note_number.sql` have been
  applied, then refresh the Supabase API schema cache or wait for it to reload.
3. Create your first admin:
   - Sign up a user through Supabase Auth (or the app's login form once a user exists).
   - In the SQL editor:
     ```sql
     insert into staff (id, full_name, email, role)
     values ('<the-auth-user-uuid>', 'Your Name', 'you@toothcom.clinic', 'admin');
     ```
4. Deploy the Edge Functions:
   ```bash
   supabase functions deploy generate-upload-url
   supabase functions deploy generate-read-url
   supabase functions deploy invite-staff
   ```
  Staff invitation emails return to `/set-password` so the invited person can choose a password.
5. Set the required secrets (see GCP setup below):
   ```bash
   supabase secrets set GCS_SERVICE_ACCOUNT_KEY="$(cat path/to/service-account-key.json)"
   supabase secrets set GCS_BUCKET_NAME="your-bucket-name"
   ```
   `invite-staff` also needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — these are
   already available by default inside Supabase Edge Functions, no extra step needed.

## 4. Google Cloud Storage setup

```bash
gcloud projects create toothcom-dental --name="Toothcom Dental"
gcloud config set project toothcom-dental
gcloud services enable storage.googleapis.com

gcloud storage buckets create gs://your-bucket-name \
  --location=europe-west1 \
  --uniform-bucket-level-access \
  --public-access-prevention

gcloud storage buckets update gs://your-bucket-name --cors-file=supabase/cors.json

gcloud iam service-accounts create toothcom-storage-sa \
  --display-name="Toothcom Storage Service Account"

gcloud storage buckets add-iam-policy-binding gs://your-bucket-name \
  --member="serviceAccount:toothcom-storage-sa@toothcom-dental.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud iam service-accounts keys create toothcom-storage-key.json \
  --iam-account=toothcom-storage-sa@toothcom-dental.iam.gserviceaccount.com
```

Update `supabase/cors.json` with your real deployed app domain before applying it, then feed
`toothcom-storage-key.json` into the Supabase secret shown above.

## 5. Project structure

```
src/
  components/     Sidebar, ProtectedRoute, CaseNotesTab, PageViewer
  contexts/        AuthContext (Supabase session + staff role)
  hooks/           usePatients, useCaseNotes (data + GCS upload/read flow)
  pages/           Login, PatientList, PatientProfile, StaffManagement
  lib/             supabaseClient
  types/           shared TS types
supabase/
  migrations/      SQL schema + RLS
  functions/       generate-upload-url, generate-read-url, invite-staff
  cors.json        GCS bucket CORS policy
```

## 6. What's in v1
- Email/password auth via Supabase, two roles: `admin` and `staff`.
- Patient list, add patient, editable patient profile.
- Case notes: group multiple scanned pages under one titled case note per patient,
  uploaded in order, viewable as a page-by-page viewer.
- Staff management (admin only): invite staff, assign role.

## 7. Out of scope for v1
Appointment scheduling, billing/invoicing, patient-facing portal.
