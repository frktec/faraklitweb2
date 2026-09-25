import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="bg-anthracite/95 py-24 text-white lg:py-28">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-graphite"><span className="accent-rule" aria-hidden="true" />Faraklit</p>
            <h2 className="mt-6 max-w-[760px] font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.02em] text-white sm:text-[48px] lg:text-[54px]">
              Hukuk büronuzun günlük işlerini daha sade yönetin.
            </h2>
          </div>
          <div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/pricing" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-paper px-7 text-[15px] font-semibold text-anthracite transition-colors hover:bg-white">
                Paketleri inceleyin <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-[4px] border border-white/25 px-7 text-[15px] font-semibold text-white transition-colors hover:border-white/50">
                Giriş yapın
              </Link>
            </div>
            <p className="mt-6 max-w-[420px] text-[15px] leading-7 text-white/60">Dosya, UETS, içtihat, dilekçe, görev ve ekip çalışması aynı sistemde.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
