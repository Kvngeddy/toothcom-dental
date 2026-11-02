import { useCallback, useEffect, useState } from 'react'
import { Plus, X, ShieldCheck, Stethoscope, HeartPulse, UserCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { Staff, StaffRole } from '@/types'
import { useLocation } from '@/contexts/LocationContext'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  front_desk: 'Front Desk',
}

const ROLE_BADGE_STYLES: Record<StaffRole, string> = {
  admin: 'bg-[var(--color-clinic-orange-tint)] text-[var(--color-clinic-orange-dark)]',
  doctor: 'bg-blue-100 text-blue-700',
  nurse: 'bg-emerald-100 text-emerald-700',
  front_desk: 'bg-gray-100 text-slate-muted',
}

const ROLE_ICONS: Record<StaffRole, React.ComponentType<{ size?: number }>> = {
  admin: ShieldCheck,
  doctor: Stethoscope,
  nurse: HeartPulse,
  front_desk: UserCircle,
}

function RoleBadge({ role }: { role: StaffRole }) {
  const Icon = ROLE_ICONS[role]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ROLE_BADGE_STYLES[role]}`}
    >
      <Icon size={12} />
      {ROLE_LABELS[role]}
    </span>
  )
}

function StatusBadge({ status }: { status: Staff['status'] }) {
  if (status === 'active') return null
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      Pending
    </span>
  )
}

export default function StaffManagement() {
  const navigate = useNavigate()
  const { selectedLocationId } = useLocation()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    if (!selectedLocationId) {
      setStaffList([])
      setLoading(false)
      return
    }
    const { data } = await supabase.from('staff').select('*').eq('location_id', selectedLocationId).order('created_at', { ascending: true })
    if (data) setStaffList(data as Staff[])
    setLoading(false)
  }, [selectedLocationId])

  useEffect(() => {
    void fetchStaff()
  }, [fetchStaff])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-text">Staff Management</h1>
          <p className="text-slate-muted text-sm mt-1">Admin-only. Manage staff accounts and roles.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-full md:w-auto mt-3 md:mt-0 justify-center"
        >
          <Plus size={16} />
          Invite Staff
        </button>
      </div>

      {/* Desktop/tablet table */}
      <div className="hidden md:block bg-white rounded-xl border border-[var(--color-border-soft)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-soft)] text-left text-slate-muted">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Invited</th>
            </tr>
          </thead>
          <tbody>
            {!loading && staffList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-muted">
                  No staff accounts yet.
                </td>
              </tr>
            )}
            {staffList.map((s) => (
              <tr key={s.id} onClick={() => navigate(`/staff/${s.id}`)} className="cursor-pointer border-b border-[var(--color-border-soft)] last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-slate-text">{s.full_name}</td>
                <td className="px-5 py-3 text-slate-muted">{s.email}</td>
                <td className="px-5 py-3">
                  <RoleBadge role={s.role} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-5 py-3 text-slate-muted">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {!loading && staffList.length === 0 && (
          <div className="bg-white rounded-xl border border-[var(--color-border-soft)] p-4 text-center text-slate-muted">No staff accounts yet.</div>
        )}
        {staffList.map((s) => (
          <div key={s.id} onClick={() => navigate(`/staff/${s.id}`)} className="cursor-pointer bg-white rounded-xl border border-[var(--color-border-soft)] p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-text">{s.full_name}</div>
              <div className="text-sm text-slate-muted">{new Date(s.created_at).toLocaleDateString()}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-slate-muted">{s.email}</div>
              <div>
                <RoleBadge role={s.role} />
              </div>
            </div>
            <div className="mt-2">{s.status !== 'active' && <StatusBadge status={s.status} />}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <InviteStaffModal
          locationId={selectedLocationId}
          onClose={() => setShowModal(false)}
          onDone={() => {
            setShowModal(false)
            fetchStaff()
          }}
        />
      )}
    </div>
  )
}

function InviteStaffModal({ onClose, onDone, locationId }: { onClose: () => void; onDone: () => void; locationId: string | null }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<StaffRole>('front_desk')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite() {
    if (!email.trim() || !fullName.trim()) {
      setError('Name and email are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    // Calls a Supabase Edge Function that uses the service role key to
    // invite the user via Supabase Auth and insert their `staff` row —
    // this must run server-side since it needs elevated privileges.
    const { error } = await supabase.functions.invoke('invite-staff', {
      body: { email: email.trim(), fullName: fullName.trim(), role, locationId },
    })
    setSubmitting(false)

    if (error) {
      // supabase-js wraps any non-2xx response in a generic
      // "Edge Function returned a non-2xx status code" message — the
      // actual reason we sent back is in the response body itself.
      let message = error.message
      if ('context' in error && error.context instanceof Response) {
        try {
          const body = await error.context.json()
          if (body?.error) message = body.error
        } catch {
          // response wasn't JSON — fall back to the generic message
        }
      }
      setError(message)
    } else {
      onDone()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Invite Staff</h2>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-text">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            >
              <option value="front_desk">Front Desk</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white disabled:opacity-60"
          >
            {submitting ? 'Inviting…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  )
}