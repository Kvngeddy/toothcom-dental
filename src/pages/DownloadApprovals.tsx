import { useCallback, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type RequestRow = {
  id: string
  requester_id: string
  resource_type: string
  resource_label: string
  created_at: string
  requester?: { full_name: string; email: string } | null
}

export default function DownloadApprovals() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('download_requests')
      .select('id, requester_id, resource_type, resource_label, created_at, requester:staff!download_requests_requester_id_fkey(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (queryError) setError(queryError.message)
    else setRequests((data as unknown as RequestRow[]) ?? [])
  }, [])

  useEffect(() => { void loadRequests() }, [loadRequests])

  async function review(requestId: string, status: 'approved' | 'rejected') {
    const { data: userData } = await supabase.auth.getUser()
    const { error: updateError } = await supabase.from('download_requests').update({
      status,
      reviewed_by: userData.user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', requestId)
    if (updateError) setError(updateError.message)
    else await loadRequests()
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-slate-text">Download Approvals</h1>
      <p className="mt-1 text-sm text-slate-muted">Review staff requests to export or retrieve protected records.</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 divide-y divide-[var(--color-border-soft)] border-y border-[var(--color-border-soft)] bg-white">
        {requests.map((request) => (
          <article key={request.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-medium text-slate-text">{request.resource_label}</h2>
              <p className="mt-1 text-sm text-slate-muted">{request.requester?.full_name ?? 'Staff member'} · {request.requester?.email ?? ''}</p>
              <p className="mt-1 text-xs text-slate-muted">{new Date(request.created_at).toLocaleString()} · {request.resource_type.replaceAll('_', ' ')}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => void review(request.id, 'approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"><Check size={16} /> Approve</button>
              <button type="button" onClick={() => void review(request.id, 'rejected')} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm font-medium text-slate-text hover:bg-gray-50"><X size={16} /> Reject</button>
            </div>
          </article>
        ))}
        {requests.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-muted">No pending download requests.</p>}
      </div>
    </div>
  )
}