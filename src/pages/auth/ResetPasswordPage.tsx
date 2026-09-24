import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Şifre güncellenemedi. Sıfırlama bağlantısının süresi dolmuş olabilir.');
      return;
    }
    setDone(true);
  };

  return (
    <AuthLayout
      title="Yeni Şifre Belirleyin"
      subtitle="Faraklit hesabınız için yeni bir şifre oluşturun."
      footer={<Link to="/login" className="font-medium text-ink-900 hover:underline">Giriş sayfasına dön</Link>}
    >
      {done ? (
        <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><Check size={16} className="text-emerald-700" /></div>
          <p className="mt-3 text-[16px] font-semibold text-emerald-900">Şifreniz güncellendi.</p>
          <Link to="/login" className="mt-4 inline-flex text-[15px] font-semibold text-emerald-900 underline underline-offset-4">Giriş yap</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="new-password">Yeni Şifre</label>
            <input id="new-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>
          <div>
            <label className="label-field" htmlFor="new-password-confirm">Yeni Şifre Tekrar</label>
            <input id="new-password-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>
          {error && <p className="rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}</button>
        </form>
      )}
    </AuthLayout>
  );
}
