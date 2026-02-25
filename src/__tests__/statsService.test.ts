// Statistics Service Tests (US-005)

import {
  calculateStreak,
  calculateWritingStats,
  getLast7DaysMood,
  getMonthlyMoodDistribution,
  getWeekIdentifier,
  getWeekRange,
  formatWeekRange,
  getEntriesForWeek,
  getCurrentWeekIdentifier,
  hasSummaryForWeek,
  StreakInfo,
  WritingStats,
  DailyMood,
} from '../services/statsService';
import { JournalEntry, MoodLevel } from '../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Helper to create mock entries
function createMockEntry(date: string, wordCount: number, mood?: MoodLevel): JournalEntry {
  return {
    id: Math.random().toString(36),
    text: `Test entry for ${date}`,
    date,
    createdAt: new Date().toISOString(),
    mood,
    wordCount,
  };
}

describe('Statistics Service', () => {
  describe('calculateStreak', () => {
    it('should return 0 for empty entries', () => {
      const result = calculateStreak([]);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it('should calculate current streak correctly - consecutive days', () => {
      const today = new Date();
      const entries: JournalEntry[] = [];
      
      // Add entries for today and yesterday
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        entries.push(createMockEntry(date.toISOString().split('T')[0], 100));
      }
      
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(5);
    });

    it('should calculate longest streak correctly', () => {
      const entries: JournalEntry[] = [
        createMockEntry('2024-01-01', 100),
        createMockEntry('2024-01-02', 100),
        createMockEntry('2024-01-03', 100),
        createMockEntry('2024-01-05', 100), // Gap
        createMockEntry('2024-01-06', 100),
        createMockEntry('2024-01-07', 100),
      ];
      
      const result = calculateStreak(entries);
      expect(result.longestStreak).toBe(3);
    });

    it('should reset streak when gap is more than 1 day', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
      
      const entries: JournalEntry[] = [
        createMockEntry(todayStr, 100),
        createMockEntry(yesterdayStr, 100),
        // Gap - no entry for twoDaysAgo
      ];
      
      const result = calculateStreak(entries);
      // Current streak should be 2 (today + yesterday), longest should be 2
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });

    it('should return 0 current streak when last entry is more than 1 day ago', () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const entries: JournalEntry[] = [
        createMockEntry(threeDaysAgo.toISOString().split('T')[0], 100),
      ];
      
      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(0);
    });
  });

  describe('calculateWritingStats', () => {
    it('should return zeros for empty entries', () => {
      const result = calculateWritingStats([]);
      expect(result.totalEntries).toBe(0);
      expect(result.totalWordCount).toBe(0);
      expect(result.averageWordsPerEntry).toBe(0);
      expect(result.thisMonthCount).toBe(0);
    });

    it('should calculate totals correctly', () => {
      const entries: JournalEntry[] = [
        createMockEntry('2024-01-15', 150),
        createMockEntry('2024-01-16', 250),
        createMockEntry('2024-01-17', 100),
      ];
      
      const result = calculateWritingStats(entries);
      expect(result.totalEntries).toBe(3);
      expect(result.totalWordCount).toBe(500);
      expect(result.averageWordsPerEntry).toBe(167);
    });

    it('should calculate this month stats correctly', () => {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthDate = new Date(thisYear, thisMonth, 15);
      const lastMonthDate = new Date(thisYear, thisMonth - 1, 15);
      
      const entries: JournalEntry[] = [
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100),
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 150),
        createMockEntry(lastMonthDate.toISOString().split('T')[0], 200),
      ];
      
      const result = calculateWritingStats(entries);
      expect(result.thisMonthCount).toBe(2);
      expect(result.thisMonthWordCount).toBe(250);
    });
  });

  describe('getLast7DaysMood', () => {
    it('should return 7 days of data', () => {
      const result = getLast7DaysMood([]);
      expect(result).toHaveLength(7);
    });

    it('should have Turkish day labels', () => {
      const result = getLast7DaysMood([]);
      const turkishDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      result.forEach(day => {
        expect(turkishDays).toContain(day.dayLabel);
      });
    });

    it('should calculate average mood for days with multiple entries', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const entries: JournalEntry[] = [
        createMockEntry(todayStr, 100, 4),
        createMockEntry(todayStr, 100, 5), // Average should be 4.5 -> 5
      ];
      
      const result = getLast7DaysMood(entries);
      const todayData = result.find(d => d.date === todayStr);
      expect(todayData?.mood).toBe(5);
    });

    it('should return null mood for days without entries', () => {
      const result = getLast7DaysMood([]);
      result.forEach(day => {
        expect(day.mood).toBeNull();
      });
    });
  });

  describe('getMonthlyMoodDistribution', () => {
    it('should return zeros for empty entries', () => {
      const result = getMonthlyMoodDistribution([]);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(0);
      expect(result[4]).toBe(0);
      expect(result[5]).toBe(0);
    });

    it('should count moods correctly', () => {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthDate = new Date(thisYear, thisMonth, 15);
      
      const entries: JournalEntry[] = [
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100, 1),
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100, 3),
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100, 3),
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100, 5),
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100, 5),
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100, 5),
      ];
      
      const result = getMonthlyMoodDistribution(entries);
      expect(result[1]).toBe(1);
      expect(result[3]).toBe(2);
      expect(result[5]).toBe(3);
    });

    it('should only count this month entries', () => {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthDate = new Date(thisYear, thisMonth, 15);
      const lastMonthDate = new Date(thisYear, thisMonth - 1, 15);
      
      const entries: JournalEntry[] = [
        createMockEntry(thisMonthDate.toISOString().split('T')[0], 100, 5),
        createMockEntry(lastMonthDate.toISOString().split('T')[0], 100, 1),
      ];
      
      const result = getMonthlyMoodDistribution(entries);
      expect(result[5]).toBe(1);
      expect(result[1]).toBe(0);
    });
  });

  describe('getWeekIdentifier', () => {
    it('should return Monday of the week', () => {
      // A Thursday
      const thursday = new Date('2024-01-18');
      const weekId = getWeekIdentifier(thursday);
      expect(weekId).toBe('2024-01-15'); // Monday
    });

    it('should return same date if already Monday', () => {
      const monday = new Date('2024-01-15');
      const weekId = getWeekIdentifier(monday);
      expect(weekId).toBe('2024-01-15');
    });

    it('should handle Sunday correctly', () => {
      const sunday = new Date('2024-01-21');
      const weekId = getWeekIdentifier(sunday);
      expect(weekId).toBe('2024-01-15'); // Previous Monday
    });
  });

  describe('getWeekRange', () => {
    it('should return start and end dates for a week', () => {
      const result = getWeekRange('2024-01-15');
      expect(result.start.toISOString().split('T')[0]).toBe('2024-01-15');
      expect(result.end.toISOString().split('T')[0]).toBe('2024-01-21');
    });
  });

  describe('formatWeekRange', () => {
    it('should format week range in Turkish', () => {
      const result = formatWeekRange('2024-01-15', '2024-01-21');
      expect(result).toContain('Oca');
      expect(result).toContain('2024');
    });
  });

  describe('getEntriesForWeek', () => {
    it('should filter entries within week range', () => {
      const entries: JournalEntry[] = [
        createMockEntry('2024-01-14', 100), // Before week
        createMockEntry('2024-01-15', 100), // Start of week
        createMockEntry('2024-01-18', 100), // Middle of week
        createMockEntry('2024-01-21', 100), // End of week
        createMockEntry('2024-01-22', 100), // After week
      ];
      
      const result = getEntriesForWeek(entries, '2024-01-15');
      expect(result).toHaveLength(3);
    });
  });

  describe('getCurrentWeekIdentifier', () => {
    it('should return a valid date string', () => {
      const result = getCurrentWeekIdentifier();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('hasSummaryForWeek', () => {
    it('should return false when no summaries exist', async () => {
      const result = await hasSummaryForWeek('2024-01-15');
      expect(result).toBe(false);
    });
  });
});
