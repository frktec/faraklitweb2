import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const plans = [
  ['Bireysel', 'Tek avukat için', '1 kullanıcı · 3 cihaz · 10 GB depolama'],
  ['Ekip', 'Hukuk büroları için', 'Çoklu kullanıcı · rol yönetimi · 50 GB depolama'],
] as const;

export function PlansSection() {
  return (
    <section className="border-b border-[#e3e7eb] bg-white">
      <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">Paketler</p>
            <h2 className="mt-4 font-display text-[32px] font-semibold leading-[1.03] tracking-[-0.045em] text-[#171a20] sm:text-[44px]">
              Tek başınıza veya ekibinizle.
            </h2>
            <Link to="/pricing" className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-[#20262d]">
              Fiyatları incele <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="border-t border-[#dfe4e8]">
            {plans.map(([title, subtitle, details]) => (
              <div key={title} className="grid gap-2 border-b border-[#dfe4e8] py-6 sm:grid-cols-[180px_1fr] sm:gap-8">
                <div>
                  <p className="text-[17px] font-semibold text-[#20262d]">{title}</p>
                  <p className="mt-1 text-[13px] text-[#8a929a]">{subtitle}</p>
                </div>
                <p className="text-[15px] leading-6 text-[#68717a]">{details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
