import { useState } from 'react';
import { Modal, Notice } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { orderTypeLabel, rpcErrorMessage } from '@/lib/labels';
import type { Payment } from '@/types';

export type PaymentAction = 'complete' | 'failed' | 'cancelled' | 'refunded';

const copy: Record<PaymentAction, { title: string; body: string; button: string }> = {
  complete: {
    title: 'Ödemeyi onayla',
    body: 'Ödemenin hesabınıza geçtiğini doğruladıysanız onaylayın. Sipariş türüne göre lisans açılır veya uzatılır, krediler yüklenir ve fatura "ödendi" olarak oluşturulur.',
    button: 'Ödemeyi onayla',
  },
  failed: { title: 'Başarısız olarak işaretle', body: 'Sipariş başarısız olarak kapatılır. Lisans veya kredi tanımlanmaz.', button: 'Başarısız işaretle' },
  cancelled: { title: 'Siparişi iptal et', body: 'Bekleyen sipariş iptal edilir. Lisans veya kredi tanımlanmaz.', button: 'Siparişi iptal et' },
  refunded: {
    title: 'İade olarak işaretle',
    body: 'Fatura iptal edilir. Kredi paketi siparişlerinde yüklenen krediler geri alınır. Lisans siparişlerinde lisans otomatik kapatılmaz; gerekirse kullanıcı sayfasından askıya alın.',
    button: 'İade olarak işaretle',
  },
};

export function PaymentActionModal({ payment, action, onClose, onDone }: {
  payment: Payment;
  action: PaymentAction;
  onClose: () => void;
  onDone: () => void;
}) {
  const [provider, setProvider] = useState('havale');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    const { error: err } = action === 'complete'
      ? await supabase.rpc('complete_order_after_payment', {
        p_payment_id: payment.id,
        p_provider: provider,
        p_provider_payment_id: reference.trim(),
      })
      : await supabase.rpc('admin_set_payment_status', { p_payment_id: payment.id, p_status: action, p_note: note.trim() });
    setBusy(false);
    if (err) {
      setError(rpcErrorMessage(err));
      return;
    }
    onDone();
  };

  const c = copy[action];

  return (
    <Modal
      title={c.title}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="btn-secondary">Vazgeç</button>
        <button onClick={submit} disabled={busy} className="btn-primary">{busy ? 'İşleniyor…' : c.button}</button>
      </>}
    >
      <div className="rounded-[8px] bg-ink-50 px-3 py-2.5 text-[14px] text-ink-700">
        <p className="font-medium">{payment.order_number} · {formatPrice(payment.amount_cents)}</p>
        <p className="text-ink-500">{orderTypeLabel[payment.order_type]}{payment.plan?.name ? ` · ${payment.plan.name}` : ''}{payment.order_type === 'credits' ? ` · ${payment.credits} kredi` : ` · ${payment.periods} dönem`}</p>
      </div>
      <p className="text-[15px] text-ink-600">{c.body}</p>
      {action === 'complete' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Ödeme yöntemi</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="input-field">
              <option value="havale">Havale / EFT</option>
              <option value="kredi-karti">Kredi kartı</option>
              <option value="iyzico">iyzico</option>
              <option value="paytr">PayTR</option>
              <option value="param">Param</option>
              <option value="sipay">Sipay</option>
              <option value="garanti">Garanti BBVA Sanal POS</option>
              <option value="manuel">Diğer</option>
            </select>
          </div>
          <div>
            <label className="label-field">Referans / dekont no</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className="input-field" />
          </div>
        </div>
      ) : (
        <div>
          <label className="label-field">Not (isteğe bağlı)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input-field" />
        </div>
      )}
      {error && <Notice tone="red">{error}</Notice>}
    </Modal>
  );
}
