import { Check, FileSignature, Instagram, Laptop, Mic, Monitor, Smartphone, type LucideIcon } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { LiveWallpaper } from '@/components/landing/LiveWallpaper';
import { INSTAGRAM_URL } from '@/lib/contact';

type Status = 'done' | 'active' | 'next' | 'planned';

type Milestone = {
  title: string;
  status: Status;
  label: string;
  description: string;
  Icon: LucideIcon;
  /** Pin position on the desktop map, in the road's 1000 × 240 coordinate space. */
  x: number;
  y: number;
};

const milestones: Milestone[] = [
  {
    title: 'Masaüstü çekirdek',
    status: 'done',
    label: 'Yayında',
    description: 'Dosya, UETS, görev, içtihat, dilekçe ve ajan altyapısı Windows masaüstünde kullanımda.',
    Icon: Monitor,
    x: 100,
    y: 64,
  },
  {
    title: 'Sesli asistan ve ajanlar',
    status: 'done',
    label: 'Tamamlandı',
    description: 'Sesli komutlarla dosya sorma, görev oluşturma ve ajanların günlük işleri birlikte tamamlaması.',
    Icon: Mic,
    x: 300,
    y: 176,
  },
  {
    title: 'iOS ve Android desteği',
    status: 'active',
    label: 'Geliştiriliyor',
    description: 'Dosyalar, evraklar, duruşmalar, görevler ve bildirimler telefon ve tablette.',
    Icon: Smartphone,
    x: 500,
    y: 64,
  },
  {
    title: 'Mobil imza entegrasyonu',
    status: 'next',
    label: 'Sırada',
    description: 'Faraklit’te hazırlanan evrakı telefondan imzalama; imzalı sürüm otomatik olarak dosyada saklanır.',
    Icon: FileSignature,
    x: 700,
    y: 176,
  },
  {
    title: 'macOS desteği',
    status: 'planned',
    label: 'Planlandı',
    description: 'Faraklit masaüstü deneyiminin Mac bilgisayarlara taşınması.',
    Icon: Laptop,
    x: 900,
    y: 64,
  },
];

// The road winds through every milestone. The first part (up to the last
// milestone in development) is drawn as travelled road, the rest as planned.
const TRAVELLED_ROAD = 'M0 150 C40 150 55 64 100 64 C200 64 200 176 300 176 C400 176 400 64 500 64';
const PLANNED_ROAD = 'M500 64 C600 64 600 176 700 176 C800 176 800 64 900 64 C945 64 960 110 1000 110';

// Faint contour lines give the panel the feel of a printed map.
const CONTOURS = [
  'M-20 40 C120 10 260 70 420 30 S720 -10 1020 40',
  'M-20 214 C160 190 300 238 480 210 S820 180 1020 222',
  'M560 120 C600 92 680 96 700 124 S640 160 590 150 S540 138 560 120 Z',
  'M150 118 C180 100 236 104 244 124 S204 148 176 142 S132 130 150 118 Z',
];

const MAP_HEIGHT = 240;

function Pin({ milestone, size = 'md' }: { milestone: Milestone; size?: 'md' | 'sm' }) {
  const tone =
    milestone.status === 'done'
      ? 'bg-anthracite text-white shadow-[0_10px_24px_-8px_rgba(35,36,38,0.55)]'
      : milestone.status === 'active'
        ? 'border-2 border-[#C4A46C] bg-anthracite text-[#F3E3BE] shadow-[0_0_0_5px_rgba(196,164,108,0.25),0_10px_28px_-6px_rgba(196,164,108,0.7)]'
      : milestone.status === 'next'
        ? 'border-2 border-anthracite bg-white text-anthracite'
        : 'border border-anthracite/25 bg-white text-graphite-600';
  const box = size === 'md' ? 'h-12 w-12' : 'h-11 w-11';
  return (
    <span className={`relative flex ${box} items-center justify-center rounded-full ${milestone.status === 'active' ? '' : 'ring-[6px] ring-[#f8f6f1]'} ${tone}`}>
      <milestone.Icon size={size === 'md' ? 19 : 17} strokeWidth={1.7} />
      {milestone.status === 'done' && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-anthracite ring-2 ring-[#f8f6f1]">
          <Check size={11} strokeWidth={2.6} />
        </span>
      )}
    </span>
  );
}

function StatusChip({ milestone }: { milestone: Milestone }) {
  const tone =
    milestone.status === 'done'
      ? 'bg-anthracite text-white'
      : milestone.status === 'active'
        ? 'bg-[rgba(196,164,108,0.2)] text-[#7A5E28]'
      : milestone.status === 'next'
        ? 'border border-anthracite/40 text-anthracite'
        : 'border border-anthracite/15 text-graphite-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] ${tone}`}>{milestone.label}</span>
  );
}

function MilestoneCard({ milestone, index }: { milestone: Milestone; index: number }) {
  return (
    <div className="rounded-[18px] border border-anthracite/10 bg-white/85 p-5 shadow-[0_24px_60px_-40px_rgba(35,36,38,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-serif text-[15px] italic text-graphite-600">{String(index + 1).padStart(2, '0')}</span>
        <StatusChip milestone={milestone} />
      </div>
      <p className="mt-3 font-serif text-[20px] leading-snug text-anthracite">{milestone.title}</p>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-[#5f5f5f]">{milestone.description}</p>
    </div>
  );
}

function RoadPaths({ planned }: { planned: boolean }) {
  const d = planned ? PLANNED_ROAD : TRAVELLED_ROAD;
  return (
    <>
      <path d={d} fill="none" stroke={planned ? '#D6D6D3' : '#1B1C1D'} strokeWidth={34} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke={planned ? '#EEEEEC' : '#2D2E30'} strokeWidth={28} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path
        d={d}
        fill="none"
        stroke={planned ? 'rgba(35,36,38,0.35)' : 'rgba(255,255,255,0.8)'}
        strokeWidth={1.6}
        strokeDasharray="10 12"
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function DesktopMap() {
  const top = milestones.map((m, i) => ({ m, i })).filter(({ m }) => m.y < MAP_HEIGHT / 2);
  const bottom = milestones.map((m, i) => ({ m, i })).filter(({ m }) => m.y >= MAP_HEIGHT / 2);
  const column = (x: number) => ({ gridColumnStart: Math.floor(x / 200) + 1, gridRowStart: 1 });

  return (
    <div className="hidden lg:block">
      <div className="grid grid-cols-5 items-end gap-5">
        {top.map(({ m, i }) => (
          <div key={m.title} style={column(m.x)}>
            <MilestoneCard milestone={m} index={i} />
          </div>
        ))}
      </div>

      <div className="relative" style={{ height: MAP_HEIGHT }}>
        <svg viewBox={`0 0 1000 ${MAP_HEIGHT}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {CONTOURS.map((d) => (
            <path key={d} d={d} fill="none" stroke="rgba(35,36,38,0.08)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <RoadPaths planned />
          <RoadPaths planned={false} />
        </svg>

        {milestones.map((m) => {
          const isTop = m.y < MAP_HEIGHT / 2;
          return (
            <div key={m.title}>
              {/* Hairline from the card down (or up) to the pin */}
              <span
                aria-hidden="true"
                className="absolute w-px -translate-x-1/2 bg-anthracite/20"
                style={
                  isTop
                    ? { left: `${m.x / 10}%`, top: 0, height: m.y - 24 }
                    : { left: `${m.x / 10}%`, top: m.y + 24, bottom: 0 }
                }
              />
              <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.x / 10}%`, top: m.y }}>
                <Pin milestone={m} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 items-start gap-5">
        {bottom.map(({ m, i }) => (
          <div key={m.title} style={column(m.x)}>
            <MilestoneCard milestone={m} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileMap() {
  const lastTravelled = milestones.reduce((last, m, i) => (m.status === 'done' || m.status === 'active' ? i : last), 0);
  return (
    <ol className="lg:hidden">
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        const travelled = i < lastTravelled;
        return (
          <li key={m.title} className={`relative pl-[68px] ${isLast ? '' : 'pb-6'}`}>
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-[14px] top-6 w-[20px] ${travelled ? 'bg-anthracite-800 ring-[3px] ring-inset ring-anthracite-900' : 'bg-[#EEEEEC] ring-1 ring-inset ring-paper-300'}`}
              >
                <span
                  className={`absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-[1.5px] border-dashed ${travelled ? 'border-white/80' : 'border-anthracite/30'}`}
                />
              </span>
            )}
            <div className="absolute left-0 top-0 z-10 ml-[2px]">
              <Pin milestone={m} size="sm" />
            </div>
            <MilestoneCard milestone={m} index={i} />
          </li>
        );
      })}
    </ol>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[#6a6a6a]">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-8 rounded-full bg-anthracite-800" /> Tamamlanan yol
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-8 rounded-full border border-paper-300 bg-[#EEEEEC]" /> Planlanan yol
      </span>
    </div>
  );
}

function Compass() {
  return (
    <div aria-hidden="true" className="hidden items-center gap-2 text-graphite-600 sm:flex">
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeOpacity={0.35} />
        <path d="M12 3.5 14.2 12 12 10.8 9.8 12Z" fill="#232426" />
        <path d="M12 20.5 9.8 12 12 13.2 14.2 12Z" fill="none" stroke="currentColor" strokeOpacity={0.6} />
      </svg>
      <span className="font-serif text-[13px] italic">K</span>
    </div>
  );
}

export function RoadmapPage() {
  return (
    <div className="relative isolate min-h-screen">
      <LiveWallpaper />
      <Navbar />
      <main>
        <section className="border-b border-anthracite/10">
          <div className="mx-auto max-w-[900px] px-4 pb-16 pt-20 text-center sm:px-6 lg:pb-20 lg:pt-28">
            <p className="inline-flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#6b6b6b]">
              <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
              Yol Haritası
              <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
            </p>
            <h1 className="mt-8 font-serif text-[40px] font-normal leading-[1.06] tracking-[-0.025em] text-anthracite sm:text-[56px] lg:text-[66px]">
              Faraklit’in yolu.
              <span className="block italic text-anthracite-700">Masaüstünden cebinize.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-[620px] text-[17px] leading-8 text-[#545454]">
              Tamamlanan adımları, bugün üzerinde çalıştıklarımızı ve sıradaki durakları tek haritada gösteriyoruz.
            </p>
          </div>
        </section>

        <section className="border-b border-anthracite/10">
          <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div
              className="relative overflow-hidden rounded-[28px] border border-anthracite/10 bg-white/60 px-4 py-8 shadow-[0_60px_140px_-80px_rgba(35,36,38,0.35)] sm:px-8 sm:py-10 lg:px-10 lg:py-12"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(35,36,38,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(35,36,38,0.035) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            >
              <div className="mb-8 flex items-center justify-between gap-4 lg:mb-10">
                <Legend />
                <Compass />
              </div>
              <DesktopMap />
              <MobileMap />
            </div>

            <div className="mt-10 flex flex-col items-center gap-5 text-center">
              <p className="max-w-[560px] text-[13px] leading-6 text-[#8a8a8a]">
                Rota, geliştirme önceliklerine göre güncellenir; aşamalar için tarih taahhüdü verilmez.
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-anthracite/20 bg-white/70 px-5 py-2.5 text-[14px] font-medium text-anthracite transition hover:border-anthracite/40"
              >
                <Instagram size={16} strokeWidth={1.7} /> Önerinizi Instagram’dan iletin
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
