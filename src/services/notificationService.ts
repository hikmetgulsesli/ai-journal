// Notification Service (US-007)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_MESSAGES = [
  'Bugün nasıl geçti? Günlüğüne yaz ✍️',
  'Düşüncelerini yazmaya ne dersin? 📝',
  'Günün nasıldı? Birkaç satır yaz 💭',
  'Kendine biraz zaman ayır, günlüğünü yaz 🌙',
  'Bugünü birkaç cümleyle anlat ✨',
  'Bugün neler hissettin? Yaz, rahatla 🧘',
  'Bir günün daha bitti. Düşüncelerini kaydet 📖',
  'Günlük yazmak için harika bir zaman! 🌟',
];

const NOTIFICATION_ID_KEY = '@aijournal/notification_id';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getRandomMessage(): string {
  const idx = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  return NOTIFICATION_MESSAGES[idx];
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') {
    return true;
  }
  
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }
    
    // Cancel existing reminder first
    await cancelDailyReminder();
    
    // Schedule new daily notification
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'AI Günlük',
        body: getRandomMessage(),
        data: { screen: 'index' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    
    // Save the notification ID
    await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
    
    return id;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    const existingId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

export async function isReminderScheduled(): Promise<boolean> {
  try {
    const existingId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (!existingId) return false;
    
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some(n => n.identifier === existingId);
  } catch {
    return false;
  }
}
