import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { CaseNote, CaseNotePage } from '@/types'

const BUCKET = 'Toothcom Bucket'

export function useCaseNotes(patientId: string) {
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCaseNotes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('case_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    if (!error && data) setCaseNotes(data as CaseNote[])
    setLoading(false)
  }, [patientId])

  useEffect(() => {
    fetchCaseNotes()
  }, [fetchCaseNotes])

  return { caseNotes, loading, refetch: fetchCaseNotes }
}

export async function createCaseNote(input: {
  patient_id: string
  title: string
  note_date?: string | null
  category?: string | null
  created_by: string
}) {
  const { data, error } = await supabase.from('case_notes').insert(input).select().single()
  return { data: data as CaseNote | null, error }
}

export async function fetchCaseNotePages(caseNoteId: string) {
  const { data, error } = await supabase
    .from('case_note_pages')
    .select('*')
    .eq('case_note_id', caseNoteId)
    .order('page_number', { ascending: true })
  return { data: (data as CaseNotePage[]) ?? [], error }
}

/**
 * Requests a short-lived signed upload URL from the `generate-upload-url`
 * Supabase Edge Function, uploads the file straight to Google Cloud Storage,
 * then records the resulting object path in `case_note_pages`.
 */
export async function uploadCaseNotePage(params: {
  caseNoteId: string
  patientId: string
  pageNumber: number
  file: File
  uploadedBy: string
}) {
  const { caseNoteId, patientId, pageNumber, file, uploadedBy } = params

  // Storage keys dislike spaces and odd characters, so clean the file name
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const objectPath = `${patientId}/${caseNoteId}/${pageNumber}-${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, { contentType: file.type })

  if (uploadError) {
    return { error: uploadError }
  }

  const { error: insertError } = await supabase.from('case_note_pages').insert({
    case_note_id: caseNoteId,
    page_number: pageNumber,
    gcs_object_path: objectPath, // now holds the Supabase Storage path
    file_type: file.type,
    uploaded_by: uploadedBy,
  })

  if (insertError) {
    // Don't leave an orphaned file behind if the database insert failed
    await supabase.storage.from(BUCKET).remove([objectPath])
    return { error: insertError }
  }

  await supabase.rpc('increment_case_note_page_count', { p_case_note_id: caseNoteId })

  return { error: null }
}

/** Creates a short-lived signed URL (1 hour) for viewing a stored page. */
export async function getSignedReadUrl(objectPath: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 3600)
  return { url: data?.signedUrl as string | undefined, error }
}