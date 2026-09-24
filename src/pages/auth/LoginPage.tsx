import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Mail, Chrome } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'email' | 'sms'>('email');
  const [email, setEmail] = useState(() => localStorage.getItem('faraklit_login_email') || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('faraklit_login_email')));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    });

    if (error) {
      setError('Google ile giriş başlatılamadı. Lütfen tekrar deneyin.');
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('E-posta veya şifre hatalı.');
      setLoading(false);
      return;
    }

    if (remember) localStorage.setItem('faraklit_login_email', email);
    else localStorage.removeItem('faraklit_login_email');

    navigate('/account');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } });

    if (error) {
      setError('SMS gönderilemedi. Telefon numaranızı kontrol edin.');
      setLoading(false);
      return;
    }

    setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({ phone, token: otpCode, type: 'sms' });

    if (error) {
      setError('Doğrulama kodu hatalı veya süresi dolmuş.');
      setLoading(false);
      return;
    }

    navigate('/account');
  };

  return (
    <AuthLayout
      title="Giriş yap"
      subtitle="Faraklit hesabınıza giriş yapın."
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link to="/register" className="font-medium text-ink-900 hover:underline">
            Hesap oluştur
          </Link>
        </>
      }
    >
      {/* Mode toggle */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-[8px] border border-ink-200 bg-ink-50 p-1">
        <button
          type="button"
          onClick={() => { setMode('email'); setError(''); setOtpSent(false); }}
          className={`flex items-center justify-center gap-2 rounded-[6px] py-2 text-[15px] font-medium transition-colors ${
            mode === 'email' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500'
          }`}
        >
          <Mail size={14} />
          E-posta
        </button>
        <button
          type="button"
          onClick={() => { setMode('sms'); setError(''); setOtpSent(false); }}
          className={`flex items-center justify-center gap-2 rounded-[6px] py-2 text-[15px] font-medium transition-colors ${
            mode === 'sms' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500'
          }`}
        >
          <MessageSquare size={14} />
          SMS ile Giriş
        </button>
      </div>

      {mode === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="ornek@avukat.com"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-ink-300 text-ink-950 focus:ring-ink-400"
              />
              <span className="text-[15px] text-ink-600">E-postamı Hatırla</span>
            </label>
            <Link to="/forgot-password" className="text-[15px] text-ink-500 hover:text-ink-900">
              Şifremi unuttum
            </Link>
          </div>

          {error && (
            <p className="rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
      )}

      {/* Google login — visible in all modes */}
      <div className="mt-6">
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-ink-200" />
          <span className="mx-3 text-[14px] text-ink-400">veya</span>
          <div className="flex-grow border-t border-ink-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[8px] border border-ink-200 bg-white px-4 py-2.5 text-[16px] font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
        >
          <Chrome size={18} className="text-ink-600" />
          {googleLoading ? 'Google açılıyor…' : 'Google ile giriş yap'}
        </button>
      </div>

      {mode === 'sms' && !otpSent && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="phone">Telefon Numarası</label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="+90 5XX XXX XX XX"
            />
          </div>
          <p className="rounded-[7px] bg-ink-50 px-3 py-2 text-[14px] text-ink-500">
            Telefonunuza 6 haneli bir doğrulama kodu gönderilecektir.
          </p>
          {error && (
            <p className="rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Gönderiliyor…' : 'SMS Gönder'}
          </button>
        </form>
      )}

      {mode === 'sms' && otpSent && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="otp">Doğrulama Kodu</label>
            <input
              id="otp"
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="input-field text-center tracking-[0.3em]"
              placeholder="000000"
            />
          </div>
          <p className="text-center text-[14px] text-ink-500">
            {phone} numarasına gönderilen kodu girin.
          </p>
          {error && (
            <p className="rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Doğrulanıyor…' : 'Doğrula ve giriş yap'}
          </button>
          <button
            type="button"
            onClick={() => { setOtpSent(false); setError(''); }}
            className="w-full text-center text-[15px] text-ink-500 hover:text-ink-900"
          >
            Numarayı değiştir
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
