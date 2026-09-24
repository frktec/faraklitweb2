export function FounderStatement() {
  return (
    <section className="border-b border-paper-200 bg-paper">
      <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-graphite-600"><span className="accent-rule" aria-hidden="true" />Kurucumuzdan</p>
        <blockquote className="mt-8 max-w-[1000px] font-serif text-[22px] font-normal italic leading-[1.3] tracking-[-0.015em] text-anthracite min-[420px]:text-[24px] sm:text-[30px] lg:text-[36px]">
          <p>“Faraklit, yalnızca bir hukuk teknolojisi değil; avukatlık mesleğinin dijital çağdaki yeni çalışma biçimidir.</p>
          <p className="mt-3">İlhamımızı, savunuculuğun ve yol göstericiliğin kadim anlamını taşıyan Parakletos kavramından aldık. Çünkü çağlar değişse de savunmanın özü değişmez.</p>
          <p className="mt-3">Avukatlık dijitalleşecek.<br />Meslek dönüşecek.<br />Fakat adaletin, savunmanın ve avukatlığın taşıdığı değer daima korunacak.”</p>
        </blockquote>

        <div className="mt-8 flex flex-col gap-6 sm:mt-12 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="border-l border-graphite pl-4 text-[16px] leading-relaxed text-anthracite">
            <p className="font-semibold">Av. Furkan Tunca</p>
            <p className="text-[#686868]">Kurucu</p>
          </div>

          <div aria-label="Av. Furkan Tunca imzası" className="h-[64px] w-[205px] overflow-hidden sm:h-[72px] sm:w-[240px]">
            <img
              src="/assets/images/founder-signature.png"
              alt="Av. Furkan Tunca imzası"
              className="h-auto w-full -translate-y-[1px] mix-blend-multiply"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
