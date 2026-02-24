// US-004 Calendar Tests - Helper functions duplicated for testing
// (Jest cannot directly import from app/ directory due to React Native require issues)

// Helper functions - copied from app/(tabs)/calendar.tsx
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert to Monday-based (0 = Monday, 6 = Sunday)
  return day === 0 ? 6 : day - 1;
}

function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Helper functions tests
describe('US-004 Calendar Helper Functions', () => {
  describe('getDaysInMonth', () => {
    it('should return 31 for January', () => {
      expect(getDaysInMonth(2026, 0)).toBe(31);
    });

    it('should return 28 for February 2026 (non-leap year)', () => {
      expect(getDaysInMonth(2026, 1)).toBe(28);
    });

    it('should return 29 for February 2024 (leap year)', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29);
    });

    it('should return 30 for April', () => {
      expect(getDaysInMonth(2026, 3)).toBe(30);
    });

    it('should return 31 for May', () => {
      expect(getDaysInMonth(2026, 4)).toBe(31);
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('should return 6 for February 2026 (starts on Sunday)', () => {
      // February 1, 2026 is a Sunday
      expect(getFirstDayOfMonth(2026, 1)).toBe(6);
    });

    it('should return correct day for March 2026', () => {
      // March 1, 2026 is a Sunday
      expect(getFirstDayOfMonth(2026, 2)).toBe(6);
    });

    it('should return correct day for January 2026', () => {
      // January 1, 2026 is a Thursday
      expect(getFirstDayOfMonth(2026, 0)).toBe(3);
    });
  });

  describe('formatDateString', () => {
    it('should format date as YYYY-MM-DD with padding', () => {
      expect(formatDateString(2026, 0, 5)).toBe('2026-01-05');
      expect(formatDateString(2026, 5, 1)).toBe('2026-06-01');
      expect(formatDateString(2026, 11, 31)).toBe('2026-12-31');
    });

    it('should pad single digit months and days', () => {
      expect(formatDateString(2026, 0, 1)).toBe('2026-01-01');
      expect(formatDateString(2026, 5, 9)).toBe('2026-06-09');
    });
  });
});

// Navigation logic tests
describe('US-004 Calendar Navigation', () => {
  const createMockDate = (year: number, month: number, day: number) => {
    return new Date(year, month, day);
  };

  it('should navigate to previous month', () => {
    const currentDate = createMockDate(2026, 2, 1); // March 2026
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    expect(newDate.getMonth()).toBe(1); // February
    expect(newDate.getFullYear()).toBe(2026);
  });

  it('should navigate to next month', () => {
    const currentDate = createMockDate(2026, 2, 1); // March 2026
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    expect(newDate.getMonth()).toBe(3); // April
    expect(newDate.getFullYear()).toBe(2026);
  });

  it('should navigate across year boundary', () => {
    const currentDate = createMockDate(2026, 11, 1); // December 2026
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    expect(newDate.getMonth()).toBe(0); // January
    expect(newDate.getFullYear()).toBe(2027);
  });

  it('should navigate backwards across year boundary', () => {
    const currentDate = createMockDate(2026, 0, 1); // January 2026
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    expect(newDate.getMonth()).toBe(11); // December
    expect(newDate.getFullYear()).toBe(2025);
  });
});

// Mood calculation tests
describe('US-004 Mood Averaging', () => {
  interface MockEntry {
    mood?: number;
  }

  const calculateAverageMood = (entries: MockEntry[]): number | null => {
    const moods = entries.filter(e => e.mood).map(e => e.mood as number);
    if (moods.length === 0) return null;
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    return Math.round(avg);
  };

  it('should return null for empty entries', () => {
    expect(calculateAverageMood([])).toBeNull();
  });

  it('should return null for entries without mood', () => {
    expect(calculateAverageMood([{}, {}])).toBeNull();
  });

  it('should return exact mood for single entry', () => {
    expect(calculateAverageMood([{ mood: 4 }])).toBe(4);
  });

  it('should round up for .5 average', () => {
    expect(calculateAverageMood([{ mood: 3 }, { mood: 4 }])).toBe(4);
  });

  it('should round down for below .5 average', () => {
    expect(calculateAverageMood([{ mood: 3 }, { mood: 3 }])).toBe(3);
  });

  it('should calculate average mood correctly', () => {
    expect(calculateAverageMood([{ mood: 2 }, { mood: 4 }])).toBe(3);
    expect(calculateAverageMood([{ mood: 1 }, { mood: 5 }, { mood: 5 }])).toBe(4);
  });
});

// Search functionality tests
describe('US-004 Search Functionality', () => {
  interface MockEntry {
    id: string;
    text: string;
    date: string;
    mood?: number;
  }

  const searchEntries = (entries: MockEntry[], query: string): MockEntry[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry => entry.text.toLowerCase().includes(lowerQuery));
  };

  it('should return empty array for empty query', () => {
    const entries: MockEntry[] = [
      { id: '1', text: 'Bugün güzel bir gündü', date: '2026-02-24' }
    ];
    expect(searchEntries(entries, '')).toEqual([]);
  });

  it('should return empty array for whitespace query', () => {
    const entries: MockEntry[] = [
      { id: '1', text: 'Bugün güzel bir gündü', date: '2026-02-24' }
    ];
    expect(searchEntries(entries, '   ')).toEqual([]);
  });

  it('should find entries matching query', () => {
    const entries: MockEntry[] = [
      { id: '1', text: 'Bugün güzel bir gündü', date: '2026-02-24' },
      { id: '2', text: 'Hava çok güzeldi', date: '2026-02-23' },
      { id: '3', text: 'Çalışmak güzel hissettirdi', date: '2026-02-22' }
    ];
    
    const results = searchEntries(entries, 'güzel');
    expect(results).toHaveLength(3);
  });

  it('should be case insensitive', () => {
    const entries: MockEntry[] = [
      { id: '1', text: 'BUGÜN güzel', date: '2026-02-24' }
    ];
    
    expect(searchEntries(entries, 'bugün')).toHaveLength(1);
    expect(searchEntries(entries, 'GÜZEL')).toHaveLength(1);
  });

  it('should return empty for no matches', () => {
    const entries: MockEntry[] = [
      { id: '1', text: 'Bugün güzel bir gündü', date: '2026-02-24' }
    ];
    
    expect(searchEntries(entries, 'kötü')).toHaveLength(0);
  });

  it('should filter by multiple words in query', () => {
    const entries: MockEntry[] = [
      { id: '1', text: 'Bugün çok güzel bir gündü', date: '2026-02-24' },
      { id: '2', text: 'Bugün güzel', date: '2026-02-23' }
    ];
    
    const results = searchEntries(entries, 'bugün güzel');
    expect(results).toHaveLength(2);
  });
});

// Turkish localization tests
describe('US-004 Turkish Localization', () => {
  const TURKISH_MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const TURKISH_WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  it('should have all 12 Turkish month names', () => {
    expect(TURKISH_MONTHS).toHaveLength(12);
    expect(TURKISH_MONTHS[0]).toBe('Ocak');
    expect(TURKISH_MONTHS[5]).toBe('Haziran');
    expect(TURKISH_MONTHS[11]).toBe('Aralık');
  });

  it('should have 7 Turkish weekday abbreviations', () => {
    expect(TURKISH_WEEKDAYS).toHaveLength(7);
    expect(TURKISH_WEEKDAYS[0]).toBe('Pzt'); // Pazartesi
    expect(TURKISH_WEEKDAYS[6]).toBe('Paz'); // Pazar
  });

  it('should correctly format Turkish date', () => {
    const date = new Date('2026-02-24T12:00:00');
    const formatted = date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    expect(formatted).toContain('24');
    expect(formatted).toContain('Şubat');
    expect(formatted).toContain('2026');
  });
});
