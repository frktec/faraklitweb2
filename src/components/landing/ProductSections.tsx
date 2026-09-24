import { useState, useEffect } from 'react';
import { Search, FileText, BookOpen, ChevronDown, ArrowUpRight, Check } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export function ProductSections() {
  return (
    <section id="urun" className="border-b border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-8xl px-6 py-20 lg:py-28">
        {/* Section header */}
        <div className="mb-16 max-w-[600px]">
          <p className="section-label mb-4 text-ink-700">Tek sistem</p>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink-950 sm:text-[40px]">
            Hukuki çalışma, tek bir sistemde.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-500">
            Faraklit, farklı araçları yan yana koyan bir platform değil. Hukuk bürosunun çalışma
            biçimini tek bir sistem altında bütünleştiren bir çalışma ortamıdır.
          </p>
        </div>

        {/* 01 — AI */}
        <FeatureRow
          number="01"
          title="Dosyanızı okuyan Faraklit Asistan."
          accent
          description="Faraklit, üzerinde çalıştığınız dosyadaki belgeleri ve görevleri dikkate alarak sorularınıza dosyaya uygun yanıtlar verir."
          featureDetails={[
            { name: 'İçtihat araştırması', description: 'Yargıtay ve Danıştay kararları arasında dosyanızla en ilgili bölümleri bulur ve öne çıkarır.' },
            { name: 'Mevzuat taraması', description: 'İlgili kanun maddeleri ve yönetmelikler üzerinde dosya kapsamına göre tarama yapar, değişiklikleri işaret eder.' },
            { name: 'Dilekçe oluşturma', description: 'Dosyadaki bilgiler ve hukuki dayanaklardan yararlanarak ilk taslağı hazırlar; sonraki metinleri tercih ettiğiniz üsluba göre düzenler.' },
            { name: 'Dilekçe değerlendirme', description: 'Hazırlanan dilekçeyi hukuki açıdan inceler, eksik iddiaları ve güçlendirilebilecek bölümleri önerir.' },
            { name: 'Belge analizi', description: 'Dosyaya yüklenen belgeleri okur, özetler ve hukuki açıdan anlamlı bilgileri çıkarır.' },
          ]}
          preview={<AIPreview />}
        />

        {/* 02 — Research */}
        <FeatureRow
          number="02"
          title="Aradığınız kararı değil, aradığınız hukuki cevabı bulun."
          description="Sonuçları uzun bir liste hâlinde vermek yerine, kararların işinize yarayan bölümlerini öne çıkarır."
          preview={<ResearchPreview />}
          reversed
          dark
        />

        {/* 03 — Office Management */}
        <FeatureRow
          number="03"
          title="Dosyadan duruşmaya kadar her şey bir arada."
          description="Müvekkil, dosya, görev, duruşma, evrak ve UETS işlemlerini tek yerde toplar."
          preview={<OfficePreview />}
        />

        <DocumentHubSection />
      </div>
    </section>
  );
}

type FeatureDetail = { name: string; description: string };

function FeatureRow({
  number,
  title,
  description,
  features,
  featureDetails,
  preview,
  reversed,
  dark,
  accent,
}: {
  number: string;
  title: string;
  description: string;
  features?: string[];
  featureDetails?: FeatureDetail[];
  preview: React.ReactNode;
  reversed?: boolean;
  dark?: boolean;
  accent?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const bg = dark ? 'bg-ink-950' : '';
  const textColor = dark ? 'text-white' : 'text-ink-950';
  const descColor = dark ? 'text-ink-400' : 'text-ink-500';
  const dividerColor = dark ? 'border-ink-800' : 'border-ink-200';
  const numColor = dark ? 'text-ink-600' : 'text-ink-300';
  const itemTextColor = dark ? 'text-ink-300' : 'text-ink-700';
  const itemDescColor = dark ? 'text-ink-500' : 'text-ink-500';
  const arrowColor = dark ? 'text-ink-600' : 'text-ink-400';

  return (
    <div className={`mb-20 last:mb-0 ${bg} -mx-6 px-6 py-16 lg:py-20 lg:-mx-6 lg:px-6 rounded-none lg:rounded-[16px]`}>
      <div className={`grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 ${reversed ? 'lg:[direction:rtl]' : ''}`}>
        <div className={`[direction:ltr]`}>
          <p className={`text-[16px] font-medium ${numColor} mb-4`}>{number}</p>
          <h3 className={`text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px] ${accent ? 'hero-accent' : textColor}`}>
            {title}
          </h3>
          <p className={`mt-4 text-[16px] leading-relaxed ${descColor} max-w-[440px]`}>
            {description}
          </p>
          {featureDetails && (
            <div className="mt-6">
              <div className={`divide-y ${dividerColor} border-y ${dividerColor}`}>
                {featureDetails.map((f, i) => (
                  <div key={f.name}>
                    <button
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      className="flex w-full items-center justify-between py-2.5 text-left"
                    >
                      <span className={`text-[16px] ${itemTextColor}`}>{f.name}</span>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 transition-transform duration-200 ${arrowColor} ${openIndex === i ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openIndex === i && (
                      <p className={`pb-3 text-[16px] leading-relaxed ${itemDescColor} fade-in`}>
                        {f.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {features && !featureDetails && (
            <div className="mt-6">
              <div className={`divide-y ${dividerColor} border-y ${dividerColor}`}>
                {features.map((f) => (
                  <div key={f} className="flex items-center justify-between py-2.5">
                    <span className={`text-[16px] ${itemTextColor}`}>{f}</span>
                    <span className={`text-[16px] ${arrowColor}`}>→</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="[direction:ltr]">{preview}</div>
      </div>
    </div>
  );
}

function AIPreview() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1600),
      setTimeout(() => setStage(3), 2400),
      setTimeout(() => setStage(4), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="window-reveal overflow-hidden rounded-[12px] border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[15px] text-ink-500">
          <span className="font-medium text-ink-700">Faraklit Asistan</span>
          <span>·</span>
          <span>Dosya: Ahmet Yılmaz / Tazminat</span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {stage >= 1 && (
          <div className="slide-in-up">
            <p className="text-[15px] text-ink-400 mb-1.5">Soru</p>
            <p className="text-[16px] text-ink-700 font-medium">
              Bu dosyada kıdem tazminatı talebinin hukuki dayanağı nedir?
            </p>
          </div>
        )}
        {stage === 2 && (
          <div className="slide-in-up flex items-center gap-1.5 rounded-[8px] border border-ink-200 bg-ink-50 px-4 py-3">
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" />
            <span className="typing-dot-2 h-1.5 w-1.5 rounded-full bg-ink-400" />
            <span className="typing-dot-3 h-1.5 w-1.5 rounded-full bg-ink-400" />
          </div>
        )}
        {stage >= 3 && (
          <div className="slide-in-up">
            <div className="rounded-[8px] border border-ink-200 bg-ink-50 p-4">
              <p className="text-[16px] leading-relaxed text-ink-700">
                Dosyada davacı, 4857 sayılı İş Kanunu madde 117 kapsamında kıdem tazminatı talep
                etmektedir. Davacının işyerinde <span className="font-medium text-ink-950">5 yıl 3 ay</span> süreyle
                çalıştığı belgelerden anlaşılmaktadır.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['İş Sözleşmesi', 'Bordro', 'SGK Hizmet Dökümü'].map((s) => (
                  <span key={s} className="rounded-[5px] border border-ink-200 bg-white px-2 py-0.5 text-[15px] text-ink-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {stage >= 4 && (
          <div className="slide-in-up flex items-center gap-2 text-[15px] text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>3 belge analiz edildi</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ResearchPreview() {
  return (
    <div className="window-reveal overflow-hidden rounded-[12px] border border-ink-800 bg-ink-900 shadow-sm">
      <div className="border-b border-ink-800 bg-ink-950 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Search size={13} className="text-ink-500" />
          <span className="text-[15px] text-ink-400">İçtihat Araştırması</span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4 rounded-[8px] border border-ink-800 bg-ink-950 px-3 py-2.5">
          <p className="text-[15px] text-ink-300">"Kasten yaralama suçunda haksız tahrik indirimi"</p>
        </div>
        <div className="space-y-3">
          {[
            { num: '2023/12345', date: '15.03.2023', passage: 'Sanığın eyleminde haksız tahrik unsuru bulunduğu gözetilerek indirim uygulanması gerekir.' },
            { num: '2022/9876', date: '08.11.2022', passage: 'Mağdurun önceki davranışları haksız tahrik oluştursa da, sanığın tepkisinin oransız olduğu...' },
          ].map((r) => (
            <div key={r.num} className="rounded-[8px] border border-ink-800 bg-ink-900 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] font-medium text-ink-400">Yargıtay Ceza · {r.num}</span>
                <span className="text-[15px] text-ink-500">{r.date}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-300">
                ...{r.passage}...
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1 flex-1 rounded-full bg-ink-800">
                  <div className="h-1 rounded-full bg-accent-400" style={{ width: '85%' }} />
                </div>
                <span className="text-[14px] text-ink-500">85%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentHubSection() {
  const supportedFiles = ['Dilekçeler', 'Tebligatlar', 'Bilirkişi raporları', 'Duruşma tutanakları', 'Sözleşmeler ve ekler'];

  return (
    <section className="-mx-6 mt-20 overflow-hidden border-t border-ink-200 bg-[#f7f7f5] px-6 py-16 lg:mt-28 lg:rounded-[18px] lg:px-10 lg:py-20">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="section-label mb-5 text-ink-700">Dosya ekranı</p>
          <h2 className="max-w-[520px] font-serif text-[42px] font-normal leading-[1.06] tracking-[-0.035em] text-[#292823] sm:text-[52px]">
            Tüm belgeleri tek yerde toplayın
          </h2>
          <p className="mt-6 max-w-[500px] text-[16px] leading-relaxed text-ink-700">
            Dava dosyasına ait tüm evrakı — dilekçeler, tebligatlar, bilirkişi raporları ve duruşma tutanakları — güvenli bir alanda düzenleyin. Belgeler dosya kapsamına göre otomatik ilişkilendirilir.
          </p>

          <div className="mt-8">
            <p className="text-[15px] font-semibold uppercase tracking-[0.16em] text-ink-600">Desteklenen içerikler:</p>
            <ul className="mt-4 space-y-3">
              {supportedFiles.map((file) => (
                <li key={file} className="flex items-center gap-3 text-[16px] text-ink-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  {file}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => document.querySelector('#urun')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary mt-8 bg-[#292823] hover:bg-[#45443d]"
          >
            Hemen deneyin
            <ArrowUpRight size={15} />
          </button>
        </div>

        <DocumentHubPreview />
      </div>
    </section>
  );
}

function DocumentHubPreview() {
  const caseFile = {
    title: 'İş Mahkemesi · 2026/1234',
    subtitle: 'Ahmet Yılmaz / ABC Ltd. Şti.',
    documents: [
      { name: 'Dava dilekçesi', type: 'dilekce', status: 'Tamamlandı', date: '12.08.2026' },
      { name: 'Cevap dilekçesi', type: 'dilekce', status: 'Tamamlandı', date: '18.08.2026' },
      { name: 'Tebligat — İlk duruşma', type: 'tebligat', status: 'Tebliğ edildi', date: '20.08.2026' },
      { name: 'Kapalı tebligat — Tanık', type: 'tebligat', status: 'Kapalı', date: '22.08.2026' },
      { name: 'Bilirkişi raporu', type: 'rapor', status: 'Bekleniyor', date: '—' },
      { name: 'Duruşma tutanağı', type: 'tutanak', status: 'Tamamlandı', date: '27.08.2026' },
      { name: 'İstinaf itiraz dilekçesi', type: 'dilekce', status: 'Taslak', date: '—' },
    ],
  };

  const typeColors: Record<string, string> = {
    dilekce: 'bg-[#376ad1] text-white',
    tebligat: 'bg-[#d64830] text-white',
    rapor: 'bg-[#8b942d] text-white',
    tutanak: 'bg-[#6b5fa3] text-white',
  };

  const statusColors: Record<string, string> = {
    'Tamamlandı': 'text-emerald-600',
    'Taslak': 'text-blue-600',
    'Bekleniyor': 'text-ink-400',
    'Teblig edildi': 'text-emerald-600',
    'Kapalı': 'text-ink-400',
  };

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[18px] bg-[#293039] p-5 shadow-[0_20px_60px_rgba(31,37,43,0.18)] sm:min-h-[470px] sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(180,196,195,0.35),transparent_34%),linear-gradient(135deg,#506069,#252b30_65%)]" />
      <div className="absolute -left-10 bottom-[-80px] h-64 w-64 rounded-full bg-[#7e8f8d]/30 blur-3xl" />
      <div className="relative mx-auto max-w-[360px] rounded-[10px] border border-white/60 bg-white/90 p-5 shadow-2xl backdrop-blur-sm sm:max-w-[400px] sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[16px] font-semibold text-ink-800">{caseFile.title}</p>
            <p className="mt-1 text-[14px] text-ink-400">{caseFile.subtitle}</p>
          </div>
          <span className="rounded-[5px] bg-emerald-50 px-2 py-0.5 text-[14px] font-medium text-emerald-600">Aktif</span>
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 border-b border-ink-100 pb-2 text-[14px] font-medium uppercase tracking-wider text-ink-400">
            <span className="w-16">Tür</span>
            <span className="flex-1">Belge adı</span>
            <span className="w-20 text-right">Durum</span>
          </div>
          {caseFile.documents.map((doc) => (
            <div key={doc.name} className="flex items-center gap-2 text-[15px] text-ink-700">
              <span className={`flex h-5 w-16 items-center justify-center rounded-[4px] text-[13px] font-bold ${typeColors[doc.type] ?? 'bg-ink-200 text-ink-600'}`}>
                {doc.type.toUpperCase()}
              </span>
              <span className="flex flex-1 items-center gap-1.5 truncate">
                <FileText size={11} className="shrink-0 text-ink-400" />
                <span className="truncate">{doc.name}</span>
              </span>
              <span className={`w-20 text-right text-[14px] font-medium ${statusColors[doc.status] ?? 'text-ink-400'}`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute right-[7%] top-[18%] rounded-full border border-[#a8efd4] bg-[#eafff6] px-3 py-2 text-[15px] font-semibold text-[#15936b] shadow-lg sm:right-[10%] sm:px-4 sm:text-[16px]">
        7 belge
      </div>
      <div className="absolute bottom-[14%] right-[8%] rounded-full border border-[#dfe48d] bg-[#fbffd9] px-3 py-2 text-[15px] font-semibold text-[#858e21] shadow-lg sm:right-[12%] sm:px-4 sm:text-[16px]">
        Otomatik ilişkilendi
      </div>
    </div>
  );
}

function OfficePreview() {
  return (
    <div className="window-reveal overflow-hidden rounded-[12px] border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[15px] text-ink-500">
          <span className="font-medium text-ink-700">Dosya Yönetimi</span>
          <span>·</span>
          <span>Ahmet Yılmaz / İş Mahkemesi</span>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[16px] font-medium text-ink-800">İş Mahkemesi · 2026/1234</p>
            <p className="text-[15px] text-ink-400">Davacı: Ahmet Yılmaz · Karşı Taraf: ABC Ltd.</p>
          </div>
          <span className="rounded-[5px] bg-ink-100 px-2 py-0.5 text-[15px] text-ink-600">Aktif</span>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: FileText, label: 'Dilekçe Hazırlama', status: 'Tamamlandı', date: '12.08.2026' },
            { icon: BookOpen, label: 'İçtihat Araştırması', status: 'Devam ediyor', date: '14.08.2026' },
            { icon: Search, label: 'Duruşma', status: '27.08.2026 10:00', date: '27.08.2026' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-[8px] border border-ink-200 px-3 py-2.5">
              <item.icon size={14} className="text-ink-400" />
              <span className="flex-1 text-[15px] text-ink-700">{item.label}</span>
              <span className="text-[15px] text-ink-400">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
