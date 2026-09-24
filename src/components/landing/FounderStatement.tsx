export function FounderStatement() {
  return (
    <section className="border-b border-[#dce4ec] bg-[#f4f7fa]">
      <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <blockquote className="max-w-[1080px] font-serif text-[22px] font-normal italic leading-[1.22] tracking-[-0.03em] text-[#263a58] min-[420px]:text-[24px] sm:text-[32px] lg:text-[40px]">
          <p>“Faraklit, yalnızca bir hukuk teknolojisi değil; avukatlık mesleğinin dijital çağdaki yeni çalışma biçimidir.</p>
          <p className="mt-3">İlhamımızı, savunuculuğun ve yol göstericiliğin kadim anlamını taşıyan Parakletos kavramından aldık. Çünkü çağlar değişse de savunmanın özü değişmez.</p>
          <p className="mt-3">Avukatlık dijitalleşecek.<br />Meslek dönüşecek.<br />Fakat adaletin, savunmanın ve avukatlığın taşıdığı değer daima korunacak.”</p>
        </blockquote>

        <div className="mt-8 flex flex-col gap-6 sm:mt-12 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="text-[16px] leading-relaxed text-[#263a58]">
            <p className="font-medium">Av. Furkan Tunca</p>
            <p>Kurucu</p>
          </div>

          <div aria-label="Av. Furkan Tunca imzası" className="h-[64px] w-[205px] overflow-hidden sm:h-[72px] sm:w-[240px]">
            <img
              src="/image%20copy.png"
              alt="Av. Furkan Tunca imzası"
              className="h-auto w-full -translate-y-[1px] mix-blend-multiply"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
