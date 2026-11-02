// src/components/dashboard/RevenueOverview.tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Wallet, AlertCircle } from 'lucide-react'
import { Card, SectionHeader, LinkButton, SkeletonBlock, EmptyState } from './ui'
import { getRevenueSummary, formatCurrency } from '@/service/billingService'
import type { RevenueSummary } from '@/types/dashboard'

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warning'
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11.5px] text-[#8AA6A2]">
        {tone === 'warning' && <AlertCircle size={12} className="text-[#C98A2E]" />}
        {label}
      </p>
      <p
        className="mt-0.5 text-[16px] font-semibold"
        style={{
          fontFamily: "'Sora', sans-serif",
          color: tone === 'warning' ? '#C98A2E' : '#101B1A',
        }}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Modular by design: all figures come from billingService.getRevenueSummary().
 * The Billing module can replace that function's implementation with a real
 * API call and this component needs no edits.
 */
export default function RevenueOverview({ locationId }: { locationId: string | null }) {
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

  const hasOutstanding = !!summary && summary.outstandingPayments > 0
  const lastIndex = summary ? summary.trend.length - 1 : -1

  return (
    <Card>
      <SectionHeader title="Revenue Overview" subtitle="Summarized from Billing" action={<LinkButton to="/billing">View billing</LinkButton>} />

      {loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-12" />
            ))}
          </div>
          <SkeletonBlock className="h-40 w-full" />
        </div>
      )}

      {!loading && (!summary || !summary.hasData) && (
        <EmptyState icon={<Wallet size={20} />} message="Revenue data will appear here once billing activity is recorded." />
      )}

      {!loading && summary && summary.hasData && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Total revenue" value={formatCurrency(summary.totalRevenue, summary.currency)} />
            <Metric label="This month" value={formatCurrency(summary.revenueThisMonth, summary.currency)} />
            <Metric label="This week" value={formatCurrency(summary.revenueThisWeek, summary.currency)} />
            <Metric
              label="Outstanding"
              value={formatCurrency(summary.outstandingPayments, summary.currency)}
              tone={hasOutstanding ? 'warning' : 'default'}
            />
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF2F1" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8AA6A2' }} axisLine={{ stroke: '#E4E9E7' }} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F6F8F7' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #E4E9E7', fontSize: 12 }}
                  formatter={(value: number) => formatCurrency(value, summary.currency)}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {summary.trend.map((_, i) => (
                    <Cell key={i} fill={i === lastIndex ? '#0A5F59' : '#0E7C74'} fillOpacity={i === lastIndex ? 1 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}