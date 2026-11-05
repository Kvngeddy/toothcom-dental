import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight, Trash2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { usePatients } from '@/hooks/usePatients'
import type { Invoice, InvoiceItem, InvoiceStatus, Payment, PaymentMethod, Service } from '@/types/billings'

function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-NG')}`
}

function downloadPaymentReceipt(payment: Payment, invoice: Invoice, items: InvoiceItem[]) {
  const patientName = invoice.patients?.full_name ?? 'Patient'
  const receiptId = payment.id.slice(0, 8).toUpperCase()
  const paymentDate = new Date(payment.paid_at).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const safeText = (value: string) => value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/[\\()]/g, '\\$&')
  const amount = (value: number) => `NGN ${value.toLocaleString('en-NG')}`
  const commands: string[] = []
  const fillRect = (x: number, y: number, width: number, height: number, color: string) => {
    commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`)
  }
  const drawLine = (x1: number, y1: number, x2: number, y2: number, color = '0.88 0.88 0.88') => {
    commands.push(`${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S`)
  }
  const drawText = (x: number, y: number, value: string, size: number, font = 'F1', color = '0.16 0.18 0.19') => {
    commands.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${safeText(value)}) Tj ET`)
  }

  fillRect(0, 744, 595, 98, '0.12 0.14 0.15')
  fillRect(0, 837, 595, 5, '0.91 0.31 0.13')
  drawText(48, 805, 'TOOTHCOM', 19, 'F2', '1 1 1')
  drawText(48, 787, 'DENTAL CLINICS', 9, 'F2', '1 1 1')
  drawText(48, 761, 'PATIENT PAYMENT RECEIPT', 9, 'F2', '1 0.66 0.48')
  drawText(415, 804, 'RECEIPT', 10, 'F2', '1 1 1')
  drawText(415, 785, `#${receiptId}`, 9, 'F1', '0.91 0.91 0.91')

  drawText(48, 710, 'RECEIVED FROM', 8, 'F2', '0.48 0.50 0.51')
  drawText(48, 688, patientName, 15, 'F2')
  drawText(48, 668, `Payment date  ${paymentDate}`, 9, 'F1', '0.40 0.42 0.43')
  drawText(365, 710, 'PAYMENT METHOD', 8, 'F2', '0.48 0.50 0.51')
  drawText(365, 688, (payment.method ?? 'Not specified').toUpperCase(), 11, 'F2')
  drawLine(48, 646, 547, 646)

  drawText(48, 622, 'BILL DETAILS', 9, 'F2', '0.48 0.50 0.51')
  drawText(48, 599, 'Description', 8, 'F2', '0.48 0.50 0.51')
  drawText(392, 599, 'QTY', 8, 'F2', '0.48 0.50 0.51')
  drawText(460, 599, 'UNIT PRICE', 8, 'F2', '0.48 0.50 0.51')
  drawText(522, 599, 'TOTAL', 8, 'F2', '0.48 0.50 0.51')
  drawLine(48, 588, 547, 588)

  const visibleItems = items.slice(0, 7)
  visibleItems.forEach((item, index) => {
    const y = 567 - index * 25
    drawText(48, y, item.description.slice(0, 48), 9)
    drawText(399, y, String(item.quantity), 9)
    drawText(460, y, item.unit_price.toLocaleString('en-NG'), 9)
    drawText(517, y, item.line_total.toLocaleString('en-NG'), 9)
  })
  if (items.length === 0) drawText(48, 567, 'Dental services', 9)
  if (items.length > visibleItems.length) {
    drawText(48, 567 - visibleItems.length * 25, `+ ${items.length - visibleItems.length} more items`, 8, 'F1', '0.48 0.50 0.51')
  }

  const afterItemsY = 567 - Math.min(Math.max(visibleItems.length, 1), 7) * 25 - (items.length > 7 ? 12 : 0)
  drawLine(48, afterItemsY, 547, afterItemsY)
  const summaryTop = afterItemsY - 24
  drawText(350, summaryTop, 'Invoice total', 9, 'F1', '0.40 0.42 0.43')
  drawText(488, summaryTop, amount(invoice.subtotal), 9, 'F1')
  drawText(350, summaryTop - 20, 'Previously paid', 9, 'F1', '0.40 0.42 0.43')
  drawText(488, summaryTop - 20, amount(Math.max(invoice.amount_paid - payment.amount, 0)), 9, 'F1')

  fillRect(48, summaryTop - 100, 499, 54, '0.99 0.96 0.94')
  fillRect(48, summaryTop - 100, 4, 54, '0.91 0.31 0.13')
  drawText(65, summaryTop - 68, 'AMOUNT RECEIVED', 9, 'F2', '0.42 0.35 0.32')
  drawText(65, summaryTop - 89, amount(payment.amount), 17, 'F2', '0.78 0.25 0.10')
  drawText(375, summaryTop - 68, 'BALANCE AFTER PAYMENT', 8, 'F2', '0.42 0.35 0.32')
  drawText(375, summaryTop - 89, amount(Math.max(invoice.subtotal - invoice.amount_paid, 0)), 11, 'F2')

  drawLine(48, 98, 547, 98)
  drawText(48, 77, 'Thank you for choosing Toothcom Dental Clinics.', 10, 'F2')
  drawText(48, 59, 'Please keep this receipt for your records.', 8, 'F1', '0.48 0.50 0.51')
  drawText(48, 35, `Receipt ${receiptId}  |  Invoice ${invoice.id.slice(0, 8).toUpperCase()}`, 7, 'F1', '0.58 0.59 0.60')
  const stream = `${commands.join('\n')}\n`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`
  }
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `toothcom-receipt-${receiptId}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  unpaid: 'bg-red-50 text-red-700',
  partially_paid: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  void: 'bg-gray-100 text-slate-muted',
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  void: 'Void',
}

export default function BillingPage() {
  const { selectedLocationId } = useLocation()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    if (!selectedLocationId) {
      setInvoices([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*, patients(full_name)')
      .eq('location_id', selectedLocationId)
      .order('created_at', { ascending: false })
    if (data) setInvoices(data as Invoice[])
    setLoading(false)
  }, [selectedLocationId])

  useEffect(() => {
    void fetchInvoices()
  }, [fetchInvoices])

  async function exportBills() {
    if (invoices.length === 0) return
    setExporting(true)
    setExportError(null)
    const invoiceIds = invoices.map((invoice) => invoice.id)
    const { data: itemRows, error } = await supabase
      .from('invoice_items')
      .select('invoice_id, description, quantity, unit_price, line_total')
      .in('invoice_id', invoiceIds)
      .order('created_at')
    setExporting(false)

    if (error) {
      setExportError(error.message)
      return
    }

    const itemsByInvoice = new Map<string, string[]>()
    for (const item of itemRows ?? []) {
      const list = itemsByInvoice.get(item.invoice_id) ?? []
      list.push(`${item.description} (qty ${item.quantity}, ${item.line_total})`)
      itemsByInvoice.set(item.invoice_id, list)
    }
    const protectFormula = (value: unknown) => {
      const text = String(value ?? '')
      return /^[\s]*[=+@-]/.test(text) ? `'${text}` : text
    }
    const csvCell = (value: unknown) => `"${protectFormula(value).replace(/"/g, '""')}"`
    const csvRows = [
      ['Invoice ID', 'Patient', 'Date', 'Total', 'Paid', 'Balance due', 'Status', 'Items'],
      ...invoices.map((invoice) => [
        invoice.id,
        invoice.patients?.full_name ?? 'Patient',
        new Date(invoice.created_at).toLocaleDateString(),
        invoice.subtotal,
        invoice.amount_paid,
        Math.max(invoice.subtotal - invoice.amount_paid, 0),
        STATUS_LABELS[invoice.status],
        (itemsByInvoice.get(invoice.id) ?? []).join('; '),
      ]),
    ]
    const csv = `\uFEFF${csvRows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `toothcom-bills-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-text">Billing</h1>
          <p className="text-slate-muted text-sm mt-1">
            {invoices.length} bill{invoices.length === 1 ? '' : 's'} on record
          </p>
          {exportError && <p className="text-sm text-red-600 mt-1">Could not export bills: {exportError}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => void exportBills()}
            disabled={loading || exporting || invoices.length === 0}
            className="flex items-center gap-2 border border-[var(--color-border-soft)] bg-white hover:bg-gray-50 text-slate-text text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? 'Exporting…' : 'Export Bills'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Bill
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:hidden">
        {!loading && invoices.length === 0 && (
          <div className="rounded-xl border border-[var(--color-border-soft)] bg-white p-5 text-center text-sm text-slate-muted">
            No bills yet. Create the first one to get started.
          </div>
        )}
        {invoices.map((invoice) => (
          <article key={invoice.id} className="overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-white">
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
              aria-expanded={expandedId === invoice.id}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-text">{invoice.patients?.full_name ?? '—'}</p>
                  <p className="mt-1 text-sm text-slate-muted">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                {expandedId === invoice.id ? <ChevronDown size={18} className="mt-1 shrink-0 text-slate-muted" /> : <ChevronRight size={18} className="mt-1 shrink-0 text-slate-muted" />}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-muted">Total</p>
                  <p className="mt-0.5 font-medium text-slate-text">{formatNaira(invoice.subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-muted">Paid</p>
                  <p className="mt-0.5 text-slate-text">{formatNaira(invoice.amount_paid)}</p>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
                    {STATUS_LABELS[invoice.status]}
                  </span>
                </div>
              </div>
            </button>
            {expandedId === invoice.id && (
              <div className="border-t border-[var(--color-border-soft)] bg-gray-50 p-4">
                <InvoiceDetail invoice={invoice} onChanged={fetchInvoices} />
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-[var(--color-border-soft)] bg-white sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-soft)] text-left text-slate-muted">
              <th className="px-5 py-3 font-medium w-8"></th>
              <th className="px-5 py-3 font-medium">Patient</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium text-right">Paid</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-muted">
                  No bills yet. Create the first one to get started.
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <InvoiceRow
                key={inv.id}
                invoice={inv}
                expanded={expandedId === inv.id}
                onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                onChanged={fetchInvoices}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateInvoiceModal
          locationId={selectedLocationId}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            fetchInvoices()
          }}
        />
      )}
    </div>
  )
}

function InvoiceRow({
  invoice,
  expanded,
  onToggle,
  onChanged,
}: {
  invoice: Invoice
  expanded: boolean
  onToggle: () => void
  onChanged: () => void
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-[var(--color-border-soft)] last:border-0 hover:bg-[var(--color-clinic-orange-tint)] cursor-pointer transition-colors"
      >
        <td className="px-5 py-3 text-slate-muted">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </td>
        <td className="px-5 py-3 font-medium text-slate-text">{invoice.patients?.full_name ?? '—'}</td>
        <td className="px-5 py-3 text-slate-muted">{new Date(invoice.created_at).toLocaleDateString()}</td>
        <td className="px-5 py-3 text-right text-slate-text">{formatNaira(invoice.subtotal)}</td>
        <td className="px-5 py-3 text-right text-slate-muted">{formatNaira(invoice.amount_paid)}</td>
        <td className="px-5 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-5 py-4">
            <InvoiceDetail invoice={invoice} onChanged={onChanged} />
          </td>
        </tr>
      )}
    </>
  )
}

function InvoiceDetail({ invoice, onChanged }: { invoice: Invoice; onChanged: () => void }) {
  const { staff } = useAuth()
  const isAdmin = staff?.role === 'admin'
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showVoidConfirm, setShowVoidConfirm] = useState(false)

  async function fetchDetail() {
    setLoading(true)
    const [{ data: itemsData }, { data: paymentsData }] = await Promise.all([
      supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('created_at'),
      supabase.from('payments').select('*').eq('invoice_id', invoice.id).order('paid_at', { ascending: false }),
    ])
    if (itemsData) setItems(itemsData as InvoiceItem[])
    if (paymentsData) setPayments(paymentsData as Payment[])
    setLoading(false)
  }

  useEffect(() => {
    fetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.id])

  const balanceDue = invoice.subtotal - invoice.amount_paid

  if (loading) return <p className="text-sm text-slate-muted">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="text-left text-slate-muted">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 font-medium text-right">Qty</th>
            <th className="pb-2 font-medium text-right">Unit price</th>
            <th className="pb-2 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-[var(--color-border-soft)]">
              <td className="min-w-0 break-words py-2 text-slate-text">{item.description}</td>
              <td className="py-2 text-right text-slate-muted">{item.quantity}</td>
              <td className="py-2 text-right text-slate-muted">{formatNaira(item.unit_price)}</td>
              <td className="py-2 text-right text-slate-text">{formatNaira(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {payments.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-muted mb-1">Payments</p>
          <div className="space-y-1">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <p className="text-slate-text">
                  {formatNaira(p.amount)} {p.method ? `· ${p.method}` : ''} ·{' '}
                  <span className="text-slate-muted">{new Date(p.paid_at).toLocaleDateString()}</span>
                </p>
                <button
                  type="button"
                  onClick={() => downloadPaymentReceipt(p, invoice, items)}
                  title="Download payment receipt"
                  aria-label={`Download receipt for payment of ${formatNaira(p.amount)}`}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-clinic-orange-dark)] hover:underline"
                >
                  <Download size={14} />
                  Receipt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-soft)]">
        <p className="text-sm">
          {invoice.status === 'void' ? (
            <span className="text-slate-muted">Voided — not counted toward the patient's balance.</span>
          ) : (
            <>
              <span className="text-slate-muted">Balance due: </span>
              <span className="font-medium text-slate-text">{formatNaira(Math.max(balanceDue, 0))}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-4">
          {invoice.status !== 'paid' && invoice.status !== 'void' && (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="text-sm font-medium text-[var(--color-clinic-orange-dark)] hover:underline"
            >
              Record payment
            </button>
          )}
          {isAdmin && invoice.status !== 'void' && (
            <button
              onClick={() => setShowVoidConfirm(true)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Void bill
            </button>
          )}
        </div>
      </div>

      {showVoidConfirm && (
        <VoidInvoiceModal
          invoiceId={invoice.id}
          onClose={() => setShowVoidConfirm(false)}
          onVoided={() => {
            setShowVoidConfirm(false)
            onChanged()
          }}
        />
      )}

      {showPaymentForm && (
        <RecordPaymentModal
          invoiceId={invoice.id}
          maxAmount={balanceDue}
          onClose={() => setShowPaymentForm(false)}
          onRecorded={() => {
            setShowPaymentForm(false)
            fetchDetail()
            onChanged()
          }}
        />
      )}
    </div>
  )
}

function RecordPaymentModal({
  invoiceId,
  maxAmount,
  onClose,
  onRecorded,
}: {
  invoiceId: string
  maxAmount: number
  onClose: () => void
  onRecorded: () => void
}) {
  const { staff } = useAuth()
  const [amount, setAmount] = useState(maxAmount > 0 ? String(maxAmount) : '')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('payments').insert({
      invoice_id: invoiceId,
      amount: numericAmount,
      method,
      recorded_by: staff?.id ?? null,
    })
    setSubmitting(false)
    if (error) setError(error.message)
    else onRecorded()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Record Payment</h2>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-text">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white disabled:opacity-60"
          >
            {submitting ? 'Recording…' : 'Record payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Void invoice
// ============================================================

function VoidInvoiceModal({
  invoiceId,
  onClose,
  onVoided,
}: {
  invoiceId: string
  onClose: () => void
  onVoided: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('invoices').update({ status: 'void' }).eq('id', invoiceId)
    setSubmitting(false)
    if (error) setError(error.message)
    else onVoided()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <h2 className="font-display font-semibold text-lg text-slate-text mb-2">Void this bill?</h2>
        <p className="text-slate-muted text-sm mb-4">
          Voiding marks this bill as invalid and locks it from further edits. This can't be undone from
          here — it won't be counted toward the patient's balance, but the record stays for your history.
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
          >
            {submitting ? 'Voiding…' : 'Void bill'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Create invoice
// ============================================================

interface DraftLine {
  key: string
  serviceId: string
  description: string
  unitPrice: string
  quantity: string
  priceType: Service['price_type'] | null
  priceMin: number | null
  priceMax: number | null
}

function emptyLine(): DraftLine {
  return {
    key: crypto.randomUUID(),
    serviceId: '',
    description: '',
    unitPrice: '',
    quantity: '1',
    priceType: null,
    priceMin: null,
    priceMax: null,
  }
}

function CreateInvoiceModal({ onClose, onCreated, locationId }: { onClose: () => void; onCreated: () => void; locationId: string | null }) {
  const { staff } = useAuth()
  const [patientSearch, setPatientSearch] = useState('')
  const { patients } = usePatients(patientSearch, locationId)
  const [patientId, setPatientId] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')
      .then(({ data }) => {
        if (data) setServices(data as Service[])
      })
  }, [locationId])

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0),
    [lines]
  )

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function selectService(key: string, serviceId: string) {
    const service = services.find((s) => s.id === serviceId)
    if (!service) {
      updateLine(key, { serviceId: '', description: '', unitPrice: '', priceType: null, priceMin: null, priceMax: null })
      return
    }
    updateLine(key, {
      serviceId,
      description: service.note ? `${service.name} (${service.note})` : service.name,
      unitPrice: service.price_type === 'fixed' ? String(service.price ?? '') : '',
      priceType: service.price_type,
      priceMin: service.price_min,
      priceMax: service.price_max,
    })
  }

  async function handleSubmit() {
    if (!patientId) {
      setError('Select a patient.')
      return
    }
    const validLines = lines.filter((l) => l.description.trim() && Number(l.unitPrice) > 0)
    if (validLines.length === 0) {
      setError('Add at least one line item with a price.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({ patient_id: patientId, created_by: staff?.id ?? null, location_id: locationId })
      .select()
      .single()

    if (invoiceError || !invoice) {
      setSubmitting(false)
      setError(invoiceError?.message ?? 'Failed to create invoice.')
      return
    }

    const { error: itemsError } = await supabase.from('invoice_items').insert(
      validLines.map((l) => ({
        invoice_id: invoice.id,
        service_id: l.serviceId || null,
        description: l.description.trim(),
        unit_price: Number(l.unitPrice),
        quantity: Number(l.quantity) || 1,
      }))
    )

    setSubmitting(false)
    if (itemsError) setError(itemsError.message)
    else onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">New Bill</h2>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-text">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient</label>
            <input
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value)
                setPatientId('')
              }}
              placeholder="Search patients by name…"
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
            {patientSearch && !patientId && patients.length > 0 && (
              <div className="mt-1 border border-[var(--color-border-soft)] rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPatientId(p.id)
                      setPatientSearch(p.full_name)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-clinic-orange-tint)]"
                  >
                    {p.full_name}
                  </button>
                ))}
              </div>
            )}
            {patientId && <p className="text-xs text-emerald-600 mt-1">Patient selected.</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Services</label>
              <button
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="text-xs font-medium text-[var(--color-clinic-orange-dark)] hover:underline"
              >
                + Add line
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line) => (
                <div key={line.key} className="border border-[var(--color-border-soft)] rounded-lg p-3">
                  <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_4rem_7rem_auto]">
                    <select
                      value={line.serviceId}
                      onChange={(e) => selectService(line.key, e.target.value)}
                      className="col-span-2 w-full min-w-0 rounded-lg border border-[var(--color-border-soft)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)] sm:col-span-1"
                    >
                      <option value="">Select a service…</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.category} — {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="col-span-2 grid grid-cols-[4rem_minmax(0,1fr)_auto] gap-2 sm:contents">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        title="Quantity"
                        className="w-full min-w-0 rounded-lg border border-[var(--color-border-soft)] px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                      />
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                        placeholder="Price"
                        className="w-full min-w-0 rounded-lg border border-[var(--color-border-soft)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                      />
                      <button
                        type="button"
                        onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== line.key) : prev))}
                        aria-label="Remove line item"
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {line.priceType === 'variable' && (
                    <p className="text-xs text-slate-muted mt-1.5 pl-1">
                      Reference: {line.priceMin != null && line.priceMax != null
                        ? `${formatNaira(line.priceMin)} – ${formatNaira(line.priceMax)}`
                        : line.priceMin != null
                        ? `From ${formatNaira(line.priceMin)}`
                        : 'Price varies — enter the agreed amount.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-soft)]">
            <span className="text-sm text-slate-muted">Total</span>
            <span className="font-display font-semibold text-lg text-slate-text">{formatNaira(total)}</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save bill'}
          </button>
        </div>
      </div>
    </div>
  )
}