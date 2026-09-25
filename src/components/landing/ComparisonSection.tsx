import { useState, type ReactNode } from 'react';
import { BookCheck, Check, Globe2, Minus, Scale, ShieldCheck } from 'lucide-react';
import { AiBrandRow } from './AiBrands';

type Level = 'full' | 'partial' | 'none';
type Row = { name: string; note?: string; general: Level };
type Column = 'general' | 'faraklit';

// Faraklit covers every row; `general` is how general-purpose AI assistants compare.
const groups: { title: string; rows: Row[] }[] = [
  {
    title: 'Hukuki yazım ve bilgi',
    rows: [
      { name: 'Dilekçe yazma', note: 'Dosyadaki bilgilerle', general: 'partial' },
      { name: 'Sözleşme yazma', general: 'partial' },
      { name: 'İhtarname oluşturma', general: 'partial' },
      { name: 'İçtihat arama', note: 'Gerçek kararlar, kaynağıyla · uydurma karar yok', general: 'partial' },
      { name: 'Hukuki soru-cevap motoru', note: 'Türk mevzuatı ve içtihat', general: 'partial' },
    ],
  },
  {
    title: 'Akademik kaynaklar',
    rows: [
      { name: 'YÖK Tez araması', note: 'Ulusal Tez Merkezi', general: 'none' },
      { name: 'DergiPark makale araması', general: 'partial' },
      { name: 'TR Dizin taraması', note: 'Künye ve kaynak bağlantısıyla', general: 'none' },
    ],
  },
  {
    title: 'Çalışma biçimi',
    rows: [
      { name: 'Büronuzun kayıtlarının içinde çalışır', general: 'none' },
      { name: 'Dava dosyası bağlamı', note: 'Taraflar, evrak, geçmiş işlemler', general: 'partial' },
      { name: 'Türk hukuk pratiğine özel', general: 'partial' },
      { name: 'Ekip çalışması ve roller', general: 'partial' },
      { name: 'Faraklit ajanları', note: 'Tekrar eden işleri otomatikleştirir', general: 'partial' },
    ],
  },
  {
    title: 'Dosya ve süreler',
    rows: [
      { name: 'UETS tebligat eşleştirme', general: 'none' },
      { name: 'UYAP, DavaTek ve MakbuzTek uyumu', general: 'none' },
      { name: 'Süre hesabı, takvim ve görev', general: 'partial' },
      { name: 'Word ve UDF editörü', general: 'partial' },
    ],
  },
  {
    title: 'Ses',
    rows: [
      { name: 'Sesli asistan', note: 'Takvim ve dosyalarınıza bağlı', general: 'partial' },
      { name: 'Müvekkil görüşmesi kaydı', general: 'partial' },
    ],
  },
  {
    title: 'Belge ve iletişim',
    rows: [
      { name: 'Doküman imzalama', general: 'none' },
      { name: 'E-posta entegrasyonu', note: 'Yazışmalar dosyayla birlikte', general: 'partial' },
      { name: 'Kendi makbuz sağlayıcınıza erişim', note: 'Faraklit’ten çıkmadan', general: 'none' },
    ],
  },
  {
    title: 'Güvenlik ve veri',
    rows: [
      { name: 'KVKK veri maskeleme', general: 'none' },
      { name: 'Hassas veri erişim kaydı', general: 'partial' },
      { name: '256 bit şifreleme', note: 'Yetkisiz erişime kapalı', general: 'full' },
    ],
  },
  {
    title: 'Genişleme',
    rows: [
      { name: 'Uygulama içi web tarayıcısı', general: 'partial' },
      { name: 'Büronuza özel entegrasyonlar', general: 'partial' },
    ],
  },
];

const reasons = [
  {
    icon: Scale,
    title: 'Türk hukuku için geliştirildi',
    text: 'UYAP, UETS, usul süreleri ve Türk mevzuatı esas alınarak kurgulandı. Dilekçe, sözleşme ve ihtarname Türk hukuk pratiğine göre hazırlanır.',
  },
  {
    icon: ShieldCheck,
    title: 'Veriler yurt dışına aktarılmaz',
    text: 'Avukatlığın sır saklama yükümlülüğü gözetilerek geliştirildi. Müvekkillerinize ait kişisel ve hassas veriler yurt dışına aktarılmaz.',
  },
  {
    icon: BookCheck,
    title: 'Uydurma karar yok',
    text: 'Genel yapay zeka araçları zaman zaman var olmayan karar numaraları üretebilir. Faraklit’in içtihat araması yalnızca resmi kaynaklardaki gerçek kararları getirir; her sonuç esas ve karar numarasıyla, kaynağıyla birlikte gösterilir.',
  },
  {
    icon: Globe2,
    title: 'Yapay zekaya yalnızca maskeli veri',
    text: 'Güçlü yapay zeka modellerinden yararlanırken içerik önce maskelenir; sağlayıcılara kimliği belirleyen bilgi değil, maskelenmiş metin iletilir.',
  },
];

const allRows = groups.flatMap((g) => g.rows);
const count = (level: Level) => allRows.filter((r) => r.general === level).length;

// Shared hover treatment: marks brighten when their row or column is hovered.
const generalHover = 'transition-all duration-300 group-hover/row:border-anthracite/45 group-hover/row:bg-white';
const generalActive = 'border-anthracite/45 bg-white';

function GeneralMark({ level, active = false }: { level: Level; active?: boolean }) {
  const state = active ? generalActive : '';
  if (level === 'full') {
    return (
      <span title="Var" className={`flex h-7 w-7 items-center justify-center rounded-full border border-anthracite/30 text-anthracite ${generalHover} ${state}`}>
        <Check size={14} />
      </span>
    );
  }
  if (level === 'partial') {
    return (
      <span title="Kısmen" className={`flex h-7 w-7 items-center justify-center rounded-full border border-anthracite/20 ${generalHover} ${state}`}>
        <span className="h-3 w-3 rounded-full border border-[#8a8a8a] [background:linear-gradient(90deg,#8a8a8a_50%,transparent_50%)]" />
      </span>
    );
  }
  return (
    <span title="Yok" className={`flex h-7 w-7 items-center justify-center rounded-full border border-anthracite/10 text-[#b0b0b0] ${generalHover} ${active ? 'border-anthracite/30 bg-white text-[#8a8a8a]' : ''}`}>
      <Minus size={14} />
    </span>
  );
}

// Gold glow taken from the live wallpaper palette.
const faraklitGlow = 'scale-110 bg-anthracite-900 text-[#F3E3BE] shadow-[0_0_0_4px_rgba(196,164,108,0.22),0_0_20px_rgba(196,164,108,0.6)]';

function FaraklitMark({ active = false }: { active?: boolean }) {
  return (
    <span
      title="Var"
      className={`flex h-7 w-7 items-center justify-center rounded-full bg-anthracite text-white transition-all duration-300 group-hover/row:scale-110 group-hover/row:bg-anthracite-900 group-hover/row:text-[#F3E3BE] group-hover/row:shadow-[0_0_0_4px_rgba(196,164,108,0.22),0_0_20px_rgba(196,164,108,0.6)] ${active ? faraklitGlow : ''}`}
    >
      <Check size={14} />
    </span>
  );
}

// A column cell stretches over the row padding so a hovered column reads as one continuous band.
function ColumnCell({ column, active, onHover, children }: {
  column: Column;
  active: Column | null;
  onHover: (column: Column | null) => void;
  children: ReactNode;
}) {
  const on = active === column;
  const band = column === 'faraklit' ? 'bg-[rgba(196,164,108,0.14)]' : 'bg-anthracite/[0.045]';
  return (
    <div
      onMouseEnter={() => onHover(column)}
      onMouseLeave={() => onHover(null)}
      className={`-my-3.5 flex w-14 shrink-0 cursor-default items-center justify-center self-stretch py-3.5 transition-colors duration-300 ${on ? band : ''}`}
    >
      {children}
    </div>
  );
}

export function ComparisonSection() {
  const [column, setColumn] = useState<Column | null>(null);
  return (
    <section id="fark" className="border-b border-anthracite/10">
      <div className="mx-auto max-w-8xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[780px] text-center">
          <p className="inline-flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#6b6b6b]">
            <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
            Neden Faraklit
            <span className="accent-rule hidden sm:inline-block" aria-hidden="true" />
          </p>
          <h2 className="mt-7 font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.02em] text-anthracite sm:text-[50px]">
            Genel yapay zeka araçları yazar.
            <span className="block italic text-anthracite-700">Faraklit büronuzla birlikte çalışır.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[600px] text-[17px] leading-8 text-[#545454]">
            ChatGPT, Claude ve Gemini güçlü genel asistanlardır. Faraklit ise avukatlık bürosunun günlük işi ve Türk hukuku için kurgulandı.
          </p>
        </div>

        {/* Why Faraklit is different */}
        <div className="mx-auto mt-14 grid max-w-[1180px] gap-px overflow-hidden rounded-[24px] border border-anthracite/10 bg-anthracite/10 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group/reason bg-white/75 px-7 py-8 transition-colors duration-300 hover:bg-white">
              <Icon size={20} strokeWidth={1.6} className="text-anthracite transition-colors duration-300 group-hover/reason:text-[#A8853F]" />
              <p className="mt-5 font-serif text-[21px] leading-snug text-anthracite">{title}</p>
              <p className="mt-3 text-[14px] leading-6 text-[#5f5f5f]">{text}</p>
            </div>
          ))}
        </div>

        {/* Score */}
        <div className="mx-auto mt-12 flex max-w-[820px] flex-col items-stretch overflow-hidden rounded-[22px] border sm:flex-row border-anthracite/10 bg-white/70 text-center">
          <div
            onMouseEnter={() => setColumn('general')}
            onMouseLeave={() => setColumn(null)}
            className={`flex-1 px-5 py-5 transition-colors duration-300 ${column === 'general' ? 'bg-white' : ''}`}
          >
            <AiBrandRow className="mb-3 sm:flex-nowrap" />
            <p className="mt-1 font-serif text-[18px] text-anthracite sm:text-[22px]">
              {count('full')} tam · {count('partial')} kısmi
            </p>
          </div>
          <div
            onMouseEnter={() => setColumn('faraklit')}
            onMouseLeave={() => setColumn(null)}
            className={`flex flex-1 flex-col justify-center bg-anthracite px-5 py-5 transition-shadow duration-300 ${column === 'faraklit' ? 'shadow-[inset_0_0_0_1px_rgba(196,164,108,0.55),inset_0_0_42px_rgba(196,164,108,0.28)]' : ''}`}
          >
            <div className="mb-3 flex items-center justify-center gap-2.5">
              <img src="/assets/logos/faraklit-app-symbol-white.png" alt="" aria-hidden="true" width={195} height={192} className="h-[34px] w-auto" />
              <img src="/assets/logos/faraklit-wordmark-white.png" alt="Faraklit" width={939} height={199} className="h-auto w-[104px]" />
            </div>
            <p className="mt-1 font-serif text-[18px] text-white sm:text-[22px]">{allRows.length} / {allRows.length}</p>
          </div>
        </div>

        {/* Groups flow into two balanced columns on large screens */}
        <div className="mt-12 gap-6 lg:columns-2">
          {groups.map((group) => (
            <div
              key={group.title}
              className="mb-6 break-inside-avoid overflow-hidden rounded-[20px] border border-anthracite/10 bg-white/70 transition-[border-color,box-shadow] duration-300 hover:border-anthracite/25 hover:shadow-[0_28px_60px_-36px_rgba(35,36,38,0.35)]"
            >
              <div className="flex items-center gap-2 border-b border-anthracite/10 px-5 py-3.5 sm:px-6">
                <p className="flex-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a7a7a]">{group.title}</p>
                <ColumnCell column="general" active={column} onHover={setColumn}>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 ${column === 'general' ? 'text-anthracite' : 'text-[#9a9a9a]'}`}>Genel</p>
                </ColumnCell>
                <ColumnCell column="faraklit" active={column} onHover={setColumn}>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 ${column === 'faraklit' ? 'text-[#A8853F]' : 'text-anthracite'}`}>Faraklit</p>
                </ColumnCell>
              </div>
              <ul className="divide-y divide-anthracite/[0.07]">
                {group.rows.map((row) => (
                  <li key={row.name} className="group/row flex items-center gap-2 px-5 py-3.5 transition-colors duration-300 hover:bg-[rgba(196,164,108,0.07)] sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-anthracite transition-colors duration-300 group-hover/row:text-black">{row.name}</p>
                      {row.note && <p className="mt-0.5 text-[12px] text-[#8a8a8a] transition-colors duration-300 group-hover/row:text-[#6a6a6a]">{row.note}</p>}
                    </div>
                    <ColumnCell column="general" active={column} onHover={setColumn}>
                      <GeneralMark level={row.general} active={column === 'general'} />
                    </ColumnCell>
                    <ColumnCell column="faraklit" active={column} onHover={setColumn}>
                      <FaraklitMark active={column === 'faraklit'} />
                    </ColumnCell>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-[#6a6a6a]">
          <span className="inline-flex items-center gap-2"><GeneralMark level="full" />Var</span>
          <span className="inline-flex items-center gap-2"><GeneralMark level="partial" />Kısmen</span>
          <span className="inline-flex items-center gap-2"><GeneralMark level="none" />Yok</span>
        </div>

        <p className="mx-auto mt-8 max-w-[760px] text-center text-[12px] leading-5 text-[#8a8a8a]">
          Gemini, ChatGPT ve Claude sırasıyla Google, OpenAI ve Anthropic’in; UYAP, DavaTek ve MakbuzTek ilgili sahiplerinin markalarıdır; YÖK Tez, DergiPark ve TR Dizin ilgili kamu kurumlarının hizmetleridir.
          Karşılaştırma bu araçların genel amaçlı kullanımını esas alır; özellikleri sürüme ve plana göre değişebilir.
        </p>
      </div>
    </section>
  );
}
