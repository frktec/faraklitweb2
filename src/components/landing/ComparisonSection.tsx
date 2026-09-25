import { Check, Minus } from 'lucide-react';

type Level = 'full' | 'partial' | 'none';

type Row = {
  topic: string;
  general: { level: Level; text: string };
  faraklit: string;
};

const groups: { title: string; rows: Row[] }[] = [
  {
    title: 'Çalışma biçimi',
    rows: [
      {
        topic: 'Çalıştığı yer',
        general: { level: 'none', text: 'Ayrı bir sohbet penceresinde çalışır; belgeleri ve bağlamı sohbete sizin eklemeniz gerekir.' },
        faraklit: 'Büronuzun dosya, takvim, tebligat ve müvekkil kayıtlarının içinde çalışır.',
      },
      {
        topic: 'Dosya bağlamı',
        general: { level: 'partial', text: 'Taraflar, süreler ve evrak hakkında yalnızca paylaştığınız kadarını bilir.' },
        faraklit: 'Taraflar, esas numarası, evrak ve geçmiş işlemler dosyada hazırdır; yanıt bu kayda dayanır.',
      },
      {
        topic: 'Uzmanlık',
        general: { level: 'partial', text: 'Her konuda yardımcı olmak için tasarlanmış genel modellerdir.' },
        faraklit: 'Türk hukuk pratiği için kurgulanmıştır: UYAP, UETS, usul süreleri ve içtihat kaynakları.',
      },
    ],
  },
  {
    title: 'Büro işleri',
    rows: [
      {
        topic: 'UETS ve UYAP',
        general: { level: 'none', text: 'Bu sistemlerle doğrudan bağlantısı yoktur.' },
        faraklit: 'Tebligatı dosyayla eşleştirir, UYAP evrakını ilgili dosyaya alır.',
      },
      {
        topic: 'Süre ve takvim',
        general: { level: 'partial', text: 'Süreyi hesaplamanıza yardım edebilir; takvime ve göreve dönüştürmek size kalır.' },
        faraklit: 'Süreyi tebliğ tarihine göre hesaplar, takvime ve göreve dönüştürür.',
      },
      {
        topic: 'Word ve UDF editörü',
        general: { level: 'partial', text: 'Metin üretir; UDF biçimiyle çalışmak için tasarlanmamıştır, metni kendi düzenleyicinize taşırsınız.' },
        faraklit: 'Word ve UYAP’ın UDF biçimindeki belgeleri Faraklit içinde açar, düzenler ve dosyaya kaydeder.',
      },
      {
        topic: 'Doküman imzalama',
        general: { level: 'none', text: 'Belge imzalama akışı sunmaz.' },
        faraklit: 'Hazırladığınız evrakı imzaya gönderir, imzalı sürümü dosyada saklar.',
      },
      {
        topic: 'E-posta',
        general: { level: 'partial', text: 'Bazı sürümlerde e-posta hesabına bağlanabilir; yazışmalar dava dosyasıyla eşleşmez.' },
        faraklit: 'E-posta entegrasyonuyla yazışmalar ilgili dosya ve müvekkille birlikte tutulur.',
      },
      {
        topic: 'Serbest meslek makbuzu',
        general: { level: 'none', text: 'Makbuz düzenlemez.' },
        faraklit: 'Makbuzu birkaç adımda keser; serbest meslek makbuzu sağlayıcılarıyla entegre çalışır.',
      },
      {
        topic: 'Ekip çalışması',
        general: { level: 'partial', text: 'Ekip planları sunar; dosya, görev ve rol yapısı büroya göre kurgulanmamıştır.' },
        faraklit: 'Avukat ve personel rolleri, görev dağılımı ve ortak dosyalarla ekip aynı sistemde çalışır.',
      },
    ],
  },
  {
    title: 'Ses',
    rows: [
      {
        topic: 'Sesli asistan',
        general: { level: 'partial', text: 'Sesli sohbet modu sunar; büronuzun takvimine ve dosyalarına bağlı değildir.' },
        faraklit: 'Duruşmanızı sorar, görev verirsiniz; yanıt ve kayıt doğrudan büronuzun verisinden gelir.',
      },
      {
        topic: 'Müvekkil görüşmesi kaydı',
        general: { level: 'partial', text: 'Görüşme kayıtları müvekkil ve dosya kaydınıza bağlanmaz.' },
        faraklit: 'Müvekkil görüşmelerini sesli kaydeder, ilgili müvekkil ve dosyayla birlikte saklar.',
      },
    ],
  },
  {
    title: 'Güvenlik ve veri',
    rows: [
      {
        topic: 'KVKK veri maskeleme',
        general: { level: 'none', text: 'Gönderdiğiniz metni olduğu gibi işler; kişisel verileri maskelemek size kalır.' },
        faraklit: 'Kişisel ve hassas verileri KVKK’ya uygun biçimde maskeler.',
      },
      {
        topic: 'Hassas veri kayıtları',
        general: { level: 'partial', text: 'Hassas verilerin büro içinde kim tarafından görüntülendiğini dosya bazında kayda almaz.' },
        faraklit: 'Hassas verilere yapılan erişimler kayıt altına alınır; kim, ne zaman, hangi dosya.',
      },
      {
        topic: 'Şifreleme ve erişim',
        general: { level: 'full', text: 'Veriler sağlayıcının altyapısında, sağlayıcının politikalarına göre şifrelenir.' },
        faraklit: 'Kayıtlar 256 bit şifrelenir; verilerinize yetki vermediğiniz hiç kimse erişemez.',
      },
    ],
  },
  {
    title: 'Genişleme',
    rows: [
      {
        topic: 'Web tarayıcısı',
        general: { level: 'partial', text: 'Web araması yapabilir; tarayıcı oturumu dosyalarınızla aynı çalışma alanında değildir.' },
        faraklit: 'Faraklit’in içinde bir web tarayıcısı bulunur; araştırma ve portal işlemleri uygulamadan çıkmadan yapılır.',
      },
      {
        topic: 'Özel entegrasyonlar',
        general: { level: 'partial', text: 'Genel bağlayıcılar sunar; büronuza özel entegrasyon geliştirilmez.' },
        faraklit: 'Büronuzun kullandığı sistemlere göre özel entegrasyonlar geliştirilir.',
      },
    ],
  },
];

const allRows = groups.flatMap((g) => g.rows);
const counts = {
  full: allRows.filter((r) => r.general.level === 'full').length,
  partial: allRows.filter((r) => r.general.level === 'partial').length,
  none: allRows.filter((r) => r.general.level === 'none').length,
};

const levelLabel: Record<Level, string> = { full: 'Var', partial: 'Kısmen', none: 'Yok' };

function GeneralMark({ level }: { level: Level }) {
  const base = 'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]';
  if (level === 'full') return <span className={`${base} bg-anthracite/10 text-anthracite`}><Check size={12} />{levelLabel.full}</span>;
  if (level === 'partial') {
    return (
      <span className={`${base} border border-anthracite/15 text-[#6a6a6a]`}>
        <span className="h-2.5 w-2.5 rounded-full border border-[#8a8a8a] [background:linear-gradient(90deg,#8a8a8a_50%,transparent_50%)]" />
        {levelLabel.partial}
      </span>
    );
  }
  return <span className={`${base} border border-anthracite/10 text-[#9a9a9a]`}><Minus size={12} />{levelLabel.none}</span>;
}

function FaraklitMark() {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-white px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-anthracite">
      <Check size={12} />
      Var
    </span>
  );
}

export function ComparisonSection() {
  return (
    <section id="fark" className="border-b border-anthracite/10">
      <div className="mx-auto max-w-8xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[820px] text-center">
          <p className="inline-flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#6b6b6b]">
            <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
            Neden Faraklit
            <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
          </p>
          <h2 className="mt-7 font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.02em] text-anthracite sm:text-[50px]">
            Genel yapay zekâ araçları yazar.
            <span className="block italic text-anthracite-700">Faraklit büronuzla birlikte çalışır.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-[680px] text-[17px] leading-8 text-[#545454]">
            Gemini, ChatGPT ve Claude güçlü, genel amaçlı asistanlardır; hemen her konuda metin üretirler.
            Faraklit ise bir avukatlık bürosunun günlük işi için kurgulandı: dosyadan tebligata, imzadan makbuza,
            sesli asistandan veri güvenliğine kadar bütün işi tek yerde toplar.
          </p>
        </div>

        {/* Summary strip */}
        <div className="mx-auto mt-14 grid max-w-[820px] grid-cols-2 overflow-hidden rounded-[20px] border border-anthracite/10 text-center">
          <div className="bg-white/70 px-5 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8a8a]">Genel yapay zekâ asistanları</p>
            <p className="mt-3 font-serif text-[30px] text-anthracite sm:text-[36px]">{counts.full} <span className="text-[16px] text-[#8a8a8a]">/ {allRows.length}</span></p>
            <p className="mt-1 text-[13px] text-[#6a6a6a]">{counts.partial} başlıkta kısmen, {counts.none} başlıkta yok</p>
          </div>
          <div className="bg-anthracite px-5 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Faraklit</p>
            <p className="mt-3 font-serif text-[30px] text-white sm:text-[36px]">{allRows.length} <span className="text-[16px] text-white/50">/ {allRows.length}</span></p>
            <p className="mt-1 text-[13px] text-white/70">Büronun ihtiyaç duyduğu her başlıkta</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[12px] text-[#6a6a6a]">
          <GeneralMark level="full" />
          <GeneralMark level="partial" />
          <GeneralMark level="none" />
        </div>

        {/* Desktop table */}
        <div className="mt-10 hidden overflow-hidden rounded-[24px] border border-anthracite/10 bg-white/70 lg:block">
          <div className="grid grid-cols-[0.62fr_1.19fr_1.19fr]">
            <div className="px-8 py-6" />
            <div className="border-l border-anthracite/10 px-8 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a8a8a]">Genel yapay zekâ asistanları</p>
              <p className="mt-2 text-[15px] text-[#5a5a5a]">Gemini · ChatGPT · Claude</p>
            </div>
            <div className="bg-anthracite px-8 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">Hukuk bürosu için</p>
              <p className="mt-2 font-serif text-[22px] text-white">Faraklit</p>
            </div>

            {groups.map((group) => (
              <div key={group.title} className="contents">
                <div className="col-span-2 border-t border-anthracite/10 bg-anthracite/[0.03] px-8 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7a7a7a]">{group.title}</p>
                </div>
                <div className="border-t border-white/10 bg-anthracite px-8 py-3" />

                {group.rows.map((row) => (
                  <div key={row.topic} className="contents">
                    <div className="border-t border-anthracite/10 px-8 py-5">
                      <p className="font-serif text-[18px] leading-snug text-anthracite">{row.topic}</p>
                    </div>
                    <div className="flex items-start gap-4 border-l border-t border-anthracite/10 px-8 py-5">
                      <div className="w-[92px] shrink-0 pt-0.5"><GeneralMark level={row.general.level} /></div>
                      <p className="text-[14px] leading-6 text-[#6a6a6a]">{row.general.text}</p>
                    </div>
                    <div className="flex items-start gap-4 border-t border-white/10 bg-anthracite px-8 py-5">
                      <div className="w-[64px] shrink-0 pt-0.5"><FaraklitMark /></div>
                      <p className="text-[14px] leading-6 text-white/85">{row.faraklit}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile and tablet */}
        <div className="mt-10 space-y-10 lg:hidden">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7a7a7a]">{group.title}</p>
              <div className="space-y-3">
                {group.rows.map((row) => (
                  <div key={row.topic} className="overflow-hidden rounded-[18px] border border-anthracite/10 bg-white/70">
                    <p className="px-5 pt-5 font-serif text-[19px] text-anthracite">{row.topic}</p>
                    <div className="px-5 pb-4 pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a8a]">Genel asistanlar</p>
                        <GeneralMark level={row.general.level} />
                      </div>
                      <p className="mt-2 text-[14px] leading-6 text-[#6a6a6a]">{row.general.text}</p>
                    </div>
                    <div className="bg-anthracite px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Faraklit</p>
                        <FaraklitMark />
                      </div>
                      <p className="mt-2 text-[14px] leading-6 text-white/85">{row.faraklit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-[760px] text-center text-[12px] leading-5 text-[#8a8a8a]">
          Gemini, ChatGPT ve Claude sırasıyla Google, OpenAI ve Anthropic’in markalarıdır. Karşılaştırma bu araçların genel amaçlı
          kullanımını esas alır; özellikleri sürüme ve plana göre değişebilir.
        </p>
      </div>
    </section>
  );
}
