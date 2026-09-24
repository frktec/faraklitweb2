const rows = [
  ['KVKK', 'Veri minimizasyonu, kontrollü erişim ve kullanıcı yetkileri.'],
  ['GDPR', 'Gizlilik odaklı tasarım ve veri işleme ilkeleri.'],
  ['ISO/IEC 27001', 'Bilgi güvenliği kontrolleri geliştirme sürecinde referans alınıyor.'],
] as const;

export function SecuritySection() {
  return (
    <section id="guvenlik" className="bg-navy text-white">
      <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-gold"><span className="gold-rule" aria-hidden="true" />Güvenlik</p>
            <h2 className="mt-6 max-w-[480px] font-serif text-[34px] font-normal leading-[1.12] tracking-[-0.02em] text-white sm:text-[42px]">
              Hukuki veriler için kontrollü erişim.
            </h2>
            <p className="mt-5 max-w-[500px] text-[16px] leading-7 text-white/60">Rol bazlı erişim, güvenli aktarım ve veri minimizasyonu yaklaşımımızın temelini oluşturur.</p>
          </div>

          <div className="border-t border-white/15">
            {rows.map(([name, text]) => (
              <div key={name} className="grid gap-2 border-b border-white/15 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
                <p className="text-[16px] font-semibold text-white">{name}</p>
                <p className="text-[15px] leading-7 text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
