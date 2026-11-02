// src/components/dashboard/StaffOverview.tsx
import { Card, SectionHeader, LinkButton, Avatar, AvailabilityDot } from './ui'
import type { StaffSnapshot } from '@/types/dashboard'

function DeptStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#F6F8F7] px-3 py-2 text-center">
      <p className="text-[15px] font-semibold text-[#101B1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
        {value}
      </p>
      <p className="text-[11px] text-[#8AA6A2]">{label}</p>
    </div>
  )
}

export default function StaffOverview({ snapshot }: { snapshot: StaffSnapshot }) {
  return (
    <Card>
      <SectionHeader title="Staff Overview" action={<LinkButton to="/staff">Manage staff</LinkButton>} />

      <div className="mb-5 grid grid-cols-4 gap-2">
        <DeptStat label="Doctors" value={snapshot.doctors} />
        <DeptStat label="Nurses" value={snapshot.nurses} />
        <DeptStat label="Admin" value={snapshot.administrative} />
        <DeptStat label="Other" value={snapshot.other} />
      </div>

      <p className="mb-2.5 text-[12px] font-medium text-[#8AA6A2]">Active now</p>
      <div className="space-y-2.5">
        {snapshot.members.slice(0, 4).map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar name={member.name} size={30} to={`/staff/${member.id}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#101B1A]">{member.name}</p>
              <p className="truncate text-[11.5px] text-[#8AA6A2]">{member.role}</p>
            </div>
            <AvailabilityDot availability={member.availability} />
          </div>
        ))}
      </div>
    </Card>
  )
}