// src/components/dashboard/PatientOverview.tsx
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, SectionHeader, LinkButton } from './ui'
import type { PatientStats } from '@/types/dashboard'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11.5px] text-[#8AA6A2]">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

export default function PatientOverview({ stats }: { stats: PatientStats }) {
  return (
    <Card>
      <SectionHeader title="Patient Overview" subtitle="Growth — last 30 days" action={<LinkButton to="/patients">View patients</LinkButton>} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="New" value={stats.newThisMonth} />
        <Stat label="Returning" value={stats.returning} />
        <Stat label="Active" value={stats.active} />
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.growth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#8AA6A2' }}
              axisLine={{ stroke: '#E4E9E7' }}
              tickLine={false}
              interval={1}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #E4E9E7',
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(16,27,26,0.08)',
              }}
              labelStyle={{ color: '#5B6B68', fontWeight: 500 }}
            />
            <Line type="monotone" dataKey="patients" stroke="#0E7C74" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}