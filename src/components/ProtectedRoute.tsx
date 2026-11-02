import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-muted">
        Your teeth,Our Passion…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-[var(--color-border-soft)]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="text-slate-text">
            <Menu size={20} />
          </button>
          <div className="text-sm font-semibold">Toothcom Dental Clinics</div>
          <NotificationBell />
        </div>
      </div>

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="md:hidden">
          <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/40 z-30" />
          <div className="fixed inset-y-0 left-0 z-40 w-64">
            <div className="relative h-full">
              <div className="absolute right-0 p-3">
                <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-white">
                  <X size={20} />
                </button>
              </div>
              <Sidebar mobile />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0 pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminRoute() {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isAdmin) return <Navigate to="/patients" replace />
  return <Outlet />
}
