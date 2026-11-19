import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarClock, CircleDollarSign, Download } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useLocation } from '@/contexts/LocationContext'
import { useAuth } from '@/contexts/AuthContext'

type ClinicNotification = {
  id: string
  title: string
  detail: string
  href: string
  kind: 'appointment' | 'billing' | 'download'
}

function joinedPatientName(value: unknown) {
  const patient = Array.isArray(value) ? value[0] : value
  if (patient && typeof patient === 'object' && 'full_name' in patient) {
    return String(patient.full_name)
  }
  return 'Patient'
}

export default function NotificationBell() {
  const { selectedLocationId } = useLocation()
  const { staff, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<ClinicNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      if (!selectedLocationId && !isAdmin) {
        setNotifications([])
        return
      }
      setLoading(true)
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const locationFilter = selectedLocationId
      const [{ data: appointmentRows }, { data: invoiceRows }, { data: requestRows }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, scheduled_at, status, patients(full_name)')
          .eq('location_id', locationFilter ?? '')
          .in('status', ['pending', 'confirmed'])
          .gte('scheduled_at', now.toISOString())
          .lte('scheduled_at', tomorrow.toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(8),
        supabase
          .from('invoices')
          .select('id, status, subtotal, amount_paid, patients(full_name)')
          .eq('location_id', locationFilter ?? '')
          .in('status', ['unpaid', 'partially_paid'])
          .order('created_at', { ascending: true })
          .limit(8),
        supabase
          .from('download_requests')
          .select('id, resource_label, resource_type, status, requester_id, created_at, requester:staff!download_requests_requester_id_fkey(full_name)')
          .in('status', isAdmin ? ['pending'] : ['approved', 'rejected'])
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      if (cancelled) return
      const appointments: ClinicNotification[] = (appointmentRows ?? []).map((row) => {
        return {
          id: `appointment-${row.id}`,
          title: `Upcoming appointment · ${joinedPatientName(row.patients)}`,
          detail: `${new Date(row.scheduled_at).toLocaleString()} · ${row.status}`,
          href: '/appointments',
          kind: 'appointment',
        }
      })
      const bills: ClinicNotification[] = (invoiceRows ?? []).map((row) => {
        const balance = Math.max(Number(row.subtotal) - Number(row.amount_paid), 0)
        return {
          id: `invoice-${row.id}`,
          title: `Outstanding bill · ${joinedPatientName(row.patients)}`,
          detail: `₦${balance.toLocaleString('en-NG')} due · ${row.status.replace('_', ' ')}`,
          href: '/billing',
          kind: 'billing',
        }
      })
      const downloadRequests: ClinicNotification[] = (requestRows ?? [])
        .filter((row) => isAdmin || row.requester_id === staff?.id)
        .map((row) => {
          const requester = Array.isArray(row.requester) ? row.requester[0] : row.requester
          return {
            id: `download-${row.id}`,
            title: isAdmin ? `Download approval · ${requester?.full_name ?? 'Staff member'}` : `Download ${row.status}`,
            detail: row.resource_label,
            href: isAdmin ? '/download-approvals' : row.resource_type === 'billing_export' || row.resource_type === 'payment_receipt' ? '/billing' : '/patients',
            kind: 'download',
          }
        })
      setNotifications([...downloadRequests, ...appointments, ...bills].slice(0, 10))
      setLoading(false)
    }

    void loadNotifications()
    const refreshTimer = window.setInterval(() => { void loadNotifications() }, 30000)
    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
    }
  }, [selectedLocationId, open, isAdmin, staff?.id])

  function openNotification(notification: ClinicNotification) {
    setOpen(false)
    navigate(notification.href)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${notifications.length ? `, ${notifications.length} active` : ''}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-soft)] bg-white text-slate-text transition-colors hover:bg-gray-50"
      >
        <Bell size={17} />
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[var(--color-border-soft)] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-text">Notifications</h2>
            <span className="text-xs text-slate-muted">{notifications.length} active</span>
          </div>
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-slate-muted">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-muted">No active notifications.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-[var(--color-border-soft)]">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className="mt-0.5 text-[var(--color-clinic-orange-dark)]">
                      {notification.kind === 'appointment' ? <CalendarClock size={16} /> : notification.kind === 'billing' ? <CircleDollarSign size={16} /> : <Download size={16} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-text">{notification.title}</span>
                      <span className="mt-1 block text-xs text-slate-muted">{notification.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
