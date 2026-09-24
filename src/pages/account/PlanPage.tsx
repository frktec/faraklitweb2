import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarPlus, Check, Coins, Repeat } from 'lucide-react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Badge, Loading, Notice } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { daysUntil, formatDate, formatNumber, formatPrice } from '@/lib/format';
import type { CreditPackage, CreditWallet, Plan, Subscription } from '@/types';

export function PlanPage() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [periods, setPeriods] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    (async () => {
      const [sub, pl, pk, w, pend] = await Promise.all([
        supabase.from('subscriptions').select('*, plan:plans(*)').eq('user_id', profile.id).order('ends_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('credit_packages').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('credit_wallets').select('*').eq('user_id', profile.id).maybeSingle(),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('status', 'pending'),
      ]);
      setSubscription(sub.data as Subscription | null);
      setPlans((pl.data as Plan[]) || []);
      setPackages((pk.data as CreditPackage[]) || []);
      setWallet(w.data as CreditWallet | null);
      setPendingCount(pend.count || 0);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <AccountLayout><Loading /></AccountLayout>;

  const currentPlan = subscription?.plan || null;
  const days = subscription ? daysUntil(subscription.ends_at) : 0;
  const isActive = Boolean(subscription && subscription.status === 'active' && days > 0);
  const unit = currentPlan?.billing_period === 'month' ? 'ay' : 'yıl';
  const renewEnd = (() => {
    if (!subscription || !currentPlan) return null;
    const d = new Date(Math.max(Date.now(), new Date(subscription.ends_at).getTime()));
    if (currentPlan.billing_period === 'month') d.setMonth(d.getMonth() + periods); else d.setFullYear(d.getFullYear() + periods);
    return d.toISOString();
  })();

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Paket ve Kredi</h1>
      <p className="mt-1 text-[16px] text-ink-500">Lisans sürenizi uzatın, paketinizi değiştirin veya kredi yükleyin.</p>

      {pendingCount > 0 && (
        <div className="mt-6">
          <Notice tone="amber">
            Ödemesi beklenen {pendingCount} siparişiniz var. <Link to="/account/payments" className="font-semibold underline">Siparişlerim</Link> sayfasından görüntüleyebilir veya iptal edebilirsiniz.
          </Notice>
        </div>
      )}

      {/* Renewal */}
      <section className="mt-8 overflow-hidden rounded-[12px] border border-ink-200 bg-white">
        <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-5 py-3">
          <CalendarPlus size={16} className="text-ink-500" />
          <h2 className="text-[16px] font-semibold text-ink-900">Süre uzat</h2>
        </div>
        {subscription && currentPlan ? (
          <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[18px] font-semibold text-ink-950">{currentPlan.name}</p>
                <Badge tone={isActive ? (days <= 14 ? 'amber' : 'green') : 'red'}>{isActive ? `${days} gün kaldı` : 'Süresi doldu'}</Badge>
              </div>
              <p className="mt-1 text-[15px] text-ink-500">Mevcut bitiş: {formatDate(subscription.ends_at)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPeriods(n)}
                    className={`rounded-[8px] border px-4 py-2 text-left ${periods === n ? 'border-ink-950 ring-1 ring-ink-950' : 'border-ink-200 hover:bg-ink-50'}`}
                  >
                    <span className="block text-[15px] font-semibold text-ink-900">{n} {unit}</span>
                    <span className="block text-[13px] text-ink-500">{formatPrice(currentPlan.price_cents * n)}</span>
                  </button>
                ))}
              </div>
              {renewEnd && <p className="mt-3 text-[14px] text-ink-500">Yeni bitiş tarihi: <span className="font-medium text-ink-800">{formatDate(renewEnd)}</span>. Kalan süreniz korunur.</p>}
            </div>
            <Link to={`/checkout?type=renewal&periods=${periods}`} className="btn-primary">
              Süreyi uzat · {formatPrice(currentPlan.price_cents * periods)}
            </Link>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-[15px] text-ink-500">Henüz bir lisansınız yok. Aşağıdan bir paket seçerek başlayabilirsiniz.</p>
          </div>
        )}
      </section>

      {/* Plans */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Repeat size={16} className="text-ink-500" />
          <h2 className="text-[16px] font-semibold text-ink-900">{subscription ? 'Paket değiştir' : 'Paket seç'}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === subscription?.plan_id;
            return (
              <div key={plan.id} className={`flex flex-col rounded-[12px] border bg-white p-5 ${isCurrent ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-ink-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-ink-950">{plan.name}</h3>
                  {isCurrent && <Badge tone="green">Mevcut</Badge>}
                </div>
                <p className="mt-2 text-[22px] font-semibold text-ink-950">{formatPrice(plan.price_cents)}</p>
                <p className="text-[14px] text-ink-400">/ {plan.billing_period === 'month' ? 'ay' : 'yıl'}</p>
                <ul className="mt-4 flex-1 space-y-1.5">
                  <Feature text={`${plan.user_limit} kullanıcı`} />
                  <Feature text={`${plan.device_limit} cihaz`} />
                  <Feature text={`${plan.storage_gb} GB depolama`} />
                  {plan.included_credits > 0 && <Feature text={`Her dönem ${formatNumber(plan.included_credits)} kredi`} />}
                </ul>
                {isCurrent ? (
                  <Link to={`/checkout?type=renewal&periods=${periods}`} className="btn-secondary mt-5 w-full">Süreyi uzat</Link>
                ) : (
                  <Link to={`/checkout?type=${isActive ? 'plan_change' : 'new'}&plan=${plan.id}`} className="btn-primary mt-5 w-full">
                    {isActive ? 'Bu pakete geç' : 'Satın al'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        {isActive && <p className="mt-3 text-[14px] text-ink-400">Paket değişikliğinde kalan süreniz korunur, yeni paketin dönemi mevcut bitiş tarihinin üzerine eklenir.</p>}
      </section>

      {/* Credits */}
      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-ink-500" />
            <h2 className="text-[16px] font-semibold text-ink-900">Kredi satın al</h2>
          </div>
          <Link to="/account/usage" className="text-link text-[14px]">
            Bakiye: <span className="font-semibold text-ink-900">{formatNumber(wallet?.balance || 0)} kredi</span> · Kullanım geçmişi <ArrowRight size={13} />
          </Link>
        </div>
        {packages.length === 0 ? (
          <div className="rounded-[12px] border border-ink-200 bg-white p-6 text-[15px] text-ink-500">
            Şu anda satışta kredi paketi bulunmuyor. Ek kredi için <Link to="/account/support" className="font-medium text-ink-800 underline">destek</Link> ekibimize yazabilirsiniz.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {packages.map((p) => (
              <div key={p.id} className="flex flex-col rounded-[12px] border border-ink-200 bg-white p-5">
                <p className="text-[15px] font-medium text-ink-500">{p.name}</p>
                <p className="mt-1 text-[24px] font-semibold text-ink-950">{formatNumber(p.credits)} <span className="text-[15px] font-medium text-ink-500">kredi</span></p>
                <p className="mt-1 text-[15px] text-ink-700">{formatPrice(p.price_cents)}</p>
                <Link
                  to={isActive ? `/checkout?type=credits&package=${p.id}` : '#'}
                  onClick={(e) => { if (!isActive) e.preventDefault(); }}
                  className={`mt-4 w-full ${isActive ? 'btn-secondary' : 'btn-secondary cursor-not-allowed opacity-50'}`}
                >
                  Satın al
                </Link>
              </div>
            ))}
          </div>
        )}
        {!isActive && packages.length > 0 && <p className="mt-3 text-[14px] text-ink-400">Kredi kullanabilmek için aktif bir lisansınız olmalıdır.</p>}
      </section>
    </AccountLayout>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <Check size={13} className="shrink-0 text-emerald-500" />
      <span className="text-[14px] text-ink-600">{text}</span>
    </li>
  );
}
