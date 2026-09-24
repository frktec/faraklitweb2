import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Profile, License, Device, ActivityEvent } from '@/types';

export function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
        if (profErr) throw profErr;
        setProfile(prof as Profile | null);

        const { data: lic, error: licErr } = await supabase
          .from('licenses').select('*, plan:plans(*)').eq('user_id', id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (licErr) throw licErr;
        setLicense(lic as License | null);

        const { data: devs, error: devsErr } = await supabase.from('devices').select('*').eq('user_id', id);
        if (devsErr) throw devsErr;
        setDevices((devs as Device[]) || []);

        const { data: acts, error: actsErr } = await supabase.from('activity_events').select('*').eq('user_id', id)
          .order('created_at', { ascending: false }).limit(10);
        if (actsErr) throw actsErr;
        setActivities((acts as ActivityEvent[]) || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAction = async (action: string) => {
    if (!confirmAction) return;
    if (!id) return;

    if (action === 'suspend') {
      await supabase.from('licenses').update({ status: 'suspended' }).eq('user_id', id);
    } else if (action === 'extend') {
      if (license) {
        const newEnd = new Date(license.ends_at);
        newEnd.setFullYear(newEnd.getFullYear() + 1);
        await supabase.from('licenses').update({ ends_at: newEnd.toISOString() }).eq('id', license.id);
      }
    } else if (action === 'revoke_device') {
      await supabase.from('devices').update({ is_active: false }).eq('user_id', id);
    }

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: (await supabase.auth.getUser()).data.user?.id,
      action,
      target_user_id: id,
      details: `${action} executed on user ${profile?.email}`,
    });

    setConfirmAction(null);
    navigate(0);
  };

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error || !profile) {
    return <AdminLayout><p className="text-sm text-ink-400">Kullanıcı bulunamadı veya veriler yüklenemedi.</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <button onClick={() => navigate('/admin/users')} className="text-link mb-6">
        <ArrowLeft size={15} />
        Kullanıcılara Dön
      </button>

      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">{profile.full_name}</h1>
      <p className="mt-1 text-[16px] text-ink-500">{profile.email}</p>

      {/* User info */}
      <div className="mt-8">
        <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Kullanıcı Bilgileri</h2>
        <div className="divide-y divide-ink-200 border-y border-ink-200">
          <InfoRow label="E-posta" value={profile.email} />
          <InfoRow label="Telefon" value={profile.phone || '—'} />
          <InfoRow label="Hesap Tipi" value={profile.account_type === 'individual' ? 'Bireysel' : 'Kurumsal'} />
          <InfoRow label="Rol" value={profile.role === 'admin' ? 'Admin' : 'Kullanıcı'} />
          <InfoRow label="Baro" value={profile.bar_association || '—'} />
          <InfoRow label="Baro Sicil No" value={profile.bar_registry_number || '—'} />
          <InfoRow label="Kayıt Tarihi" value={formatDate(profile.created_at)} />
        </div>
      </div>

      {/* License info */}
      {license && (
        <div className="mt-8">
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Lisans</h2>
          <div className="divide-y divide-ink-200 border-y border-ink-200">
            <InfoRow label="Paket" value={license.plan?.name || '—'} />
            <InfoRow label="Durum" value={license.status} />
            <InfoRow label="Başlangıç" value={formatDate(license.started_at)} />
            <InfoRow label="Bitiş" value={formatDate(license.ends_at)} />
            <InfoRow label="Lisans Anahtarı" value={license.license_key} mono />
          </div>
        </div>
      )}

      {/* Devices */}
      {devices.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Cihazlar</h2>
          <div className="divide-y divide-ink-200 border-y border-ink-200">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[15px] font-medium text-ink-800">{d.device_name}</p>
                  <p className="text-[14px] text-ink-400">{d.platform} · {d.app_version || '—'}</p>
                </div>
                <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${d.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
                  {d.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {activities.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Son Aktiviteler</h2>
          <div className="divide-y divide-ink-200 border-y border-ink-200">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <span className="text-[15px] text-ink-700">{a.event_name}</span>
                <span className="text-[14px] text-ink-400">{formatDateTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions */}
      <div className="mt-8">
        <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Admin İşlemleri</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setConfirmAction('extend')} className="btn-secondary">Lisans Uzat</button>
          <button onClick={() => setConfirmAction('suspend')} className="btn-secondary">Lisans Askıya Al</button>
          <button onClick={() => setConfirmAction('revoke_device')} className="btn-secondary">Cihaz Yetkisini Kaldır</button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-[400px] rounded-[12px] border border-ink-200 bg-white p-6">
            <h3 className="text-[16px] font-semibold text-ink-950">Onay</h3>
            <p className="mt-2 text-[16px] text-ink-500">
              Bu işlemi gerçekleştirmek istediğinize emin misiniz?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} className="btn-secondary">İptal</button>
              <button onClick={() => handleAction(confirmAction)} className="btn-primary">Onayla</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[16px] text-ink-500">{label}</span>
      <span className={`text-[16px] font-medium text-ink-800 ${mono ? 'font-mono text-[14px]' : ''}`}>{value}</span>
    </div>
  );
}
