const integrations = [
  ['UYAP', 'Evrakı dosyaya alın, görev ve süreyle ilişkilendirin.'],
  ['UETS', 'Tebligatı eşleştirin, son günü takip edin.'],
  ['Resmî Gazete', 'Günün mevzuat değişikliklerini görün.'],
  ['Takvim', 'Duruşma, görev ve süreleri birlikte izleyin.'],
  ['İçtihat Kaynakları', 'Resmî karar kaynaklarında arama yapın.'],
] as const;

export function IntegrationsSection() {
  return (
    <section id="entegrasyonlar" className="border-b border-ivory-200 bg-ivory">
      <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-gold-600"><span className="gold-rule" aria-hidden="true" />Entegrasyonlar</p>
            <h2 className="mt-6 max-w-[520px] font-serif text-[34px] font-normal leading-[1.12] tracking-[-0.02em] text-navy sm:text-[42px]">
              Kullandığınız sistemler Faraklit’te buluşsun.
            </h2>
          </div>

          <div className="border-t border-ivory-300">
            {integrations.map(([name, text]) => (
              <div key={name} className="grid gap-2 border-b border-ivory-300 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
                <p className="text-[16px] font-semibold text-navy">{name}</p>
                <p className="text-[15px] leading-7 text-[#5f6977]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
