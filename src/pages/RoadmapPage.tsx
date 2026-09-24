import { useEffect, useState } from 'react';
import {
  BellRing,
  Bot,
  CheckCircle2,
  CircleDot,
  FileSignature,
  FolderOpen,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TabletSmartphone,
} from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const phases = [
  {
    title: 'Masaüstü çekirdek',
    status: 'Şimdi',
    description: 'Dosya, UETS, görev, içtihat, dilekçe ve ajan altyapısının masaüstü deneyimini olgunlaştırıyoruz.',
    Icon: Monitor,
  },
  {
    title: 'Mobil temel',
    status: 'Sırada',
    description: 'iOS ve Android’de dosyaları, evrakları, duruşmaları ve görevleri hızlıca görüntüleme.',
    Icon: Smartphone,
  },
  {
    title: 'Mobil işlemler',
    status: 'Planlandı',
    description: 'Görev ve duruşma ekleme, tamamlandı işaretleme, bildirimler ve günlük iş akışı.',
    Icon: TabletSmartphone,
  },
  {
    title: 'Mobil evrak imzalama',
    status: 'Planlandı',
    description: 'Faraklit’te oluşturulan evrakları mobil imzalama/onay akışına taşıma ve imzalı sürümü dosyada saklama.',
    Icon: FileSignature,
  },
  {
    title: 'Sesli asistan ve ajanlar',
    status: 'Geliştiriliyor',
    description: 'Sesli komutlarla dosya sorma, görev oluşturma ve ajanların günlük işleri birlikte tamamlaması.',
    Icon: Bot,
  },
] as const;

const mobileStages = [
  { title: 'Mobil arayüz sistemi', detail: 'Telefon ve tablet için sade, hızlı ekran yapısı.', Icon: Smartphone },
  { title: 'Güvenli oturum', detail: 'Hesap, cihaz ve oturum güvenliğinin mobilde taşınması.', Icon: ShieldCheck },
  { title: 'Dosya ve evrak görüntüleme', detail: 'Dosya özeti, evraklar, duruşmalar ve görevler.', Icon: FolderOpen },
  { title: 'Bildirim ve günlük işler', detail: 'Yaklaşan duruşma, süre ve görev bildirimleri.', Icon: BellRing },
  { title: 'Mobil imza akışı', detail: 'Hazırlanan evrakı telefondan imza/onay sürecine alma.', Icon: FileSignature },
] as const;

export function RoadmapPage() {
  const [active, setActive] = useState(0);
  const [mobileActive, setMobileActive] = useState(0);
  const ActivePhaseIcon = phases[active].Icon;
  const ActiveMobileIcon = mobileStages[mobileActive].Icon;

  useEffect(() => {
    const timer = window.setInterval(() => setMobileActive((value) => (value + 1) % mobileStages.length), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <Navbar />
      <main>
        <section className="harvey-paper border-b border-[#e3e3e3]">
          <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="max-w-[920px]">
              <p className="section-label text-[#676767]">Geliştirme Rotası</p>
              <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#262626] sm:text-[58px] lg:text-[70px]">
                Faraklit’in sıradaki adımlarını canlı izleyin.
              </h1>
              <p className="mt-6 max-w-[700px] text-[17px] leading-7 text-[#6e6e6e]">
                Masaüstünden mobile, evrak imzalamadan sesli asistana kadar geliştirme yönümüzü tek sayfada gösteriyoruz.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e3e3e3] bg-white">
          <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-label text-[#757575]">Canlı rota</p>
                <h2 className="mt-3 font-display text-[32px] font-semibold tracking-[-0.045em] text-[#2c2c2c] sm:text-[44px]">Neyi, hangi sırayla geliştiriyoruz?</h2>
              </div>
              <div className="flex items-center gap-2 text-[14px] font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Güncel ürün rotası
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="space-y-2.5">
                {phases.map((phase, index) => (
                  <button
                    key={phase.title}
                    type="button"
                    onClick={() => setActive(index)}
                    className={`flex w-full items-start gap-3 rounded-[13px] border p-4 text-left transition ${active === index ? 'border-[#afafaf] bg-[#f8f8f8] shadow-[0_12px_30px_rgba(52,52,52,.08)]' : 'border-[#e7e7e7] bg-white hover:bg-[#fafafa]'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${active === index ? 'bg-[#313131] text-white' : 'bg-[#f1f1f1] text-[#737373]'}`}>
                      <phase.Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[16px] font-semibold text-[#3e3e3e]">{phase.title}</p>
                        <span className="rounded-full bg-[#f2f2f2] px-2 py-1 text-[12px] font-semibold text-[#6e6e6e]">{phase.status}</span>
                      </div>
                      <p className="mt-1 text-[14px] leading-5 text-[#828282]">{phase.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-[18px] border border-[#e0e0e0] bg-[#232323] text-white shadow-[0_24px_65px_rgba(40,40,40,.14)]">
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white/35">Seçili aşama</p>
                  <h3 className="mt-1 text-[23px] font-semibold">{phases[active].title}</h3>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.07] text-ink-200">
                    <ActivePhaseIcon size={25} />
                  </div>
                  <p className="mt-5 max-w-[620px] text-[17px] leading-7 text-white/72">{phases[active].description}</p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {['Ürün deneyimi', 'Güvenlik', 'Hız'].map((item, index) => (
                      <div key={item} className="rounded-[11px] border border-white/10 bg-white/[0.045] p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-semibold text-white/72">{item}</span>
                          {index === 0 ? <Sparkles size={15} className="text-ink-200" /> : index === 1 ? <ShieldCheck size={15} className="text-emerald-200" /> : <CircleDot size={15} className="text-ink-200" />}
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="roadmap-progress h-full rounded-full bg-ink-300/70" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e3e3e3] bg-[#f5f5f5]">
          <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid items-center gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <div>
                <p className="section-label text-[#686868]">Mobil geliştirme</p>
                <h2 className="mt-4 font-display text-[33px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#2f2f2f] sm:text-[45px]">iOS ve Android, masaüstünün yanında çalışacak.</h2>
                <p className="mt-4 text-[16px] leading-7 text-[#757575]">Mobil uygulamada önce hızlı görüntüleme ve günlük işlemler; ardından bildirimler ve evrak imzalama akışı geliyor.</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#d9d9d9] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#636363]">iOS</span>
                  <span className="rounded-full border border-[#d9d9d9] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#636363]">Android</span>
                  <span className="rounded-full border border-[#d9d9d9] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#636363]">Telefon + tablet</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-[#dfdfdf] bg-white shadow-[0_22px_60px_rgba(48,48,48,.09)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#e8e8e8] bg-[#fafafa] px-4 py-3 sm:px-5">
                  <div>
                    <p className="text-[15px] font-semibold text-[#3f3f3f]">Mobil geliştirme akışı</p>
                    <p className="text-[13px] text-[#888888]">Aşamalar sırayla canlandırılır</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> canlı</span>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                    <div className="space-y-2.5">
                      {mobileStages.map((stage, index) => (
                        <button
                          key={stage.title}
                          type="button"
                          onClick={() => setMobileActive(index)}
                          className={`grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[11px] border p-3 text-left transition ${index === mobileActive ? 'border-[#b0b0b0] bg-[#f9f9f9] shadow-sm' : index < mobileActive ? 'border-[#e4e4e4] bg-[#f8f8f8]' : 'border-[#e9e9e9] bg-white'}`}
                        >
                          <span className={`flex h-9 w-9 items-center justify-center rounded-[9px] ${index < mobileActive ? 'bg-emerald-100 text-emerald-700' : index === mobileActive ? 'bg-[#313131] text-white' : 'bg-[#f2f2f2] text-[#969696]'}`}>
                            {index < mobileActive ? <CheckCircle2 size={17} /> : <stage.Icon size={17} />}
                          </span>
                          <div>
                            <p className="text-[15px] font-semibold text-[#444444]">{stage.title}</p>
                            <p className="mt-0.5 text-[13px] leading-5 text-[#858585]">{stage.detail}</p>
                          </div>
                          <span className={`h-2 w-2 rounded-full ${index === mobileActive ? 'bg-ink-500' : index < mobileActive ? 'bg-emerald-500' : 'bg-[#d3d3d3]'}`} />
                        </button>
                      ))}
                    </div>

                    <div className="mx-auto w-[196px] rounded-[30px] border-[7px] border-[#272727] bg-[#272727] p-[3px] shadow-[0_18px_45px_rgba(41,41,41,.18)]">
                      <div className="min-h-[360px] overflow-hidden rounded-[21px] bg-[#f8f8f8]">
                        <div className="mx-auto mt-2 h-4 w-16 rounded-full bg-[#272727]" />
                        <div className="p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#434343]">Faraklit Mobil</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="mt-7 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#313131] text-white">
                            <ActiveMobileIcon size={20} />
                          </div>
                          <p className="mt-4 text-[16px] font-semibold leading-5 text-[#3b3b3b]">{mobileStages[mobileActive].title}</p>
                          <p className="mt-2 text-[12px] leading-5 text-[#818181]">{mobileStages[mobileActive].detail}</p>
                          <div className="mt-6 space-y-2">
                            {[92, 74, 86].map((width, index) => <div key={index} className="h-9 rounded-[9px] border border-[#e6e6e6] bg-white p-2"><div className="h-2 rounded bg-[#ececec]" style={{ width: `${width}%` }} /></div>)}
                          </div>
                          <div className="mt-5 h-9 rounded-[9px] bg-[#313131] text-center text-[11px] font-semibold leading-9 text-white">Mobil önizleme</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
