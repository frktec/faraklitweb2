import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowUpRight, Check, Printer } from 'lucide-react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatPrice, formatDate } from '@/lib/format';
import { openInvoice } from '@/lib/documents';
import type { Invoice, Payment, Subscription, Plan } from '@/types';

type InvoiceWithPayment = Invoice & { payment: Pick<Payment, 'order_number' | 'order_type' | 'periods' | 'credits'> & { plan: { name: string } | null } | null };

export function BillingPage() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithPayment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [toggleMsg, setToggleMsg] = useState('');

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    const userId = profile.id;

    (async () => {
      const { data: inv } = await supabase
        .from('invoices')
        .select('*, payment:payments(order_number, order_type, periods, credits, plan:plans(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setInvoices((inv as unknown as InvoiceWithPayment[]) || []);

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscription(sub as Subscription | null);

      const { data: pl } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setPlans((pl as Plan[]) || []);

      setLoading(false);
    })();
  }, [profile]);

  const toggleAutoRenew = async () => {
    if (!subscription) return;
    setToggling(true);
    setToggleMsg('');

    const newValue = !subscription.auto_renew;
    const { data: updated, error } = await supabase
      .rpc('set_subscription_auto_renew', {
        p_subscription_id: subscription.id,
        p_auto_renew: newValue,
      });

    if (error || updated !== true) {
      setToggleMsg('Güncelleme sırasında bir hata oluştu.');
    } else {
      setSubscription({ ...subscription, auto_renew: newValue, cancelled_at: newValue ? null : new Date().toISOString() });
      setToggleMsg(newValue
        ? 'Otomatik yenileme açıldı. Paketiniz süre dolduğunda otomatik olarak yenilenecek.'
        : 'Otomatik yenileme kapatıldı. Süre dolduğunda paketiniz yenilenmeyecek.');
    }

    setToggling(false);
  };

  if (loading) {
    return <AccountLayout><p className="text-sm text-ink-400">Yükleniyor…</p></AccountLayout>;
  }

  const currentPlanId = subscription?.plan_id;

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Faturalandırma</h1>
      <p className="mt-1 text-[16px] text-ink-500">Paketinizi yönetin, faturalarınızı görüntüleyin ve indirin.</p>

      {/* Auto-renewal management */}
      {subscription ? (
        <div className="mt-8 rounded-[12px] border border-ink-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-ink-500" />
                <h2 className="text-[16px] font-semibold text-ink-900">Otomatik Yenileme</h2>
              </div>
              <p className="mt-1 text-[15px] text-ink-500">
                {subscription.auto_renew
                  ? 'Paketiniz süre dolduğunda otomatik olarak yenilenecek.'
                  : 'Otomatik yenileme kapalı. Süre dolduğunda paketiniz yenilenmeyecek.'}
              </p>
            </div>
            <button
              onClick={toggleAutoRenew}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                subscription.auto_renew ? 'bg-emerald-500' : 'bg-ink-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                subscription.auto_renew ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          {toggleMsg && (
            <p className="mt-3 rounded-[7px] bg-ink-50 px-3 py-2 text-[14px] text-ink-600">{toggleMsg}</p>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-[12px] border border-ink-200 bg-white p-8 text-center">
          <p className="text-[16px] text-ink-500 mb-4">Henüz aktif bir paketiniz bulunmuyor.</p>
          <Link to="/pricing" className="btn-primary">
            Paketleri İncele
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}

      {/* Plan comparison / upgrade */}
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-ink-900">Paketler</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div key={plan.id} className={`rounded-[10px] border p-5 ${
                isCurrent ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200' : 'border-ink-200 bg-white'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-ink-950">{plan.name}</h3>
                  {isCurrent && (
                    <span className="rounded-[4px] bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-700">
                      Mevcut
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[20px] font-semibold text-ink-950">{formatPrice(plan.price_cents)}</p>
                <p className="text-[14px] text-ink-400">/ {plan.billing_period === 'month' ? 'ay' : 'yıl'}</p>
                <div className="mt-4 space-y-1.5">
                  <PlanFeature text={`${plan.user_limit} kullanıcı`} />
                  <PlanFeature text={`${plan.device_limit} cihaz`} />
                  <PlanFeature text={`${plan.storage_gb} GB depolama`} />
                </div>
                {isCurrent ? (
                  <div className="mt-4 rounded-[7px] bg-ink-50 px-3 py-2 text-center text-[14px] font-medium text-ink-500">
                    Aktif paketiniz
                  </div>
                ) : (
                  <Link
                    to={`/checkout?type=${subscription ? 'plan_change' : 'new'}&plan=${plan.id}`}
                    className="btn-secondary mt-4 w-full text-center"
                  >
                    {subscription ? 'Bu pakete geç' : 'Satın Al'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-ink-900">Faturalar</h2>
        {invoices.length === 0 ? (
          <div className="rounded-[10px] border border-ink-200 bg-white p-8 text-center">
            <p className="text-[16px] text-ink-500">Henüz fatura bulunmuyor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-200 text-left">
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Fatura No</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Tarih</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Tutar</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Durum</th>
                  <th className="pb-2.5 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-[15px]">
                    <td className="py-3 pr-4 font-medium text-ink-800">{inv.invoice_number}</td>
                    <td className="py-3 pr-4 text-ink-600">{formatDate(inv.created_at)}</td>
                    <td className="py-3 pr-4 text-ink-700">{formatPrice(inv.amount_cents)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'void' ? 'bg-red-50 text-red-700' :
                        'bg-ink-100 text-ink-600'
                      }`}>
                        {inv.status === 'paid' ? 'Ödendi' : inv.status === 'void' ? 'İptal' : 'Düzenlendi'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button onClick={() => openInvoice(inv, inv.payment || undefined)} className="flex items-center gap-1 text-[14px] font-medium text-ink-600 hover:text-ink-900">
                        <Printer size={13} />
                        Görüntüle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

function PlanFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Check size={13} className="shrink-0 text-emerald-500" />
      <span className="text-[14px] text-ink-600">{text}</span>
    </div>
  );
}
