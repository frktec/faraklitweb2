import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AssistantSimulation } from './AssistantSimulation';

const pillars = [
  ['I', 'Dosya ve evrak', 'Mahkeme, müvekkil, evrak ve görevler aynı dosyada.'],
  ['II', 'UETS ve süreler', 'Tebligatı dosyayla eşleştirin, son günü kaçırmayın.'],
  ['III', 'İçtihat ve mevzuat', 'İlgili kararı ve önemli pasajı birlikte bulun.'],
  ['IV', 'Dilekçe ve imza', 'Dosyadaki bilgilerle taslak hazırlayın, imzaya gönderin.'],
] as const;

const assurances = ['Rol bazlı erişim', 'KVKK odaklı veri yaklaşımı', 'Masaüstü uygulaması'];

export function Hero() {
  return (
    <section className="border-b border-paper-200 bg-paper">
      <div className="mx-auto max-w-8xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-graphite-600">
              <span className="accent-rule" aria-hidden="true" />
              Avukatlar ve hukuk büroları için
            </p>

            <h1 className="mt-7 max-w-[720px] font-serif text-[40px] font-normal leading-[1.06] tracking-[-0.02em] text-anthracite min-[420px]:text-[46px] sm:text-[58px] xl:text-[66px]">
              Hukuk büronuzun işleri,
              <span className="block italic text-anthracite-700">tek bir düzende.</span>
            </h1>
          </div>

          <div className="lg:pb-2">
            <p className="max-w-[520px] text-[17px] leading-8 text-[#545454]">
              Faraklit; dosyaları, UETS tebligatlarını, süreleri, içtihat araştırmasını ve dilekçeleri
              ekibinizle birlikte kullandığınız güvenli bir çalışma alanında bir araya getirir.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/pricing"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-anthracite px-7 text-[15px] font-semibold text-white transition-colors hover:bg-anthracite-800"
              >
                Paketleri inceleyin
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-[4px] border border-anthracite/25 px-7 text-[15px] font-semibold text-anthracite transition-colors hover:border-anthracite/50 hover:bg-white"
              >
                Hesap oluşturun
              </Link>
            </div>
          </div>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-paper-300 pt-6">
          {assurances.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#636363]">
              <span className="h-1 w-1 rotate-45 bg-graphite" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-12 pb-14 lg:mt-16 lg:pb-20">
          <AssistantSimulation />
          <p className="mt-4 text-center text-[13px] text-[#818181]">Temsilî simülasyon · örnek dosya verileriyle</p>
        </div>
      </div>

      <div className="border-t border-paper-200 bg-white">
        <div className="mx-auto grid max-w-8xl sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(([numeral, title, text]) => (
            <div key={numeral} className="border-b border-paper-200 px-4 py-8 sm:px-6 lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0">
              <p className="font-serif text-[15px] italic text-graphite-600">{numeral}.</p>
              <p className="mt-3 text-[16px] font-semibold text-anthracite">{title}</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#686868]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
