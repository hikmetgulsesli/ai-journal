// Writing Statistics Component (US-005)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { FileText, Hash, Calendar, TrendingUp } from 'lucide-react-native';
import { WritingStats as WritingStatsType } from '../../services/statsService';

interface WritingStatsProps {
  stats: WritingStatsType;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.statItem}>
      {icon}
      <Text style={[styles.statValue, { color }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function WritingStats({ stats }: WritingStatsProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Yazma İstatistikleri
      </Text>
      
      <View style={styles.statsGrid}>
        <StatItem
          icon={<FileText size={20} color={colors.primary} />}
          label="Toplam Yazı"
          value={stats.totalEntries}
          color={colors.primary}
        />
        
        <StatItem
          icon={<Hash size={20} color={colors.secondary} />}
          label="Toplam Kelime"
          value={stats.totalWordCount.toLocaleString('tr-TR')}
          color={colors.secondary}
        />
        
        <StatItem
          icon={<TrendingUp size={20} color={colors.accent} />}
          label="Ort. Kelime/Yazı"
          value={stats.averageWordsPerEntry}
          color={colors.accent}
        />
        
        <StatItem
          icon={<Calendar size={20} color={colors.success} />}
          label="Bu Ay"
          value={stats.thisMonthCount}
          color={colors.success}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Sora',
    fontVariant: ['tabular-nums'],
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    marginTop: 4,
    textAlign: 'center',
  },
});
