import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError('Şifre sıfırlama bağlantısı gönderilemedi. Lütfen tekrar deneyin.');
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout
      title="Şifrenizi Sıfırlayın"
      subtitle="Hesabınıza bağlı e-posta adresine güvenli bir sıfırlama bağlantısı gönderelim."
      footer={<Link to="/login" className="font-medium text-ink-900 hover:underline">Giriş sayfasına dön</Link>}
    >
      {sent ? (
        <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-5">
          <MailCheck size={22} className="text-emerald-700" />
          <p className="mt-3 text-[16px] font-semibold text-emerald-900">Bağlantı gönderildi</p>
          <p className="mt-1 text-[14px] leading-5 text-emerald-800">
            {email} adresindeki bağlantıyı açarak yeni şifrenizi belirleyebilirsiniz.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="reset-email">E-posta</label>
            <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="ornek@avukat.com" />
          </div>
          {error && <p className="rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
