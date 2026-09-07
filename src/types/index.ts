export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TriggerButton {
  id: string;
  label: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: { key: string; value: string }[];
  body?: string;
}

export interface TrainingScheduleDay {
  day: number;
  label: string;
  rest: boolean;
}

export interface TrainingSession {
  date: string;
  label: string;
  startedAt: number;
  pausedAt?: number;
  pausedMs: number;
}

export interface TrainingCompletion {
  date: string;
  label: string;
  durationMs: number;
  endedAt: number;
}

export interface TrainingConfig {
  reminderTime: string;
  repeatReminder: boolean;
  schedule: TrainingScheduleDay[];
  activeSession?: TrainingSession;
  completions: TrainingCompletion[];
  lastReminderAt?: number;
}

export interface ThemeConfig {
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  grid: string;
}

export type WidgetType = 'clock' | 'weather' | 'tasks' | 'triggers' | 'docker' | 'training';

export type WidgetTier = 'compact' | 'standard' | 'expanded';

export interface WidgetData {
  id: string;
  type: WidgetType;
  config?: any;
}
