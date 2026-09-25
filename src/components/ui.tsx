import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Tone } from '@/lib/labels';

const toneClasses: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-accent-50 text-accent-700',
  neutral: 'bg-ink-100 text-ink-600',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-[5px] px-2 py-0.5 text-[13px] font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">{title}</h1>
        {description && <p className="mt-1 text-[16px] text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Loading() {
  return <div className="text-sm text-ink-400">Yükleniyor…</div>;
}

export function ErrorNote({ children = 'Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.' }: { children?: ReactNode }) {
  return <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{children}</p>;
}

export function Notice({ tone = 'green', children }: { tone?: 'green' | 'red' | 'amber'; children: ReactNode }) {
  const cls = tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800';
  return <p className={`rounded-[8px] px-3 py-2 text-[15px] ${cls}`}>{children}</p>;
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-ink-200 bg-ink-200 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function Metric({ label, value, hint, highlight }: { label: string; value: ReactNode; hint?: ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-5 ${highlight ? 'bg-amber-50' : 'bg-white'}`}>
      <p className="text-[13px] font-medium uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`mt-2 text-[22px] font-semibold tracking-tight ${highlight ? 'text-amber-700' : 'text-ink-950'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[13px] text-ink-400">{hint}</p>}
    </div>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-ink-900">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-ink-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50 text-left">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 text-[13px] font-medium uppercase tracking-wider text-ink-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {empty ? (
            <tr><td colSpan={head.length} className="px-4 py-8 text-center text-[15px] text-ink-400">Kayıt bulunmuyor.</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '', mono }: { children: ReactNode; className?: string; mono?: boolean }) {
  return <td className={`whitespace-nowrap px-4 py-3 text-[15px] text-ink-700 ${mono ? 'font-mono text-[13px]' : ''} ${className}`}>{children}</td>;
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="flex max-h-[calc(100vh-2rem)] w-full max-w-[460px] flex-col rounded-[12px] border border-ink-200 bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-ink-950">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700" aria-label="Kapat"><X size={18} /></button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-ink-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { key: T; label: string }[]; active: T; onChange: (key: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-ink-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[15px] font-medium transition-colors ${
            active === t.key ? 'border-ink-950 text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Minimal dependency-free vertical bar chart. */
export function BarChart({ data, format, height = 140 }: { data: { label: string; value: number }[]; format: (v: number) => string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[3px] bg-ink-800 transition-colors group-hover:bg-accent-600"
              style={{ height: `${Math.max(d.value > 0 ? 2 : 0, (d.value / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-ink-950 px-2 py-1 text-[12px] text-white group-hover:block">
              {d.label}: {format(d.value)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-ink-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Horizontal share bars, e.g. jobs per type. */
export function ShareBars({ rows, format }: { rows: { label: string; value: number; sub?: string }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-[14px]">
            <span className="text-ink-700">{r.label}</span>
            <span className="font-medium text-ink-900">{format(r.value)}{r.sub && <span className="ml-1.5 font-normal text-ink-400">{r.sub}</span>}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-ink-100">
            <div className="h-1.5 rounded-full bg-ink-800" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
