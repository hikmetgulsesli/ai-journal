// Settings Context - manages app settings including AI configuration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, AIModel, DEFAULT_SETTINGS, STORAGE_KEYS } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  isLoaded: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setAiModel: (model: AIModel) => Promise<void>;
  setReminderSettings: (enabled: boolean, hour: number, minute: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        const loadedSettings = JSON.parse(settingsJson);
        setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const setAiModel = async (model: AIModel) => {
    await updateSettings({ aiModel: model });
  };

  const setReminderSettings = async (enabled: boolean, hour: number, minute: number) => {
    await updateSettings({
      reminderEnabled: enabled,
      reminderHour: hour,
      reminderMinute: minute,
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, updateSettings, setAiModel, setReminderSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
