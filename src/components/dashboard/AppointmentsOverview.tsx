// src/components/dashboard/AppointmentsOverview.tsx
import { CalendarX2, Plus, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, SectionHeader, LinkButton, PrimaryButton, AppointmentStatusBadge, Avatar, EmptyState } from './ui'
import type { Appointment } from '@/types/dashboard'

export default function AppointmentsOverview({ appointments }: { appointments: Appointment[] }) {
  const navigate = useNavigate()
  return (
    <Card>
      <SectionHeader
        title="Today's Appointments"
        subtitle={`${appointments.length} scheduled today`}
        action={
          <div className="flex items-center gap-3">
            <LinkButton to="/appointments">View all</LinkButton>
            <PrimaryButton onClick={() => navigate('/appointments?new=1')} size="sm">
              <Plus size={14} /> New appointment
            </PrimaryButton>
          </div>
        }
      />

      {appointments.length === 0 ? (
        <EmptyState icon={<CalendarX2 size={20} />} message="No appointments scheduled for today." />
      ) : (
        <div className="divide-y divide-[#EEF1F0]">
          {appointments.map((appt) => (
            <div key={appt.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="flex w-16 shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-[#5B6B68]">
                <Clock size={13} className="text-[#8AA6A2]" />
                {appt.time}
              </div>

              <Avatar name={appt.patientName} size={34} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-[#101B1A]">{appt.patientName}</p>
                <p className="truncate text-[12.5px] text-[#5B6B68]">
                  {appt.service} · {appt.doctor}
                </p>
              </div>

              <AppointmentStatusBadge status={appt.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}