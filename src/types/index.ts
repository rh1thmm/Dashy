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

export type WidgetType = 'clock' | 'weather' | 'tasks' | 'triggers';

export type WidgetTier = 'compact' | 'standard' | 'expanded';

export interface WidgetData {
  id: string;
  type: WidgetType;
  config?: any;
}
