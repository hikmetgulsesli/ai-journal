// Jest setup file
// Mock expo
jest.mock('expo', () => ({}));

// Mock expo-font
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  Tabs: {
    Screen: () => null,
  },
  Stack: {
    Screen: () => null,
  },
  Link: ({ children }) => children,
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  PenLine: 'PenLine',
  Calendar: 'Calendar',
  BarChart3: 'BarChart3',
  Settings: 'Settings',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  Plus: 'Plus',
  X: 'X',
  Send: 'Send',
}));
