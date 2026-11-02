import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Staff } from '@/types'

interface AuthContextValue {
  session: Session | null
  staff: Staff | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateOwnProfileName: (fullName: string) => Promise<{ error: string | null }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadStaffProfile(userId: string) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setStaff(data as Staff)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) loadStaffProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadStaffProfile(newSession.user.id)
      } else {
        setStaff(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateOwnProfileName(fullName: string) {
    const { error } = await supabase.rpc('update_own_staff_profile', { new_full_name: fullName })
    if (!error && staff) setStaff({ ...staff, full_name: fullName })
    return { error: error?.message ?? null }
  }

  const value: AuthContextValue = {
    session,
    staff,
    loading,
    signIn,
    signOut,
    updateOwnProfileName,
    isAdmin: staff?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
