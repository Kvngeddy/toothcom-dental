import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarClock, CircleDollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useLocation } from '@/contexts/LocationContext'

type ClinicNotification = {
  id: string
  title: string
  detail: string
  href: string
  kind: 'appointment' | 'billing'
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
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<ClinicNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      if (!selectedLocationId) {
        setNotifications([])
        return
      }
      setLoading(true)
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const [{ data: appointmentRows }, { data: invoiceRows }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, scheduled_at, status, patients(full_name)')
          .eq('location_id', selectedLocationId)
          .in('status', ['pending', 'confirmed'])
          .gte('scheduled_at', now.toISOString())
          .lte('scheduled_at', tomorrow.toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(8),
        supabase
          .from('invoices')
          .select('id, status, subtotal, amount_paid, patients(full_name)')
          .eq('location_id', selectedLocationId)
          .in('status', ['unpaid', 'partially_paid'])
          .order('created_at', { ascending: true })
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
      setNotifications([...appointments, ...bills].slice(0, 10))
      setLoading(false)
    }

    void loadNotifications()
    return () => {
      cancelled = true
    }
  }, [selectedLocationId, open])

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
                      {notification.kind === 'appointment' ? <CalendarClock size={16} /> : <CircleDollarSign size={16} />}
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
