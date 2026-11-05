import { useState } from 'react'
import { FileStack, Plus, X, UploadCloud, Loader2, Check, Save } from 'lucide-react'
import { useCaseNotes, createCaseNote, addCaseNoteDoctorNote, uploadCaseNotePage } from '@/hooks/useCaseNotes'
import { useAuth } from '@/contexts/AuthContext'
import PageViewer from '@/components/PageViewer'
import IntakeSubmissionViewer from '@/components/IntakeSubmissionViewer'
import { GenerateIntakeLinkButton } from '@/components/GeerateIntakeLinkButton'

export default function CaseNotesTab({ patientId }: { patientId: string }) {
  const { staff } = useAuth()
  const { caseNotes, loading, refetch } = useCaseNotes(patientId)
  const [showNew, setShowNew] = useState(false)
  const [viewing, setViewing] = useState<{ id: string; title: string } | null>(null)
  const [viewingIntake, setViewingIntake] = useState<{ id: string; title: string } | null>(null)
  const [doctorNoteDrafts, setDoctorNoteDrafts] = useState<Record<string, string>>({})
  const [savingDoctorNoteId, setSavingDoctorNoteId] = useState<string | null>(null)
  const [doctorNoteError, setDoctorNoteError] = useState<{ id: string; message: string } | null>(null)

  async function saveDoctorNote(noteId: string) {
    const text = doctorNoteDrafts[noteId]?.trim() ?? ''
    if (!text) return
    setSavingDoctorNoteId(noteId)
    setDoctorNoteError(null)
    const { error } = await addCaseNoteDoctorNote(noteId, text, staff?.id ?? null)
    if (error) {
      setDoctorNoteError({ id: noteId, message: error.message })
    } else {
      await refetch()
      setDoctorNoteDrafts((drafts) => {
        const next = { ...drafts }
        delete next[noteId]
        return next
      })
    }
    setSavingDoctorNoteId(null)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
  {/* Description */}
  <div className="min-w-0">
    <p className="text-sm text-slate-muted leading-5 max-w-xl">
      Scanned case notes for this patient, grouped as they were on paper.
    </p>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2 shrink-0">
    {/* Generate Intake Link */}
    <GenerateIntakeLinkButton patientId={patientId} />

    {/* New Case Note */}
    <button
      onClick={() => setShowNew(true)}
      className="
        inline-flex items-center gap-2
        bg-[var(--color-clinic-orange)]
        hover:bg-[var(--color-clinic-orange-dark)]
        text-white
        text-sm font-medium
        px-4 py-2.5
        rounded-lg
        transition-colors
        whitespace-nowrap
      "
    >
      <Plus size={16} />
      <span>New Case Note</span>
    </button>
  </div>
</div>

      {!loading && caseNotes.length === 0 && (
        <div className="border border-dashed border-[var(--color-border-soft)] rounded-xl py-10 text-center text-slate-muted text-sm">
          No case notes scanned yet for this patient.
        </div>
      )}

      <div className="space-y-2">
        {caseNotes.map((note) => (
          <div key={note.id} className="rounded-xl border border-[var(--color-border-soft)] bg-white p-4">
            <button
              onClick={() => {
                if (note.intake_submission_id) {
                  setViewingIntake({ id: note.intake_submission_id, title: note.title })
                } else {
                  setViewing({ id: note.id, title: note.title })
                }
              }}
              className="w-full flex items-center gap-4 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-clinic-orange-tint)] flex items-center justify-center text-[var(--color-clinic-orange-dark)] shrink-0">
                <FileStack size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-text truncate">{note.title}</p>
                <p className="text-xs text-slate-muted">
                  {note.category ? `${note.category} · ` : ''}
                  {note.note_date ?? new Date(note.created_at).toLocaleDateString()} ·{' '}
                  {note.page_count} page{note.page_count === 1 ? '' : 's'}
                </p>
              </div>
            </button>
            <div className="mt-3 border-t border-[var(--color-border-soft)] pt-3">
              <p className="mb-2 text-xs font-medium text-slate-muted">
                Doctor notes
              </p>
              {(note.doctor_notes ?? []).map((doctorNote) => (
                <div key={doctorNote.id} className="mb-2 rounded-lg bg-gray-50 px-3 py-2">
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-text">{doctorNote.note}</p>
                  <p className="mt-1 text-xs text-slate-muted">{new Date(doctorNote.created_at).toLocaleString()}</p>
                </div>
              ))}
              <label htmlFor={`doctor-note-${note.id}`} className="sr-only">
                Add a doctor note
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <textarea
                  id={`doctor-note-${note.id}`}
                  value={doctorNoteDrafts[note.id] ?? ''}
                  onChange={(event) => setDoctorNoteDrafts((drafts) => ({ ...drafts, [note.id]: event.target.value }))}
                  rows={2}
                  placeholder="Write a doctor note..."
                  className="min-w-0 flex-1 rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                />
                <button
                  onClick={() => void saveDoctorNote(note.id)}
                  disabled={savingDoctorNoteId === note.id || !(doctorNoteDrafts[note.id] ?? '').trim()}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm font-medium text-slate-text hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingDoctorNoteId === note.id ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Add note
                </button>
              </div>
              {doctorNoteError?.id === note.id && <p className="mt-1 text-xs text-red-600">{doctorNoteError.message}</p>}
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <NewCaseNoteModal
          patientId={patientId}
          onClose={() => setShowNew(false)}
          onDone={() => {
            setShowNew(false)
            refetch()
          }}
        />
      )}

      {viewing && (
        <PageViewer
          caseNoteId={viewing.id}
          title={viewing.title}
          onClose={() => setViewing(null)}
        />
      )}

      {viewingIntake && (
        <IntakeSubmissionViewer
          submissionId={viewingIntake.id}
          title={viewingIntake.title}
          onClose={() => setViewingIntake(null)}
        />
      )}
    </div>
  )
}

function NewCaseNoteModal({
  patientId,
  onClose,
  onDone,
}: {
  patientId: string
  onClose: () => void
  onDone: () => void
}) {
  const { staff } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [noteDate, setNoteDate] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [step, setStep] = useState<'details' | 'uploading' | 'done'>('details')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function handleFiles(list: FileList | null) {
    if (!list) return
    setFiles(Array.from(list))
  }

  async function handleUpload() {
    if (!title.trim()) {
      setError('Give this case note a title.')
      return
    }
    if (files.length === 0) {
      setError('Add at least one scanned page.')
      return
    }
    if (!staff) return

    setError(null)
    setStep('uploading')

    const { data: note, error: createError } = await createCaseNote({
      patient_id: patientId,
      title: title.trim(),
      category: category || null,
      note_date: noteDate || null,
      created_by: staff.id,
    })

    if (createError || !note) {
      setError(createError?.message ?? 'Could not create case note.')
      setStep('details')
      return
    }

    for (let i = 0; i < files.length; i++) {
      const { error: uploadError } = await uploadCaseNotePage({
        caseNoteId: note.id,
        patientId,
        pageNumber: i + 1,
        file: files[i],
        uploadedBy: staff.id,
      })
      if (uploadError) {
        setError(`Page ${i + 1} failed: ${uploadError.message}`)
        setStep('details')
        return
      }
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    setStep('done')
    setTimeout(onDone, 700)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">New Case Note</h2>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-text">
            <X size={20} />
          </button>
        </div>

        {step === 'details' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Initial Consultation - Jan 2024"
                className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Date on record</label>
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Treatment"
                  className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Scanned pages (image or PDF)</label>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border-soft)] rounded-xl py-6 cursor-pointer hover:border-[var(--color-clinic-orange)] transition-colors">
                <UploadCloud size={22} className="text-slate-muted" />
                <span className="text-sm text-slate-muted">
                  {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select pages, in order'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white"
              >
                Upload case note
              </button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[var(--color-clinic-orange)]" size={28} />
            <p className="text-sm text-slate-muted">Uploading pages… {progress}%</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <Check size={20} />
            </div>
            <p className="text-sm text-slate-text">Case note saved.</p>
          </div>
        )}
      </div>
    </div>
  )
}
