import { useState } from 'react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Hash, Copy, Check } from 'lucide-react';

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [barAssociation, setBarAssociation] = useState(profile?.bar_association || '');
  const [barRegistryNumber, setBarRegistryNumber] = useState(profile?.bar_registry_number || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copiedHashtag, setCopiedHashtag] = useState(false);

  const handleCopyHashtag = async () => {
    if (!profile?.hashtag) return;
    try {
      await navigator.clipboard.writeText(profile.hashtag);
      setCopiedHashtag(true);
      setTimeout(() => setCopiedHashtag(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    setSaved(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        bar_association: barAssociation,
        bar_registry_number: barRegistryNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      setError('Güncelleme sırasında bir hata oluştu.');
    } else {
      setSaved(true);
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Hesap</h1>
      <p className="mt-1 text-[16px] text-ink-500">Profil bilgilerinizi güncelleyin.</p>

      <form onSubmit={handleSave} className="mt-8 max-w-[480px] space-y-4">
        {/* Hashtag display */}
        {profile?.hashtag && (
          <div className="rounded-[10px] border border-ink-200 bg-ink-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-[14px] font-medium text-ink-500">
                  <Hash size={13} /> Hashtag Kodunuz
                </p>
                <p className="mt-1 font-mono text-[20px] font-semibold tracking-wider text-ink-950">
                  {profile.hashtag}
                </p>
                <p className="mt-1 text-[13px] text-ink-400">
                  Bu kodu paylaşarak hukuk bürolarının size katılma daveti göndermesini sağlayabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyHashtag}
                className="flex items-center gap-1.5 rounded-[6px] border border-ink-200 bg-white px-3 py-2 text-[14px] font-medium text-ink-600 hover:bg-ink-50"
              >
                {copiedHashtag ? <><Check size={13} className="text-emerald-600" /> Kopyalandı</> : <><Copy size={13} /> Kopyala</>}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="label-field">Ad Soyad</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label-field">E-posta</label>
          <input type="email" disabled value={profile?.email || ''} className="input-field cursor-not-allowed bg-ink-50 text-ink-400" />
        </div>
        <div>
          <label className="label-field">Telefon</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Baro</label>
            <input type="text" value={barAssociation} onChange={(e) => setBarAssociation(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-field">Baro Sicil No</label>
            <input type="text" value={barRegistryNumber} onChange={(e) => setBarRegistryNumber(e.target.value)} className="input-field" />
          </div>
        </div>

        {error && <p className="rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>}
        {saved && <p className="rounded-[7px] bg-emerald-50 px-3 py-2 text-[15px] text-emerald-700">Bilgiler güncellendi.</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </AccountLayout>
  );
}
