const integrations = [
  ['UYAP', 'Evrakı dosyaya alın, görev ve süreyle ilişkilendirin.'],
  ['UETS', 'Tebligatı eşleştirin, son günü takip edin.'],
  ['Resmî Gazete', 'Günün mevzuat değişikliklerini görün.'],
  ['Takvim', 'Duruşma, görev ve süreleri birlikte izleyin.'],
  ['İçtihat Kaynakları', 'Resmî karar kaynaklarında arama yapın.'],
] as const;

export function IntegrationsSection() {
  return (
    <section id="entegrasyonlar" className="border-b border-[#e3e7eb] bg-[#f7f8fa]">
      <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">Entegrasyonlar</p>
            <h2 className="mt-4 max-w-[560px] font-display text-[32px] font-semibold leading-[1.03] tracking-[-0.045em] text-[#171a20] sm:text-[44px]">
              Kullandığınız sistemler Faraklit’te buluşsun.
            </h2>
          </div>

          <div className="border-t border-[#dfe4e8]">
            {integrations.map(([name, text]) => (
              <div key={name} className="grid gap-2 border-b border-[#dfe4e8] py-5 sm:grid-cols-[180px_1fr] sm:gap-8">
                <p className="text-[15px] font-semibold text-[#20262d]">{name}</p>
                <p className="text-[15px] leading-6 text-[#68717a]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
