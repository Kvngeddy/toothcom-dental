// src/data/dashboardMockData.ts
// Placeholder data for every section EXCEPT revenue (see billingService.ts).
// Swap these constants for API/DB-backed queries whenever the corresponding
// backend endpoints exist — component props are already typed for it.

import type {
  Appointment,
  AppointmentsSnapshot,
  Announcement,
  ActivityItem,
  PatientStats,
  ServiceItem,
  StaffSnapshot,
} from '@/types/dashboard'

export const appointmentsSnapshot: AppointmentsSnapshot = {
  total: 42,
  upcoming: 18,
  completed: 21,
  pending: 3,
}

export const todaysAppointments: Appointment[] = [
  { id: 'a1', patientName: 'Adaeze Nwosu', time: '9:00 AM', doctor: 'Dr. Femi Okoro', service: 'Dental Cleaning', status: 'completed' },
  { id: 'a2', patientName: 'Chuka Eze', time: '9:30 AM', doctor: 'Dr. Amina Bello', service: 'Root Canal', status: 'completed' },
  { id: 'a3', patientName: 'Grace Adebayo', time: '10:15 AM', doctor: 'Dr. Femi Okoro', service: 'General Consultation', status: 'confirmed' },
  { id: 'a4', patientName: 'Tunde Bakare', time: '11:00 AM', doctor: 'Dr. Ngozi Okafor', service: 'Orthodontic Review', status: 'waiting' },
  { id: 'a5', patientName: 'Blessing Ude', time: '11:45 AM', doctor: 'Dr. Amina Bello', service: 'Teeth Whitening', status: 'confirmed' },
  { id: 'a6', patientName: 'Ifeoma Chukwu', time: '1:30 PM', doctor: 'Dr. Ngozi Okafor', service: 'Pediatric Checkup', status: 'cancelled' },
  { id: 'a7', patientName: 'Segun Alabi', time: '2:15 PM', doctor: 'Dr. Femi Okoro', service: 'Tooth Extraction', status: 'confirmed' },
]

export const patientStats: PatientStats = {
  total: 1284,
  totalChangePercent: 8.2,
  newThisMonth: 96,
  returning: 1041,
  active: 812,
  growth: [
    { date: 'Aug 3', patients: 1120 },
    { date: 'Aug 7', patients: 1148 },
    { date: 'Aug 11', patients: 1165 },
    { date: 'Aug 15', patients: 1190 },
    { date: 'Aug 19', patients: 1211 },
    { date: 'Aug 23', patients: 1236 },
    { date: 'Aug 27', patients: 1260 },
    { date: 'Aug 31', patients: 1284 },
  ],
}

export const staffSnapshot: StaffSnapshot = {
  total: 36,
  doctors: 14,
  nurses: 12,
  administrative: 8,
  other: 2,
  members: [
    { id: 's1', name: 'Dr. Femi Okoro', role: 'Dentist', department: 'Doctors', availability: 'available' },
    { id: 's2', name: 'Dr. Amina Bello', role: 'Orthodontist', department: 'Doctors', availability: 'available' },
    { id: 's3', name: 'Dr. Ngozi Okafor', role: 'Pediatric Dentist', department: 'Doctors', availability: 'break' },
    { id: 's4', name: 'Kemi Adeyemi', role: 'Dental Hygienist', department: 'Nurses', availability: 'available' },
    { id: 's5', name: 'Yusuf Danladi', role: 'Front Desk', department: 'Administrative', availability: 'unavailable' },
  ],
}

export const services: ServiceItem[] = [
  { id: 'sv1', name: 'General Consultation', icon: 'consultation', appointmentsThisWeek: 58, revenueThisMonth: 1_240_000 },
  { id: 'sv2', name: 'Dental Care', icon: 'dental', appointmentsThisWeek: 74, revenueThisMonth: 2_680_000 },
  { id: 'sv3', name: 'Laboratory', icon: 'lab', appointmentsThisWeek: 22, revenueThisMonth: 480_000 },
  { id: 'sv4', name: 'Pharmacy', icon: 'pharmacy', appointmentsThisWeek: 65, revenueThisMonth: 610_000 },
  { id: 'sv5', name: 'Diagnostics', icon: 'diagnostics', appointmentsThisWeek: 19, revenueThisMonth: 390_000 },
  { id: 'sv6', name: 'Specialist Consultation', icon: 'specialist', appointmentsThisWeek: 31, revenueThisMonth: 1_050_000 },
]

export const announcements: Announcement[] = [
  {
    id: 'an1',
    title: 'Staff Meeting',
    description: 'Monthly clinical staff meeting scheduled for Friday at 4:00 PM in the main conference room.',
    date: 'Sep 5, 2026',
    priority: 'normal',
    author: 'Dr. Femi Okoro',
  },
  {
    id: 'an2',
    title: 'System Update',
    description: 'Patient records system maintenance scheduled for tonight from 11 PM to 1 AM. Expect brief downtime.',
    date: 'Sep 1, 2026',
    priority: 'high',
    author: 'IT Support',
  },
  {
    id: 'an3',
    title: 'New X-Ray Equipment',
    description: 'The diagnostics room has been fitted with new digital X-ray equipment, available from Monday.',
    date: 'Aug 28, 2026',
    priority: 'low',
    author: 'Dr. Ngozi Okafor',
  },
]

export const recentActivity: ActivityItem[] = [
  { id: 'act1', type: 'patient_registered', description: 'Jane Doe registered a new patient', user: 'Yusuf Danladi', timestamp: '12 minutes ago' },
  { id: 'act2', type: 'appointment_completed', description: 'Completed root canal for Chuka Eze', user: 'Dr. Amina Bello', timestamp: '48 minutes ago' },
  { id: 'act3', type: 'payment_recorded', description: 'Recorded payment of ₦45,000 for Grace Adebayo', user: 'Front Desk', timestamp: '1 hour ago' },
  { id: 'act4', type: 'staff_added', description: 'Added Kemi Adeyemi to Dental Hygienists', user: 'Admin', timestamp: '3 hours ago' },
  { id: 'act5', type: 'announcement_published', description: 'Published "System Update" announcement', user: 'IT Support', timestamp: '5 hours ago' },
]