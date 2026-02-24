import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  FlatList,
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { JournalEntry, MOOD_EMOJIS, MoodLevel } from '../../src/types';
import { STORAGE_KEYS } from '../../src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

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

export default function CalendarScreen() {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<Record<string, JournalEntry[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayString = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());

  // Load all entries
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (entriesJson) {
        const allEntries: JournalEntry[] = JSON.parse(entriesJson);
        setEntries(allEntries);
        
        // Group by date
        const byDate: Record<string, JournalEntry[]> = {};
        allEntries.forEach(entry => {
          if (!byDate[entry.date]) {
            byDate[entry.date] = [];
          }
          byDate[entry.date].push(entry);
        });
        setEntriesByDate(byDate);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(year, month + direction, 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const getAverageMood = (dateEntries: JournalEntry[]): MoodLevel | null => {
    const moods = dateEntries.filter(e => e.mood).map(e => e.mood as number);
    if (moods.length === 0) return null;
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    return Math.round(avg) as MoodLevel;
  };

  const renderCalendarDays = () => {
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <View style={styles.calendarGrid}>
        {/* Weekday headers */}
        {WEEKDAYS.map(day => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: colors.textMuted }]}>
              {day}
            </Text>
          </View>
        ))}

        {/* Day cells */}
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const dateString = formatDateString(year, month, day);
          const isToday = dateString === todayString;
          const isSelected = dateString === selectedDate;
          const hasEntries = !!entriesByDate[dateString];
          const avgMood = hasEntries ? getAverageMood(entriesByDate[dateString]) : null;

          return (
            <TouchableOpacity
              key={dateString}
              style={[
                styles.dayCell,
                isToday && { backgroundColor: colors.primary },
                isSelected && { backgroundColor: colors.primaryDark },
              ]}
              onPress={() => setSelectedDate(dateString)}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: isToday || isSelected ? '#fff' : colors.text },
                ]}
              >
                {day}
              </Text>
              {hasEntries && (
                <View
                  style={[
                    styles.entryDot,
                    { backgroundColor: avgMood ? colors.mood[avgMood] : colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSelectedDateEntries = () => {
    if (!selectedDate) return null;
    
    const dateEntries = entriesByDate[selectedDate] || [];
    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <View style={styles.entriesSection}>
        <Text style={[styles.selectedDateTitle, { color: colors.text }]}>
          {displayDate}
        </Text>
        
        {dateEntries.length === 0 ? (
          <Text style={[styles.noEntriesText, { color: colors.textMuted }]}>
            Bu gün için giriş yok
          </Text>
        ) : (
          dateEntries
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(entry => {
              const time = new Date(entry.createdAt).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryTime, { color: colors.textMuted }]}>
                      {time}
                    </Text>
                    {entry.mood && (
                      <Text style={styles.entryMood}>{MOOD_EMOJIS[entry.mood]}</Text>
                    )}
                  </View>
                  <Text
                    style={[styles.entryPreview, { color: colors.text }]}
                    numberOfLines={3}
                  >
                    {entry.text}
                  </Text>
                </TouchableOpacity>
              );
            })
        )}
      </View>
    );
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const results = entries.filter(entry => 
        entry.text.toLowerCase().includes(query)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, entries]);

  const renderSearchResults = () => {
    if (!searchQuery.trim() || searchResults.length === 0) return null;

    return (
      <View style={styles.searchResults}>
        <Text style={[styles.searchTitle, { color: colors.text }]}>
          Arama Sonuçları ({searchResults.length})
        </Text>
        {searchResults.map(entry => {
          const date = new Date(entry.date + 'T00:00:00').toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
          });

          return (
            <TouchableOpacity
              key={entry.id}
              style={[styles.entryCard, { backgroundColor: colors.surface }]}
              onPress={() => {
                setSelectedDate(entry.date);
                setSearchQuery('');
              }}
            >
              <View style={styles.entryHeader}>
                <Text style={[styles.entryDate, { color: colors.textMuted }]}>
                  {date}
                </Text>
                {entry.mood && (
                  <Text style={styles.entryMood}>{MOOD_EMOJIS[entry.mood]}</Text>
                )}
              </View>
              <Text
                style={[styles.entryPreview, { color: colors.text }]}
                numberOfLines={2}
              >
                {entry.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Girişlerde ara..."
          placeholderTextColor={colors.textSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {renderSearchResults()}

      {/* Calendar */}
      <View style={[styles.calendarCard, { backgroundColor: colors.surface }]}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => navigateMonth(-1)}>
            <Text style={[styles.navButton, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth(1)}>
            <Text style={[styles.navButton, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>
        </View>

        {renderCalendarDays()}
      </View>

      {/* Selected Date Entries */}
      {renderSelectedDateEntries()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  searchInput: {
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito Sans',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
    marginBottom: 12,
  },
  searchResults: {
    marginBottom: 16,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    fontSize: 24,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekdayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    fontWeight: '600',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
  entriesSection: {
    marginTop: 8,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
    marginBottom: 12,
  },
  noEntriesText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    textAlign: 'center',
    paddingVertical: 24,
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
  },
  entryTime: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
  },
  entryMood: {
    fontSize: 18,
  },
  entryPreview: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    lineHeight: 20,
  },
});
