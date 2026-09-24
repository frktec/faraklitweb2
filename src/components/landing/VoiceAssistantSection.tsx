import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, FileText, Mail, Mic, Play, RotateCcw } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const commands = [
  {
    user: 'Faraklit, bugün hangi duruşmalarım var?',
    answer: 'Bugün 3 duruşmanız var. İlki 10.20’de Afyonkarahisar 2. İş Mahkemesinde.',
    result: 'Duruşmalar listelendi',
    Icon: CalendarDays,
  },
  {
    user: 'Ahmet Yılmaz dosyasındaki son tutanağı özetle.',
    answer: 'Son duruşmada tanıkların dinlenmesine ve bilirkişi raporunun beklenmesine karar verilmiş.',
    result: 'Tutanak özetlendi',
    Icon: FileText,
  },
  {
    user: 'Yarın 10.00 için cevap dilekçesi görevi ekle.',
    answer: 'Görev oluşturuldu: “Cevap dilekçesini hazırla” · Yarın 10.00.',
    result: 'Görev oluşturuldu',
    Icon: CheckCircle2,
  },
  {
    user: 'Müvekkile duruşma bilgisini e-posta taslağı olarak hazırla.',
    answer: 'Duruşma tarihi ve salon bilgisini içeren e-posta taslağı hazır.',
    result: 'E-posta taslağı hazır',
    Icon: Mail,
  },
] as const;

export function VoiceAssistantSection() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25, once: true });
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'thinking' | 'done'>('idle');
  const [autoStarted, setAutoStarted] = useState(false);
  const timersRef = useRef<number[]>([]);
  const current = commands[active];
  const CurrentIcon = current.Icon;
  const waveform = useMemo(() => [10, 18, 28, 16, 34, 23, 13, 27, 19, 31, 14, 22], []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const run = useCallback((index = active) => {
    clearTimers();
    setActive(index);
    setPhase('listening');
    timersRef.current.push(window.setTimeout(() => setPhase('thinking'), 800));
    timersRef.current.push(window.setTimeout(() => setPhase('done'), 1650));
  }, [active, clearTimers]);

  useEffect(() => {
    if (!inView || autoStarted) return;
    setAutoStarted(true);
    const timer = window.setTimeout(() => run(0), 400);
    return () => window.clearTimeout(timer);
  }, [inView, autoStarted, run]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <section ref={ref} id="cozumler" className="border-b border-[#e3e7eb] bg-[#f7f8fa]">
      <div className="mx-auto grid max-w-8xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-8 lg:py-24">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.17em] text-[#727c87]">Sesli Asistan</p>
          <h2 className="mt-4 max-w-[620px] font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#171a20] sm:text-[48px] lg:text-[56px]">
            Faraklit’le konuşun.
            <span className="block font-serif font-normal italic text-[#5e6670]">İşiniz kaldığı yerden ilerlesin.</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[17px] leading-7 text-[#616b75]">
            Duruşmayı sorun, dosyayı özetletin, görev verin veya bir metin hazırlatın.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
            {commands.map((command, index) => (
              <button
                key={command.user}
                type="button"
                onClick={() => run(index)}
                className={`border-b py-1 text-[14px] font-semibold transition ${active === index ? 'border-[#171a20] text-[#171a20]' : 'border-transparent text-[#7a838d] hover:text-[#303740]'}`}
              >
                Örnek {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="relative border-y border-[#dfe4e8] bg-white px-0 py-7 sm:px-7 lg:border-x lg:px-8">
          <div className="flex items-center justify-between gap-4 border-b border-[#e4e8ec] pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171a20] text-white"><Mic size={16} /></span>
              <div>
                <p className="text-[14px] font-semibold text-[#1d2630]">Sesli komut</p>
                <p className="text-[13px] text-[#7a838d]">Faraklit masaüstü</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => phase === 'idle' ? run(active) : (clearTimers(), setPhase('idle'))}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#37414b]"
            >
              {phase === 'idle' ? <Play size={14} /> : <RotateCcw size={14} />}
              {phase === 'idle' ? 'Başlat' : 'Başa dön'}
            </button>
          </div>

          <div className="py-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#89929b]">Siz</p>
            <p className="mt-3 max-w-[680px] text-[20px] leading-8 text-[#202831] sm:text-[22px]">“{current.user}”</p>
            <div className="mt-5 flex h-11 items-center gap-1.5" aria-hidden="true">
              {waveform.map((height, index) => (
                <span
                  key={index}
                  className={`w-[3px] rounded-full transition-all ${phase === 'listening' ? 'bg-[#171a20]' : 'bg-[#cfd6dc]'}`}
                  style={{ height: `${phase === 'listening' ? height : Math.max(7, height * 0.35)}px` }}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-[#e4e8ec] pt-6" aria-live="polite">
            <div className="flex items-start gap-3">
              <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${phase === 'done' ? 'bg-[#171a20] text-white' : 'bg-[#eef1f4] text-[#8b949d]'}`}>
                <CurrentIcon size={16} />
              </span>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#89929b]">Faraklit</p>
                <p className="mt-2 text-[16px] leading-7 text-[#4f5963]">
                  {phase === 'idle' && 'Bir örnek seçin ve simülasyonu başlatın.'}
                  {phase === 'listening' && 'Dinliyor…'}
                  {phase === 'thinking' && 'Dosya ve kayıtlar taranıyor…'}
                  {phase === 'done' && current.answer}
                </p>
                {phase === 'done' && <p className="mt-3 text-[14px] font-semibold text-[#202831]">{current.result}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
