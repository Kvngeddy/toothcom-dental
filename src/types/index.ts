export type StaffRole = 'admin' | 'doctor' | 'nurse' | 'front_desk'
export type StaffStatus = 'invited' | 'active'

export interface Staff {
  id: string
  full_name: string
  email: string
  role: StaffRole
  status: StaffStatus
  created_at: string
}

export interface Patient {
  id: string
  location_id: string | null
  case_note_number: string | null
  electronic_case_note_number: string | null
  full_name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CaseNote {
  id: string
  patient_id: string
  intake_submission_id: string | null
  title: string
  note_date: string | null
  category: string | null
  staff_note: string | null
  page_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CaseNotePage {
  id: string
  case_note_id: string
  page_number: number
  gcs_object_path: string
  file_type: string | null
  uploaded_by: string | null
  uploaded_at: string
}