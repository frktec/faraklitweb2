import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FolderOpen,
  Gavel,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  MousePointer2,
  Search,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

type DemoMode = 'overview' | 'cases' | 'research' | 'uets' | 'command' | 'ai';

const cases = [
  { id: '2026/540', court: 'Afyonkarahisar 3. Aile', client: 'Tuğba G.', stage: 'Duruşma', date: '22 Eyl', accent: 'A' },
  { id: '2026/318', court: 'Afyonkarahisar 2. İş', client: 'Özpet A.Ş.', stage: 'Bilirkişi', date: '24 Eyl', accent: 'İ' },
  { id: '2026/219', court: 'Aliağa 1. Aile', client: 'Burak A.', stage: 'Tedbir', date: '26 Eyl', accent: 'T' },
  { id: '2026/127', court: 'Konya BAM 4. HD', client: 'URZ Yapı', stage: 'İstinaf', date: '30 Eyl', accent: 'B' },
];

const researchResults = [
  { court: 'Yargıtay 3. HD', no: '2025/4182 E. · 2026/2951 K.', score: 96, text: 'İhtiyacın gerçek, samimi ve zorunlu olduğunun dava tarihinde mevcut olması ve yargılama boyunca devam etmesi gerekir.' },
  { court: 'Yargıtay 6. HD', no: '2024/5631 E. · 2025/7740 K.', score: 91, text: 'Kiraya verenin gereksiniminin geçici nitelikte olmaması; somut olayın özellikleriyle birlikte değerlendirilmesi gerekir.' },
  { court: 'Konya BAM 3. HD', no: '2025/1914 E. · 2026/802 K.', score: 84, text: 'İhtiyaç iddiası bakımından taşınmazın kullanım amacı ve tarafların mevcut koşulları birlikte dikkate alınmalıdır.' },
];

const aiPrompts = [
  'Son duruşma zaptını özetle',
  'Bilirkişi raporu geldi mi?',
  'Yaklaşan süreleri çıkar',
];

const modeLabels: Record<DemoMode, string> = {
  overview: 'Genel Bakış',
  cases: 'Dosyalar',
  research: 'İçtihat',
  uets: 'UETS',
  command: 'Komuta',
  ai: 'Asistan',
};

const dockTourModes: DemoMode[] = ['overview', 'cases', 'research', 'uets', 'command', 'ai'];

export function LiveProductDemo({
  mode = 'overview',
  dark = false,
  autoDockTour = false,
}: {
  mode?: DemoMode;
  dark?: boolean;
  autoDockTour?: boolean;
}) {
  const [activeMode, setActiveMode] = useState<DemoMode>(mode);
  const [tourEnabled, setTourEnabled] = useState(autoDockTour);
  const [cursor, setCursor] = useState({ left: 0, top: 0, visible: false, clicking: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const dockRefs = useRef<Partial<Record<DemoMode, HTMLButtonElement | null>>>({});
  const shell = dark ? 'border-white/12 bg-[#0f1f37] text-white' : 'border-[#d7d9d6] bg-[#f7f8f6] text-[#243247]';

  useEffect(() => {
    setActiveMode(mode);
    setTourEnabled(autoDockTour);
  }, [mode, autoDockTour]);

  useEffect(() => {
    if (!autoDockTour || !tourEnabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    const timers: number[] = [];
    let index = 0;

    const moveTo = (targetMode: DemoMode) => {
      const root = rootRef.current;
      const button = dockRefs.current[targetMode];
      if (!root || !button) return;
      const rootRect = root.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setCursor({
        left: buttonRect.left - rootRect.left + buttonRect.width * 0.56,
        top: buttonRect.top - rootRect.top + buttonRect.height * 0.48,
        visible: true,
        clicking: false,
      });
    };

    const schedule = () => {
      if (cancelled) return;
      const target = dockTourModes[index];
      moveTo(target);
      timers.push(window.setTimeout(() => {
        if (cancelled) return;
        setCursor((value) => ({ ...value, clicking: true }));
        setActiveMode(target);
      }, 650));
      timers.push(window.setTimeout(() => {
        if (cancelled) return;
        setCursor((value) => ({ ...value, clicking: false }));
      }, 930));
      timers.push(window.setTimeout(() => {
        if (cancelled) return;
        index = (index + 1) % dockTourModes.length;
        schedule();
      }, 2450));
    };

    timers.push(window.setTimeout(schedule, 900));
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [autoDockTour, tourEnabled]);

  const handleDockChange = (next: DemoMode) => {
    setActiveMode(next);
    if (autoDockTour) {
      setTourEnabled(false);
      setCursor((value) => ({ ...value, visible: false, clicking: false }));
    }
  };

  return (
    <div ref={rootRef} className={`live-demo relative min-w-0 overflow-hidden rounded-[10px] border sm:rounded-[12px] ${shell}`}>
      <DemoTopbar dark={dark} label={modeLabels[activeMode]} />
      <div className="live-demo-stage relative overflow-hidden">
        <div className="h-full overflow-y-auto pb-[68px] scrollbar-thin">
          {activeMode === 'overview' && <OverviewDemo dark={dark} />}
          {activeMode === 'cases' && <CasesDemo />}
          {activeMode === 'research' && <ResearchDemo />}
          {activeMode === 'uets' && <UetsDemo />}
          {activeMode === 'command' && <CommandDemo />}
          {activeMode === 'ai' && <AiDemo />}
        </div>
      </div>
      <DemoDock
        active={activeMode}
        onChange={handleDockChange}
        dark={dark}
        registerButton={(dockMode, element) => { dockRefs.current[dockMode] = element; }}
      />
      {autoDockTour && cursor.visible && tourEnabled && (
        <div
          className={`pointer-events-none absolute z-40 text-[#0b1b31] transition-[left,top,transform] duration-700 ease-out ${cursor.clicking ? 'scale-90' : 'scale-100'}`}
          style={{ left: cursor.left, top: cursor.top, transform: 'translate(-15%, -12%)' }}
          aria-hidden="true"
        >
          <MousePointer2 size={24} fill="white" strokeWidth={2.2} className="drop-shadow-[0_2px_3px_rgba(0,0,0,.32)]" />
          {cursor.clicking && <span className="demo-cursor-click absolute left-[3px] top-[3px] h-6 w-6 rounded-full border-2 border-sky-400/70" />}
        </div>
      )}
    </div>
  );
}

function DemoTopbar({ dark, label }: { dark: boolean; label: string }) {
  return (
    <div className={`flex h-9 min-w-0 items-center justify-between gap-2 border-b px-2.5 sm:px-3 ${dark ? 'border-white/10 bg-white/[0.035]' : 'border-[#e1e3df] bg-white'}`}>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-[#c7cbc7]'}`} />
        <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-[#c7cbc7]'}`} />
        <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-[#c7cbc7]'}`} />
      </div>
      <div className="flex items-center gap-2">
        <span className={`hidden text-[13px] font-semibold uppercase tracking-[0.16em] sm:inline ${dark ? 'text-white/35' : 'text-[#9a9f9b]'}`}>Faraklit</span>
        <span className={`h-3 w-px ${dark ? 'bg-white/10' : 'bg-[#e1e3df]'}`} />
        <span className={`max-w-[104px] truncate text-[13px] font-semibold sm:max-w-none ${dark ? 'text-white/65' : 'text-[#66716c]'}`}>{label}</span>
      </div>
      <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-demo-pulse" /> aktif
      </span>
    </div>
  );
}

function DemoDock({ active, onChange, dark, registerButton }: { active: DemoMode; onChange: (mode: DemoMode) => void; dark: boolean; registerButton?: (mode: DemoMode, element: HTMLButtonElement | null) => void }) {
  const items: Array<{
    mode: DemoMode;
    label: string;
    Icon: typeof LayoutDashboard;
    badge?: string;
    activeClass: string;
    idleLight: string;
    idleDark: string;
    dot: string;
  }> = [
    { mode: 'overview', label: 'Genel Bakış', Icon: LayoutDashboard, activeClass: 'border-sky-400/50 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_7px_18px_rgba(37,99,235,.28)]', idleLight: 'border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100', idleDark: 'border-sky-300/10 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20', dot: 'bg-sky-400' },
    { mode: 'cases', label: 'Dosyalar', Icon: FolderOpen, activeClass: 'border-blue-300/60 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-[0_7px_18px_rgba(37,99,235,.28)]', idleLight: 'border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100', idleDark: 'border-blue-300/10 bg-blue-400/10 text-blue-200 hover:bg-blue-400/20', dot: 'bg-blue-400' },
    { mode: 'research', label: 'İçtihat', Icon: BookOpen, activeClass: 'border-violet-300/50 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_7px_18px_rgba(147,51,234,.28)]', idleLight: 'border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100', idleDark: 'border-violet-300/10 bg-violet-400/10 text-violet-200 hover:bg-violet-400/20', dot: 'bg-violet-400' },
    { mode: 'uets', label: 'UETS', Icon: Inbox, badge: '2', activeClass: 'border-cyan-300/50 bg-gradient-to-br from-cyan-400 to-teal-600 text-white shadow-[0_7px_18px_rgba(13,148,136,.28)]', idleLight: 'border-cyan-100 bg-cyan-50 text-cyan-700 hover:bg-cyan-100', idleDark: 'border-cyan-300/10 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20', dot: 'bg-cyan-400' },
    { mode: 'command', label: 'Komuta', Icon: ListChecks, badge: '5', activeClass: 'border-rose-300/50 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_7px_18px_rgba(225,29,72,.28)]', idleLight: 'border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100', idleDark: 'border-rose-300/10 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20', dot: 'bg-rose-400' },
    { mode: 'ai', label: 'Asistan', Icon: Sparkles, activeClass: 'border-indigo-300/50 bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-[0_7px_18px_rgba(79,70,229,.3)]', idleLight: 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100', idleDark: 'border-indigo-300/10 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/20', dot: 'bg-indigo-400' },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center px-1.5 sm:bottom-2.5 sm:px-2">
      <nav
        aria-label="Faraklit demo dock"
        className={`pointer-events-auto flex max-w-full items-end gap-0.5 overflow-x-auto rounded-[14px] border px-1 py-1 backdrop-blur-xl scrollbar-thin sm:gap-1 sm:rounded-[16px] sm:px-1.5 sm:py-1.5 ${
          dark
            ? 'border-white/15 bg-[#081728]/90 shadow-[0_10px_30px_rgba(0,0,0,.28)]'
            : 'border-[#d5dcd7] bg-white/92 shadow-[0_12px_34px_rgba(31,45,62,.16)]'
        }`}
      >
        {items.map(({ mode, label, Icon, badge, activeClass, idleLight, idleDark, dot }) => {
          const isActive = active === mode;
          return (
            <button
              key={mode}
              ref={(element) => registerButton?.(mode, element)}
              type="button"
              title={label}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(mode)}
              className={`group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border transition-all duration-200 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 sm:rounded-[10px] ${
                isActive ? `${activeClass} -translate-y-1` : dark ? idleDark : idleLight
              }`}
            >
              <Icon size={15} strokeWidth={1.9} />
              {badge && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white/80 bg-[#17263a] px-1 text-[13px] font-bold text-white shadow-sm">{badge}</span>
              )}
              <span className={`absolute -bottom-[5px] h-[2px] w-3 rounded-full transition ${isActive ? dot : 'bg-transparent'}`} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function OverviewDemo({ dark }: { dark: boolean }) {
  return (
    <main className={`min-h-full p-2.5 min-[380px]:p-3 sm:p-5 ${dark ? 'bg-[#11243f]' : 'bg-[#f4f5f3]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[13px] font-medium uppercase tracking-[0.13em] ${dark ? 'text-white/38' : 'text-[#929995]'}`}>19 Eylül 2026 · Cumartesi</p>
          <h4 className={`mt-1 text-[16px] font-semibold sm:text-[19px] ${dark ? 'text-white' : 'text-[#203149]'}`}>İyi günler, Av. Furkan Tunca</h4>
          <p className={`mt-1 text-[13px] ${dark ? 'text-white/38' : 'text-[#8b928e]'}`}>Bugün yapmanız gerekenleri tek bakışta görün.</p>
        </div>
        <div className={`hidden shrink-0 rounded-md border px-2 py-1.5 text-[13px] font-semibold min-[390px]:block ${dark ? 'border-white/10 bg-white/5 text-white/55' : 'border-[#dce0dc] bg-white text-[#68756f]'}`}>Ofis · Çevrimiçi</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 min-[380px]:gap-2 sm:mt-4 sm:grid-cols-4">
        {[
          { label: 'Bugünkü duruşma', value: '3', Icon: Gavel },
          { label: 'Kritik süre', value: '5', Icon: Clock3 },
          { label: 'Yeni UETS', value: '2', Icon: Inbox },
          { label: 'Açık görev', value: '18', Icon: CheckCircle2 },
        ].map(({ label, value, Icon }) => (
          <div key={label} className={`rounded-lg border p-2 sm:p-3 ${dark ? 'border-white/10 bg-white/[0.045]' : 'border-[#e0e3df] bg-white'}`}>
            <Icon size={12} className={dark ? 'text-white/45' : 'text-[#687768]'} />
            <div className={`mt-2.5 text-[16px] sm:mt-3 sm:text-[17px] font-semibold ${dark ? 'text-white' : 'text-[#203149]'}`}>{value}</div>
            <div className={`mt-0.5 truncate text-[13px] ${dark ? 'text-white/40' : 'text-[#838a86]'}`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:mt-3 sm:grid-cols-[1.35fr_.65fr] sm:gap-3">
        <div className={`rounded-lg border ${dark ? 'border-white/10 bg-white/[0.035]' : 'border-[#e0e3df] bg-white'}`}>
          <div className={`flex items-center justify-between border-b px-3 py-2.5 ${dark ? 'border-white/10' : 'border-[#eceeeb]'}`}>
            <span className={`text-[14px] font-semibold ${dark ? 'text-white/80' : 'text-[#425067]'}`}>Bugünün akışı</span>
            <span className={`text-[13px] ${dark ? 'text-white/35' : 'text-[#949a96]'}`}>Canlı</span>
          </div>
          <div className="divide-y divide-black/[0.045]">
            {[
              ['09:30', 'Afyonkarahisar 3. Aile Mah.', 'Ön inceleme duruşması'],
              ['11:10', 'Konya BAM 4. Hukuk Dairesi', 'İstinaf incelemesi'],
              ['14:00', 'Müvekkil görüşmesi', 'Dosya stratejisi'],
            ].map((item, index) => (
              <div key={item[0]} className="flex items-center gap-2.5 px-3 py-2.5 live-demo-row" style={{ animationDelay: `${index * 130}ms` }}>
                <span className={`w-8 text-[13px] font-semibold ${dark ? 'text-white/45' : 'text-[#8a928e]'}`}>{item[0]}</span>
                <span className={`h-5 w-px ${dark ? 'bg-white/10' : 'bg-[#e1e4e0]'}`} />
                <div className="min-w-0">
                  <div className={`truncate text-[14px] font-medium ${dark ? 'text-white/80' : 'text-[#34445a]'}`}>{item[1]}</div>
                  <div className={`mt-0.5 truncate text-[13px] ${dark ? 'text-white/35' : 'text-[#909692]'}`}>{item[2]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-lg border p-3 ${dark ? 'border-white/10 bg-white/[0.035]' : 'border-[#e0e3df] bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[14px] font-semibold ${dark ? 'text-white/80' : 'text-[#425067]'}`}>Yaklaşan süre</span>
            <Bell size={11} className={dark ? 'text-white/40' : 'text-[#718078]'} />
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['İstinaf cevap', '2 gün', 86],
              ['Bilirkişi beyan', '4 gün', 63],
              ['Tanık listesi', '7 gün', 38],
            ].map(([label, day, width]) => (
              <div key={label as string}>
                <div className="flex justify-between gap-2 text-[13px]">
                  <span className={dark ? 'text-white/65' : 'text-[#596675]'}>{label as string}</span>
                  <span className={dark ? 'text-white/35' : 'text-[#909692]'}>{day as string}</span>
                </div>
                <div className={`mt-1.5 h-1 overflow-hidden rounded-full ${dark ? 'bg-white/10' : 'bg-[#e9ece8]'}`}>
                  <div className={`h-full rounded-full ${dark ? 'bg-white/45' : 'bg-[#687f72]'}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function CasesDemo() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(cases[0]);
  const filtered = useMemo(
    () => cases.filter((item) => `${item.id} ${item.court} ${item.client}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'))),
    [query],
  );

  return (
    <div className="min-h-full bg-[#f7f8f6] p-2.5 min-[380px]:p-3 sm:p-4">
      <div className="flex flex-col gap-2 min-[460px]:flex-row min-[460px]:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#dfe3de] bg-white px-2.5 py-2">
          <Search size={12} className="shrink-0 text-[#84908a]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Dosya, müvekkil veya mahkeme ara" className="min-w-0 flex-1 bg-transparent text-[14px] text-[#34445a] outline-none placeholder:text-[#a0a6a2]" />
        </label>
        <button type="button" onClick={() => setQuery('Aile')} className="w-full shrink-0 rounded-md border border-[#dfe3de] bg-white px-2.5 py-2 text-[14px] font-medium text-[#53616f] hover:bg-[#f6f7f5] min-[460px]:w-auto">Aile dosyaları</button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {(filtered.length ? filtered : cases).map((item) => (
          <button key={item.id} type="button" onClick={() => setSelected(item)} className={`min-w-[132px] rounded-lg min-[380px]:min-w-[145px] border p-2.5 text-left transition ${selected.id === item.id ? 'border-[#9aafa0] bg-[#edf3ef]' : 'border-[#e0e3df] bg-white hover:border-[#c9d0cb]'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1d3554] text-[13px] font-semibold text-white">{item.accent}</span>
              <span className="text-[13px] font-semibold text-[#758178]">{item.stage}</span>
            </div>
            <div className="mt-2 truncate text-[14px] font-semibold text-[#33445a]">{item.court}</div>
            <div className="mt-0.5 truncate text-[13px] text-[#8c938f]">{item.id} · {item.client}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2.5 md:grid-cols-[1.18fr_.82fr] md:gap-3">
        <div className="rounded-lg border border-[#e0e3df] bg-white p-3">
          <div className="flex flex-col gap-2 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between min-[430px]:gap-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.13em] text-[#969c98]">Seçili dosya</p>
              <h5 className="mt-1.5 text-[15px] font-semibold text-[#263950]">{selected.court}</h5>
              <p className="mt-0.5 text-[13px] text-[#818985]">{selected.id} · {selected.client}</p>
            </div>
            <span className="w-fit rounded-full bg-[#eef3f0] px-2 py-1 text-[13px] font-semibold text-[#607669]">{selected.date}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#eceeeb] pt-3 text-center">
            {[['18', 'Evrak'], ['4', 'Duruşma'], ['6', 'Görev']].map(([value, label]) => (
              <div key={label} className="rounded-md bg-[#f7f8f6] py-2"><div className="text-[15px] font-semibold text-[#35465c]">{value}</div><div className="text-[13px] text-[#959b97]">{label}</div></div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#e0e3df] bg-white p-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.13em] text-[#969c98]">Son evraklar</p>
          <div className="mt-2 space-y-1.5">
            {['Son duruşma zaptı.pdf', 'Bilirkişi raporu.pdf', 'Vekâletname.pdf'].map((doc, i) => (
              <div key={doc} className="flex items-center gap-2 rounded-md bg-[#f7f8f6] p-2 live-demo-row" style={{ animationDelay: `${i * 90}ms` }}>
                <FileText size={10} className="text-[#708077]" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#536170]">{doc}</span>
                {i === 0 && <span className="rounded-full bg-[#eaf3ed] px-1.5 py-0.5 text-[13px] font-semibold text-[#4d705c]">yeni</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResearchDemo() {
  const [query, setQuery] = useState('ihtiyaç nedeniyle tahliye gerçek samimi zorunlu ihtiyaç');
  const [searched, setSearched] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Yargıtay');

  const runSearch = () => {
    setSearched(false);
    window.setTimeout(() => setSearched(true), 420);
  };

  return (
    <div className="min-h-full bg-[#f8f9f7] p-2.5 min-[380px]:p-3 sm:p-4">
      <div className="mx-auto min-w-0 max-w-[650px]">
        <div className="rounded-lg border border-[#dce0dc] bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Search size={13} className="ml-1 shrink-0 text-[#718078]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-[#34445a] outline-none" aria-label="İçtihat sorgusu" />
            <button type="button" onClick={runSearch} className="shrink-0 rounded-md bg-[#1a314e] px-2.5 py-2 text-[13px] sm:px-3 font-semibold text-white transition hover:bg-[#122640]">Ara</button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Yargıtay', 'BAM', 'Kira hukuku', 'En ilgili pasaj'].map((filter) => (
            <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`rounded-full border px-2 py-1 text-[13px] font-medium transition ${activeFilter === filter ? 'border-[#8fa597] bg-[#edf3ef] text-[#496353]' : 'border-[#e0e3df] bg-white text-[#69756f] hover:border-[#bec9c1]'}`}>{filter}</button>
          ))}
        </div>

        <div className="mt-3 space-y-2" aria-live="polite">
          {!searched ? (
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((n) => <div key={n} className="h-[67px] animate-pulse rounded-lg border border-[#e3e6e2] bg-white p-3"><div className="h-2 w-1/3 rounded bg-[#edf0ed]" /><div className="mt-3 h-2 w-full rounded bg-[#f0f2f0]" /><div className="mt-2 h-2 w-4/5 rounded bg-[#f0f2f0]" /></div>)}
            </div>
          ) : researchResults.map((result, index) => (
            <button key={result.no} type="button" className="group block w-full rounded-lg border border-[#e0e3df] bg-white p-3 text-left transition hover:border-[#bfc9c2] hover:shadow-sm live-demo-row" style={{ animationDelay: `${index * 100}ms` }}>
              <span className="flex flex-col gap-2 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between min-[440px]:gap-3">
                <span className="text-[13px] font-semibold text-[#2e4d6e]">{result.court} · {result.no}</span>
                <span className="rounded-full bg-[#eef4f0] px-2 py-0.5 text-[13px] font-semibold text-[#50705e]">%{result.score} eşleşme</span>
              </span>
              <span className="mt-2 block text-[14px] leading-4 text-[#596673]">{result.text}</span>
              <span className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-[#6c7d73] opacity-70 transition group-hover:opacity-100">Dilekçeye aktar <ChevronRight size={9} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UetsDemo() {
  const [matched, setMatched] = useState(false);
  const [tasked, setTasked] = useState(false);
  return (
    <div className="min-h-full bg-white p-2.5 min-[380px]:p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div><p className="text-[14px] font-semibold text-[#405167]">UETS e-Tebligat Merkezi</p><p className="mt-0.5 text-[13px] text-[#959b97]">Az önce güncellendi · 2 yeni kayıt</p></div>
        <span className="rounded-full bg-[#eaf3ed] px-2 py-1 text-[13px] font-semibold text-[#4d705d]">Bağlı</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-[1.2fr_.8fr] sm:gap-3">
        <div className="overflow-hidden rounded-lg border border-[#e1e4e0]">
          {[
            ['Afyonkarahisar 3. Aile Mah.', '7200019246721', 'Bugün 09:42'],
            ['Konya BAM 4. Hukuk Dairesi', '7200019246558', 'Dün 16:18'],
            ['Afyonkarahisar 2. İş Mah.', '7200019246112', 'Dün 11:03'],
          ].map((row, i) => (
            <div key={row[1]} className={`flex items-center gap-2.5 border-b border-[#eef0ed] px-3 py-3 last:border-0 ${i === 0 ? 'bg-[#fbfcfa]' : ''}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${i === 0 && !matched ? 'bg-[#fff2e7] text-[#a66d3f]' : 'bg-[#eef3f0] text-[#61776a]'}`}><Inbox size={12} /></span>
              <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold text-[#405066]">{row[0]}</div><div className="mt-0.5 truncate text-[13px] text-[#959b97]">{row[1]} · {row[2]}</div></div>
              <span className={`text-[13px] font-semibold ${i === 0 && !matched ? 'text-[#a86d3f]' : 'text-[#5f7869]'}`}>{i === 0 && !matched ? 'Eşleşmedi' : 'Dosyada'}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-[#e1e4e0] bg-[#f7f8f6] p-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#929995]">Önerilen işlem</p>
          <div className="mt-3 flex items-start gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eaf0f5] text-[#46617e]"><WandSparkles size={12} /></span>
            <div><div className="text-[14px] font-semibold text-[#3f5065]">Dosya eşleşmesi bulundu</div><div className="mt-1 text-[13px] leading-4 text-[#7c8580]">2026/540 · Afyonkarahisar 3. Aile Mah.</div></div>
          </div>
          <div className="mt-3 rounded-md border border-[#e0e3df] bg-white p-2.5">
            <div className="flex justify-between text-[13px]"><span className="text-[#7e8782]">Cevap süresi</span><span className="font-semibold text-[#405066]">5 gün</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#edf0ed]"><div className="h-full w-[68%] rounded-full bg-[#b47b50] live-demo-progress" /></div>
            <div className="mt-2 text-[13px] text-[#9a9f9b]">Son gün · 24 Eylül 2026</div>
          </div>
          {!matched ? (
            <button type="button" onClick={() => setMatched(true)} className="mt-3 w-full rounded-md bg-[#1b314e] px-3 py-2 text-[13px] font-semibold text-white">Dosyayla eşleştir</button>
          ) : !tasked ? (
            <button type="button" onClick={() => setTasked(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#557362] px-3 py-2 text-[13px] font-semibold text-white"><Check size={10} /> Eşleşti · görev oluştur</button>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#e9f2ec] px-3 py-2 text-[13px] font-semibold text-[#4d705c]"><CheckCircle2 size={10} /> Görev ve süre oluşturuldu</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommandDemo() {
  const [active, setActive] = useState(1);
  const items = [
    { time: '09:30', title: 'Ön inceleme duruşması', meta: 'Afyonkarahisar 3. Aile · Salon 2', level: 'Bugün' },
    { time: '11:00', title: 'İstinaf cevap süresi', meta: 'URZ Yapı · 2 gün kaldı', level: 'Kritik' },
    { time: '13:30', title: 'Bilirkişi raporu incele', meta: 'Afyonkarahisar 2. İş · Yeni evrak', level: 'Yeni' },
    { time: '16:00', title: 'Müvekkil görüşmesi', meta: 'Dosya stratejisi · 30 dk', level: 'Planlı' },
  ];
  return (
    <div className="min-h-full bg-[#11243f] p-2.5 text-white min-[380px]:p-3 sm:p-4">
      <div className="grid grid-cols-3 gap-1.5 min-[380px]:gap-2">
        {[['5', 'Kritik işlem'], ['3', 'Duruşma'], ['18', 'Açık görev']].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] p-2.5 sm:p-3"><div className="text-[16px] sm:text-[17px] font-semibold">{value}</div><div className="mt-0.5 text-[13px] text-white/40">{label}</div></div>
        ))}
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5"><span className="text-[14px] font-semibold text-white/75">Bugünün işleri</span><span className="text-[13px] text-white/35">Canlı</span></div>
        <div>
          {items.map((item, index) => (
            <button key={item.time} type="button" onClick={() => setActive(index)} className={`grid w-full grid-cols-[34px_minmax(0,1fr)] items-center gap-2 min-[430px]:grid-cols-[38px_minmax(0,1fr)_auto] border-b border-white/[0.07] px-3 py-2.5 text-left transition last:border-0 ${active === index ? 'bg-white/[0.09]' : 'hover:bg-white/[0.04]'}`}>
              <span className="text-[13px] font-semibold text-white/35">{item.time}</span>
              <span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-white/75">{item.title}</span><span className="mt-0.5 block truncate text-[13px] text-white/35">{item.meta}</span></span>
              <span className={`hidden rounded-full px-2 py-1 text-[13px] font-semibold min-[430px]:inline-flex ${index === 1 ? 'bg-[#8b5d43]/35 text-[#f2c8ac]' : 'bg-white/[0.07] text-white/45'}`}>{item.level}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 p-2.5">
        <Sparkles size={11} className="text-white/65" />
        <p className="text-[13px] leading-4 text-white/48">Faraklit önerisi: <span className="text-white/72">İstinaf cevap süresi</span> en yakın süre. İlgili dosya hazır.</p>
      </div>
    </div>
  );
}

function AiDemo() {
  const [prompt, setPrompt] = useState(aiPrompts[0]);
  const [answer, setAnswer] = useState('Son duruşmada tanıkların dinlenmesine devam edilmesine ve eksik müzekkere cevaplarının beklenmesine karar verilmiş. Yeni duruşma 22 Eylül 2026 saat 09:30.');
  const [thinking, setThinking] = useState(false);

  const answers: Record<string, string> = {
    [aiPrompts[0]]: 'Son duruşmada tanıkların dinlenmesine devam edilmesine ve eksik müzekkere cevaplarının beklenmesine karar verilmiş. Yeni duruşma 22 Eylül 2026 saat 09:30.',
    [aiPrompts[1]]: 'Evet. 17 Eylül 2026 tarihli bilirkişi raporu dosyaya eklenmiş. Rapor 14 sayfa. Ücret ve fazla mesai hesabıyla ilgili 3 temel tespit var.',
    [aiPrompts[2]]: 'Dosyada 24 Eylül tarihli istinaf cevap süresi ile 29 Eylül tarihli bilirkişi raporuna beyan süresi görünüyor. En yakın süre 5 gün sonra doluyor.',
  };

  const ask = (next: string) => {
    setPrompt(next);
    setThinking(true);
    window.setTimeout(() => {
      setAnswer(answers[next] || 'Dosyadaki ilgili evraklar tarandı. Kısa özet hazır.');
      setThinking(false);
    }, 360);
  };

  return (
    <div className="min-h-full bg-[#f7f8f6] p-2.5 min-[380px]:p-3 sm:p-4">
      <div className="rounded-lg border border-[#e0e3df] bg-white p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#edf2ef] text-[#567060]"><FolderOpen size={12} /></span><div><div className="truncate text-[14px] font-semibold text-[#405066]">Afyonkarahisar 3. Aile · 2026/540</div><div className="text-[13px] text-[#969c98]">18 evrak · dosya taramaya hazır</div></div></div>
          <div className="flex items-center gap-1.5 text-[13px] text-[#758179]"><CheckCircle2 size={9} /> 4 kaynak taramaya hazır</div>
        </div>
      </div>
      <div className="mt-3 flex min-h-[245px] flex-col overflow-hidden rounded-lg border border-[#e0e3df] bg-white">
        <div className="flex items-center gap-2 border-b border-[#eceeeb] px-3 py-2.5"><MessageSquareText size={11} className="text-[#607568]" /><span className="text-[14px] font-semibold text-[#405066]">Dosyanıza sorun</span></div>
        <div className="flex-1 p-3">
          <div className="ml-auto max-w-[82%] rounded-[9px_9px_2px_9px] bg-[#1c334f] px-3 py-2 text-[13px] leading-4 text-white">{prompt}</div>
          <div className="mt-2 max-w-[90%] rounded-[9px_9px_9px_2px] border border-[#e1e4e0] bg-[#fafbf9] px-3 py-2.5 text-[13px] leading-4 text-[#566371]" aria-live="polite">
            {thinking ? <span className="flex items-center gap-1 py-1"><span className="h-1.5 w-1.5 rounded-full bg-[#809087] typing-dot" /><span className="h-1.5 w-1.5 rounded-full bg-[#809087] typing-dot-2" /><span className="h-1.5 w-1.5 rounded-full bg-[#809087] typing-dot-3" /></span> : answer}
          </div>
        </div>
        <div className="border-t border-[#eceeeb] p-2.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {aiPrompts.map((item) => <button key={item} type="button" onClick={() => ask(item)} className="shrink-0 rounded-full border border-[#dde1dd] bg-[#f8f9f7] px-2.5 py-1.5 text-[13px] font-medium text-[#657168] transition hover:border-[#bfc9c1]">{item}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const cinematicSteps = [
  { title: 'Yeni UETS tebligatı', sub: '7200019246721 · 09:42', Icon: Inbox },
  { title: 'Dosya otomatik bulundu', sub: 'Afyonkarahisar 3. Aile · 2026/540', Icon: FolderOpen },
  { title: '5 günlük süre hesaplandı', sub: 'Son gün · 24 Eylül 2026', Icon: Clock3 },
  { title: 'Görev oluşturuldu', sub: 'Cevap dilekçesini hazırla', Icon: ListChecks },
  { title: 'Taslak önerisi hazır', sub: 'Dosya + tebligat + içtihat', Icon: Sparkles },
];

export function CinematicWorkflow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  const getScrollBounds = () => {
    const node = rootRef.current;
    const stickyNode = stickyRef.current;
    if (!node || !stickyNode) return null;

    const stickyTop = window.innerWidth < 640 ? 68 : 96;
    const rootTop = window.scrollY + node.getBoundingClientRect().top;
    const panelHeight = stickyNode.offsetHeight;

    // Match the animation range to the exact distance the sticky panel can travel
    // inside its parent. This removes the unused scroll reservoir that previously
    // showed up as a large blank area below the demo.
    const stickyTravel = Math.max(1, node.offsetHeight - panelHeight - stickyTop);
    const start = rootTop - stickyTop;
    const end = start + stickyTravel;
    return { start, end };
  };

  const goToStep = (index: number) => {
    setStep(index);
    const bounds = getScrollBounds();
    if (!bounds) return;
    const progress = cinematicSteps.length === 1 ? 0 : index / (cinematicSteps.length - 1);
    const top = bounds.start + progress * (bounds.end - bounds.start);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = getScrollBounds();
      if (!bounds) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY - bounds.start) / Math.max(1, bounds.end - bounds.start)));
      const next = Math.min(cinematicSteps.length - 1, Math.round(progress * (cinematicSteps.length - 1)));
      setStep(next);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative h-[1320px] min-[480px]:h-[1400px] sm:h-[1520px] lg:h-[1660px]">
      <div ref={stickyRef} className="cinematic-sticky sticky top-[68px] py-3 sm:top-24 sm:py-4">
        <div className="overflow-hidden rounded-[14px] border border-[#263c58] sm:rounded-[22px] bg-[#0f2038] shadow-[0_30px_90px_rgba(18,37,62,.22)]">
          <div className="flex h-10 min-w-0 items-center justify-between gap-2 border-b border-white/10 px-3 text-white sm:px-4">
            <div className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[14px] font-bold text-[#10233f]">F</span><span className="truncate text-[14px] font-semibold">Faraklit Otomatik Akış</span></div>
            <div className="hidden text-[13px] text-white/40 sm:block">Aşağı kaydırarak ilerlet</div>
            <span className="flex items-center gap-1 text-[13px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-demo-pulse" /> canlı</span>
          </div>

          <div className="bg-[#11243f] p-2.5 min-[380px]:p-3 sm:p-5">
            <div className="flex snap-x gap-1.5 overflow-x-auto pb-1 scrollbar-thin sm:grid sm:grid-cols-5 sm:gap-2 sm:overflow-visible sm:pb-0">
              {cinematicSteps.map(({ title, Icon }, index) => (
                <button key={title} type="button" onClick={() => goToStep(index)} className={`min-w-[148px] snap-start rounded-lg border px-3 py-2.5 text-left transition sm:min-w-0 ${index <= step ? 'border-white/15 bg-white/[0.08]' : 'border-white/[0.07] bg-white/[0.025]'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${index < step ? 'bg-emerald-400/15 text-emerald-300' : index === step ? 'bg-white text-[#132640]' : 'bg-white/[0.05] text-white/28'}`}>{index < step ? <Check size={10} /> : <Icon size={10} />}</span>
                    <span className={`block truncate text-[14px] font-medium ${index <= step ? 'text-white/70' : 'text-white/28'}`}>{title}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[1.35fr_.65fr] lg:gap-4">
              <div className="relative min-h-[470px] overflow-hidden rounded-xl border border-white/10 bg-[#f6f7f5] p-4 sm:min-h-[500px] sm:p-5 lg:min-h-[520px]">
                <div className="flex items-start justify-between gap-2 border-b border-[#e3e6e2] pb-3">
                  <div><p className="text-[13px] font-semibold uppercase tracking-[0.13em] text-[#969c98]">Faraklit adım adım ilerliyor</p><h4 className="mt-1 text-[16px] font-semibold text-[#263950]">{cinematicSteps[step].title}</h4></div>
                  <span className="shrink-0 rounded-full bg-[#e9f1ec] px-2 py-1 text-[13px] font-semibold text-[#56705f]">Adım {step + 1}/5</span>
                </div>

                <div className="mt-3 space-y-2 min-[420px]:mt-4 min-[420px]:space-y-2.5">
                  {cinematicSteps.map(({ title, sub, Icon }, index) => {
                    const done = index < step;
                    const current = index === step;
                    return (
                      <div key={title} className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition-all min-[420px]:gap-3 min-[420px]:p-3 duration-500 ${done ? 'border-[#dbe6df] bg-[#f0f5f2]' : current ? 'border-[#b9c9bf] bg-white shadow-[0_8px_24px_rgba(36,54,70,.08)]' : 'border-[#e7e9e6] bg-[#fafbf9] opacity-45'}`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-[#dcebe2] text-[#4f705d]' : current ? 'bg-[#1b3452] text-white' : 'bg-[#eef0ed] text-[#9ba19d]'}`}>{done ? <Check size={13} /> : <Icon size={13} />}</span>
                        <div className="min-w-0 flex-1"><div className={`text-[15px] font-semibold ${done || current ? 'text-[#35475d]' : 'text-[#929995]'}`}>{title}</div><div className="mt-0.5 text-[14px] leading-5 text-[#7f8984]">{sub}</div></div>
                        {current && <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 live-demo-pulse" />}
                      </div>
                    );
                  })}
                </div>

                {step === 4 && (
                  <div className="mt-4 rounded-lg border border-[#d5ded8] bg-white p-3 shadow-[0_12px_35px_rgba(31,49,68,.12)] sm:p-4 live-demo-row">
                    <div className="flex items-center gap-2"><Sparkles size={11} className="text-[#557363]" /><span className="text-[15px] font-semibold text-[#405268]">Dilekçe çalışma önerisi</span></div>
                    <p className="mt-1.5 text-[14px] leading-5 text-[#6d7872]">Tebligat dosyayla eşleşti. İlgili kararları tarayıp cevap dilekçesi taslağına başlayabilirsiniz.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#edf3ef] px-2 py-1 text-[13px] text-[#567060]">18 evrak</span><span className="rounded-full bg-[#edf1f5] px-2 py-1 text-[13px] text-[#536a83]">3 içtihat</span><span className="rounded-full bg-[#edf3f8] px-2 py-1 text-[13px] text-[#526b83]">5 gün</span></div>
                  </div>
                )}
              </div>

              <div className="hidden rounded-xl border border-white/10 bg-white/[0.045] p-4 text-white lg:block">
                <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/35">Faraklit ne yaptı?</p>
                <div className="mt-4 space-y-3">
                  {cinematicSteps.slice(0, step + 1).map(({ title, sub, Icon }, index) => (
                    <div key={title} className="flex gap-2.5 live-demo-row" style={{ animationDelay: `${index * 80}ms` }}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.07] text-white/65"><Icon size={10} /></span>
                      <div><div className="text-[13px] font-semibold text-white/72">{title}</div><div className="mt-0.5 text-[13px] leading-3 text-white/32">{sub}</div></div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-[13px] text-white/35"><span>Tamamlanan</span><span>{(step + 1) * 20}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400/65 transition-all duration-500" style={{ width: `${(step + 1) * 20}%` }} /></div>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex justify-center sm:mt-3">
              <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[13px] sm:gap-1 sm:rounded-[15px] border border-white/12 bg-[#081728]/94 p-1.5 shadow-xl backdrop-blur-xl">
                {[
                  { Icon: LayoutDashboard, color: 'from-sky-400 to-blue-600', idle: 'bg-sky-400/10 text-sky-200' },
                  { Icon: FolderOpen, color: 'from-blue-500 to-cyan-600', idle: 'bg-blue-400/10 text-blue-200' },
                  { Icon: BookOpen, color: 'from-violet-500 to-fuchsia-600', idle: 'bg-violet-400/10 text-violet-200' },
                  { Icon: Inbox, color: 'from-cyan-400 to-teal-600', idle: 'bg-cyan-400/10 text-cyan-200' },
                  { Icon: ListChecks, color: 'from-rose-500 to-red-600', idle: 'bg-rose-400/10 text-rose-200' },
                  { Icon: Sparkles, color: 'from-indigo-500 to-violet-700', idle: 'bg-indigo-400/10 text-indigo-200' },
                ].map(({ Icon, color, idle }, index) => {
                  const selected = index === [3, 1, 4, 4, 5][step];
                  return (
                    <span key={index} className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] min-[380px]:h-8 min-[380px]:w-8 min-[380px]:rounded-[9px] border border-white/[0.06] transition-all ${selected ? `-translate-y-0.5 bg-gradient-to-br ${color} text-white shadow-lg` : idle}`}>
                      <Icon size={13} />
                      {index === 3 && <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-white/80 bg-[#17263a] px-0.5 text-[12px] font-bold text-white">2</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
