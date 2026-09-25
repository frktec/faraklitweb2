import { ArrowDown, Instagram } from 'lucide-react';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';
import { VoiceSimulation } from './VoiceSimulation';

const pillars = [
  ['I', 'Dosya ve evrak', 'Mahkeme, müvekkil, evrak ve görevler aynı dosyada.'],
  ['II', 'UETS ve süreler', 'Tebligatı dosyayla eşleştirin, son günü kaçırmayın.'],
  ['III', 'İçtihat ve mevzuat', 'İlgili kararı ve önemli pasajı birlikte bulun.'],
  ['IV', 'Dilekçe ve imza', 'Dosyadaki bilgilerle taslak hazırlayın, imzaya gönderin.'],
] as const;

const assurances = ['Rol bazlı erişim', 'KVKK odaklı veri yaklaşımı', 'Masaüstü uygulaması'];

export function Hero() {
  return (
    <section>
      <div className="mx-auto max-w-[1040px] px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 lg:pb-20 lg:pt-36">
        <p className="inline-flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b] sm:tracking-[0.32em]">
          <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
          Avukatlar ve hukuk büroları için
          <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
        </p>

        <h1 className="mx-auto mt-9 font-serif text-[42px] font-normal leading-[1.03] tracking-[-0.025em] text-anthracite min-[420px]:text-[50px] sm:text-[68px] lg:text-[86px]">
          Avukatlık mesleği değişiyor.
          <span className="block italic text-anthracite-700">Büronuzu dijitale taşıyın.</span>
        </h1>

        <p className="mx-auto mt-9 max-w-[640px] text-[17px] leading-8 text-[#545454] sm:text-[18px]">
          Dosyalar, tebligatlar, süreler ve dilekçeler artık klasörlerde ve tablolarda yönetilemeyecek kadar çok.
          Faraklit, büronuzun tüm işini ekibinizle birlikte kullandığınız güvenli bir dijital çalışma alanına taşır.
        </p>

        <div className="mt-11 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-anthracite px-8 text-[15px] font-medium tracking-[0.01em] text-white transition-colors hover:bg-black"
          >
            <Instagram size={17} />
            Instagram’dan iletişime geçin
          </a>
          <a
            href="#sesli-asistan"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-anthracite/20 bg-white/50 px-8 text-[15px] font-medium tracking-[0.01em] text-anthracite transition-colors hover:border-anthracite/40 hover:bg-white/80"
          >
            Faraklit’i tanıyın
            <ArrowDown size={16} />
          </a>
        </div>
        <p className="mt-5 text-[13px] text-[#7a7a7a]">
          Paketler ve fiyatlar hakkında bilgi almak için {INSTAGRAM_HANDLE} hesabımızdan bize yazın.
        </p>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {assurances.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-[13px] tracking-[0.02em] text-[#6b6b6b]">
              <span className="h-1 w-1 rotate-45 bg-anthracite/40" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div id="sesli-asistan" className="mx-auto max-w-[880px] px-4 pb-24 sm:px-6 lg:pb-32">
        <VoiceSimulation />
        <p className="mt-5 text-center text-[12px] tracking-[0.02em] text-[#8a8a8a]">Sesli asistan · temsili simülasyon</p>
      </div>

      <div className="border-y border-anthracite/10 bg-white/55">
        <div className="mx-auto grid max-w-8xl sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(([numeral, title, text]) => (
            <div key={numeral} className="border-b border-anthracite/10 px-4 py-10 sm:px-6 lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0">
              <p className="font-serif text-[15px] italic text-[#8a8a8a]">{numeral}.</p>
              <p className="mt-3 text-[16px] font-semibold text-anthracite">{title}</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#666]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
