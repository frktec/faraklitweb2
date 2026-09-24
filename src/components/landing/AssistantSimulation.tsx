import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarCheck, Check, FileText, RotateCcw, Sparkles } from 'lucide-react';

const question = 'Ayşe Yılmaz dosyasında bilirkişi raporuna itiraz süresi ne zaman doluyor? İtiraz dilekçesi taslağını hazırla.';

const steps = [
  ['Dosya tarandı', '2026/1184 · 42 evrak'],
  ['Tebligat eşleşti', 'Bilirkişi raporu · UETS · 17.09.2026'],
  ['Mevzuat kontrol edildi', 'HMK m. 281 · tebliğden itibaren iki hafta'],
  ['Süre hesaplandı', 'Son gün: 1 Ekim 2026'],
] as const;

type Phase = 'idle' | 'typing' | 'working' | 'done';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A single, restrained assistant run: it plays once when it scrolls into view
 * and then rests on the final state. No loops.
 */
export function AssistantSimulation() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState(0);
  const [completed, setCompleted] = useState(0);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const showFinal = useCallback(() => {
    clear();
    setTyped(question.length);
    setCompleted(steps.length);
    setPhase('done');
  }, []);

  const play = useCallback(() => {
    if (prefersReducedMotion()) {
      showFinal();
      return;
    }
    clear();
    setTyped(0);
    setCompleted(0);
    setPhase('typing');

    const perChar = 22;
    for (let i = 1; i <= question.length; i += 1) {
      timers.current.push(window.setTimeout(() => setTyped(i), i * perChar));
    }
    const workStart = question.length * perChar + 350;
    timers.current.push(window.setTimeout(() => setPhase('working'), workStart));
    steps.forEach((_, index) => {
      timers.current.push(window.setTimeout(() => setCompleted(index + 1), workStart + 550 * (index + 1)));
    });
    timers.current.push(window.setTimeout(() => setPhase('done'), workStart + 550 * steps.length + 400));
  }, [showFinal]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      showFinal();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        play();
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      clear();
    };
  }, [play, showFinal]);

  const typing = phase === 'typing';

  return (
    <div ref={rootRef} className="overflow-hidden rounded-[8px] border border-paper-300 bg-white shadow-[0_40px_90px_-40px_rgba(31,31,31,0.35)]">
      <div className="flex items-center justify-between gap-4 border-b border-paper-200 bg-anthracite px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5 text-white">
          <Sparkles size={15} className="text-graphite" />
          <span className="text-[14px] font-semibold tracking-[0.02em]">Faraklit Asistan</span>
        </div>
        <span className="truncate text-[12px] text-white/60">Dosya 2026/1184 · Ayşe Yılmaz</span>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr]">
        <div className="border-b border-paper-200 p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f8f8f]">Avukat</p>
          <p className="mt-3 min-h-[84px] font-serif text-[19px] italic leading-8 text-anthracite sm:text-[21px]">
            “{question.slice(0, typed)}
            {typing && <span className="ml-0.5 inline-block h-[1.1em] w-px translate-y-[3px] bg-anthracite/60" aria-hidden="true" />}
            {!typing && typed > 0 && '”'}
          </p>

          <div className={`mt-8 border-t border-paper-200 pt-6 transition-opacity duration-500 ${phase === 'done' ? 'opacity-100' : 'opacity-0'}`} aria-hidden={phase !== 'done'}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-graphite-600">Faraklit</p>
            <p className="mt-3 text-[16px] leading-7 text-[#494949]">
              Bilirkişi raporu <strong className="font-semibold text-anthracite">17 Eylül 2026</strong>’da tebliğ edilmiş.
              HMK m. 281 uyarınca iki haftalık itiraz süresi <strong className="font-semibold text-anthracite">1 Ekim 2026</strong>’da doluyor.
              Süreyi takviminize ekledim ve dosyadaki bilgilerle itiraz dilekçesi taslağını hazırladım.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-[4px] border border-paper-300 bg-paper px-3 py-2 text-[13px] font-medium text-anthracite">
                <FileText size={14} className="text-graphite-600" />
                Bilirkişi raporuna itiraz dilekçesi · Taslak
              </span>
              <span className="inline-flex items-center gap-2 rounded-[4px] border border-paper-300 bg-paper px-3 py-2 text-[13px] font-medium text-anthracite">
                <CalendarCheck size={14} className="text-graphite-600" />
                1 Ekim 2026 · Takvime eklendi
              </span>
            </div>
          </div>
        </div>

        <div className="bg-paper/60 p-5 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f8f8f]">İnceleme adımları</p>
            <button
              type="button"
              onClick={play}
              disabled={phase === 'typing' || phase === 'working'}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#737373] transition-colors hover:text-anthracite disabled:opacity-0"
            >
              <RotateCcw size={12} />
              Tekrar oynat
            </button>
          </div>
          <ol className="mt-5 space-y-5">
            {steps.map(([title, detail], index) => {
              const done = index < completed;
              const active = phase === 'working' && index === completed;
              return (
                <li key={title} className="flex gap-3.5">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-300 ${
                      done ? 'border-anthracite bg-anthracite text-white' : active ? 'border-anthracite text-anthracite' : 'border-paper-300 text-[#a5a5a5]'
                    }`}
                  >
                    {done ? <Check size={12} /> : index + 1}
                  </span>
                  <div>
                    <p className={`text-[15px] font-semibold transition-colors duration-300 ${done || active ? 'text-anthracite' : 'text-[#a5a5a5]'}`}>{title}</p>
                    <p className={`mt-0.5 text-[13px] leading-5 transition-colors duration-300 ${done ? 'text-[#686868]' : 'text-[#b7b7b7]'}`}>{detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
