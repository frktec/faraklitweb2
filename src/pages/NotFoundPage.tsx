import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f3f3f3]">
      <header className="border-b border-[#d8d8d8] px-6 py-4"><div className="mx-auto max-w-6xl"><Logo /></div></header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16">
        <div>
          <p className="section-label">404</p>
          <h1 className="mt-4 font-serif text-[52px] font-normal tracking-[-0.045em] text-ink-950">Bu sayfa bulunamadı.</h1>
          <p className="mt-4 max-w-[520px] text-[16px] leading-6 text-ink-500">Bağlantı değişmiş veya sayfa kaldırılmış olabilir.</p>
          <Link to="/" className="btn-primary mt-7"><ArrowLeft size={15} /> Ana sayfaya dön</Link>
        </div>
      </main>
    </div>
  );
}
