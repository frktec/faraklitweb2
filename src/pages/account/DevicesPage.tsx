import { useEffect, useState } from 'react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import type { Device, License } from '@/types';

export function DevicesPage() {
  const { profile } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    if (!profile) { setLoading(false); return; }
    const { data: dev } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setDevices((dev as Device[]) || []);

    const { data: lic } = await supabase
      .from('licenses')
      .select('*, plan:plans(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLicense(lic as License | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, [profile]);

  const handleRevoke = async (deviceId: string) => {
    if (!confirm('Bu cihazın yetkisini kaldırmak istediğinize emin misiniz?')) return;
    await supabase.from('devices').update({ is_active: false }).eq('id', deviceId);
    fetchDevices();
  };

  if (loading) {
    return <AccountLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AccountLayout>;
  }

  const deviceLimit = license?.plan?.device_limit || 0;

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Cihazlar</h1>
      <p className="mt-1 text-[16px] text-ink-500">
        Lisansınızla ilişkili cihazları yönetin. {devices.filter(d => d.is_active).length} / {deviceLimit} cihaz kullanılıyor.
      </p>

      <div className="mt-8">
        {devices.length === 0 ? (
          <div className="rounded-[10px] border border-ink-200 bg-white p-8 text-center">
            <p className="text-[16px] text-ink-500">Kayıtlı cihaz bulunmuyor.</p>
            <p className="text-[15px] text-ink-400 mt-1">Faraklit masaüstü uygulamasını indirip giriş yaptığınızda cihazınız otomatik kaydedilir.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-200 border-y border-ink-200">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-[16px] font-medium text-ink-800">{d.device_name}</p>
                  <p className="text-[14px] text-ink-400">
                    {d.platform === 'windows' ? 'Windows' : d.platform === 'macos' ? 'macOS' : 'Linux'}
                    {d.app_version && ` · v${d.app_version}`}
                    {' · Son kullanım: ' + formatDateTime(d.last_seen_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {d.is_active ? (
                    <span className="rounded-[5px] bg-emerald-50 px-2 py-0.5 text-[13px] text-emerald-700">Aktif</span>
                  ) : (
                    <span className="rounded-[5px] bg-ink-100 px-2 py-0.5 text-[13px] text-ink-500">Pasif</span>
                  )}
                  {d.is_active && (
                    <button
                      onClick={() => handleRevoke(d.id)}
                      className="text-[14px] font-medium text-red-600 hover:text-red-700"
                    >
                      Yetkiyi Kaldır
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
