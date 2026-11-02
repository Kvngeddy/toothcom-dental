import { useCallback, useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import type { Service, ServicePriceType } from '@/types/billings'

function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-NG')}`
}

function priceDisplay(s: Service) {
  if (s.price_type === 'fixed') {
    return formatNaira(s.price ?? 0)
  }
  if (s.price_min != null && s.price_max != null) {
    return `${formatNaira(s.price_min)} – ${formatNaira(s.price_max)}`
  }
  if (s.price_min != null) {
    return `From ${formatNaira(s.price_min)}`
  }
  return 'Price varies'
}

export default function ServicesList() {
  const { staff } = useAuth()
  const { selectedLocationId } = useLocation()
  const isAdmin = staff?.role === 'admin'
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    if (data) setServices(data as Service[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedLocationId) void fetchServices()
    else setLoading(false)
  }, [selectedLocationId, fetchServices])

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    acc[s.category] = acc[s.category] ?? []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-text">Services</h1>
          <p className="text-slate-muted text-sm mt-1">Toothcom Dental Clinics price list.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Service
          </button>
        )}
      </div>

      {!loading && services.length === 0 && (
        <div className="bg-white rounded-xl border border-[var(--color-border-soft)] py-16 text-center text-slate-muted">
          No services on record yet.
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl border border-[var(--color-border-soft)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--color-border-soft)] bg-gray-50">
              <h2 className="font-display font-semibold text-sm text-slate-text">{category}</h2>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--color-border-soft)] last:border-0">
                    <td className="px-5 py-3 text-slate-text">
                      {s.name}
                      {s.note && <span className="text-slate-muted"> · {s.note}</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-text whitespace-nowrap">
                      {priceDisplay(s)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {showModal && (
        <AddServiceModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            fetchServices()
          }}
        />
      )}
    </div>
  )
}

function AddServiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [priceType, setPriceType] = useState<ServicePriceType>('fixed')
  const [price, setPrice] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!category.trim() || !name.trim()) {
      setError('Category and name are required.')
      return
    }
    if (priceType === 'fixed' && !price.trim()) {
      setError('Enter a price for a fixed-price service.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error } = await supabase.from('services').insert({
      category: category.trim(),
      name: name.trim(),
      note: note.trim() || null,
      price_type: priceType,
      price: priceType === 'fixed' ? Number(price) : null,
      price_min: priceType === 'variable' && priceMin ? Number(priceMin) : null,
      price_max: priceType === 'variable' && priceMax ? Number(priceMax) : null,
    })

    setSubmitting(false)
    if (error) setError(error.message)
    else onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Add Service</h2>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-text">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Periodontology"
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Service name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. per tooth, per quadrant"
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pricing</label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as ServicePriceType)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            >
              <option value="fixed">Fixed price</option>
              <option value="variable">Variable (range or depending)</option>
            </select>
          </div>

          {priceType === 'fixed' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Price (₦)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Min (optional)</label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max (optional)</label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save service'}
          </button>
        </div>
      </div>
    </div>
  )
}