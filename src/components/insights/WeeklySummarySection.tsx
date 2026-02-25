// Weekly Summary Component (US-005)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { WeeklySummary, getWeeklySummaries, saveWeeklySummary, getCurrentWeekIdentifier, hasSummaryForWeek, getWeekRange, formatWeekRange } from '../../services/statsService';
import { JournalEntry } from '../../types';
import { generateWeeklySummary } from '../../services/aiService';
import { FileText, Plus } from 'lucide-react-native';

interface WeeklySummarySectionProps {
  entries: JournalEntry[];
}

export default function WeeklySummarySection({ entries }: WeeklySummarySectionProps) {
  const { colors } = useTheme();
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentWeekHasSummary, setCurrentWeekHasSummary] = useState(false);
  
  useEffect(() => {
    loadSummaries();
  }, []);
  
  const loadSummaries = async () => {
    setIsLoading(true);
    try {
      const data = await getWeeklySummaries();
      setSummaries(data);
      
      const currentWeek = getCurrentWeekIdentifier();
      const hasCurrent = await hasSummaryForWeek(currentWeek);
      setCurrentWeekHasSummary(hasCurrent);
    } catch (error) {
      console.error('Failed to load summaries:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateSummary = async () => {
    if (currentWeekHasSummary) {
      Alert.alert(
        'Özet Var',
        'Bu hafta için zaten bir özet oluşturulmuş. Yeni bir özet oluşturmak ister misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Oluştur', onPress: async () => await generateNewSummary() },
        ]
      );
      return;
    }
    
    await generateNewSummary();
  };
  
  const generateNewSummary = async () => {
    setIsGenerating(true);
    try {
      const currentWeek = getCurrentWeekIdentifier();
      const { start, end } = getWeekRange(currentWeek);
      
      // Get entries for current week
      const weekEntries = entries.filter(e => {
        return e.date >= start.toISOString().split('T')[0] && 
               e.date <= end.toISOString().split('T')[0];
      });
      
      if (weekEntries.length === 0) {
        Alert.alert('Bilgi', 'Bu hafta için henüz yazı bulunmuyor.');
        return;
      }
      
      // Generate AI summary
      const result = await generateWeeklySummary(weekEntries);
      
      if (result.success && result.data) {
        const newSummary: WeeklySummary = {
          id: Date.now().toString(),
          weekStart: currentWeek,
          weekEnd: end.toISOString().split('T')[0],
          summary: result.data,
          createdAt: new Date().toISOString(),
        };
        
        await saveWeeklySummary(newSummary);
        await loadSummaries();
        
        Alert.alert('Başarılı', 'Haftalık özet oluşturuldu!');
      } else {
        Alert.alert('Hata', result.error || 'Özet oluşturulamadı.');
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      Alert.alert('Hata', 'Özet oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const renderSummaryCard = (summary: WeeklySummary) => {
    const weekRange = formatWeekRange(summary.weekStart, summary.weekEnd);
    const isCurrentWeek = summary.weekStart === getCurrentWeekIdentifier();
    
    return (
      <View 
        key={summary.id} 
        style={[styles.summaryCard, { backgroundColor: colors.surfaceAlt }]}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.summaryMeta}>
            <FileText size={16} color={colors.primary} />
            <Text style={[styles.weekRange, { color: colors.text }]}>
              {weekRange}
            </Text>
          </View>
          {isCurrentWeek && (
            <View style={[styles.currentBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.currentBadgeText, { color: colors.primary }]}>
                Bu Hafta
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.summaryText, { color: colors.text }]}>
          {summary.summary}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          AI Haftalık Özet
        </Text>
        
        <TouchableOpacity
          style={[
            styles.generateButton, 
            { backgroundColor: colors.primary },
            isGenerating && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateSummary}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Plus size={18} color="#fff" />
              <Text style={styles.generateButtonText}>
                Haftalık Özet Al
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : summaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Henüz hiç haftalık özet oluşturulmamış
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSubtle }]}>
            "Haftalık Özet Al" butonuna tıklayarak başlayabilirsin
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.summariesList}
          showsVerticalScrollIndicator={false}
        >
          {summaries.map(renderSummaryCard)}
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    textAlign: 'center',
    marginTop: 8,
  },
  summariesList: {
    maxHeight: 300,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekRange: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Nunito Sans',
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    lineHeight: 22,
  },
});
