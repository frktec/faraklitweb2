import { BookOpen, CalendarDays, Globe2, Inbox, Landmark, Mail, Mic, Scale, ScrollText, type LucideIcon } from 'lucide-react';

const stats = [
  { value: '14 milyon+', label: 'içtihat', detail: 'Anayasa Mahkemesi, Yargıtay, Danıştay' },
  { value: '800 bin+', label: 'akademik makale', detail: 'DergiPark ve TR Dizin' },
  { value: 'Güncel', label: 'Türk mevzuatı', detail: 'Resmi Gazete değişiklikleriyle' },
];

type Integration = { name: string; text: string; Icon: LucideIcon; tags?: string[] };

const integrations: Integration[] = [
  {
    name: 'İçtihat arama',
    text: '14 milyonu aşkın karar arasında arayın. Her sonuç esas ve karar numarası, kaynağıyla birlikte gelir.',
    Icon: Scale,
    tags: ['Anayasa Mahkemesi', 'Yargıtay', 'Danıştay'],
  },
  {
    name: 'Literatür arama',
    text: '800 binden fazla akademik makalede arama yapın, künyesiyle dilekçenize ekleyin.',
    Icon: BookOpen,
    tags: ['DergiPark', 'TR Dizin'],
  },
  {
    name: 'Mevzuat',
    text: 'Türk hukuk mevzuatına dosyanızdan ayrılmadan ulaşın; Resmi Gazete’deki günlük değişiklikleri görün.',
    Icon: ScrollText,
    tags: ['Kanun ve yönetmelik', 'Resmi Gazete'],
  },
  {
    name: 'E-posta',
    text: 'Posta hesabınızı bağlayın; müvekkil ve karşı taraf yazışmaları ilgili dosyayla birlikte dursun.',
    Icon: Mail,
    tags: ['Gmail', 'Outlook', 'Kurumsal posta'],
  },
  {
    name: 'UYAP',
    text: 'Evrakı dosyaya alın, görev ve süreyle ilişkilendirin.',
    Icon: Landmark,
  },
  {
    name: 'UETS',
    text: 'Tebligatı eşleştirin, son günü takip edin.',
    Icon: Inbox,
  },
  {
    name: 'Sesli asistan',
    text: 'Dosya, takvim ve görevlerinize sesle ulaşın; not ve görev oluşturun.',
    Icon: Mic,
  },
  {
    name: 'Web tarayıcısı',
    text: 'Kaynaklara ve kurum sitelerine Faraklit içindeki tarayıcıdan erişin, bulduğunuzu dosyaya ekleyin.',
    Icon: Globe2,
  },
  {
    name: 'Takvim',
    text: 'Duruşma, görev ve süreleri tek takvimde birlikte izleyin.',
    Icon: CalendarDays,
  },
];

export function IntegrationsSection() {
  return (
    <section id="entegrasyonlar" className="border-b border-anthracite/10">
      <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-graphite-600">
              <span className="accent-rule" aria-hidden="true" />
              Entegrasyonlar
            </p>
            <h2 className="mt-6 max-w-[620px] font-serif text-[34px] font-normal leading-[1.12] tracking-[-0.02em] text-anthracite sm:text-[44px]">
              Kullandığınız sistemler ve kaynaklar Faraklit’te buluşsun.
            </h2>
          </div>
          <p className="max-w-[420px] text-[16px] leading-7 text-[#5f5f5f]">
            Karar, makale, mevzuat, e-posta ve UYAP aynı çalışma alanında. Aradığınızı bulun, doğrudan dosyanıza ekleyin.
          </p>
        </div>

        {/* Source coverage */}
        <div className="mt-12 grid overflow-hidden rounded-[24px] bg-anthracite text-white sm:grid-cols-3">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-7 py-8 sm:px-8 ${i > 0 ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''}`}>
              <p className="font-serif text-[40px] leading-none tracking-[-0.02em] text-[#F3E3BE] sm:text-[46px]">{s.value}</p>
              <p className="mt-3 text-[15px] font-semibold text-white">{s.label}</p>
              <p className="mt-1 text-[13px] text-white/55">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-[24px] border border-anthracite/10 bg-anthracite/10 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map(({ name, text, Icon, tags }) => (
            <div key={name} className="flex flex-col bg-white/75 px-6 py-7 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-anthracite/15 text-anthracite">
                  <Icon size={18} strokeWidth={1.6} />
                </span>
                <p className="font-serif text-[21px] leading-snug text-anthracite">{name}</p>
              </div>
              <p className="mt-4 text-[14.5px] leading-6 text-[#5f5f5f]">{text}</p>
              {tags && (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                  {tags.map((t) => (
                    <span key={t} className="rounded-full border border-anthracite/15 bg-white px-2.5 py-1 text-[12px] font-medium text-[#555]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-5 text-[12px] leading-5 text-[#8a8a8a]">
          UYAP, UETS, DergiPark, TR Dizin, Gmail ve Outlook ilgili kurum ve şirketlerin hizmetleri ve markalarıdır.
        </p>
      </div>
    </section>
  );
}
