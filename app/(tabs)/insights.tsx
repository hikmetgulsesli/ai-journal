// Insights Screen (US-005)
// AI Insights and Analytics Dashboard

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, STORAGE_KEYS } from '../../src/types';
import StreakCounter from '../../src/components/insights/StreakCounter';
import WritingStats from '../../src/components/insights/WritingStats';
import WeeklyMoodChart from '../../src/components/insights/WeeklyMoodChart';
import MonthlyMoodDistribution from '../../src/components/insights/MonthlyMoodDistribution';
import WeeklySummarySection from '../../src/components/insights/WeeklySummarySection';
import {
  calculateStreak,
  calculateWritingStats,
  getLast7DaysMood,
  getMonthlyMoodDistribution,
  StreakInfo,
  WritingStats as WritingStatsType,
  DailyMood,
} from '../../src/services/statsService';
import { MoodLevel } from '../../src/types';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState<StreakInfo>({ currentStreak: 0, longestStreak: 0 });
  const [writingStats, setWritingStats] = useState<WritingStatsType>({
    totalEntries: 0,
    totalWordCount: 0,
    averageWordsPerEntry: 0,
    thisMonthCount: 0,
    thisMonthWordCount: 0,
  });
  const [weeklyMood, setWeeklyMood] = useState<DailyMood[]>([]);
  const [monthlyDistribution, setMonthlyDistribution] = useState<Record<MoodLevel, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (entriesJson) {
        const allEntries: JournalEntry[] = JSON.parse(entriesJson);
        setEntries(allEntries);
        
        // Calculate streak
        setStreak(calculateStreak(allEntries));
        
        // Calculate writing stats
        setWritingStats(calculateWritingStats(allEntries));
        
        // Get weekly mood
        setWeeklyMood(getLast7DaysMood(allEntries));
        
        // Get monthly distribution
        setMonthlyDistribution(getMonthlyMoodDistribution(allEntries));
      }
    } catch (error) {
      console.error('Failed to load insights data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>
          İçgörüler
        </Text>
        
        {/* Streak Counter */}
        <StreakCounter streak={streak} />
        
        {/* Writing Statistics */}
        <WritingStats stats={writingStats} />
        
        {/* Weekly Mood Chart */}
        <WeeklyMoodChart data={weeklyMood} />
        
        {/* Monthly Mood Distribution */}
        <MonthlyMoodDistribution distribution={monthlyDistribution} />
        
        {/* Weekly Summary AI */}
        <WeeklySummarySection entries={entries} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Sora',
    marginBottom: 24,
  },
});
