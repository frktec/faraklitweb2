import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';

type Analytics = {
  dau: number;
  wau: number;
  mau: number;
  moduleUsage: { event_name: string; count: number }[];
  platformDistribution: { platform: string; count: number }[];
};

const moduleLabels: Record<string, string> = {
  'feature.precedent_search.opened': 'İçtihat',
  'feature.petition.opened': 'Dilekçe',
  'feature.document_analysis.opened': 'Belge Analizi',
  'feature.uets.opened': 'UETS',
  'feature.official_gazette.opened': 'Resmi Gazete',
  'feature.files.opened': 'Dosyalar',
  'feature.workspace.opened': 'Workspace',
};

export function AdminAnalytics() {
  const [data, setData] = useState<Analytics>({
    dau: 0, wau: 0, mau: 0,
    moduleUsage: [],
    platformDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const now = Date.now();
        const dayAgo = new Date(now - 86400000).toISOString();
        const weekAgo = new Date(now - 7 * 86400000).toISOString();
        const monthAgo = new Date(now - 30 * 86400000).toISOString();

        const [dauRes, wauRes, mauRes] = await Promise.all([
          supabase.from('activity_events').select('user_id', { count: 'exact', head: true }).gte('created_at', dayAgo),
          supabase.from('activity_events').select('user_id', { count: 'exact', head: true }).gte('created_at', weekAgo),
          supabase.from('activity_events').select('user_id', { count: 'exact', head: true }).gte('created_at', monthAgo),
        ]);

        if (dauRes.error || wauRes.error || mauRes.error) throw new Error();

        const { data: moduleData, error: modErr } = await supabase
          .from('activity_events')
          .select('event_name')
          .like('event_name', 'feature.%')
          .gte('created_at', monthAgo);

        if (modErr) throw modErr;

        const moduleCounts: Record<string, number> = {};
        (moduleData || []).forEach((r: { event_name: string }) => {
          moduleCounts[r.event_name] = (moduleCounts[r.event_name] || 0) + 1;
        });
        const moduleUsage = Object.entries(moduleCounts)
          .map(([event_name, count]) => ({ event_name, count }))
          .sort((a, b) => b.count - a.count);

        const { data: platformData, error: platErr } = await supabase
          .from('activity_events')
          .select('platform')
          .not('platform', 'eq', '');

        if (platErr) throw platErr;

        const platformCounts: Record<string, number> = {};
        (platformData || []).forEach((r: { platform: string }) => {
          if (r.platform) platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1;
        });
        const platformDistribution = Object.entries(platformCounts)
          .map(([platform, count]) => ({ platform, count }))
          .sort((a, b) => b.count - a.count);

        setData({ dau: dauRes.count || 0, wau: wauRes.count || 0, mau: mauRes.count || 0, moduleUsage, platformDistribution });
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
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Analitik</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  const totalModule = data.moduleUsage.reduce((s, m) => s + m.count, 0) || 1;
  const totalPlatform = data.platformDistribution.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Analitik</h1>
      <p className="mt-1 text-[16px] text-ink-500">Ürün kullanım metrikleri.</p>

      {/* Active users */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <MetricCard label="Günlük Aktif" value={data.dau.toString()} />
        <MetricCard label="Haftalık Aktif" value={data.wau.toString()} />
        <MetricCard label="Aylık Aktif" value={data.mau.toString()} />
      </div>

      {/* Module usage */}
      <div className="mt-10">
        <h2 className="mb-4 text-[16px] font-semibold text-ink-900">En Çok Kullanılan Modüller</h2>
        <div className="space-y-3">
          {data.moduleUsage.length === 0 ? (
            <p className="text-[15px] text-ink-400">Veri bulunmuyor.</p>
          ) : (
            data.moduleUsage.map((m) => (
              <div key={m.event_name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[15px] font-medium text-ink-700">
                    {moduleLabels[m.event_name] || m.event_name}
                  </span>
                  <span className="text-[15px] text-ink-500">{m.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-100">
                  <div
                    className="h-1.5 rounded-full bg-ink-800"
                    style={{ width: `${(m.count / totalModule) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Platform distribution */}
      <div className="mt-10">
        <h2 className="mb-4 text-[16px] font-semibold text-ink-900">Platform Dağılımı</h2>
        <div className="space-y-3">
          {data.platformDistribution.map((p) => (
            <div key={p.platform}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[15px] font-medium text-ink-700">
                  {p.platform === 'windows' ? 'Windows' : p.platform === 'macos' ? 'macOS' : p.platform}
                </span>
                <span className="text-[15px] text-ink-500">
                  {p.count} ({Math.round((p.count / totalPlatform) * 100)}%)
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-100">
                <div
                  className="h-1.5 rounded-full bg-ink-800"
                  style={{ width: `${(p.count / totalPlatform) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-ink-200 bg-white p-5">
      <p className="text-[14px] font-medium uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-2 text-[24px] font-semibold tracking-tight text-ink-950">{value}</p>
    </div>
  );
}
