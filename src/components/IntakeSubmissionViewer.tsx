import { useEffect, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { supabase } from '@/lib/supabaseClient'
import type { IntakePayload } from '@/pages/PatientIntakeForm'

type IntakeSubmission = {
  registration: IntakePayload['registration']
  medical_history: IntakePayload['medicalHistory']
  dental_history: IntakePayload['dentalHistory']
  consent_name: string
  submitted_at: string
}

const sections: { title: string; key: 'registration' | 'medical_history' | 'dental_history' }[] = [
  { title: 'Registration', key: 'registration' },
  { title: 'Medical history', key: 'medical_history' },
  { title: 'Dental history', key: 'dental_history' },
]

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None selected'
  return String(value)
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
}

export default function IntakeSubmissionViewer({
  submissionId,
  title,
  onClose,
}: {
  submissionId: string
  title: string
  onClose: () => void
}) {
  const [submission, setSubmission] = useState<IntakeSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadSubmission() {
      const { data, error: queryError } = await supabase
        .from('patient_intake_submissions')
        .select('registration, medical_history, dental_history, consent_name, submitted_at')
        .eq('id', submissionId)
        .single()

      if (!active) return
      if (queryError || !data) {
        setError(queryError?.message ?? 'Could not load this intake submission.')
      } else {
        setSubmission(data as IntakeSubmission)
      }
      setLoading(false)
    }

    void loadSubmission()
    return () => { active = false }
  }, [submissionId])

  async function downloadWordDocument() {
    if (!submission) return

    setDownloading(true)
    setError(null)
    try {
      const paragraphs = [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
        new Paragraph({
          children: [new TextRun({ text: `Submitted ${new Date(submission.submitted_at).toLocaleString()}`, italics: true })],
          spacing: { after: 300 },
        }),
        ...sections.flatMap((section) => [
          new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
          ...Object.entries(submission[section.key] as Record<string, unknown>).map(([key, value]) =>
            new Paragraph({
              children: [
                new TextRun({ text: `${formatLabel(key)}: `, bold: true }),
                new TextRun(displayValue(value)),
              ],
              spacing: { after: 120 },
            }),
          ),
        ]),
        new Paragraph({ text: 'Consent', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Patient signature: ', bold: true }),
            new TextRun(displayValue(submission.consent_name)),
          ],
        }),
      ]
      const document = new Document({ sections: [{ children: paragraphs }] })
      const blob = await Packer.toBlob(document)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      link.href = url
      link.download = `${safeTitle || 'patient-intake'}.docx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Could not create the Word document.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="intake-submission-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-6 py-4">
          <div className="min-w-0">
            <h2 id="intake-submission-title" className="font-display text-lg font-semibold">{title}</h2>
            {submission && (
              <p className="mt-1 text-xs text-slate-muted">
                Submitted {new Date(submission.submitted_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {submission && (
              <button
                onClick={() => void downloadWordDocument()}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                <span>{downloading ? 'Preparing...' : 'Download Word'}</span>
              </button>
            )}
            <button onClick={onClose} aria-label="Close intake submission" className="text-slate-muted hover:text-slate-text">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-muted">
              <Loader2 className="animate-spin" size={18} /> Loading intake submission...
            </div>
          )}
          {error && <p role="alert" className="py-8 text-sm text-red-600">{error}</p>}
          {submission && (
            <div className="space-y-6">
              {sections.map((section) => (
                <section key={section.key}>
                  <h3 className="mb-3 border-b border-[var(--color-border-soft)] pb-2 text-sm font-semibold text-slate-text">
                    {section.title}
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    {Object.entries(submission[section.key] as Record<string, unknown>).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs text-slate-muted">{formatLabel(key)}</dt>
                        <dd className="mt-0.5 break-words text-sm text-slate-text">{displayValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <section>
                <h3 className="mb-3 border-b border-[var(--color-border-soft)] pb-2 text-sm font-semibold text-slate-text">
                  Consent
                </h3>
                <dl>
                  <dt className="text-xs text-slate-muted">Patient signature</dt>
                  <dd className="mt-0.5 text-sm text-slate-text">{displayValue(submission.consent_name)}</dd>
                </dl>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}