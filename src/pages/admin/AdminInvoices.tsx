import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Printer, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge, ErrorNote, Loading, Metric, MetricGrid, PageHeader, Table, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { fetchProfileMap, type ProfileSummary } from '@/lib/profiles';
import { formatNumber, formatPrice, formatShortDate } from '@/lib/format';
import { invoiceStatusLabel, orderTypeLabel } from '@/lib/labels';
import { downloadCsv, openInvoice } from '@/lib/documents';
import type { Invoice, Payment } from '@/types';

type InvoiceRow = Invoice & { payment: Pick<Payment, 'order_number' | 'order_type' | 'periods' | 'credits'> & { plan: { name: string } | null } | null };

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | Invoice['status']>('all');
  const [month, setMonth] = useState('all');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('invoices')
        .select('*, payment:payments(order_number, order_type, periods, credits, plan:plans(name))')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (err) { setError(true); setLoading(false); return; }
      const rows = (data as unknown as InvoiceRow[]) || [];
      setInvoices(rows);
      setProfiles(await fetchProfileMap(rows.map((r) => r.user_id)));
      setLoading(false);
    })();
  }, []);

  const months = useMemo(() => Array.from(new Set(invoices.map((i) => i.created_at.slice(0, 7)))).sort().reverse(), [invoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    return invoices.filter((i) => {
      if (status !== 'all' && i.status !== status) return false;
      if (month !== 'all' && !i.created_at.startsWith(month)) return false;
      if (q && ![i.invoice_number, i.billing_name, i.billing_tax_id, i.billing_email, i.payment?.order_number, profiles[i.user_id]?.email]
        .some((v) => v?.toLocaleLowerCase('tr').includes(q))) return false;
      return true;
    });
  }, [invoices, profiles, search, status, month]);

  const paid = filtered.filter((i) => i.status === 'paid');
  const corporate = paid.filter((i) => (i.billing_tax_id || '').length === 10);

  const exportCsv = () => downloadCsv(`faraklit-faturalar-${month === 'all' ? 'tum' : month}.csv`,
    ['Fatura No', 'Tarih', 'Sipariş No', 'Kapsam', 'Ad / Firma', 'VKN / TCKN', 'Vergi Dairesi', 'Adres', 'Şehir', 'Telefon', 'E-posta', 'Tutar (TL)', 'Durum'],
    filtered.map((i) => [
      i.invoice_number, formatShortDate(i.created_at), i.payment?.order_number,
      i.payment ? `${orderTypeLabel[i.payment.order_type]}${i.payment.plan?.name ? ` · ${i.payment.plan.name}` : ''}` : '',
      i.billing_name, i.billing_tax_id, i.billing_tax_office, i.billing_address, i.billing_city, i.billing_phone, i.billing_email,
      (i.amount_cents / 100).toFixed(2).replace('.', ','), invoiceStatusLabel[i.status].label,
    ]));

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><PageHeader title="Faturalar" /><ErrorNote /></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader
        title="Faturalar"
        description="Tamamlanan ödemelerden oluşan faturalar. Muhasebe için CSV dışa aktarabilirsiniz."
        actions={<button onClick={exportCsv} className="btn-secondary"><Download size={15} />CSV indir</button>}
      />

      <MetricGrid>
        <Metric label="Fatura" value={formatNumber(filtered.length)} />
        <Metric label="Ödenen tutar" value={formatPrice(paid.reduce((s, i) => s + i.amount_cents, 0))} />
        <Metric label="Kurumsal (VKN)" value={formatNumber(corporate.length)} hint={`Bireysel ${formatNumber(paid.length - corporate.length)}`} />
        <Metric label="İptal" value={formatNumber(filtered.filter((i) => i.status === 'void').length)} />
      </MetricGrid>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Fatura no, firma, VKN ara…" className="input-field pl-9" />
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="input-field sm:w-40">
          <option value="all">Tüm aylar</option>
          {months.map((m) => <option key={m} value={m}>{m.slice(5)}.{m.slice(0, 4)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | Invoice['status'])} className="input-field sm:w-40">
          <option value="all">Tüm durumlar</option>
          {Object.entries(invoiceStatusLabel).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="mt-4">
        <Table head={['Fatura No', 'Tarih', 'Müşteri', 'Fatura bilgisi', 'Sipariş', 'Tutar', 'Durum', '']} empty={filtered.length === 0}>
          {filtered.map((i) => (
            <tr key={i.id}>
              <Td className="font-medium text-ink-900">{i.invoice_number}</Td>
              <Td className="text-ink-500">{formatShortDate(i.created_at)}</Td>
              <Td>
                <Link to={`/admin/users/${i.user_id}`} className="hover:underline">{profiles[i.user_id]?.full_name || profiles[i.user_id]?.email || '—'}</Link>
              </Td>
              <Td>
                <p>{i.billing_name || '—'}</p>
                <p className="text-[13px] text-ink-400">{[i.billing_tax_id, i.billing_tax_office].filter(Boolean).join(' · ') || '—'}</p>
              </Td>
              <Td className="text-ink-500">{i.payment?.order_number || '—'}</Td>
              <Td className="font-medium text-ink-900">{formatPrice(i.amount_cents)}</Td>
              <Td><Badge tone={invoiceStatusLabel[i.status].tone}>{invoiceStatusLabel[i.status].label}</Badge></Td>
              <Td>
                <button onClick={() => openInvoice(i, i.payment || undefined)} className="flex items-center gap-1 text-[14px] font-medium text-ink-600 hover:text-ink-900">
                  <Printer size={13} />Görüntüle
                </button>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </AdminLayout>
  );
}
