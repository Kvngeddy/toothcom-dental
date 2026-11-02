import { supabase } from '@/lib/supabaseClient'
import type { RevenueSummary, RevenueTrendPoint } from '@/types/dashboard'

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getRevenueSummary(locationId: string | null): Promise<RevenueSummary> {
  if (!locationId) {
    return {
      totalRevenue: 0,
      revenueThisMonth: 0,
      revenueThisWeek: 0,
      outstandingPayments: 0,
      growthPercent: 0,
      currency: 'NGN',
      trend: [],
      hasData: false,
    }
  }
  const monthStart = startOfMonth()
  const lastMonthStart = startOfMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))
  const weekStart = startOfWeek()
  const sixWeeksAgo = new Date()
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)

  const [{ data: payments, error: paymentsError }, { data: invoices, error: invoicesError }] =
    await Promise.all([
      supabase
        .from('payments')
        .select('amount, paid_at, invoices!inner(status, location_id)')
        .eq('invoices.location_id', locationId)
        .gte('paid_at', sixWeeksAgo.toISOString())
        .order('paid_at', { ascending: true }),
      supabase.from('invoices').select('subtotal, amount_paid, status').eq('location_id', locationId),
    ])

  if (paymentsError) console.error('Revenue: payments query failed', paymentsError.message)
  if (invoicesError) console.error('Revenue: invoices query failed', invoicesError.message)

  const validPayments = (payments ?? []).filter(
    (p: any) => p.invoices?.status !== 'void'
  )

  const totalRevenue = validPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const revenueThisMonth = validPayments
    .filter((p: any) => new Date(p.paid_at) >= monthStart)
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const revenueLastMonth = validPayments
    .filter((p: any) => new Date(p.paid_at) >= lastMonthStart && new Date(p.paid_at) < monthStart)
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const revenueThisWeek = validPayments
    .filter((p: any) => new Date(p.paid_at) >= weekStart)
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  const outstandingPayments = (invoices ?? [])
    .filter((inv: any) => inv.status !== 'void' && inv.status !== 'paid')
    .reduce((sum: number, inv: any) => sum + Math.max(Number(inv.subtotal) - Number(inv.amount_paid), 0), 0)

  const growthPercent =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : revenueThisMonth > 0 ? 100 : 0

  // Weekly trend, last 6 weeks
  const trendBuckets: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const wStart = new Date(weekStart)
    wStart.setDate(wStart.getDate() - i * 7)
    trendBuckets[wStart.toISOString()] = 0
  }
  validPayments.forEach((p: any) => {
    const paidDate = new Date(p.paid_at)
    const bucketStart = startOfWeek(paidDate).toISOString()
    if (bucketStart in trendBuckets) {
      trendBuckets[bucketStart] += Number(p.amount)
    }
  })
  const trend: RevenueTrendPoint[] = Object.entries(trendBuckets).map(([, amount], i) => ({
    label: `Week ${i + 1}`,
    amount,
  }))

  const hasData = (payments?.length ?? 0) > 0 || (invoices?.length ?? 0) > 0

  return {
    totalRevenue,
    revenueThisMonth,
    revenueThisWeek,
    outstandingPayments,
    growthPercent,
    currency: 'NGN',
    trend,
    hasData,
  }
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString('en-NG')}`
  }
  return amount.toLocaleString(undefined, { style: 'currency', currency })
}