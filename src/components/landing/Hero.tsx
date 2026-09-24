import { ArrowRight, Check, Command, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiveProductDemo } from './LiveProductDemo';

export function Hero() {
  return (
    <section className="harvey-paper overflow-hidden border-b border-[#dce4ec]">
      <div className="mx-auto max-w-8xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-[1120px] text-center">
          <Link
            to="/pricing"
            className="group inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-[#d6dde5] bg-white/78 px-3 py-1.5 text-center text-[14px] font-semibold uppercase tracking-[0.12em] text-[#2a3544] backdrop-blur sm:px-3.5 sm:text-[15px] transition hover:border-[#2a3544]/30 hover:bg-white"
          >
            Hukuk büronuz için daha düzenli, daha hızlı, daha kontrollü çalışma
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>

          <p className="mt-6 text-[14px] font-semibold uppercase tracking-[0.17em] text-[#667688] sm:mt-8 sm:text-[15px]">
            Avukatlar ve hukuk büroları için tek çalışma alanı
          </p>
          <h1 className="mx-auto mt-5 max-w-[1020px] font-display text-[39px] font-semibold leading-[0.98] tracking-[-0.058em] text-[#17243a] min-[420px]:text-[46px] sm:text-[62px] lg:text-[82px]">
            Daha hızlı çalışın.
            <span className="block">Daha az işi gözden kaçırın.</span>
            <span className="mt-2 block font-serif text-[0.55em] font-normal italic leading-[1.04] text-[#5e6a78] sm:text-[0.5em]">
              Faraklit, dosyayı, UETS’i, içtihadı, dilekçeyi ve günlük işi tek yerde toplar.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[760px] text-[16px] leading-6 text-[#5e6670] sm:mt-7 sm:text-[18px] sm:leading-7">
            Dosya takibini sadeleştirin, süreleri kaçırmayın, ekibinizle aynı sistemde çalışın.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link to="/pricing" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[7px] bg-[#171a20] px-5 text-[16px] font-semibold text-white transition hover:bg-[#0f1217] sm:w-auto sm:px-6">
              Fiyatları incele
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => document.querySelector('#urun')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[7px] border border-[#cfd7e0] bg-white/85 px-6 text-[16px] font-semibold text-[#263a58] transition hover:border-[#263a58]/35 hover:bg-white sm:w-auto"
            >
              Özellikleri gör
            </button>
          </div>
        </div>

        <div className="relative mx-auto mt-10 max-w-[1180px] sm:mt-14 lg:mt-[72px]">
          <div className="pointer-events-none absolute -left-20 top-4 h-64 w-64 rounded-full bg-[#b8c8dc]/42 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#cdd6de]/45 blur-3xl" />
          <div className="pointer-events-none absolute left-[12%] top-[9%] h-24 w-24 rotate-12 rounded-[28px] border border-white/55 bg-white/20 backdrop-blur-sm" />

          <div className="relative rounded-[16px] border border-[#bfc5c6] bg-[#1b222c] p-1.5 shadow-[0_34px_95px_rgba(26,38,58,0.22)] sm:rounded-[22px] sm:p-3 lg:p-4">
            <div className="mb-2.5 flex items-center justify-between px-1.5 sm:mb-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/25" />
                <span className="h-2 w-2 rounded-full bg-white/25" />
                <span className="h-2 w-2 rounded-full bg-white/25" />
              </div>
              <div className="flex items-center gap-2 text-[14px] font-medium uppercase tracking-[0.13em] text-white/55">
                <Command size={12} /> Faraklit masaüstü
              </div>
            </div>
            <div className="overflow-hidden rounded-[10px] border border-white/10 bg-white sm:rounded-[13px]">
              <LiveProductDemo mode="overview" autoDockTour />
            </div>
          </div>

          <div className="absolute -left-5 top-[24%] hidden rounded-[10px] border border-[#d5d9d5] bg-white/95 p-3 shadow-[0_14px_40px_rgba(22,42,73,0.12)] backdrop-blur lg:block">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-violet-50 text-violet-700"><Search size={14} /></span>
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-violet-700">İçtihat</p>
                <p className="mt-0.5 text-[15px] font-semibold text-[#273448]">Aradığınız kararı daha hızlı bulun</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-5 bottom-[18%] hidden rounded-[10px] border border-[#d5d9d5] bg-white/95 p-3 shadow-[0_14px_40px_rgba(22,42,73,0.12)] backdrop-blur lg:block">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-indigo-50 text-indigo-700"><Sparkles size={14} /></span>
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Faraklit Asistan</p>
                <p className="mt-0.5 text-[15px] font-semibold text-[#273448]">Dosyaya göre cevap üretir</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-7 grid max-w-[960px] grid-cols-1 gap-x-4 gap-y-3 border-t border-[#dbe3eb] pt-6 text-left min-[430px]:grid-cols-2 sm:grid-cols-4">
          {['Dosya ve evraklar tek yerde', 'UETS ve süre takibi', 'İçtihat ve mevzuat araması', 'Dilekçe, imza ve görev yönetimi'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[15px] font-medium text-[#616a74]">
              <Check size={13} className="shrink-0 text-[#597765]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
