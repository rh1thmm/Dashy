import { useState, useMemo, useEffect } from 'react';
import { GridLayout } from 'react-grid-layout';
import { useWindowSize } from '../hooks/useWindowSize';
import type { WidgetData, WidgetTier, TriggerButton } from '../types';
import { Tile } from './Tile';
import { Clock } from './Clock';
import { Weather } from './Weather';
import { Tasks } from './Tasks';
import { TriggerButtons } from './TriggerButtons';
import { PencilSimple, Plus, Check, X, Gear, Palette } from '@phosphor-icons/react';

const BACKGROUNDS = [
  { id: 'bone', name: 'Bone', class: 'bg-bone', border: '#E5E2DB' },
  { id: 'blush', name: 'Blush', class: 'bg-[#F3EDED]', border: '#E0D5D5' },
  { id: 'cream', name: 'Cream', class: 'bg-[#F2EDE4]', border: '#E3DCCF' },
  { id: 'peach', name: 'Peach', class: 'bg-[#F0EBE3]', border: '#DDD5CB' },
  { id: 'sage', name: 'Sage', class: 'bg-[#E2E5DE]', border: '#CDD0C4' },
  { id: 'sky', name: 'Sky', class: 'bg-[#E4E9ED]', border: '#CDD3D8' },
  { id: 'lavender', name: 'Lavender', class: 'bg-[#EDEDF3]', border: '#D5D5E0' },
  { id: 'charcoal', name: 'Charcoal', class: 'bg-[#121212]', border: '#2B2B2B' },
  { id: 'navy', name: 'Navy', class: 'bg-[#1A1D24]', border: '#2F333C' },
];

const DEFAULT_TIMEZONE = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

const REMOVE_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'instant', label: 'Instantly' },
  { value: '1h', label: 'After 1 hour' },
  { value: '1d', label: 'After 1 day' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'America/Anchorage', label: 'Anchorage (AKST)' },
  { value: 'Pacific/Honolulu', label: 'Honolulu (HST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  { value: 'UTC', label: 'UTC' },
];

const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'clock-1', type: 'clock', config: { timezone: DEFAULT_TIMEZONE } },
  { id: 'weather-1', type: 'weather', config: { city: 'Calgary' } },
  { id: 'triggers-1', type: 'triggers', config: { triggers: [
    { id: 't1', label: 'Status Ping', url: 'https://httpbin.org/get', method: 'GET' },
    { id: 't2', label: 'Test POST', url: 'https://httpbin.org/post', method: 'POST', body: '{"test":true}' },
    { id: 't3', label: 'Sample JSON', url: 'https://httpbin.org/json', method: 'GET' },
  ] } },
  { id: 'tasks-1', type: 'tasks', config: { removeAfter: 'never', tasks: [
    { id: '1', text: 'Review deploy pipeline', done: false },
    { id: '2', text: 'Update dependencies', done: true },
    { id: '3', text: 'Write changelog', done: false },
    { id: '4', text: 'Check analytics', done: false },
    { id: '5', text: 'Sync staging DB', done: true },
    { id: '6', text: 'Audit access logs', done: false },
    { id: '7', text: 'Plan sprint retro', done: false },
  ] } },
];

// We define our own Layout type to bypass the weird type conflicts
interface MyLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

const INITIAL_LAYOUT: MyLayout[] = [
  { i: 'clock-1', x: 0, y: 0, w: 1, h: 1 },
  { i: 'weather-1', x: 1, y: 0, w: 1, h: 1 },
  { i: 'triggers-1', x: 2, y: 0, w: 1, h: 1 },
  { i: 'tasks-1', x: 3, y: 0, w: 1, h: 1 },
];

const STORAGE_KEY = 'monolith_dashboard_state';

const blockCompactor = {
  type: null as any,
  allowOverlap: false,
  preventCollision: true,
  compact: (layout: any) => layout,
};

export function Dashboard() {
  const windowSize = useWindowSize();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<WidgetData[]>(INITIAL_WIDGETS);
  const [layout, setLayout] = useState<MyLayout[]>(INITIAL_LAYOUT);
  const [editingWidget, setEditingWidget] = useState<string | null>(null);
  const [appBackground, setAppBackground] = useState<string>('bg-bone');
  const [gridLineColor, setGridLineColor] = useState<string>('#E5E2DB');
  const [gridLineWeight, setGridLineWeight] = useState<'thin' | 'normal'>('normal');
  const [gridLineStyle, setGridLineStyle] = useState<'solid' | 'dashed' | 'dotted' | 'hidden'>('solid');
  const [canvasInset, setCanvasInset] = useState<number>(0);
  const [showNoise, setShowNoise] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);
  const [activePopover, setActivePopover] = useState<'add' | 'canvas' | null>(null);

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePopover = (name: 'add' | 'canvas') => {
    setActivePopover(prev => prev === name ? null : name);
  };

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.widgets && parsed.layout) {
          setWidgets(parsed.widgets);
          setLayout(parsed.layout);
        }
        if (parsed.appBackground) {
          setAppBackground(parsed.appBackground);
          const bg = BACKGROUNDS.find(b => b.class === parsed.appBackground);
          if (bg) setGridLineColor(bg.border);
        }
        if (parsed.gridLineWeight) setGridLineWeight(parsed.gridLineWeight);
        if (parsed.gridLineStyle) setGridLineStyle(parsed.gridLineStyle);
        if (parsed.canvasInset != null) setCanvasInset(parsed.canvasInset);
        if (parsed.showNoise != null) setShowNoise(parsed.showNoise);
      } catch (e) {
        console.error('Failed to parse dashboard state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever widgets or layout change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layout, appBackground, gridLineWeight, gridLineStyle, canvasInset, showNoise }));
    }
  }, [widgets, layout, appBackground, gridLineWeight, gridLineStyle, canvasInset, showNoise, isLoaded]);

  // Auto-hide cursor after 5s of inactivity (skip in edit mode)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const hide = () => {
      if (!isEditMode) document.body.style.cursor = 'none';
    };
    const show = () => {
      document.body.style.cursor = '';
      clearTimeout(timer);
      timer = setTimeout(hide, 5000);
    };
    show();
    window.addEventListener('mousemove', show);
    window.addEventListener('mouseenter', show);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', show);
      window.removeEventListener('mouseenter', show);
      document.body.style.cursor = '';
    };
  }, [isEditMode]);

  // Close settings modal on Escape
  useEffect(() => {
    if (!editingWidget) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingWidget(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editingWidget]);

  // Force dimensions to be multiples of 4 to prevent fractional pixel gaps and floating point misalignments
  const cols = 4;
  const rows = 4;
  const width = Math.floor(windowSize.width / cols) * cols;
  const height = Math.floor(windowSize.height / rows) * rows;
  const rowHeight = height / rows;
  const margin: [number, number] = [0, 0];
  
  const lineWidth = gridLineWeight === 'thin' ? '0.5px' : '1px';
  const lineStyle = gridLineStyle === 'hidden' ? 'none' : gridLineStyle;
  
  const getWidgetTitle = (type: string, config?: any) => {
    switch (type) {
      case 'clock': {
        const tz = config?.timezone;
        return tz && tz !== DEFAULT_TIMEZONE ? tz : 'Local';
      }
      case 'weather': return 'Atmosphere';
      case 'tasks': return 'Tasks';
      case 'triggers': return 'Actions';
      default: return '';
    }
  };

  const renderWidget = (widget: WidgetData) => {
    const item = layout.find(l => l.i === widget.id);
    const w = item?.w || 1;
    const h = item?.h || 1;
    const area = w * h;
    let tier: WidgetTier = 'compact';
    if (area >= 9) tier = 'expanded';
    else if (area >= 2) tier = 'standard';
    switch (widget.type) {
      case 'clock': return <Clock tier={tier} timezone={widget.config?.timezone} />;
      case 'weather': return <Weather city={widget.config?.city} tier={tier} />;
      case 'tasks': return (
        <Tasks
          tier={tier}
          tasks={widget.config?.tasks}
          removeAfter={widget.config?.removeAfter}
          onChange={(tasks) => setWidgets(prev => prev.map(w =>
            w.id === widget.id ? { ...w, config: { ...w.config, tasks } } : w
          ))}
        />
      );
      case 'triggers': return (
        <TriggerButtons
          tier={tier}
          triggers={widget.config?.triggers}
        />
      );
      default: return null;
    }
  };

  const addWidget = (type: WidgetData['type']) => {
    if (widgets.some(w => w.type === type)) {
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} widget already exists`, 'info');
      return;
    }
    const id = `${type}-${Date.now()}`;
    
    let newX = -1, newY = -1;
    outer: for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const isOccupied = layout.some(l => 
          x >= l.x && x < l.x + l.w &&
          y >= l.y && y < l.y + l.h
        );
        if (!isOccupied) {
          newX = x;
          newY = y;
          break outer;
        }
      }
    }
    
    if (newX === -1) {
      showToast('Canvas is full', 'error');
      return;
    }
    
    setWidgets(prev => [...prev, {
      id, type,
      config: type === 'weather' ? { city: 'Calgary' } :
              type === 'clock' ? { timezone: DEFAULT_TIMEZONE } :
              type === 'tasks' ? { removeAfter: 'never' } :
              {}
    }]);
    setLayout(prev => [...prev, { i: id, x: newX, y: newY, w: 1, h: 1 }]);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setLayout(prev => prev.filter(l => l.i !== id));
  };

  const onLayoutChange = (newLayout: MyLayout[]) => {
    setLayout(newLayout);
  };

  // Background 16 tiles to keep the pure grid look
  const backgroundTiles = useMemo(() => (
    <div 
      className="absolute top-0 left-0 grid grid-cols-4 grid-rows-4 pointer-events-none"
      style={{ width, height }}
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} style={{ borderBottom: `${lineWidth} ${lineStyle} ${gridLineColor}`, borderRight: `${lineWidth} ${lineStyle} ${gridLineColor}` }} className={`w-full h-full ${appBackground}`} />
      ))}
    </div>
  ), [width, height, appBackground, gridLineColor, lineWidth, lineStyle]);

  if (!isLoaded) return <div className={`w-dvw h-dvh ${appBackground}`} />; // Prevent flash of default layout

  return (
    <div className={`flex items-center justify-center w-dvw h-dvh overflow-hidden ${appBackground}`}>
      <div style={{ padding: canvasInset || undefined }}>
      <div 
        className="relative"
        style={{ width, height, borderTop: `${lineWidth} ${lineStyle} ${gridLineColor}`, borderLeft: `${lineWidth} ${lineStyle} ${gridLineColor}` }}
      >
        {backgroundTiles}

        {/* Noise Overlay */}
        {showNoise && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-[0.025]" style={{ mixBlendMode: 'multiply' }}>
            <filter id="canvas-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#canvas-noise)" />
          </svg>
        )}

        <div className="absolute inset-0">
            <GridLayout
              className="layout"
              layout={layout as any}
              width={width}
              gridConfig={{ cols, rowHeight, margin, containerPadding: [0, 0], maxRows: 4 }}
              dragConfig={{ enabled: isEditMode }}
              resizeConfig={{ enabled: isEditMode }}
              compactor={blockCompactor}
              onLayoutChange={onLayoutChange as any}
            >
              {widgets.map(widget => (
                <div key={widget.id} className="relative group p-[2px]" style={{ borderBottom: `${lineWidth} ${lineStyle} ${gridLineColor}`, borderRight: `${lineWidth} ${lineStyle} ${gridLineColor}` }}>
                  <div className="bg-bone-alt w-full h-full relative overflow-hidden transition-all duration-150 ease-out group-hover:shadow-sm border-[1px] border-transparent">
                    <Tile title={getWidgetTitle(widget.type, widget.config)} className="w-full h-full border-none bg-transparent">
                      {renderWidget(widget)}
                    </Tile>
                    
                    {/* Edit Mode Overlays */}
                    {isEditMode && (
                      <div className="absolute inset-0 border-[1px] border-charcoal/20 pointer-events-none" />
                    )}
                    {isEditMode && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        {(widget.type === 'weather' || widget.type === 'clock' || widget.type === 'tasks' || widget.type === 'triggers') && (
                          <button 
                            onClick={() => setEditingWidget(widget.id)}
                            className="p-1.5 bg-bone border-[1px] border-border text-charcoal hover:bg-bone-alt active:scale-[0.97] transition-all duration-100 ease-out cursor-pointer"
                          >
                            <Gear size={14} weight="thin" />
                          </button>
                        )}
                        <button 
                          onClick={() => removeWidget(widget.id)}
                          className="p-1.5 bg-bone border-[1px] border-border text-charcoal hover:bg-red-200 hover:text-red-800 active:scale-[0.97] transition-all duration-100 ease-out cursor-pointer"
                        >
                          <X size={14} weight="thin" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </GridLayout>
        </div>
      </div>
      </div>

      {/* Edit Mode Toggle & Controls */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-50">
        {isEditMode && (
          <>
            {/* Plus — Add Widget */}
            <div className="relative">
              <button
                onClick={() => togglePopover('add')}
                className={`w-9 h-9 flex items-center justify-center bg-bone border-[1px] border-border shadow-lg hover:bg-bone-alt hover:-translate-y-[1px] hover:shadow-xl active:scale-[0.95] transition-all duration-100 ease-out cursor-pointer ${activePopover === 'add' ? 'ring-1 ring-charcoal/30' : ''}`}
              >
                <Plus size={16} weight="thin" />
              </button>
              {activePopover === 'add' && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setActivePopover(null)} />
                  <div className="absolute bottom-full right-0 mb-2 z-40 p-5 bg-bone border-[1px] border-border shadow-2xl min-w-[160px] animate-popover-in">
                    <h3 className="font-serif text-[11px] tracking-[0.15em] uppercase mb-4 text-charcoal-muted">Add Widget</h3>
                    <div className="flex flex-col gap-2.5">
                      <button onClick={() => { addWidget('clock'); setActivePopover(null); }} className="text-left font-sans text-sm tracking-wide hover:translate-x-[2px] active:scale-[0.97] transition-all duration-100 ease-out flex items-center gap-2.5 group">
                        <Plus size={13} weight="thin" className="opacity-30 group-hover:opacity-70 transition-opacity duration-100" /> Clock
                      </button>
                      <button onClick={() => { addWidget('weather'); setActivePopover(null); }} className="text-left font-sans text-sm tracking-wide hover:translate-x-[2px] active:scale-[0.97] transition-all duration-100 ease-out flex items-center gap-2.5 group">
                        <Plus size={13} weight="thin" className="opacity-30 group-hover:opacity-70 transition-opacity duration-100" /> Weather
                      </button>
                      <button onClick={() => { addWidget('triggers'); setActivePopover(null); }} className="text-left font-sans text-sm tracking-wide hover:translate-x-[2px] active:scale-[0.97] transition-all duration-100 ease-out flex items-center gap-2.5 group">
                        <Plus size={13} weight="thin" className="opacity-30 group-hover:opacity-70 transition-opacity duration-100" /> Actions
                      </button>
                      <button onClick={() => { addWidget('tasks'); setActivePopover(null); }} className="text-left font-sans text-sm tracking-wide hover:translate-x-[2px] active:scale-[0.97] transition-all duration-100 ease-out flex items-center gap-2.5 group">
                        <Plus size={13} weight="thin" className="opacity-30 group-hover:opacity-70 transition-opacity duration-100" /> Tasks
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Palette — Canvas */}
            <div className="relative">
              <button
                onClick={() => togglePopover('canvas')}
                className={`w-9 h-9 flex items-center justify-center bg-bone border-[1px] border-border shadow-lg hover:bg-bone-alt hover:-translate-y-[1px] hover:shadow-xl active:scale-[0.95] transition-all duration-100 ease-out cursor-pointer ${activePopover === 'canvas' ? 'ring-1 ring-charcoal/30' : ''}`}
              >
                <Palette size={16} weight="thin" />
              </button>
              {activePopover === 'canvas' && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setActivePopover(null)} />
                  <div className="absolute bottom-full right-0 mb-2 z-40 p-5 bg-bone border-[1px] border-border shadow-2xl w-[208px] animate-popover-in">
                    <h3 className="font-serif text-[11px] tracking-[0.15em] uppercase mb-4 text-center text-charcoal-muted">Canvas</h3>

                    {/* Color circles — 5 + 4 centered */}
                    <div className="flex flex-wrap justify-center gap-2.5 mb-4 mx-auto max-w-[130px]">
                      {BACKGROUNDS.map(bg => (
                        <button
                          key={bg.id}
                          title={bg.name}
                          onClick={() => { setAppBackground(bg.class); setGridLineColor(bg.border); }}
                          className={`w-[18px] h-[18px] rounded-full border-[1px] border-border cursor-pointer transition-all duration-100 ease-out hover:scale-110 active:scale-95 ${bg.class} ${appBackground === bg.class ? 'ring-[2.5px] ring-charcoal ring-offset-[2.5px] ring-offset-bone' : ''}`}
                        />
                      ))}
                    </div>

                    {/* Grid style */}
                    <div className="border-t-[1px] border-border pt-4 flex flex-col gap-4">
                      <div>
                        <span className="block font-sans text-[11px] uppercase tracking-wider opacity-50 mb-2">Grid</span>
                        <div className="relative">
                          <select
                            value={gridLineStyle}
                            className="w-full appearance-none bg-transparent border-[1px] border-border px-3 py-2 pr-7 font-sans text-xs outline-none focus:border-charcoal transition-colors cursor-pointer"
                            onChange={e => setGridLineStyle(e.target.value as any)}
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="hidden">Hidden</option>
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                              <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Weight */}
                      <div>
                        <span className="block font-sans text-[11px] uppercase tracking-wider opacity-50 mb-2">Weight</span>
                        <div className="flex border-[1px] border-border">
                          <button
                            onClick={() => setGridLineWeight('thin')}
                            className={`flex-1 py-2 font-sans text-[11px] uppercase tracking-wider transition-all duration-100 ease-out cursor-pointer active:scale-[0.97] ${gridLineWeight === 'thin' ? 'bg-charcoal text-bone' : 'bg-transparent text-charcoal hover:bg-bone-alt'}`}
                          >
                            Thin
                          </button>
                          <button
                            onClick={() => setGridLineWeight('normal')}
                            className={`flex-1 py-2 font-sans text-[11px] uppercase tracking-wider transition-all duration-100 ease-out cursor-pointer active:scale-[0.97] ${gridLineWeight === 'normal' ? 'bg-charcoal text-bone' : 'bg-transparent text-charcoal hover:bg-bone-alt'}`}
                          >
                            Norm
                          </button>
                        </div>
                      </div>

                      {/* Noise */}
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-[11px] uppercase tracking-wider opacity-50">Noise</span>
                        <button
                          onClick={() => setShowNoise(!showNoise)}
                          className={`w-[18px] h-[18px] border-[1px] flex items-center justify-center transition-all duration-100 ease-out cursor-pointer ${showNoise ? 'bg-charcoal border-charcoal' : 'bg-transparent border-charcoal/30 hover:border-charcoal/60'}`}
                        >
                          {showNoise && (
                            <svg viewBox="0 0 10 10" className="w-[9px] h-[9px]" fill="none">
                              <path d="M2 5L4 7L8 3" stroke="#F9F8F4" strokeWidth="1.5" strokeLinecap="square" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <button
          onClick={() => { setIsEditMode(!isEditMode); setActivePopover(null); }}
          className="w-12 h-12 flex items-center justify-center bg-bone border-[1px] border-border shadow-lg hover:bg-bone-alt hover:-translate-y-[1px] hover:shadow-xl active:scale-[0.95] transition-all duration-100 ease-out cursor-pointer"
        >
          <span className="transition-transform duration-300 ease-out" style={{ transform: isEditMode ? 'rotate(0deg)' : 'none', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            {isEditMode ? <Check size={20} weight="thin" /> : <PencilSimple size={20} weight="thin" />}
          </span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200]">
          <div className={`px-5 py-3 border-[1px] font-sans text-xs uppercase tracking-widest shadow-xl animate-toast-in ${
            toast.type === 'error' ? 'bg-red-50 border-red-300 text-red-800 animate-shake' :
            toast.type === 'success' ? 'bg-bone border-charcoal/20 text-charcoal' :
            'bg-bone border-charcoal/20 text-charcoal'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Widget Settings Modal */}
      {editingWidget && (
        <div className="absolute inset-0 bg-charcoal/10 backdrop-blur-sm z-[100] flex items-center justify-center animate-backdrop-in">
          <div className="bg-bone border-[1px] border-border p-6 min-w-[300px] shadow-2xl animate-modal-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif tracking-widest uppercase text-sm">Edit Widget</h3>
              <button onClick={() => setEditingWidget(null)} className="hover:opacity-60 active:scale-[0.95] transition-all duration-100 ease-out"><X size={16} weight="thin" /></button>
            </div>
            
            {widgets.find(w => w.id === editingWidget)?.type === 'weather' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-xs uppercase tracking-wider opacity-60">City</label>
                  <input 
                    type="text" 
                    defaultValue={widgets.find(w => w.id === editingWidget)?.config?.city || 'Calgary'}
                    className="bg-transparent border-[1px] border-border p-2 font-sans outline-none focus:border-charcoal transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newCity = e.currentTarget.value;
                        setWidgets(prev => prev.map(w => w.id === editingWidget ? { ...w, config: { ...w.config, city: newCity } } : w));
                        setEditingWidget(null);
                      }
                    }}
                  />
                  <span className="font-sans text-[10px] opacity-40">Press Enter to save</span>
                </div>
              </div>
            )}
            {widgets.find(w => w.id === editingWidget)?.type === 'clock' && (
              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs uppercase tracking-wider opacity-60">Timezone</label>
                <div className="relative">
                  <select
                    defaultValue={widgets.find(w => w.id === editingWidget)?.config?.timezone || DEFAULT_TIMEZONE}
                    className="w-full appearance-none bg-transparent border-[1px] border-border p-2 pr-8 font-sans text-sm outline-none focus:border-charcoal transition-colors cursor-pointer"
                    onChange={(e) => {
                      setWidgets(prev => prev.map(w => w.id === editingWidget ? { ...w, config: { ...w.config, timezone: e.target.value } } : w));
                      setEditingWidget(null);
                    }}
                  >
                    <option value={DEFAULT_TIMEZONE}>Local ({DEFAULT_TIMEZONE})</option>
                    {TIMEZONES.filter(tz => tz.value !== DEFAULT_TIMEZONE).map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {widgets.find(w => w.id === editingWidget)?.type === 'tasks' && (
              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs uppercase tracking-wider opacity-60">Remove completed after</label>
                <div className="relative">
                  <select
                    defaultValue={widgets.find(w => w.id === editingWidget)?.config?.removeAfter || 'never'}
                    className="w-full appearance-none bg-transparent border-[1px] border-border p-2 pr-8 font-sans text-sm outline-none focus:border-charcoal transition-colors cursor-pointer"
                    onChange={(e) => {
                      setWidgets(prev => prev.map(w => w.id === editingWidget ? { ...w, config: { ...w.config, removeAfter: e.target.value } } : w));
                      setEditingWidget(null);
                    }}
                  >
                    {REMOVE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {widgets.find(w => w.id === editingWidget)?.type === 'triggers' && (
              <TriggersEditor
                triggers={widgets.find(w => w.id === editingWidget)?.config?.triggers || []}
                onChange={(triggers) => {
                  setWidgets(prev => prev.map(w => w.id === editingWidget ? { ...w, config: { ...w.config, triggers } } : w));
                }}
              
              />
            )}

          </div>
        </div>
      )}
    </div>
  );
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function TriggersEditor({ triggers, onChange }: {
  triggers: TriggerButton[];
  onChange: (triggers: TriggerButton[]) => void;
}) {
  const [items, setItems] = useState<TriggerButton[]>(triggers.length > 0 ? triggers : []);

  const sync = (next: TriggerButton[]) => {
    setItems(next);
    onChange(next);
  };

  const update = (id: string, patch: Partial<TriggerButton>) => {
    sync(items.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const remove = (id: string) => {
    sync(items.filter(t => t.id !== id));
  };

  const add = () => {
    const id = `t${Date.now()}`;
    sync([...items, { id, label: 'New Trigger', url: '', method: 'GET' }]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {items.length === 0 && (
          <span className="font-sans text-xs uppercase tracking-widest opacity-30 text-center py-4">No triggers configured</span>
        )}
        {items.map(t => (
          <div key={t.id} className="border-[1px] border-border p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans text-[10px] uppercase tracking-widest opacity-40 truncate">{t.label || 'Untitled'}</span>
              <button
                onClick={() => remove(t.id)}
                className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 transition-all duration-100 ease-out cursor-pointer active:scale-[0.95]"
              >
                <X size={12} weight="thin" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <label className="block font-sans text-[9px] uppercase tracking-wider opacity-40 mb-1">Label</label>
                <input
                  type="text"
                  value={t.label}
                  onChange={e => update(t.id, { label: e.target.value })}
                  className="w-full bg-transparent border-[1px] border-border p-1.5 font-sans text-sm outline-none focus:border-charcoal transition-colors"
                />
              </div>
              <div>
                <label className="block font-sans text-[9px] uppercase tracking-wider opacity-40 mb-1">URL</label>
                <input
                  type="text"
                  value={t.url}
                  onChange={e => update(t.id, { url: e.target.value })}
                  placeholder="https://example.com/api"
                  className="w-full bg-transparent border-[1px] border-border p-1.5 font-sans text-sm outline-none focus:border-charcoal transition-colors"
                />
              </div>
              <div>
                <label className="block font-sans text-[9px] uppercase tracking-wider opacity-40 mb-1">Method</label>
                <div className="flex gap-1">
                  {METHODS.map(m => (
                    <button
                      key={m}
                      onClick={() => update(t.id, { method: m as TriggerButton['method'] })}
                      className={`flex-1 py-1.5 font-mono text-[10px] tracking-wider uppercase transition-all duration-100 ease-out cursor-pointer active:scale-[0.97] ${
                        t.method === m
                          ? 'bg-charcoal text-bone'
                          : 'bg-transparent text-charcoal border-[1px] border-border hover:bg-bone-alt'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {(t.method === 'POST' || t.method === 'PUT' || t.method === 'PATCH') && (
                <div>
                  <label className="block font-sans text-[9px] uppercase tracking-wider opacity-40 mb-1">Body</label>
                  <textarea
                    value={t.body || ''}
                    onChange={e => update(t.id, { body: e.target.value })}
                    rows={2}
                    className="w-full bg-transparent border-[1px] border-border p-1.5 font-mono text-[11px] outline-none focus:border-charcoal transition-colors resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block font-sans text-[9px] uppercase tracking-wider opacity-40 mb-1">
                  Headers <span className="opacity-30">(optional)</span>
                </label>
                <div className="flex flex-col gap-1.5">
                  {(t.headers || []).map((h, i) => (
                    <div key={i} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={h.key}
                        onChange={e => {
                          const newHeaders = [...(t.headers || [])];
                          newHeaders[i] = { ...newHeaders[i], key: e.target.value };
                          update(t.id, { headers: newHeaders });
                        }}
                        placeholder="Key"
                        className="flex-1 bg-transparent border-[1px] border-border p-1 font-sans text-xs outline-none focus:border-charcoal transition-colors"
                      />
                      <input
                        type="text"
                        value={h.value}
                        onChange={e => {
                          const newHeaders = [...(t.headers || [])];
                          newHeaders[i] = { ...newHeaders[i], value: e.target.value };
                          update(t.id, { headers: newHeaders });
                        }}
                        placeholder="Value"
                        className="flex-1 bg-transparent border-[1px] border-border p-1 font-sans text-xs outline-none focus:border-charcoal transition-colors"
                      />
                      <button
                        onClick={() => {
                          const newHeaders = (t.headers || []).filter((_, j) => j !== i);
                          update(t.id, { headers: newHeaders.length ? newHeaders : undefined });
                        }}
                        className="p-1 opacity-30 hover:opacity-80 transition-all duration-100 ease-out cursor-pointer active:scale-[0.95]"
                      >
                        <X size={10} weight="thin" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newHeaders = [...(t.headers || []), { key: '', value: '' }];
                      update(t.id, { headers: newHeaders });
                    }}
                    className="flex items-center gap-1 opacity-30 hover:opacity-70 transition-all duration-100 ease-out cursor-pointer active:scale-[0.97] self-start"
                  >
                    <Plus size={10} weight="thin" />
                    <span className="font-sans text-[10px] uppercase tracking-wider">Add header</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="flex items-center justify-center gap-2 py-2 border-[1px] border-border border-dashed opacity-40 hover:opacity-80 transition-all duration-100 ease-out cursor-pointer active:scale-[0.97] mt-1"
      >
        <Plus size={12} weight="thin" />
        <span className="font-sans text-[10px] uppercase tracking-wider">Add Trigger</span>
      </button>
    </div>
  );
}
