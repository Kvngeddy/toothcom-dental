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


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
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
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
