const rows = [
  ['KVKK', 'Veri minimizasyonu, kontrollü erişim ve kullanıcı yetkileri.'],
  ['GDPR', 'Gizlilik odaklı tasarım ve veri işleme ilkeleri.'],
  ['ISO/IEC 27001', 'Bilgi güvenliği kontrolleri geliştirme sürecinde referans alınıyor.'],
] as const;

export function SecuritySection() {
  return (
    <section id="guvenlik" className="border-b border-[#2a2e34] bg-[#171a20] text-white">
      <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-white/45">Güvenlik</p>
            <h2 className="mt-4 max-w-[520px] font-display text-[32px] font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-[44px]">
              Hukuki veriler için kontrollü erişim.
            </h2>
            <p className="mt-5 max-w-[500px] text-[15px] leading-7 text-white/55">Rol bazlı erişim, güvenli aktarım ve veri minimizasyonu temel yaklaşımın parçası.</p>
          </div>

          <div className="border-t border-white/12">
            {rows.map(([name, text]) => (
              <div key={name} className="grid gap-2 border-b border-white/12 py-5 sm:grid-cols-[180px_1fr] sm:gap-8">
                <p className="text-[15px] font-semibold text-white">{name}</p>
                <p className="text-[15px] leading-6 text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
