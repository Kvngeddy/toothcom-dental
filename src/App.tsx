import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import PatientList from '@/pages/PatientList'
import PatientProfile from '@/pages/PatientProfile'
import StaffManagement from '@/pages/StaffManagement'
import AppointmentsPage from '@/pages/Appointmentspage'
import SetPassword from '@/pages/SetPassword'
import IntakePage from './pages/IntakePage'
import Dashboard from './pages/Dashboard'
import BillingPage from './pages/billingspage'
import ServicesList from './pages/serviceList'
import StaffProfile from './pages/StaffProfile'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function App() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <div className="relative min-h-screen">
            {installPrompt && (
              <div className="fixed bottom-4 right-4 z-50">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="rounded-full bg-[var(--color-clinic-orange)] px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-[var(--color-clinic-orange-dark)]"
                >
                  Install app
                </button>
              </div>
            )}

            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/intake/:token" element={<IntakePage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/patients" element={<PatientList />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/patients/:id" element={<PatientProfile />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/services" element={<ServicesList />} />
                <Route path="/profile" element={<StaffProfile />} />
                <Route element={<AdminRoute />}>
                  <Route path="/staff" element={<StaffManagement />} />
                  <Route path="/staff/:id" element={<StaffProfile />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/patients" replace />} />
            </Routes>
          </div>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
