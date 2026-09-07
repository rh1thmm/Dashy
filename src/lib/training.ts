import type { TrainingCompletion, TrainingConfig, TrainingScheduleDay } from '../types';

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_SCHEDULE: TrainingScheduleDay[] = [
  { day: 0, label: 'Rest', rest: true },
  { day: 1, label: 'Push', rest: false },
  { day: 2, label: 'Pull', rest: false },
  { day: 3, label: 'Rest', rest: true },
  { day: 4, label: 'Legs', rest: false },
  { day: 5, label: 'Mobility', rest: false },
  { day: 6, label: 'Rest', rest: true },
];

export const createTrainingConfig = (): TrainingConfig => ({
  reminderTime: '18:00',
  repeatReminder: true,
  schedule: DEFAULT_SCHEDULE.map(item => ({ ...item })),
  completions: [],
});

export function normalizeTrainingConfig(config?: Partial<TrainingConfig>): TrainingConfig {
  const defaults = createTrainingConfig();
  return {
    ...defaults,
    ...config,
    schedule: DEFAULT_SCHEDULE.map(defaultDay => {
      const savedDay = config?.schedule?.find(item => item.day === defaultDay.day);
      return savedDay ? { ...defaultDay, ...savedDay } : { ...defaultDay };
    }),
    completions: config?.completions ?? [],
  };
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function scheduleForDate(config: TrainingConfig, date = new Date()): TrainingScheduleDay {
  return config.schedule.find(item => item.day === date.getDay()) ?? config.schedule[0];
}

export function workoutStreak(config: TrainingConfig, now = new Date()): number {
  const completed = new Set(config.completions.map(item => item.date));
  const cursor = new Date(now);
  if (!completed.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const scheduled = scheduleForDate(config, cursor);
    if (!scheduled.rest) {
      if (!completed.has(localDateKey(cursor))) break;
      streak += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function recentCompletions(config: TrainingConfig): TrainingCompletion[] {
  return [...config.completions].sort((a, b) => b.endedAt - a.endedAt);
}
