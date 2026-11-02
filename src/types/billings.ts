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
  title: string
  note_date: string | null
  category: string | null
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

export type ServicePriceType = 'fixed' | 'variable'

export interface Service {
  id: string
  category: string
  name: string
  note: string | null
  price_type: ServicePriceType
  price: number | null
  price_min: number | null
  price_max: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'void'

export interface Invoice {
  id: string
  patient_id: string
  status: InvoiceStatus
  subtotal: number
  amount_paid: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Present when the invoice is fetched with a patient join.
  patients?: { full_name: string } | null
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  service_id: string | null
  description: string
  unit_price: number
  quantity: number
  line_total: number
  created_at: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  method: PaymentMethod | null
  recorded_by: string | null
  paid_at: string
}