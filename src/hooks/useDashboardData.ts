import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type {
  PatientStats,
  AppointmentsSnapshot,
  StaffSnapshot,
  StaffMember,
  PatientGrowthPoint,
  ActivityItem,
  ServiceItem,
  Appointment,
  AppointmentStatus,
} from '@/types/dashboard'

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatShortDate(d: Date) {
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

function mapStatus(status: string | null): AppointmentStatus {
  const s = (status || '').toLowerCase()
  if (s === 'pending') return 'waiting'
  if (s === 'confirmed' || s === 'completed' || s === 'cancelled') return s as AppointmentStatus
  return 'waiting'
}

function categoryToIcon(category: string): ServiceItem['icon'] {
  const c = category.toLowerCase()
  if (c.includes('consult')) return 'consultation'
  if (c.includes('lab')) return 'lab'
  if (c.includes('pharm')) return 'pharmacy'
  if (c.includes('diagnos') || c.includes('scan') || c.includes('x-ray') || c.includes('xray')) return 'diagnostics'
  if (c.includes('special')) return 'specialist'
  return 'dental'
}

export function useDashboardData(locationId: string | null, isAdmin: boolean) {
  const [loading, setLoading] = useState(true)
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null)
  const [appointmentsSnapshot, setAppointmentsSnapshot] = useState<AppointmentsSnapshot | null>(null)
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([])
  const [staffSnapshot, setStaffSnapshot] = useState<StaffSnapshot | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

  const fetchData = useCallback(async () => {
    if (!locationId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const monthStart = startOfMonth()
    const lastMonthStart = startOfMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))
    const last30 = new Date()
    last30.setDate(last30.getDate() - 30)
    const last60 = new Date()
    last60.setDate(last60.getDate() - 60)
    const weekStart = startOfWeek()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // ---- Patients ----
    const [
      { count: totalPatients },
      { count: newThisMonthCount },
      { count: newLastMonthCount },
      { data: recentPatientsGrowth },
    ] = await Promise.all([
      supabase.from('patients').select('*', { head: true, count: 'exact' }).eq('location_id', locationId),
      supabase.from('patients').select('*', { head: true, count: 'exact' }).eq('location_id', locationId).gte('created_at', monthStart.toISOString()),
      supabase
        .from('patients')
        .select('*', { head: true, count: 'exact' })
        .eq('location_id', locationId)
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', monthStart.toISOString()),
      supabase.from('patients').select('created_at').eq('location_id', locationId).gte('created_at', last30.toISOString()).order('created_at', { ascending: true }),
    ])

    const growthMap: Record<string, number> = {}
    ;(recentPatientsGrowth ?? []).forEach((r: any) => {
      const label = formatShortDate(new Date(r.created_at))
      growthMap[label] = (growthMap[label] || 0) + 1
    })
    const growth: PatientGrowthPoint[] = Object.keys(growthMap).map((k) => ({ date: k, patients: growthMap[k] }))

    const totalChangePercent =
      (newLastMonthCount ?? 0) > 0
        ? (((newThisMonthCount ?? 0) - (newLastMonthCount ?? 0)) / (newLastMonthCount ?? 1)) * 100
        : (newThisMonthCount ?? 0) > 0 ? 100 : 0

    // ---- Appointments (bulk fetch, drives several sections) ----
    const { data: apptsRaw, error: apptError } = await supabase
      .from('appointments')
      .select('id, patient_id, staff_id, service_id, scheduled_at, reason, status, created_at, patients(full_name), staff(full_name), services(name, category)')
      .eq('location_id', locationId)
      .order('scheduled_at', { ascending: false })
      .limit(1000)

    if (apptError) console.error('Dashboard: appointments query failed', apptError.message)

    const appts = apptsRaw ?? []

    // Returning / active patients, derived from real appointment history
    const patientApptCounts: Record<string, number> = {}
    const activePatientIds = new Set<string>()
    appts.forEach((a: any) => {
      patientApptCounts[a.patient_id] = (patientApptCounts[a.patient_id] || 0) + 1
      if (a.scheduled_at && new Date(a.scheduled_at) >= last60) {
        activePatientIds.add(a.patient_id)
      }
    })
    const returning = Object.values(patientApptCounts).filter((c) => c >= 2).length
    const active = activePatientIds.size

    const computedPatientStats: PatientStats = {
      total: totalPatients ?? 0,
      totalChangePercent,
      newThisMonth: newThisMonthCount ?? 0,
      returning,
      active,
      growth,
    }

    // Today's appointments
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todaysRaw = appts.filter((a: any) => {
      if (!a.scheduled_at) return false
      const d = new Date(a.scheduled_at)
      return d >= todayStart && d <= todayEnd
    })

    const mappedTodays: Appointment[] = todaysRaw.map((a: any) => ({
      id: a.id,
      patientName: a.patients?.full_name ?? 'Unknown',
      time: new Date(a.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      doctor: a.staff?.full_name ?? '',
      service: a.services?.name ?? '',
      status: mapStatus(a.status),
    }))

    const computedAppointmentsSnapshot: AppointmentsSnapshot = {
      total: todaysRaw.length,
      upcoming: todaysRaw.filter((a: any) => (a.status || '').toLowerCase() === 'confirmed').length,
      completed: todaysRaw.filter((a: any) => (a.status || '').toLowerCase() === 'completed').length,
      pending: todaysRaw.filter((a: any) => (a.status || '').toLowerCase() === 'pending').length,
    }

    // ---- Staff ----
    let totalStaff = 0
    let members: { id: string; full_name: string; role: string }[] = []
    if (isAdmin) {
      const [{ count }, { data }] = await Promise.all([
        supabase.from('staff').select('*', { head: true, count: 'exact' }).eq('location_id', locationId),
        supabase.from('staff').select('id, full_name, role').eq('location_id', locationId).limit(8).order('full_name', { ascending: true }),
      ])
      totalStaff = count ?? 0
      members = data ?? []
    }

    const staffMembers: StaffMember[] = (members ?? []).map((m: any) => {
      const role = (m.role || '').toLowerCase()
      const department: StaffMember['department'] =
        role === 'doctor' ? 'Doctors' : role === 'nurse' ? 'Nurses' : role === 'admin' ? 'Administrative' : 'Other'
      return {
        id: m.id,
        name: m.full_name,
        role: m.role,
        department,
        // No real-time availability data source exists yet — defaulting to
        // 'available' until a status/shift column is added to `staff`.
        availability: 'available',
      }
    })

    const rolesLower = (members ?? []).map((m: any) => (m.role || '').toLowerCase())
    const computedStaffSnapshot: StaffSnapshot = {
      total: totalStaff ?? 0,
      doctors: rolesLower.filter((r) => r === 'doctor').length,
      nurses: rolesLower.filter((r) => r === 'nurse').length,
      administrative: rolesLower.filter((r) => r === 'admin').length,
      other: rolesLower.filter((r) => r === 'front_desk' || (r !== 'doctor' && r !== 'nurse' && r !== 'admin')).length,
      members: staffMembers,
    }

    // ---- Services ----
    const { data: servicesRaw } = await supabase
      .from('services')
      .select('id, name, category')
      .eq('is_active', true)

    const weekApptCountByService: Record<string, number> = {}
    appts.forEach((a: any) => {
      if (!a.service_id || !a.scheduled_at) return
      const d = new Date(a.scheduled_at)
      if (d >= weekStart && d < weekEnd) {
        weekApptCountByService[a.service_id] = (weekApptCountByService[a.service_id] || 0) + 1
      }
    })

    let invoiceItemsRaw: any[] = []
    if (isAdmin) {
      const { data } = await supabase
        .from('invoice_items')
        .select('service_id, line_total, invoices!inner(created_at, status, location_id)')
        .not('service_id', 'is', null)
        .eq('invoices.location_id', locationId)
      invoiceItemsRaw = data ?? []
    }

    const revenueByService: Record<string, number> = {}
    ;(invoiceItemsRaw ?? []).forEach((item: any) => {
      const invoice = item.invoices
      if (!invoice || invoice.status === 'void') return
      if (new Date(invoice.created_at) < monthStart) return
      revenueByService[item.service_id] = (revenueByService[item.service_id] || 0) + Number(item.line_total)
    })

    const servicesList: ServiceItem[] = (servicesRaw ?? [])
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        icon: categoryToIcon(s.category),
        appointmentsThisWeek: weekApptCountByService[s.id] || 0,
        revenueThisMonth: revenueByService[s.id] || 0,
      }))
      .sort((a, b) => b.appointmentsThisWeek - a.appointmentsThisWeek)
      .slice(0, 6)

    // ---- Recent activity ----
    // Built only from events with a genuine, traceable actor — the staff
    // assigned to the appointment, or the staff who recorded the payment.
    // (Patient registration / staff-added events aren't included because
    // neither `patients` nor `staff` currently records who added them —
    // add a `registered_by` / `added_by` column to include those.)
    const completedAppts = appts
      .filter((a: any) => (a.status || '').toLowerCase() === 'completed')
      .slice(0, 6)
      .map((a: any) => ({
        type: 'appointment_completed' as const,
        description: `Appointment with ${a.patients?.full_name ?? 'a patient'} completed`,
        user: a.staff?.full_name ?? 'Staff',
        date: new Date(a.scheduled_at),
      }))

    let recentPayments: any[] = []
    if (isAdmin) {
      const { data } = await supabase
        .from('payments')
        .select('id, amount, paid_at, invoices!inner(location_id, patients(full_name)), staff:recorded_by(full_name)')
        .eq('invoices.location_id', locationId)
        .order('paid_at', { ascending: false })
        .limit(6)
      recentPayments = data ?? []
    }

    const paymentEvents = (recentPayments ?? []).map((p: any) => ({
      type: 'payment_recorded' as const,
      description: `Payment recorded for ${p.invoices?.patients?.full_name ?? 'a patient'}`,
      user: p.staff?.full_name ?? 'Staff',
      date: new Date(p.paid_at),
    }))

    const combinedActivity = [...completedAppts, ...paymentEvents]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8)
      .map((item, i) => ({
        id: String(i),
        type: item.type,
        description: item.description,
        user: item.user,
        timestamp: relativeTime(item.date),
      }))

    setPatientStats(computedPatientStats)
    setStaffSnapshot(computedStaffSnapshot)
    setAppointmentsSnapshot(computedAppointmentsSnapshot)
    setTodaysAppointments(mappedTodays)
    setServices(servicesList)
    setRecentActivity(combinedActivity)

    setLoading(false)
  }, [locationId, isAdmin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    loading,
    patientStats,
    appointmentsSnapshot,
    todaysAppointments,
    staffSnapshot,
    services,
    recentActivity,
    refetch: fetchData,
  }
}

export default useDashboardData