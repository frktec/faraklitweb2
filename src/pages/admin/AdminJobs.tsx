import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge, BarChart, ErrorNote, Loading, Metric, MetricGrid, PageHeader, ShareBars, Table, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { fetchProfileMap, type ProfileSummary } from '@/lib/profiles';
import { formatDateTime, formatNumber } from '@/lib/format';
import { downloadCsv } from '@/lib/documents';
import type { Job, JobType } from '@/types';

type Range = '7' | '30' | '90' | '365';

export function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [types, setTypes] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<Range>('30');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState<'all' | Job['status']>('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(50);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const since = new Date(Date.now() - Number(range) * 86400000).toISOString();
      const [j, t] = await Promise.all([
        supabase.from('jobs').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(5000),
        supabase.from('job_types').select('*').order('sort_order'),
      ]);
      if (j.error || t.error) { setError(true); setLoading(false); return; }
      const rows = (j.data as Job[]) || [];
      setJobs(rows);
      setTypes(Object.fromEntries(((t.data as JobType[]) || []).map((x) => [x.key, x.label])));
      setProfiles(await fetchProfileMap(rows.map((r) => r.user_id)));
      setLoading(false);
    })();
  }, [range]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    return jobs.filter((j) => (type === 'all' || j.job_type === type)
      && (status === 'all' || j.status === status)
      && (!q || [profiles[j.user_id]?.full_name, profiles[j.user_id]?.email].some((v) => v?.toLocaleLowerCase('tr').includes(q))));
  }, [jobs, type, status, search, profiles]);

  const stats = useMemo(() => {
    const byType: Record<string, { count: number; credits: number }> = {};
    const byUser: Record<string, { count: number; credits: number }> = {};
    const byDay: Record<string, number> = {};
    let credits = 0;
    let failed = 0;
    for (const j of filtered) {
      byType[j.job_type] = byType[j.job_type] || { count: 0, credits: 0 };
      byType[j.job_type].count += j.quantity;
      byType[j.job_type].credits += j.credits_used;
      byUser[j.user_id] = byUser[j.user_id] || { count: 0, credits: 0 };
      byUser[j.user_id].count += j.quantity;
      byUser[j.user_id].credits += j.credits_used;
      const d = j.created_at.slice(0, 10);
      byDay[d] = (byDay[d] || 0) + j.quantity;
      credits += j.credits_used;
      if (j.status === 'failed') failed += 1;
    }
    const days = Math.min(Number(range), 90);
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
      return { label: `${d.slice(8)}.${d.slice(5, 7)}`, value: byDay[d] || 0 };
    });
    return {
      byType: Object.entries(byType).sort((a, b) => b[1].count - a[1].count),
      topUsers: Object.entries(byUser).sort((a, b) => b[1].count - a[1].count).slice(0, 8),
      series,
      credits,
      failed,
      users: Object.keys(byUser).length,
      total: filtered.reduce((s, j) => s + j.quantity, 0),
    };
  }, [filtered, range]);

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><PageHeader title="İş Üretimi" /><ErrorNote /></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader
        title="İş Üretimi"
        description="Masaüstü uygulamasında üretilen işler. Yalnızca iş türü ve kredi bilgisi tutulur; belge içeriği saklanmaz."
        actions={<button
          className="btn-secondary"
          onClick={() => downloadCsv(`faraklit-isler-${range}g.csv`, ['Tarih', 'Kullanıcı', 'E-posta', 'İş türü', 'Durum', 'Adet', 'Kredi', 'Platform', 'Sürüm'],
            filtered.map((j) => [formatDateTime(j.created_at), profiles[j.user_id]?.full_name, profiles[j.user_id]?.email, types[j.job_type] || j.job_type,
              j.status === 'completed' ? 'Tamamlandı' : 'Başarısız', j.quantity, j.credits_used, j.platform, j.app_version]))}
        ><Download size={15} />CSV indir</button>}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="input-field sm:w-40">
          <option value="7">Son 7 gün</option>
          <option value="30">Son 30 gün</option>
          <option value="90">Son 90 gün</option>
          <option value="365">Son 1 yıl</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input-field sm:w-56">
          <option value="all">Tüm iş türleri</option>
          {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | Job['status'])} className="input-field sm:w-40">
          <option value="all">Tüm durumlar</option>
          <option value="completed">Tamamlandı</option>
          <option value="failed">Başarısız</option>
        </select>
        <div className="relative flex-1 sm:max-w-[280px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kullanıcı ara…" className="input-field pl-9" />
        </div>
      </div>

      <MetricGrid>
        <Metric label="Üretilen iş" value={formatNumber(stats.total)} />
        <Metric label="Harcanan kredi" value={formatNumber(stats.credits)} />
        <Metric label="Aktif kullanıcı" value={formatNumber(stats.users)} />
        <Metric label="Başarısız" value={formatNumber(stats.failed)} highlight={stats.failed > 0} />
      </MetricGrid>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-[15px] font-semibold text-ink-900">Günlük iş sayısı</h2>
          <BarChart data={stats.series} format={(v) => `${formatNumber(v)} iş`} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink-900">İş türleri</h2>
          {stats.byType.length === 0
            ? <p className="text-[14px] text-ink-400">Kayıt yok.</p>
            : <ShareBars rows={stats.byType.map(([k, v]) => ({ label: types[k] || k, value: v.count, sub: `${formatNumber(v.credits)} kr.` }))} format={formatNumber} />}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">En çok üretenler</h2>
          <Table head={['Kullanıcı', 'İş', 'Kredi']} empty={stats.topUsers.length === 0}>
            {stats.topUsers.map(([uid, v]) => (
              <tr key={uid}>
                <Td><Link to={`/admin/users/${uid}`} className="hover:underline">{profiles[uid]?.full_name || profiles[uid]?.email || '—'}</Link></Td>
                <Td>{formatNumber(v.count)}</Td>
                <Td>{formatNumber(v.credits)}</Td>
              </tr>
            ))}
          </Table>
        </div>
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Son işler</h2>
          <Table head={['Tarih', 'Kullanıcı', 'İş türü', 'Durum', 'Adet', 'Kredi']} empty={filtered.length === 0}>
            {filtered.slice(0, visible).map((j) => (
              <tr key={j.id}>
                <Td className="text-ink-500">{formatDateTime(j.created_at)}</Td>
                <Td><Link to={`/admin/users/${j.user_id}`} className="hover:underline">{profiles[j.user_id]?.full_name || profiles[j.user_id]?.email || '—'}</Link></Td>
                <Td>{types[j.job_type] || j.job_type}</Td>
                <Td>{j.status === 'completed' ? <Badge tone="green">Tamamlandı</Badge> : <Badge tone="red">Başarısız</Badge>}</Td>
                <Td>{j.quantity}</Td>
                <Td>{formatNumber(j.credits_used)}</Td>
              </tr>
            ))}
          </Table>
          {filtered.length > visible && (
            <button onClick={() => setVisible((v) => v + 100)} className="btn-secondary mt-3 w-full">
              Daha fazla göster ({formatNumber(filtered.length - visible)} kayıt daha)
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
