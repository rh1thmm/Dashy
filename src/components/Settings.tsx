import { useEffect, useState } from 'react';
import { ArrowLeft, Circle, Plus, Trash, X } from '@phosphor-icons/react';
import type { ThemeConfig, TrainingConfig, WidgetData } from '../types';
import { DAY_NAMES, normalizeTrainingConfig } from '../lib/training';
import { TIMEZONES } from '../lib/timezones';

type Tab = 'appearance' | 'clock' | 'weather' | 'tasks' | 'triggers' | 'docker' | 'training' | 'data';

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' }, { id: 'clock', label: 'Clock' }, { id: 'weather', label: 'Weather' },
  { id: 'tasks', label: 'Tasks' }, { id: 'triggers', label: 'Actions' }, { id: 'docker', label: 'Docker' },
  { id: 'training', label: 'Training' }, { id: 'data', label: 'Data' },
];

export function Settings({ widgets, setWidgets, theme, setTheme, gridLineWeight, setGridLineWeight, gridLineStyle, setGridLineStyle, showNoise, setShowNoise, onClose, onClear }: {
  widgets: WidgetData[];
  setWidgets: React.Dispatch<React.SetStateAction<WidgetData[]>>;
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  gridLineWeight: 'thin' | 'normal';
  setGridLineWeight: (value: 'thin' | 'normal') => void;
  gridLineStyle: 'solid' | 'dashed' | 'dotted' | 'hidden';
  setGridLineStyle: (value: 'solid' | 'dashed' | 'dotted' | 'hidden') => void;
  showNoise: boolean;
  setShowNoise: (value: boolean) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const [tab, setTab] = useState<Tab>('appearance');
  const [confirmClear, setConfirmClear] = useState(false);
  const widget = (type: WidgetData['type']) => widgets.find(item => item.type === type);
  const update = (type: WidgetData['type'], config: object) => setWidgets(current => current.map(item => item.type === type ? { ...item, config: { ...item.config, ...config } } : item));
  const training = normalizeTrainingConfig(widget('training')?.config);
  const installed = (type: WidgetData['type']) => Boolean(widget(type));

  const title = TABS.find(item => item.id === tab)?.label ?? 'Settings';
  return (
    <div className="w-dvw h-dvh bg-bone text-charcoal flex overflow-hidden" style={{ '--color-bone': theme.canvas, '--color-bone-alt': theme.surface, '--color-charcoal': theme.ink, '--color-charcoal-muted': theme.muted, '--color-border': theme.grid } as React.CSSProperties}>
      <aside className="w-60 shrink-0 px-7 py-8 border-r-[1px] border-border flex flex-col">
        <button onClick={onClose} className="flex items-center gap-2 self-start font-sans text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity cursor-pointer"><ArrowLeft size={14} weight="thin" /> Dashboard</button>
        <h1 className="font-serif text-3xl tracking-wide mt-12 mb-10">Settings</h1>
        <nav className="flex flex-col gap-1">
          {TABS.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 py-2 text-left font-sans text-xs tracking-wide transition-opacity cursor-pointer ${tab === item.id ? 'opacity-100' : 'opacity-40 hover:opacity-75'}`}><Circle size={7} weight="fill" className={tab === item.id ? 'opacity-100' : 'opacity-0'} />{item.label}</button>)}
        </nav>
        <span className="mt-auto font-sans text-[9px] uppercase tracking-widest opacity-25">Dashy settings</span>
      </aside>
      <main className="flex-1 overflow-y-auto px-10 py-9 max-w-4xl">
        <div className="max-w-2xl">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] opacity-40">Preferences</span>
          <h2 className="font-serif text-4xl tracking-tight mt-2 mb-10">{title}</h2>
          {tab === 'appearance' && <Appearance theme={theme} setTheme={setTheme} gridLineWeight={gridLineWeight} setGridLineWeight={setGridLineWeight} gridLineStyle={gridLineStyle} setGridLineStyle={setGridLineStyle} showNoise={showNoise} setShowNoise={setShowNoise} />}
          {tab === 'clock' && <Section installed={installed('clock')}><TimezonePicker value={widget('clock')?.config?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone} onSelect={timezone => update('clock', { timezone })} /></Section>}
          {tab === 'weather' && <Section installed={installed('weather')}><LocationPicker value={widget('weather')?.config?.city ?? ''} onSelect={location => update('weather', { city: `${location.name}, ${location.country}`, country: location.country, latitude: location.latitude, longitude: location.longitude })} /></Section>}
          {tab === 'tasks' && <Section installed={installed('tasks')}><Label>Remove completed after</Label><select value={widget('tasks')?.config?.removeAfter ?? 'never'} onChange={e => update('tasks', { removeAfter: e.target.value })} className="setting-input"><option value="never">Never</option><option value="instant">Instantly</option><option value="1h">After 1 hour</option><option value="1d">After 1 day</option></select></Section>}
          {tab === 'triggers' && <ActionSettings installed={installed('triggers')} triggers={widget('triggers')?.config?.triggers ?? []} onChange={triggers => update('triggers', { triggers })} />}
          {tab === 'docker' && <Section installed={installed('docker')}><p className="font-sans text-sm leading-relaxed opacity-55">Docker reads the local socket first, then the Docker CLI. Connection and access status remain visible directly in the widget.</p></Section>}
          {tab === 'training' && <TrainingSettings installed={installed('training')} config={training} onChange={config => update('training', config)} />}
          {tab === 'data' && <section><Subheading>Reset dashboard</Subheading><p className="font-sans text-sm leading-relaxed opacity-55 max-w-xl">Clears saved layout, widget settings, session history, and theme preferences from the local SQLite database. Dashy returns to its original dashboard.</p>{confirmClear ? <div className="flex items-center gap-3 mt-6"><button onClick={onClear} className="flex items-center gap-2 px-4 py-2 bg-charcoal text-bone font-sans text-[10px] uppercase tracking-widest cursor-pointer"><Trash size={13} weight="thin" /> Confirm clear</button><button onClick={() => setConfirmClear(false)} className="font-sans text-[10px] uppercase tracking-widest opacity-50 cursor-pointer">Cancel</button></div> : <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 mt-6 px-4 py-2 border-[1px] border-charcoal/30 font-sans text-[10px] uppercase tracking-widest hover:border-charcoal cursor-pointer"><Trash size={13} weight="thin" /> Clear all data</button>}</section>}
        </div>
      </main>
    </div>
  );
}

function Appearance(props: Omit<Parameters<typeof Settings>[0], 'widgets' | 'setWidgets' | 'onClose' | 'onClear'>) {
  const colors: { key: keyof ThemeConfig; label: string }[] = [{ key: 'canvas', label: 'Canvas' }, { key: 'surface', label: 'Tile surface' }, { key: 'ink', label: 'Ink' }, { key: 'muted', label: 'Muted ink' }, { key: 'grid', label: 'Grid' }];
  return <section><Subheading>Color system</Subheading><div className="grid grid-cols-2 gap-x-10 gap-y-5">{colors.map(color => <label key={color.key} className="flex items-center justify-between font-sans text-xs tracking-wide"><span>{color.label}</span><input type="color" value={props.theme[color.key]} onChange={e => props.setTheme(current => ({ ...current, [color.key]: e.target.value }))} className="w-9 h-7 bg-transparent cursor-pointer" /></label>)}</div><Subheading>Grid</Subheading><div className="flex gap-3"><select value={props.gridLineStyle} onChange={e => props.setGridLineStyle(e.target.value as typeof props.gridLineStyle)} className="setting-input"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="hidden">Hidden</option></select><select value={props.gridLineWeight} onChange={e => props.setGridLineWeight(e.target.value as typeof props.gridLineWeight)} className="setting-input"><option value="thin">Thin</option><option value="normal">Normal</option></select></div><label className="flex items-center gap-3 mt-5 font-sans text-xs"><input type="checkbox" checked={props.showNoise} onChange={e => props.setShowNoise(e.target.checked)} className="accent-charcoal" /> Noise texture</label></section>;
}

function TrainingSettings({ installed, config, onChange }: { installed: boolean; config: TrainingConfig; onChange: (config: TrainingConfig) => void }) {
  if (!installed) return <Section installed={false} />;
  const updateDay = (day: number, rest: boolean, label: string) => onChange({ ...config, schedule: config.schedule.map(item => item.day === day ? { ...item, rest, label } : item) });
  return <section><Subheading>Reminder</Subheading><label className="flex flex-col gap-2 font-sans text-xs"><span>Time</span><input type="time" value={config.reminderTime} onChange={e => onChange({ ...config, reminderTime: e.target.value })} className="setting-input" /></label><label className="flex items-center gap-3 mt-5 font-sans text-xs"><input type="checkbox" checked={config.repeatReminder} onChange={e => onChange({ ...config, repeatReminder: e.target.checked })} className="accent-charcoal" /> Repeat until started</label><Subheading>Weekly schedule</Subheading><div className="flex flex-col gap-3">{config.schedule.map(item => <div key={item.day} className="grid grid-cols-[36px_1fr_78px] gap-3 items-center"><span className="font-sans text-[10px] uppercase opacity-45">{DAY_NAMES[item.day]}</span><input value={item.label} disabled={item.rest} onChange={e => updateDay(item.day, false, e.target.value)} className="setting-input disabled:opacity-30" /><button onClick={() => updateDay(item.day, !item.rest, item.rest ? 'Workout' : 'Rest')} className={`py-2 border-[1px] font-sans text-[9px] uppercase tracking-wider cursor-pointer ${item.rest ? 'border-border opacity-50' : 'bg-charcoal text-bone border-charcoal'}`}>{item.rest ? 'Rest' : 'Workout'}</button></div>)}</div></section>;
}

function ActionSettings({ installed, triggers, onChange }: { installed: boolean; triggers: Array<{ id: string; label: string; url: string; method: string }>; onChange: (triggers: Array<{ id: string; label: string; url: string; method: string }>) => void }) {
  if (!installed) return <Section installed={false} />;
  const update = (id: string, patch: Partial<{ label: string; url: string; method: string }>) => onChange(triggers.map(item => item.id === id ? { ...item, ...patch } : item));
  return <section><Subheading>Configured actions</Subheading><div className="flex flex-col gap-5">{triggers.map(item => <div key={item.id} className="border-b-[1px] border-border pb-5"><div className="flex justify-between items-center mb-3"><span className="font-sans text-[10px] uppercase tracking-widest opacity-40">Action</span><button onClick={() => onChange(triggers.filter(trigger => trigger.id !== item.id))} aria-label={`Remove ${item.label}`} className="opacity-40 hover:opacity-100 cursor-pointer"><X size={14} weight="thin" /></button></div><div className="grid grid-cols-[1fr_90px] gap-3"><input value={item.label} onChange={e => update(item.id, { label: e.target.value })} className="setting-input" placeholder="Label" /><select value={item.method} onChange={e => update(item.id, { method: e.target.value })} className="setting-input"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option></select></div><input value={item.url} onChange={e => update(item.id, { url: e.target.value })} className="setting-input mt-3" placeholder="https://example.com" /></div>)}</div><button onClick={() => onChange([...triggers, { id: `t${Date.now()}`, label: 'New Action', url: '', method: 'GET' }])} className="flex items-center gap-2 mt-5 font-sans text-[10px] uppercase tracking-widest opacity-55 hover:opacity-100 cursor-pointer"><Plus size={13} weight="thin" /> Add action</button></section>;
}

interface LocationResult { id: number; name: string; country: string; admin1?: string; latitude: number; longitude: number; }

function TimezonePicker({ value, onSelect }: { value: string; onSelect: (timezone: string) => void }) {
  const [query, setQuery] = useState(value === 'auto' ? '' : value);
  const normalizedQuery = query.trim().toLowerCase().replaceAll('_', ' ');
  const matches = TIMEZONES.filter(zone => zone.toLowerCase().replaceAll('_', ' ').includes(normalizedQuery)).slice(0, 12);
  return <div><Label>Timezone</Label><button onClick={() => { onSelect('auto'); setQuery(''); }} className={`w-full flex items-center justify-between py-3 border-y-[1px] border-border text-left font-sans text-sm cursor-pointer ${value === 'auto' ? 'opacity-100' : 'opacity-55 hover:opacity-80'}`}><span>Automatic</span><span className="font-sans text-[9px] uppercase tracking-widest">{value === 'auto' ? 'Selected' : 'System timezone'}</span></button><input value={query} onChange={e => setQuery(e.target.value)} className="setting-input mt-4" placeholder="Search a timezone" autoComplete="off" /><p className="font-sans text-[10px] leading-relaxed opacity-40 mt-2">Automatic uses the system timezone. When location permission is already granted, Dashy verifies it; the system clock wins if they disagree.</p><div className="mt-4 border-t-[1px] border-border">{matches.map(zone => <button key={zone} onClick={() => { onSelect(zone); setQuery(zone); }} className={`w-full flex items-center justify-between py-3 border-b-[1px] border-border text-left font-sans text-sm hover:opacity-60 cursor-pointer ${zone === value ? 'opacity-100' : 'opacity-55'}`}><span>{zone.replaceAll('_', ' ')}</span>{zone === value && <span className="font-sans text-[9px] uppercase tracking-widest">Selected</span>}</button>)}</div></div>;
}

function LocationPicker({ value, onSelect }: { value: string; onSelect: (location: LocationResult) => void }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2 || query === value) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true); setError(null);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search unavailable');
        const payload = await response.json() as { results?: LocationResult[] };
        setResults(payload.results ?? []);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Search unavailable');
      } finally { if (!controller.signal.aborted) setIsSearching(false); }
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query, value]);

  const showResults = query.trim().length >= 2 && query !== value;
  return <div className="relative"><Label>City & country</Label><input value={query} onChange={e => setQuery(e.target.value)} className="setting-input" placeholder="Search a city" autoComplete="off" /><p className="font-sans text-[10px] leading-relaxed opacity-40 mt-2">Search selects a specific city and country, so locations with the same name stay unambiguous.</p>{showResults && isSearching && <span className="block mt-3 font-sans text-[10px] uppercase tracking-widest opacity-35">Searching</span>}{showResults && error && <span className="block mt-3 font-sans text-[10px] text-red-700">{error}</span>}{showResults && results.length > 0 && <div className="mt-4 border-t-[1px] border-border">{results.map(location => <button key={location.id} onClick={() => { onSelect(location); setQuery(`${location.name}, ${location.country}`); setResults([]); }} className="w-full flex items-center justify-between gap-4 py-3 border-b-[1px] border-border text-left hover:opacity-60 cursor-pointer"><span className="font-sans text-sm">{location.name}{location.admin1 ? `, ${location.admin1}` : ''}</span><span className="font-sans text-[10px] uppercase tracking-widest opacity-45 shrink-0">{location.country}</span></button>)}</div>}</div>;
}

function Section({ installed, children }: { installed: boolean; children?: React.ReactNode }) { return installed ? <section>{children}</section> : <section><p className="font-sans text-sm opacity-45">This widget has not been added to the dashboard yet.</p></section>; }
function Label({ children }: { children: React.ReactNode }) { return <label className="block font-sans text-xs uppercase tracking-wider opacity-60 mb-2">{children}</label>; }
function Subheading({ children }: { children: React.ReactNode }) { return <h3 className="border-t-[1px] border-border pt-5 mt-9 mb-5 font-sans text-[10px] uppercase tracking-[0.18em] opacity-45">{children}</h3>; }
