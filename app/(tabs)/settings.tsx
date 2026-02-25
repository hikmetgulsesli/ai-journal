// Settings Screen (US-007 + US-008)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../../src/contexts/SettingsContext';
import { AIModel, JournalEntry, STORAGE_KEYS } from '../../src/types';
import { saveApiKeys, loadApiKeys, testConnection } from '../../src/services/aiService';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  requestNotificationPermission,
} from '../../src/services/notificationService';
import { ChevronDown, ChevronRight, Wifi, Download, Trash2, Clock } from 'lucide-react-native';

type ThemeMode = 'dark' | 'light' | 'system';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { settings, setAiModel, setReminderSettings } = useSettings();

  // AI Settings
  const [selectedModel, setSelectedModel] = useState<AIModel>(settings.aiModel);
  const [minimaxKey, setMinimaxKey] = useState('');
  const [kimiKey, setKimiKey] = useState('');
  const [minimaxBaseUrl, setMinimaxBaseUrl] = useState(settings.minimaxBaseUrl);
  const [kimiBaseUrl, setKimiBaseUrl] = useState(settings.kimiBaseUrl);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Notification Settings
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderHour, setReminderHour] = useState(settings.reminderHour);
  const [reminderMinute, setReminderMinute] = useState(settings.reminderMinute);

  // Data Stats
  const [entryCount, setEntryCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSavedSettings();
    loadDataStats();
  }, []);

  const loadSavedSettings = async () => {
    try {
      const keys = await loadApiKeys();
      if (keys.minimax) setMinimaxKey(keys.minimax);
      if (keys.kimi) setKimiKey(keys.kimi);
    } catch {
      console.error('Failed to load settings');
    }
  };

  const loadDataStats = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (entriesJson) {
        const entries: JournalEntry[] = JSON.parse(entriesJson);
        setEntryCount(entries.length);
        setTotalWords(entries.reduce((sum, e) => sum + e.wordCount, 0));
      }
    } catch {
      // Silent
    }
  };

  const handleThemeChange = async (newTheme: ThemeMode) => {
    await setTheme(newTheme);
  };

  const handleModelChange = async (model: AIModel) => {
    setSelectedModel(model);
    await setAiModel(model);
  };

  const handleSaveApiKeys = async () => {
    try {
      await saveApiKeys(minimaxKey || undefined, kimiKey || undefined);
      Alert.alert('Başarılı', 'API anahtarları kaydedildi!');
    } catch {
      Alert.alert('Hata', 'API anahtarları kaydedilemedi.');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testConnection();
      if (result.success) {
        Alert.alert('Başarılı', 'AI bağlantısı çalışıyor!');
      } else {
        Alert.alert('Bağlantı Hatası', result.error || 'Bağlantı kurulamadı. API anahtarınızı kontrol edin.');
      }
    } catch {
      Alert.alert('Hata', 'Bağlantı testi sırasında bir hata oluştu.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert(
          'İzin Gerekli',
          'Hatırlatma bildirimleri göndermek için bildirim izni gereklidir. Lütfen ayarlardan izin verin.'
        );
        return;
      }
      await scheduleDailyReminder(reminderHour, reminderMinute);
    } else {
      await cancelDailyReminder();
    }
    setReminderEnabled(value);
    await setReminderSettings(value, reminderHour, reminderMinute);
  };

  const handleHourChange = (text: string) => {
    const num = parseInt(text, 10);
    if (isNaN(num)) {
      setReminderHour(0);
      return;
    }
    const clamped = Math.min(23, Math.max(0, num));
    setReminderHour(clamped);
  };

  const handleMinuteChange = (text: string) => {
    const num = parseInt(text, 10);
    if (isNaN(num)) {
      setReminderMinute(0);
      return;
    }
    const clamped = Math.min(59, Math.max(0, num));
    setReminderMinute(clamped);
  };

  const handleSaveReminderTime = async () => {
    await setReminderSettings(reminderEnabled, reminderHour, reminderMinute);
    if (reminderEnabled) {
      await scheduleDailyReminder(reminderHour, reminderMinute);
    }
    const timeStr = String(reminderHour).padStart(2, '0') + ':' + String(reminderMinute).padStart(2, '0');
    Alert.alert('Başarılı', 'Hatırlatma saati ' + timeStr + ' olarak ayarlandı.');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const entries = entriesJson ? JSON.parse(entriesJson) : [];

      const exportData = {
        appName: 'AI Günlük',
        exportDate: new Date().toISOString(),
        entryCount: entries.length,
        entries,
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      await Share.share({
        message: jsonString,
        title: 'AI Günlük Verileri',
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Hata', 'Veriler dışa aktarılırken bir hata oluştu.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Tüm Verileri Sil',
      entryCount + ' günlük girişi ve tüm ayarlar kalıcı olarak silinecek. Bu işlem geri alınamaz!',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tümünü Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.ENTRIES),
                AsyncStorage.removeItem(STORAGE_KEYS.API_KEYS),
                AsyncStorage.removeItem('@aijournal/weekly_summaries'),
              ]);
              await cancelDailyReminder();
              setEntryCount(0);
              setTotalWords(0);
              Alert.alert('Silindi', 'Tüm veriler başarıyla silindi.');
            } catch {
              Alert.alert('Hata', 'Veriler silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Görünüm</Text>

          {(['dark', 'light', 'system'] as ThemeMode[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.option, theme === t && { backgroundColor: colors.surfaceAlt }]}
              onPress={() => handleThemeChange(t)}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                {t === 'dark' ? 'Karanlık' : t === 'light' ? 'Aydınlık' : 'Sistem'}
              </Text>
              {theme === t && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>{'✓'}</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* AI Model Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Ayarları</Text>

          <Pressable
            style={[styles.option, selectedModel === 'minimax' && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleModelChange('minimax')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionText, { color: colors.text }]}>MiniMax M2.5</Text>
              <Text style={[styles.optionSubtext, { color: colors.textMuted }]}>Daha hızlı yanıtlar</Text>
            </View>
            {selectedModel === 'minimax' && (
              <Text style={[styles.checkmark, { color: colors.primary }]}>{'✓'}</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.option, selectedModel === 'kimi' && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleModelChange('kimi')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionText, { color: colors.text }]}>Kimi</Text>
              <Text style={[styles.optionSubtext, { color: colors.textMuted }]}>Moonshot AI modeli</Text>
            </View>
            {selectedModel === 'kimi' && (
              <Text style={[styles.checkmark, { color: colors.primary }]}>{'✓'}</Text>
            )}
          </Pressable>

          {/* Test Connection */}
          <Pressable
            style={[styles.testButton, { borderColor: colors.primary }]}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Wifi size={16} color={colors.primary} />
                <Text style={[styles.testButtonText, { color: colors.primary }]}>
                  Bağlantıyı Test Et
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* API Keys Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Pressable style={styles.sectionHeader} onPress={() => setShowApiKeys(!showApiKeys)}>
            <Text style={[styles.sectionTitleInline, { color: colors.text }]}>
              API Anahtarları
            </Text>
            {showApiKeys ? (
              <ChevronDown size={18} color={colors.textMuted} />
            ) : (
              <ChevronRight size={18} color={colors.textMuted} />
            )}
          </Pressable>

          {showApiKeys && (
            <View style={styles.apiKeysContent}>
              <Text style={[styles.apiInfo, { color: colors.textMuted }]}>
                API anahtarlarınız güvenli bir şekilde cihazınızda saklanır.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>MiniMax API Key</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="MiniMax API anahtarınızı girin"
                  placeholderTextColor={colors.textSubtle}
                  value={minimaxKey}
                  onChangeText={setMinimaxKey}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Kimi API Key</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Kimi API anahtarınızı girin"
                  placeholderTextColor={colors.textSubtle}
                  value={kimiKey}
                  onChangeText={setKimiKey}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Advanced: Base URLs */}
              <Pressable
                style={styles.advancedToggle}
                onPress={() => setShowAdvancedApi(!showAdvancedApi)}
              >
                <Text style={[styles.advancedToggleText, { color: colors.textMuted }]}>
                  Gelişmiş Ayarlar
                </Text>
                {showAdvancedApi ? (
                  <ChevronDown size={14} color={colors.textMuted} />
                ) : (
                  <ChevronRight size={14} color={colors.textMuted} />
                )}
              </Pressable>

              {showAdvancedApi && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>MiniMax Base URL</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={minimaxBaseUrl}
                      onChangeText={setMinimaxBaseUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Kimi Base URL</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={kimiBaseUrl}
                      onChangeText={setKimiBaseUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </>
              )}

              <Pressable
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveApiKeys}
              >
                <Text style={styles.saveButtonText}>API Anahtarlarıni Kaydet</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bildirimler</Text>

          <View style={styles.option}>
            <Text style={[styles.optionText, { color: colors.text }]}>Günlük Hatırlatma</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {reminderEnabled && (
            <View style={styles.timePickerRow}>
              <View style={styles.timePickerLabel}>
                <Clock size={16} color={colors.textMuted} />
                <Text style={[styles.optionText, { color: colors.text, marginLeft: 8 }]}>
                  Hatırlatma Saati
                </Text>
              </View>
              <View style={styles.timeInputs}>
                <TextInput
                  style={[styles.timeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={String(reminderHour).padStart(2, '0')}
                  onChangeText={handleHourChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
                <TextInput
                  style={[styles.timeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={String(reminderMinute).padStart(2, '0')}
                  onChangeText={handleMinuteChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Pressable
                  style={[styles.timeSetButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveReminderTime}
                >
                  <Text style={styles.timeSetButtonText}>Ayarla</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Data Management Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Veri Yönetimi</Text>

          <View style={styles.dataStats}>
            <View style={styles.dataStat}>
              <Text style={[styles.dataStatValue, { color: colors.primary }]}>{entryCount}</Text>
              <Text style={[styles.dataStatLabel, { color: colors.textMuted }]}>Toplam Giriş</Text>
            </View>
            <View style={[styles.dataStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.dataStat}>
              <Text style={[styles.dataStatValue, { color: colors.primary }]}>
                {totalWords.toLocaleString('tr-TR')}
              </Text>
              <Text style={[styles.dataStatLabel, { color: colors.textMuted }]}>Toplam Kelime</Text>
            </View>
          </View>

          <Pressable
            style={[styles.dataButton, { borderColor: colors.primary }]}
            onPress={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Download size={18} color={colors.primary} />
                <Text style={[styles.dataButtonText, { color: colors.primary }]}>
                  Verileri Dışa Aktar (JSON)
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.dataButton, { borderColor: colors.error }]}
            onPress={handleDeleteAllData}
          >
            <Trash2 size={18} color={colors.error} />
            <Text style={[styles.dataButtonText, { color: colors.error }]}>
              Tüm Verileri Sil
            </Text>
          </Pressable>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hakkında</Text>

          <View style={styles.option}>
            <Text style={[styles.optionText, { color: colors.textMuted }]}>Versiyon</Text>
            <Text style={[styles.valueText, { color: colors.textMuted }]}>1.0.0</Text>
          </View>

          <View style={styles.option}>
            <Text style={[styles.optionText, { color: colors.textMuted }]}>AI Günlük</Text>
            <Text style={[styles.valueText, { color: colors.textSubtle }]}>setrox</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitleInline: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Nunito Sans',
  },
  optionSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    marginTop: 2,
  },
  valueText: {
    fontSize: 16,
    fontFamily: 'Nunito Sans',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  apiKeysContent: {
    padding: 16,
    paddingTop: 0,
  },
  apiInfo: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Nunito Sans',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Nunito Sans',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 4,
  },
  advancedToggleText: {
    fontSize: 13,
    fontFamily: 'Nunito Sans',
  },
  saveButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  timePickerRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timePickerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 52,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
  },
  timeSetButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timeSetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
  dataStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dataStat: {
    alignItems: 'center',
    flex: 1,
  },
  dataStatValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Sora',
    fontVariant: ['tabular-nums'],
  },
  dataStatLabel: {
    fontSize: 12,
    fontFamily: 'Nunito Sans',
    marginTop: 4,
  },
  dataStatDivider: {
    width: 1,
    height: 40,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  dataButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sora',
  },
});
