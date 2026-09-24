import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, HardDrive, Package, RefreshCw, AlertCircle, CheckCircle2, ArrowUpRight, Coins, CalendarPlus, Repeat, Cpu } from 'lucide-react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate, formatNumber } from '@/lib/format';
import type { Subscription, License, Device, Plan, CreditWallet } from '@/types';

export function AccountOverview() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [jobsThisMonth, setJobsThisMonth] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    const userId = profile.id;

    (async () => {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', userId)
        .order('ends_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscription(sub as Subscription | null);

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [walletRes, jobsRes, pendingRes] = await Promise.all([
        supabase.from('credit_wallets').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', monthStart),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
      ]);
      setWallet(walletRes.data as CreditWallet | null);
      setJobsThisMonth(jobsRes.count || 0);
      setPendingOrders(pendingRes.count || 0);

      const { data: lic } = await supabase
        .from('licenses')
        .select('*, plan:plans(*)')
        .eq('user_id', userId)
        .order('ends_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLicense(lic as License | null);

      const { data: dev } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      setDevices((dev as Device[]) || []);

      const { data: pl } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setPlans((pl as Plan[]) || []);

      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <AccountLayout><div className="text-sm text-ink-400">Yükleniyor…</div></AccountLayout>;
  }

  // Skip professional titles such as "Av." so the greeting uses the first name.
  const firstName = (profile?.full_name || '')
    .split(/\s+/)
    .find((part) => part && !/^(av|stj|dr|prof|doç|arş|gör|uzm)\.?$/i.test(part)) || 'Kullanıcı';
  const planName = subscription?.plan?.name || 'Yok';
  const deviceLimit = subscription?.plan?.device_limit || 0;

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / 86400000))
    : 0;
  const totalDays = subscription
    ? Math.ceil((new Date(subscription.ends_at).getTime() - new Date(subscription.started_at).getTime()) / 86400000)
    : 365;
  const progressPct = subscription ? Math.min(100, ((totalDays - daysLeft) / totalDays) * 100) : 0;

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">
        Merhaba, {firstName}
      </h1>
      <p className="mt-1 text-[16px] text-ink-500">Hesap bilgilerinize genel bir bakış.</p>

      {pendingOrders > 0 && (
        <div className="mt-6 flex items-center gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertCircle size={15} className="shrink-0 text-amber-600" />
          <p className="text-[14px] text-amber-800">
            Ödemesi beklenen {pendingOrders} siparişiniz var. <Link to="/account/payments" className="font-semibold underline">Siparişlerimi gör</Link>
          </p>
        </div>
      )}

      {/* Active subscription card */}
      {subscription ? (
        <div className="mt-8 overflow-hidden rounded-[12px] border border-ink-200 bg-white">
          <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-ink-500" />
              <span className="text-[16px] font-semibold text-ink-900">Aktif Paketiniz</span>
            </div>
            <span className={`rounded-[5px] px-2 py-0.5 text-[13px] font-medium ${
              daysLeft > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {daysLeft > 0 ? 'Aktif' : 'Süresi Doldu'}
            </span>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[20px] font-semibold text-ink-950">{planName}</p>
                <p className="mt-1 text-[15px] text-ink-500">
                  {formatDate(subscription.started_at)} — {formatDate(subscription.ends_at)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[28px] font-semibold ${daysLeft <= 14 ? 'text-amber-600' : 'text-ink-950'}`}>
                  {daysLeft}
                </p>
                <p className="text-[14px] text-ink-400">gün kaldı</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 rounded-full bg-ink-100">
                <div
                  className={`h-2 rounded-full transition-all ${daysLeft <= 14 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Feature summary */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <FeatureChip icon={HardDrive} label="Cihaz" value={`${devices.length} / ${deviceLimit}`} />
              <FeatureChip icon={Calendar} label="Bitiş" value={formatDate(subscription.ends_at)} />
              <FeatureChip
                icon={RefreshCw}
                label="Otomatik Yenile"
                value={subscription.auto_renew ? 'Açık' : 'Kapalı'}
                accent={subscription.auto_renew ? 'emerald' : 'ink'}
              />
            </div>

            {daysLeft <= 14 && daysLeft > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle size={15} className="shrink-0 text-amber-600" />
                <p className="text-[14px] text-amber-700">
                  Lisansınızın süresi {daysLeft} gün içinde doluyor.
                  {subscription.auto_renew
                    ? ' Otomatik yenileme aktif olduğundan kesintisiz devam edecektir.'
                    : ' Otomatik yenilemeyi açabilir veya paketinizi yenileyebilirsiniz.'}
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/account/plan" className="btn-primary">
                <CalendarPlus size={15} />
                Süreyi Uzat
              </Link>
              <Link to="/account/plan" className="btn-secondary">
                <Repeat size={15} />
                Paket Değiştir
              </Link>
              <Link to="/account/billing" className="btn-secondary">
                Otomatik Yenileme
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-[12px] border border-ink-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-50">
            <Package size={24} className="text-ink-400" />
          </div>
          <p className="text-[16px] font-medium text-ink-800">Henüz aktif bir paketiniz yok</p>
          <p className="mt-1 text-[16px] text-ink-500">Hukuk büronuz için uygun paketi seçin.</p>
          <Link to="/account/plan" className="btn-primary mt-5">
            Paketleri İncele
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}

      {/* Quick stats grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Lisans Durumu"
          value={daysLeft > 0 ? 'Aktif' : 'Pasif'}
          color={daysLeft > 0 ? 'emerald' : 'ink'}
        />
        <Link to="/account/usage" className="block">
          <StatCard
            icon={Coins}
            label="Kredi Bakiyesi"
            value={formatNumber(wallet?.balance || 0)}
            color={(wallet?.balance || 0) < 50 && subscription ? 'amber' : 'ink'}
          />
        </Link>
        <StatCard
          icon={Calendar}
          label="Kalan Gün"
          value={daysLeft > 0 ? `${daysLeft}` : '—'}
          color={daysLeft <= 14 && daysLeft > 0 ? 'amber' : 'ink'}
        />
        <Link to="/account/usage" className="block">
          <StatCard icon={Cpu} label="Bu Ay Üretilen İş" value={formatNumber(jobsThisMonth)} color="ink" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/account/plan" className="btn-secondary">
          <Coins size={15} />
          Kredi Yükle
        </Link>
        <Link to="/account/usage" className="btn-ghost">
          Kullanım geçmişi
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {/* License key */}
      {license && (
        <div className="mt-8">
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Lisans Anahtarı</h2>
          <div className="rounded-[10px] border border-ink-200 bg-white p-4">
            <p className="font-mono text-[15px] text-ink-700">{license.license_key}</p>
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
                  <p className="text-[14px] text-ink-400">{d.platform === 'windows' ? 'Windows' : d.platform === 'macos' ? 'macOS' : 'Linux'} · {d.app_version || 'v1.0'}</p>
                </div>
                <span className="rounded-[5px] bg-emerald-50 px-2 py-0.5 text-[13px] text-emerald-700">Aktif</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available plans preview */}
      {plans.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[16px] font-semibold text-ink-900">Tüm Paketler</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className={`rounded-[10px] border p-4 ${
                subscription?.plan_id === plan.id ? 'border-emerald-300 bg-emerald-50/50' : 'border-ink-200 bg-white'
              }`}>
                <p className="text-[16px] font-semibold text-ink-900">{plan.name}</p>
                <p className="mt-1 text-[14px] text-ink-500">{plan.user_limit} kullanıcı · {plan.device_limit} cihaz</p>
                {subscription?.plan_id === plan.id && (
                  <span className="mt-2 inline-block rounded-[4px] bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-700">
                    Mevcut paketiniz
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

function FeatureChip({ icon: Icon, label, value, accent }: { icon: typeof HardDrive; label: string; value: string; accent?: 'emerald' | 'ink' }) {
  return (
    <div className="rounded-[8px] border border-ink-200 bg-ink-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-ink-400" />
        <span className="text-[13px] text-ink-500">{label}</span>
      </div>
      <p className={`mt-1 text-[15px] font-semibold ${accent === 'emerald' ? 'text-emerald-600' : 'text-ink-800'}`}>{value}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof HardDrive; label: string; value: string; color: 'emerald' | 'amber' | 'ink' }) {
  const colorMap = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    ink: 'text-ink-800',
  };
  return (
    <div className="rounded-[10px] border border-ink-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-ink-400" />
        <span className="text-[13px] text-ink-500">{label}</span>
      </div>
      <p className={`mt-2 text-[18px] font-semibold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
