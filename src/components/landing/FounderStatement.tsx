const closingLines = [
  'Avukatlık dijitalleşecek.',
  'Meslek dönüşecek.',
  'Fakat adaletin, savunmanın ve avukatlığın taşıdığı değer daima korunacak.',
];

export function FounderStatement() {
  return (
    <section className="border-b border-anthracite/10">
      <div className="mx-auto max-w-[1000px] px-4 py-24 sm:px-6 lg:py-32">
        <figure className="relative rounded-[28px] border border-anthracite/10 bg-white/70 px-6 pb-14 pt-16 text-center shadow-[0_60px_140px_-70px_rgba(35,36,38,0.35)] sm:px-14 sm:pt-20 lg:px-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7a7a7a]">Kurucumuzdan</p>

          <span aria-hidden="true" className="mt-6 block font-serif text-[96px] leading-[0.6] text-anthracite/15 sm:text-[120px]">“</span>

          <blockquote className="mt-4">
            <p className="mx-auto max-w-[760px] font-serif text-[26px] font-normal leading-[1.28] tracking-[-0.015em] text-anthracite sm:text-[34px] lg:text-[38px]">
              Faraklit, yalnızca bir hukuk teknolojisi değil; avukatlık mesleğinin dijital çağdaki yeni çalışma biçimidir.
            </p>

            <span aria-hidden="true" className="mx-auto mt-10 block h-px w-16 bg-anthracite/20" />

            <p className="mx-auto mt-10 max-w-[640px] font-serif text-[18px] italic leading-[1.7] text-[#4f4f4f] sm:text-[20px]">
              İlhamımızı, savunuculuğun ve yol göstericiliğin kadim anlamını taşıyan Parakletos kavramından aldık.
              Çünkü çağlar değişse de savunmanın özü değişmez.
            </p>

            <div className="mx-auto mt-12 max-w-[620px] divide-y divide-anthracite/10 border-y border-anthracite/10">
              {closingLines.map((line, index) => (
                <p
                  key={line}
                  className={`py-4 font-serif leading-snug ${
                    index === closingLines.length - 1
                      ? 'text-[20px] text-anthracite sm:text-[23px]'
                      : 'text-[20px] italic text-[#5a5a5a] sm:text-[23px]'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </blockquote>

          <figcaption className="mt-12 flex flex-col items-center">
            <div aria-label="Av. Furkan Tunca imzası" className="h-[70px] w-[230px] overflow-hidden sm:h-[80px] sm:w-[262px]">
              <img
                src="/assets/images/founder-signature.png"
                alt="Av. Furkan Tunca imzası"
                className="h-auto w-full -translate-y-[1px] mix-blend-multiply"
              />
            </div>
            <p className="mt-4 text-[16px] font-semibold tracking-[0.01em] text-anthracite">Av. Furkan Tunca</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
