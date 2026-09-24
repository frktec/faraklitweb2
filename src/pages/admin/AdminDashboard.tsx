import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatShortDate } from '@/lib/format';

type Metrics = {
  totalUsers: number;
  activeLicenses: number;
  monthlyNewUsers: number;
  totalSales: number;
  monthlySales: number;
  expiringLicenses: number;
};

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    activeLicenses: 0,
    monthlyNewUsers: 0,
    totalSales: 0,
    monthlySales: 0,
    expiringLicenses: 0,
  });
  const [recentUsers, setRecentUsers] = useState<{ id: string; full_name: string; email: string; created_at: string }[]>([]);
  const [recentSales, setRecentSales] = useState<{ id: string; order_number: string; amount_cents: number; created_at: string; plan_name: string; user_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [totalUsersRes, activeLicensesRes, expiringRes, paymentsRes, recentRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active').lt('ends_at', new Date(Date.now() + 30 * 86400000).toISOString()),
          supabase.from('payments').select('amount_cents, created_at').eq('status', 'completed'),
          supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(8),
        ]);

        if (totalUsersRes.error || activeLicensesRes.error || expiringRes.error || paymentsRes.error || recentRes.error) {
          throw new Error();
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const allPayments = (paymentsRes.data as { amount_cents: number; created_at: string }[]) || [];
        const totalSales = allPayments.reduce((sum, p) => sum + p.amount_cents, 0);
        const monthlySales = allPayments
          .filter((p) => new Date(p.created_at) >= monthStart)
          .reduce((sum, p) => sum + p.amount_cents, 0);

        const allUsers = (recentRes.data as { id: string; full_name: string; email: string; created_at: string }[]) || [];

        setMetrics({
          totalUsers: totalUsersRes.count || 0,
          activeLicenses: activeLicensesRes.count || 0,
          monthlyNewUsers: allUsers.filter((u) => new Date(u.created_at) >= monthStart).length,
          totalSales,
          monthlySales,
          expiringLicenses: expiringRes.count || 0,
        });
        setRecentUsers(allUsers);

        const { data: sales, error: salesErr } = await supabase
          .from('payments')
          .select('id, order_number, amount_cents, created_at, plan:plans(name), user:profiles!payments_user_id_fkey(full_name)')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!salesErr) {
          setRecentSales(((sales as unknown as { id: string; order_number: string; amount_cents: number; created_at: string; plan: { name: string }; user: { full_name: string } }[]) || []).map(s => ({
            id: s.id,
            order_number: s.order_number,
            amount_cents: s.amount_cents,
            created_at: s.created_at,
            plan_name: s.plan?.name || '—',
            user_name: s.user?.full_name || '—',
          })));
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Genel Bakış</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Genel Bakış</h1>
        <p className="mt-1 text-[16px] text-ink-500">Platform metrikleri ve son aktiviteler.</p>
      </div>

      {/* Metrics — 2 rows of 3, refined */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-ink-200 bg-ink-200 lg:grid-cols-3">
        <MetricCell label="Toplam Kullanıcı" value={metrics.totalUsers.toString()} />
        <MetricCell label="Aktif Lisans" value={metrics.activeLicenses.toString()} />
        <MetricCell label="Bu Ay Yeni Kullanıcı" value={metrics.monthlyNewUsers.toString()} />
        <MetricCell label="Toplam Satış" value={formatPrice(metrics.totalSales)} />
        <MetricCell label="Bu Ay Satış" value={formatPrice(metrics.monthlySales)} />
        <MetricCell label="Yakında Bitecek Lisans" value={metrics.expiringLicenses.toString()} highlight={metrics.expiringLicenses > 0} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent users */}
        <div>
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Son Kayıt Olan Kullanıcılar</h2>
          <div className="card divide-y divide-ink-100">
            {recentUsers.length === 0 ? (
              <p className="p-4 text-[15px] text-ink-400">Kullanıcı bulunmuyor.</p>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink-800">{u.full_name || '—'}</p>
                    <p className="truncate text-[14px] text-ink-400">{u.email}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-[14px] text-ink-400">{formatShortDate(u.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent sales */}
        <div>
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Son Satışlar</h2>
          <div className="card divide-y divide-ink-100">
            {recentSales.length === 0 ? (
              <p className="p-4 text-[15px] text-ink-400">Satış bulunmuyor.</p>
            ) : (
              recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink-800">{s.user_name}</p>
                    <p className="truncate text-[14px] text-ink-400">{s.plan_name} · {s.order_number}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-[15px] font-medium text-ink-700">{formatPrice(s.amount_cents)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-white p-5 ${highlight ? 'bg-amber-50' : ''}`}>
      <p className="text-[14px] font-medium uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`mt-2 text-[22px] font-semibold tracking-tight ${highlight ? 'text-amber-700' : 'text-ink-950'}`}>{value}</p>
    </div>
  );
}
