import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="bg-[#171a20] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-8xl">
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-white/40">Faraklit</p>
            <h2 className="mt-4 max-w-[820px] font-serif text-[36px] font-normal leading-[1.03] tracking-[-0.04em] text-white sm:text-[52px] lg:text-[58px]">
              Hukuk büronuzun günlük işlerini daha sade yönetin.
            </h2>
          </div>
          <div>
            <Link to="/pricing" className="inline-flex min-h-11 items-center gap-2 border-b border-white pb-1 text-[16px] font-semibold text-white">
              Fiyatları incele <ArrowRight size={15} />
            </Link>
            <p className="mt-5 max-w-[420px] text-[15px] leading-7 text-white/52">Dosya, UETS, içtihat, dilekçe, görev ve ekip çalışması aynı sistemde.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
