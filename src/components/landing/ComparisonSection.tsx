const rows = [
  {
    topic: 'Çalıştığı yer',
    general: 'Ayrı bir sohbet penceresinde çalışır; belgeleri ve bağlamı sohbete sizin eklemeniz gerekir.',
    faraklit: 'Büronuzun dosya, takvim ve tebligat kayıtlarının içinde çalışır.',
  },
  {
    topic: 'Dosya bağlamı',
    general: 'Taraflar, süreler ve evrak hakkında yalnızca sizin paylaştığınız kadarını bilir.',
    faraklit: 'Taraflar, esas numarası, evrak ve geçmiş işlemler dosyada hazırdır; yanıt bu kayda dayanır.',
  },
  {
    topic: 'UETS ve UYAP',
    general: 'Bu sistemlerle doğrudan bağlantısı yoktur.',
    faraklit: 'Tebligatı dosyayla eşleştirir, UYAP evrakını ilgili dosyaya alır.',
  },
  {
    topic: 'Süre ve takvim',
    general: 'Süreyi hesaplamanıza yardım edebilir; takvime ve göreve dönüştürmek size kalır.',
    faraklit: 'Süreyi tebliğ tarihine göre hesaplar, takvime ve göreve dönüştürür.',
  },
  {
    topic: 'Sonuç',
    general: 'Metin yanıt verir; sonucu kopyalayıp kendi sisteminize taşırsınız.',
    faraklit: 'Taslak, görev ve takvim kaydı doğrudan dosyaya bağlanır; iş kaldığı yerde kalır.',
  },
  {
    topic: 'Büro yapısı',
    general: 'Genel amaçlı bir çalışma alanı sunar.',
    faraklit: 'Avukat ve personel rolleriyle, büronuzun yapısına göre çalışır.',
  },
  {
    topic: 'Uzmanlık',
    general: 'Her konuda yardımcı olmak için tasarlanmış genel modellerdir.',
    faraklit: 'Türk hukuk pratiği için kurgulanmıştır: UYAP, UETS, usul süreleri ve içtihat kaynakları.',
  },
] as const;

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
          <p className="mx-auto mt-7 max-w-[660px] text-[17px] leading-8 text-[#545454]">
            Gemini, ChatGPT ve Claude güçlü, genel amaçlı asistanlardır; hemen her konuda metin üretirler.
            Faraklit ise bir avukatlık bürosunun günlük işi için kurgulandı: yanıtını dosyanızdan alır, sonucu dosyanıza işler.
          </p>
        </div>

        {/* Desktop: three-column comparison table */}
        <div className="mt-16 hidden overflow-hidden rounded-[24px] border border-anthracite/10 bg-white/70 lg:block">
          <div className="grid grid-cols-[0.7fr_1.15fr_1.15fr]">
            <div className="border-b border-anthracite/10 px-8 py-6" />
            <div className="border-b border-l border-anthracite/10 px-8 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a8a8a]">Genel yapay zekâ asistanları</p>
              <p className="mt-2 text-[15px] text-[#5a5a5a]">Gemini · ChatGPT · Claude</p>
            </div>
            <div className="border-b border-white/10 bg-anthracite px-8 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">Hukuk bürosu için</p>
              <p className="mt-2 font-serif text-[22px] text-white">Faraklit</p>
            </div>

            {rows.map((row, index) => {
              const last = index === rows.length - 1;
              return (
                <div key={row.topic} className="contents">
                  <div className={`px-8 py-6 ${last ? '' : 'border-b border-anthracite/10'}`}>
                    <p className="font-serif text-[18px] text-anthracite">{row.topic}</p>
                  </div>
                  <div className={`border-l border-anthracite/10 px-8 py-6 ${last ? '' : 'border-b'}`}>
                    <p className="text-[15px] leading-7 text-[#6a6a6a]">{row.general}</p>
                  </div>
                  <div className={`bg-anthracite px-8 py-6 ${last ? '' : 'border-b border-white/10'}`}>
                    <p className="text-[15px] leading-7 text-white/85">{row.faraklit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile and tablet: one card per topic */}
        <div className="mt-12 space-y-4 lg:hidden">
          {rows.map((row) => (
            <div key={row.topic} className="overflow-hidden rounded-[18px] border border-anthracite/10 bg-white/70">
              <p className="px-5 pt-5 font-serif text-[19px] text-anthracite">{row.topic}</p>
              <div className="px-5 pb-4 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a8a]">Genel asistanlar</p>
                <p className="mt-1.5 text-[15px] leading-7 text-[#6a6a6a]">{row.general}</p>
              </div>
              <div className="bg-anthracite px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Faraklit</p>
                <p className="mt-1.5 text-[15px] leading-7 text-white/85">{row.faraklit}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-[760px] text-center text-[12px] leading-5 text-[#8a8a8a]">
          Gemini, ChatGPT ve Claude sırasıyla Google, OpenAI ve Anthropic’in markalarıdır. Karşılaştırma bu araçların genel amaçlı
          sohbet kullanımını esas alır; özellikleri sürüme ve plana göre değişebilir.
        </p>
      </div>
    </section>
  );
}
