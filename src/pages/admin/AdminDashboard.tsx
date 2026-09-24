import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge, BarChart, ErrorNote, Loading, Metric, MetricGrid, PageHeader, Section, ShareBars } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { fetchProfileMap, type ProfileSummary } from '@/lib/profiles';
import { formatNumber, formatPrice, formatShortDate, daysUntil } from '@/lib/format';
import { orderTypeLabel } from '@/lib/labels';
import type { DashboardStats, Payment } from '@/types';

type ExpiringLicense = { id: string; user_id: string; ends_at: string; plan: { name: string } | null };

const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<Payment[]>([]);
  const [expiring, setExpiring] = useState<ExpiringLicense[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, pendingRes, expiringRes] = await Promise.all([
          supabase.rpc('admin_dashboard_stats'),
          supabase.from('payments').select('*, plan:plans(name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(6),
          supabase.from('licenses').select('id, user_id, ends_at, plan:plans(name)').eq('status', 'active')
            .gt('ends_at', new Date().toISOString())
            .lt('ends_at', new Date(Date.now() + 30 * 86400000).toISOString())
            .order('ends_at').limit(6),
        ]);
        if (statsRes.error || pendingRes.error || expiringRes.error) throw new Error();

        const pendingRows = (pendingRes.data as Payment[]) || [];
        const expiringRows = (expiringRes.data as unknown as ExpiringLicense[]) || [];
        setStats(statsRes.data as DashboardStats);
        setPending(pendingRows);
        setExpiring(expiringRows);
        setProfiles(await fetchProfileMap([...pendingRows.map((p) => p.user_id), ...expiringRows.map((l) => l.user_id)]));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error || !stats) {
    return <AdminLayout><PageHeader title="Genel Bakış" /><ErrorNote /></AdminLayout>;
  }

  return (
    <AdminLayout>
      <PageHeader title="Genel Bakış" description="Satış, lisans ve kullanım metrikleri." />

      <MetricGrid>
        <Metric label="Bu ay gelir" value={formatPrice(stats.revenue_month)} hint={`Toplam ${formatPrice(stats.revenue_total)}`} />
        <Metric label="Aktif lisans" value={formatNumber(stats.active_licenses)} hint={`${formatNumber(stats.total_users)} kullanıcı`} />
        <Metric label="Bu ay yeni kullanıcı" value={formatNumber(stats.new_users_month)} />
        <Metric
          label="Bekleyen sipariş"
          value={formatNumber(stats.pending_orders)}
          hint={formatPrice(stats.pending_amount)}
          highlight={stats.pending_orders > 0}
        />
        <Metric label="Bu ay üretilen iş" value={formatNumber(stats.jobs_month)} hint={`Toplam ${formatNumber(stats.jobs_total)}`} />
        <Metric label="Bu ay harcanan kredi" value={formatNumber(stats.credits_used_month)} />
        <Metric label="Kullanıcılardaki kredi" value={formatNumber(stats.credits_outstanding)} hint="Harcanmamış bakiye" />
        <Metric label="30 gün içinde bitecek" value={formatNumber(stats.expiring_licenses)} highlight={stats.expiring_licenses > 0} />
      </MetricGrid>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-ink-900">Aylık gelir</h2>
          <p className="mb-4 text-[13px] text-ink-400">Son 12 ay, tamamlanan ödemeler</p>
          <BarChart
            data={stats.revenue_by_month.map((m) => ({ label: `${monthNames[Number(m.month.slice(5)) - 1]} ${m.month.slice(2, 4)}`, value: m.amount }))}
            format={formatPrice}
          />
        </div>
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-ink-900">Günlük iş üretimi</h2>
          <p className="mb-4 text-[13px] text-ink-400">Son 30 gün</p>
          <BarChart
            data={stats.jobs_by_day.map((d) => ({ label: `${d.day.slice(8)}.${d.day.slice(5, 7)}`, value: d.count }))}
            format={(v) => `${formatNumber(v)} iş`}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink-900">İş türleri (30 gün)</h2>
            <Link to="/admin/jobs" className="text-link text-[14px]">Tümü <ArrowRight size={13} /></Link>
          </div>
          <ShareBars
            rows={stats.jobs_by_type.filter((t) => t.count > 0).slice(0, 7).map((t) => ({ label: t.label, value: t.count, sub: `${formatNumber(t.credits)} kr.` }))}
            format={formatNumber}
          />
          {stats.jobs_by_type.every((t) => t.count === 0) && <p className="text-[14px] text-ink-400">Henüz iş kaydı yok.</p>}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-ink-900">Ödeme bekleyen siparişler</h2>
            <Link to="/admin/sales?status=pending" className="text-link text-[14px]">Satışlara git <ArrowRight size={13} /></Link>
          </div>
          <div className="divide-y divide-ink-100">
            {pending.length === 0 ? (
              <p className="px-5 py-6 text-[15px] text-ink-400">Bekleyen sipariş yok.</p>
            ) : pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-ink-800">{profiles[p.user_id]?.full_name || profiles[p.user_id]?.email || '—'}</p>
                  <p className="truncate text-[13px] text-ink-400">
                    {p.order_number} · {orderTypeLabel[p.order_type]}{p.plan?.name ? ` · ${p.plan.name}` : ''} · {formatShortDate(p.created_at)}
                  </p>
                </div>
                <span className="shrink-0 text-[15px] font-semibold text-ink-900">{formatPrice(p.amount_cents)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Section title="Süresi yaklaşan lisanslar" actions={<Link to="/admin/licenses" className="text-link text-[14px]">Tüm lisanslar <ArrowRight size={13} /></Link>}>
        <div className="card divide-y divide-ink-100">
          {expiring.length === 0 ? (
            <p className="px-5 py-6 text-[15px] text-ink-400">Önümüzdeki 30 günde süresi dolacak lisans yok.</p>
          ) : expiring.map((l) => (
            <Link key={l.id} to={`/admin/users/${l.user_id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ink-50">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-ink-800">{profiles[l.user_id]?.full_name || profiles[l.user_id]?.email || '—'}</p>
                <p className="text-[13px] text-ink-400">{l.plan?.name || '—'} · {formatShortDate(l.ends_at)}</p>
              </div>
              <Badge tone={daysUntil(l.ends_at) <= 7 ? 'red' : 'amber'}>{daysUntil(l.ends_at)} gün</Badge>
            </Link>
          ))}
        </div>
      </Section>
    </AdminLayout>
  );
}
