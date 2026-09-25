import { useEffect, useState } from 'react';
import { ArrowRight, Check, CreditCard, Percent, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { LiveWallpaper } from '@/components/landing/LiveWallpaper';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Plan } from '@/types';

const planCopy: Record<string, { description: string; idealFor: string; highlights: string[] }> = {
  individual: {
    description: 'Tek başına çalışan avukatlar için.',
    idealFor: 'Serbest çalışan avukatlar',
    highlights: ['İçtihat ve mevzuat araştırması', 'Dilekçe ve belge araçları', 'Dosya ve görev takibi'],
  },
  organization: {
    description: 'Dosyaları ve günlük işleri ekipçe yöneten hukuk büroları için.',
    idealFor: 'Küçük ve orta ölçekli hukuk büroları',
    highlights: ['Ekip ve yetki yönetimi', 'Ortak dosya ve görev takibi', 'UETS ve takvim araçları'],
  },
  organization_pro: {
    description: 'Daha fazla kullanıcı, depolama ve yönetim aracı isteyen bürolar için.',
    idealFor: 'Yoğun çalışan ve büyüyen hukuk büroları',
    highlights: ['Gelişmiş yönetim araçları', 'Daha yüksek kullanıcı ve cihaz limiti', 'Öncelikli destek'],
  },
};

export function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setPlans((data as Plan[]) || []);
        setLoading(false);
      });
  }, []);

  const handlePurchase = (planId: string) => {
    navigate(`/checkout?plan=${planId}`);
  };

  return (
    <div className="relative isolate min-h-screen">
      <LiveWallpaper />
      <Navbar />
      <main>
        <section className="border-b border-anthracite/10">
          <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-[900px] text-center">
              <p className="section-label text-[#636363]">Fiyatlandırma</p>
              <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#232323] sm:text-[56px] lg:text-[68px]">
                İhtiyacınıza göre seçin,
                <span className="block font-serif font-normal italic text-[#656565]">ne ödeyeceğinizi baştan bilin.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[700px] text-[17px] leading-7 text-[#6a6a6a]">
                Aylık fiyatı ve yıllık ödemedeki avantajı aynı anda görün. Yıllık lisansı seçtiğinizde 12 ay kullanır, 10 aylık liste bedeli ödersiniz.
              </p>
              <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#d5d5d5] bg-white/80 px-4 py-2.5 text-[15px] font-semibold text-[#454545] shadow-sm backdrop-blur">
                <Percent size={16} /> Yıllık ödemede yaklaşık %17 avantaj · 2 ay ücretsiz
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-anthracite/10">
          <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            {loading ? (
              <div className="rounded-[18px] border border-[#e3e3e3] bg-white py-20 text-center text-[16px] text-[#737373]">Paketler yükleniyor…</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
                {plans.map((plan, idx) => {
                  const meta = planCopy[plan.slug] || {
                    description: 'Faraklit’i ihtiyacınıza göre kullanın.',
                    idealFor: 'Hukuk profesyonelleri',
                    highlights: [],
                  };
                  // Yıllık lisans, aylık liste fiyatının 10 aylık toplamına eşittir.
                  // Böylece yıllık seçimde 12 ay kullanım için 10 aylık bedel ödenir.
                  const monthlyListCents = Math.round(plan.price_cents / 10);
                  const annualMonthlyCents = Math.round(plan.price_cents / 12);
                  const yearlyListCents = monthlyListCents * 12;
                  const savingsCents = Math.max(0, yearlyListCents - plan.price_cents);
                  const discountPercent = yearlyListCents > 0 ? Math.round((savingsCents / yearlyListCents) * 100) : 0;
                  const featured = idx === 1;

                  return (
                    <article
                      key={plan.id}
                      className={`relative flex h-full flex-col overflow-hidden rounded-[20px] border bg-white p-5 shadow-[0_20px_55px_rgba(47,47,47,0.06)] sm:p-7 ${
                        featured ? 'border-[#979797] ring-1 ring-[#bbbbbb]' : 'border-[#e0e0e0]'
                      }`}
                    >
                      {featured && (
                        <div className="absolute right-5 top-5 rounded-full bg-[#313131] px-3 py-1.5 text-[13px] font-semibold text-white">
                          En çok tercih edilen
                        </div>
                      )}

                      <div className={featured ? 'pr-28' : ''}>
                        <p className="text-[14px] font-semibold uppercase tracking-[0.13em] text-[#7f7f7f]">{meta.idealFor}</p>
                        <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.035em] text-[#252525]">{plan.name}</h2>
                        <p className="mt-2 min-h-[48px] text-[16px] leading-6 text-[#717171]">{meta.description}</p>
                      </div>

                      <div className="mt-7 rounded-[14px] border border-[#e6e6e6] bg-[#fafafa] p-4 sm:p-5">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-semibold text-[#7f7f7f]">Aylık liste fiyatı</p>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-[30px] font-semibold tracking-[-0.04em] text-[#363636]">{formatPrice(monthlyListCents)}</span>
                              <span className="text-[15px] text-[#828282]">/ ay</span>
                            </div>
                          </div>
                          <span className="rounded-full border border-[#d0d0d0] bg-[#f6f6f6] px-3 py-1.5 text-[13px] font-semibold text-[#646464]">
                            2 ay ücretsiz
                          </span>
                        </div>

                        <div className="my-4 h-px bg-[#e4e4e4]" />

                        <p className="text-[14px] font-semibold text-[#656565]">Yıllık ödeme</p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-display text-[38px] font-semibold tracking-[-0.05em] text-[#232323]">{formatPrice(plan.price_cents)}</span>
                          <span className="text-[15px] text-[#808080]">/ yıl</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
                          <span className="font-semibold text-[#5b5b5b]">Aylık karşılığı {formatPrice(annualMonthlyCents)}</span>
                          <span className="text-[#a2a2a2] line-through">{formatPrice(yearlyListCents)} / yıl</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] font-semibold text-[#646464]">
                          <Percent size={14} /> %{discountPercent} avantaj · Yılda {formatPrice(savingsCents)} tasarruf
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        {meta.highlights.map((item) => (
                          <div key={item} className="flex items-start gap-2.5 text-[15px] leading-5 text-[#5b5b5b]">
                            <Check size={17} className="mt-0.5 shrink-0 text-[#636363]" strokeWidth={2} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 divide-y divide-[#eaeaea] border-y border-[#eaeaea]">
                        <InfoRow label="Kullanıcı" value={`${plan.user_limit} kişi`} />
                        <InfoRow label="Cihaz" value={`${plan.device_limit} cihaz`} />
                        <InfoRow label="Depolama" value={`${plan.storage_gb} GB`} />
                      </div>

                      <div className="mt-auto pt-7">
                        <button
                          type="button"
                          onClick={() => handlePurchase(plan.id)}
                          className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-[9px] px-5 text-[16px] font-semibold transition ${
                            featured
                              ? 'bg-[#2a2a2a] text-white hover:bg-[#232323]'
                              : 'border border-[#d3d3d3] bg-white text-[#353535] hover:bg-[#f7f7f7]'
                          }`}
                        >
                          Yıllık lisansı seç <ArrowRight size={16} />
                        </button>
                        <a
                          href={`mailto:destek@faraklit.com?subject=${encodeURIComponent(`${plan.name} aylık kullanım`)}`}
                          className="mt-3 block text-center text-[14px] font-medium text-[#757575] underline decoration-[#cfcfcf] underline-offset-4 hover:text-[#3a3a3a]"
                        >
                          Aylık ödeme seçeneği için bize ulaşın
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-8 grid gap-3 rounded-[18px] border border-[#e2e2e2] bg-white p-5 sm:grid-cols-3 sm:p-6">
              <TrustItem Icon={CreditCard} title="Fiyatlar açık" text="Paket ücretini ve yıllık avantajı ödeme öncesinde net olarak görürsünüz." />
              <TrustItem Icon={ShieldCheck} title="Lisans doğrulaması güvenli" text="Ödeme doğrulanmadan abonelik ve lisans etkinleştirilmez." />
              <TrustItem Icon={Percent} title="Yıllıkta 2 ay avantaj" text="12 aylık kullanım için 10 aylık liste bedeli üzerinden yıllık fiyat uygulanır." />
            </div>

            <div className="mt-10 text-center">
              <p className="text-[16px] text-[#737373]">
                Önce Faraklit’i görmek ister misiniz?{' '}
                <Link to="/register" className="font-semibold text-[#454545] underline decoration-[#b5b5b5] underline-offset-4 hover:text-[#2a2a2a]">
                  Ücretsiz hesap oluşturun
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[15px] text-[#787878]">{label}</span>
      <span className="text-[15px] font-semibold text-[#3c3c3c]">{value}</span>
    </div>
  );
}

function TrustItem({ Icon, title, text }: { Icon: typeof CreditCard; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[12px] bg-[#f9f9f9] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#efefef] text-[#525252]">
        <Icon size={17} />
      </span>
      <div>
        <h3 className="text-[15px] font-semibold text-[#373737]">{title}</h3>
        <p className="mt-1 text-[14px] leading-5 text-[#7e7e7e]">{text}</p>
      </div>
    </div>
  );
}
