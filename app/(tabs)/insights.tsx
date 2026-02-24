import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry } from '../../src/types';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    totalEntries: 0,
    averageMood: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem('@aijournal/entries');
      if (entriesJson) {
        const entries: JournalEntry[] = JSON.parse(entriesJson);
        
        // Calculate average mood
        const moods = entries.filter(e => e.mood).map(e => e.mood as number);
        const avgMood = moods.length > 0 
          ? moods.reduce((a, b) => a + b, 0) / moods.length 
          : 0;

        // Calculate streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          if (entries.some(e => e.date === dateStr)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }

        setStats({
          totalEntries: entries.length,
          averageMood: Math.round(avgMood * 10) / 10,
          currentStreak: streak,
        });
      }
    } catch {
      // Silent fail
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>İçgörüler</Text>
      
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Toplam Yazı</Text>
        <Text style={[styles.cardValue, { color: colors.primary }]}>{stats.totalEntries}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Ortalama Ruh Hali</Text>
        <Text style={[styles.cardValue, { color: colors.primary }]}>{stats.averageMood || '-'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Günlük Seri</Text>
        <Text style={[styles.cardValue, { color: colors.primary }]}>{stats.currentStreak} gün</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
  },
});
