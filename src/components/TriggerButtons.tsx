import { useState, useCallback } from 'react';
import type { WidgetTier, TriggerButton } from '../types';

type TriggerState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; status: number }
  | { type: 'error'; message: string };

const METHOD_STYLE: Record<string, string> = {
  GET: 'opacity-40',
  POST: 'opacity-60',
  PUT: 'opacity-50',
  DELETE: 'opacity-30',
  PATCH: 'opacity-50',
};

const DEMO_TRIGGERS: TriggerButton[] = [
  { id: 'demo-1', label: 'Status Ping', url: 'https://httpbin.org/get', method: 'GET' },
  { id: 'demo-2', label: 'Test POST', url: 'https://httpbin.org/post', method: 'POST', body: '{"test": true}' },
  { id: 'demo-3', label: 'Sample JSON', url: 'https://httpbin.org/json', method: 'GET' },
];

export function TriggerButtons({ tier = 'compact', triggers: externalTriggers }: {
  tier?: WidgetTier;
  triggers?: TriggerButton[];
}) {
  const triggers = externalTriggers ?? DEMO_TRIGGERS;
  const [states, setStates] = useState<Record<string, TriggerState>>({});

  const fire = useCallback(async (t: TriggerButton) => {
    setStates(prev => ({ ...prev, [t.id]: { type: 'loading' } }));
    try {
      const headers: Record<string, string> = {};
      if (t.headers) {
        for (const h of t.headers) {
          if (h.key) headers[h.key] = h.value;
        }
      }
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(t.method) && !!t.body;
      const res = await fetch(t.url, {
        method: t.method,
        headers: Object.keys(headers).length ? headers : undefined,
        body: hasBody ? t.body : undefined,
      });
      setStates(prev => ({ ...prev, [t.id]: { type: 'success', status: res.status } }));
      setTimeout(() => {
        setStates(prev => {
          const next = { ...prev };
          delete next[t.id];
          return next;
        });
      }, 2000);
    } catch (e: any) {
      setStates(prev => ({ ...prev, [t.id]: { type: 'error', message: e.message } }));
      setTimeout(() => {
        setStates(prev => {
          const next = { ...prev };
          delete next[t.id];
          return next;
        });
      }, 2500);
    }
  }, []);

  const stateFor = (id: string) => states[id] ?? { type: 'idle' as const };

  if (tier === 'compact') {
    const first = triggers[0];
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-1.5">
        {triggers.length === 0 ? (
          <span className="font-sans text-[9px] uppercase tracking-widest opacity-20">No triggers</span>
        ) : (
          <>
            <span className="font-serif text-4xl font-normal tracking-tighter">{triggers.length}</span>
            {first && (
              <button
                onClick={() => fire(first)}
                disabled={stateFor(first.id).type === 'loading'}
                className="font-sans text-[10px] tracking-wide truncate max-w-[80%] px-2 py-1 border-[1px] border-transparent hover:border-charcoal/20 transition-all duration-100 ease-out cursor-pointer"
              >
                {first.label}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const StatusDot = ({ id }: { id: string }) => {
    const s = stateFor(id);
    if (s.type === 'loading') {
      return <div className="w-1.5 h-1.5 rounded-full bg-charcoal/40 animate-pulse shrink-0" />;
    }
    if (s.type === 'success') {
      return <div className="w-1.5 h-1.5 bg-charcoal shrink-0" />;
    }
    if (s.type === 'error') {
      return <div className="w-1.5 h-1.5 bg-red-400 shrink-0" />;
    }
    return <div className="w-1.5 h-1.5 border-[1px] border-charcoal/20 shrink-0" />;
  };

  if (tier === 'standard') {
    const maxVisible = 7;
    const visible = triggers.slice(0, maxVisible);
    const remaining = triggers.length - maxVisible;
    return (
      <div className="flex flex-col w-full h-full py-4 px-5">
        <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
          {visible.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <span className="font-sans text-xs uppercase tracking-widest opacity-20">No triggers</span>
            </div>
          )}
          {visible.map(t => {
            const s = stateFor(t.id);
            return (
              <button
                key={t.id}
                onClick={() => fire(t)}
                disabled={s.type === 'loading'}
                className="flex items-center gap-2.5 text-left group cursor-pointer disabled:opacity-60"
              >
                <StatusDot id={t.id} />
                <span className="font-sans text-sm tracking-wide truncate flex-1 opacity-80 group-hover:opacity-100 transition-opacity duration-100">
                  {t.label}
                </span>
                <span className="font-mono text-[9px] tracking-wider uppercase shrink-0 transition-opacity duration-100">
                  {s.type === 'idle' && (
                    <span className={METHOD_STYLE[t.method] || 'opacity-40'}>{t.method}</span>
                  )}
                  {s.type === 'loading' && (
                    <span className="opacity-40">...</span>
                  )}
                  {s.type === 'success' && (
                    <span className="opacity-40">{s.status}</span>
                  )}
                  {s.type === 'error' && (
                    <span className="opacity-40 text-red-400">ERR</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {remaining > 0 && (
          <span className="font-sans text-[10px] tracking-widest uppercase opacity-30 mt-2">
            + {remaining} more
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full py-4 px-5">
      <div className="flex-1 grid grid-cols-2 auto-rows-min gap-3 overflow-y-auto">
        {triggers.length === 0 && (
          <div className="col-span-2 flex items-center justify-center h-full">
            <span className="font-sans text-xs uppercase tracking-widest opacity-20">No triggers</span>
          </div>
        )}
        {triggers.map(t => {
          const s = stateFor(t.id);
          return (
            <button
              key={t.id}
              onClick={() => fire(t)}
              disabled={s.type === 'loading'}
              className="flex flex-col gap-1.5 p-3 border-[1px] border-border hover:border-charcoal/30 active:border-charcoal/60 transition-all duration-100 ease-out text-left cursor-pointer disabled:opacity-60 group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-sm tracking-wide truncate">{t.label}</span>
                <StatusDot id={t.id} />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-mono text-[9px] tracking-wider uppercase shrink-0 ${METHOD_STYLE[t.method] || 'opacity-40'}`}>{t.method}</span>
                <span className="font-mono text-[9px] truncate opacity-30">{t.url}</span>
              </div>
              {s.type === 'success' && (
                <span className="font-mono text-[10px] opacity-50">{s.status}</span>
              )}
              {s.type === 'error' && (
                <span className="font-sans text-[9px] text-red-400 truncate">{s.message}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
