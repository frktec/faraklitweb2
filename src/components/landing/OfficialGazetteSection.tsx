export function OfficialGazetteSection() {
  return (
    <section className="border-b border-ink-200 bg-white">
      <div className="mx-auto max-w-8xl px-6 py-20 lg:py-28">
        <div className="mb-14 max-w-[600px]">
          <p className="section-label mb-4 text-ink-700">Resmî Gazete</p>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink-950 sm:text-[40px]">
            Resmî Gazete'yi okumak değil, takip etmek.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gazette preview */}
          <div className="window-reveal overflow-hidden rounded-[12px] border border-ink-200 bg-white shadow-sm">
            <div className="border-b border-ink-200 bg-ink-50 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-ink-900">Resmî Gazete</span>
                <span className="text-[15px] text-ink-400">27 Ağustos 2026 · Sayı: 33287</span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {[
                { category: 'Kanun', title: 'İş Kanununda Değişiklik Yapılmasına Dair Kanun', num: 'MK-2026/7234' },
                { category: 'Yönetmelik', title: 'Elektronik Tebligat Yönetmeliğinde Değişiklik', num: 'Y-2026/4521' },
                { category: 'Tebliğ', title: 'Vergi Usul Kanunu Genel Tebliği', num: 'T-2026/893' },
              ].map((item) => (
                <div key={item.num} className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-[4px] bg-ink-100 px-1.5 py-0.5 text-[14px] font-medium text-ink-600">
                      {item.category}
                    </span>
                    <span className="text-[14px] text-ink-400">{item.num}</span>
                  </div>
                  <p className="text-[16px] text-ink-700">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI summary */}
          <div className="window-reveal overflow-hidden rounded-[12px] border border-ink-200 bg-ink-50 shadow-sm">
            <div className="border-b border-ink-200 bg-white px-5 py-3">
              <span className="text-[16px] font-semibold text-ink-900">Günlük Özet & Analiz</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[15px] font-medium uppercase tracking-wider text-ink-400 mb-2">Günlük Özet</p>
                <p className="text-[16px] leading-relaxed text-ink-600">
                  Bugün yayımlanan mevzuat değişiklikleri arasında İş Kanunu'nda kıdem tazminatı
                  hesabına ilişkin önemli değişiklikler bulunmaktadır.
                </p>
              </div>
              <div>
                <p className="text-[15px] font-medium uppercase tracking-wider text-ink-400 mb-2">Önemli Değişiklikler</p>
                <div className="space-y-1.5">
                  {[
                    'Kıdem tazminatı tavanı güncellendi',
                    'Elektronik tebligat süreleri netleştirildi',
                    'Vergi beyannamesi sunum süreleri uzatıldı',
                  ].map((c) => (
                    <div key={c} className="flex items-center gap-2 text-[15px] text-ink-600">
                      <span className="h-1 w-1 rounded-full bg-ink-400" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[15px] font-medium uppercase tracking-wider text-ink-400 mb-2">Hukuk Alanına Göre Filtreleme</p>
                <div className="flex flex-wrap gap-1.5">
                  {['İş Hukuku', 'Ceza Hukuku', 'İdare Hukuku', 'Ticaret Hukuku', 'Vergi Hukuku'].map((f) => (
                    <span key={f} className="rounded-[5px] border border-ink-200 bg-white px-2 py-1 text-[15px] text-ink-600">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
