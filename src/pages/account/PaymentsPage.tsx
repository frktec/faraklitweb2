import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatPrice, formatDate } from '@/lib/format';
import type { Payment, Profile } from '@/types';

export function PaymentsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    supabase
      .from('payments')
      .select('*, plan:plans(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPayments((data as Payment[]) || []);
        setLoading(false);
      });
  }, [profile]);

  const downloadReceipt = (payment: Payment, userProfile: Profile | null) => {
    const date = formatDate(payment.created_at);
    const planName = payment.plan?.name || '—';
    const amount = formatPrice(payment.amount_cents);
    const userName = userProfile?.full_name || '—';
    const userEmail = userProfile?.email || '—';

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>Makbuz — ${payment.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #f4f4f4; padding: 40px; }
  .receipt { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: #0A1628; color: #fff; padding: 32px 40px; }
  .header h1 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }
  .header p { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 4px; }
  .body { padding: 32px 40px; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #EDF0F2; }
  .row:last-child { border-bottom: none; }
  .label { font-size: 13px; color: #667085; }
  .value { font-size: 13px; font-weight: 500; color: #0A1628; }
  .total { display: flex; justify-content: space-between; padding: 20px 0 8px; margin-top: 8px; border-top: 2px solid #0A1628; }
  .total .label { font-size: 15px; font-weight: 600; color: #0A1628; }
  .total .value { font-size: 20px; font-weight: 700; color: #0A1628; }
  .footer { padding: 24px 40px 32px; }
  .footer p { font-size: 11px; color: #8A95A3; line-height: 1.6; }
  .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 5px; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Faraklit</h1>
      <p>Ödeme Makbuzu</p>
    </div>
    <div class="body">
      <div class="row">
        <span class="label">Sipariş No</span>
        <span class="value">${payment.order_number}</span>
      </div>
      <div class="row">
        <span class="label">Tarih</span>
        <span class="value">${date}</span>
      </div>
      <div class="row">
        <span class="label">Müşteri</span>
        <span class="value">${userName}</span>
      </div>
      <div class="row">
        <span class="label">E-posta</span>
        <span class="value">${userEmail}</span>
      </div>
      <div class="row">
        <span class="label">Paket</span>
        <span class="value">${planName}</span>
      </div>
      <div class="row">
        <span class="label">Ödeme Yöntemi</span>
        <span class="value">${payment.provider || 'Kredi Kartı'}</span>
      </div>
      <div class="row">
        <span class="label">Durum</span>
        <span class="value"><span class="badge">${payment.status === 'completed' ? 'Tamamlandı' : payment.status === 'failed' ? 'Başarısız' : 'Beklemede'}</span></span>
      </div>
      <div class="total">
        <span class="label">Toplam</span>
        <span class="value">${amount}</span>
      </div>
    </div>
    <div class="footer">
      <p>Bu kayıt elektronik olarak oluşturulmuştur. Sorularınız için destek@faraklit.com adresine yazabilirsiniz.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `makbuz-${payment.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Ödemeler</h1>
      <p className="mt-1 text-[16px] text-ink-500">Ödeme geçmişiniz ve makbuzlarınız.</p>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-ink-400">Yükleniyor…</p>
        ) : payments.length === 0 ? (
          <div className="rounded-[10px] border border-ink-200 bg-white p-8 text-center">
            <p className="text-[16px] text-ink-500">Henüz ödeme bulunmuyor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-200 text-left">
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Sipariş No</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Tarih</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Paket</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Tutar</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Durum</th>
                  <th className="pb-2.5 pr-4 text-[14px] font-medium uppercase tracking-wider text-ink-400">Makbuz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {payments.map((p) => (
                  <tr key={p.id} className="text-[15px]">
                    <td className="py-3 pr-4 font-medium text-ink-800">{p.order_number}</td>
                    <td className="py-3 pr-4 text-ink-600">{formatDate(p.created_at)}</td>
                    <td className="py-3 pr-4 text-ink-600">{p.plan?.name || '—'}</td>
                    <td className="py-3 pr-4 text-ink-700">{formatPrice(p.amount_cents)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-[5px] px-2 py-0.5 text-[13px] ${
                        p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'failed' ? 'bg-red-50 text-red-700' :
                        'bg-ink-100 text-ink-600'
                      }`}>
                        {p.status === 'completed' ? 'Tamamlandı' : p.status === 'failed' ? 'Başarısız' : 'Beklemede'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {p.status === 'completed' ? (
                        <button
                          onClick={() => downloadReceipt(p, profile)}
                          className="flex items-center gap-1 text-[14px] font-medium text-ink-600 hover:text-ink-900"
                        >
                          <Download size={13} />
                          İndir
                        </button>
                      ) : (
                        <span className="text-[14px] text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
