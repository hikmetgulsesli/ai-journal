// Setup file that runs BEFORE any module is imported
// This needs to mock the expo winter runtime that causes issues

global.__ExpoImportMetaRegistry = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
