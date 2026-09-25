import { useCallback, useEffect, useState } from 'react';
import { CreditCard, KeyRound, Settings2, Star } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge, ErrorNote, Loading, Metric, MetricGrid, Modal, Notice, PageHeader } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDateTime, formatNumber, formatPrice, formatShortDate } from '@/lib/format';
import { rpcErrorMessage } from '@/lib/labels';

type PosMode = 'test' | 'live';
type SavedSecret = { mode: PosMode; name: string; last4: string; updated_at: string };

type PosIntegration = {
  provider: string;
  display_name: string;
  is_enabled: boolean;
  is_default: boolean;
  mode: PosMode;
  merchant_id: string;
  commission_rate: number;
  max_installments: number;
  require_3ds: boolean;
  notes: string;
  updated_at: string;
  secrets: SavedSecret[];
  payments_30d: number;
  volume_30d_cents: number;
  last_paid_at: string | null;
};

type KeyField = { name: string; label: string };

// Credential fields each provider's panel gives out. Values are write-only in this page.
const catalog: Record<string, { merchantLabel: string; keys: KeyField[] }> = {
  iyzico: {
    merchantLabel: 'Üye işyeri no',
    keys: [{ name: 'api_key', label: 'API anahtarı' }, { name: 'secret_key', label: 'Güvenlik anahtarı' }],
  },
  paytr: {
    merchantLabel: 'Mağaza no (merchant_id)',
    keys: [{ name: 'merchant_key', label: 'Mağaza parolası (merchant_key)' }, { name: 'merchant_salt', label: 'Mağaza gizli anahtarı (merchant_salt)' }],
  },
  param: {
    merchantLabel: 'Terminal no (CLIENT_CODE)',
    keys: [{ name: 'client_username', label: 'Kullanıcı adı' }, { name: 'client_password', label: 'Şifre' }, { name: 'guid', label: 'GUID' }],
  },
  sipay: {
    merchantLabel: 'Üye işyeri no (merchant_id)',
    keys: [{ name: 'merchant_key', label: 'Merchant key' }, { name: 'app_key', label: 'App key' }, { name: 'app_secret', label: 'App secret' }],
  },
  garanti: {
    merchantLabel: 'Üye işyeri no',
    keys: [{ name: 'terminal_id', label: 'Terminal no' }, { name: 'provision_password', label: 'Provizyon şifresi' }, { name: 'store_key', label: '3D güvenlik anahtarı' }],
  },
};

const fallbackCatalog = { merchantLabel: 'Üye işyeri no', keys: [{ name: 'api_key', label: 'API anahtarı' }, { name: 'secret_key', label: 'Gizli anahtar' }] };
const catalogFor = (provider: string) => catalog[provider] ?? fallbackCatalog;

const modeLabel: Record<PosMode, string> = { test: 'Test', live: 'Canlı' };

function savedKeys(pos: PosIntegration, mode: PosMode) {
  return pos.secrets.filter((s) => s.mode === mode);
}

function keysComplete(pos: PosIntegration, mode: PosMode, extra: string[] = []) {
  const saved = new Set([...savedKeys(pos, mode).map((s) => s.name), ...extra]);
  return catalogFor(pos.provider).keys.every((k) => saved.has(k.name));
}

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-emerald-600' : 'bg-ink-300'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function AdminPos() {
  const [rows, setRows] = useState<PosIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<{ pos: PosIntegration; notice?: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('admin_pos_overview');
    if (err) {
      setError(true);
    } else {
      setRows(((data as PosIntegration[]) || []).map((r) => ({ ...r, commission_rate: Number(r.commission_rate), volume_30d_cents: Number(r.volume_30d_cents) })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (pos: PosIntegration) => {
    const next = !pos.is_enabled;
    if (next && !keysComplete(pos, pos.mode)) {
      setEditing({ pos, notice: `Açmadan önce ${modeLabel[pos.mode].toLocaleLowerCase('tr')} mod anahtarlarını girin.` });
      return;
    }
    setBusy(pos.provider);
    setFlash(null);
    const { error: err } = await supabase.rpc('admin_update_pos_integration', {
      p_provider: pos.provider,
      p_is_enabled: next,
      p_mode: pos.mode,
      p_merchant_id: pos.merchant_id,
      p_commission_rate: pos.commission_rate,
      p_max_installments: pos.max_installments,
      p_require_3ds: pos.require_3ds,
      p_notes: pos.notes,
    });
    setBusy(null);
    if (err) {
      setFlash({ tone: 'red', text: rpcErrorMessage(err) });
      return;
    }
    setFlash({ tone: 'green', text: `${pos.display_name} ${next ? 'açıldı' : 'kapatıldı'}.` });
    load();
  };

  const makeDefault = async (pos: PosIntegration) => {
    setBusy(pos.provider);
    setFlash(null);
    const { error: err } = await supabase.rpc('admin_set_pos_default', { p_provider: pos.provider });
    setBusy(null);
    if (err) {
      setFlash({ tone: 'red', text: rpcErrorMessage(err) });
      return;
    }
    setFlash({ tone: 'green', text: `${pos.display_name} artık varsayılan POS.` });
    load();
  };

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) {
    return (
      <AdminLayout>
        <PageHeader title="POS Entegrasyonları" />
        <ErrorNote />
      </AdminLayout>
    );
  }

  const enabled = rows.filter((r) => r.is_enabled);
  const defaultPos = rows.find((r) => r.is_default);
  const volume = rows.reduce((sum, r) => sum + r.volume_30d_cents, 0);
  const count = rows.reduce((sum, r) => sum + r.payments_30d, 0);

  return (
    <AdminLayout>
      <PageHeader
        title="POS Entegrasyonları"
        description="Sanal POS sağlayıcılarını açıp kapatın, anahtarlarını girin ve ödemelerde kullanılacak varsayılan POS’u seçin."
      />

      <MetricGrid>
        <Metric label="Varsayılan POS" value={defaultPos?.display_name ?? '—'} hint={defaultPos ? `${modeLabel[defaultPos.mode]} mod` : 'Seçilmedi'} highlight={!defaultPos} />
        <Metric label="Açık POS" value={`${enabled.length} / ${rows.length}`} hint={enabled.some((r) => r.mode === 'test') ? 'Test modunda olan var' : undefined} />
        <Metric label="Son 30 gün ciro" value={formatPrice(volume)} hint="POS ile tamamlanan ödemeler" />
        <Metric label="Son 30 gün işlem" value={formatNumber(count)} />
      </MetricGrid>

      {flash && <div className="mt-6"><Notice tone={flash.tone}>{flash.text}</Notice></div>}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {rows.map((pos) => {
          const cat = catalogFor(pos.provider);
          const saved = savedKeys(pos, pos.mode).length;
          const complete = keysComplete(pos, pos.mode);
          return (
            <div key={pos.provider} className={`card flex flex-col p-5 ${pos.is_default ? 'ring-1 ring-ink-900' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${pos.is_enabled ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-500'}`}>
                    <CreditCard size={19} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-semibold text-ink-950">{pos.display_name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {pos.is_default && <Badge tone="blue">Varsayılan</Badge>}
                      <Badge tone={pos.is_enabled ? 'green' : 'neutral'}>{pos.is_enabled ? 'Açık' : 'Kapalı'}</Badge>
                      <Badge tone={pos.mode === 'live' ? 'green' : 'amber'}>{modeLabel[pos.mode]} mod</Badge>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={pos.is_enabled}
                  disabled={busy === pos.provider}
                  onChange={() => toggle(pos)}
                  label={`${pos.display_name} ${pos.is_enabled ? 'kapat' : 'aç'}`}
                />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
                <div>
                  <dt className="text-ink-400">Anahtarlar</dt>
                  <dd className={`mt-0.5 flex items-center gap-1.5 font-medium ${complete ? 'text-ink-800' : 'text-amber-700'}`}>
                    <KeyRound size={13} /> {saved} / {cat.keys.length} kayıtlı
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">{cat.merchantLabel}</dt>
                  <dd className="mt-0.5 truncate font-medium text-ink-800">{pos.merchant_id || '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Komisyon · taksit</dt>
                  <dd className="mt-0.5 font-medium text-ink-800">
                    %{pos.commission_rate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} · {pos.max_installments === 1 ? 'Tek çekim' : `${pos.max_installments} taksit`}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">Son 30 gün</dt>
                  <dd className="mt-0.5 font-medium text-ink-800">{formatNumber(pos.payments_30d)} işlem · {formatPrice(pos.volume_30d_cents)}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
                <p className="text-[13px] text-ink-400">
                  {pos.last_paid_at ? `Son ödeme ${formatShortDate(pos.last_paid_at)}` : 'Henüz ödeme yok'}
                  {pos.require_3ds ? ' · 3D Secure' : ''}
                </p>
                <div className="flex gap-2">
                  {!pos.is_default && pos.is_enabled && (
                    <button onClick={() => makeDefault(pos)} disabled={busy === pos.provider} className="btn-secondary inline-flex items-center gap-1.5">
                      <Star size={14} /> Varsayılan yap
                    </button>
                  )}
                  <button onClick={() => setEditing({ pos })} className="btn-secondary inline-flex items-center gap-1.5">
                    <Settings2 size={14} /> Ayarlar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[13px] leading-5 text-ink-400">
        Kaydedilen anahtarlar bu panelde bir daha gösterilmez; yalnızca son 4 karakteri görünür. Anahtarları yalnızca ödeme sunucusu okuyabilir.
        Tüm değişiklikler denetim kaydına yazılır.
      </p>

      {editing && (
        <PosSettingsModal
          pos={editing.pos}
          notice={editing.notice}
          onClose={() => setEditing(null)}
          onSaved={(text) => {
            setEditing(null);
            setFlash({ tone: 'green', text });
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}

function PosSettingsModal({ pos, notice, onClose, onSaved }: {
  pos: PosIntegration;
  notice?: string;
  onClose: () => void;
  onSaved: (text: string) => void;
}) {
  const cat = catalogFor(pos.provider);
  const [mode, setMode] = useState<PosMode>(pos.mode);
  const [merchantId, setMerchantId] = useState(pos.merchant_id);
  const [commission, setCommission] = useState(String(pos.commission_rate));
  const [installments, setInstallments] = useState(pos.max_installments);
  const [require3ds, setRequire3ds] = useState(pos.require_3ds);
  const [notes, setNotes] = useState(pos.notes);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Keys typed in are per mode; switching mode starts from a clean form.
  const switchMode = (next: PosMode) => {
    setMode(next);
    setKeys({});
    setRemoved(new Set());
  };

  const saved = new Map(savedKeys(pos, mode).map((s) => [s.name, s]));

  const save = async () => {
    const rate = Number(commission.replace(',', '.'));
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError('Komisyon oranı 0 ile 100 arasında olmalıdır.');
      return;
    }
    const typed = Object.entries(keys).filter(([, v]) => v.trim() !== '');
    const afterSave = new Set([...saved.keys()].filter((n) => !removed.has(n)));
    typed.forEach(([n]) => afterSave.add(n));
    const allKeys = cat.keys.every((k) => afterSave.has(k.name));
    if (pos.is_enabled && !allKeys) {
      setError(`POS açık olduğu için ${modeLabel[mode].toLocaleLowerCase('tr')} mod anahtarlarının hepsi gerekli. Önce POS’u kapatın veya eksik anahtarları girin.`);
      return;
    }

    setBusy(true);
    setError('');
    for (const [name, value] of typed) {
      const { error: err } = await supabase.rpc('admin_set_pos_secret', { p_provider: pos.provider, p_mode: mode, p_name: name, p_value: value.trim() });
      if (err) { setBusy(false); setError(rpcErrorMessage(err)); return; }
    }
    for (const name of removed) {
      if (keys[name]?.trim()) continue;
      const { error: err } = await supabase.rpc('admin_set_pos_secret', { p_provider: pos.provider, p_mode: mode, p_name: name, p_value: '' });
      if (err) { setBusy(false); setError(rpcErrorMessage(err)); return; }
    }
    const { error: err } = await supabase.rpc('admin_update_pos_integration', {
      p_provider: pos.provider,
      p_is_enabled: pos.is_enabled,
      p_mode: mode,
      p_merchant_id: merchantId,
      p_commission_rate: rate,
      p_max_installments: installments,
      p_require_3ds: require3ds,
      p_notes: notes,
    });
    setBusy(false);
    if (err) { setError(rpcErrorMessage(err)); return; }
    onSaved(`${pos.display_name} ayarları kaydedildi.`);
  };

  return (
    <Modal
      title={`${pos.display_name} ayarları`}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="btn-secondary">Vazgeç</button>
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
      </>}
    >
      {notice && <Notice tone="amber">{notice}</Notice>}

      <div>
        <label className="label-field">Çalışma modu</label>
        <div className="grid grid-cols-2 gap-1 rounded-[8px] bg-ink-100 p-1">
          {(['test', 'live'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-[6px] py-1.5 text-[14px] font-medium transition-colors ${mode === m ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}
            >
              {modeLabel[m]}
            </button>
          ))}
        </div>
        {mode === 'live' && pos.mode === 'test' && (
          <p className="mt-1.5 text-[13px] text-amber-700">Canlı modda müşterilerin kartından gerçek çekim yapılır.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label-field">{cat.merchantLabel}</label>
          <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="input-field" maxLength={100} />
        </div>
        <div>
          <label className="label-field">Komisyon (%)</label>
          <input value={commission} onChange={(e) => setCommission(e.target.value)} inputMode="decimal" className="input-field" />
        </div>
        <div>
          <label className="label-field">En fazla taksit</label>
          <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} className="input-field">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n === 1 ? 'Tek çekim' : `${n} taksit`}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-[15px] text-ink-700">
        <input type="checkbox" checked={require3ds} onChange={(e) => setRequire3ds(e.target.checked)} className="h-4 w-4 rounded border-ink-300" />
        3D Secure zorunlu
      </label>

      <div>
        <p className="label-field">{modeLabel[mode]} mod anahtarları</p>
        <div className="space-y-3">
          {cat.keys.map((k) => {
            const s = saved.get(k.name);
            const isRemoved = removed.has(k.name);
            return (
              <div key={k.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                  <span className="font-medium text-ink-700">{k.label}</span>
                  {s && !isRemoved ? (
                    <span className="flex items-center gap-2 text-ink-400">
                      <span title={formatDateTime(s.updated_at)}>Kayıtlı{s.last4 ? ` · ••••${s.last4}` : ''}</span>
                      <button type="button" onClick={() => setRemoved(new Set(removed).add(k.name))} className="text-red-600 hover:underline">Sil</button>
                    </span>
                  ) : isRemoved ? (
                    <span className="flex items-center gap-2 text-red-600">
                      Silinecek
                      <button type="button" onClick={() => { const n = new Set(removed); n.delete(k.name); setRemoved(n); }} className="text-ink-500 hover:underline">Geri al</button>
                    </span>
                  ) : (
                    <span className="text-amber-700">Kayıtlı değil</span>
                  )}
                </div>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={keys[k.name] ?? ''}
                  onChange={(e) => setKeys({ ...keys, [k.name]: e.target.value })}
                  placeholder={s && !isRemoved ? 'Değiştirmek için yeni değeri girin' : 'Değeri girin'}
                  className="input-field font-mono text-[13px]"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label-field">Not (isteğe bağlı)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" maxLength={1000} placeholder="Örn. banka sözleşme no, destek iletişimi" />
      </div>

      {error && <Notice tone="red">{error}</Notice>}
    </Modal>
  );
}
