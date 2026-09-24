import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PaymentActionModal, type PaymentAction } from '@/components/admin/PaymentActionModal';
import { Badge, ErrorNote, Loading, Metric, MetricGrid, Modal, Notice, PageHeader, Table, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { fetchProfileMap, type ProfileSummary } from '@/lib/profiles';
import { formatDateTime, formatNumber, formatPrice, formatShortDate } from '@/lib/format';
import { orderTypeLabel, paymentStatusLabel } from '@/lib/labels';
import { downloadCsv, openReceipt } from '@/lib/documents';
import type { OrderType, Payment, PaymentStatus } from '@/types';

type Period = 'all' | 'today' | '7d' | 'month' | 'last_month' | 'year';

function periodStart(period: Period): [Date | null, Date | null] {
  const now = new Date();
  switch (period) {
    case 'today': return [new Date(now.getFullYear(), now.getMonth(), now.getDate()), null];
    case '7d': return [new Date(Date.now() - 7 * 86400000), null];
    case 'month': return [new Date(now.getFullYear(), now.getMonth(), 1), null];
    case 'last_month': return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 1)];
    case 'year': return [new Date(now.getFullYear(), 0, 1), null];
    default: return [null, null];
  }
}

export function AdminSales() {
  const [params, setParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('all');
  const [type, setType] = useState<OrderType | 'all'>('all');
  const [detail, setDetail] = useState<Payment | null>(null);
  const [action, setAction] = useState<{ payment: Payment; action: PaymentAction } | null>(null);
  const [flash, setFlash] = useState('');
  const status = (params.get('status') as PaymentStatus | null) || 'all';

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('payments')
      .select('*, plan:plans(*), credit_package:credit_packages(*)')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (err) { setError(true); setLoading(false); return; }
    const rows = (data as Payment[]) || [];
    setPayments(rows);
    setProfiles(await fetchProfileMap(rows.map((r) => r.user_id)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const [from, to] = periodStart(period);
    const q = search.trim().toLocaleLowerCase('tr');
    return payments.filter((p) => {
      const at = new Date(p.created_at);
      if (from && at < from) return false;
      if (to && at >= to) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (type !== 'all' && p.order_type !== type) return false;
      if (q) {
        const u = profiles[p.user_id];
        if (![p.order_number, u?.full_name, u?.email, p.billing?.name, p.billing?.tax_id].some((v) => v?.toLocaleLowerCase('tr').includes(q))) return false;
      }
      return true;
    });
  }, [payments, profiles, period, status, type, search]);

  const totals = useMemo(() => {
    const completed = filtered.filter((p) => p.status === 'completed');
    const pending = filtered.filter((p) => p.status === 'pending');
    return {
      revenue: completed.reduce((s, p) => s + p.amount_cents, 0),
      count: completed.length,
      pending: pending.reduce((s, p) => s + p.amount_cents, 0),
      pendingCount: pending.length,
      avg: completed.length ? Math.round(completed.reduce((s, p) => s + p.amount_cents, 0) / completed.length) : 0,
      refunded: filtered.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount_cents, 0),
    };
  }, [filtered]);

  const setStatus = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('status'); else next.set('status', value);
    setParams(next, { replace: true });
  };

  const describe = (p: Payment) => p.order_type === 'credits'
    ? `${formatNumber(p.credits)} kredi`
    : `${p.plan?.name || '—'} · ${p.periods} dönem`;

  const exportCsv = () => downloadCsv(`faraklit-satislar-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Sipariş No', 'Tarih', 'Ödeme Tarihi', 'Müşteri', 'E-posta', 'Fatura Adı', 'VKN/TCKN', 'Tür', 'Kapsam', 'Tutar (TL)', 'Durum', 'Yöntem', 'Referans'],
    filtered.map((p) => [
      p.order_number, formatShortDate(p.created_at), p.paid_at ? formatShortDate(p.paid_at) : '',
      profiles[p.user_id]?.full_name, profiles[p.user_id]?.email, p.billing?.name, p.billing?.tax_id,
      orderTypeLabel[p.order_type], describe(p), (p.amount_cents / 100).toFixed(2).replace('.', ','),
      paymentStatusLabel[p.status].label, p.provider === 'pending-provider' ? '' : p.provider, p.provider_payment_id,
    ]));

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><PageHeader title="Satışlar" /><ErrorNote /></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader
        title="Satışlar"
        description="Tüm siparişler: yeni lisans, süre uzatma, paket değişikliği ve kredi satışları."
        actions={<button onClick={exportCsv} className="btn-secondary"><Download size={15} />CSV indir</button>}
      />

      {flash && <div className="mb-4"><Notice>{flash}</Notice></div>}

      <MetricGrid>
        <Metric label="Tahsilat" value={formatPrice(totals.revenue)} hint={`${formatNumber(totals.count)} ödeme`} />
        <Metric label="Ortalama sepet" value={formatPrice(totals.avg)} />
        <Metric label="Bekleyen" value={formatPrice(totals.pending)} hint={`${formatNumber(totals.pendingCount)} sipariş`} highlight={totals.pendingCount > 0} />
        <Metric label="İade" value={formatPrice(totals.refunded)} />
      </MetricGrid>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sipariş no, müşteri, VKN ara…" className="input-field pl-9" />
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="input-field lg:w-40">
          <option value="all">Tüm zamanlar</option>
          <option value="today">Bugün</option>
          <option value="7d">Son 7 gün</option>
          <option value="month">Bu ay</option>
          <option value="last_month">Geçen ay</option>
          <option value="year">Bu yıl</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field lg:w-44">
          <option value="all">Tüm durumlar</option>
          {Object.entries(paymentStatusLabel).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as OrderType | 'all')} className="input-field lg:w-44">
          <option value="all">Tüm türler</option>
          {Object.entries(orderTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="mt-4">
        <Table head={['Sipariş', 'Müşteri', 'Tür / Kapsam', 'Tutar', 'Durum', 'Tarih', '']} empty={filtered.length === 0}>
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-ink-50">
              <Td><button onClick={() => setDetail(p)} className="font-medium text-ink-900 hover:underline">{p.order_number}</button></Td>
              <Td>
                <Link to={`/admin/users/${p.user_id}`} className="font-medium text-ink-800 hover:underline">{profiles[p.user_id]?.full_name || '—'}</Link>
                <p className="text-[13px] text-ink-400">{profiles[p.user_id]?.email}</p>
              </Td>
              <Td>
                <p>{orderTypeLabel[p.order_type]}</p>
                <p className="text-[13px] text-ink-400">{describe(p)}</p>
              </Td>
              <Td className="font-medium text-ink-900">{formatPrice(p.amount_cents)}</Td>
              <Td><Badge tone={paymentStatusLabel[p.status].tone}>{paymentStatusLabel[p.status].label}</Badge></Td>
              <Td className="text-ink-500">{formatShortDate(p.created_at)}</Td>
              <Td>
                <div className="flex justify-end gap-3 text-[14px] font-medium">
                  {p.status === 'pending' && <>
                    <button className="text-emerald-700 hover:underline" onClick={() => setAction({ payment: p, action: 'complete' })}>Onayla</button>
                    <button className="text-red-700 hover:underline" onClick={() => setAction({ payment: p, action: 'failed' })}>Başarısız</button>
                    <button className="text-ink-500 hover:underline" onClick={() => setAction({ payment: p, action: 'cancelled' })}>İptal</button>
                  </>}
                  {p.status === 'completed' && <>
                    <button className="text-ink-600 hover:underline" onClick={() => openReceipt(p, profiles[p.user_id] || null)}>Makbuz</button>
                    <button className="text-ink-500 hover:underline" onClick={() => setAction({ payment: p, action: 'refunded' })}>İade</button>
                  </>}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      {detail && (
        <Modal title={`Sipariş ${detail.order_number}`} onClose={() => setDetail(null)}>
          <dl className="divide-y divide-ink-100 text-[14px]">
            {[
              ['Müşteri', `${profiles[detail.user_id]?.full_name || '—'} (${profiles[detail.user_id]?.email || '—'})`],
              ['Tür', orderTypeLabel[detail.order_type]],
              ['Kapsam', describe(detail)],
              ['Tutar', formatPrice(detail.amount_cents)],
              ['Durum', paymentStatusLabel[detail.status].label],
              ['Oluşturulma', formatDateTime(detail.created_at)],
              ['Ödeme tarihi', detail.paid_at ? formatDateTime(detail.paid_at) : '—'],
              ['Ödeme yöntemi', detail.provider && detail.provider !== 'pending-provider' ? detail.provider : '—'],
              ['Referans', detail.provider_payment_id || '—'],
              ['Fatura adı', detail.billing?.name || '—'],
              ['VKN / TCKN', detail.billing?.tax_id || '—'],
              ['Vergi dairesi', detail.billing?.tax_office || '—'],
              ['Adres', [detail.billing?.address, detail.billing?.city].filter(Boolean).join(', ') || '—'],
              ['Fatura e-postası', detail.billing?.email || '—'],
              ['Not', detail.admin_note || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-ink-500">{k}</dt>
                <dd className="text-right font-medium text-ink-800">{v}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}

      {action && (
        <PaymentActionModal
          payment={action.payment}
          action={action.action}
          onClose={() => setAction(null)}
          onDone={() => { setAction(null); setFlash(`${action.payment.order_number} güncellendi.`); load(); }}
        />
      )}
    </AdminLayout>
  );
}
