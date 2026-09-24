import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import type { Plan } from '@/types';

type PendingOrder = {
  payment_id: string;
  order_number: string;
  amount_cents: number;
  currency: string;
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [error, setError] = useState('');

  const [billing, setBilling] = useState({
    name: '',
    tax_id: '',
    tax_office: '',
    address: '',
    city: '',
    phone: '',
    email: session?.user?.email || '',
  });

  const planId = searchParams.get('plan');

  useEffect(() => {
    if (session?.user?.email) {
      setBilling((current) => current.email ? current : { ...current, email: session.user.email || '' });
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (!planId) {
      navigate('/pricing');
      return;
    }

    supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data, error: planError }) => {
        if (planError || !data) {
          setError('Seçilen paket bulunamadı veya satışa kapalı.');
          setPlan(null);
        } else {
          setPlan(data as Plan);
        }
        setLoading(false);
      });
  }, [planId, navigate]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !plan) return;

    setError('');
    setProcessing(true);

    try {
      const { data, error: orderError } = await supabase.rpc('create_pending_order', {
        p_plan_id: plan.id,
        p_billing: billing,
      });

      if (orderError) throw orderError;

      const created = Array.isArray(data) ? data[0] : data;
      if (!created) throw new Error('Order could not be created');

      setOrder(created as PendingOrder);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Sipariş oluşturulamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-ink-400">Yükleniyor…</p>
      </div>
    );
  }

  if (order) {
    return <PendingOrderView plan={plan} order={order} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <div className="border-b border-[#d9d8d2] bg-[#f5f3ee]">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-6 py-4">
          <Logo />
          <Link to="/pricing" className="text-link">
            <ArrowLeft size={15} />
            Paketlere dön
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="mb-9 max-w-[650px]">
          <p className="section-label">Sipariş</p>
          <h1 className="mt-3 font-serif text-[42px] font-normal tracking-[-0.04em] text-ink-950">Faraklit lisansınızı seçin.</h1>
          <p className="mt-3 text-[16px] leading-6 text-ink-500">
            Siparişiniz oluşturulduktan sonra ödeme doğrulanır. Lisansınız, ödeme onayı geldikten sonra otomatik olarak etkinleştirilir.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <h2 className="mb-4 text-[16px] font-semibold uppercase tracking-[0.12em] text-ink-500">Sipariş özeti</h2>
            <div className="overflow-hidden rounded-[14px] border border-[#d7d6d0] bg-white">
              <OrderRow label="Paket" value={plan?.name || ''} />
              <OrderRow label="Lisans süresi" value="1 Yıl" />
              <OrderRow label="Ara toplam" value={formatPrice(plan?.price_cents || 0)} />
              <OrderRow label="Vergi (KDV)" value="Ödeme aşamasında hesaplanır" />
              <div className="flex items-center justify-between border-t border-ink-200 p-5">
                <span className="text-[16px] font-semibold text-ink-950">Toplam</span>
                <span className="text-[20px] font-semibold text-ink-950">{formatPrice(plan?.price_cents || 0)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-[12px] border border-[#d7d6d0] bg-white p-4">
              <div className="flex gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#4d6d5d]" />
                <p className="text-[14px] leading-5 text-ink-500">
                  Ödeme kaydı, abonelik ve lisans ayrı güvenlik katmanlarında tutulur. Ödeme doğrulanmadan aktif abonelik veya lisans üretilemez.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-[16px] font-semibold uppercase tracking-[0.12em] text-ink-500">Fatura bilgileri</h2>
            <form onSubmit={handleCheckout} className="rounded-[14px] border border-[#d7d6d0] bg-white p-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="label-field">Ad Soyad / Firma</label>
                  <input type="text" required value={billing.name} onChange={(e) => setBilling({ ...billing, name: e.target.value })} className="input-field" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label-field">TCKN / VKN</label>
                    <input type="text" value={billing.tax_id} onChange={(e) => setBilling({ ...billing, tax_id: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Vergi Dairesi</label>
                    <input type="text" value={billing.tax_office} onChange={(e) => setBilling({ ...billing, tax_office: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label-field">Adres</label>
                  <input type="text" value={billing.address} onChange={(e) => setBilling({ ...billing, address: e.target.value })} className="input-field" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label-field">Şehir</label>
                    <input type="text" value={billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Telefon</label>
                    <input type="tel" value={billing.phone} onChange={(e) => setBilling({ ...billing, phone: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label-field">E-posta</label>
                  <input type="email" required value={billing.email} onChange={(e) => setBilling({ ...billing, email: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="mt-5 rounded-[10px] border border-[#d8d7d1] bg-[#f8f7f3] p-4">
                <div className="flex items-start gap-3">
                  <Clock3 size={17} className="mt-0.5 shrink-0 text-ink-500" />
                  <div>
                    <p className="text-[14px] font-semibold text-ink-700">Güvenli ödeme akışı</p>
                    <p className="mt-1 text-[13px] leading-5 text-ink-500">
                      Siparişiniz önce beklemeye alınır. Ödeme sağlayıcısından onay geldikten sonra lisansınız otomatik olarak etkinleştirilir.
                    </p>
                  </div>
                </div>
              </div>

              {error && <p className="mt-4 rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>}

              <button type="submit" disabled={processing || !plan} className="btn-primary mt-5 w-full">
                {processing ? 'Sipariş oluşturuluyor…' : `Siparişi oluştur · ${formatPrice(plan?.price_cents || 0)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-200 p-5 last:border-b-0">
      <span className="text-[15px] text-ink-500">{label}</span>
      <span className="text-right text-[15px] font-medium text-ink-800">{value}</span>
    </div>
  );
}

function PendingOrderView({ plan, order }: { plan: Plan | null; order: PendingOrder }) {
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
          <h1 className="mt-3 font-serif text-[34px] font-normal tracking-[-0.035em] text-ink-950">Ödeme doğrulaması bekleniyor.</h1>
          <p className="mt-3 text-[15px] leading-6 text-ink-500">
            Siparişiniz oluşturuldu. Ödeme onayı geldikten sonra lisansınız otomatik olarak etkinleştirilecek.
          </p>

          <div className="mt-7 overflow-hidden rounded-[10px] border border-ink-200">
            <SuccessRow label="Sipariş No" value={order.order_number} />
            <SuccessRow label="Paket" value={plan?.name || ''} />
            <SuccessRow label="Tutar" value={formatPrice(order.amount_cents)} />
            <SuccessRow label="Durum" value="Ödeme bekleniyor" />
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <button onClick={() => navigate('/account/payments')} className="btn-primary w-full">Ödemelerime git</button>
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
