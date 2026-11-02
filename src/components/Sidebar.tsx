import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, Users, CalendarClock, Stethoscope, Banknote, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'S'
}

export default function Sidebar({ mobile }: { mobile?: boolean }) {
  const { staff, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const linkBase =
    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors'
  const inactive = 'text-white/70 hover:text-white hover:bg-white/5'
  const active = 'text-white bg-white/10 nav-cusp'

  const wrapperClass = mobile
    ? 'block md:hidden w-64 shrink-0 bg-[var(--color-ink)] text-white flex flex-col h-full'
    : 'hidden md:flex w-64 shrink-0 bg-[var(--color-ink)] text-white flex flex-col h-screen sticky top-0'

  return (
    <aside className={wrapperClass}>
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
  <img
    src="/Screenshot 2026-08-31 055944.png"
    alt="Toothcom logo"
    className="h-10 w-auto object-contain"
  />
  <div>
            
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 ml-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          <LayoutGrid size={18} />
          Dashboard
        </NavLink>
        <NavLink
          to="/patients"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          <Users size={18} />
          Patients
        </NavLink>
        <NavLink
          to="/appointments"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          <CalendarClock size={18} />
          Appointments
        </NavLink>
        <NavLink
          to="/services"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          <Stethoscope size={18} />
          Services
        </NavLink>
        <NavLink
          to="/billing"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          <Banknote size={18} />
          Billing
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/staff"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            <ShieldCheck size={18} />
            Staff Management
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="mb-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white">
            {getInitials(staff?.full_name ?? 'Staff Member')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{staff?.full_name ?? 'Loading…'}</p>
            <p className="text-[11px] capitalize text-white/40">{staff?.role}</p>
          </div>
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}