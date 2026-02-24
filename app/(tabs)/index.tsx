import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { JournalEntry, MoodLevel, MOOD_EMOJIS, MOOD_LABELS } from '../../src/types';
import { STORAGE_KEYS } from '../../src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { generatePrompt, generateReflection, getContextualPrompt } from '../../src/services/aiService';

function formatDateTR(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  };
  return date.toLocaleDateString('tr-TR', options);
}

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const [entryText, setEntryText] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodLevel | undefined>();
  const [todayEntries, setTodayEntries] = useState<JournalEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  
  // AI Reflection State
  const [reflectionEntryId, setReflectionEntryId] = useState<string | null>(null);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);

  const today = new Date();
  const dateString = formatDateTR(today);
  const todayISO = getTodayDateString();

  // Load today's entries on mount
  useEffect(() => {
    loadTodayEntries();
  }, []);

  const loadTodayEntries = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (entriesJson) {
        const allEntries: JournalEntry[] = JSON.parse(entriesJson);
        const todayEntriesList = allEntries
          .filter(entry => entry.date === todayISO)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTodayEntries(todayEntriesList);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    setPromptError(null);
    
    try {
      const result = await generatePrompt();
      
      if (result.success && result.data) {
        setAiPrompt(result.data);
      } else {
        // Fallback to contextual prompt if API fails
        const fallbackPrompt = getContextualPrompt();
        setAiPrompt(fallbackPrompt);
        if (result.error) {
          setPromptError(result.error);
        }
      }
    } catch {
      const fallbackPrompt = getContextualPrompt();
      setAiPrompt(fallbackPrompt);
      setPromptError('Bir hata oluştu, varsayılan soru kullanılıyor.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateReflection = async (entry: JournalEntry) => {
    setIsGeneratingReflection(true);
    setReflectionEntryId(entry.id);
    
    try {
      const result = await generateReflection(entry.text);
      
      if (result.success && result.data) {
        // Update the entry with AI response
        const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
        if (entriesJson) {
          const allEntries: JournalEntry[] = JSON.parse(entriesJson);
          const updatedEntries = allEntries.map(e => 
            e.id === entry.id ? { ...e, aiResponse: result.data } : e
          );
          await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updatedEntries));
          await loadTodayEntries();
        }
      } else {
        Alert.alert(
          'AI Yorumu',
          result.error || 'Yorum oluşturulamadı. Lütfen API anahtarlarınızı kontrol edin.'
        );
      }
    } catch {
      Alert.alert('Hata', 'Yorum oluşturulurken bir hata oluştu.');
    } finally {
      setIsGeneratingReflection(false);
      setReflectionEntryId(null);
    }
  };

  const saveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir şeyler yazın!');
      return;
    }

    setIsSaving(true);
    try {
      const wordCount = countWords(entryText);
      const newEntry: JournalEntry = {
        id: uuidv4(),
        text: entryText.trim(),
        date: todayISO,
        createdAt: new Date().toISOString(),
        mood: selectedMood,
        wordCount,
        aiPrompt: aiPrompt || undefined,
      };

      // Load existing entries
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const allEntries: JournalEntry[] = entriesJson ? JSON.parse(entriesJson) : [];
      
      // Add new entry
      allEntries.push(newEntry);
      
      // Save back
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(allEntries));
      
      // Clear form
      setEntryText('');
      setSelectedMood(undefined);
      setAiPrompt(null);
      setPromptError(null);
      
      // Reload entries
      await loadTodayEntries();
      
      Alert.alert('Başarılı', 'Günlük kaydedildi!');
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Hata', 'Günlük kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    Alert.alert(
      'Silme Onayı',
      'Bu günlük girdisini silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
              if (entriesJson) {
                const allEntries: JournalEntry[] = JSON.parse(entriesJson);
                const filtered = allEntries.filter(e => e.id !== entryId);
                await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered));
                await loadTodayEntries();
              }
            } catch (error) {
              console.error('Failed to delete entry:', error);
            }
          },
        },
      ]
    );
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSelector}>
      {([1, 2, 3, 4, 5] as MoodLevel[]).map(mood => (
        <TouchableOpacity
          key={mood}
          onPress={() => setSelectedMood(mood)}
          style={[
            styles.moodButton,
            selectedMood === mood && {
              backgroundColor: colors.mood[mood],
            },
          ]}
        >
          <Text style={styles.moodEmoji}>{MOOD_EMOJIS[mood]}</Text>
          <Text
            style={[
              styles.moodLabel,
              { color: selectedMood === mood ? '#fff' : colors.textMuted },
            ]}
          >
            {MOOD_LABELS[mood]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPromptCard = () => {
    if (!aiPrompt && !isGeneratingPrompt) return null;
    
    return (
      <View style={[styles.promptCard, { backgroundColor: colors.primary + '20' }]}>
        <View style={styles.promptHeader}>
          <Text style={[styles.promptTitle, { color: colors.primary }]}>
            AI Soru
          </Text>
          <TouchableOpacity onPress={() => setAiPrompt(null)}>
            <Text style={[styles.promptClose, { color: colors.textMuted }]}>
              Kapat
            </Text>
          </TouchableOpacity>
        </View>
        {isGeneratingPrompt ? (
          <View style={styles.promptLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.promptLoadingText, { color: colors.textMuted }]}>
              Soru oluşturuluyor...
            </Text>
          </View>
        ) : (
          <Text style={[styles.promptText, { color: colors.text }]}>
            {aiPrompt}
          </Text>
        )}
        {promptError && (
          <Text style={[styles.promptError, { color: colors.error }]}>
            {promptError}
          </Text>
        )}
      </View>
    );
  };

  const renderReflectionCard = (entry: JournalEntry) => {
    if (!entry.aiResponse) return null;
    
    return (
      <View style={[styles.reflectionCard, { backgroundColor: colors.secondary + '15' }]}>
        <Text style={[styles.reflectionTitle, { color: colors.secondary }]}>
          AI Yorumu
        </Text>
        <Text style={[styles.reflectionText, { color: colors.text }]}>
          {entry.aiResponse}
        </Text>
      </View>
    );
  };

  const renderEntryCard = (entry: JournalEntry) => {
    const time = new Date(entry.createdAt).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
    <TouchableOpacity
      key={entry.id}
      style={[styles.entryCard, { backgroundColor: colors.surface }]}
      onLongPress={() => deleteEntry(entry.id)}
    >
      <View style={styles.entryHeader}>
          <Text style={[styles.entryTime, { color: colors.textMuted }]}>
            {time}
          </Text>
          {entry.mood && (
            <Text style={styles.entryMood}>{MOOD_EMOJIS[entry.mood]}</Text>
          )}
        </View>
        
        {entry.aiPrompt && (
          <View style={[styles.entryPromptBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.entryPromptText, { color: colors.primary }]}>
              Soru: {entry.aiPrompt}
            </Text>
          </View>
        )}
        
        <Text
          style={[styles.entryPreview, { color: colors.text }]}
          numberOfLines={2}
        >
          {entry.text}
        </Text>
        
        {renderReflectionCard(entry)}
        
        {entry.wordCount >= 50 && !entry.aiResponse && (
          <TouchableOpacity
            style={[styles.reflectionButton, { backgroundColor: colors.secondary }]}
            onPress={() => handleGenerateReflection(entry)}
            disabled={isGeneratingReflection && reflectionEntryId === entry.id}
          >
            {isGeneratingReflection && reflectionEntryId === entry.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.reflectionButtonText}>AI Yorumu Al</Text>
            )}
          </TouchableOpacity>
        )}
        
        <Text style={[styles.wordCount, { color: colors.textSubtle }]}>
          {entry.wordCount} kelime
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Date Header */}
        <Text style={[styles.dateHeader, { color: colors.text }]}>
          {dateString}
        </Text>

        {/* Mood Summary */}
        {todayEntries.length > 0 && (
          <View style={[styles.moodSummary, { backgroundColor: colors.surface }]}>
            <Text style={[styles.moodSummaryText, { color: colors.text }]}>
              Bugün {todayEntries.length} giriş yazdın
              {todayEntries.some(e => e.mood) && (
                <Text style={{ color: colors.primary }}>
                  {' '}({MOOD_EMOJIS[todayEntries[0].mood!]})
                </Text>
              )}
            </Text>
          </View>
        )}

        {/* AI Prompt Button */}
        <TouchableOpacity
          style={[styles.aiPromptButton, { borderColor: colors.primary }]}
          onPress={handleGeneratePrompt}
          disabled={isGeneratingPrompt}
        >
          {isGeneratingPrompt ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.aiPromptButtonText, { color: colors.primary }]}>
              Bana bir soru sor
            </Text>
          )}
        </TouchableOpacity>

        {/* AI Prompt Card */}
        {renderPromptCard()}

        {/* Journal Editor */}
        <View style={[styles.editorCard, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Bugün neler yaşadın?"
            placeholderTextColor={colors.textSubtle}
            multiline
            value={entryText}
            onChangeText={setEntryText}
            textAlignVertical="top"
          />

          {/* Mood Selector */}
          {renderMoodSelector()}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={saveEntry}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Entries */}
        {todayEntries.length > 0 ? (
          <View style={styles.entriesList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Bugünkü Girişler
            </Text>
            {todayEntries.map(renderEntryCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyEmoji]}>📝</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Bugün bir şeyler yazmaya ne dersin?
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Sora',
    marginBottom: 16,
  },
  moodSummary: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  moodSummaryText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
  },
  aiPromptButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  aiPromptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  promptCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  promptClose: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
  },
  promptText: {
    fontSize: 16,
    fontFamily: 'Nunito Sans',
    lineHeight: 24,
  },
  promptLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptLoadingText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
  },
  promptError: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    marginTop: 8,
  },
  editorCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  textInput: {
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito Sans',
    marginBottom: 16,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    fontFamily: 'Nunito Sans',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  entriesList: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sora',
    marginBottom: 12,
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
  entryTime: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
  },
  entryMood: {
    fontSize: 18,
  },
  entryPromptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  entryPromptText: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
  },
  entryPreview: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    lineHeight: 20,
    marginBottom: 8,
  },
  reflectionCard: {
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  reflectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Sora',
    marginBottom: 6,
  },
  reflectionText: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  reflectionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  reflectionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  wordCount: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito Sans',
    textAlign: 'center',
  },
});
