import { useEffect, useState } from 'react';
import { ArrowRight, Check, CreditCard, Percent, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
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
    <div className="min-h-screen bg-[#f4f7fb]">
      <Navbar />
      <main>
        <section className="pricing-wallpaper border-b border-[#d9e1ea]">
          <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-[900px] text-center">
              <p className="section-label text-[#50647f]">Fiyatlandırma</p>
              <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#14233a] sm:text-[56px] lg:text-[68px]">
                İhtiyacınıza göre seçin,
                <span className="block font-serif font-normal italic text-[#51677f]">ne ödeyeceğinizi baştan bilin.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[700px] text-[17px] leading-7 text-[#5e6b79]">
                Aylık fiyatı ve yıllık ödemedeki avantajı aynı anda görün. Yıllık lisansı seçtiğinizde 12 ay kullanır, 10 aylık liste bedeli ödersiniz.
              </p>
              <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#cbd7e3] bg-white/80 px-4 py-2.5 text-[15px] font-semibold text-[#294766] shadow-sm backdrop-blur">
                <Percent size={16} /> Yıllık ödemede yaklaşık %17 avantaj · 2 ay ücretsiz
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#dce4ec] bg-[#f7f9fb]">
          <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            {loading ? (
              <div className="rounded-[18px] border border-[#dce4ec] bg-white py-20 text-center text-[16px] text-[#667485]">Paketler yükleniyor…</div>
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
                      className={`relative flex h-full flex-col overflow-hidden rounded-[20px] border bg-white p-5 shadow-[0_20px_55px_rgba(25,48,77,0.06)] sm:p-7 ${
                        featured ? 'border-[#8299b5] ring-1 ring-[#aebdce]' : 'border-[#d8e1e9]'
                      }`}
                    >
                      {featured && (
                        <div className="absolute right-5 top-5 rounded-full bg-[#173252] px-3 py-1.5 text-[13px] font-semibold text-white">
                          En çok tercih edilen
                        </div>
                      )}

                      <div className={featured ? 'pr-28' : ''}>
                        <p className="text-[14px] font-semibold uppercase tracking-[0.13em] text-[#718096]">{meta.idealFor}</p>
                        <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.035em] text-[#17263b]">{plan.name}</h2>
                        <p className="mt-2 min-h-[48px] text-[16px] leading-6 text-[#657282]">{meta.description}</p>
                      </div>

                      <div className="mt-7 rounded-[14px] border border-[#e0e7ee] bg-[#f8fafc] p-4 sm:p-5">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-semibold text-[#718096]">Aylık liste fiyatı</p>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-[30px] font-semibold tracking-[-0.04em] text-[#233750]">{formatPrice(monthlyListCents)}</span>
                              <span className="text-[15px] text-[#768392]">/ ay</span>
                            </div>
                          </div>
                          <span className="rounded-full border border-[#b9d7cb] bg-[#eef8f3] px-3 py-1.5 text-[13px] font-semibold text-[#247057]">
                            2 ay ücretsiz
                          </span>
                        </div>

                        <div className="my-4 h-px bg-[#dde5ed]" />

                        <p className="text-[14px] font-semibold text-[#52677f]">Yıllık ödeme</p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-display text-[38px] font-semibold tracking-[-0.05em] text-[#12243c]">{formatPrice(plan.price_cents)}</span>
                          <span className="text-[15px] text-[#748292]">/ yıl</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
                          <span className="font-semibold text-[#2d5f82]">Aylık karşılığı {formatPrice(annualMonthlyCents)}</span>
                          <span className="text-[#98a3ae] line-through">{formatPrice(yearlyListCents)} / yıl</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] font-semibold text-[#247057]">
                          <Percent size={14} /> %{discountPercent} avantaj · Yılda {formatPrice(savingsCents)} tasarruf
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        {meta.highlights.map((item) => (
                          <div key={item} className="flex items-start gap-2.5 text-[15px] leading-5 text-[#4d5d70]">
                            <Check size={17} className="mt-0.5 shrink-0 text-[#426b5b]" strokeWidth={2} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 divide-y divide-[#e6ebf0] border-y border-[#e6ebf0]">
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
                              ? 'bg-[#132b49] text-white hover:bg-[#0e223b]'
                              : 'border border-[#c9d4df] bg-white text-[#203650] hover:bg-[#f4f7fa]'
                          }`}
                        >
                          Yıllık lisansı seç <ArrowRight size={16} />
                        </button>
                        <a
                          href={`mailto:destek@faraklit.com?subject=${encodeURIComponent(`${plan.name} aylık kullanım`)}`}
                          className="mt-3 block text-center text-[14px] font-medium text-[#677789] underline decoration-[#c5d0db] underline-offset-4 hover:text-[#233b58]"
                        >
                          Aylık ödeme seçeneği için bize ulaşın
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-8 grid gap-3 rounded-[18px] border border-[#dbe3eb] bg-white p-5 sm:grid-cols-3 sm:p-6">
              <TrustItem Icon={CreditCard} title="Fiyatlar açık" text="Paket ücretini ve yıllık avantajı ödeme öncesinde net olarak görürsünüz." />
              <TrustItem Icon={ShieldCheck} title="Lisans doğrulaması güvenli" text="Ödeme doğrulanmadan abonelik ve lisans etkinleştirilmez." />
              <TrustItem Icon={Percent} title="Yıllıkta 2 ay avantaj" text="12 aylık kullanım için 10 aylık liste bedeli üzerinden yıllık fiyat uygulanır." />
            </div>

            <div className="mt-10 text-center">
              <p className="text-[16px] text-[#667485]">
                Önce Faraklit’i görmek ister misiniz?{' '}
                <Link to="/register" className="font-semibold text-[#294766] underline decoration-[#a8b7c7] underline-offset-4 hover:text-[#132b49]">
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
      <span className="text-[15px] text-[#6c7988]">{label}</span>
      <span className="text-[15px] font-semibold text-[#2b3d54]">{value}</span>
    </div>
  );
}

function TrustItem({ Icon, title, text }: { Icon: typeof CreditCard; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[12px] bg-[#f7f9fb] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#eaf0f6] text-[#355573]">
        <Icon size={17} />
      </span>
      <div>
        <h3 className="text-[15px] font-semibold text-[#25384f]">{title}</h3>
        <p className="mt-1 text-[14px] leading-5 text-[#718090]">{text}</p>
      </div>
    </div>
  );
}
