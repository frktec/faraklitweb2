import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LiveWallpaper } from '@/components/landing/LiveWallpaper';

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
    <div className="relative isolate flex min-h-screen flex-col">
      <LiveWallpaper />

      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-6 sm:px-8">
        <Logo />
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] text-[#6a6a6a] transition-colors hover:text-anthracite">
          <ArrowLeft size={15} />
          Ana sayfa
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <div className="w-full max-w-[440px]">
          <div className="rounded-[26px] border border-anthracite/10 bg-white/80 px-6 py-9 shadow-[0_60px_120px_-60px_rgba(35,36,38,0.45)] backdrop-blur-md sm:px-10 sm:py-11">
            <div className="flex justify-center">
              <img src="/assets/logos/faraklit-app-symbol-white.png" alt="" aria-hidden="true" width={195} height={192} className="h-9 w-auto rounded-[10px] bg-anthracite p-1.5" />
            </div>
            <h1 className="mt-5 text-center font-serif text-[32px] font-normal leading-tight tracking-[-0.02em] text-anthracite">{title}</h1>
            <p className="mt-2 text-center text-[15px] text-[#6a6a6a]">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-7 border-t border-anthracite/10 pt-6 text-center text-[15px] text-[#6a6a6a]">{footer}</div>
          </div>

          <p className="mt-6 text-center text-[12px] text-[#8a8a8a]">© 2026 Faraklit · Tüm hakları saklıdır.</p>
        </div>
      </main>
    </div>
  );
}
