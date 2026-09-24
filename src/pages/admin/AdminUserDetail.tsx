import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Coins, KeyRound, Monitor, PauseCircle, PlayCircle, Plus, Printer } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PaymentActionModal, type PaymentAction } from '@/components/admin/PaymentActionModal';
import { Badge, ErrorNote, Loading, Metric, MetricGrid, Modal, Notice, Section, Table, Tabs, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDate, formatDateTime, formatNumber, formatPrice, formatShortDate, daysUntil } from '@/lib/format';
import {
  creditKindLabel, effectiveLicenseStatus, invoiceStatusLabel, licenseStatusLabel, orderTypeLabel, paymentStatusLabel, rpcErrorMessage,
} from '@/lib/labels';
import { openInvoice, openReceipt } from '@/lib/documents';
import type {
  ActivityEvent, AdminAuditLog, CreditTransaction, CreditWallet, Device, Invoice, Job, JobType, License, Payment, Plan, Profile,
} from '@/types';

type TabKey = 'summary' | 'license' | 'credits' | 'jobs' | 'payments' | 'devices' | 'activity';
type Dialog = null | 'extend' | 'grant' | 'credits' | 'suspend' | 'activate' | 'revoke_devices';

type Data = {
  profile: Profile;
  organization: { name: string; role: string } | null;
  licenses: License[];
  wallet: CreditWallet | null;
  transactions: CreditTransaction[];
  jobs: Job[];
  payments: Payment[];
  invoices: Invoice[];
  devices: Device[];
  activities: ActivityEvent[];
  audit: AdminAuditLog[];
};

export function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Data | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [jobTypes, setJobTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabKey>('summary');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [paymentAction, setPaymentAction] = useState<{ payment: Payment; action: PaymentAction } | null>(null);
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [prof, member, lic, wallet, tx, jobs, pays, invs, devs, acts, audit, pl, jt] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('organization_members').select('role, organization:organizations(name)').eq('user_id', id).limit(1).maybeSingle(),
        supabase.from('licenses').select('*, plan:plans(*)').eq('user_id', id).order('ends_at', { ascending: false }),
        supabase.from('credit_wallets').select('*').eq('user_id', id).maybeSingle(),
        supabase.from('credit_transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(200),
        supabase.from('jobs').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(200),
        supabase.from('payments').select('*, plan:plans(*)').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('devices').select('*').eq('user_id', id).order('last_seen_at', { ascending: false }),
        supabase.from('activity_events').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
        supabase.from('admin_audit_logs').select('*').eq('target_user_id', id).order('created_at', { ascending: false }).limit(50),
        supabase.from('plans').select('*').order('sort_order'),
        supabase.from('job_types').select('*').order('sort_order'),
      ]);
      if (prof.error || !prof.data || lic.error || pays.error) throw new Error();
      const org = member.data as unknown as { role: string; organization: { name: string } | null } | null;
      setData({
        profile: prof.data as Profile,
        organization: org?.organization ? { name: org.organization.name, role: org.role } : null,
        licenses: (lic.data as License[]) || [],
        wallet: wallet.data as CreditWallet | null,
        transactions: (tx.data as CreditTransaction[]) || [],
        jobs: (jobs.data as Job[]) || [],
        payments: (pays.data as Payment[]) || [],
        invoices: (invs.data as Invoice[]) || [],
        devices: (devs.data as Device[]) || [],
        activities: (acts.data as ActivityEvent[]) || [],
        audit: (audit.data as AdminAuditLog[]) || [],
      });
      setPlans((pl.data as Plan[]) || []);
      setJobTypes(Object.fromEntries(((jt.data as JobType[]) || []).map((t) => [t.key, t.label])));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const done = (message: string) => {
    setDialog(null);
    setPaymentAction(null);
    setFlash(message);
    load();
  };

  const license = data?.licenses[0] || null;
  const licStatus = license ? effectiveLicenseStatus(license.status, license.ends_at) : null;

  const jobStats = useMemo(() => {
    const byType: Record<string, { count: number; credits: number }> = {};
    const since = Date.now() - 30 * 86400000;
    let last30 = 0;
    for (const j of data?.jobs || []) {
      byType[j.job_type] = byType[j.job_type] || { count: 0, credits: 0 };
      byType[j.job_type].count += j.quantity;
      byType[j.job_type].credits += j.credits_used;
      if (new Date(j.created_at).getTime() > since) last30 += 1;
    }
    return { byType, last30 };
  }, [data?.jobs]);

  if (loading) return <AdminLayout><Loading /></AdminLayout>;
  if (error || !data) {
    return <AdminLayout><BackLink /><ErrorNote>Kullanıcı bulunamadı veya veriler yüklenemedi.</ErrorNote></AdminLayout>;
  }

  const { profile } = data;
  const paidTotal = data.payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount_cents, 0);
  const paymentByInvoice = Object.fromEntries(data.payments.map((p) => [p.id, p]));

  return (
    <AdminLayout>
      <BackLink />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">{profile.full_name || profile.email}</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            {profile.email}{profile.phone ? ` · ${profile.phone}` : ''}{data.organization ? ` · ${data.organization.name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDialog('credits')} className="btn-secondary"><Coins size={15} />Kredi tanımla</button>
          {license ? (
            <button onClick={() => setDialog('extend')} className="btn-secondary"><Plus size={15} />Süre uzat</button>
          ) : null}
          <button onClick={() => setDialog('grant')} className="btn-primary"><KeyRound size={15} />Lisans ver</button>
        </div>
      </div>

      {flash && <div className="mt-4"><Notice>{flash}</Notice></div>}

      <div className="mt-6">
        <MetricGrid>
          <Metric
            label="Lisans"
            value={licStatus ? <Badge tone={licenseStatusLabel[licStatus].tone}>{licenseStatusLabel[licStatus].label}</Badge> : 'Yok'}
            hint={license ? `${license.plan?.name || ''} · ${formatShortDate(license.ends_at)}` : undefined}
          />
          <Metric label="Kredi bakiyesi" value={formatNumber(data.wallet?.balance || 0)} hint={`Harcanan ${formatNumber(data.wallet?.lifetime_spent || 0)}`} />
          <Metric label="İş (30 gün)" value={formatNumber(jobStats.last30)} hint={`Toplam ${formatNumber(data.jobs.length)} kayıt`} />
          <Metric label="Toplam ödeme" value={formatPrice(paidTotal)} hint={`${data.payments.length} sipariş`} />
        </MetricGrid>
      </div>

      <div className="mt-8">
        <Tabs<TabKey>
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'summary', label: 'Özet' },
            { key: 'license', label: 'Lisans' },
            { key: 'credits', label: 'Krediler' },
            { key: 'jobs', label: 'İş üretimi' },
            { key: 'payments', label: 'Ödemeler & Faturalar' },
            { key: 'devices', label: `Cihazlar (${data.devices.filter((d) => d.is_active).length})` },
            { key: 'activity', label: 'Aktivite' },
          ]}
        />
      </div>

      {tab === 'summary' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Section title="Kullanıcı bilgileri">
            <div className="card divide-y divide-ink-100 px-5">
              <InfoRow label="Hesap tipi" value={profile.account_type === 'organization' ? 'Kurumsal' : 'Bireysel'} />
              <InfoRow label="Büro" value={data.organization ? `${data.organization.name} (${data.organization.role})` : '—'} />
              <InfoRow label="Baro" value={profile.bar_association || '—'} />
              <InfoRow label="Baro sicil no" value={profile.bar_registry_number || '—'} />
              <InfoRow label="Kullanıcı kodu" value={profile.hashtag ? `#${profile.hashtag}` : '—'} />
              <InfoRow label="Rol" value={profile.role === 'admin' ? 'Platform yöneticisi' : 'Kullanıcı'} />
              <InfoRow label="Kayıt tarihi" value={formatDate(profile.created_at)} />
            </div>
          </Section>
          <Section title="Yönetici işlem geçmişi">
            <div className="card divide-y divide-ink-100">
              {data.audit.length === 0 ? <p className="px-5 py-6 text-[15px] text-ink-400">Kayıt yok.</p> : data.audit.slice(0, 10).map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <p className="text-[14px] font-medium text-ink-800">{a.details || a.action}</p>
                  <p className="text-[13px] text-ink-400">{a.action} · {formatDateTime(a.created_at)}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'license' && (
        <>
          {license && (
            <Section
              title="Güncel lisans"
              actions={
                <div className="flex flex-wrap gap-2">
                  {license.status === 'active'
                    ? <button onClick={() => setDialog('suspend')} className="btn-secondary"><PauseCircle size={15} />Askıya al</button>
                    : <button onClick={() => setDialog('activate')} className="btn-secondary"><PlayCircle size={15} />Aktifleştir</button>}
                  <button onClick={() => setDialog('extend')} className="btn-secondary"><Plus size={15} />Süre uzat</button>
                </div>
              }
            >
              <div className="card divide-y divide-ink-100 px-5">
                <InfoRow label="Paket" value={license.plan?.name || '—'} />
                <InfoRow label="Durum" value={licStatus ? licenseStatusLabel[licStatus].label : '—'} />
                <InfoRow label="Başlangıç" value={formatDate(license.started_at)} />
                <InfoRow label="Bitiş" value={`${formatDate(license.ends_at)} (${daysUntil(license.ends_at)} gün)`} />
                <InfoRow label="Cihaz limiti" value={`${data.devices.filter((d) => d.is_active).length} / ${license.plan?.device_limit ?? '—'}`} />
                <InfoRow label="Lisans anahtarı" value={license.license_key} mono />
              </div>
            </Section>
          )}
          <Section title="Lisans geçmişi">
            <Table head={['Paket', 'Durum', 'Başlangıç', 'Bitiş', 'Anahtar']} empty={data.licenses.length === 0}>
              {data.licenses.map((l) => {
                const s = effectiveLicenseStatus(l.status, l.ends_at)!;
                return (
                  <tr key={l.id}>
                    <Td>{l.plan?.name || '—'}</Td>
                    <Td><Badge tone={licenseStatusLabel[s].tone}>{licenseStatusLabel[s].label}</Badge></Td>
                    <Td>{formatShortDate(l.started_at)}</Td>
                    <Td>{formatShortDate(l.ends_at)}</Td>
                    <Td mono>{l.license_key.slice(0, 16)}…</Td>
                  </tr>
                );
              })}
            </Table>
          </Section>
        </>
      )}

      {tab === 'credits' && (
        <Section title="Kredi hareketleri" actions={<button onClick={() => setDialog('credits')} className="btn-secondary"><Coins size={15} />Kredi tanımla / düş</button>}>
          <Table head={['Tarih', 'Tür', 'Açıklama', 'Miktar', 'Bakiye']} empty={data.transactions.length === 0}>
            {data.transactions.map((t) => (
              <tr key={t.id}>
                <Td className="text-ink-500">{formatDateTime(t.created_at)}</Td>
                <Td>{creditKindLabel[t.kind]}</Td>
                <Td className="max-w-[320px] truncate">{t.description || '—'}</Td>
                <Td className={t.amount > 0 ? 'font-medium text-emerald-700' : 'font-medium text-ink-800'}>{t.amount > 0 ? '+' : ''}{formatNumber(t.amount)}</Td>
                <Td>{formatNumber(t.balance_after)}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {tab === 'jobs' && (
        <>
          <Section title="İş türüne göre">
            <Table head={['İş türü', 'Adet', 'Harcanan kredi']} empty={Object.keys(jobStats.byType).length === 0}>
              {Object.entries(jobStats.byType).sort((a, b) => b[1].count - a[1].count).map(([key, v]) => (
                <tr key={key}>
                  <Td>{jobTypes[key] || key}</Td>
                  <Td>{formatNumber(v.count)}</Td>
                  <Td>{formatNumber(v.credits)}</Td>
                </tr>
              ))}
            </Table>
          </Section>
          <Section title="Son işler">
            <Table head={['Tarih', 'İş türü', 'Durum', 'Adet', 'Kredi', 'Sürüm']} empty={data.jobs.length === 0}>
              {data.jobs.map((j) => (
                <tr key={j.id}>
                  <Td className="text-ink-500">{formatDateTime(j.created_at)}</Td>
                  <Td>{jobTypes[j.job_type] || j.job_type}</Td>
                  <Td>{j.status === 'completed' ? <Badge tone="green">Tamamlandı</Badge> : <Badge tone="red">Başarısız</Badge>}</Td>
                  <Td>{j.quantity}</Td>
                  <Td>{formatNumber(j.credits_used)}</Td>
                  <Td className="text-ink-500">{[j.platform, j.app_version].filter(Boolean).join(' · ') || '—'}</Td>
                </tr>
              ))}
            </Table>
          </Section>
        </>
      )}

      {tab === 'payments' && (
        <>
          <Section title="Siparişler">
            <Table head={['Sipariş', 'Tür', 'Kapsam', 'Tutar', 'Durum', 'Tarih', '']} empty={data.payments.length === 0}>
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium text-ink-900">{p.order_number}</Td>
                  <Td>{orderTypeLabel[p.order_type]}</Td>
                  <Td>{p.order_type === 'credits' ? `${formatNumber(p.credits)} kredi` : `${p.plan?.name || '—'} · ${p.periods} dönem`}</Td>
                  <Td>{formatPrice(p.amount_cents)}</Td>
                  <Td><Badge tone={paymentStatusLabel[p.status].tone}>{paymentStatusLabel[p.status].label}</Badge></Td>
                  <Td className="text-ink-500">{formatShortDate(p.created_at)}</Td>
                  <Td>
                    <div className="flex justify-end gap-3 text-[14px] font-medium">
                      {p.status === 'pending' && <>
                        <button className="text-emerald-700 hover:underline" onClick={() => setPaymentAction({ payment: p, action: 'complete' })}>Onayla</button>
                        <button className="text-ink-500 hover:underline" onClick={() => setPaymentAction({ payment: p, action: 'cancelled' })}>İptal</button>
                      </>}
                      {p.status === 'completed' && <>
                        <button className="text-ink-600 hover:underline" onClick={() => openReceipt(p, profile)}>Makbuz</button>
                        <button className="text-ink-500 hover:underline" onClick={() => setPaymentAction({ payment: p, action: 'refunded' })}>İade</button>
                      </>}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </Section>
          <Section title="Faturalar">
            <Table head={['Fatura No', 'Tarih', 'Ad / Firma', 'Tutar', 'Durum', '']} empty={data.invoices.length === 0}>
              {data.invoices.map((inv) => (
                <tr key={inv.id}>
                  <Td className="font-medium text-ink-900">{inv.invoice_number}</Td>
                  <Td>{formatShortDate(inv.created_at)}</Td>
                  <Td>{inv.billing_name || '—'}</Td>
                  <Td>{formatPrice(inv.amount_cents)}</Td>
                  <Td><Badge tone={invoiceStatusLabel[inv.status].tone}>{invoiceStatusLabel[inv.status].label}</Badge></Td>
                  <Td>
                    <button onClick={() => openInvoice(inv, paymentByInvoice[inv.payment_id])} className="flex items-center gap-1 text-[14px] font-medium text-ink-600 hover:text-ink-900">
                      <Printer size={13} />Görüntüle
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          </Section>
        </>
      )}

      {tab === 'devices' && (
        <Section
          title="Cihazlar"
          actions={data.devices.some((d) => d.is_active) ? <button onClick={() => setDialog('revoke_devices')} className="btn-secondary"><Monitor size={15} />Tüm cihazların yetkisini kaldır</button> : undefined}
        >
          <Table head={['Cihaz', 'Platform', 'Sürüm', 'Son görülme', 'Durum', '']} empty={data.devices.length === 0}>
            {data.devices.map((d) => (
              <tr key={d.id}>
                <Td className="font-medium text-ink-900">{d.device_name || '—'}</Td>
                <Td>{d.platform}</Td>
                <Td>{d.app_version || '—'}</Td>
                <Td className="text-ink-500">{formatDateTime(d.last_seen_at)}</Td>
                <Td>{d.is_active ? <Badge tone="green">Aktif</Badge> : <Badge>Pasif</Badge>}</Td>
                <Td>
                  {d.is_active && (
                    <button
                      className="text-[14px] font-medium text-red-700 hover:underline"
                      onClick={async () => {
                        const { error: err } = await supabase.rpc('admin_deactivate_devices', { p_user_id: profile.id, p_device_id: d.id });
                        if (err) setFlash(rpcErrorMessage(err)); else done('Cihazın yetkisi kaldırıldı.');
                      }}
                    >Yetkiyi kaldır</button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {tab === 'activity' && (
        <Section title="Uygulama aktiviteleri">
          <Table head={['Tarih', 'Olay', 'Platform', 'Sürüm']} empty={data.activities.length === 0}>
            {data.activities.map((a) => (
              <tr key={a.id}>
                <Td className="text-ink-500">{formatDateTime(a.created_at)}</Td>
                <Td>{a.event_name}</Td>
                <Td>{a.platform || '—'}</Td>
                <Td>{a.app_version || '—'}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {dialog === 'credits' && <CreditDialog userId={profile.id} onClose={() => setDialog(null)} onDone={done} />}
      {dialog === 'extend' && license && <ExtendDialog license={license} onClose={() => setDialog(null)} onDone={done} />}
      {dialog === 'grant' && <GrantDialog userId={profile.id} plans={plans} hasLicense={Boolean(license)} onClose={() => setDialog(null)} onDone={done} />}
      {(dialog === 'suspend' || dialog === 'activate') && license && (
        <ConfirmDialog
          title={dialog === 'suspend' ? 'Lisansı askıya al' : 'Lisansı aktifleştir'}
          body={dialog === 'suspend'
            ? 'Lisans askıya alınır ve bu lisansa bağlı tüm cihazların yetkisi kaldırılır. Kullanıcı yeniden aktifleştirilene kadar uygulamayı kullanamaz.'
            : 'Lisans yeniden aktif hâle gelir. Kullanıcı cihazlarını yeniden kaydedebilir.'}
          run={() => supabase.rpc('admin_set_license_status', { p_license_id: license.id, p_status: dialog === 'suspend' ? 'suspended' : 'active' })}
          onClose={() => setDialog(null)}
          onDone={() => done(dialog === 'suspend' ? 'Lisans askıya alındı.' : 'Lisans aktifleştirildi.')}
        />
      )}
      {dialog === 'revoke_devices' && (
        <ConfirmDialog
          title="Cihaz yetkilerini kaldır"
          body="Kullanıcının tüm aktif cihazlarının yetkisi kaldırılır. Kullanıcı uygulamaya yeniden giriş yaparak cihazını tekrar kaydedebilir."
          run={() => supabase.rpc('admin_deactivate_devices', { p_user_id: profile.id, p_device_id: null })}
          onClose={() => setDialog(null)}
          onDone={() => done('Cihaz yetkileri kaldırıldı.')}
        />
      )}
      {paymentAction && (
        <PaymentActionModal
          payment={paymentAction.payment}
          action={paymentAction.action}
          onClose={() => setPaymentAction(null)}
          onDone={() => done('Sipariş güncellendi.')}
        />
      )}
    </AdminLayout>
  );
}

function BackLink() {
  return <Link to="/admin/users" className="text-link mb-6"><ArrowLeft size={15} />Kullanıcılara dön</Link>;
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[15px] text-ink-500">{label}</span>
      <span className={`text-right text-[15px] font-medium text-ink-800 ${mono ? 'break-all font-mono text-[13px]' : ''}`}>{value}</span>
    </div>
  );
}

type RpcResult = PromiseLike<{ error: unknown }>;

function ConfirmDialog({ title, body, run, onClose, onDone }: { title: string; body: string; run: () => RpcResult; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="btn-secondary">Vazgeç</button>
        <button
          disabled={busy}
          className="btn-primary"
          onClick={async () => {
            setBusy(true);
            const { error: err } = await run();
            setBusy(false);
            if (err) setError(rpcErrorMessage(err)); else onDone();
          }}
        >{busy ? 'İşleniyor…' : 'Onayla'}</button>
      </>}
    >
      <p className="text-[15px] text-ink-600">{body}</p>
      {error && <Notice tone="red">{error}</Notice>}
    </Modal>
  );
}

function CreditDialog({ userId, onClose, onDone }: { userId: string; onClose: () => void; onDone: (m: string) => void }) {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('100');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const value = parseInt(amount, 10);
    if (!value || value <= 0) { setError('Geçerli bir kredi miktarı girin.'); return; }
    if (!reason.trim()) { setError('Açıklama zorunludur.'); return; }
    setBusy(true);
    const { error: err } = await supabase.rpc('admin_adjust_credits', { p_user_id: userId, p_amount: mode === 'add' ? value : -value, p_reason: reason.trim() });
    setBusy(false);
    if (err) setError(rpcErrorMessage(err)); else onDone(mode === 'add' ? `${value} kredi tanımlandı.` : `${value} kredi düşüldü.`);
  };

  return (
    <Modal title="Kredi tanımla / düş" onClose={onClose} footer={<>
      <button onClick={onClose} className="btn-secondary">Vazgeç</button>
      <button onClick={submit} disabled={busy} className="btn-primary">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
    </>}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">İşlem</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'add' | 'remove')} className="input-field">
            <option value="add">Kredi ekle</option>
            <option value="remove">Kredi düş</option>
          </select>
        </div>
        <div>
          <label className="label-field">Miktar</label>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" />
        </div>
      </div>
      <div>
        <label className="label-field">Açıklama</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Örn. Kampanya hediyesi, hatalı kullanım düzeltmesi" className="input-field" />
      </div>
      {error && <Notice tone="red">{error}</Notice>}
    </Modal>
  );
}

function ExtendDialog({ license, onClose, onDone }: { license: License; onClose: () => void; onDone: (m: string) => void }) {
  const [days, setDays] = useState('30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const base = Math.max(Date.now(), new Date(license.ends_at).getTime());
  const preview = new Date(base + (parseInt(days, 10) || 0) * 86400000).toISOString();

  return (
    <Modal title="Lisans süresini uzat" onClose={onClose} footer={<>
      <button onClick={onClose} className="btn-secondary">Vazgeç</button>
      <button
        disabled={busy}
        className="btn-primary"
        onClick={async () => {
          setBusy(true);
          const { error: err } = await supabase.rpc('admin_extend_license', { p_license_id: license.id, p_days: parseInt(days, 10) });
          setBusy(false);
          if (err) setError(rpcErrorMessage(err)); else onDone(`Lisans ${days} gün uzatıldı.`);
        }}
      >{busy ? 'Kaydediliyor…' : 'Uzat'}</button>
    </>}>
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90, 365].map((d) => (
          <button key={d} onClick={() => setDays(String(d))} className={`rounded-[7px] border px-3 py-1.5 text-[14px] ${days === String(d) ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-700'}`}>
            {d === 365 ? '1 yıl' : `${d} gün`}
          </button>
        ))}
      </div>
      <div>
        <label className="label-field">Gün</label>
        <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} className="input-field" />
      </div>
      <p className="text-[14px] text-ink-500">Mevcut bitiş: {formatDate(license.ends_at)} → Yeni bitiş: <span className="font-medium text-ink-800">{formatDate(preview)}</span></p>
      {error && <Notice tone="red">{error}</Notice>}
    </Modal>
  );
}

function GrantDialog({ userId, plans, hasLicense, onClose, onDone }: { userId: string; plans: Plan[]; hasLicense: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [days, setDays] = useState('90');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Modal title="Manuel lisans tanımla" onClose={onClose} footer={<>
      <button onClick={onClose} className="btn-secondary">Vazgeç</button>
      <button
        disabled={busy}
        className="btn-primary"
        onClick={async () => {
          if (!reason.trim()) { setError('Açıklama zorunludur.'); return; }
          setBusy(true);
          const { error: err } = await supabase.rpc('admin_grant_license', { p_user_id: userId, p_plan_id: planId, p_days: parseInt(days, 10), p_reason: reason.trim() });
          setBusy(false);
          if (err) setError(rpcErrorMessage(err)); else onDone('Lisans tanımlandı.');
        }}
      >{busy ? 'Kaydediliyor…' : 'Lisans tanımla'}</button>
    </>}>
      <p className="text-[14px] text-ink-500">
        {hasLicense
          ? 'Kullanıcının mevcut aboneliği seçilen pakete geçirilir ve süresi girilen gün kadar uzatılır.'
          : 'Ödeme almadan yeni bir abonelik ve lisans açılır (ör. baro kampanyası, deneme süresi).'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Paket</label>
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="input-field">
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}{p.is_active ? '' : ' (pasif)'}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">Süre (gün)</label>
          <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} className="input-field" />
        </div>
      </div>
      <div>
        <label className="label-field">Açıklama</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Örn. Afyonkarahisar Barosu 3 ay ücretsiz kampanyası" className="input-field" />
      </div>
      {error && <Notice tone="red">{error}</Notice>}
    </Modal>
  );
}
