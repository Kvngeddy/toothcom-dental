import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export interface ClinicLocation {
  id: string
  name: string
}

interface LocationContextValue {
  locations: ClinicLocation[]
  selectedLocation: ClinicLocation | null
  selectedLocationId: string | null
  loading: boolean
  selectLocation: (locationId: string) => void
  addLocation: (name: string) => Promise<{ error: string | null }>
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)
const STORAGE_KEY = 'toothcom-selected-location'

export function LocationProvider({ children }: { children: ReactNode }) {
  const { session, isAdmin } = useAuth()
  const [locations, setLocations] = useState<ClinicLocation[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const userId = session?.user?.id

  useEffect(() => {
    let cancelled = false

    async function loadLocations() {
      if (!userId) {
        setLocations([])
        setSelectedLocationId(null)
        setLoading(false)
        return
      }

      setLoading(true)
      const { data } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (cancelled) return
      const loadedLocations = (data ?? []) as ClinicLocation[]
      setLocations(loadedLocations)
      const savedLocationId = localStorage.getItem(STORAGE_KEY)
      const selected = loadedLocations.find((location) => location.id === savedLocationId)
        ?? loadedLocations.find((location) => location.name === 'Toothcom Amuwo-Odofin')
        ?? loadedLocations[0]
        ?? null
      setSelectedLocationId(selected?.id ?? null)
      if (selected) localStorage.setItem(STORAGE_KEY, selected.id)
      setLoading(false)
    }

    void loadLocations()
    return () => {
      cancelled = true
    }
  }, [userId])

  function selectLocation(locationId: string) {
    if (!locations.some((location) => location.id === locationId)) return
    setSelectedLocationId(locationId)
    localStorage.setItem(STORAGE_KEY, locationId)
  }

  async function addLocation(name: string) {
    if (!isAdmin) return { error: 'Only admins can add locations.' }
    const trimmedName = name.trim()
    if (!trimmedName) return { error: 'Enter a location name.' }

    const { data, error } = await supabase
      .from('locations')
      .insert({ name: trimmedName })
      .select('id, name')
      .single()

    if (error) return { error: error.message }
    const newLocation = data as ClinicLocation
    setLocations((current) => [...current, newLocation].sort((a, b) => a.name.localeCompare(b.name)))
    selectLocation(newLocation.id)
    return { error: null }
  }

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null

  return (
    <LocationContext.Provider
      value={{ locations, selectedLocation, selectedLocationId, loading, selectLocation, addLocation }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocation must be used within LocationProvider')
  return context
}