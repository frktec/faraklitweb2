import { formatDate, formatPrice } from '@/lib/format';
import { orderTypeLabel, paymentStatusLabel } from '@/lib/labels';
import type { Invoice, Payment } from '@/types';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: #f4f4f4; padding: 40px; color: #232323; }
  .doc { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: #232323; color: #fff; padding: 28px 36px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 22px; font-weight: 600; }
  .header p { font-size: 13px; color: rgba(255,255,255,0.65); margin-top: 4px; }
  .body { padding: 28px 36px; }
  .row { display: flex; justify-content: space-between; gap: 24px; padding: 10px 0; border-bottom: 1px solid #F0F0F0; }
  .label { font-size: 13px; color: #707070; }
  .value { font-size: 13px; font-weight: 500; text-align: right; }
  .total { display: flex; justify-content: space-between; padding: 18px 0 4px; margin-top: 8px; border-top: 2px solid #232323; }
  .total .label { font-size: 15px; font-weight: 600; color: #232323; }
  .total .value { font-size: 20px; font-weight: 700; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #707070; margin: 20px 0 6px; }
  .footer { padding: 20px 36px 28px; font-size: 11px; color: #949494; line-height: 1.6; }
  @media print { body { background: #fff; padding: 0; } .doc { box-shadow: none; } }
`;

function row(label: string, value: unknown) {
  return `<div class="row"><span class="label">${esc(label)}</span><span class="value">${esc(value)}</span></div>`;
}

function openDocument(title: string, html: string) {
  const doc = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${baseStyles}</style></head><body>${html}</body></html>`;
  const blob = new Blob([doc], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function describePayment(payment: Pick<Payment, 'order_type' | 'periods' | 'credits'> & { plan?: { name: string } | null }) {
  if (payment.order_type === 'credits') return `${payment.credits} kredi`;
  const plan = payment.plan?.name || 'Faraklit lisansı';
  return `${plan} · ${payment.periods} dönem`;
}

export function openReceipt(payment: Payment, customer: { full_name?: string; email?: string } | null) {
  const status = paymentStatusLabel[payment.status]?.label || payment.status;
  const html = `
  <div class="doc">
    <div class="header"><div><h1>Faraklit</h1><p>Ödeme makbuzu</p></div><p>${esc(payment.order_number)}</p></div>
    <div class="body">
      ${row('Sipariş No', payment.order_number)}
      ${row('Tarih', formatDate(payment.paid_at || payment.created_at))}
      ${row('Müşteri', payment.billing?.name || customer?.full_name || '—')}
      ${row('E-posta', payment.billing?.email || customer?.email || '—')}
      ${row('Sipariş türü', orderTypeLabel[payment.order_type] || payment.order_type)}
      ${row('Kapsam', describePayment(payment))}
      ${row('Ödeme yöntemi', payment.provider && payment.provider !== 'pending-provider' ? payment.provider : '—')}
      ${row('Durum', status)}
      <div class="total"><span class="label">Toplam</span><span class="value">${esc(formatPrice(payment.amount_cents))}</span></div>
    </div>
    <div class="footer">Bu kayıt elektronik olarak oluşturulmuştur ve mali değeri olan fatura yerine geçmez. Sorularınız için destek@faraklit.com adresine yazabilirsiniz.</div>
  </div>`;
  openDocument(`makbuz-${payment.order_number}`, html);
}

export function openInvoice(invoice: Invoice, payment?: Pick<Payment, 'order_number' | 'order_type' | 'periods' | 'credits'> & { plan?: { name: string } | null }) {
  const status = invoice.status === 'paid' ? 'Ödendi' : invoice.status === 'void' ? 'İptal' : 'Düzenlendi';
  const html = `
  <div class="doc">
    <div class="header"><div><h1>Faraklit</h1><p>Fatura özeti</p></div><p>${esc(invoice.invoice_number)}</p></div>
    <div class="body">
      ${row('Fatura No', invoice.invoice_number)}
      ${row('Tarih', formatDate(invoice.created_at))}
      ${payment ? row('Sipariş No', payment.order_number) : ''}
      ${payment ? row('Kapsam', describePayment(payment)) : ''}
      ${row('Durum', status)}
      <h2>Fatura bilgileri</h2>
      ${row('Ad Soyad / Firma', invoice.billing_name || '—')}
      ${row('TCKN / VKN', invoice.billing_tax_id || '—')}
      ${row('Vergi dairesi', invoice.billing_tax_office || '—')}
      ${row('Adres', [invoice.billing_address, invoice.billing_city].filter(Boolean).join(', ') || '—')}
      ${row('Telefon', invoice.billing_phone || '—')}
      ${row('E-posta', invoice.billing_email || '—')}
      <div class="total"><span class="label">Toplam</span><span class="value">${esc(formatPrice(invoice.amount_cents))}</span></div>
    </div>
    <div class="footer">Bu belge bilgilendirme amaçlıdır. Resmî e-fatura / e-arşiv faturanız ayrıca e-posta adresinize gönderilir.</div>
  </div>`;
  openDocument(`fatura-${invoice.invoice_number}`, html);
}

export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Semicolon + BOM so Turkish Excel opens it correctly.
  const content = '﻿' + [header, ...rows].map((r) => r.map(cell).join(';')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
