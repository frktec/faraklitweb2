import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { Scale, ShieldCheck, Clock } from 'lucide-react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left panel — column architecture */}
      <div className="relative hidden w-[44%] shrink-0 overflow-hidden lg:block">
        <img
          src="/images/backgrounds/faraklit-column-bg.png"
          alt="Klasik sütun mimarisi"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950/75 via-ink-900/50 to-ink-950/80" />
        {/* Bottom fade for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
        {/* Right-edge fade into white — smooth transition to form panel */}
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-white" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Logo onDark />

          <div className="max-w-[420px]">
            <p className="mb-3 text-[14px] font-medium uppercase tracking-[0.22em] text-white/50">
              Faraklit ile
            </p>
            <h2 className="font-serif text-[40px] font-normal leading-[1.08] tracking-[-0.03em] text-white xl:text-[48px]">
              Yarını<br />programlayın.
            </h2>
            <p className="mt-5 max-w-[360px] text-[16px] leading-relaxed text-white/65">
              Hukuk büronuzun sakin lobisinde oturur gibi; dosyalarınız, duruşmalarınız ve
              tebligatlarınız tek bir akışta karşınızda.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: Scale, text: 'Dosya ve duruşma yönetimi tek panelde' },
                { icon: ShieldCheck, text: 'UETS tebligat takibi otomatik' },
                { icon: Clock, text: 'Yapay zekâ destekli dilekçe hazırlama' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-sm">
                    <f.icon size={15} className="text-white/80" />
                  </span>
                  <span className="text-[15px] text-white/70">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[13px] text-white/35">
            © 2026 Faraklit · Tüm hakları saklıdır.
          </p>
        </div>
      </div>

      {/* Right panel — form with soft gradient entrance */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
        {/* Subtle gradient on the left edge to blend with image panel */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-ink-50/40 to-transparent lg:block" />

        <div className="relative w-full max-w-[400px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>

          <h1 className="text-center text-[24px] font-semibold tracking-tight text-ink-950">{title}</h1>
          <p className="mt-2 text-center text-[16px] text-ink-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-center text-[15px] text-ink-500">{footer}</div>
        </div>
      </div>
    </div>
  );
}
