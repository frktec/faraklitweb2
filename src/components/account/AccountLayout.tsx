import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  CreditCard,
  Monitor,
  Users,
  Settings,
  LifeBuoy,
  LogOut,
  Package,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';

const navItems = [
  { label: 'Genel Bakış', href: '/account', icon: LayoutDashboard, end: true },
  { label: 'Paket ve Kredi', href: '/account/plan', icon: Package },
  { label: 'Kredi ve Kullanım', href: '/account/usage', icon: Coins },
  { label: 'Lisansım', href: '/account/license', icon: KeyRound },
  { label: 'Siparişler', href: '/account/payments', icon: CreditCard },
  { label: 'Faturalandırma', href: '/account/billing', icon: FileText },
  { label: 'Cihazlar', href: '/account/devices', icon: Monitor },
  { label: 'Ekip', href: '/account/team', icon: Users },
  { label: 'Hesap', href: '/account/settings', icon: Settings },
  { label: 'Destek', href: '/account/support', icon: LifeBuoy },
];

export function AccountLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-ink-200 bg-white md:flex md:flex-col">
        <div className="px-5 py-4 border-b border-ink-200">
          <Logo />
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
                    ? 'bg-ink-100 text-ink-950'
                    : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-200 p-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="mb-1 flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-[15px] font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-950"
            >
              <ShieldCheck size={15} />
              Admin Paneli
            </Link>
          )}
          <div className="px-3 py-2 mb-1">
            <p className="text-[14px] font-medium text-ink-800 truncate">{profile?.full_name || 'Kullanıcı'}</p>
            <p className="text-[13px] text-ink-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-[15px] font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
          >
            <LogOut size={15} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-ink-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <select
            value={location.pathname}
            onChange={(e) => navigate(e.target.value)}
            className="max-w-[140px] rounded-[7px] border border-ink-200 px-2 py-1.5 text-[15px] text-ink-700"
          >
            {navItems.map((item) => (
              <option key={item.href} value={item.href}>{item.label}</option>
            ))}
            {isAdmin && <option value="/admin">Admin Paneli</option>}
          </select>
        </div>
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-14 md:pt-0">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
