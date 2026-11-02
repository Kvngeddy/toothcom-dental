import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { fetchCaseNotePages, getSignedReadUrl } from '@/hooks/useCaseNotes'
import type { CaseNotePage } from '@/types'

export default function PageViewer({
  caseNoteId,
  title,
  onClose,
}: {
  caseNoteId: string
  title: string
  onClose: () => void
}) {
  const [pages, setPages] = useState<CaseNotePage[]>([])
  const [current, setCurrent] = useState(0)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCaseNotePages(caseNoteId).then(({ data }) => {
      setPages(data)
      setLoading(false)
    })
  }, [caseNoteId])

  useEffect(() => {
    if (pages.length === 0) return
    setUrl(null)
    getSignedReadUrl(pages[current].gcs_object_path).then(({ url }) => {
      if (url) setUrl(url)
    })
  }, [pages, current])

  const page = pages[current]
  const isPdf = page?.file_type?.includes('pdf')

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <div>
          <h2 className="font-display font-semibold">{title}</h2>
          {pages.length > 0 && (
            <p className="text-white/50 text-sm">
              Page {current + 1} of {pages.length}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        {loading && <Loader2 className="animate-spin text-white/60" size={32} />}
        {!loading && pages.length === 0 && (
          <p className="text-white/60">No pages uploaded for this case note yet.</p>
        )}
        {!loading && url && !isPdf && (
          <img src={url} alt={`Page ${current + 1}`} className="max-h-full max-w-full rounded-lg shadow-2xl" />
        )}
        {!loading && url && isPdf && (
          <iframe src={url} title={`Page ${current + 1}`} className="w-full h-full max-w-3xl bg-white rounded-lg" />
        )}
      </div>

      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-6 py-4">
          <button
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
            className="text-white/70 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            disabled={current === pages.length - 1}
            onClick={() => setCurrent((c) => c + 1)}
            className="text-white/70 hover:text-white disabled:opacity-30"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  )
}
