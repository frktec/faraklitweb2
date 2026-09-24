import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatShortDate } from '@/lib/format';

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  account_type: string;
  role: string;
};

type UserWithLicense = UserRow & {
  plan_name: string | null;
  license_status: string | null;
  license_ends_at: string | null;
  device_count: number;
  last_activity: string | null;
};

export function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithLicense[]>([]);
  const [filtered, setFiltered] = useState<UserWithLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      try {
        const { data: profiles, error: err } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;

        const profileRows = (profiles as UserRow[]) || [];

        const enriched: UserWithLicense[] = await Promise.all(
          profileRows.map(async (p) => {
            const { data: lic } = await supabase
              .from('licenses')
              .select('status, ends_at, plan:plans(name)')
              .eq('user_id', p.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const { count: deviceCount } = await supabase
              .from('devices')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', p.id)
              .eq('is_active', true);

            const { data: activity } = await supabase
              .from('activity_events')
              .select('created_at')
              .eq('user_id', p.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const licData = lic as { status: string; ends_at: string; plan: { name: string } } | null;
            return {
              ...p,
              plan_name: licData?.plan?.name || null,
              license_status: licData?.status || null,
              license_ends_at: licData?.ends_at || null,
              device_count: deviceCount || 0,
              last_activity: activity?.created_at || null,
            };
          })
        );

        setUsers(enriched);
        setFiltered(enriched);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    if (filter !== 'all') {
      if (filter === 'active') result = result.filter((u) => u.license_status === 'active');
      else if (filter === 'expired') result = result.filter((u) => u.license_status === 'expired');
      else if (filter === 'individual') result = result.filter((u) => u.account_type === 'individual');
      else if (filter === 'organization') result = result.filter((u) => u.account_type === 'organization');
    }
    setFiltered(result);
  }, [search, filter, users]);

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Kullanıcılar</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Kullanıcılar</h1>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, e-posta ara…"
            className="input-field pl-9"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field sm:w-44">
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="expired">Süresi Dolmuş</option>
          <option value="individual">Bireysel</option>
          <option value="organization">Kurumsal</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-200 text-left">
              <Th>Ad Soyad</Th>
              <Th>E-posta</Th>
              <Th>Paket</Th>
              <Th>Durum</Th>
              <Th>Kayıt</Th>
              <Th>Son Aktivite</Th>
              <Th>Lisans Bitiş</Th>
              <Th>Cihaz</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((u) => (
              <tr
                key={u.id}
                onClick={() => navigate(`/admin/users/${u.id}`)}
                className="cursor-pointer text-[15px] transition-colors hover:bg-ink-50"
              >
                <td className="py-3 pr-4 font-medium text-ink-800">{u.full_name || '—'}</td>
                <td className="py-3 pr-4 text-ink-600">{u.email}</td>
                <td className="py-3 pr-4 text-ink-600">{u.plan_name || '—'}</td>
                <td className="py-3 pr-4">
                  {u.license_status ? (
                    <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${
                      u.license_status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      u.license_status === 'expired' ? 'bg-red-50 text-red-700' :
                      'bg-ink-100 text-ink-600'
                    }`}>
                      {u.license_status === 'active' ? 'Aktif' : u.license_status === 'expired' ? 'Süresi Dolmuş' : u.license_status}
                    </span>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-ink-500">{formatShortDate(u.created_at)}</td>
                <td className="py-3 pr-4 text-ink-500">{u.last_activity ? formatShortDate(u.last_activity) : '—'}</td>
                <td className="py-3 pr-4 text-ink-500">{u.license_ends_at ? formatShortDate(u.license_ends_at) : '—'}</td>
                <td className="py-3 pr-4 text-ink-600">{u.device_count}</td>
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
