// src/components/dashboard/DashboardHeader.tsx
import { useState } from 'react'
import { Search, ChevronDown, Menu, Plus, X } from 'lucide-react'
import { Avatar } from './ui'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import NotificationBell from '@/components/NotificationBell'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardHeader({
  adminName = 'Femi',
  onMenuClick,
}: {
  adminName?: string
  onMenuClick?: () => void
}) {
  const { isAdmin } = useAuth()
  const { locations, selectedLocationId, loading, selectLocation, addLocation } = useLocation()
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [savingLocation, setSavingLocation] = useState(false)

  async function handleAddLocation() {
    setSavingLocation(true)
    setLocationError(null)
    const { error } = await addLocation(newLocationName)
    setSavingLocation(false)
    if (error) setLocationError(error)
    else {
      setNewLocationName('')
      setShowAddLocation(false)
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-1">
      <div className="flex items-start gap-3">
        <button
          onClick={onMenuClick}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E4E9E7] bg-white text-[#4B5A57] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>
        <div>
          <h1 className="text-[22px] font-semibold text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
            {getGreeting()}, {adminName}
          </h1>
          <p className="mt-1 text-[13.5px] text-[#5B6B68]">Here's what's happening across your clinic today.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor="dashboard-location">Clinic location</label>
          <div className="relative">
            <select
              id="dashboard-location"
              value={selectedLocationId ?? ''}
              disabled={loading || locations.length === 0}
              onChange={(event) => selectLocation(event.target.value)}
              className="max-w-[190px] appearance-none rounded-lg border border-[#E4E9E7] bg-white py-2 pl-3 pr-9 text-[13px] font-medium text-[#4B5A57] transition-colors hover:border-[#0E7C74]/40 focus:border-[#0E7C74] focus:outline-none focus:ring-2 focus:ring-[#0E7C74]/15 disabled:opacity-60 sm:max-w-none"
            >
              {locations.length === 0 && <option value="">No locations</option>}
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5A57]" />
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddLocation(true)}
              aria-label="Add location"
              title="Add location"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4E9E7] bg-white text-[#0E7C74] transition-colors hover:border-[#0E7C74]/40"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="relative hidden sm:block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA6A2]" />
          <input
            type="text"
            placeholder="Search patients, appointments…"
            className="w-56 rounded-lg border border-[#E4E9E7] bg-white py-2 pl-9 pr-3 text-[13px] text-[#101B1A] placeholder:text-[#8AA6A2] transition-colors focus:border-[#0E7C74] focus:outline-none focus:ring-2 focus:ring-[#0E7C74]/15 lg:w-72"
          />
        </div>

        <NotificationBell />
        <Avatar name={adminName} size={36} to="/profile" />
      </div>

      {showAddLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation">
          <form
            onSubmit={(event) => { event.preventDefault(); void handleAddLocation() }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-location-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="add-location-title" className="text-lg font-semibold text-[#101B1A]">Add location</h2>
              <button type="button" onClick={() => setShowAddLocation(false)} aria-label="Close" className="text-[#5B6B68] hover:text-[#101B1A]">
                <X size={20} />
              </button>
            </div>
            <label htmlFor="new-location-name" className="mb-1 block text-sm font-medium text-[#4B5A57]">Location name</label>
            <input
              id="new-location-name"
              autoFocus
              value={newLocationName}
              onChange={(event) => setNewLocationName(event.target.value)}
              className="w-full rounded-lg border border-[#E4E9E7] px-3 py-2 text-sm focus:border-[#0E7C74] focus:outline-none focus:ring-2 focus:ring-[#0E7C74]/15"
              placeholder="Toothcom ..."
            />
            {locationError && <p className="mt-2 text-sm text-red-600">{locationError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddLocation(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-[#5B6B68] hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={savingLocation || !newLocationName.trim()} className="rounded-lg bg-[#0E7C74] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {savingLocation ? 'Adding…' : 'Add location'}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}