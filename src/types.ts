export type SubtestCode = 'PU' | 'PPU' | 'PBM' | 'PK' | 'LBI' | 'LBE' | 'PM';

export type PlannerActivityCode = SubtestCode | 'TO' | 'REST' | 'EVAL' | 'REVIEW' | 'FREE';

export type TabRoute = 'beranda' | 'nilai' | 'agenda' | 'jadwal' | 'data';

export type SubViewRoute =
  | { type: 'tab'; tab: TabRoute }
  | { type: 'study_form'; date?: string; sessionId?: string }
  | { type: 'tryout_form'; tryoutId?: string }
  | { type: 'settings' };

export interface SubtestMeta {
  code: SubtestCode;
  name: string;
  shortName: string;
  description: string;
  bgHex: string;
  textHex: string;
}

export interface PlannerActivityMeta {
  code: PlannerActivityCode;
  name: string;
  shortName: string;
  hint: string;
  bgHex: string;
  textHex: string;
  isSubtest: boolean;
}

export interface TryoutPlatform {
  id: string;
  name: string;
  shortCode: string;
  colorHex: string;
  colorName: string;
  ratingType: string;
  badgeText: string;
}

export interface TryoutRecord {
  id: string;
  platformId: string;
  title: string;
  code: string;
  date: string; // YYYY-MM-DD
  averageScore: number;
  scores: Record<SubtestCode, number>;
  tag?: string;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g., "14:30"
  durationMinutes: number;
  subtests: SubtestCode[];
  notes: string;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  activities: PlannerActivityCode[];
}

export interface TelegramSettings {
  connected: boolean;
  botHandle: string;
  chatId: string;
  dailyReminder: boolean;
  dailyTime: string;
  scheduleReminder: boolean;
  scheduleTime: string;
  weeklyEval: boolean;
  weeklyDayTime: string;
}

export interface UserSettings {
  userName: string;
  track: string;
  targetDate: string; // YYYY-MM-DD
  targetScore: number;
  targetUniversity: string;
  targetUniversityShort: string;
  targetMajor: string;
  focusSubtests: SubtestCode[];
  dailyTargetMinutes: number;
  pomodoroMinutes: number;
  telegram: TelegramSettings;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'offline' | 'error';
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}
