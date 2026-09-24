import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatShortDate } from '@/lib/format';

type SaleRow = {
  id: string;
  order_number: string;
  amount_cents: number;
  status: string;
  created_at: string;
  plan: { name: string };
  user: { full_name: string; email: string };
  invoices: { status: string }[];
};

export function AdminSales() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [filtered, setFiltered] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    supabase
      .from('payments')
      .select('id, order_number, amount_cents, status, created_at, plan:plans(name), user:profiles!payments_user_id_fkey(full_name, email), invoices(status)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError(true);
        } else {
          const rows = (data as unknown as SaleRow[]) || [];
          setSales(rows);
          setFiltered(rows);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (dateFilter === 'all') {
      setFiltered(sales);
      return;
    }
    const now = new Date();
    let start = new Date(0);
    if (dateFilter === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (dateFilter === 'week') start = new Date(now.getTime() - 7 * 86400000);
    else if (dateFilter === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
    setFiltered(sales.filter((s) => new Date(s.created_at) >= start));
  }, [dateFilter, sales]);

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Satışlar</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Satışlar</h1>

      <div className="mt-6">
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field w-44">
          <option value="all">Tümü</option>
          <option value="today">Bugün</option>
          <option value="week">Bu Hafta</option>
          <option value="month">Bu Ay</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-200 text-left">
              <Th>Sipariş No</Th>
              <Th>Kullanıcı</Th>
              <Th>Paket</Th>
              <Th>Tutar</Th>
              <Th>Tarih</Th>
              <Th>Ödeme</Th>
              <Th>Fatura</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((s) => (
              <tr key={s.id} className="text-[15px]">
                <td className="py-3 pr-4 font-medium text-ink-800">{s.order_number}</td>
                <td className="py-3 pr-4 text-ink-600">{s.user?.full_name || '—'}</td>
                <td className="py-3 pr-4 text-ink-600">{s.plan?.name || '—'}</td>
                <td className="py-3 pr-4 text-ink-700">{formatPrice(s.amount_cents)}</td>
                <td className="py-3 pr-4 text-ink-500">{formatShortDate(s.created_at)}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${
                    s.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    s.status === 'failed' ? 'bg-red-50 text-red-700' :
                    'bg-ink-100 text-ink-600'
                  }`}>
                    {s.status === 'completed' ? 'Tamamlandı' : s.status === 'failed' ? 'Başarısız' : 'Beklemede'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {s.invoices?.[0] ? (
                    <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${
                      s.invoices[0].status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600'
                    }`}>
                      {s.invoices[0].status === 'paid' ? 'Faturalandı' : 'Düzenlendi'}
                    </span>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">{children}</th>;
}
