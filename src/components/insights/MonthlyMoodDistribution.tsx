// Monthly Mood Distribution Chart (US-005)

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { MoodLevel, MOOD_EMOJIS } from '../../types';

interface MonthlyMoodDistributionProps {
  distribution: Record<MoodLevel, number>;
}

const CHART_HEIGHT = 120;

export default function MonthlyMoodDistribution({ distribution }: MonthlyMoodDistributionProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  
  // Calculate bar widths and positions
  const moodLevels: MoodLevel[] = [5, 4, 3, 2, 1];
  const barGap = 8;
  const totalGap = barGap * (moodLevels.length - 1);
  const barWidth = (chartWidth - totalGap) / moodLevels.length;
  const maxBarHeight = CHART_HEIGHT - 60; // Leave room for labels
  
  const maxCount = Math.max(...Object.values(distribution), 1);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Aylık Ruh Hali Dağılımı
      </Text>
      
      {total === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Bu ay henüz ruh hali kaydedilmedi
          </Text>
        </View>
      ) : (
        <>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {moodLevels.map((mood, index) => {
              const count = distribution[mood];
              const barHeight = (count / maxCount) * maxBarHeight;
              const x = index * (barWidth + barGap);
              const y = maxBarHeight - barHeight + 20;
              
              return (
                <G key={mood}>
                  {/* Bar */}
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, 4)}
                    rx={6}
                    fill={colors.mood[mood]}
                  />
                  
                  {/* Count on top of bar */}
                  {count > 0 && (
                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 6}
                      fontSize={12}
                      fontWeight="600"
                      fill={colors.text}
                      textAnchor="middle"
                    >
                      {count}
                    </SvgText>
                  )}
                  
                  {/* Emoji label */}
                  <SvgText
                    x={x + barWidth / 2}
                    y={CHART_HEIGHT - 5}
                    fontSize={16}
                    textAnchor="middle"
                  >
                    {MOOD_EMOJIS[mood]}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
          
          {/* Summary */}
          <Text style={[styles.summary, { color: colors.textMuted }]}>
            Toplam: {total} kayıt
          </Text>
        </>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
    marginBottom: 16,
  },
  emptyState: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
  },
  summary: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    textAlign: 'center',
    marginTop: 8,
  },
});
