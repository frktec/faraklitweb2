import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Badge, Loading, Modal, Notice, Table, Td } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate, formatNumber, formatPrice } from '@/lib/format';
import { orderTypeLabel, paymentStatusLabel, rpcErrorMessage } from '@/lib/labels';
import { openReceipt } from '@/lib/documents';
import type { Payment } from '@/types';

export function PaymentsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Payment | null>(null);
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    const { data } = await supabase
      .from('payments')
      .select('*, plan:plans(*), credit_package:credit_packages(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setPayments((data as Payment[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const cancel = async () => {
    if (!cancelling) return;
    const { data, error } = await supabase.rpc('cancel_my_order', { p_payment_id: cancelling.id });
    setCancelling(null);
    if (error || data !== true) setMessage({ tone: 'red', text: rpcErrorMessage(error, 'Sipariş iptal edilemedi.') });
    else { setMessage({ tone: 'green', text: 'Sipariş iptal edildi.' }); load(); }
  };

  const hasPending = payments.some((p) => p.status === 'pending');

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Siparişler ve Ödemeler</h1>
      <p className="mt-1 text-[16px] text-ink-500">Tüm siparişleriniz, ödeme durumları ve makbuzlarınız.</p>

      {hasPending && (
        <div className="mt-6">
          <Notice tone="amber">
            Havale / EFT ile ödeme yapıyorsanız açıklama alanına sipariş numaranızı yazın. Ödemeniz onaylandığında lisansınız veya kredileriniz otomatik olarak tanımlanır.
          </Notice>
        </div>
      )}
      {message && <div className="mt-4"><Notice tone={message.tone}>{message.text}</Notice></div>}

      <div className="mt-8">
        {loading ? <Loading /> : (
          <Table head={['Sipariş No', 'Tarih', 'Tür', 'Kapsam', 'Tutar', 'Durum', '']} empty={payments.length === 0}>
            {payments.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium text-ink-900">{p.order_number}</Td>
                <Td>{formatDate(p.created_at)}</Td>
                <Td>{orderTypeLabel[p.order_type] || '—'}</Td>
                <Td>{p.order_type === 'credits' ? `${formatNumber(p.credits)} kredi` : `${p.plan?.name || '—'} · ${p.periods} dönem`}</Td>
                <Td>{formatPrice(p.amount_cents)}</Td>
                <Td><Badge tone={paymentStatusLabel[p.status].tone}>{paymentStatusLabel[p.status].label}</Badge></Td>
                <Td>
                  {p.status === 'completed' && (
                    <button onClick={() => openReceipt(p, profile)} className="flex items-center gap-1 text-[14px] font-medium text-ink-600 hover:text-ink-900">
                      <Download size={13} />Makbuz
                    </button>
                  )}
                  {p.status === 'pending' && (
                    <button onClick={() => setCancelling(p)} className="text-[14px] font-medium text-ink-500 hover:text-red-700">İptal et</button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {cancelling && (
        <Modal title="Siparişi iptal et" onClose={() => setCancelling(null)} footer={<>
          <button onClick={() => setCancelling(null)} className="btn-secondary">Vazgeç</button>
          <button onClick={cancel} className="btn-primary">İptal et</button>
        </>}>
          <p className="text-[15px] text-ink-600">
            {cancelling.order_number} numaralı siparişi iptal etmek istediğinize emin misiniz? Ödeme yaptıysanız iptal etmeyin, destek ekibimize yazın.
          </p>
        </Modal>
      )}
    </AccountLayout>
  );
}
