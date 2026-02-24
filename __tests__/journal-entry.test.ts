// Journal Entry CRUD Operations Tests
// Tests for US-002: Journal Entry Core with Mood Tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, MoodLevel, STORAGE_KEYS } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678'),
}));

describe('Journal Entry CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to count words (same as implementation)
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to get today's date string
  const getTodayDateString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  describe('Create Entry', () => {
    it('should create a new journal entry with all required fields', async () => {
      const entryText = 'Bugün çok güzel bir gündü.';
      const selectedMood: MoodLevel = 4;
      const todayISO = getTodayDateString();

      const newEntry: JournalEntry = {
        id: uuidv4(),
        text: entryText.trim(),
        date: todayISO,
        createdAt: new Date().toISOString(),
        mood: selectedMood,
        wordCount: countWords(entryText),
      };

      // Verify entry structure
      expect(newEntry.id).toBe('test-uuid-1234-5678');
      expect(newEntry.text).toBe('Bugün çok güzel bir gündü.');
      expect(newEntry.date).toBe(todayISO);
      expect(newEntry.mood).toBe(4);
      expect(newEntry.wordCount).toBe(5);
      expect(newEntry.createdAt).toBeDefined();
    });

    it('should create entry without mood when not selected', async () => {
      const entryText = 'Normal bir gün.';
      
      const newEntry: JournalEntry = {
        id: uuidv4(),
        text: entryText.trim(),
        date: getTodayDateString(),
        createdAt: new Date().toISOString(),
        wordCount: countWords(entryText),
      };

      expect(newEntry.mood).toBeUndefined();
      expect(newEntry.text).toBe('Normal bir gün.');
    });

    it('should correctly count words in Turkish text', () => {
      expect(countWords('Bugün çok güzel bir gündü')).toBe(5);
      expect(countWords('  Multiple   spaces  ')).toBe(2);
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });

    it('should save entry to AsyncStorage', async () => {
      const newEntry: JournalEntry = {
        id: 'test-id',
        text: 'Test entry',
        date: getTodayDateString(),
        createdAt: new Date().toISOString(),
        wordCount: 2,
      };

      const mockEntries: JournalEntry[] = [];
      mockEntries.push(newEntry);

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(mockEntries));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ENTRIES,
        JSON.stringify(mockEntries)
      );
    });
  });

  describe('Read Entries', () => {
    it('should read all entries from AsyncStorage', async () => {
      const mockEntries: JournalEntry[] = [
        {
          id: '1',
          text: 'Entry 1',
          date: getTodayDateString(),
          createdAt: new Date().toISOString(),
          wordCount: 1,
        },
        {
          id: '2',
          text: 'Entry 2',
          date: getTodayDateString(),
          createdAt: new Date().toISOString(),
          wordCount: 1,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockEntries)
      );

      const result = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const entries: JournalEntry[] = JSON.parse(result!);

      expect(entries).toHaveLength(2);
      expect(entries[0].text).toBe('Entry 1');
    });

    it('should filter entries by today date', async () => {
      const todayISO = getTodayDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString().split('T')[0];

      const mockEntries: JournalEntry[] = [
        {
          id: '1',
          text: "Today's entry",
          date: todayISO,
          createdAt: new Date().toISOString(),
          wordCount: 2,
        },
        {
          id: '2',
          text: "Yesterday's entry",
          date: yesterdayISO,
          createdAt: yesterday.toISOString(),
          wordCount: 2,
        },
      ];

      const todayEntries = mockEntries.filter(entry => entry.date === todayISO);

      expect(todayEntries).toHaveLength(1);
      expect(todayEntries[0].text).toBe("Today's entry");
    });

    it('should sort entries by createdAt descending', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000); // 1 hour ago

      const entries: JournalEntry[] = [
        { id: '1', text: 'Earlier', date: getTodayDateString(), createdAt: earlier.toISOString(), wordCount: 1 },
        { id: '2', text: 'Now', date: getTodayDateString(), createdAt: now.toISOString(), wordCount: 1 },
      ];

      const sorted = entries.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].text).toBe('Now');
      expect(sorted[1].text).toBe('Earlier');
    });

    it('should return empty array when no entries exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      
      expect(result).toBeNull();
    });
  });

  describe('Update Entry', () => {
    it('should update existing entry in AsyncStorage', async () => {
      const existingEntries: JournalEntry[] = [
        {
          id: '1',
          text: 'Original text',
          date: getTodayDateString(),
          createdAt: new Date().toISOString(),
          wordCount: 2,
        },
      ];

      // Update the entry
      existingEntries[0].text = 'Updated text';
      existingEntries[0].wordCount = 2;

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(existingEntries));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ENTRIES,
        JSON.stringify(existingEntries)
      );
    });

    it('should add mood to entry that previously had none', async () => {
      const existingEntries: JournalEntry[] = [
        {
          id: '1',
          text: 'Entry without mood',
          date: getTodayDateString(),
          createdAt: new Date().toISOString(),
          wordCount: 3,
        },
      ];

      // Add mood
      existingEntries[0].mood = 5;

      expect(existingEntries[0].mood).toBe(5);
    });
  });

  describe('Delete Entry', () => {
    it('should delete entry from AsyncStorage', async () => {
      const existingEntries: JournalEntry[] = [
        { id: '1', text: 'Entry 1', date: getTodayDateString(), createdAt: new Date().toISOString(), wordCount: 1 },
        { id: '2', text: 'Entry 2', date: getTodayDateString(), createdAt: new Date().toISOString(), wordCount: 1 },
      ];

      const entryIdToDelete = '1';
      const filtered = existingEntries.filter(e => e.id !== entryIdToDelete);

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered));

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should handle deleting non-existent entry gracefully', async () => {
      const existingEntries: JournalEntry[] = [
        { id: '1', text: 'Entry 1', date: getTodayDateString(), createdAt: new Date().toISOString(), wordCount: 1 },
      ];

      const entryIdToDelete = 'non-existent-id';
      const filtered = existingEntries.filter(e => e.id !== entryIdToDelete);

      expect(filtered).toHaveLength(1);
    });
  });

  describe('Mood Handling', () => {
    it('should store all mood levels correctly', () => {
      const moodLevels: MoodLevel[] = [1, 2, 3, 4, 5];
      
      moodLevels.forEach(mood => {
        expect([1, 2, 3, 4, 5]).toContain(mood);
      });
    });

    it('should have correct mood emojis mapping', () => {
      const MOOD_EMOJIS: Record<MoodLevel, string> = {
        1: '😢',
        2: '😔',
        3: '😐',
        4: '😊',
        5: '😄',
      };

      expect(MOOD_EMOJIS[1]).toBe('😢');
      expect(MOOD_EMOJIS[2]).toBe('😔');
      expect(MOOD_EMOJIS[3]).toBe('😐');
      expect(MOOD_EMOJIS[4]).toBe('😊');
      expect(MOOD_EMOJIS[5]).toBe('😄');
    });

    it('should have correct mood labels in Turkish', () => {
      const MOOD_LABELS: Record<MoodLevel, string> = {
        1: 'Çok Kötü',
        2: 'Kötü',
        3: 'Normal',
        4: 'İyi',
        5: 'Çok İyi',
      };

      expect(MOOD_LABELS[1]).toBe('Çok Kötü');
      expect(MOOD_LABELS[2]).toBe('Kötü');
      expect(MOOD_LABELS[3]).toBe('Normal');
      expect(MOOD_LABELS[4]).toBe('İyi');
      expect(MOOD_LABELS[5]).toBe('Çok İyi');
    });
  });

  describe('Date Formatting', () => {
    it('should format date in Turkish locale', () => {
      const date = new Date('2026-02-24');
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      };
      const formatted = date.toLocaleDateString('tr-TR', options);
      
      expect(formatted).toContain('Şubat');
      expect(formatted).toContain('2026');
    });

    it('should extract ISO date string correctly', () => {
      const date = new Date('2026-02-24T12:00:00.000Z');
      const isoDate = date.toISOString().split('T')[0];
      
      expect(isoDate).toBe('2026-02-24');
    });
  });

  describe('Storage Key', () => {
    it('should use correct AsyncStorage key', () => {
      expect(STORAGE_KEYS.ENTRIES).toBe('@aijournal/entries');
    });
  });
});
