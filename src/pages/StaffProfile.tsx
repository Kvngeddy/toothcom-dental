import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Save, ShieldCheck, UserCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import type { Staff, StaffRole } from '@/types'

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  front_desk: 'Front Desk',
}

export default function StaffProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { staff: currentStaff, isAdmin, updateOwnProfileName } = useAuth()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const selectedId = id ?? currentStaff?.id ?? null
  const canEdit = !!selectedId && !!currentStaff && (isAdmin || currentStaff.id === selectedId)

  useEffect(() => {
    if (!selectedId) {
      setLoading(false)
      setStaff(null)
      return
    }

    let isMounted = true

    async function loadStaff() {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', selectedId)
        .maybeSingle()

      if (!isMounted) return

      if (error) {
        setError(error.message)
        setStaff(null)
        setLoading(false)
        return
      }

      setStaff((data as Staff) ?? null)
      setError(null)
      setLoading(false)
    }

    void loadStaff()

    return () => {
      isMounted = false
    }
  }, [selectedId])

  if (loading) {
    return <p className="text-slate-muted">Loading staff profile…</p>
  }

  if (!selectedId || !staff) {
    return <p className="text-slate-muted">Staff profile not found.</p>
  }

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-text">Access restricted</p>
        <p className="mt-2 text-sm text-slate-muted">You can only edit your own profile or an admin-managed staff member.</p>
      </div>
    )
  }

  const isOwnProfile = currentStaff?.id === staff.id

  async function handleSave() {
    if (!staff) return

    const nextName = staff.full_name.trim()
    if (!nextName) {
      setError('Full name is required.')
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      if (isOwnProfile) {
        const { error } = await updateOwnProfileName(nextName)
        if (error) throw new Error(error)
      } else if (isAdmin) {
        const { error } = await supabase
          .from('staff')
          .update({
            full_name: nextName,
            role: staff.role,
          })
          .eq('id', staff.id)

        if (error) throw new Error(error.message)
      } else {
        throw new Error('You do not have permission to edit this profile.')
      }

      setStaff((current) => (current ? { ...current, full_name: nextName } : current))
      setSaved(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!staff) return
    setPasswordError(null)
    setPasswordSaved(false)

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.")
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('Choose a new password different from your current password.')
      return
    }

    setPasswordSaving(true)
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: staff.email,
      password: currentPassword,
    })

    if (verifyError) {
      setPasswordError('Current password is incorrect.')
      setPasswordSaving(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (updateError) {
      setPasswordError(updateError.message)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSaved(true)
  }

  return (
    <div>
      <button
        onClick={() => navigate(isAdmin ? '/staff' : '/dashboard')}
        className="mb-5 flex items-center gap-2 text-sm text-slate-muted hover:text-slate-text"
      >
        <ArrowLeft size={16} />
        {isAdmin ? 'Back to staff management' : 'Back to dashboard'}
      </button>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-clinic-orange-tint)] text-[var(--color-clinic-orange-dark)]">
            <UserCircle size={32} />
          </div>
          <h1 className="text-2xl font-display font-semibold text-slate-text">{staff.full_name}</h1>
          <p className="mt-1 text-sm text-slate-muted">{ROLE_LABELS[staff.role] || 'Staff member'}</p>

          <div className="mt-6 space-y-3 text-sm">
            <InfoRow label="Email" value={staff.email} />
            <InfoRow label="Status" value={staff.status === 'active' ? 'Active' : 'Invited'} />
            <InfoRow label="Joined" value={new Date(staff.created_at).toLocaleDateString()} />
          </div>
        </aside>

        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-slate-text">
            <ShieldCheck size={18} className="text-[var(--color-clinic-orange)]" />
            <h2 className="text-lg font-semibold">Profile details</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                value={staff.full_name}
                onChange={(event) => setStaff((current) => (current ? { ...current, full_name: event.target.value } : current))}
                className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
              />
            </Field>

            <Field label="Email">
              <input
                value={staff.email}
                disabled
                className="w-full rounded-lg border border-[var(--color-border-soft)] bg-slate-50 px-3 py-2 text-sm text-slate-muted"
              />
            </Field>

            <Field label="Role">
              <select
                value={staff.role}
                onChange={(event) => setStaff((current) => (current ? { ...current, role: event.target.value as StaffRole } : current))}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)] disabled:bg-slate-50 disabled:text-slate-muted"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <input
                value={staff.status === 'active' ? 'Active' : 'Invited'}
                disabled
                className="w-full rounded-lg border border-[var(--color-border-soft)] bg-slate-50 px-3 py-2 text-sm text-slate-muted"
              />
            </Field>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {saved && <p className="mt-4 text-sm text-green-600">Profile saved.</p>}

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-clinic-orange)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-clinic-orange-dark)] disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {!isAdmin && (
              <span className="text-sm text-slate-muted">You can only update your own name here.</span>
            )}
          </div>
        </section>
      </div>

      {isOwnProfile && (
        <section className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 sm:p-6">
          <div className="mb-1 flex items-center gap-2 text-slate-text">
            <ShieldCheck size={18} className="text-[var(--color-clinic-orange)]" />
            <h2 className="text-lg font-semibold">Update password</h2>
          </div>
          <p className="mb-5 text-sm text-slate-muted">Verify your current password before choosing a new one.</p>
          <form onSubmit={handlePasswordChange} className="max-w-xl space-y-4">
            <Field label="Current password">
              <input
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
              />
            </Field>
            {passwordError && <p role="alert" className="text-sm text-red-600">{passwordError}</p>}
            {passwordSaved && <p role="status" className="text-sm text-green-600">Password updated. Use the new password next time you sign in.</p>}
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-clinic-orange)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-clinic-orange-dark)] disabled:opacity-60"
            >
              {passwordSaving ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-muted">{label}</dt>
      <dd className="mt-1 text-slate-text">{value}</dd>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-text">
      <span className="mb-1 block text-xs uppercase tracking-wide text-slate-muted">{label}</span>
      {children}
    </label>
  )
}
