import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge, ErrorNote, Loading, Metric, MetricGrid, PageHeader, Table, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { fetchProfileMap, type ProfileSummary } from '@/lib/profiles';
import { daysUntil, formatNumber, formatShortDate } from '@/lib/format';
import { effectiveLicenseStatus, licenseStatusLabel } from '@/lib/labels';
import type { License } from '@/types';

type LicenseRow = Pick<License, 'id' | 'user_id' | 'license_key' | 'status' | 'started_at' | 'ends_at' | 'device_count'> & { plan: { name: string } | null };
type Filter = 'all' | 'active' | 'expiring' | 'expired' | 'suspended';

export function AdminLicenses() {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from('licenses')
        .select('id, user_id, license_key, status, started_at, ends_at, device_count, plan:plans(name)')
        .order('ends_at', { ascending: true });
      if (err) { setError(true); setLoading(false); return; }
      const rows = (data as unknown as LicenseRow[]) || [];
      setLicenses(rows);
      setProfiles(await fetchProfileMap(rows.map((r) => r.user_id)));
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => licenses.map((l) => ({ ...l, effective: effectiveLicenseStatus(l.status, l.ends_at)!, days: daysUntil(l.ends_at) })), [licenses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    return rows.filter((l) => {
      if (filter === 'active' && l.effective !== 'active') return false;
      if (filter === 'expiring' && !(l.effective === 'active' && l.days <= 30)) return false;
      if (filter === 'expired' && l.effective !== 'expired') return false;
      if (filter === 'suspended' && l.effective !== 'suspended' && l.effective !== 'cancelled') return false;
      if (q && ![profiles[l.user_id]?.full_name, profiles[l.user_id]?.email, l.license_key, l.plan?.name].some((v) => v?.toLocaleLowerCase('tr').includes(q))) return false;
      return true;
    });
  }, [rows, filter, search, profiles]);

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><PageHeader title="Lisanslar" /><ErrorNote /></AdminLayout>;

  const count = (s: string) => rows.filter((l) => l.effective === s).length;

  return (
    <AdminLayout>
      <PageHeader title="Lisanslar" description="Tüm lisanslar. Süre uzatma, askıya alma ve manuel lisans için kullanıcıya tıklayın." />

      <MetricGrid>
        <Metric label="Aktif" value={formatNumber(count('active'))} />
        <Metric label="30 gün içinde bitecek" value={formatNumber(rows.filter((l) => l.effective === 'active' && l.days <= 30).length)} highlight />
        <Metric label="Süresi dolmuş" value={formatNumber(count('expired'))} />
        <Metric label="Askıda / iptal" value={formatNumber(count('suspended') + count('cancelled'))} />
      </MetricGrid>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kullanıcı, anahtar, paket ara…" className="input-field pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="input-field sm:w-52">
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="expiring">30 gün içinde bitecek</option>
          <option value="expired">Süresi dolmuş</option>
          <option value="suspended">Askıda / iptal</option>
        </select>
      </div>

      <div className="mt-4">
        <Table head={['Kullanıcı', 'Paket', 'Durum', 'Başlangıç', 'Bitiş', 'Kalan', 'Anahtar']} empty={filtered.length === 0}>
          {filtered.map((l) => (
            <tr key={l.id} onClick={() => navigate(`/admin/users/${l.user_id}`)} className="cursor-pointer hover:bg-ink-50">
              <Td>
                <p className="font-medium text-ink-900">{profiles[l.user_id]?.full_name || '—'}</p>
                <p className="text-[13px] text-ink-400">{profiles[l.user_id]?.email}</p>
              </Td>
              <Td>{l.plan?.name || '—'}</Td>
              <Td><Badge tone={licenseStatusLabel[l.effective].tone}>{licenseStatusLabel[l.effective].label}</Badge></Td>
              <Td className="text-ink-500">{formatShortDate(l.started_at)}</Td>
              <Td className="text-ink-500">{formatShortDate(l.ends_at)}</Td>
              <Td className={l.effective === 'active' && l.days <= 30 ? 'font-medium text-amber-700' : ''}>{l.days > 0 ? `${l.days} gün` : '—'}</Td>
              <Td mono>{l.license_key.slice(0, 12)}…</Td>
            </tr>
          ))}
        </Table>
      </div>
    </AdminLayout>
  );
}
