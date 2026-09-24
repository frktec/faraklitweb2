import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';

type ActivityRow = {
  id: string;
  event_name: string;
  app_version: string;
  platform: string;
  created_at: string;
  user: { full_name: string; email: string };
};

const eventLabels: Record<string, string> = {
  'user.login': 'Kullanıcı giriş yaptı',
  'user.logout': 'Kullanıcı çıkış yaptı',
  'license.verified': 'Lisans doğrulandı',
  'device.registered': 'Yeni cihaz kaydedildi',
  'feature.precedent_search.opened': 'İçtihat arama modülü açıldı',
  'feature.petition.opened': 'Dilekçe modülü açıldı',
  'feature.document_analysis.opened': 'Belge analizi modülü açıldı',
  'feature.uets.opened': 'UETS modülü açıldı',
  'feature.official_gazette.opened': 'Resmî Gazete modülü açıldı',
  'subscription.created': 'Abonelik oluşturuldu',
  'payment.completed': 'Ödeme tamamlandı',
  'application.updated': 'Uygulama güncellendi',
};

export function AdminActivity() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from('activity_events')
      .select('id, event_name, app_version, platform, created_at, user:profiles!activity_events_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (err) {
          setError(true);
        } else {
          setActivities((data as unknown as ActivityRow[]) || []);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Aktiviteler</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Aktiviteler</h1>
      <p className="mt-1 text-[16px] text-ink-500">
        Kullanıcı aktivite kayıtları. Yalnızca hangi özelliğin kullanıldığı bilgisi tutulur.
      </p>

      <div className="mt-8">
        {activities.length === 0 ? (
          <p className="text-[15px] text-ink-400">Aktivite kaydı bulunmuyor.</p>
        ) : (
          <div className="divide-y divide-ink-200 border-y border-ink-200">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-[15px] font-medium text-ink-800">{a.user?.full_name || 'Bilinmeyen'}</p>
                  <p className="text-[14px] text-ink-500">
                    {eventLabels[a.event_name] || a.event_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] text-ink-400">{formatDateTime(a.created_at)}</p>
                  {a.platform && (
                    <p className="text-[13px] text-ink-400">
                      {a.platform === 'windows' ? 'Windows Desktop' : a.platform === 'macos' ? 'macOS' : a.platform}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
