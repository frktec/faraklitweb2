import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [barAssociation, setBarAssociation] = useState('');
  const [barRegistryNumber, setBarRegistryNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [accountType, setAccountType] = useState<'individual' | 'organization'>('individual');

  const [orgName, setOrgName] = useState('');
  const [orgTaxId, setOrgTaxId] = useState('');
  const [orgTaxOffice, setOrgTaxOffice] = useState('');
  const [orgCity, setOrgCity] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgPhone, setOrgPhone] = useState('');

  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const isInviteFlow = !!inviteToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (!kvkkAccepted) {
      setError('KVKK ve kullanım koşullarını kabul etmelisiniz.');
      return;
    }
    if (accountType === 'organization' && !isInviteFlow && !orgName.trim()) {
      setError('Hukuk bürosu adı zorunludur.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          full_name: fullName,
          phone,
          bar_association: barAssociation,
          bar_registry_number: barRegistryNumber,
          account_type: isInviteFlow ? 'organization' : accountType,
          invite_token: inviteToken || '',
          org_name: isInviteFlow ? '' : orgName,
          org_tax_id: orgTaxId,
          org_tax_office: orgTaxOffice,
          org_city: orgCity,
          org_address: orgAddress,
          org_phone: orgPhone || phone,
        },
      },
    });

    if (signUpError) {
      setError(
        signUpError.message === 'User already registered'
          ? 'Bu e-posta adresi zaten kayıtlı.'
          : 'Kayıt sırasında bir hata oluştu.'
      );
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Kayıt sırasında bir hata oluştu.');
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      navigate('/account');
      return;
    }

    setRegistrationComplete(true);
  };

  if (registrationComplete) {
    return (
      <AuthLayout
        title="E-posta Adresinizi Doğrulayın"
        subtitle="Hesabınızı etkinleştirmek için e-posta adresinize gönderilen bağlantıyı açın."
        footer={
          <Link to="/login" className="font-medium text-ink-900 hover:underline">
            Giriş sayfasına dön
          </Link>
        }
      >
        <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-[15px] leading-6 text-emerald-800">
          <strong>{email}</strong> adresine doğrulama bağlantısı gönderildi. Doğrulama tamamlandığında profiliniz,
          varsa büro hesabınız veya ekip davetiniz güvenli biçimde hazırlanacaktır.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isInviteFlow ? 'Davetinizi Kabul Edin' : 'Hesap oluştur'}
      subtitle={
        isInviteFlow
          ? 'Ekibe katılmak için hesabınızı oluşturun.'
          : "Faraklit’i kullanmaya başlamak için hesabınızı oluşturun."
      }
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-medium text-ink-900 hover:underline">
            Giriş yap
          </Link>
        </>
      }
    >
      {isInviteFlow && (
        <div className="mb-5 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] text-emerald-800">
          Bir ekip daveti aldınız. Kayıt olduktan sonra otomatik olarak ekibe ekleneceksiniz.
        </div>
      )}

      {!isInviteFlow && (
        <div className="grid grid-cols-2 gap-2 rounded-[8px] border border-ink-200 bg-ink-50 p-1">
          <button
            type="button"
            onClick={() => setAccountType('individual')}
            className={`rounded-[6px] py-2 text-[15px] font-medium transition-colors ${
              accountType === 'individual' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500'
            }`}
          >
            Bireysel Kullanıcı
          </button>
          <button
            type="button"
            onClick={() => setAccountType('organization')}
            className={`rounded-[6px] py-2 text-[15px] font-medium transition-colors ${
              accountType === 'organization' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500'
            }`}
          >
            Hukuk Bürosu / Ekip
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label-field" htmlFor="fullName">Ad Soyad</label>
          <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="Av. Ahmet Yılmaz" />
        </div>
        <div>
          <label className="label-field" htmlFor="email">E-posta</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="ornek@avukat.com" />
        </div>
        <div>
          <label className="label-field" htmlFor="phone">Telefon</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+90 5XX XXX XX XX" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field" htmlFor="bar">Baro</label>
            <input id="bar" type="text" value={barAssociation} onChange={(e) => setBarAssociation(e.target.value)} className="input-field" placeholder="İstanbul Barosu" />
          </div>
          <div>
            <label className="label-field" htmlFor="barReg">Baro Sicil No</label>
            <input id="barReg" type="text" value={barRegistryNumber} onChange={(e) => setBarRegistryNumber(e.target.value)} className="input-field" placeholder="12345" />
          </div>
        </div>

        {accountType === 'organization' && !isInviteFlow && (
          <div className="space-y-4 rounded-[8px] border border-ink-200 bg-ink-50/50 p-4">
            <h3 className="text-[16px] font-semibold text-ink-900">Hukuk Bürosu Bilgileri</h3>
            <div>
              <label className="label-field" htmlFor="orgName">Büro Adı *</label>
              <input id="orgName" type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input-field" placeholder="Yılmaz Hukuk Bürosu" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field" htmlFor="orgTaxId">Vergi No</label>
                <input id="orgTaxId" type="text" value={orgTaxId} onChange={(e) => setOrgTaxId(e.target.value)} className="input-field" placeholder="1234567890" />
              </div>
              <div>
                <label className="label-field" htmlFor="orgTaxOffice">Vergi Dairesi</label>
                <input id="orgTaxOffice" type="text" value={orgTaxOffice} onChange={(e) => setOrgTaxOffice(e.target.value)} className="input-field" placeholder="Beşiktaş V.D." />
              </div>
            </div>
            <div>
              <label className="label-field" htmlFor="orgCity">İl</label>
              <input id="orgCity" type="text" value={orgCity} onChange={(e) => setOrgCity(e.target.value)} className="input-field" placeholder="İstanbul" />
            </div>
            <div>
              <label className="label-field" htmlFor="orgAddress">Adres</label>
              <input id="orgAddress" type="text" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} className="input-field" placeholder="Levent, İstanbul" />
            </div>
            <div>
              <label className="label-field" htmlFor="orgPhone">Büro Telefonu</label>
              <input id="orgPhone" type="tel" value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} className="input-field" placeholder="+90 212 XXX XX XX" />
            </div>
          </div>
        )}

        <div>
          <label className="label-field" htmlFor="password">Şifre</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
        </div>
        <div>
          <label className="label-field" htmlFor="passwordConfirm">Şifre Tekrar</label>
          <input id="passwordConfirm" type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="input-field" placeholder="••••••••" />
        </div>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={kvkkAccepted}
            onChange={(e) => setKvkkAccepted(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-ink-300 text-ink-950 focus:ring-ink-400"
          />
          <span className="text-[14px] text-ink-500">
            KVKK aydınlatma metnini ve kullanım koşullarını okudum, kabul ediyorum.
          </span>
        </label>

        {error && (
          <p className="rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
        </button>
      </form>
    </AuthLayout>
  );
}
