// Streak Counter Component (US-005)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Flame } from 'lucide-react-native';
import { StreakInfo } from '../../services/statsService';

interface StreakCounterProps {
  streak: StreakInfo;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Flame size={24} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>
          Seri
        </Text>
      </View>
      
      <View style={styles.streaksRow}>
        <View style={styles.streakItem}>
          <Text style={[styles.streakValue, { color: colors.primary }]}>
            {streak.currentStreak}
          </Text>
          <Text style={[styles.streakLabel, { color: colors.textMuted }]}>
            Günlük
          </Text>
        </View>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <View style={styles.streakItem}>
          <Text style={[styles.streakValue, { color: colors.accent }]}>
            {streak.longestStreak}
          </Text>
          <Text style={[styles.streakLabel, { color: colors.textMuted }]}>
            En Uzun
          </Text>
        </View>
      </View>
      
      {streak.currentStreak > 0 && (
        <Text style={[styles.streakMessage, { color: colors.accent }]}>
          🔥 {streak.currentStreak} gün üst üste!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  streaksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakValue: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: 'Sora',
    fontVariant: ['tabular-nums'],
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 60,
  },
  streakMessage: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito Sans',
    textAlign: 'center',
    marginTop: 16,
  },
});
