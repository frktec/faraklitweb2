import { useState } from 'react';
import { Check, FileSignature } from 'lucide-react';

const steps = [
  'Belgeyi seçin',
  'İmzaya gönderin',
  'Telefonda onaylayın',
  'İmzalı sürümü dosyada saklayın',
] as const;

export function DocumentSigningSection() {
  const [step, setStep] = useState(0);

  return (
    <div className="border-t border-[#e3e7eb] py-14 sm:py-16 lg:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div>
          <FileSignature size={20} className="text-[#171a20]" />
          <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.17em] text-[#767f88]">Evrak İmzalama</p>
          <h3 className="mt-3 max-w-[560px] font-display text-[31px] font-semibold leading-[1.03] tracking-[-0.045em] text-[#171a20] sm:text-[42px] lg:text-[46px]">
            Faraklit’te hazırladığınız evrakı imzalayın.
          </h3>
          <p className="mt-4 max-w-[520px] text-[16px] leading-7 text-[#68717a]">Belgeyi hazırlayın, imzalayın ve aynı dosyada saklayın.</p>
        </div>

        <div className="border-y border-[#dfe4e8] bg-[#fafbfc]">
          {steps.map((title, index) => (
            <button
              key={title}
              type="button"
              onClick={() => setStep(index)}
              className="flex w-full items-center gap-4 border-b border-[#e4e8ec] px-5 py-5 text-left last:border-b-0 sm:px-6"
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold ${index < step ? 'border-[#171a20] bg-[#171a20] text-white' : index === step ? 'border-[#171a20] text-[#171a20]' : 'border-[#cfd6dc] text-[#939ba3]'}`}>
                {index < step ? <Check size={13} /> : index + 1}
              </span>
              <span className={`text-[15px] font-semibold ${index <= step ? 'text-[#242b31]' : 'text-[#8d959d]'}`}>{title}</span>
              {index === step && <span className="ml-auto text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6d7680]">şimdi</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
