// AI Service for MiniMax and Kimi API integration
import { AIModel, AppSettings, STORAGE_KEYS, DEFAULT_SETTINGS } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYSTEM_PROMPT = `Sen empatik ve destekleyici bir günlük asistanısın. Kullanıcının duygularını anlayarak kısa, anlamlı ve düşündürücü yorumlar yaparsın. Türkçe yanıt ver. Yanıtların 2-3 cümle olsun.`;

const PROMPT_GENERATION_PROMPT = `Sen empatik bir günlük asistanısın. Kullanıcıya Türkçe olarak düşünmeye teşvik edecek, derin ve anlamlı bir günlük sorusu sor. Soru kısa, açık ve kişisel olsun. Sadece soruyu yaz, başka bir şey yazma.`;

const WEEKLY_SUMMARY_PROMPT = `Sen empatik ve akıllı bir günlük asistanısın. Aşağıdaki günlük yazılarını oku ve geçen haftanın genel bir özetini Türkçe olarak yaz. Özet şunları içersin:
1. Haftanın genel ruh hali ve duygusal akışı
2. Öne çıkan temalar veya konular
3. Pozitif gelişmeler veya başarılar
4. Zorluklar ve nasıl başa çıkıldığı
5. Gelecek hafta için öneriler

Özet 4-6 paragraf olsun, samimi ve destekleyici bir ton kullan.`;

const WEEKLY_SUMMARY_SYSTEM = `Sen kullanıcının duygusal wellness koçusun. Haftalık özetlerini yazarken pozitif, motive edici ve empatik bir dil kullan. Kullanıcının gelişimini vurgula.`;

// Turkish journal prompt suggestions for variety
const CONTEXTUAL_PROMPTS = [
  "Bugün seni en çok ne düşündürdü?",
  "Hayatında bir şeyi değiştirebileceğini bilsen neyi değiştirirdin?",
  "Bu hafta sana ne ilham verdi?",
  "Kendini en mutlu hissettiğin anı düşünürsen, o an nasıl hissediyordun?",
  "Bugün bir şeylerden memnun kaldın mı?",
  "Gelecekteki sana bir mesaj bırakmak istesen ne yazardın?",
  "Bugün bir zorlukla karşılaştın mı? Onu nasıl ele aldın?",
  "Sana göre mutluluk nedir?",
];

export function getContextualPrompt(): string {
  const dayOfWeek = new Date().getDay();
  const hour = new Date().getHours();
  
  let context: string;
  
  // Time-based context
  if (hour >= 5 && hour < 12) {
    context = "Sabah ";
  } else if (hour >= 12 && hour < 18) {
    context = "Öğleden sonra ";
  } else if (hour >= 18 && hour < 22) {
    context = "Akşam ";
  } else {
    context = "Gece ";
  }
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    context += "hafta sonu ";
  } else {
    context += "hafta içi ";
  }
  
  // Return contextual prompt or random one
  const randomPrompt = CONTEXTUAL_PROMPTS[Math.floor(Math.random() * CONTEXTUAL_PROMPTS.length)];
  return `${context}${randomPrompt}`;
}

interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

async function getSettings(): Promise<AppSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsJson) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

async function getApiKeys(): Promise<{ minimax?: string; kimi?: string }> {
  try {
    const keysJson = await AsyncStorage.getItem(STORAGE_KEYS.API_KEYS);
    if (keysJson) {
      return JSON.parse(keysJson);
    }
  } catch (error) {
    console.error('Failed to load API keys:', error);
  }
  return {};
}

async function callMinimax(apiKey: string, baseUrl: string, prompt: string, systemPrompt?: string): Promise<AIResponse> {
  try {
    const response = await fetch(`${baseUrl}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `MiniMax API hatası: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return { success: false, error: 'MiniMax yanıtı anlaşılamadı' };
    }

    return { success: true, data: content };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return { success: false, error: `Bağlantı hatası: ${errorMessage}` };
  }
}

async function callKimi(apiKey: string, baseUrl: string, prompt: string, systemPrompt?: string): Promise<AIResponse> {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'kimi-latest',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Kimi API hatası: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return { success: false, error: 'Kimi yanıtı anlaşılamadı' };
    }

    return { success: true, data: content };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return { success: false, error: `Bağlantı hatası: ${errorMessage}` };
  }
}

export async function generatePrompt(): Promise<AIResponse> {
  const settings = await getSettings();
  const keys = await getApiKeys();
  
  const { aiModel } = settings;
  
  // Try primary model first
  if (aiModel === 'minimax' && keys.minimax) {
    const result = await callMinimax(
      keys.minimax,
      settings.minimaxBaseUrl,
      PROMPT_GENERATION_PROMPT
    );
    if (result.success) {
      return result;
    }
  } else if (aiModel === 'kimi' && keys.kimi) {
    const result = await callKimi(
      keys.kimi,
      settings.kimiBaseUrl,
      PROMPT_GENERATION_PROMPT
    );
    if (result.success) {
      return result;
    }
  }
  
  // Fallback to other model
  if (aiModel === 'minimax' && keys.kimi) {
    const result = await callKimi(
      keys.kimi,
      settings.kimiBaseUrl,
      PROMPT_GENERATION_PROMPT
    );
    if (result.success) {
      return result;
    }
  } else if (aiModel === 'kimi' && keys.minimax) {
    const result = await callMinimax(
      keys.minimax,
      settings.minimaxBaseUrl,
      PROMPT_GENERATION_PROMPT
    );
    if (result.success) {
      return result;
    }
  }
  
  return { 
    success: false, 
    error: 'API anahtarları bulunamadı veya yapılandırılmadı. Lütfen Ayarlar\'dan API anahtarlarınızı ekleyin.' 
  };
}

export async function generateReflection(entryText: string): Promise<AIResponse> {
  const settings = await getSettings();
  const keys = await getApiKeys();
  
  const { aiModel } = settings;
  const reflectionPrompt = `Aşağıdaki günlük yazısını oku ve kullanıcıya empatik, destekleyici bir yorum yap:\n\n${entryText}`;
  
  // Try primary model first
  if (aiModel === 'minimax' && keys.minimax) {
    const result = await callMinimax(
      keys.minimax,
      settings.minimaxBaseUrl,
      reflectionPrompt,
      SYSTEM_PROMPT
    );
    if (result.success) {
      return result;
    }
  } else if (aiModel === 'kimi' && keys.kimi) {
    const result = await callKimi(
      keys.kimi,
      settings.kimiBaseUrl,
      reflectionPrompt,
      SYSTEM_PROMPT
    );
    if (result.success) {
      return result;
    }
  }
  
  // Fallback to other model
  if (aiModel === 'minimax' && keys.kimi) {
    const result = await callKimi(
      keys.kimi,
      settings.kimiBaseUrl,
      reflectionPrompt,
      SYSTEM_PROMPT
    );
    if (result.success) {
      return result;
    }
  } else if (aiModel === 'kimi' && keys.minimax) {
    const result = await callMinimax(
      keys.minimax,
      settings.minimaxBaseUrl,
      reflectionPrompt,
      SYSTEM_PROMPT
    );
    if (result.success) {
      return result;
    }
  }
  
  return { 
    success: false, 
    error: 'API anahtarları bulunamadı veya yapılandırılmadı. Lütfen Ayarlar\'dan API anahtarlarınızı ekleyin.' 
  };
}

export async function saveApiKeys(minimaxKey?: string, kimiKey?: string): Promise<void> {
  const keys: { minimax?: string; kimi?: string } = {};
  if (minimaxKey) keys.minimax = minimaxKey;
  if (kimiKey) keys.kimi = kimiKey;
  await AsyncStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
}

export async function loadApiKeys(): Promise<{ minimax?: string; kimi?: string }> {
  return getApiKeys();
}

export async function generateWeeklySummary(entries: { text: string; date: string; mood?: number }[]): Promise<AIResponse> {
  const settings = await getSettings();
  const keys = await getApiKeys();
  
  if (entries.length === 0) {
    return { success: false, error: 'Özetlenecek yazı bulunmuyor' };
  }
  
  // Prepare entries text
  const entriesText = entries.map((e, i) => {
    const moodStr = e.mood ? ` (Ruh Hali: ${e.mood}/5)` : '';
    return `${i + 1}. ${e.date}${moodStr}: ${e.text}`;
  }).join('\n\n');
  
  const summaryPrompt = `${WEEKLY_SUMMARY_PROMPT}\n\n=== GÜNLÜK YAZILARI ===\n\n${entriesText}`;
  
  const { aiModel } = settings;
  
  // Try primary model first
  if (aiModel === 'minimax' && keys.minimax) {
    const result = await callMinimax(
      keys.minimax,
      settings.minimaxBaseUrl,
      summaryPrompt,
      WEEKLY_SUMMARY_SYSTEM
    );
    if (result.success) {
      return result;
    }
  } else if (aiModel === 'kimi' && keys.kimi) {
    const result = await callKimi(
      keys.kimi,
      settings.kimiBaseUrl,
      summaryPrompt,
      WEEKLY_SUMMARY_SYSTEM
    );
    if (result.success) {
      return result;
    }
  }
  
  // Fallback to other model
  if (aiModel === 'minimax' && keys.kimi) {
    const result = await callKimi(
      keys.kimi,
      settings.kimiBaseUrl,
      summaryPrompt,
      WEEKLY_SUMMARY_SYSTEM
    );
    if (result.success) {
      return result;
    }
  } else if (aiModel === 'kimi' && keys.minimax) {
    const result = await callMinimax(
      keys.minimax,
      settings.minimaxBaseUrl,
      summaryPrompt,
      WEEKLY_SUMMARY_SYSTEM
    );
    if (result.success) {
      return result;
    }
  }
  
  return { 
    success: false, 
    error: 'API anahtarları bulunamadı veya yapılandırılmadı. Lütfen Ayarlar\'dan API anahtarlarınızı ekleyin.' 
  };
}
