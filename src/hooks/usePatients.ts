import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Patient } from '@/types'

export function usePatients(search: string, locationId: string | null) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPatients = useCallback(async () => {
    if (!locationId) {
      setPatients([])
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase.from('patients').select('*').order('full_name', { ascending: true })
    if (locationId !== 'all') query = query.eq('location_id', locationId)
    if (search.trim()) {
      query = query.ilike('full_name', `%${search.trim()}%`)
    }
    const { data, error } = await query
    if (!error && data) setPatients(data as Patient[])
    setLoading(false)
  }, [search, locationId])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  return { patients, loading, refetch: fetchPatients }
}

export async function createPatient(input: Partial<Patient>) {
  const { data, error } = await supabase.from('patients').insert(input).select().single()
  return { data: data as Patient | null, error }
}

export async function createPatients(inputs: Partial<Patient>[]) {
  const { data, error } = await supabase.from('patients').insert(inputs).select()
  return { data: (data as Patient[] | null) ?? null, error }
}

export async function updatePatient(id: string, input: Partial<Patient>) {
  const { data, error } = await supabase
    .from('patients')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data: data as Patient | null, error }
}

export async function getPatient(id: string) {
  const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()
  return { data: data as Patient | null, error }
}
