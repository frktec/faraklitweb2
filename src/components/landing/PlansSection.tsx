import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const plans = [
  ['Bireysel', 'Tek avukat için', '1 kullanıcı · 3 cihaz · 10 GB depolama'],
  ['Ekip', 'Hukuk büroları için', 'Çoklu kullanıcı · rol yönetimi · 50 GB depolama'],
] as const;

export function PlansSection() {
  return (
    <section className="border-b border-ivory-200 bg-white">
      <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-gold-600"><span className="gold-rule" aria-hidden="true" />Paketler</p>
            <h2 className="mt-6 font-serif text-[34px] font-normal leading-[1.12] tracking-[-0.02em] text-navy sm:text-[42px]">
              Tek başınıza veya ekibinizle.
            </h2>
            <Link to="/pricing" className="mt-8 inline-flex items-center gap-2 border-b border-navy pb-1 text-[15px] font-semibold text-navy">
              Paketleri inceleyin <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="border-t border-ivory-300">
            {plans.map(([title, subtitle, details]) => (
              <div key={title} className="grid gap-2 border-b border-ivory-300 py-7 sm:grid-cols-[200px_1fr] sm:gap-8">
                <div>
                  <p className="font-serif text-[22px] text-navy">{title}</p>
                  <p className="mt-1 text-[13px] text-[#7a8290]">{subtitle}</p>
                </div>
                <p className="text-[15px] leading-7 text-[#5f6977] sm:pt-1.5">{details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
