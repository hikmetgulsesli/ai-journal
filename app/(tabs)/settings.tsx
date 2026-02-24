import { View, Text, StyleSheet, Pressable, Switch, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../../src/contexts/SettingsContext';
import { AIModel } from '../../src/types';
import { saveApiKeys, loadApiKeys } from '../../src/services/aiService';

type ThemeMode = 'dark' | 'light' | 'system';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { settings, setAiModel } = useSettings();
  const [notifications, setNotifications] = useState(true);
  
  // AI Settings
  const [selectedModel, setSelectedModel] = useState<AIModel>(settings.aiModel);
  const [minimaxKey, setMinimaxKey] = useState('');
  const [kimiKey, setKimikey] = useState('');
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    try {
      // Load notifications
      const notifJson = await AsyncStorage.getItem('@aijournal/settings/notifications');
      if (notifJson) {
        setNotifications(JSON.parse(notifJson));
      }
      
      // Load API keys
      const keys = await loadApiKeys();
      if (keys.minimax) setMinimaxKey(keys.minimax);
      if (keys.kimi) setKimikey(keys.kimi);
    } catch {
      console.error('Failed to load settings');
    }
  };

  const handleThemeChange = async (newTheme: ThemeMode) => {
    await setTheme(newTheme);
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    try {
      await AsyncStorage.setItem('@aijournal/settings/notifications', JSON.stringify(value));
    } catch {
      // Silent fail
    }
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Ayarlar</Text>

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema</Text>
          
          <Pressable 
            style={[styles.option, theme === 'dark' && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleThemeChange('dark')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>Karanlık</Text>
            {theme === 'dark' && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
          </Pressable>

          <Pressable 
            style={[styles.option, theme === 'light' && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleThemeChange('light')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>Aydınlık</Text>
            {theme === 'light' && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
          </Pressable>

          <Pressable 
            style={[styles.option, theme === 'system' && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleThemeChange('system')}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>Sistem</Text>
            {theme === 'system' && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
          </Pressable>
        </View>

        {/* AI Model Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Model</Text>
          
          <Pressable 
            style={[styles.option, selectedModel === 'minimax' && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleModelChange('minimax')}
          >
            <View>
              <Text style={[styles.optionText, { color: colors.text }]}>MiniMax M2.5</Text>
              <Text style={[styles.optionSubtext, { color: colors.textMuted }]}>
                Daha hızlı yanıtlar
              </Text>
            </View>
            {selectedModel === 'minimax' && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
          </Pressable>

          <Pressable 
            style={[styles.option, selectedModel === 'kimi' && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => handleModelChange('kimi')}
          >
            <View>
              <Text style={[styles.optionText, { color: colors.text }]}>Kimi</Text>
              <Text style={[styles.optionSubtext, { color: colors.textMuted }]}>
                Moonshot AI'nin son modeli
              </Text>
            </View>
            {selectedModel === 'kimi' && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
          </Pressable>
        </View>

        {/* API Keys Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Pressable 
            style={styles.sectionHeader}
            onPress={() => setShowApiKeys(!showApiKeys)}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>API Anahtarları</Text>
            <Text style={[styles.toggleIcon, { color: colors.textMuted }]}>
              {showApiKeys ? '▼' : '▶'}
            </Text>
          </Pressable>
          
          {showApiKeys && (
            <View style={styles.apiKeysContent}>
              <Text style={[styles.apiInfo, { color: colors.textMuted }]}>
                API anahtarlarınız güvenli bir şekilde cihazınızda saklanır.
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>MiniMax API Key</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
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
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
                  placeholder="Kimi API anahtarınızı girin"
                  placeholderTextColor={colors.textSubtle}
                  value={kimiKey}
                  onChangeText={setKimikey}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Pressable
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveApiKeys}
              >
                <Text style={styles.saveButtonText}>API Anahtarlarını Kaydet</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bildirimler</Text>
          
          <View style={styles.option}>
            <Text style={[styles.optionText, { color: colors.text }]}>Hatırlatmalar</Text>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hakkında</Text>
          
          <View style={styles.option}>
            <Text style={[styles.optionText, { color: colors.textMuted }]}>Versiyon</Text>
            <Text style={[styles.valueText, { color: colors.textMuted }]}>1.0.0</Text>
          </View>

          <Pressable style={styles.option} onPress={() => {}}>
            <Text style={[styles.optionText, { color: colors.text }]}>Gizlilik Politikası</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={() => {}}>
            <Text style={[styles.optionText, { color: colors.text }]}>Kullanım Şartları</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 16,
    paddingBottom: 8,
  },
  toggleIcon: {
    fontSize: 12,
    paddingRight: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  optionText: {
    fontSize: 16,
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  valueText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
  },
  apiKeysContent: {
    padding: 16,
    paddingTop: 0,
  },
  apiInfo: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
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
  },
});
