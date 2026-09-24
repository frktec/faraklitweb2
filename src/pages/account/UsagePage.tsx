import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Badge, Loading, Metric, MetricGrid, ShareBars, Table, Tabs, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDateTime, formatNumber } from '@/lib/format';
import { creditKindLabel } from '@/lib/labels';
import type { CreditTransaction, CreditWallet, Job, JobType } from '@/types';

type TabKey = 'jobs' | 'credits' | 'prices';

export function UsagePage() {
  const { profile } = useAuth();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [tx, setTx] = useState<CreditTransaction[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [types, setTypes] = useState<JobType[]>([]);
  const [tab, setTab] = useState<TabKey>('jobs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    (async () => {
      const [w, t, j, jt] = await Promise.all([
        supabase.from('credit_wallets').select('*').eq('user_id', profile.id).maybeSingle(),
        supabase.from('credit_transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('jobs').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('job_types').select('*').eq('is_active', true).order('sort_order'),
      ]);
      setWallet(w.data as CreditWallet | null);
      setTx((t.data as CreditTransaction[]) || []);
      setJobs((j.data as Job[]) || []);
      setTypes((jt.data as JobType[]) || []);
      setLoading(false);
    })();
  }, [profile]);

  const labels = useMemo(() => Object.fromEntries(types.map((t) => [t.key, t.label])), [types]);

  const month = useMemo(() => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthJobs = jobs.filter((j) => new Date(j.created_at) >= start);
    const byType: Record<string, number> = {};
    for (const j of monthJobs) byType[j.job_type] = (byType[j.job_type] || 0) + j.quantity;
    return {
      jobs: monthJobs.reduce((s, j) => s + j.quantity, 0),
      credits: monthJobs.reduce((s, j) => s + j.credits_used, 0),
      byType: Object.entries(byType).sort((a, b) => b[1] - a[1]),
    };
  }, [jobs]);

  if (loading) return <AccountLayout><Loading /></AccountLayout>;

  const balance = wallet?.balance || 0;

  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Kredi ve Kullanım</h1>
          <p className="mt-1 text-[16px] text-ink-500">Faraklit'te ürettiğiniz işler ve kredi hareketleriniz.</p>
        </div>
        <Link to="/account/plan" className="btn-primary"><Coins size={15} />Kredi yükle</Link>
      </div>

      <div className="mt-8">
        <MetricGrid>
          <Metric label="Kredi bakiyesi" value={formatNumber(balance)} highlight={balance < 50} hint={balance < 50 ? 'Bakiyeniz azalıyor' : undefined} />
          <Metric label="Bu ay üretilen iş" value={formatNumber(month.jobs)} />
          <Metric label="Bu ay harcanan kredi" value={formatNumber(month.credits)} />
          <Metric label="Toplam harcanan" value={formatNumber(wallet?.lifetime_spent || 0)} />
        </MetricGrid>
      </div>

      {month.byType.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink-900">Bu ay iş dağılımı</h2>
          <ShareBars rows={month.byType.map(([k, v]) => ({ label: labels[k] || k, value: v }))} format={formatNumber} />
        </div>
      )}

      <div className="mt-8">
        <Tabs<TabKey> active={tab} onChange={setTab} tabs={[
          { key: 'jobs', label: 'İş geçmişi' },
          { key: 'credits', label: 'Kredi hareketleri' },
          { key: 'prices', label: 'İş başına kredi' },
        ]} />
      </div>

      <div className="mt-6">
        {tab === 'jobs' && (
          <Table head={['Tarih', 'İş türü', 'Durum', 'Adet', 'Kredi']} empty={jobs.length === 0}>
            {jobs.map((j) => (
              <tr key={j.id}>
                <Td className="text-ink-500">{formatDateTime(j.created_at)}</Td>
                <Td>{labels[j.job_type] || j.job_type}</Td>
                <Td>{j.status === 'completed' ? <Badge tone="green">Tamamlandı</Badge> : <Badge tone="red">Başarısız</Badge>}</Td>
                <Td>{j.quantity}</Td>
                <Td>{formatNumber(j.credits_used)}</Td>
              </tr>
            ))}
          </Table>
        )}
        {tab === 'credits' && (
          <Table head={['Tarih', 'Tür', 'Açıklama', 'Miktar', 'Bakiye']} empty={tx.length === 0}>
            {tx.map((t) => (
              <tr key={t.id}>
                <Td className="text-ink-500">{formatDateTime(t.created_at)}</Td>
                <Td>{creditKindLabel[t.kind]}</Td>
                <Td className="max-w-[260px] truncate">{t.description || '—'}</Td>
                <Td className={t.amount > 0 ? 'font-medium text-emerald-700' : 'font-medium'}>{t.amount > 0 ? '+' : ''}{formatNumber(t.amount)}</Td>
                <Td>{formatNumber(t.balance_after)}</Td>
              </tr>
            ))}
          </Table>
        )}
        {tab === 'prices' && (
          <>
            <Table head={['İş türü', 'Kredi']}>
              {types.map((t) => (
                <tr key={t.key}>
                  <Td>{t.label}</Td>
                  <Td>{t.credit_cost === 0 ? 'Ücretsiz' : formatNumber(t.credit_cost)}</Td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-[14px] text-ink-400">Başarısız işlerden kredi düşülmez. İş kayıtlarında yalnızca iş türü ve kredi bilgisi tutulur; belge içeriği saklanmaz.</p>
          </>
        )}
      </div>
    </AccountLayout>
  );
}
