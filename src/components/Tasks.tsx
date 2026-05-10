import { useState, useRef } from 'react';
import type { WidgetTier, TaskItem } from '../types';
import { Plus } from '@phosphor-icons/react';

const DEFAULT_TASKS: TaskItem[] = [
  { id: '1', text: 'Review deploy pipeline', done: false },
  { id: '2', text: 'Update dependencies', done: true },
  { id: '3', text: 'Write changelog', done: false },
  { id: '4', text: 'Check analytics', done: false },
  { id: '5', text: 'Sync staging DB', done: true },
  { id: '6', text: 'Audit access logs', done: false },
  { id: '7', text: 'Plan sprint retro', done: false },
];

const REMOVE_MS: Record<string, number | null> = {
  'never': null,
  'instant': 300,
  '1h': 3600000,
  '1d': 86400000,
};

export function Tasks({ tier = 'compact', tasks: externalTasks, removeAfter = 'never', onChange }: {
  tier?: WidgetTier;
  tasks?: TaskItem[];
  removeAfter?: string;
  onChange?: (tasks: TaskItem[]) => void;
}) {
  const tasks = externalTasks ?? DEFAULT_TASKS;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const [showInput, setShowInput] = useState(false);
  const [newText, setNewText] = useState('');

  const toggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;

    onChange?.(tasks.map(t => t.id === id ? { ...t, done: newDone } : t));

    if (newDone) {
      const ms = REMOVE_MS[removeAfter];
      if (ms) {
        setTimeout(() => {
          const current = tasksRef.current;
          if (current.some(t => t.id === id)) {
            onChange?.(current.filter(t => t.id !== id));
          }
        }, ms);
      }
    }
  };

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    onChange?.([...tasks, { id: Date.now().toString(), text, done: false }]);
    setNewText('');
    setShowInput(false);
  };

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (tier === 'compact') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-4xl font-normal tracking-tighter">{done}</span>
          <span className="font-sans text-xs opacity-30 tracking-widest uppercase">/ {total}</span>
        </div>
        <div className="w-3/4 h-[1px] bg-border relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-charcoal transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-sans text-[10px] uppercase tracking-widest opacity-40 mt-1">
          {done === total ? 'Complete' : `${total - done} remaining`}
        </span>
      </div>
    );
  }

  const visibleItems = tier === 'expanded' ? tasks : tasks.slice(0, 5);

  return (
    <div className="flex flex-col w-full h-full py-4 px-5">
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {visibleItems.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-sans text-xs uppercase tracking-widest opacity-20">No tasks</span>
          </div>
        )}
        {visibleItems.map(t => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className={`w-3.5 h-3.5 flex-shrink-0 border-[1px] flex items-center justify-center transition-all duration-150 ease-out ${
              t.done
                ? 'bg-charcoal border-charcoal'
                : 'bg-transparent border-charcoal/30 group-hover:border-charcoal/60'
            }`}>
              {t.done && (
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#F9F8F4" strokeWidth="1.5" strokeLinecap="square" strokeDasharray="20" strokeDashoffset="20" className="animate-check-draw" />
                </svg>
              )}
            </div>
            <span className={`font-sans text-sm tracking-wide transition-all duration-150 ease-out ${
              t.done ? 'opacity-30 line-through' : 'opacity-80 group-hover:opacity-100'
            }`}>
              {t.text}
            </span>
          </button>
        ))}
        {tier === 'standard' && tasks.length > 5 && (
          <span className="font-sans text-[10px] tracking-widest uppercase opacity-30">
            + {tasks.length - 5} more
          </span>
        )}
      </div>

      {/* Add task row */}
      {tier === 'expanded' || showInput ? (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t-[1px] border-border">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') { setShowInput(false); setNewText(''); } }}
            placeholder={tier === 'expanded' ? 'Add task' : 'New task'}
            autoFocus
            className="flex-1 bg-transparent border-none p-0 font-sans text-sm outline-none placeholder:opacity-30 tracking-wide"
          />
          <button
            onClick={addTask}
            disabled={!newText.trim()}
            className="opacity-40 hover:opacity-80 disabled:opacity-10 transition-all duration-100 ease-out cursor-pointer active:scale-[0.95]"
          >
            <Plus size={14} weight="thin" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center justify-center gap-2 mt-3 pt-3 border-t-[1px] border-border opacity-40 hover:opacity-80 transition-all duration-100 ease-out cursor-pointer active:scale-[0.97]"
        >
          <Plus size={12} weight="thin" />
          <span className="font-sans text-[10px] uppercase tracking-widest">Add task</span>
        </button>
      )}
    </div>
  );
}
