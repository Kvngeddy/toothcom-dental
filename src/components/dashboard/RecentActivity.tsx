// src/components/dashboard/RecentActivity.tsx
import {
  UserPlus,
  CalendarCheck,
  UserCog,
  Stethoscope,
  Megaphone,
  Receipt,
  History,
} from 'lucide-react'
import { Card, SectionHeader, EmptyState } from './ui'
import type { ActivityItem, ActivityType } from '@/types/dashboard'

const ICONS: Record<ActivityType, React.ReactNode> = {
  patient_registered: <UserPlus size={15} />,
  appointment_completed: <CalendarCheck size={15} />,
  staff_added: <UserCog size={15} />,
  service_updated: <Stethoscope size={15} />,
  announcement_published: <Megaphone size={15} />,
  payment_recorded: <Receipt size={15} />,
}

export default function RecentActivity({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <SectionHeader title="Recent Activity" />

      {activity.length === 0 ? (
        <EmptyState icon={<History size={20} />} message="No recent activity to show." />
      ) : (
        <div className="space-y-4">
          {activity.map((item, i) => (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E4F3F1] text-[#0A5F59]">
                  {ICONS[item.type]}
                </div>
                {i < activity.length - 1 && <div className="mt-1 w-px flex-1 bg-[#EEF1F0]" />}
              </div>
              <div className="pb-4">
                <p className="text-[13px] text-[#101B1A]">{item.description}</p>
                <p className="mt-0.5 text-[11.5px] text-[#8AA6A2]">
                  {item.user} · {item.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}