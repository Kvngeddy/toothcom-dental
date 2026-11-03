import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Save } from 'lucide-react'
import { getPatient, updatePatient } from '@/hooks/usePatients'
import type { Patient } from '@/types'
import CaseNotesTab from '@/components/CaseNotesTab'

type Tab = 'info' | 'notes'

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getPatient(id).then(({ data }) => {
      setPatient(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-slate-muted">Loading patient…</p>
  if (!patient) return <p className="text-slate-muted">Patient not found.</p>

  return (
    <div>
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-sm text-slate-muted hover:text-slate-text mb-5"
      >
        <ArrowLeft size={16} />
        Back to patients
      </button>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 md:grid-cols-[280px_minmax(0,1fr)] md:gap-6">
        <PatientCard patient={patient} />

        <div className="min-w-0">
          <div className="flex gap-1 border-b border-[var(--color-border-soft)] mb-5">
            <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
              Personal Info
            </TabButton>
            <TabButton active={tab === 'notes'} onClick={() => setTab('notes')}>
              Case Notes
            </TabButton>
          </div>

          {tab === 'info' && (
            <PersonalInfoForm patient={patient} onSaved={setPatient} />
          )}
          {tab === 'notes' && <CaseNotesTab patientId={patient.id} />}
        </div>
      </div>
    </div>
  )
}

function PatientCard({ patient }: { patient: Patient }) {
  return (
    <div className="bg-white border border-[var(--color-border-soft)] rounded-xl p-5">
      <div className="w-14 h-14 rounded-full bg-[var(--color-clinic-orange-tint)] text-[var(--color-clinic-orange-dark)] flex items-center justify-center mb-3">
        <User size={24} />
      </div>
      <h2 className="font-display font-semibold text-lg text-slate-text">{patient.full_name}</h2>
      <p className="text-sm text-slate-muted mb-4">
        {patient.date_of_birth ? `DOB ${patient.date_of_birth}` : 'DOB not on file'}
      </p>
      <dl className="space-y-2 text-sm">
        <Row label="Paper case note number" value={patient.case_note_number} />
        <Row label="Phone" value={patient.phone} />
        <Row label="Email" value={patient.email} />
        <Row label="Address" value={patient.address} />
        <Row label="Emergency contact" value={patient.emergency_contact_name} />
        <Row label="Emergency phone" value={patient.emergency_contact_phone} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-slate-muted text-xs">{label}</dt>
      <dd className="text-slate-text">{value || '—'}</dd>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 whitespace-normal px-2 py-2.5 text-center text-sm font-medium border-b-2 -mb-px transition-colors sm:flex-none sm:px-4 ${
        active
          ? 'border-[var(--color-clinic-orange)] text-slate-text'
          : 'border-transparent text-slate-muted hover:text-slate-text'
      }`}
    >
      {children}
    </button>
  )
}

function PersonalInfoForm({
  patient,
  onSaved,
}: {
  patient: Patient
  onSaved: (p: Patient) => void
}) {
  const [form, setForm] = useState(patient)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof Patient>(key: K, value: Patient[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data } = await updatePatient(patient.id, {
      full_name: form.full_name,
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      address: form.address,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      medical_notes: form.medical_notes,
    })
    setSaving(false)
    if (data) {
      onSaved(data)
      setSaved(true)
    }
  }

  const fieldClass =
    'w-full min-w-0 rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]'

  return (
    <div className="min-w-0 rounded-xl border border-[var(--color-border-soft)] bg-white p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input className={fieldClass} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </Field>
        <Field label="Date of birth">
          <input type="date" className={fieldClass} value={form.date_of_birth ?? ''} onChange={(e) => set('date_of_birth', e.target.value)} />
        </Field>
        <Field label="Gender">
          <input className={fieldClass} value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={fieldClass} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={fieldClass} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Address">
          <input className={fieldClass} value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <Field label="Emergency contact name">
          <input className={fieldClass} value={form.emergency_contact_name ?? ''} onChange={(e) => set('emergency_contact_name', e.target.value)} />
        </Field>
        <Field label="Emergency contact phone">
          <input className={fieldClass} value={form.emergency_contact_phone ?? ''} onChange={(e) => set('emergency_contact_phone', e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Medical notes">
            <textarea rows={3} className={fieldClass} value={form.medical_notes ?? ''} onChange={(e) => set('medical_notes', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-muted mb-1">{label}</label>
      {children}
    </div>
  )
}
