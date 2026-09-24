import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge, ErrorNote, Loading, Metric, MetricGrid, Modal, Notice, PageHeader, Table, Tabs, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { fetchProfileMap, type ProfileSummary } from '@/lib/profiles';
import { formatDateTime, formatNumber, formatPrice, formatShortDate } from '@/lib/format';
import { creditKindLabel } from '@/lib/labels';
import { downloadCsv } from '@/lib/documents';
import type { CreditPackage, CreditTransaction, CreditTransactionKind, CreditWallet, JobType } from '@/types';

type TabKey = 'ledger' | 'wallets' | 'packages' | 'costs';

export function AdminCredits() {
  const [tab, setTab] = useState<TabKey>('ledger');
  const [tx, setTx] = useState<CreditTransaction[]>([]);
  const [wallets, setWallets] = useState<CreditWallet[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    const [t, w, p, j] = await Promise.all([
      supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('credit_wallets').select('*').order('balance', { ascending: false }).limit(1000),
      supabase.from('credit_packages').select('*').order('sort_order'),
      supabase.from('job_types').select('*').order('sort_order'),
    ]);
    if (t.error || w.error || p.error || j.error) { setError(true); setLoading(false); return; }
    const txRows = (t.data as CreditTransaction[]) || [];
    const wRows = (w.data as CreditWallet[]) || [];
    setTx(txRows);
    setWallets(wRows);
    setPackages((p.data as CreditPackage[]) || []);
    setJobTypes((j.data as JobType[]) || []);
    setProfiles(await fetchProfileMap([...txRows.map((r) => r.user_id), ...wRows.map((r) => r.user_id)]));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthTx = tx.filter((t) => new Date(t.created_at) >= monthStart);
  const sum = (rows: CreditTransaction[], kinds: CreditTransactionKind[]) => rows.filter((r) => kinds.includes(r.kind)).reduce((s, r) => s + r.amount, 0);

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error) return <AdminLayout><PageHeader title="Krediler" /><ErrorNote /></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader title="Krediler" description="Kredi bakiyeleri, tüm hareketler, satıştaki kredi paketleri ve iş başına kredi maliyetleri." />
      {flash && <div className="mb-4"><Notice>{flash}</Notice></div>}

      <MetricGrid>
        <Metric label="Kullanıcılardaki bakiye" value={formatNumber(wallets.reduce((s, w) => s + w.balance, 0))} hint={`${formatNumber(wallets.length)} cüzdan`} />
        <Metric label="Bu ay harcanan" value={formatNumber(-sum(monthTx, ['usage']))} />
        <Metric label="Bu ay satılan" value={formatNumber(sum(monthTx, ['purchase']))} hint={`Paketlerle ${formatNumber(sum(monthTx, ['plan_grant']))}`} />
        <Metric label="Bu ay yönetici tanımı" value={formatNumber(sum(monthTx, ['admin_grant', 'admin_deduct']))} />
      </MetricGrid>

      <div className="mt-8">
        <Tabs<TabKey> active={tab} onChange={setTab} tabs={[
          { key: 'ledger', label: 'Hareketler' },
          { key: 'wallets', label: 'Bakiyeler' },
          { key: 'packages', label: 'Kredi paketleri' },
          { key: 'costs', label: 'İş maliyetleri' },
        ]} />
      </div>

      <div className="mt-6">
        {tab === 'ledger' && <Ledger tx={tx} profiles={profiles} />}
        {tab === 'wallets' && <Wallets wallets={wallets} profiles={profiles} />}
        {tab === 'packages' && <Packages packages={packages} onSaved={(m) => { setFlash(m); load(); }} />}
        {tab === 'costs' && <Costs jobTypes={jobTypes} onSaved={(m) => { setFlash(m); load(); }} />}
      </div>
    </AdminLayout>
  );
}

function Ledger({ tx, profiles }: { tx: CreditTransaction[]; profiles: Record<string, ProfileSummary> }) {
  const [kind, setKind] = useState<CreditTransactionKind | 'all'>('all');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    return tx.filter((t) => (kind === 'all' || t.kind === kind)
      && (!q || [profiles[t.user_id]?.full_name, profiles[t.user_id]?.email, t.description].some((v) => v?.toLocaleLowerCase('tr').includes(q))));
  }, [tx, kind, search, profiles]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kullanıcı veya açıklama ara…" className="input-field pl-9" />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value as CreditTransactionKind | 'all')} className="input-field sm:w-52">
          <option value="all">Tüm hareketler</option>
          {Object.entries(creditKindLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button
          className="btn-secondary sm:ml-auto"
          onClick={() => downloadCsv('faraklit-kredi-hareketleri.csv', ['Tarih', 'Kullanıcı', 'E-posta', 'Tür', 'Açıklama', 'Miktar', 'Bakiye'],
            filtered.map((t) => [formatDateTime(t.created_at), profiles[t.user_id]?.full_name, profiles[t.user_id]?.email, creditKindLabel[t.kind], t.description, t.amount, t.balance_after]))}
        ><Download size={15} />CSV</button>
      </div>
      <Table head={['Tarih', 'Kullanıcı', 'Tür', 'Açıklama', 'Miktar', 'Bakiye']} empty={filtered.length === 0}>
        {filtered.map((t) => (
          <tr key={t.id}>
            <Td className="text-ink-500">{formatDateTime(t.created_at)}</Td>
            <Td><Link to={`/admin/users/${t.user_id}`} className="hover:underline">{profiles[t.user_id]?.full_name || profiles[t.user_id]?.email || '—'}</Link></Td>
            <Td>{creditKindLabel[t.kind]}</Td>
            <Td className="max-w-[300px] truncate">{t.description || '—'}</Td>
            <Td className={t.amount > 0 ? 'font-medium text-emerald-700' : 'font-medium'}>{t.amount > 0 ? '+' : ''}{formatNumber(t.amount)}</Td>
            <Td>{formatNumber(t.balance_after)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function Wallets({ wallets, profiles }: { wallets: CreditWallet[]; profiles: Record<string, ProfileSummary> }) {
  return (
    <Table head={['Kullanıcı', 'Bakiye', 'Toplam yüklenen', 'Toplam harcanan', 'Son hareket']} empty={wallets.length === 0}>
      {wallets.map((w) => (
        <tr key={w.user_id}>
          <Td>
            <Link to={`/admin/users/${w.user_id}`} className="font-medium text-ink-900 hover:underline">{profiles[w.user_id]?.full_name || '—'}</Link>
            <p className="text-[13px] text-ink-400">{profiles[w.user_id]?.email}</p>
          </Td>
          <Td className="font-medium text-ink-900">{formatNumber(w.balance)}</Td>
          <Td>{formatNumber(w.lifetime_earned)}</Td>
          <Td>{formatNumber(w.lifetime_spent)}</Td>
          <Td className="text-ink-500">{formatShortDate(w.updated_at)}</Td>
        </tr>
      ))}
    </Table>
  );
}

const emptyPackage = { name: '', slug: '', credits: 500, price_cents: 50000, is_active: true, sort_order: 0 };

function Packages({ packages, onSaved }: { packages: CreditPackage[]; onSaved: (m: string) => void }) {
  const [editing, setEditing] = useState<(Partial<CreditPackage> & typeof emptyPackage) | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || editing.credits <= 0 || editing.price_cents < 0) { setError('Ad, kredi ve fiyat alanlarını kontrol edin.'); return; }
    setBusy(true);
    const payload = {
      name: editing.name.trim(),
      slug: editing.slug.trim() || `kredi-${editing.credits}-${Date.now().toString(36)}`,
      credits: editing.credits,
      price_cents: editing.price_cents,
      is_active: editing.is_active,
      sort_order: editing.sort_order,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = editing.id
      ? await supabase.from('credit_packages').update(payload).eq('id', editing.id)
      : await supabase.from('credit_packages').insert(payload);
    setBusy(false);
    if (err) { setError('Paket kaydedilemedi: ' + err.message); return; }
    await supabase.from('admin_audit_logs').insert({
      admin_id: (await supabase.auth.getUser()).data.user?.id,
      action: editing.id ? 'credit_package.updated' : 'credit_package.created',
      details: `${payload.name}: ${payload.credits} kredi, ${formatPrice(payload.price_cents)}${payload.is_active ? '' : ' (pasif)'}`,
    });
    setEditing(null);
    onSaved('Kredi paketi kaydedildi.');
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[14px] text-ink-500">Satıştaki paketler kullanıcı panelinden satın alınabilir.</p>
        <button onClick={() => { setError(''); setEditing({ ...emptyPackage, sort_order: packages.length + 1 }); }} className="btn-primary"><Plus size={15} />Yeni paket</button>
      </div>
      <Table head={['Paket', 'Kredi', 'Fiyat', 'Kredi başı', 'Durum', '']} empty={packages.length === 0}>
        {packages.map((p) => (
          <tr key={p.id}>
            <Td className="font-medium text-ink-900">{p.name}</Td>
            <Td>{formatNumber(p.credits)}</Td>
            <Td>{formatPrice(p.price_cents)}</Td>
            <Td className="text-ink-500">{(p.price_cents / 100 / p.credits).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</Td>
            <Td>{p.is_active ? <Badge tone="green">Satışta</Badge> : <Badge>Pasif</Badge>}</Td>
            <Td><button onClick={() => { setError(''); setEditing({ ...p }); }} className="text-[14px] font-medium text-ink-600 hover:underline">Düzenle</button></Td>
          </tr>
        ))}
      </Table>

      {editing && (
        <Modal title={editing.id ? 'Kredi paketini düzenle' : 'Yeni kredi paketi'} onClose={() => setEditing(null)} footer={<>
          <button onClick={() => setEditing(null)} className="btn-secondary">Vazgeç</button>
          <button onClick={save} disabled={busy} className="btn-primary">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </>}>
          <div>
            <label className="label-field">Paket adı</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input-field" placeholder="Örn. 2.000 Kredi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Kredi</label>
              <input type="number" min={1} value={editing.credits} onChange={(e) => setEditing({ ...editing, credits: parseInt(e.target.value, 10) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="label-field">Fiyat (TL)</label>
              <input type="number" min={0} step="0.01" value={editing.price_cents / 100} onChange={(e) => setEditing({ ...editing, price_cents: Math.round((parseFloat(e.target.value) || 0) * 100) })} className="input-field" />
            </div>
            <div>
              <label className="label-field">Sıra</label>
              <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value, 10) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="label-field">Durum</label>
              <select value={editing.is_active ? '1' : '0'} onChange={(e) => setEditing({ ...editing, is_active: e.target.value === '1' })} className="input-field">
                <option value="1">Satışta</option>
                <option value="0">Pasif</option>
              </select>
            </div>
          </div>
          {error && <Notice tone="red">{error}</Notice>}
        </Modal>
      )}
    </>
  );
}

function Costs({ jobTypes, onSaved }: { jobTypes: JobType[]; onSaved: (m: string) => void }) {
  const [values, setValues] = useState<Record<string, { cost: number; active: boolean }>>(
    () => Object.fromEntries(jobTypes.map((t) => [t.key, { cost: t.credit_cost, active: t.is_active }])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const changed = jobTypes.filter((t) => values[t.key] && (values[t.key].cost !== t.credit_cost || values[t.key].active !== t.is_active));

  const save = async () => {
    setBusy(true);
    setError('');
    for (const t of changed) {
      const { error: err } = await supabase.from('job_types').update({ credit_cost: values[t.key].cost, is_active: values[t.key].active }).eq('key', t.key);
      if (err) { setError('Kaydedilemedi: ' + err.message); setBusy(false); return; }
    }
    await supabase.from('admin_audit_logs').insert({
      admin_id: (await supabase.auth.getUser()).data.user?.id,
      action: 'job_types.updated',
      details: changed.map((t) => `${t.label}: ${values[t.key].cost} kredi${values[t.key].active ? '' : ' (kapalı)'}`).join(', '),
    });
    setBusy(false);
    onSaved('İş maliyetleri güncellendi.');
  };

  return (
    <>
      <p className="mb-4 text-[14px] text-ink-500">
        Masaüstü uygulaması her iş tamamlandığında kaydı sunucuya gönderir; düşülecek kredi burada belirlenen maliyete göre sunucuda hesaplanır.
        Başarısız işlerden kredi düşülmez.
      </p>
      <Table head={['İş türü', 'Anahtar', 'Kredi / iş', 'Durum']}>
        {jobTypes.map((t) => (
          <tr key={t.key}>
            <Td className="font-medium text-ink-900">{t.label}</Td>
            <Td mono>{t.key}</Td>
            <Td>
              <input
                type="number"
                min={0}
                value={values[t.key]?.cost ?? 0}
                onChange={(e) => setValues({ ...values, [t.key]: { ...values[t.key], cost: Math.max(0, parseInt(e.target.value, 10) || 0) } })}
                className="input-field w-24 py-1.5"
              />
            </Td>
            <Td>
              <select
                value={values[t.key]?.active ? '1' : '0'}
                onChange={(e) => setValues({ ...values, [t.key]: { ...values[t.key], active: e.target.value === '1' } })}
                className="input-field w-32 py-1.5"
              >
                <option value="1">Açık</option>
                <option value="0">Kapalı</option>
              </select>
            </Td>
          </tr>
        ))}
      </Table>
      {error && <div className="mt-3"><Notice tone="red">{error}</Notice></div>}
      <div className="mt-4 flex justify-end">
        <button onClick={save} disabled={busy || changed.length === 0} className="btn-primary">{busy ? 'Kaydediliyor…' : `Değişiklikleri kaydet${changed.length ? ` (${changed.length})` : ''}`}</button>
      </div>
    </>
  );
}
