# AI Günlük (AI Journal) - Mobile App

## Overview
Yapay zeka destekli günlük tutma uygulaması. Kullanıcıların düzenli journal yazma alışkanlığı edinmesini sağlar. AI ile günlük promptlar üretir, yazılan girişleri analiz eder, ruh hali takibi yapar ve haftalık/aylık içgörüler sunar. Tüm veriler varsayılan olarak cihazda saklanır (gizlilik öncelikli).

## Tech Stack
- **Framework:** React Native with Expo SDK 54+
- **Language:** TypeScript
- **State:** React Context + AsyncStorage for persistence
- **UI:** React Native built-in components + custom styling (no external UI library)
- **Notifications:** expo-notifications for daily reminders
- **Navigation:** expo-router (file-based routing)
- **Charts:** react-native-svg for mood trends and statistics
- **AI Models:** MiniMax M2.5 (primary), Kimi latest (fallback)
- **Fonts:** Sora (headings), Nunito Sans (body)

## Design
- Dark theme by default (gece journal yazmak için ideal)
- Yumuşak, sakin renk paleti — journal/yazı teması
- Emoji-based mood tracker
- Bottom tab navigation: Bugün, Takvim, İçgörüler, Ayarlar
- Card-based layout for entries

### Color Palette
```
Primary:          #6366f1  (Indigo — journal/yazı teması)
Primary Dark:     #4f46e5  (Indigo 600)
Accent:           #f59e0b  (Amber — streak/başarı)
Accent Dark:      #d97706  (Amber 600)

Dark Theme:
  Background:     #0f172a  (Slate 900)
  Surface:        #1e293b  (Slate 800)
  Surface Alt:    #334155  (Slate 700)
  Border:         #475569  (Slate 600)
  Text:           #f8fafc  (Slate 50)
  Text Muted:     #94a3b8  (Slate 400)
  Text Subtle:    #64748b  (Slate 500)

Light Theme:
  Background:     #f8fafc  (Slate 50)
  Surface:        #ffffff  (White)
  Surface Alt:    #f1f5f9  (Slate 100)
  Border:         #e2e8f0  (Slate 200)
  Text:           #0f172a  (Slate 900)
  Text Muted:     #64748b  (Slate 500)
  Text Subtle:    #94a3b8  (Slate 400)

Mood Colors:
  Çok Kötü:       #ef4444  (Red 500)
  Kötü:           #f97316  (Orange 500)
  Normal:         #eab308  (Yellow 500)
  İyi:            #22c55e  (Green 500)
  Çok İyi:        #10b981  (Emerald 500)

Status:
  Success:        #10b981
  Warning:        #f59e0b
  Error:          #ef4444
  Info:           #3b82f6
```

## User Stories

### US-001: Project Setup with Expo
**As a** developer
**I want** the project scaffolded with Expo and TypeScript
**So that** development can begin

**Acceptance Criteria:**
- Create Expo project with TypeScript template (SDK 54)
- Configure expo-router for file-based navigation
- Set up 4 tabs: Bugün (Today), Takvim (Calendar), İçgörüler (Insights), Ayarlar (Settings)
- Tab icons: pencil-outline, calendar-outline, bar-chart-outline, cog-outline
- ThemeContext with dark/light/system modes
- Design tokens (colors, typography, spacing, borderRadius, shadows) in `src/constants/theme.ts`
- App icon and splash screen (journal/notebook icon with indigo theme)
- App name: "AI Günlük"
- Package name: `com.setrox.aijournal`
- Load Sora + Nunito Sans fonts via `@expo-google-fonts`
- ESLint configured
- App builds and runs without errors on Android

**Reference Files:**
- `pomodoro-mobile/src/constants/theme.ts` — design token structure
- `pomodoro-mobile/src/contexts/ThemeContext.tsx` — theme context pattern
- `pomodoro-mobile/app/_layout.tsx` — root layout + font loading
- `pomodoro-mobile/app/(tabs)/_layout.tsx` — tab navigation setup

---

### US-002: Journal Entry Core
**As a** user
**I want** to write daily journal entries
**So that** I can capture my thoughts and experiences

**Acceptance Criteria:**
- "Bugün" tab is the default/home screen
- Large multiline TextInput for writing (placeholder: "Bugün neler yaşadın?")
- Auto-populated date and time header (Turkish locale: "24 Şubat 2026, Salı")
- Save button that stores entry to AsyncStorage
- Each entry has: id (uuid), text, date (ISO), createdAt, mood (optional), aiResponse (optional)
- Today's entries listed below the editor in reverse chronological order
- Each entry card shows: time, preview text (first 2 lines), mood emoji if set
- Tap entry card to view full entry
- Swipe left on entry card to delete (with confirmation)
- Empty state: motivational message ("Bugün bir şeyler yazmaya ne dersin?")
- AsyncStorage key format: `@aijournal/entries`

**Data Model:**
```typescript
interface JournalEntry {
  id: string;
  text: string;
  date: string;          // ISO date (YYYY-MM-DD)
  createdAt: string;     // ISO datetime
  mood?: MoodLevel;      // 1-5
  aiResponse?: string;   // AI reflection/comment
  aiPrompt?: string;     // The prompt that was used
  wordCount: number;
}

type MoodLevel = 1 | 2 | 3 | 4 | 5;
// 1: Çok Kötü (😢), 2: Kötü (😔), 3: Normal (😐), 4: İyi (😊), 5: Çok İyi (😄)
```

---

### US-003: Mood Tracking
**As a** user
**I want** to record my mood with each journal entry
**So that** I can track how I feel over time

**Acceptance Criteria:**
- Mood selector row with 5 emoji buttons below the text editor
- Emojis: 😢 😔 😐 😊 😄 (labels: Çok Kötü, Kötü, Normal, İyi, Çok İyi)
- Selected mood highlighted with corresponding mood color background
- Mood is optional — user can save entry without selecting
- Mood saved as part of the JournalEntry object (1-5 scale)
- Today's mood summary at top of "Bugün" tab if entries exist
- Mood can be changed by tapping the entry and editing

---

### US-004: AI Integration
**As a** user
**I want** AI-powered prompts and reflections
**So that** I get inspiration and insights from my journal

**Acceptance Criteria:**
- **AI Prompt Generation:**
  - "Bana bir soru sor" button on the Bugün tab
  - Calls AI model to generate a thoughtful journal prompt in Turkish
  - Prompt displayed in a styled card above the editor
  - Example prompts: "Bugün seni en çok ne mutlu etti?", "Son zamanlarda üzerinde düşündüğün bir konu var mı?"
  - Prompts should be varied and contextual (can reference day of week, season)

- **AI Reflection:**
  - After saving an entry (50+ words), offer "AI Yorumu" button
  - AI reads the entry and provides a short, empathetic reflection in Turkish
  - Reflection stored in `aiResponse` field of the entry
  - Reflection displayed in a separate styled card below the entry

- **API Configuration:**
  - MiniMax M2.5 as primary model
  - Kimi (latest) as fallback model
  - API base URLs configurable in settings
  - API key stored securely in AsyncStorage (`@aijournal/apikeys`)
  - Model selection toggle in settings (MiniMax / Kimi)
  - Graceful error handling: if API fails, show user-friendly Turkish error message
  - Loading state with spinner during API calls

- **System Prompt:**
  ```
  Sen empatik ve destekleyici bir günlük asistanısın. Kullanıcının duygularını anlayarak
  kısa, anlamlı ve düşündürücü yorumlar yaparsın. Türkçe yanıt ver. Yanıtların 2-3 cümle olsun.
  ```

---

### US-005: Calendar & History
**As a** user
**I want** to browse my past journal entries by date
**So that** I can reflect on previous days

**Acceptance Criteria:**
- "Takvim" tab shows a monthly calendar view
- Days with journal entries marked with a dot indicator
- Dot color matches the average mood of that day's entries
- Tap a day to see all entries for that date below the calendar
- Month navigation: left/right arrows to switch months
- Current day highlighted with primary color
- Selected day highlighted differently from current day
- Turkish month/day names (Ocak, Şubat, ..., Pazartesi, Salı, ...)
- If no entries for selected day: "Bu gün için giriş yok" message
- Entry cards show: time, mood emoji, text preview
- Tap entry card to view full entry (same view as US-002)
- Search bar at top: search entries by text content
- Search results shown as a list with date, mood, and preview

---

### US-006: AI Insights & Analytics
**As a** user
**I want** AI-powered weekly summaries and mood analytics
**So that** I can understand my emotional patterns

**Acceptance Criteria:**
- "İçgörüler" tab with scrollable sections:

- **Streak Counter:**
  - "🔥 X gün üst üste" — consecutive days with at least 1 entry
  - Flame icon with amber accent color
  - Current streak + longest streak display

- **Yazma İstatistikleri:**
  - Total entries count
  - Total word count
  - Average words per entry
  - This month entries count

- **Haftalık Ruh Hali Grafiği:**
  - Line chart showing average daily mood for last 7 days (react-native-svg)
  - X-axis: day abbreviations (Pzt, Sal, Çar, Per, Cum, Cmt, Paz)
  - Y-axis: mood scale 1-5 with emoji labels
  - Line color: primary (indigo)
  - Data points with mood-colored dots
  - Days without entries shown as gap

- **Aylık Ruh Hali Dağılımı:**
  - Horizontal bar chart or pie showing mood distribution for current month
  - Each mood level with its color and percentage

- **AI Haftalık Özet:**
  - "Haftalık Özet Al" button
  - AI reads last 7 days of entries and generates a Turkish summary
  - Summary includes: dominant themes, mood trend, encouragement
  - Stored locally with week identifier
  - Previous summaries accessible in a list below

---

### US-007: Daily Reminder Notifications
**As a** user
**I want** daily reminders to write in my journal
**So that** I maintain the habit

**Acceptance Criteria:**
- expo-notifications for scheduled daily reminder
- Default reminder time: 21:00 (evening — reflection time)
- Customizable time in settings (hour picker)
- Notification text varies randomly from a pool of Turkish messages:
  - "Bugün nasıl geçti? Günlüğüne yaz ✍️"
  - "Düşüncelerini yazmaya ne dersin? 📝"
  - "Günün nasıldı? Birkaç satır yaz 💭"
  - "Kendine biraz zaman ayır, günlüğünü yaz 🌙"
  - "Bugünü birkaç cümleyle anlat ✨"
- Toggle to enable/disable reminders in settings
- Permission request on first toggle-on
- Notification taps open the app to "Bugün" tab

---

### US-008: Settings
**As a** user
**I want** to customize my journal app
**So that** it fits my preferences

**Acceptance Criteria:**
- "Ayarlar" tab with grouped sections:

- **AI Ayarları:**
  - Model seçimi: MiniMax M2.5 / Kimi (radio buttons)
  - MiniMax API Key input (password field, masked)
  - Kimi API Key input (password field, masked)
  - API base URL (advanced, collapsible)
  - "Bağlantıyı Test Et" button — sends test prompt, shows success/error

- **Bildirimler:**
  - Günlük hatırlatma toggle (on/off)
  - Hatırlatma saati picker (default 21:00)

- **Görünüm:**
  - Tema seçimi: Koyu / Açık / Sistem (segmented control)

- **Veri Yönetimi:**
  - "Verileri Dışa Aktar (JSON)" — exports all entries as JSON file
  - "Tüm Verileri Sil" — confirmation dialog, deletes all entries and settings
  - Entry count and total word count shown

- **Hakkında:**
  - Uygulama versiyonu
  - "AI Günlük v1.0.0"

- All settings persisted with AsyncStorage (`@aijournal/settings`)
- Settings data model:
```typescript
interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  aiModel: 'minimax' | 'kimi';
  minimaxApiKey?: string;
  kimiApiKey?: string;
  minimaxBaseUrl: string;   // default: https://api.minimaxi.chat/v1
  kimiBaseUrl: string;      // default: https://api.moonshot.cn/v1
  reminderEnabled: boolean;
  reminderHour: number;     // 0-23, default: 21
  reminderMinute: number;   // 0-59, default: 0
}
```
