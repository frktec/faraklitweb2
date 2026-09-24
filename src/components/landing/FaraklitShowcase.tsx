import { ArrowUpRight, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiveProductDemo } from './LiveProductDemo';
import { AgentSimulation } from './AgentSimulation';
import { DocumentSigningSection } from './DocumentSigningSection';

const capabilities = [
  ['01', 'Dosya Yönetimi', 'Evrak, görev, duruşma ve notları aynı dosyada yönetin.'],
  ['02', 'UETS ve Süreler', 'Tebligatı dosyayla eşleştirin, son günü görün.'],
  ['03', 'İçtihat', 'İlgili kararı ve önemli pasajı birlikte bulun.'],
  ['04', 'Dilekçe', 'Dosyadaki bilgilerle ilk taslağı hazırlayın.'],
  ['05', 'Takvim ve Görevler', 'Günün işlerini, duruşmaları ve süreleri takip edin.'],
  ['06', 'Evrak İmzalama', 'Hazırladığınız evrakı imzalama akışına alın.'],
  ['07', 'Sesli Asistan', 'Faraklit’le konuşarak işlerinizi yönetin.'],
  ['08', 'Faraklit Ajanları', 'Tekrarlanan işleri sırayla otomatikleştirin.'],
] as const;

export function FaraklitShowcase() {
  return (
    <section id="urun" className="bg-white">
      <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-8 border-b border-[#e3e7eb] pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">Faraklit’te neler var?</p>
            <h2 className="mt-4 max-w-[620px] font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#171a20] sm:text-[48px] lg:text-[54px]">
              Günlük hukuk işlerinin tamamı tek yerde.
            </h2>
          </div>
          <div className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
            {capabilities.map(([number, title, body]) => (
              <div key={number} className="border-t border-[#e6eaee] py-5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                <div className="flex gap-4">
                  <span className="pt-0.5 text-[12px] font-semibold tabular-nums text-[#9aa1a8]">{number}</span>
                  <div>
                    <p className="text-[16px] font-semibold text-[#20262d]">{title}</p>
                    <p className="mt-1 text-[14px] leading-6 text-[#6b747d]">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="py-14 sm:py-16 lg:py-20">
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">Faraklit Ajanları</p>
              <h3 className="mt-4 max-w-[700px] font-display text-[31px] font-semibold leading-[1.03] tracking-[-0.045em] text-[#171a20] sm:text-[43px]">
                Bir iş gelir. Ajanlar sırayla tamamlar.
              </h3>
            </div>
            <p className="max-w-[420px] text-[15px] leading-6 text-[#6c747d]">UETS’ten göreve kadar örnek bir akış.</p>
          </div>
          <AgentSimulation />
        </div>

        <ProductFeature
          eyebrow="Dosya Yönetim Merkezi"
          title="Dosyanın tamamını tek ekranda görün."
          description="Mahkeme, müvekkil, evrak, görev ve dosya aşaması bir arada."
          demo="cases"
          bullets={['İlk derece, istinaf ve temyiz bağlantısı', 'Hızlı arama ve filtreleme']}
        />

        <ProductFeature
          reverse
          eyebrow="İçtihat Araştırması"
          title="İlgili kararı ve önemli pasajı birlikte bulun."
          description="Sorunuzu yazın; en ilgili kararlar ve önemli bölümler öne çıksın."
          demo="research"
          bullets={['İlgili pasajı öne çıkarır', 'Kararı dosyaya veya dilekçeye ekler']}
        />

        <ProductFeature
          eyebrow="UETS e-Tebligat"
          title="Tebligattan göreve birkaç adımda geçin."
          description="Dosyayı eşleştirin, süreyi görün ve yapılacak işi oluşturun."
          demo="uets"
          bullets={['Barkodla tekrar kaydı önler', 'Yaklaşan süreleri gösterir']}
        />

        <DocumentSigningSection />

        <div className="grid gap-10 border-b border-[#e3e7eb] py-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <Workflow size={20} className="text-[#171a20]" />
            <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">Komuta Merkezi</p>
            <h3 className="mt-3 max-w-[520px] font-display text-[31px] font-semibold leading-[1.03] tracking-[-0.045em] text-[#171a20] sm:text-[42px]">
              Bugünün işlerini tek bakışta görün.
            </h3>
            <p className="mt-4 max-w-[500px] text-[16px] leading-7 text-[#68717a]">Duruşmalar, görevler ve yaklaşan süreler tek listede.</p>
          </div>
          <SimpleFlow
            steps={[
              ['09.30', 'Duruşma'],
              ['11.00', 'Cevap dilekçesi'],
              ['14.30', 'Müvekkil görüşmesi'],
              ['17.00', 'Süre kontrolü'],
            ]}
          />
        </div>

        <div className="grid gap-10 py-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <Sparkles size={20} className="text-[#171a20]" />
            <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">Faraklit Asistan</p>
            <h3 className="mt-3 max-w-[520px] font-display text-[31px] font-semibold leading-[1.03] tracking-[-0.045em] text-[#171a20] sm:text-[42px]">
              Soruyu yazın. Faraklit gereken bilgiyi bulsun.
            </h3>
            <p className="mt-4 max-w-[500px] text-[16px] leading-7 text-[#68717a]">Dosya, mevzuat ve içtihat birlikte taranır; sonuç tek yerde hazırlanır.</p>
          </div>
          <SimpleFlow
            steps={[
              ['01', 'Soruyu anlar'],
              ['02', 'Dosyayı tarar'],
              ['03', 'Kaynakları bulur'],
              ['04', 'Cevabı hazırlar'],
            ]}
          />
        </div>

        <div className="border-t border-[#e3e7eb] pt-8 text-right">
          <Link to="/pricing" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#20262d]">
            Paketleri incele <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductFeature({
  eyebrow,
  title,
  description,
  demo,
  bullets,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  demo: 'cases' | 'research' | 'uets';
  bullets: string[];
  reverse?: boolean;
}) {
  return (
    <div className="border-t border-[#e3e7eb] py-14 sm:py-16 lg:py-20">
      <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">{eyebrow}</p>
          <h3 className="mt-4 max-w-[570px] font-display text-[31px] font-semibold leading-[1.03] tracking-[-0.045em] text-[#171a20] sm:text-[42px] lg:text-[46px]">{title}</h3>
          <p className="mt-4 max-w-[520px] text-[16px] leading-7 text-[#68717a]">{description}</p>
          <div className="mt-6 space-y-2 border-t border-[#e6eaee] pt-5">
            {bullets.map((bullet) => (
              <p key={bullet} className="text-[14px] leading-6 text-[#59626c]">— {bullet}</p>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-[12px] border border-[#dfe4e8] bg-[#f5f6f7] p-2 shadow-[0_18px_44px_rgba(25,31,38,.08)]">
          <LiveProductDemo mode={demo} />
        </div>
      </div>
    </div>
  );
}

function SimpleFlow({ steps }: { steps: readonly (readonly [string, string])[] }) {
  return (
    <div className="border-y border-[#dfe4e8] bg-[#fafbfc]">
      {steps.map(([index, label], stepIndex) => (
        <div key={`${index}-${label}`} className="flex items-center gap-5 border-b border-[#e4e8ec] px-5 py-5 last:border-b-0 sm:px-6">
          <span className="w-12 shrink-0 text-[12px] font-semibold tabular-nums text-[#989fa7]">{index}</span>
          <span className="text-[16px] font-semibold text-[#252b31]">{label}</span>
          <span className="ml-auto text-[13px] text-[#a1a7ad]">{stepIndex < steps.length - 1 ? '→' : '✓'}</span>
        </div>
      ))}
    </div>
  );
}
