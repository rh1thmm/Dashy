import { useEffect, useRef, useState } from 'react';
import { CaretRight, Pause, Stop, Timer, TrendUp } from '@phosphor-icons/react';
import type { TrainingConfig, WidgetTier } from '../types';
import { DAY_NAMES, localDateKey, normalizeTrainingConfig, recentCompletions, scheduleForDate, workoutStreak } from '../lib/training';

const REMINDER_REPEAT_MS = 15 * 60 * 1000;

export function Training({ tier = 'compact', config: rawConfig, onChange, onToast }: {
  tier?: WidgetTier;
  config?: Partial<TrainingConfig>;
  onChange: (config: TrainingConfig) => void;
  onToast: (message: string) => void;
}) {
  const config = normalizeTrainingConfig(rawConfig);
  const configRef = useRef(config);
  const changeRef = useRef(onChange);
  const toastRef = useRef(onToast);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    configRef.current = config;
    changeRef.current = onChange;
    toastRef.current = onToast;
  }, [config, onChange, onToast]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const checkReminder = () => {
      const current = configRef.current;
      const currentDate = new Date();
      const scheduled = scheduleForDate(current, currentDate);
      const date = localDateKey(currentDate);
      const completedToday = current.completions.some(item => item.date === date);
      const [hour, minute] = current.reminderTime.split(':').map(Number);
      const reminderAt = new Date(currentDate);
      reminderAt.setHours(hour || 0, minute || 0, 0, 0);
      const alreadyRemindedToday = current.lastReminderAt && localDateKey(new Date(current.lastReminderAt)) === date;
      const shouldRepeat = current.repeatReminder && current.lastReminderAt && Date.now() - current.lastReminderAt >= REMINDER_REPEAT_MS;

      if (!scheduled.rest && !current.activeSession && !completedToday && currentDate >= reminderAt && (!alreadyRemindedToday || shouldRepeat)) {
        changeRef.current({ ...current, lastReminderAt: Date.now() });
        toastRef.current(`Training reminder · ${scheduled.label} is ready`);
      }
    };
    checkReminder();
    const id = window.setInterval(checkReminder, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const today = new Date(now);
  const scheduled = scheduleForDate(config, today);
  const todayKey = localDateKey(today);
  const active = config.activeSession;
  const completedToday = config.completions.some(item => item.date === todayKey);
  const durationMs = active ? Math.max(0, (active.pausedAt ?? now) - active.startedAt - active.pausedMs) : 0;
  const streak = workoutStreak(config, today);

  const start = () => {
    if (scheduled.rest) return;
    onChange({
      ...config,
      activeSession: { date: todayKey, label: scheduled.label, startedAt: Date.now(), pausedMs: 0 },
    });
    onToast(`${scheduled.label} started`);
  };

  const togglePause = () => {
    if (!active) return;
    const timestamp = Date.now();
    if (active.pausedAt) {
      onChange({ ...config, activeSession: { ...active, pausedAt: undefined, pausedMs: active.pausedMs + timestamp - active.pausedAt } });
    } else {
      onChange({ ...config, activeSession: { ...active, pausedAt: timestamp } });
    }
  };

  const end = () => {
    if (!active) return;
    const endedAt = Date.now();
    const elapsed = Math.max(0, (active.pausedAt ?? endedAt) - active.startedAt - active.pausedMs);
    onChange({
      ...config,
      activeSession: undefined,
      completions: [...config.completions.filter(item => item.date !== active.date), { date: active.date, label: active.label, durationMs: elapsed, endedAt }],
    });
    onToast(`${active.label} complete · ${formatDuration(elapsed)}`);
  };

  if (tier === 'compact') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2">
        <span className="font-serif text-3xl tracking-tight">{active ? formatDuration(durationMs) : scheduled.rest ? 'Rest' : scheduled.label}</span>
        <span className="font-sans text-[9px] uppercase tracking-widest opacity-40">{active ? (active.pausedAt ? 'Paused' : 'In session') : `${streak} day streak`}</span>
        {!active && !scheduled.rest && !completedToday && <SessionButton label="Start" icon={<CaretRight size={13} weight="thin" />} onClick={start} />}
      </div>
    );
  }

  const completionList = recentCompletions(config).slice(0, tier === 'expanded' ? 5 : 2);
  return (
    <div className="flex flex-col w-full h-full py-4 px-5">
      <div className="flex items-start justify-between border-b-[1px] border-border pb-3">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-widest opacity-45">Today</span>
          <span className="block font-serif text-2xl tracking-tight mt-0.5">{active?.label ?? scheduled.label}</span>
        </div>
        <div className="flex items-center gap-1.5 pt-1 opacity-60">
          <TrendUp size={14} weight="thin" />
          <span className="font-sans text-[10px] uppercase tracking-widest">{streak} streak</span>
        </div>
      </div>

      {active ? (
        <div className="flex flex-col items-center py-4 border-b-[1px] border-border">
          <span className="font-serif text-4xl tracking-tighter">{formatDuration(durationMs)}</span>
          <span className="font-sans text-[9px] uppercase tracking-widest opacity-40 mt-1">{active.pausedAt ? 'Paused' : 'Training now'}</span>
          <div className="flex gap-2 mt-3">
            <SessionButton label={active.pausedAt ? 'Resume' : 'Pause'} icon={active.pausedAt ? <CaretRight size={13} weight="thin" /> : <Pause size={12} weight="thin" />} onClick={togglePause} />
            <SessionButton label="End" icon={<Stop size={11} weight="thin" />} onClick={end} quiet />
          </div>
        </div>
      ) : scheduled.rest ? (
        <div className="flex items-center justify-center gap-2 py-6 border-b-[1px] border-border opacity-45">
          <Timer size={17} weight="thin" />
          <span className="font-sans text-[10px] uppercase tracking-widest">Rest day</span>
        </div>
      ) : completedToday ? (
        <div className="py-5 text-center border-b-[1px] border-border">
          <span className="font-sans text-[10px] uppercase tracking-widest opacity-55">Completed today</span>
        </div>
      ) : (
        <div className="flex items-center justify-between py-4 border-b-[1px] border-border">
          <span className="font-sans text-xs tracking-wide opacity-60">Ready when you are</span>
          <SessionButton label="Start" icon={<CaretRight size={13} weight="thin" />} onClick={start} />
        </div>
      )}

      <WeekStrip config={config} today={today} />
      {tier === 'expanded' && completionList.length > 0 && (
        <div className="pt-3 flex flex-col gap-2 overflow-hidden">
          <span className="font-sans text-[9px] uppercase tracking-widest opacity-35">Recent sessions</span>
          {completionList.map(item => <div key={item.endedAt} className="flex justify-between gap-3 text-xs"><span className="font-sans truncate">{item.label}</span><span className="font-mono opacity-40">{formatDuration(item.durationMs)}</span></div>)}
        </div>
      )}
    </div>
  );
}

function SessionButton({ label, icon, onClick, quiet = false }: { label: string; icon: React.ReactNode; onClick: () => void; quiet?: boolean }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 border-[1px] font-sans text-[9px] uppercase tracking-widest transition-all active:scale-[0.97] cursor-pointer ${quiet ? 'border-border opacity-55 hover:opacity-100' : 'bg-charcoal border-charcoal text-bone hover:opacity-80'}`}>{icon}{label}</button>;
}

function WeekStrip({ config, today }: { config: TrainingConfig; today: Date }) {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  return (
    <div className="grid grid-cols-7 gap-1 pt-4">
      {Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const scheduled = scheduleForDate(config, date);
        const completed = config.completions.some(item => item.date === localDateKey(date));
        const isToday = localDateKey(date) === localDateKey(today);
        return <div key={index} className="flex flex-col items-center gap-1"><span className="font-sans text-[8px] uppercase opacity-35">{DAY_NAMES[index]}</span><span className={`w-2 h-2 ${completed ? 'bg-charcoal' : scheduled.rest ? 'border-[1px] border-charcoal/20' : isToday ? 'border-[1px] border-charcoal' : 'bg-charcoal/15'}`} /></div>;
      })}
    </div>
  );
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1_000);
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}` : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
