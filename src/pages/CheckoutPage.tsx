import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, Info, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate, formatNumber, formatPrice } from '@/lib/format';
import { orderTypeLabel, rpcErrorMessage } from '@/lib/labels';
import type { BillingInfo, CreditPackage, OrderType, Payment, Plan, Subscription } from '@/types';

type CreatedOrder = {
  payment_id: string;
  order_number: string;
  amount_cents: number;
  currency: string;
  order_type: OrderType;
};

const emptyBilling: BillingInfo = { name: '', tax_id: '', tax_office: '', address: '', city: '', phone: '', email: '' };

function addPeriods(from: Date, plan: Plan, periods: number) {
  const d = new Date(from);
  if (plan.billing_period === 'month') d.setMonth(d.getMonth() + periods);
  else d.setFullYear(d.getFullYear() + periods);
  return d;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session, profile } = useAuth();

  const requestedType = (params.get('type') as OrderType | null) || 'new';
  const planId = params.get('plan');
  const packageId = params.get('package');
  const [periods, setPeriods] = useState(() => Math.min(3, Math.max(1, Number(params.get('periods')) || 1)));

  const [plan, setPlan] = useState<Plan | null>(null);
  const [creditPackage, setCreditPackage] = useState<CreditPackage | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billing, setBilling] = useState<BillingInfo>({ ...emptyBilling, email: session?.user?.email || '' });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;

    (async () => {
      const [subRes, lastPayRes] = await Promise.all([
        supabase.from('subscriptions').select('*, plan:plans(*)').eq('user_id', userId).order('ends_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('payments').select('billing').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      const sub = subRes.data as Subscription | null;
      setSubscription(sub);

      const lastBilling = (lastPayRes.data as Pick<Payment, 'billing'> | null)?.billing;
      setBilling((b) => ({
        ...b,
        name: lastBilling?.name || profile?.full_name || b.name,
        tax_id: lastBilling?.tax_id || b.tax_id,
        tax_office: lastBilling?.tax_office || b.tax_office,
        address: lastBilling?.address || b.address,
        city: lastBilling?.city || b.city,
        phone: lastBilling?.phone || profile?.phone || b.phone,
        email: lastBilling?.email || b.email || session.user.email || '',
      }));

      if (requestedType === 'credits') {
        const { data } = await supabase.from('credit_packages').select('*').eq('id', packageId || '').eq('is_active', true).maybeSingle();
        if (!data) setError('Seçilen kredi paketi bulunamadı veya satışa kapalı.');
        setCreditPackage(data as CreditPackage | null);
      } else if (requestedType === 'renewal') {
        if (!sub) setError('Uzatılacak bir aboneliğiniz bulunmuyor.');
        setPlan((sub?.plan as Plan | undefined) || null);
      } else {
        if (!planId) { navigate('/pricing'); return; }
        const { data } = await supabase.from('plans').select('*').eq('id', planId).eq('is_active', true).maybeSingle();
        if (!data) setError('Seçilen paket bulunamadı veya satışa kapalı.');
        setPlan(data as Plan | null);
      }
      setLoading(false);
    })();
  }, [session?.user, profile?.full_name, profile?.phone, requestedType, planId, packageId, navigate]);

  // A plan purchase while a subscription is running becomes a renewal (same plan) or a plan change.
  const activeSub = subscription && subscription.status === 'active' && new Date(subscription.ends_at) > new Date() ? subscription : null;
  const orderType: OrderType = useMemo(() => {
    if (requestedType === 'credits' || requestedType === 'renewal') return requestedType;
    if (activeSub && plan) return activeSub.plan_id === plan.id ? 'renewal' : 'plan_change';
    return requestedType === 'plan_change' && !subscription ? 'new' : requestedType;
  }, [requestedType, activeSub, plan, subscription]);

  const amount = orderType === 'credits' ? creditPackage?.price_cents || 0 : (plan?.price_cents || 0) * periods;
  const periodUnit = plan?.billing_period === 'month' ? 'ay' : 'yıl';
  const newEnd = plan && orderType !== 'credits'
    ? addPeriods(orderType === 'new' || !subscription ? new Date() : new Date(Math.max(Date.now(), new Date(subscription.ends_at).getTime())), plan, periods)
    : null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setError('');
    setProcessing(true);
    const { data, error: orderError } = await supabase.rpc('create_order', {
      p_order_type: orderType,
      p_plan_id: orderType === 'credits' || orderType === 'renewal' ? null : plan?.id,
      p_credit_package_id: orderType === 'credits' ? creditPackage?.id : null,
      p_periods: orderType === 'credits' ? 1 : periods,
      p_billing: billing,
    });
    setProcessing(false);
    const created = Array.isArray(data) ? data[0] : data;
    if (orderError || !created) {
      setError(rpcErrorMessage(orderError, 'Sipariş oluşturulamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'));
      return;
    }
    setOrder(created as CreatedOrder);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><p className="text-sm text-ink-400">Yükleniyor…</p></div>;
  }

  if (order) {
    return <PendingOrderView order={order} title={orderType === 'credits' ? creditPackage?.name || '' : plan?.name || ''} />;
  }

  const canOrder = orderType === 'credits' ? Boolean(creditPackage) : Boolean(plan);
  const heading: Record<OrderType, string> = {
    new: 'Faraklit lisansınızı alın.',
    renewal: 'Lisans sürenizi uzatın.',
    plan_change: 'Paketinizi değiştirin.',
    credits: 'Kredi yükleyin.',
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <div className="border-b border-[#d9d8d2] bg-[#f5f3ee]">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-6 py-4">
          <Logo />
          <Link to={session ? '/account/plan' : '/pricing'} className="text-link">
            <ArrowLeft size={15} />
            {session ? 'Paket ve krediye dön' : 'Paketlere dön'}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="mb-9 max-w-[650px]">
          <p className="section-label">{orderTypeLabel[orderType]}</p>
          <h1 className="mt-3 font-serif text-[42px] font-normal tracking-[-0.04em] text-ink-950">{heading[orderType]}</h1>
          <p className="mt-3 text-[16px] leading-6 text-ink-500">
            Siparişiniz oluşturulduktan sonra ödemeniz doğrulanır. Ödeme onaylandığında {orderType === 'credits' ? 'krediler hesabınıza yüklenir' : 'lisansınız otomatik olarak etkinleştirilir'}.
          </p>
        </div>

        {orderType !== requestedType && (
          <div className="mb-6 flex max-w-[720px] gap-3 rounded-[12px] border border-[#d7d6d0] bg-white p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-ink-500" />
            <p className="text-[14px] leading-5 text-ink-600">
              {orderType === 'renewal'
                ? 'Bu paket zaten aktif. Siparişiniz süre uzatma olarak işlenecek; yeni süre mevcut bitiş tarihinizin üzerine eklenir.'
                : orderType === 'plan_change'
                  ? `Aktif paketiniz ${activeSub?.plan?.name || ''}. Siparişiniz paket değişikliği olarak işlenecek; kalan süreniz korunur ve yeni dönem eklenir.`
                  : 'Aktif aboneliğiniz bulunmadığından sipariş yeni lisans olarak işlenecek.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <h2 className="mb-4 text-[16px] font-semibold uppercase tracking-[0.12em] text-ink-500">Sipariş özeti</h2>
            <div className="overflow-hidden rounded-[14px] border border-[#d7d6d0] bg-white">
              {orderType === 'credits' ? (
                <>
                  <OrderRow label="Kredi paketi" value={creditPackage?.name || '—'} />
                  <OrderRow label="Yüklenecek kredi" value={formatNumber(creditPackage?.credits || 0)} />
                </>
              ) : (
                <>
                  <OrderRow label="Paket" value={plan?.name || '—'} />
                  {subscription && orderType !== 'new' && <OrderRow label="Mevcut bitiş" value={formatDate(subscription.ends_at)} />}
                  <div className="flex items-center justify-between gap-4 border-b border-ink-200 p-5">
                    <span className="text-[15px] text-ink-500">Süre</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setPeriods(n)}
                          className={`rounded-[7px] border px-3 py-1.5 text-[14px] font-medium ${periods === n ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 text-ink-700 hover:bg-ink-50'}`}
                        >
                          {n} {periodUnit}
                        </button>
                      ))}
                    </div>
                  </div>
                  {newEnd && <OrderRow label="Yeni bitiş tarihi" value={formatDate(newEnd.toISOString())} />}
                  {(plan?.included_credits || 0) > 0 && <OrderRow label="Dahil kredi" value={`${formatNumber((plan?.included_credits || 0) * periods)} kredi`} />}
                </>
              )}
              <OrderRow label="Vergi (KDV)" value="Ödeme aşamasında hesaplanır" />
              <div className="flex items-center justify-between border-t border-ink-200 p-5">
                <span className="text-[16px] font-semibold text-ink-950">Toplam</span>
                <span className="text-[20px] font-semibold text-ink-950">{formatPrice(amount)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-[12px] border border-[#d7d6d0] bg-white p-4">
              <div className="flex gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#4d6d5d]" />
                <p className="text-[14px] leading-5 text-ink-500">
                  Ödeme doğrulanmadan lisans veya kredi tanımlanmaz. Sipariş, abonelik ve lisans kayıtları ayrı güvenlik katmanlarında tutulur.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-[16px] font-semibold uppercase tracking-[0.12em] text-ink-500">Fatura bilgileri</h2>
            <form onSubmit={handleCheckout} className="rounded-[14px] border border-[#d7d6d0] bg-white p-5 sm:p-6">
              <div className="space-y-4">
                <Field label="Ad Soyad / Firma unvanı" required value={billing.name} onChange={(v) => setBilling({ ...billing, name: v })} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="TCKN / VKN" value={billing.tax_id} inputMode="numeric" onChange={(v) => setBilling({ ...billing, tax_id: v.replace(/\D/g, '').slice(0, 11) })} />
                  <Field label="Vergi dairesi" value={billing.tax_office} onChange={(v) => setBilling({ ...billing, tax_office: v })} />
                </div>
                <Field label="Adres" value={billing.address} onChange={(v) => setBilling({ ...billing, address: v })} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Şehir" value={billing.city} onChange={(v) => setBilling({ ...billing, city: v })} />
                  <Field label="Telefon" type="tel" value={billing.phone} onChange={(v) => setBilling({ ...billing, phone: v })} />
                </div>
                <Field label="Fatura e-postası" type="email" required value={billing.email} onChange={(v) => setBilling({ ...billing, email: v })} />
              </div>

              <div className="mt-5 rounded-[10px] border border-[#d8d7d1] bg-[#f8f7f3] p-4">
                <div className="flex items-start gap-3">
                  <Clock3 size={17} className="mt-0.5 shrink-0 text-ink-500" />
                  <div>
                    <p className="text-[14px] font-semibold text-ink-700">Güvenli ödeme akışı</p>
                    <p className="mt-1 text-[13px] leading-5 text-ink-500">
                      Siparişiniz önce beklemeye alınır. Ödeme onaylandığında {orderType === 'credits' ? 'krediler hesabınıza yüklenir' : 'lisansınız otomatik olarak etkinleşir'} ve faturanız oluşturulur.
                    </p>
                  </div>
                </div>
              </div>

              {error && <p className="mt-4 rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>}

              <button type="submit" disabled={processing || !canOrder} className="btn-primary mt-5 w-full">
                {processing ? 'Sipariş oluşturuluyor…' : `Siparişi oluştur · ${formatPrice(amount)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = 'text', inputMode }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: 'numeric';
}) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input type={type} inputMode={inputMode} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </div>
  );
}

function OrderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-200 p-5 last:border-b-0">
      <span className="text-[15px] text-ink-500">{label}</span>
      <span className="text-right text-[15px] font-medium text-ink-800">{value}</span>
    </div>
  );
}

function PendingOrderView({ order, title }: { order: CreatedOrder; title: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f3ee]">
      <div className="border-b border-[#d9d8d2]">
        <div className="mx-auto max-w-8xl px-6 py-4"><Logo /></div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-[520px] rounded-[18px] border border-[#d7d6d0] bg-white p-7 shadow-[0_20px_60px_rgba(24,35,54,0.08)] sm:p-9">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3ef]">
            <Check size={22} className="text-[#4f725f]" />
          </div>
          <p className="section-label">Sipariş alındı</p>
          <h1 className="mt-3 font-serif text-[34px] font-normal tracking-[-0.035em] text-ink-950">Ödeme onayı bekleniyor.</h1>
          <p className="mt-3 text-[15px] leading-6 text-ink-500">
            Siparişiniz oluşturuldu. Ödemeniz onaylandığında {order.order_type === 'credits' ? 'krediler hesabınıza yüklenecek' : 'lisansınız otomatik olarak güncellenecek'}.
            Havale / EFT ile ödeme yapacaksanız açıklamaya sipariş numaranızı yazın.
          </p>

          <div className="mt-7 overflow-hidden rounded-[10px] border border-ink-200">
            <SuccessRow label="Sipariş No" value={order.order_number} />
            <SuccessRow label="Sipariş türü" value={orderTypeLabel[order.order_type]} />
            <SuccessRow label="Kapsam" value={title} />
            <SuccessRow label="Tutar" value={formatPrice(order.amount_cents)} />
            <SuccessRow label="Durum" value="Ödeme bekleniyor" />
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <button onClick={() => navigate('/account/payments')} className="btn-primary w-full">Siparişlerime git</button>
            <button onClick={() => navigate('/account')} className="btn-secondary w-full">Hesabıma dön</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-200 p-4 last:border-b-0">
      <span className="text-[15px] text-ink-500">{label}</span>
      <span className="text-right text-[15px] font-medium text-ink-800">{value}</span>
    </div>
  );
}
