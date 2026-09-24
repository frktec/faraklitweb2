const capabilities = [
  ['01', 'Dosya Yönetimi', 'Evrak, görev, duruşma ve notları aynı dosyada yönetin; ilk derece, istinaf ve temyiz bağlantısını koruyun.'],
  ['02', 'UETS ve Süreler', 'Tebligatı dosyayla eşleştirin, son günü görün; barkod kontrolüyle mükerrer kaydı önleyin.'],
  ['03', 'İçtihat Araştırması', 'Sorunuzu yazın; ilgili kararlar ve önemli pasajlar birlikte öne çıksın.'],
  ['04', 'Dilekçe', 'Dosyadaki bilgilerle ilk taslağı hazırlayın, ilgili kararı metne ekleyin.'],
  ['05', 'Takvim ve Görevler', 'Günün işlerini, duruşmaları ve yaklaşan süreleri tek listede izleyin.'],
  ['06', 'Evrak İmzalama', 'Hazırladığınız evrakı imzaya gönderin, imzalı sürümü dosyada saklayın.'],
  ['07', 'Faraklit Asistan', 'Dosya, mevzuat ve içtihat birlikte taranır; yanıt tek yerde hazırlanır.'],
  ['08', 'Ekip Çalışması', 'Avukat ve personel rolleriyle büronuzu aynı sistemde yönetin.'],
] as const;

const exchanges = [
  {
    question: 'Bugün hangi duruşmalarım var?',
    answer: 'Bugün 3 duruşmanız var. İlki 10.20’de Afyonkarahisar 2. İş Mahkemesinde.',
  },
  {
    question: 'Yarın 10.00 için cevap dilekçesi görevi ekle.',
    answer: 'Görev oluşturuldu: “Cevap dilekçesini hazırla”, yarın 10.00.',
  },
] as const;

export function ProductSection() {
  return (
    <section id="urun" className="border-b border-paper-200 bg-white">
      <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-graphite-600">
              <span className="accent-rule" aria-hidden="true" />
              Ürün
            </p>
            <h2 className="mt-6 max-w-[520px] font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.02em] text-anthracite sm:text-[46px]">
              Günlük hukuk işlerinin tamamı, tek çalışma alanında.
            </h2>
            <p className="mt-6 max-w-[440px] text-[16px] leading-7 text-[#636363]">
              Farklı programlar, klasörler ve tablolar arasında gidip gelmeden; dosyadan süreye, araştırmadan dilekçeye kadar.
            </p>
          </div>

          <dl className="grid border-t border-paper-200 sm:grid-cols-2">
            {capabilities.map(([number, title, body]) => (
              <div key={number} className="border-b border-paper-200 py-7 sm:odd:pr-8 sm:even:pl-8">
                <dt className="flex items-baseline gap-4">
                  <span className="font-serif text-[14px] italic text-graphite-600">{number}</span>
                  <span className="text-[17px] font-semibold text-anthracite">{title}</span>
                </dt>
                <dd className="mt-2 pl-9 text-[15px] leading-7 text-[#686868]">{body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-20 grid gap-10 border-t border-paper-200 pt-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-graphite-600">Sesli asistan</p>
            <h3 className="mt-5 max-w-[440px] font-serif text-[30px] font-normal leading-[1.15] tracking-[-0.015em] text-anthracite sm:text-[36px]">
              Sorun, görev verin; Faraklit işi kayda geçirsin.
            </h3>
            <p className="mt-5 max-w-[420px] text-[16px] leading-7 text-[#636363]">
              Duruşmalarınızı sorabilir, dosyayı özetletebilir ve görev oluşturabilirsiniz.
            </p>
          </div>

          <div className="divide-y divide-paper-200 border-y border-paper-200">
            {exchanges.map((item) => (
              <div key={item.question} className="grid gap-4 py-7 sm:grid-cols-[120px_1fr]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8f8f8f]">Avukat</p>
                <p className="font-serif text-[20px] italic leading-8 text-anthracite">“{item.question}”</p>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-graphite-600">Faraklit</p>
                <p className="text-[16px] leading-7 text-[#545454]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
