// src/pages/Dashboard.tsx
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import KpiRow from '@/components/dashboard/KpiCards'
import AppointmentsOverview from '@/components/dashboard/AppointmentsOverview'
import PatientOverview from '@/components/dashboard/PatientsOverview'
import StaffOverview from '@/components/dashboard/StaffOverview'
import ServicesOverview from '@/components/dashboard/ServiceOverview'
import RevenueOverview from '@/components/dashboard/RevenueOverview'
import RecentActivity from '@/components/dashboard/RecentActivity'

import useDashboardData from '@/hooks/useDashboardData'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'

// Small, reusable section label — gives headers a distinct visual tier
// instead of sitting at the same weight as card content.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
      {children}
    </h2>
  )
}

export default function Dashboard() {
  const { selectedLocationId } = useLocation()
  const data = useDashboardData(selectedLocationId)
  const { staff } = useAuth()

  return (
    <div className="flex min-h-screen bg-[#F6F8F7]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        {/* Locked 8px spacing scale (gap-8 = 32px) instead of the looser gap-6,
            so vertical rhythm between sections matches horizontal card gaps. */}
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
          <DashboardHeader adminName={staff?.full_name ?? undefined} />

          <KpiRow
            locationId={selectedLocationId}
            patientStats={data.patientStats ?? { total: 0, totalChangePercent: 0, newThisMonth: 0, returning: 0, active: 0, growth: [] }}
            appointmentsSnapshot={data.appointmentsSnapshot ?? { total: 0, upcoming: 0, completed: 0, pending: 0 }}
            staffSnapshot={data.staffSnapshot ?? { total: 0, doctors: 0, nurses: 0, administrative: 0, other: 0, members: [] }}
          />

          {/* Tier 1–3 */}
          <section>
            <SectionLabel>Today at a glance</SectionLabel>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <AppointmentsOverview appointments={data.todaysAppointments ?? []} />
              </div>
              <div className="flex flex-col gap-6">
                <PatientOverview stats={data.patientStats ?? { total: 0, totalChangePercent: 0, newThisMonth: 0, returning: 0, active: 0, growth: [] }} />
                <StaffOverview snapshot={data.staffSnapshot ?? { total: 0, doctors: 0, nurses: 0, administrative: 0, other: 0, members: [] }} />
              </div>
            </div>
          </section>

          {/* Tier 4: revenue */}
          <section>
            <SectionLabel>Financials</SectionLabel>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <RevenueOverview locationId={selectedLocationId} />
              </div>
              <div className="flex flex-col gap-6">
                {/* right column placeholders (quick actions) */}
              </div>
            </div>
          </section>

          {/* Tier 5 */}
          <section>
            <SectionLabel>Services</SectionLabel>
            <ServicesOverview services={data.services ?? []} />
          </section>

          {/* Tier 6–7 */}
          <section>
            <SectionLabel>Activity</SectionLabel>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <RecentActivity activity={data.recentActivity ?? []} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}