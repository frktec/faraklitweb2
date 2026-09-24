import { useEffect, useState } from 'react';
import { Check, Play, RotateCcw } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const agents = [
  ['UETS', 'Tebligatı aldı'],
  ['Dosya', 'İlgili dosyayı buldu'],
  ['Süre', 'Son günü hesapladı'],
  ['Görev', 'Yapılacak işi oluşturdu'],
  ['Dilekçe', 'Çalışma dosyasını hazırladı'],
] as const;

export function AgentSimulation() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35, once: true });
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const start = () => {
    setFinished(false);
    setActive(0);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setActive(-1);
  };

  useEffect(() => {
    if (!inView || running || finished || active >= 0) return;
    const timer = window.setTimeout(start, 500);
    return () => window.clearTimeout(timer);
  }, [inView, running, finished, active]);

  useEffect(() => {
    if (!running || active < 0) return;
    const timer = window.setTimeout(() => {
      if (active >= agents.length - 1) {
        setRunning(false);
        setFinished(true);
      } else {
        setActive((value) => value + 1);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [running, active]);

  return (
    <div ref={ref} className="border-y border-[#dfe4e8] bg-white py-2">
      <div className="flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-0 sm:flex-row sm:items-stretch">
          {agents.map(([name, detail], index) => {
            const done = finished || index < active;
            const current = index === active && running;
            return (
              <div key={name} className="relative flex-1 border-b border-[#e5e9ed] py-4 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${done ? 'border-[#171a20] bg-[#171a20] text-white' : current ? 'border-[#171a20] text-[#171a20]' : 'border-[#cfd6dc] text-[#929aa2]'}`}>
                    {done ? <Check size={12} /> : index + 1}
                  </span>
                  <p className={`text-[14px] font-semibold ${done || current ? 'text-[#171a20]' : 'text-[#8b949d]'}`}>{name}</p>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-[#717b85]">{detail}</p>
                {current && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#171a20] sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:w-[2px]" />}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={running ? reset : start}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start text-[14px] font-semibold text-[#29313a] lg:self-center"
        >
          {running ? <RotateCcw size={14} /> : <Play size={14} />}
          {running ? 'Başa dön' : finished ? 'Tekrar çalıştır' : 'Çalıştır'}
        </button>
      </div>
      <div className="border-t border-[#e5e9ed] py-4 text-[14px] text-[#66717b]">
        {finished ? 'Tebligat dosyayla eşleşti; süre ve görev oluşturuldu. Çalışma dosyası hazır.' : running ? 'Ajanlar sırayla çalışıyor…' : 'Örnek akışı çalıştırın.'}
      </div>
    </div>
  );
}
