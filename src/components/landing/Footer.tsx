import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';

export function Footer() {
  return (
    <footer className="border-t border-anthracite/10">
      <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-[320px] text-[15px] leading-6 text-[#686868]">
              Avukatlar ve hukuk büroları için dosya, araştırma, UETS, görev ve akıllı asistan özelliklerini tek yerde buluşturan çalışma sistemi.
            </p>
          </div>
          <FooterCol title="Ürün" links={[{ label: 'Ürün', href: '/#urun' }, { label: 'Güvenlik', href: '/#guvenlik' }, { label: 'Yol Haritası', href: '/roadmap' }, { label: 'Fiyatlandırma', href: '/pricing' }]} />
          <FooterCol title="Kaynaklar" links={[{ label: 'Dokümantasyon', href: '/docs' }, { label: 'Destek', href: '/account/support' }]} />
          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-graphite-600">İletişim</p>
            <ul className="space-y-2.5">
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[15px] text-anthracite transition-colors hover:text-graphite-600">Instagram · {INSTAGRAM_HANDLE}</a></li>
              <li><a href="mailto:destek@faraklit.com" className="text-[15px] text-anthracite transition-colors hover:text-graphite-600">destek@faraklit.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-paper-300 pt-6 text-[14px] text-[#818181] sm:flex-row sm:items-center sm:justify-between">
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
      <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-graphite-600">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}><Link to={link.href} className="text-[15px] text-anthracite transition-colors hover:text-graphite-600">{link.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
