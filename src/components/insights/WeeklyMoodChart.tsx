// Weekly Mood Chart Component (US-005)

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { MOOD_EMOJIS, MOOD_LABELS, MoodLevel } from '../../types';
import { DailyMood } from '../../services/statsService';

interface WeeklyMoodChartProps {
  data: DailyMood[];
}

const CHART_HEIGHT = 160;
const DOT_RADIUS = 6;

export default function WeeklyMoodChart({ data }: WeeklyMoodChartProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64; // Container padding
  
  const paddingLeft = 30;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = CHART_HEIGHT - paddingTop - paddingBottom;
  
  // Scale for mood (1-5)
  const getY = (mood: number | null) => {
    if (mood === null) return null;
    // Invert Y so 1 is at bottom, 5 is at top
    return paddingTop + innerHeight - ((mood - 1) / 4) * innerHeight;
  };
  
  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };
  
  // Create line path
  const pointsWithMood = data.map((d, i) => ({ ...d, x: getX(i), y: getY(d.mood) }));
  const validPoints = pointsWithMood.filter(p => p.y !== null);
  
  let pathData = '';
  if (validPoints.length > 0) {
    pathData = validPoints.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      return `L ${p.x} ${p.y}`;
    }).join(' ');
  }
  
  // Y-axis labels (mood emojis)
  const yLabels: MoodLevel[] = [5, 4, 3, 2, 1];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Haftalık Ruh Hali
      </Text>
      
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {/* Y-axis grid lines */}
        {yLabels.map((mood, i) => {
          const y = paddingTop + (i / 4) * innerHeight;
          return (
            <React.Fragment key={mood}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fontSize={14}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {MOOD_EMOJIS[mood]}
              </SvgText>
            </React.Fragment>
          );
        })}
        
        {/* Line path */}
        {pathData && (
          <Path
            d={pathData}
            fill="none"
            stroke={colors.primary}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Data points */}
        {pointsWithMood.map((point, i) => {
          if (point.y === null) return null;
          return (
            <React.Fragment key={point.date}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={DOT_RADIUS + 2}
                fill={colors.surface}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={DOT_RADIUS}
                fill={colors.mood[point.mood as MoodLevel]}
              />
            </React.Fragment>
          );
        })}
        
        {/* X-axis labels (days) */}
        {data.map((d, i) => (
          <SvgText
            key={d.date}
            x={getX(i)}
            y={CHART_HEIGHT - 10}
            fontSize={12}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {d.dayLabel}
          </SvgText>
        ))}
      </Svg>
      
      {/* Legend */}
      <View style={styles.legend}>
        {([1, 2, 3, 4, 5] as MoodLevel[]).map(mood => (
          <View key={mood} style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{MOOD_EMOJIS[mood]}</Text>
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              {MOOD_LABELS[mood]}
            </Text>
          </View>
        ))}
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
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 16,
  },
  legendLabel: {
    fontSize: 10,
    fontFamily: 'Nunito Sans',
    marginTop: 2,
  },
});
