import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatShortDate } from '@/lib/format';
import type { AppVersion } from '@/types';

export function AdminVersions() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version: '',
    platform: 'windows',
    min_supported_version: '',
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    const { data, error: err } = await supabase.from('app_versions').select('*').order('release_date', { ascending: false });
    if (err) {
      setError(true);
    } else {
      setVersions((data as AppVersion[]) || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('app_versions').insert({
      version: newVersion.version,
      platform: newVersion.platform,
      min_supported_version: newVersion.min_supported_version,
      is_latest: true,
    });

    // Audit log
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    if (adminId) {
      await supabase.from('admin_audit_logs').insert({
        admin_id: adminId,
        action: 'application.updated',
        details: `New version ${newVersion.version} (${newVersion.platform}) added`,
      });
    }

    setShowForm(false);
    setNewVersion({ version: '', platform: 'windows', min_supported_version: '' });
    fetchVersions();
  };

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Uygulama Sürümleri</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Uygulama Sürümleri</h1>
          <p className="mt-1 text-[16px] text-ink-500">Masaüstü uygulaması sürüm takibi.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={15} />
          Yeni Sürüm
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-6 card p-5 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label-field">Versiyon</label>
              <input type="text" required value={newVersion.version} onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })} className="input-field" placeholder="1.4.3" />
            </div>
            <div>
              <label className="label-field">Platform</label>
              <select value={newVersion.platform} onChange={(e) => setNewVersion({ ...newVersion, platform: e.target.value })} className="input-field">
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
              </select>
            </div>
            <div>
              <label className="label-field">Min. Desteklenen</label>
              <input type="text" value={newVersion.min_supported_version} onChange={(e) => setNewVersion({ ...newVersion, min_supported_version: e.target.value })} className="input-field" placeholder="1.3.0" />
            </div>
          </div>
          <button type="submit" className="btn-primary">Ekle</button>
        </form>
      )}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-200 text-left">
              <Th>Versiyon</Th>
              <Th>Platform</Th>
              <Th>Yayın Tarihi</Th>
              <Th>Min. Desteklenen</Th>
              <Th>Aktif Cihaz</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {versions.map((v) => (
              <tr key={v.id} className="text-[15px]">
                <td className="py-3 pr-4 font-medium text-ink-800">
                  Faraklit {v.version}
                  {v.is_latest && <span className="ml-2 rounded-[5px] bg-emerald-50 px-2 py-0.5 text-[13px] text-emerald-700">Güncel</span>}
                </td>
                <td className="py-3 pr-4 text-ink-600">{v.platform === 'windows' ? 'Windows' : v.platform === 'macos' ? 'macOS' : 'Linux'}</td>
                <td className="py-3 pr-4 text-ink-500">{formatShortDate(v.release_date)}</td>
                <td className="py-3 pr-4 text-ink-500">{v.min_supported_version || '—'}</td>
                <td className="py-3 pr-4 text-ink-600">{v.active_user_count} cihaz</td>
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
