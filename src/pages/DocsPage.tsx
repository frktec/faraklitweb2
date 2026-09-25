import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileStack, KeyRound, Mail, Search, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LiveWallpaper } from '@/components/landing/LiveWallpaper';

const sections = [
  { icon: KeyRound, title: 'Hesap ve lisans', body: 'Hesap oluşturma, lisansı etkinleştirme, cihaz yönetimi ve ekip erişimi.' },
  { icon: FileStack, title: 'Dosya yönetimi', body: 'Dosya oluşturma, evrak ekleme, dosyanın aşamalarını izleme ve görevleri takip etme.' },
  { icon: Search, title: 'İçtihat araştırması', body: 'Sorunuzu günlük dille yazarak karar arama, ilgili bölümleri inceleme ve dosyaya ekleme.' },
  { icon: Mail, title: 'UETS', body: 'Tebligatları içe aktarma, dosyayla eşleştirme, süreyi takip etme ve görev oluşturma.' },
  { icon: BookOpen, title: 'Dilekçe ve Faraklit Asistan', body: 'Dosyadaki bilgilerden yararlanarak dilekçe taslağı hazırlama ve mevcut metni geliştirme.' },
  { icon: ShieldCheck, title: 'Güvenlik', body: 'Rol bazlı erişim, veri koruma yaklaşımı ve hesap güvenliği.' },
];

export function DocsPage() {
  return (
    <div className="relative isolate min-h-screen">
      <LiveWallpaper />
      <header className="border-b border-[#d8d8d8]">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-6">
          <Logo />
          <Link to="/account/support" className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink-600 hover:text-ink-950"><ArrowLeft size={14} /> Desteğe dön</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
        <p className="section-label">Faraklit dokümantasyonu</p>
        <h1 className="mt-4 max-w-[720px] font-serif text-[48px] font-normal leading-[1.02] tracking-[-0.045em] text-ink-950">Faraklit’i kısa sürede kullanmaya başlayın.</h1>
        <p className="mt-5 max-w-[650px] text-[16px] leading-7 text-ink-500">Bu sayfada Faraklit’in temel bölümlerini ve sık kullanılan işlemleri bulabilirsiniz. Ayrıntılı kullanım kılavuzları ürün geliştikçe buraya eklenecek.</p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[14px] border border-[#d7d7d7] bg-[#d7d7d7] sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title} className="bg-white p-6">
              <section.icon size={18} className="text-[#4e4e4e]" strokeWidth={1.7} />
              <h2 className="mt-5 text-[16px] font-semibold text-ink-900">{section.title}</h2>
              <p className="mt-2 text-[14px] leading-5 text-ink-500">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[14px] bg-[#232323] p-7 text-white sm:p-9">
          <p className="text-[14px] font-semibold uppercase tracking-[0.15em] text-white/50">Destek</p>
          <h2 className="mt-3 font-serif text-[30px] font-normal tracking-[-0.03em]">Bir yerde takılırsanız bize ulaşın.</h2>
          <a href="mailto:destek@faraklit.com" className="mt-5 inline-flex text-[15px] font-semibold text-white underline underline-offset-4">destek@faraklit.com</a>
        </div>
      </main>
    </div>
  );
}
