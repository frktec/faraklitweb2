import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Receipt,
  FileText,
  Coins,
  Cpu,
  Activity,
  BarChart3,
  Package,
  MonitorSmartphone,
  ScrollText,
  LogOut,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';

type NavItem = { label: string; href: string; icon: LucideIcon; end?: boolean };

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: '',
    items: [{ label: 'Genel Bakış', href: '/admin', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Müşteriler',
    items: [
      { label: 'Kullanıcılar', href: '/admin/users', icon: Users },
      { label: 'Lisanslar', href: '/admin/licenses', icon: KeyRound },
    ],
  },
  {
    title: 'Gelir',
    items: [
      { label: 'Satışlar', href: '/admin/sales', icon: Receipt },
      { label: 'Faturalar', href: '/admin/invoices', icon: FileText },
    ],
  },
  {
    title: 'Kullanım',
    items: [
      { label: 'Krediler', href: '/admin/credits', icon: Coins },
      { label: 'İş Üretimi', href: '/admin/jobs', icon: Cpu },
      { label: 'Aktiviteler', href: '/admin/activity', icon: Activity },
      { label: 'Analitik', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Ürün',
    items: [
      { label: 'Paketler', href: '/admin/plans', icon: Package },
      { label: 'Sürümler', href: '/admin/versions', icon: MonitorSmartphone },
      { label: 'Denetim Kaydı', href: '/admin/audit', icon: ScrollText },
    ],
  },
];

const navItems = navGroups.flatMap((g) => g.items);

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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-ink-200 bg-ink-950 md:flex md:flex-col">
        <div className="px-5 py-4 border-b border-ink-800">
          <Logo onDark />
          <div className="mt-2 flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-accent-400" />
            <span className="text-[13px] font-medium text-ink-400">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.title || 'root'} className="mb-3">
              {group.title && (
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-600">{group.title}</p>
              )}
              <div className="space-y-0.5">
          {group.items.map((item) => (
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
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-ink-800 p-3">
          <Link
            to="/account"
            className="mb-1 flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-[15px] font-medium text-ink-400 transition-colors hover:bg-ink-900 hover:text-ink-200"
          >
            <UserRound size={15} />
            Kullanıcı Paneli
          </Link>
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
      <main className="min-w-0 flex-1 pt-14 md:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
