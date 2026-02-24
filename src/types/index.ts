// Journal Entry Data Model (US-002)
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '😊',
  5: '😄',
};

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Çok Kötü',
  2: 'Kötü',
  3: 'Normal',
  4: 'İyi',
  5: 'Çok İyi',
};

export interface JournalEntry {
  id: string;
  text: string;
  date: string;          // ISO date (YYYY-MM-DD)
  createdAt: string;    // ISO datetime
  mood?: MoodLevel;
  aiResponse?: string;
  aiPrompt?: string;
  wordCount: number;
}

// App Settings Data Model (US-008)
export type AIModel = 'minimax' | 'kimi';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  aiModel: AIModel;
  minimaxApiKey?: string;
  kimiApiKey?: string;
  minimaxBaseUrl: string;
  kimiBaseUrl: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  aiModel: 'minimax',
  minimaxBaseUrl: 'https://api.minimaxi.chat/v1',
  kimiBaseUrl: 'https://api.moonshot.cn/v1',
  reminderEnabled: false,
  reminderHour: 21,
  reminderMinute: 0,
};

// Storage keys
export const STORAGE_KEYS = {
  ENTRIES: '@aijournal/entries',
  SETTINGS: '@aijournal/settings',
  API_KEYS: '@aijournal/apikeys',
} as const;
