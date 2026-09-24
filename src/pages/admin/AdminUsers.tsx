import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge, ErrorNote, Loading, Metric, MetricGrid, PageHeader, Table, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatNumber, formatPrice, formatShortDate } from '@/lib/format';
import { effectiveLicenseStatus, licenseStatusLabel } from '@/lib/labels';
import { downloadCsv } from '@/lib/documents';
import type { AdminUserRow } from '@/types';

type Filter = 'all' | 'active' | 'expired' | 'no_license' | 'pending' | 'low_credit' | 'individual' | 'organization';
type Sort = 'created' | 'jobs' | 'credits' | 'paid' | 'activity';

export function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('created');

  useEffect(() => {
    supabase.rpc('admin_user_overview').then(({ data, error: err }) => {
      if (err) setError(true);
      else setUsers((data as AdminUserRow[]) || []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    const rows = users.filter((u) => {
      if (q && ![u.full_name, u.email, u.organization_name, u.phone, u.bar_association]
        .some((v) => v?.toLocaleLowerCase('tr').includes(q))) return false;
      const status = effectiveLicenseStatus(u.license_status, u.license_ends_at);
      switch (filter) {
        case 'active': return status === 'active';
        case 'expired': return status === 'expired' || status === 'cancelled' || status === 'suspended';
        case 'no_license': return !status;
        case 'pending': return u.pending_orders > 0;
        case 'low_credit': return status === 'active' && u.credit_balance < 50;
        case 'individual': return u.account_type === 'individual';
        case 'organization': return u.account_type === 'organization';
        default: return true;
      }
    });
    const key: Record<Sort, (u: AdminUserRow) => number> = {
      created: (u) => new Date(u.created_at).getTime(),
      jobs: (u) => u.jobs_30d,
      credits: (u) => u.credit_balance,
      paid: (u) => u.total_paid_cents,
      activity: (u) => (u.last_activity ? new Date(u.last_activity).getTime() : 0),
    };
    return [...rows].sort((a, b) => key[sort](b) - key[sort](a));
  }, [users, search, filter, sort]);

  const totals = useMemo(() => ({
    active: users.filter((u) => effectiveLicenseStatus(u.license_status, u.license_ends_at) === 'active').length,
    credits: users.reduce((s, u) => s + u.credit_balance, 0),
    jobs30: users.reduce((s, u) => s + u.jobs_30d, 0),
    paid: users.reduce((s, u) => s + Number(u.total_paid_cents), 0),
  }), [users]);

  const exportCsv = () => {
    downloadCsv(`faraklit-kullanicilar-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Ad Soyad', 'E-posta', 'Telefon', 'Hesap', 'Büro', 'Paket', 'Lisans', 'Lisans Bitiş', 'Aktif Cihaz', 'Kredi', 'Harcanan Kredi', 'İş (30g)', 'İş (toplam)', 'Toplam Ödeme (TL)', 'Kayıt', 'Son Aktivite'],
      filtered.map((u) => [
        u.full_name, u.email, u.phone, u.account_type === 'organization' ? 'Kurumsal' : 'Bireysel', u.organization_name,
        u.plan_name, u.license_status ? licenseStatusLabel[effectiveLicenseStatus(u.license_status, u.license_ends_at)!].label : '',
        u.license_ends_at ? formatShortDate(u.license_ends_at) : '', u.active_devices, u.credit_balance, u.credits_spent,
        u.jobs_30d, u.jobs_total, (Number(u.total_paid_cents) / 100).toFixed(2).replace('.', ','),
        formatShortDate(u.created_at), u.last_activity ? formatShortDate(u.last_activity) : '',
      ]));
  };

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><PageHeader title="Kullanıcılar" /><ErrorNote /></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader
        title="Kullanıcılar"
        description="Tüm kullanıcıların lisans, kredi, iş üretimi ve ödeme bilgileri."
        actions={<button onClick={exportCsv} className="btn-secondary"><Download size={15} />CSV indir</button>}
      />

      <MetricGrid>
        <Metric label="Kullanıcı" value={formatNumber(users.length)} hint={`${formatNumber(totals.active)} aktif lisans`} />
        <Metric label="Toplam kredi bakiyesi" value={formatNumber(totals.credits)} />
        <Metric label="Son 30 gün iş" value={formatNumber(totals.jobs30)} />
        <Metric label="Toplam tahsilat" value={formatPrice(totals.paid)} />
      </MetricGrid>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[340px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad, e-posta, büro, baro ara…" className="input-field pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="input-field sm:w-52">
          <option value="all">Tümü</option>
          <option value="active">Aktif lisans</option>
          <option value="expired">Süresi dolmuş / askıda</option>
          <option value="no_license">Lisanssız</option>
          <option value="pending">Bekleyen siparişi olan</option>
          <option value="low_credit">Kredisi azalan (&lt; 50)</option>
          <option value="individual">Bireysel</option>
          <option value="organization">Kurumsal</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input-field sm:w-52">
          <option value="created">Sırala: Kayıt tarihi</option>
          <option value="activity">Sırala: Son aktivite</option>
          <option value="jobs">Sırala: İş (30 gün)</option>
          <option value="credits">Sırala: Kredi bakiyesi</option>
          <option value="paid">Sırala: Toplam ödeme</option>
        </select>
        <span className="text-[14px] text-ink-400 sm:ml-auto">{formatNumber(filtered.length)} kayıt</span>
      </div>

      <div className="mt-4">
        <Table head={['Kullanıcı', 'Paket', 'Lisans', 'Bitiş', 'Kredi', 'İş (30g / toplam)', 'Ödeme', 'Cihaz', 'Son aktivite']} empty={filtered.length === 0}>
          {filtered.map((u) => {
            const status = effectiveLicenseStatus(u.license_status, u.license_ends_at);
            return (
              <tr key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)} className="cursor-pointer transition-colors hover:bg-ink-50">
                <Td>
                  <p className="font-medium text-ink-900">{u.full_name || '—'}</p>
                  <p className="text-[13px] text-ink-400">{u.email}{u.organization_name ? ` · ${u.organization_name}` : ''}</p>
                </Td>
                <Td>{u.plan_name || '—'}</Td>
                <Td>{status ? <Badge tone={licenseStatusLabel[status].tone}>{licenseStatusLabel[status].label}</Badge> : <span className="text-ink-400">Yok</span>}</Td>
                <Td className="text-ink-500">{u.license_ends_at ? formatShortDate(u.license_ends_at) : '—'}</Td>
                <Td className={u.credit_balance < 50 && status === 'active' ? 'font-medium text-amber-700' : ''}>{formatNumber(u.credit_balance)}</Td>
                <Td>{formatNumber(u.jobs_30d)} <span className="text-ink-400">/ {formatNumber(u.jobs_total)}</span></Td>
                <Td>
                  {formatPrice(Number(u.total_paid_cents))}
                  {u.pending_orders > 0 && <span className="ml-2"><Badge tone="amber">{u.pending_orders} bekliyor</Badge></span>}
                </Td>
                <Td>{u.active_devices}</Td>
                <Td className="text-ink-500">{u.last_activity ? formatShortDate(u.last_activity) : '—'}</Td>
              </tr>
            );
          })}
        </Table>
      </div>
    </AdminLayout>
  );
}
