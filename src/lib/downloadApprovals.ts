import { supabase } from '@/lib/supabaseClient'

export type DownloadResource = 'intake_document' | 'billing_export' | 'payment_receipt' | 'case_note_page'

export async function authorizeDownload(params: {
  isAdmin: boolean
  requesterId: string | null
  resourceType: DownloadResource
  resourceId: string | null
  resourceLabel: string
  locationId?: string | null
}) {
  if (params.isAdmin) return { allowed: true, status: 'admin' as const, error: null }
  if (!params.requesterId) return { allowed: false, status: 'error' as const, error: 'Your staff profile is unavailable.' }

  const { data: existing, error: lookupError } = await supabase
    .from('download_requests')
    .select('id, status')
    .eq('requester_id', params.requesterId)
    .eq('resource_type', params.resourceType)
    .eq('resource_id', params.resourceId)
    .in('status', ['pending', 'approved', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) return { allowed: false, status: 'error' as const, error: lookupError.message }
  if (existing?.status === 'pending') {
    return { allowed: false, status: 'pending' as const, error: 'Your download request is waiting for admin approval.' }
  }
  if (existing?.status === 'completed') {
    if (params.resourceType === 'case_note_page') {
      return { allowed: true, status: 'approved' as const, error: null }
    }
  }
  if (existing?.status === 'approved') {
    const { data: consumed, error } = await supabase.rpc('consume_download_approval', { p_request_id: existing.id })
    if (error) return { allowed: false, status: 'error' as const, error: error.message }
    if (consumed) return { allowed: true, status: 'approved' as const, error: null }
  }

  const { error: insertError } = await supabase.from('download_requests').insert({
    requester_id: params.requesterId,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    resource_label: params.resourceLabel,
    location_id: params.locationId ?? null,
  })
  if (insertError) return { allowed: false, status: 'error' as const, error: insertError.message }
  return { allowed: false, status: 'pending' as const, error: 'Approval requested. You can download it after an admin approves the request.' }
}