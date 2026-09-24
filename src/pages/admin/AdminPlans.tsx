import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Plan } from '@/types';

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Plan>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error: err } = await supabase.from('plans').select('*').order('sort_order');
    if (err) {
      setError(true);
    } else {
      setPlans((data as Plan[]) || []);
    }
    setLoading(false);
  };

  const startEdit = (plan: Plan) => {
    setEditing(plan.id);
    setEditValues({
      name: plan.name,
      price_cents: plan.price_cents,
      user_limit: plan.user_limit,
      device_limit: plan.device_limit,
      storage_gb: plan.storage_gb,
      is_active: plan.is_active,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase.from('plans').update({
      name: editValues.name,
      price_cents: editValues.price_cents,
      user_limit: editValues.user_limit,
      device_limit: editValues.device_limit,
      storage_gb: editValues.storage_gb,
      is_active: editValues.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', editing);

    // Audit log
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    if (adminId) {
      await supabase.from('admin_audit_logs').insert({
        admin_id: adminId,
        action: 'plan.updated',
        details: `Plan ${editValues.name} updated`,
      });
    }

    setEditing(null);
    fetchPlans();
  };

  if (loading) {
    return <AdminLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Paketler</h1>
      <p className="mt-6 text-[16px] text-red-600">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Paketler</h1>
      <p className="mt-1 text-[16px] text-ink-500">Paket fiyatlarını ve limitlerini yönetin.</p>

      <div className="mt-8 space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="card p-5">
            {editing === plan.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="label-field">Paket Adı</label>
                    <input type="text" value={editValues.name || ''} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Fiyat (kuruş)</label>
                    <input type="number" value={editValues.price_cents || 0} onChange={(e) => setEditValues({ ...editValues, price_cents: parseInt(e.target.value) || 0 })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Kullanıcı Limiti</label>
                    <input type="number" value={editValues.user_limit || 0} onChange={(e) => setEditValues({ ...editValues, user_limit: parseInt(e.target.value) || 0 })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Cihaz Limiti</label>
                    <input type="number" value={editValues.device_limit || 0} onChange={(e) => setEditValues({ ...editValues, device_limit: parseInt(e.target.value) || 0 })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Depolama (GB)</label>
                    <input type="number" value={editValues.storage_gb || 0} onChange={(e) => setEditValues({ ...editValues, storage_gb: parseInt(e.target.value) || 0 })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Durum</label>
                    <select value={editValues.is_active ? 'true' : 'false'} onChange={(e) => setEditValues({ ...editValues, is_active: e.target.value === 'true' })} className="input-field">
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveEdit} className="btn-primary">Kaydet</button>
                  <button onClick={() => setEditing(null)} className="btn-secondary">İptal</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-[16px] font-semibold text-ink-950">{plan.name}</h3>
                    <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${plan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
                      {plan.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-ink-500">
                    <span>Fiyat: <span className="font-medium text-ink-700">{formatPrice(plan.price_cents)}</span></span>
                    <span>Kullanıcı: <span className="font-medium text-ink-700">{plan.user_limit}</span></span>
                    <span>Cihaz: <span className="font-medium text-ink-700">{plan.device_limit}</span></span>
                    <span>Depolama: <span className="font-medium text-ink-700">{plan.storage_gb} GB</span></span>
                  </div>
                </div>
                <button onClick={() => startEdit(plan)} className="btn-secondary">Düzenle</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
