import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const pillars = [
  ['I', 'Dosya ve evrak', 'Mahkeme, müvekkil, evrak ve görevler aynı dosyada.'],
  ['II', 'UETS ve süreler', 'Tebligatı dosyayla eşleştirin, son günü kaçırmayın.'],
  ['III', 'İçtihat ve mevzuat', 'İlgili kararı ve önemli pasajı birlikte bulun.'],
  ['IV', 'Dilekçe ve imza', 'Dosyadaki bilgilerle taslak hazırlayın, imzaya gönderin.'],
] as const;

const assurances = ['Rol bazlı erişim', 'KVKK odaklı veri yaklaşımı', 'Masaüstü uygulaması'];

export function Hero() {
  return (
    <section className="border-b border-ivory-200 bg-ivory">
      <div className="mx-auto max-w-8xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-gold-600">
              <span className="gold-rule" aria-hidden="true" />
              Avukatlar ve hukuk büroları için
            </p>

            <h1 className="mt-7 max-w-[720px] font-serif text-[40px] font-normal leading-[1.06] tracking-[-0.02em] text-navy min-[420px]:text-[46px] sm:text-[58px] xl:text-[66px]">
              Hukuk büronuzun işleri,
              <span className="block italic text-navy-700">tek bir düzende.</span>
            </h1>
          </div>

          <div className="lg:pb-2">
            <p className="max-w-[520px] text-[17px] leading-8 text-[#4a5566]">
              Faraklit; dosyaları, UETS tebligatlarını, süreleri, içtihat araştırmasını ve dilekçeleri
              ekibinizle birlikte kullandığınız güvenli bir çalışma alanında bir araya getirir.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/pricing"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-navy px-7 text-[15px] font-semibold text-white transition-colors hover:bg-navy-800"
              >
                Paketleri inceleyin
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-[4px] border border-navy/25 px-7 text-[15px] font-semibold text-navy transition-colors hover:border-navy/50 hover:bg-white"
              >
                Hesap oluşturun
              </Link>
            </div>
          </div>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-ivory-300 pt-6">
          {assurances.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#5a6473]">
              <span className="h-1 w-1 rotate-45 bg-gold" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <figure className="mt-12 pb-14 lg:mt-16 lg:pb-20">
          <div className="rounded-[8px] border border-ivory-300 bg-white p-1.5 shadow-[0_40px_90px_-40px_rgba(11,31,58,0.35)] sm:p-2">
            <img
              src="/assets/images/faraklit-genel-bakis.webp"
              alt="Faraklit masaüstü uygulamasının Genel Bakış ekranı: bugünkü duruşmalar ve öncelikli işler"
              width={1800}
              height={1018}
              className="h-auto w-full rounded-[5px]"
            />
          </div>
          <figcaption className="mt-4 text-center text-[13px] text-[#7a8290]">
            Faraklit masaüstü · Genel Bakış ekranı, örnek verilerle
          </figcaption>
        </figure>
      </div>

      <div className="border-t border-ivory-200 bg-white">
        <div className="mx-auto grid max-w-8xl sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(([numeral, title, text]) => (
            <div key={numeral} className="border-b border-ivory-200 px-4 py-8 sm:px-6 lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0">
              <p className="font-serif text-[15px] italic text-gold-600">{numeral}.</p>
              <p className="mt-3 text-[16px] font-semibold text-navy">{title}</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#5f6977]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
