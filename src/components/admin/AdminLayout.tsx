import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Receipt,
  Activity,
  BarChart3,
  Package,
  MonitorSmartphone,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';

const navItems = [
  { label: 'Genel Bakış', href: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Kullanıcılar', href: '/admin/users', icon: Users },
  { label: 'Lisanslar', href: '/admin/licenses', icon: KeyRound },
  { label: 'Satışlar', href: '/admin/sales', icon: Receipt },
  { label: 'Aktiviteler', href: '/admin/activity', icon: Activity },
  { label: 'Analitik', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Paketler', href: '/admin/plans', icon: Package },
  { label: 'Sürümler', href: '/admin/versions', icon: MonitorSmartphone },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-ink-200 bg-ink-950 md:flex md:flex-col">
        <div className="px-5 py-4 border-b border-ink-800">
          <Logo onDark />
          <div className="mt-2 flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-accent-400" />
            <span className="text-[13px] font-medium text-ink-400">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-[7px] px-3 py-2 text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'bg-ink-800 text-white'
                    : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200'
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-800 p-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-[14px] font-medium text-ink-300 truncate">{profile?.full_name || 'Admin'}</p>
            <p className="text-[13px] text-ink-500 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-[15px] font-medium text-ink-400 transition-colors hover:bg-ink-900 hover:text-ink-200"
          >
            <LogOut size={15} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-ink-200 bg-ink-950">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo onDark />
          <select
            value={location.pathname}
            onChange={(e) => navigate(e.target.value)}
            className="max-w-[140px] rounded-[7px] border border-ink-700 bg-ink-900 px-2 py-1.5 text-[15px] text-ink-200"
          >
            {navItems.map((item) => (
              <option key={item.href} value={item.href}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:pt-0 pt-14">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
