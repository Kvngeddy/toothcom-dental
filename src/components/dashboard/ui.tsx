// src/components/dashboard/ui.tsx
// Small shared primitives so every dashboard section shares one visual
// language: card shell, section header, status badges, empty states.

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AppointmentStatus, StaffAvailability, AnnouncementPriority } from '@/types/dashboard'

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E4E9E7] bg-white shadow-[0_1px_2px_rgba(16,27,26,0.04)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(16,27,26,0.06)] ${
        padded ? 'p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#5B6B68]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function LinkButton({ children, onClick, to }: { children: ReactNode; onClick?: () => void; to?: string }) {
  const className = 'text-[13px] font-medium text-[#0E7C74] transition-colors hover:text-[#0A5F59]'
  if (to) {
    return <Link to={to} className={className}>{children}</Link>
  }
  return (
    <button
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({
  children,
  onClick,
  to,
  size = 'md',
  className: additionalClassName = '',
}: {
  children: ReactNode
  onClick?: () => void
  to?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const className = `inline-flex items-center gap-1.5 rounded-lg bg-[#0E7C74] font-medium text-white transition-colors hover:bg-[#0A5F59] active:bg-[#084943] ${
    size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-[13px]'
  } ${additionalClassName}`
  if (to) {
    return <Link to={to} className={className}>{children}</Link>
  }
  return (
    <button
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E9E7] bg-white px-3 py-1.5 text-[13px] font-medium text-[#101B1A] transition-colors hover:border-[#0E7C74]/40 hover:bg-[#F6F8F7]"
    >
      {children}
    </button>
  )
}

const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, { label: string; className: string; dot: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-[#E4F3F1] text-[#0A5F59]', dot: 'bg-[#0E7C74]' },
  waiting: { label: 'Waiting', className: 'bg-[#FBF1DF] text-[#8A5D1E]', dot: 'bg-[#C98A2E]' },
  completed: { label: 'Completed', className: 'bg-[#E4F7ED] text-[#186B44]', dot: 'bg-[#1F9D63]' },
  cancelled: { label: 'Cancelled', className: 'bg-[#FBEAE6] text-[#963826]', dot: 'bg-[#D1503A]' },
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const s = APPOINTMENT_STATUS_STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${s.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

const AVAILABILITY_STYLES: Record<StaffAvailability, { label: string; dot: string; text: string }> = {
  available: { label: 'Available', dot: 'bg-[#1F9D63]', text: 'text-[#186B44]' },
  break: { label: 'On break', dot: 'bg-[#C98A2E]', text: 'text-[#8A5D1E]' },
  unavailable: { label: 'Unavailable', dot: 'bg-[#D1503A]', text: 'text-[#963826]' },
}

export function AvailabilityDot({ availability, showLabel = false }: { availability: StaffAvailability; showLabel?: boolean }) {
  const s = AVAILABILITY_STYLES[availability]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {showLabel && s.label}
    </span>
  )
}

const PRIORITY_STYLES: Record<AnnouncementPriority, { label: string; className: string }> = {
  high: { label: 'High priority', className: 'bg-[#FBEAE6] text-[#963826]' },
  normal: { label: 'Normal', className: 'bg-[#E4F3F1] text-[#0A5F59]' },
  low: { label: 'Low priority', className: 'bg-[#F1F3F2] text-[#5B6B68]' },
}

export function PriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  const s = PRIORITY_STYLES[priority]
  return <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${s.className}`}>{s.label}</span>
}

export function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#E4E9E7] bg-[#FAFBFA] px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#8AA6A2] shadow-sm">{icon}</div>
      <p className="max-w-[220px] text-[13px] text-[#5B6B68]">{message}</p>
    </div>
  )
}

export function Avatar({ name, size = 36, to }: { name: string; size?: number; to?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const avatar = (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[#E4F3F1] font-semibold text-[#0A5F59]"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
  return to ? <Link to={to} aria-label={`Open ${name}'s profile`} title="Open profile">{avatar}</Link> : avatar
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#EEF1F0] ${className}`} />
}