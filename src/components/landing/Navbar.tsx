import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';

const navLinks = [
  { label: 'Ürün', href: '/#urun' },
  { label: 'Çözümler', href: '/#cozumler' },
  { label: 'Entegrasyonlar', href: '/#entegrasyonlar' },
  { label: 'Güvenlik', href: '/#guvenlik' },
  { label: 'Geliştirme Rotası', href: '/roadmap' },
  { label: 'Fiyatlandırma', href: '/pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname, location.hash]);

  const handleNavClick = (href: string) => {
    if (!href.startsWith('/#')) {
      navigate(href);
      return;
    }

    const hash = href.slice(1);
    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 140);
      return;
    }

    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`site-navbar sticky top-0 z-[100] w-full border-b border-white/8 transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_16px_40px_rgba(15,18,24,0.24)]' : ''
      }`}
      style={{ backgroundColor: '#15181d', color: '#ffffff' }}
    >
      <div className="mx-auto flex h-[64px] max-w-8xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-9">
          <Logo className="shrink-0" onDark />
          <nav className="hidden items-center gap-5 xl:flex 2xl:gap-7" aria-label="Ana menü">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.href)}
                className="whitespace-nowrap text-[15px] font-semibold text-white/74 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <Link to="/login" className="rounded-[8px] px-4 py-2.5 text-[15px] font-semibold text-white/78 transition hover:bg-white/7 hover:text-white">Giriş yap</Link>
          <Link to="/pricing" className="rounded-[8px] border border-white/10 bg-white px-4 py-2.5 text-[15px] font-semibold text-[#171a20] transition hover:bg-[#f2f4f7]">Fiyatları incele</Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-white/10 text-white xl:hidden hover:bg-white/10"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/8 bg-[#15181d] px-4 py-4 sm:px-6 xl:hidden">
          <nav className="flex flex-col" aria-label="Mobil menü">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.href)}
                className="border-b border-white/10 py-3.5 text-left text-[16px] font-semibold text-white/80"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/login" className="rounded-[8px] border border-white/15 bg-white/5 px-4 py-3 text-center text-[15px] font-semibold text-white">Giriş yap</Link>
              <Link to="/pricing" className="rounded-[8px] bg-white px-4 py-3 text-center text-[15px] font-semibold text-[#171a20]">Fiyatlar</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
