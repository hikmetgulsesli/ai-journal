// Statistics Service for AI Insights (US-005)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, MoodLevel, STORAGE_KEYS } from '../types';

export interface WritingStats {
  totalEntries: number;
  totalWordCount: number;
  averageWordsPerEntry: number;
  thisMonthCount: number;
  thisMonthWordCount: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

export interface DailyMood {
  date: string;
  dayLabel: string;
  mood: MoodLevel | null;
}

export interface WeeklySummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  createdAt: string;
}

// Turkish day abbreviations
export const TURKISH_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// Get week identifier (ISO week start - Monday)
export function getWeekIdentifier(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// Get week start and end dates
export function getWeekRange(weekIdentifier: string): { start: Date; end: Date } {
  const start = new Date(weekIdentifier);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

// Format week range for display
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);
  
  const startStr = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const endStr = endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  
  return `${startStr} - ${endStr}`;
}

// Calculate streak from entries
export function calculateStreak(entries: JournalEntry[]): StreakInfo {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates with entries, sorted descending
  const entryDates = [...new Set(entries.map(e => e.date))].sort().reverse();
  
  if (entryDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  // Check if there's an entry today or yesterday to start the streak
  if (entryDates.includes(todayStr)) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (entryDates.includes(yesterdayStr)) {
    // Streak is broken from today but continues from yesterday
    currentStreak = 1;
    checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // No entry today or yesterday, streak is 0
    currentStreak = 0;
  }

  // Continue counting consecutive days
  while (true) {
    const checkDateStr = checkDate.toISOString().split('T')[0];
    if (entryDates.includes(checkDateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 1; i < entryDates.length; i++) {
    const prevDate = new Date(entryDates[i - 1]);
    const currDate = new Date(entryDates[i]);
    const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // If no entry today or yesterday, current streak is 0
  if (!entryDates.includes(todayStr) && !entryDates.includes(yesterdayStr)) {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}

// Calculate writing statistics
export function calculateWritingStats(entries: JournalEntry[]): WritingStats {
  const totalEntries = entries.length;
  const totalWordCount = entries.reduce((sum, e) => sum + e.wordCount, 0);
  const averageWordsPerEntry = totalEntries > 0 ? Math.round(totalWordCount / totalEntries) : 0;
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const thisMonthEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
  });
  
  const thisMonthCount = thisMonthEntries.length;
  const thisMonthWordCount = thisMonthEntries.reduce((sum, e) => sum + e.wordCount, 0);
  
  return {
    totalEntries,
    totalWordCount,
    averageWordsPerEntry,
    thisMonthCount,
    thisMonthWordCount,
  };
}

// Get last 7 days mood data
export function getLast7DaysMood(entries: JournalEntry[]): DailyMood[] {
  const today = new Date();
  const result: DailyMood[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    // Get the day's mood (average of entries for that day)
    const dayEntries = entries.filter(e => e.date === dateStr && e.mood);
    let mood: MoodLevel | null = null;
    
    if (dayEntries.length > 0) {
      const avgMood = dayEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / dayEntries.length;
      mood = Math.round(avgMood) as MoodLevel;
    }
    
    result.push({
      date: dateStr,
      dayLabel: TURKISH_DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1],
      mood,
    });
  }
  
  return result;
}

// Get monthly mood distribution
export function getMonthlyMoodDistribution(entries: JournalEntry[]): Record<MoodLevel, number> {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const monthEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate.getMonth() === thisMonth && 
           entryDate.getFullYear() === thisYear && 
           e.mood;
  });
  
  const distribution: Record<MoodLevel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  
  monthEntries.forEach(e => {
    if (e.mood) {
      distribution[e.mood]++;
    }
  });
  
  return distribution;
}

// Weekly summaries storage key
const SUMMARIES_KEY = '@aijournal/weekly_summaries';

// Get all weekly summaries
export async function getWeeklySummaries(): Promise<WeeklySummary[]> {
  try {
    const summariesJson = await AsyncStorage.getItem(SUMMARIES_KEY);
    if (summariesJson) {
      const summaries: WeeklySummary[] = JSON.parse(summariesJson);
      return summaries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [];
  } catch {
    return [];
  }
}

// Save weekly summary
export async function saveWeeklySummary(summary: WeeklySummary): Promise<void> {
  try {
    const existing = await getWeeklySummaries();
    const updated = [summary, ...existing];
    await AsyncStorage.setItem(SUMMARIES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save weekly summary:', error);
    throw error;
  }
}

// Get entries for a specific week
export function getEntriesForWeek(entries: JournalEntry[], weekStart: string): JournalEntry[] {
  const { start, end } = getWeekRange(weekStart);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  
  return entries.filter(e => e.date >= startStr && e.date <= endStr);
}

// Generate week identifier for current week
export function getCurrentWeekIdentifier(): string {
  return getWeekIdentifier(new Date());
}

// Check if summary exists for a week
export async function hasSummaryForWeek(weekIdentifier: string): Promise<boolean> {
  const summaries = await getWeeklySummaries();
  return summaries.some(s => s.weekStart === weekIdentifier);
}
