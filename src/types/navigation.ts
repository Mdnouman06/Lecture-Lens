export type ActiveView =
  | 'dashboard'
  | 'ingest'
  | 'workspace'
  | 'tutor'
  | 'flashcards'
  | 'quiz'
  | 'pyq'
  | 'planner'
  | 'settings';

export interface NavItem {
  id: ActiveView;
  label: string;
  iconName: string;
  badge?: string;
  shortcut?: string;
}

export type LocalAiStatus = 'checking' | 'connected' | 'offline';

export interface LocalAiHealth {
  status: LocalAiStatus;
  latencyMs?: number;
  model?: string;
  whisperEngine?: string;
  endpoint: string;
  isDemoMode: boolean;
  lastChecked?: string;
  error?: string;
}
