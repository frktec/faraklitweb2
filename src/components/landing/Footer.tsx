import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="border-t border-[#dce4ec] bg-[#f4f7fa]">
      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[310px] text-[15px] leading-5 text-[#6b737c]">
              Avukatlar ve hukuk büroları için dosya, araştırma, UETS, görev ve akıllı asistan özelliklerini tek yerde buluşturan çalışma sistemi.
            </p>
          </div>
          <FooterCol title="Ürün" links={[{ label: 'Ürün turu', href: '/#urun' }, { label: 'Güvenlik', href: '/#guvenlik' }, { label: 'Geliştirme Rotası', href: '/roadmap' }, { label: 'Fiyatlandırma', href: '/pricing' }]} />
          <FooterCol title="Kaynaklar" links={[{ label: 'Dokümantasyon', href: '/docs' }, { label: 'Destek', href: '/account/support' }]} />
          <div>
            <p className="mb-3 text-[14px] font-semibold uppercase tracking-[0.15em] text-[#939791]">İletişim</p>
            <a href="mailto:destek@faraklit.com" className="text-[15px] font-medium text-[#58636e] transition hover:text-[#172a49]">destek@faraklit.com</a>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-[#dce4ec] pt-5 text-[15px] text-[#8b918c] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Faraklit. Tüm hakları saklıdır.</p>
          <p>Hukuk profesyonelleri için tasarlandı.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-[14px] font-semibold uppercase tracking-[0.15em] text-[#939791]">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}><Link to={link.href} className="text-[15px] font-medium text-[#58636e] transition hover:text-[#172a49]">{link.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
