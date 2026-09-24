import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatShortDate } from '@/lib/format';

type LicenseRow = {
  id: string;
  license_key: string;
  status: string;
  started_at: string;
  ends_at: string;
  device_count: number;
  plan: { name: string };
  user: { full_name: string; email: string };
};

export function AdminLicenses() {
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from('licenses')
      .select('id, license_key, status, started_at, ends_at, device_count, plan:plans(name), user:profiles!licenses_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError(true);
        } else {
          setLicenses((data as unknown as LicenseRow[]) || []);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Lisanslar</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Lisanslar</h1>
      <p className="mt-1 text-[16px] text-ink-500">Tüm lisansların merkezi yönetimi.</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-200 text-left">
              <Th>Lisans Anahtarı</Th>
              <Th>Kullanıcı</Th>
              <Th>Paket</Th>
              <Th>Durum</Th>
              <Th>Başlangıç</Th>
              <Th>Bitiş</Th>
              <Th>Cihaz</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {licenses.map((l) => (
              <tr key={l.id} className="text-[15px]">
                <td className="py-3 pr-4 font-mono text-[14px] text-ink-700">{l.license_key.substring(0, 20)}…</td>
                <td className="py-3 pr-4 font-medium text-ink-800">{l.user?.full_name || '—'}</td>
                <td className="py-3 pr-4 text-ink-600">{l.plan?.name || '—'}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${
                    l.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    l.status === 'suspended' ? 'bg-amber-50 text-amber-700' :
                    l.status === 'expired' ? 'bg-red-50 text-red-700' :
                    'bg-ink-100 text-ink-600'
                  }`}>
                    {l.status === 'active' ? 'Aktif' : l.status === 'suspended' ? 'Askıda' : l.status === 'expired' ? 'Süresi Dolmuş' : 'İptal'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-ink-500">{formatShortDate(l.started_at)}</td>
                <td className="py-3 pr-4 text-ink-500">{formatShortDate(l.ends_at)}</td>
                <td className="py-3 pr-4 text-ink-600">{l.device_count}</td>
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
