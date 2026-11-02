// src/components/dashboard/KpiCards.tsx
import { useEffect, useState } from 'react'
import { Users, CalendarCheck2, UserCog, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Card, SkeletonBlock } from './ui'
import { getRevenueSummary, formatCurrency } from '@/service/billingService'
import type { PatientStats, AppointmentsSnapshot, StaffSnapshot, RevenueSummary } from '@/types/dashboard'

function Trend({ percent }: { percent: number }) {
  const positive = percent >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12.5px] font-medium ${positive ? 'text-[#1F9D63]' : 'text-[#D1503A]'}`}>
      {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(percent).toFixed(1)}%
    </span>
  )
}

function KpiShell({
  icon,
  label,
  iconBg = '#E4F3F1',
  iconColor = '#0A5F59',
  children,
}: {
  icon: React.ReactNode
  label: string
  iconBg?: string
  iconColor?: string
  children: React.ReactNode
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#5B6B68]">{label}</p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      {children}
    </Card>
  )
}

export function PatientsKpiCard({ stats }: { stats: PatientStats }) {
  return (
    <KpiShell icon={<Users size={16} />} label="Total Patients" iconBg="#E4F3F1" iconColor="#0A5F59">
      <div>
        <p className="text-[28px] font-semibold leading-none text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
          {stats.total.toLocaleString()}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <Trend percent={stats.totalChangePercent} />
          <span className="text-[12.5px] text-[#8AA6A2]">vs last month</span>
        </div>
      </div>
    </KpiShell>
  )
}

export function AppointmentsKpiCard({ snapshot }: { snapshot: AppointmentsSnapshot }) {
  return (
    <KpiShell icon={<CalendarCheck2 size={16} />} label="Today's Appointments" iconBg="#EAF0FB" iconColor="#2E5FA3">
      <div>
        <p className="text-[28px] font-semibold leading-none text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
          {snapshot.total}
        </p>
        <div className="mt-3 flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1.5 text-[#5B6B68]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0E7C74]" /> {snapshot.upcoming} upcoming
          </span>
          <span className="flex items-center gap-1.5 text-[#5B6B68]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1F9D63]" /> {snapshot.completed} done
          </span>
          <span className="flex items-center gap-1.5 text-[#5B6B68]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C98A2E]" /> {snapshot.pending} pending
          </span>
        </div>
      </div>
    </KpiShell>
  )
}

export function StaffKpiCard({ snapshot }: { snapshot: StaffSnapshot }) {
  const availableCount = snapshot.members.filter((m) => m.availability === 'available').length
  return (
    <KpiShell icon={<UserCog size={16} />} label="Total Staff" iconBg="#F3EEFB" iconColor="#6B3FA0">
      <div>
        <p className="text-[28px] font-semibold leading-none text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
          {snapshot.total}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1F9D63]" />
          <span className="text-[12.5px] text-[#5B6B68]">{availableCount} available right now</span>
        </div>
      </div>
    </KpiShell>
  )
}

/**
 * Reads exclusively from billingService.getRevenueSummary().
 * When the Billing module is live, that function starts returning real
 * data and this card requires no changes.
 */
export function RevenueKpiCard({ locationId }: { locationId: string | null }) {
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getRevenueSummary(locationId).then((data) => {
      if (mounted) {
        setSummary(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [locationId])

  if (loading) {
    return (
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-8 w-8 rounded-lg" />
        </div>
        <SkeletonBlock className="h-7 w-32" />
        <SkeletonBlock className="h-8 w-full" />
      </Card>
    )
  }

  if (!summary || !summary.hasData) {
    return (
      <KpiShell icon={<Wallet size={16} />} label="Total Revenue" iconBg="#FDF3E7" iconColor="#B4741F">
        <p className="text-[13px] text-[#8AA6A2]">Revenue data will appear here once billing activity is recorded.</p>
      </KpiShell>
    )
  }

  return (
    <KpiShell icon={<Wallet size={16} />} label="Total Revenue" iconBg="#FDF3E7" iconColor="#B4741F">
      <div>
        <p className="text-[26px] font-semibold leading-none text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
          {formatCurrency(summary.totalRevenue, summary.currency)}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <Trend percent={summary.growthPercent} />
          <span className="text-[12.5px] text-[#8AA6A2]">this month</span>
        </div>
      </div>
      <div className="-mx-1 h-9">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={summary.trend}>
            <Line type="monotone" dataKey="amount" stroke="#0E7C74" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </KpiShell>
  )
}

export default function KpiRow({
  patientStats,
  appointmentsSnapshot,
  staffSnapshot,
  locationId,
  isAdmin,
}: {
  patientStats: PatientStats
  appointmentsSnapshot: AppointmentsSnapshot
  staffSnapshot: StaffSnapshot
  locationId: string | null
  isAdmin: boolean
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isAdmin ? 'xl:grid-cols-4' : 'xl:grid-cols-2'}`}>
      <PatientsKpiCard stats={patientStats} />
      <AppointmentsKpiCard snapshot={appointmentsSnapshot} />
      {isAdmin && <StaffKpiCard snapshot={staffSnapshot} />}
      {isAdmin && <RevenueKpiCard locationId={locationId} />}
    </div>
  )
}