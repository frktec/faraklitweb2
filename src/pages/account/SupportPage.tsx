import { Link } from 'react-router-dom';
import { BookOpen, Mail } from 'lucide-react';
import { AccountLayout } from '@/components/account/AccountLayout';

export function SupportPage() {
  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Destek</h1>
      <p className="mt-1 text-[16px] text-ink-500">Kullanım kaynakları ve destek kanalı.</p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <BookOpen size={18} className="text-ink-500" />
          <h2 className="mt-4 text-[16px] font-semibold text-ink-900">Dokümantasyon</h2>
          <p className="mt-2 text-[15px] leading-6 text-ink-500">Hesap, lisans, dosya, UETS ve Faraklit Asistan hakkında yardım alabileceğiniz başlangıç noktası.</p>
          <Link to="/docs" className="text-link mt-4">Dokümantasyonu Aç →</Link>
        </div>

        <div className="card p-5">
          <Mail size={18} className="text-ink-500" />
          <h2 className="mt-4 text-[16px] font-semibold text-ink-900">E-posta Desteği</h2>
          <p className="mt-2 text-[15px] leading-6 text-ink-500">Teknik sorunlar, hesap ve lisans konuları için destek ekibine yazın.</p>
          <a href="mailto:destek@faraklit.com" className="text-link mt-4">destek@faraklit.com →</a>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h2 className="text-[16px] font-semibold text-ink-900">Sürüm</h2>
        <div className="mt-3 flex items-center justify-between border-t border-ink-200 pt-3">
          <span className="text-[15px] text-ink-500">Faraklit Web</span>
          <span className="text-[15px] font-medium text-ink-800">v1.0.0</span>
        </div>
      </div>
    </AccountLayout>
  );
}
