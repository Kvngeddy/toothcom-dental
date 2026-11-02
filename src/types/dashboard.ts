// src/types/dashboard.ts
// Shared domain types for the clinic dashboard. Keeping these separate from
// mock data means every component can be pointed at real API/DB data later
// without touching prop shapes.

export type AppointmentStatus = 'confirmed' | 'waiting' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  patientName: string
  patientAvatarUrl?: string
  time: string // display string, e.g. "9:30 AM"
  doctor: string
  service: string
  status: AppointmentStatus
}

export type StaffAvailability = 'available' | 'break' | 'unavailable'

export interface StaffMember {
  id: string
  name: string
  role: string // e.g. "Dentist", "Dental Hygienist", "Front Desk"
  department: 'Doctors' | 'Nurses' | 'Administrative' | 'Other'
  availability: StaffAvailability
  avatarUrl?: string
}

export interface ServiceItem {
  id: string
  name: string
  icon: 'consultation' | 'dental' | 'lab' | 'pharmacy' | 'diagnostics' | 'specialist'
  appointmentsThisWeek: number
  revenueThisMonth?: number
}

export type AnnouncementPriority = 'high' | 'normal' | 'low'

export interface Announcement {
  id: string
  title: string
  description: string
  date: string
  priority: AnnouncementPriority
  author: string
}

export type ActivityType =
  | 'patient_registered'
  | 'appointment_completed'
  | 'staff_added'
  | 'service_updated'
  | 'announcement_published'
  | 'payment_recorded'

export interface ActivityItem {
  id: string
  type: ActivityType
  description: string
  user: string
  timestamp: string // relative display string, e.g. "12 minutes ago"
}

export interface PatientGrowthPoint {
  date: string // short label, e.g. "Aug 3"
  patients: number
}

export interface PatientStats {
  total: number
  totalChangePercent: number
  newThisMonth: number
  returning: number
  active: number
  growth: PatientGrowthPoint[]
}

export interface RevenueTrendPoint {
  label: string
  amount: number
}

/**
 * Shape the Billing module is expected to return.
 * The dashboard only ever consumes this summary — it never computes
 * financial totals itself. See src/services/billingService.ts.
 */
export interface RevenueSummary {
  totalRevenue: number
  revenueThisMonth: number
  revenueThisWeek: number
  outstandingPayments: number
  growthPercent: number
  currency: string
  trend: RevenueTrendPoint[]
  hasData: boolean
}

export interface AppointmentsSnapshot {
  total: number
  upcoming: number
  completed: number
  pending: number
}

export interface StaffSnapshot {
  total: number
  doctors: number
  nurses: number
  administrative: number
  other: number
  members: StaffMember[]
}