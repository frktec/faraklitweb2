import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '@/components/account/AccountLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import type { License } from '@/types';

export function LicensePage() {
  const { profile } = useAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    supabase
      .from('licenses')
      .select('*, plan:plans(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setLicense(data as License | null);
        setLoading(false);
      });
  }, [profile]);

  if (loading) {
    return <AccountLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AccountLayout>;
  }

  if (!license) {
    return (
      <AccountLayout>
        <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Lisansım</h1>
        <div className="mt-8 rounded-[10px] border border-ink-200 bg-white p-8 text-center">
          <p className="text-[16px] text-ink-500 mb-4">Aktif lisansınız bulunmuyor.</p>
          <Link to="/pricing" className="btn-primary">Paket Satın Al</Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Lisansım</h1>

      <div className="mt-8">
        <div className="divide-y divide-ink-200 border-y border-ink-200">
          <Row label="Paket" value={license.plan?.name || ''} />
          <Row label="Durum" value={license.status === 'active' ? 'Aktif' : license.status} status={license.status} />
          <Row label="Başlangıç Tarihi" value={formatDate(license.started_at)} />
          <Row label="Bitiş Tarihi" value={formatDate(license.ends_at)} />
          <Row label="Kullanıcı Sayısı" value={`${license.plan?.user_limit || 1} kullanıcı`} />
          <Row label="Cihaz Sayısı" value={`${license.device_count} / ${license.plan?.device_limit || 1}`} />
          <Row label="Depolama" value={`${license.plan?.storage_gb || 0} GB`} />
          <Row label="Lisans Anahtarı" value={license.license_key} mono />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={`/checkout?plan=${license.plan_id}`} className="btn-primary">Lisans Yenile</Link>
        <Link to="/pricing" className="btn-secondary">Paket Yükselt</Link>
        <Link to="/account/billing" className="btn-secondary">Fatura Görüntüle</Link>
        <Link to="/account/devices" className="btn-secondary">Cihaz Yönet</Link>
      </div>
    </AccountLayout>
  );
}

function Row({ label, value, status, mono }: { label: string; value: string; status?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[16px] text-ink-500">{label}</span>
      <div className="flex items-center gap-2">
        {status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        {status === 'suspended' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
        {status === 'expired' && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
        <span className={`text-[16px] font-medium text-ink-800 ${mono ? 'font-mono text-[14px]' : ''}`}>{value}</span>
      </div>
    </div>
  );
}
