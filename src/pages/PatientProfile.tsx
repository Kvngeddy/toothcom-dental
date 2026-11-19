import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Save, Download } from 'lucide-react'
import { getPatient, updatePatient } from '@/hooks/usePatients'
import type { Patient } from '@/types'
import CaseNotesTab from '@/components/CaseNotesTab'
import MobileInstallButton from '@/components/MobileInstallButton'
import { supabase } from '@/lib/supabaseClient'
import { useInstallApp } from '@/contexts/InstallContext'

type Tab = 'info' | 'notes'
type IntakeRegistration = Record<string, unknown>
type DoctorNote = { id: string; note: string; created_by: string | null; created_at: string }

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [registration, setRegistration] = useState<IntakeRegistration | null>(null)
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const { canInstall, isInstalled, install } = useInstallApp()

  useEffect(() => {
    if (!id) return
    const patientId = id
    let active = true

    async function loadProfile() {
      const [{ data: patientData }, { data: caseNotes }] = await Promise.all([
        getPatient(patientId),
        supabase
          .from('case_notes')
          .select('id, intake_submission_id, created_at')
          .eq('patient_id', patientId)
          .not('intake_submission_id', 'is', null)
          .order('created_at', { ascending: false }),
      ])
      if (!active) return

      const intakeCaseNotes = caseNotes ?? []
      const latestIntakeCaseNote = intakeCaseNotes[0]
      if (latestIntakeCaseNote?.intake_submission_id) {
        const [{ data: submission }, { data: notes }] = await Promise.all([
          supabase
            .from('patient_intake_submissions')
            .select('registration')
            .eq('id', latestIntakeCaseNote.intake_submission_id)
            .maybeSingle(),
          supabase
            .from('case_note_doctor_notes')
            .select('id, note, created_by, created_at')
            .in('case_note_id', intakeCaseNotes.map((caseNote) => caseNote.id))
            .order('created_at', { ascending: true }),
        ])
        if (!active) return
        setRegistration((submission?.registration as IntakeRegistration | null) ?? null)
        setDoctorNotes((notes as DoctorNote[] | null) ?? [])
      }
      setPatient(patientData)
      setLoading(false)
    }

    void loadProfile()
    return () => { active = false }
  }, [id])

  if (loading) return <p className="text-slate-muted">Loading patient…</p>
  if (!patient) return <p className="text-slate-muted">Patient not found.</p>

  const intakeValue = (...keys: string[]) => {
    for (const key of keys) {
      const value = registration?.[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return null
  }
  const profilePatient: Patient = {
    ...patient,
    gender: patient.gender || intakeValue('sex'),
    phone: patient.phone || intakeValue('whatsappNo', 'officePhone'),
    email: patient.email || intakeValue('email'),
    address: patient.address || intakeValue('homeAddress'),
    emergency_contact_name: patient.emergency_contact_name || intakeValue('nextOfKinName'),
    emergency_contact_phone: patient.emergency_contact_phone || intakeValue('nextOfKinPhone'),
    medical_notes: doctorNotes.length
      ? doctorNotes.map((note) => note.note).join('\n\n')
      : patient.medical_notes,
  }

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
        <PatientCard patient={profilePatient} />

        <div className="min-w-0">
          <div className="mb-4 flex justify-end">
            <MobileInstallButton />
            {canInstall && !isInstalled && (
              <button
                type="button"
                onClick={() => void install()}
                className="hidden items-center gap-2 rounded-lg bg-[var(--color-clinic-orange)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-clinic-orange-dark)] md:inline-flex"
              >
                <Download size={16} /> Install app
              </button>
            )}
          </div>
          <div className="flex gap-1 border-b border-[var(--color-border-soft)] mb-5">
            <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
              Personal Info
            </TabButton>
            <TabButton active={tab === 'notes'} onClick={() => setTab('notes')}>
              Case Notes
            </TabButton>
          </div>

          {tab === 'info' && (
            <>
              <PersonalInfoForm
                key={patient.id}
                patient={profilePatient}
                onSaved={setPatient}
                medicalNotesFromDoctorNotes={doctorNotes.length > 0}
              />
              {registration && (
                <section className="mt-5 rounded-xl border border-[var(--color-border-soft)] bg-white p-4 sm:p-6">
                  <h2 className="font-display text-base font-semibold text-slate-text">Additional intake details</h2>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Row label="Occupation" value={intakeValue('occupation')} />
                    <Row label="Marital status" value={intakeValue('maritalStatus')} />
                    <Row label="Office address" value={intakeValue('officeAddress')} />
                    <Row label="Office phone" value={intakeValue('officePhone')} />
                    <Row label="Next-of-kin address" value={intakeValue('nextOfKinAddress')} />
                  </dl>
                </section>
              )}
              {doctorNotes.length > 0 && (
                <section className="mt-5 rounded-xl border border-[var(--color-border-soft)] bg-white p-4 sm:p-6">
                  <h2 className="font-display text-base font-semibold text-slate-text">Doctor note history</h2>
                  <div className="mt-3 space-y-3">
                    {doctorNotes.map((note) => (
                      <article key={note.id} className="border-t border-[var(--color-border-soft)] pt-3 first:border-0 first:pt-0">
                        <p className="whitespace-pre-wrap text-sm text-slate-text">{note.note}</p>
                        <p className="mt-1 text-xs text-slate-muted">{new Date(note.created_at).toLocaleString()}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
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
        <Row label="Electronic case note number" value={patient.electronic_case_note_number} />
        <Row label="Paper case note number" value={patient.case_note_number} />
        <Row label="Insurance" value={patient.insurance_type === 'hmo' ? patient.hmo_provider?.name ?? 'HMO' : 'Non-HMO'} />
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
  medicalNotesFromDoctorNotes = false,
}: {
  patient: Patient
  onSaved: (p: Patient) => void
  medicalNotesFromDoctorNotes?: boolean
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
      ...(!medicalNotesFromDoctorNotes && { medical_notes: form.medical_notes }),
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
          <Field label={medicalNotesFromDoctorNotes ? 'Medical notes (from intake doctor notes)' : 'Medical notes'}>
            <textarea
              rows={3}
              readOnly={medicalNotesFromDoctorNotes}
              className={`${fieldClass} ${medicalNotesFromDoctorNotes ? 'bg-gray-50' : ''}`}
              value={form.medical_notes ?? ''}
              onChange={(e) => set('medical_notes', e.target.value)}
            />
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
