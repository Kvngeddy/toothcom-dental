// src/components/dashboard/ServicesOverview.tsx
import { Stethoscope, ShieldPlus, FlaskConical, Pill, ScanLine, BriefcaseMedical, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, SectionHeader, LinkButton } from './ui'
import { formatCurrency } from '@/service/billingService'
import type { ServiceItem } from '@/types/dashboard'

const ICONS: Record<ServiceItem['icon'], React.ReactNode> = {
  consultation: <Stethoscope size={17} />,
  dental: <ShieldPlus size={17} />,
  lab: <FlaskConical size={17} />,
  pharmacy: <Pill size={17} />,
  diagnostics: <ScanLine size={17} />,
  specialist: <BriefcaseMedical size={17} />,
}

export default function ServicesOverview({ services, isAdmin }: { services: ServiceItem[]; isAdmin: boolean }) {
  const navigate = useNavigate()
  return (
    <Card>
      <SectionHeader title="Services" subtitle="Activity this week" action={<LinkButton to="/services">View all services</LinkButton>} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => navigate('/services')}
            className="group flex flex-col gap-3 rounded-xl border border-[#E4E9E7] p-4 text-left transition-colors hover:border-[#0E7C74]/40 hover:bg-[#F6F8F7]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E4F3F1] text-[#0A5F59]">
                {ICONS[service.icon]}
              </div>
              <ArrowRight size={15} className="text-[#C6D3D1] transition-colors group-hover:text-[#0E7C74]" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-[#101B1A]">{service.name}</p>
              <p className="mt-0.5 text-[12px] text-[#8AA6A2]">{service.appointmentsThisWeek} appointments</p>
              {isAdmin && service.revenueThisMonth !== undefined && (
                <p className="mt-1 text-[12px] font-medium text-[#0A5F59]">{formatCurrency(service.revenueThisMonth)} this month</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}