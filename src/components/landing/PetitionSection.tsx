export function PetitionSection() {
  return (
    <section className="border-b border-ink-200 bg-white">
      <div className="mx-auto max-w-8xl px-6 py-20 lg:py-28">
        <div className="mb-14 max-w-[600px]">
          <p className="section-label mb-4 text-ink-700">Dilekçe Atölyesi</p>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink-950 sm:text-[40px]">
            Dilekçeyi yalnızca oluşturmayın.
            <br />
            Birlikte geliştirin.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Document editor */}
          <div className="window-reveal overflow-hidden rounded-[12px] border border-ink-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5">
              <FileTextIcon />
              <span className="text-[15px] text-ink-500">Dilekçe · Kusur değerlendirmesi</span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-[16px] leading-relaxed">
                <p className="font-medium text-ink-900">Sayın Mahkeme,</p>
                <p className="text-ink-600">
                  Davalı tarafın kusur değerlendirmesine itirazımız vardır. Davalı araç, seyir halinde
                  iken gerekli dikkat ve özeni göstermemiş, trafik kurallarına uymamıştır.
                </p>
                <p className="rounded-[5px] bg-accent-50 px-2 py-1.5 text-ink-800">
                  <span className="bg-accent-100/60">
                    Bu bölümde davalının asli kusur kriterleri detaylandırılarak, ilgili Yargıtay
                    kararlarıyla desteklenmiştir.
                  </span>
                </p>
                <p className="text-ink-600">
                  Nitekim Yargıtay 12. Hukuk Dairesi 2023/4567 E., 2023/8910 K. sayılı kararında asli
                  kusur unsurları ayrıntılı olarak değerlendirilmiştir.
                </p>
              </div>
            </div>
          </div>

          {/* AI command panel */}
          <div className="window-reveal overflow-hidden rounded-[12px] border border-ink-200 bg-ink-50 shadow-sm">
            <div className="border-b border-ink-200 bg-white px-4 py-2.5">
              <span className="text-[15px] font-medium text-ink-700">Faraklit Asistan komutları</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-[8px] border border-ink-200 bg-white p-3.5">
                <p className="text-[15px] text-ink-500 mb-1">Komut</p>
                <p className="text-[16px] text-ink-700">
                  "Bu dilekçeyi sizin elinizden çıkmış gibi, savunma üslubunuzu ve hukuki tonunuzu koruyarak yeniden düzenleyin."
                </p>
              </div>

              <div className="rounded-[8px] border border-ink-200 bg-white p-3.5">
                <p className="text-[15px] text-ink-500 mb-2">Yapılan değişiklikler</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <p className="text-[15px] text-ink-600">Metnin üslubu incelendi ve korundu</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <p className="text-[15px] text-ink-600">Savunma tonu güçlendirildi</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <p className="text-[15px] text-ink-600">2 bölüm üsluba uygun yeniden yazıldı</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Üslubunuza uygun komut yazın…"
                  className="flex-1 rounded-[7px] border border-ink-200 bg-white px-3 py-2 text-[15px] text-ink-700 placeholder-ink-400 focus:border-ink-400 focus:outline-none"
                />
                <button className="rounded-[7px] bg-ink-950 px-3 py-2 text-[15px] font-medium text-white">
                  Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FileTextIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  );
}
