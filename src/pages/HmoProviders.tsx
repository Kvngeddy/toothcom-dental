import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type HmoProvider = { id: string; name: string; is_active: boolean }

export default function HmoProviders() {
  const [providers, setProviders] = useState<HmoProvider[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function loadProviders() {
    const { data, error: queryError } = await supabase
      .from('hmo_providers')
      .select('id, name, is_active')
      .order('name')
    if (queryError) setError(queryError.message)
    else setProviders((data as HmoProvider[]) ?? [])
  }

  useEffect(() => { void loadProviders() }, [])

  async function addProvider(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('hmo_providers').insert({ name: name.trim() })
    setSaving(false)
    if (insertError) setError(insertError.message.includes('hmo_providers_name_lower_uidx') ? 'That provider already exists.' : insertError.message)
    else {
      setName('')
      await loadProviders()
    }
  }

  async function toggleProvider(provider: HmoProvider) {
    const { error: updateError } = await supabase.from('hmo_providers').update({ is_active: !provider.is_active }).eq('id', provider.id)
    if (updateError) setError(updateError.message)
    else await loadProviders()
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-display font-semibold text-slate-text">HMO Providers</h1>
      <p className="mt-1 text-sm text-slate-muted">Manage the providers available when registering patients.</p>
      <form onSubmit={(event) => void addProvider(event)} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Provider name" aria-label="Provider name" className="min-w-0 flex-1 rounded-lg border border-[var(--color-border-soft)] bg-white px-3 py-2.5 text-sm" />
        <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-clinic-orange)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
          <Plus size={16} /> Add provider
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-6 divide-y divide-[var(--color-border-soft)] border-y border-[var(--color-border-soft)] bg-white">
        {providers.map((provider) => (
          <div key={provider.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm font-medium text-slate-text">{provider.name}</span>
            <button type="button" onClick={() => void toggleProvider(provider)} aria-label={`${provider.is_active ? 'Deactivate' : 'Activate'} ${provider.name}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-muted hover:bg-gray-50">
              <X size={15} /> {provider.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
        {providers.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-muted">No HMO providers found.</p>}
      </div>
    </div>
  )
}