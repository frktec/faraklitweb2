import type { CreditTransactionKind, License, OrderType, PaymentStatus } from '@/types';

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'neutral';

export const paymentStatusLabel: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Ödeme bekleniyor', tone: 'amber' },
  completed: { label: 'Tamamlandı', tone: 'green' },
  failed: { label: 'Başarısız', tone: 'red' },
  refunded: { label: 'İade edildi', tone: 'neutral' },
  cancelled: { label: 'İptal edildi', tone: 'neutral' },
};

export const orderTypeLabel: Record<OrderType, string> = {
  new: 'Yeni lisans',
  renewal: 'Süre uzatma',
  plan_change: 'Paket değişikliği',
  credits: 'Kredi paketi',
};

export const licenseStatusLabel: Record<License['status'], { label: string; tone: Tone }> = {
  active: { label: 'Aktif', tone: 'green' },
  suspended: { label: 'Askıda', tone: 'amber' },
  expired: { label: 'Süresi dolmuş', tone: 'red' },
  cancelled: { label: 'İptal', tone: 'neutral' },
};

export const invoiceStatusLabel: Record<'issued' | 'paid' | 'void', { label: string; tone: Tone }> = {
  issued: { label: 'Düzenlendi', tone: 'blue' },
  paid: { label: 'Ödendi', tone: 'green' },
  void: { label: 'İptal', tone: 'red' },
};

export const creditKindLabel: Record<CreditTransactionKind, string> = {
  purchase: 'Kredi satın alımı',
  plan_grant: 'Paket kredisi',
  usage: 'Kullanım',
  admin_grant: 'Yönetici tanımı',
  admin_deduct: 'Yönetici düzeltmesi',
  refund: 'İade',
};

/** A license whose end date has passed is shown as expired even if its row still says active. */
export function effectiveLicenseStatus(status: License['status'] | null, endsAt: string | null): License['status'] | null {
  if (!status) return null;
  if (status === 'active' && endsAt && new Date(endsAt).getTime() < Date.now()) return 'expired';
  return status;
}

const rpcErrors: Record<string, string> = {
  pos_keys_missing: 'Bu mod için API anahtarları kayıtlı değil. Önce anahtarları girin.',
  pos_disabled: 'Varsayılan yapmak için önce POS’u açın.',
  insufficient_credits: 'Kredi bakiyesi yetersiz.',
  no_active_license: 'Aktif lisans bulunamadı.',
  use_renewal_or_plan_change: 'Zaten aktif bir paketiniz var. Süre uzatma veya paket değişikliği seçin.',
  use_renewal: 'Zaten bu paketi kullanıyorsunuz. Süre uzatmayı seçin.',
  too_many_pending: 'Ödemesi bekleyen çok fazla siparişiniz var. Önce bekleyen siparişlerinizi tamamlayın veya iptal edin.',
};

const rpcMessages: [RegExp, string][] = [
  [/not authorized/i, 'Bu işlem için yetkiniz yok.'],
  [/payment is not pending/i, 'Bu sipariş artık beklemede değil.'],
  [/only pending payments/i, 'Yalnızca bekleyen siparişler bu duruma alınabilir.'],
  [/only completed payments/i, 'Yalnızca tamamlanmış ödemeler iade edilebilir.'],
  [/plan not found/i, 'Paket bulunamadı veya satışa kapalı.'],
  [/credit package not found/i, 'Kredi paketi bulunamadı veya satışa kapalı.'],
  [/no subscription/i, 'Uzatılacak bir aboneliğiniz bulunmuyor.'],
  [/reason is required/i, 'Açıklama zorunludur.'],
  [/days must be/i, 'Gün sayısı 1 ile 3650 arasında olmalıdır.'],
  [/insufficient credits/i, 'Kredi bakiyesi yetersiz.'],
];

export function rpcErrorMessage(err: unknown, fallback = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'): string {
  const e = err as { hint?: string; message?: string } | null;
  if (e?.hint && rpcErrors[e.hint]) return rpcErrors[e.hint];
  const match = rpcMessages.find(([re]) => re.test(e?.message || ''));
  return match ? match[1] : fallback;
}
