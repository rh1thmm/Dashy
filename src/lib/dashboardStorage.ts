export interface PersistedDashboardState {
  widgets: unknown[];
  layout: unknown[];
  appBackground?: string;
  gridLineWeight?: 'thin' | 'normal';
  gridLineStyle?: 'solid' | 'dashed' | 'dotted' | 'hidden';
  canvasInset?: number;
  showNoise?: boolean;
  theme?: {
    canvas: string;
    surface: string;
    ink: string;
    muted: string;
    grid: string;
  };
}

const API_URL = '/api/dashboard-state';
const LEGACY_STORAGE_KEY = 'monolith_dashboard_state';

export async function loadDashboardState(): Promise<PersistedDashboardState | null> {
  const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Unable to load dashboard state (${response.status}).`);
  const payload = await response.json() as { state: PersistedDashboardState | null };
  return payload.state;
}

export async function saveDashboardState(state: PersistedDashboardState): Promise<void> {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
  if (!response.ok) throw new Error(`Unable to save dashboard state (${response.status}).`);
}

export async function clearDashboardState(): Promise<void> {
  const response = await fetch(API_URL, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Unable to clear dashboard state (${response.status}).`);
}

/** Imports pre-1.2 browser state once, then the caller can save it to SQLite. */
export function readLegacyDashboardState(): PersistedDashboardState | null {
  const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? parsed as PersistedDashboardState : null;
  } catch {
    return null;
  }
}

export function clearLegacyDashboardState(): void {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
