import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Mic, RotateCcw, Volume2 } from 'lucide-react';

const command = 'Faraklit, bugün hangi duruşmalarım var?';
const answer = 'Bugün 3 duruşmanız var. İlki 10.20’de Afyonkarahisar 2. İş Mahkemesinde.';

const hearings = [
  ['10.20', 'Afyonkarahisar 2. İş Mahkemesi', '2026/318'],
  ['13.30', 'Afyonkarahisar 3. Aile Mahkemesi', '2026/540'],
  ['15.00', 'Afyonkarahisar 1. Asliye Hukuk Mahkemesi', '2026/219'],
] as const;

const BAR_COUNT = 48;
const LISTEN_MS = 2600;
const THINK_MS = 900;
const SPEAK_MS = 3000;

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking' | 'done';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Voice assistant run shown as an audio-frequency visualiser. Plays once when
 * scrolled into view, then rests on the result. Bars are updated through refs
 * inside requestAnimationFrame so the component does not re-render per frame.
 */
export function VoiceSimulation() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const phaseRef = useRef<Phase>('idle');
  const [phase, setPhaseState] = useState<Phase>('idle');
  const [heard, setHeard] = useState(0);
  const [spoken, setSpoken] = useState(0);

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const stop = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  // Idle bars: a low, even line.
  const settleBars = () => {
    barsRef.current.forEach((bar, i) => {
      if (bar) bar.style.height = `${(8 + 4 * Math.sin(i * 0.9)).toFixed(1)}%`;
    });
  };

  const animate = useCallback((start: number) => {
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const current = phaseRef.current;
      const speaking = current === 'speaking';
      const active = current === 'listening' || speaking;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        let level = 0.08;
        if (active) {
          // Speech-like envelope: syllable rhythm × a frequency-shaped profile.
          const x = i / (BAR_COUNT - 1);
          const profile = speaking
            ? 0.55 + 0.45 * Math.sin(Math.PI * x)                   // assistant: centred, smooth
            : 0.35 + 0.65 * Math.exp(-((x - 0.35) ** 2) / 0.06);    // human: stronger low-mids
          const syllable = 0.55 + 0.45 * Math.sin(t * (speaking ? 7 : 9.5) + Math.sin(t * 2.3) * 2);
          const jitter = 0.5 + 0.5 * Math.sin(t * 13 + i * 1.7) * Math.sin(t * 5.1 + i * 0.6);
          level = Math.max(0.08, Math.min(1, 1.35 * profile * syllable * (0.4 + 0.6 * jitter)));
        } else if (current === 'thinking') {
          level = 0.1 + 0.06 * Math.sin(t * 4 + i * 0.35);
        }
        bar.style.height = `${(level * 100).toFixed(1)}%`;
      });
      if (current !== 'done' && current !== 'idle') frameRef.current = requestAnimationFrame(tick);
      else settleBars();
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const showFinal = useCallback(() => {
    stop();
    setHeard(command.length);
    setSpoken(answer.length);
    setPhase('done');
    settleBars();
  }, []);

  const play = useCallback(() => {
    if (prefersReducedMotion()) {
      showFinal();
      return;
    }
    stop();
    setHeard(0);
    setSpoken(0);
    setPhase('listening');
    animate(performance.now());

    const perHeard = LISTEN_MS / command.length;
    for (let i = 1; i <= command.length; i += 1) {
      timers.current.push(window.setTimeout(() => setHeard(i), i * perHeard));
    }
    timers.current.push(window.setTimeout(() => setPhase('thinking'), LISTEN_MS + 150));

    const speakStart = LISTEN_MS + 150 + THINK_MS;
    timers.current.push(window.setTimeout(() => setPhase('speaking'), speakStart));
    const perSpoken = SPEAK_MS / answer.length;
    for (let i = 1; i <= answer.length; i += 1) {
      timers.current.push(window.setTimeout(() => setSpoken(i), speakStart + i * perSpoken));
    }
    timers.current.push(window.setTimeout(() => setPhase('done'), speakStart + SPEAK_MS + 250));
  }, [animate, showFinal]);

  useEffect(() => {
    settleBars();
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
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [play, showFinal]);

  const status: Record<Phase, string> = {
    idle: 'Hazır',
    listening: 'Dinliyor',
    thinking: 'Takvim ve dosyalar taranıyor',
    speaking: 'Yanıtlıyor',
    done: 'Tamamlandı',
  };
  const running = phase === 'listening' || phase === 'thinking' || phase === 'speaking';

  return (
    <div ref={rootRef} className="overflow-hidden rounded-[8px] border border-paper-300 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-paper-200 px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${phase === 'listening' ? 'bg-anthracite text-white' : 'bg-paper text-anthracite'}`}>
            {phase === 'speaking' ? <Volume2 size={14} /> : <Mic size={14} />}
          </span>
          <span className="text-[14px] font-semibold text-anthracite">Sesli asistan</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-graphite-600" aria-live="polite">{status[phase]}</span>
          <button
            type="button"
            onClick={play}
            disabled={running}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-graphite-600 transition-colors hover:text-anthracite disabled:opacity-0"
          >
            <RotateCcw size={12} />
            Tekrar oynat
          </button>
        </div>
      </div>

      {/* Frequency visualiser */}
      <div className="border-b border-paper-200 bg-anthracite px-5 py-7 sm:px-8" aria-hidden="true">
        <div className="flex h-[96px] items-center justify-between">
          {Array.from({ length: BAR_COUNT }, (_, i) => (
            <span
              key={i}
              ref={(el) => { barsRef.current[i] = el; }}
              className={`block w-[3px] rounded-full transition-colors duration-500 ${
                phase === 'speaking' ? 'bg-white' : phase === 'listening' ? 'bg-white/80' : 'bg-white/30'
              }`}
              style={{ height: '8%' }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b8c8f]">Avukat</p>
          <p className="mt-2 min-h-[32px] font-serif text-[20px] italic leading-8 text-anthracite">
            {heard > 0 ? `“${command.slice(0, heard)}${heard === command.length ? '”' : ''}` : <span className="text-[#b0b1b3]">…</span>}
          </p>
        </div>

        <div className={`transition-opacity duration-500 ${spoken > 0 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-graphite-600">Faraklit</p>
          <p className="mt-2 min-h-[56px] text-[16px] leading-7 text-[#48494c]">{answer.slice(0, spoken)}</p>
        </div>

        <ul className={`divide-y divide-paper-200 border-y border-paper-200 transition-opacity duration-500 ${phase === 'done' ? 'opacity-100' : 'opacity-0'}`} aria-hidden={phase !== 'done'}>
          {hearings.map(([time, court, no]) => (
            <li key={no} className="flex items-center gap-4 py-3">
              <CalendarDays size={14} className="shrink-0 text-graphite" />
              <span className="w-12 shrink-0 text-[14px] font-semibold tabular-nums text-anthracite">{time}</span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-[#48494c]">{court}</span>
              <span className="shrink-0 text-[13px] tabular-nums text-graphite-600">{no}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
