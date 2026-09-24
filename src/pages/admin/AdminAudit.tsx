import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ErrorNote, Loading, PageHeader, Table, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { fetchProfileMap, type ProfileSummary } from '@/lib/profiles';
import { formatDateTime } from '@/lib/format';
import type { AdminAuditLog } from '@/types';

export function AdminAudit() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(1000);
      if (err) { setError(true); setLoading(false); return; }
      const rows = (data as AdminAuditLog[]) || [];
      setLogs(rows);
      setProfiles(await fetchProfileMap(rows.flatMap((r) => [r.admin_id, r.target_user_id])));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    if (!q) return logs;
    return logs.filter((l) => [l.action, l.details, profiles[l.admin_id]?.full_name, profiles[l.target_user_id || '']?.full_name, profiles[l.target_user_id || '']?.email]
      .some((v) => v?.toLocaleLowerCase('tr').includes(q)));
  }, [logs, profiles, search]);

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><PageHeader title="Denetim Kaydı" /><ErrorNote /></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader title="Denetim Kaydı" description="Yöneticilerin yaptığı tüm işlemler. Kayıtlar değiştirilemez ve silinemez." />
      <div className="relative mb-4 max-w-[340px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İşlem, yönetici veya kullanıcı ara…" className="input-field pl-9" />
      </div>
      <Table head={['Tarih', 'Yönetici', 'İşlem', 'Kullanıcı', 'Ayrıntı']} empty={filtered.length === 0}>
        {filtered.map((l) => (
          <tr key={l.id}>
            <Td className="text-ink-500">{formatDateTime(l.created_at)}</Td>
            <Td>{profiles[l.admin_id]?.full_name || profiles[l.admin_id]?.email || '—'}</Td>
            <Td mono>{l.action}</Td>
            <Td>
              {l.target_user_id
                ? <Link to={`/admin/users/${l.target_user_id}`} className="hover:underline">{profiles[l.target_user_id]?.full_name || profiles[l.target_user_id]?.email || '—'}</Link>
                : '—'}
            </Td>
            <Td className="max-w-[420px] whitespace-normal">{l.details || '—'}</Td>
          </tr>
        ))}
      </Table>
    </AdminLayout>
  );
}
