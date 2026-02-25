module.exports = {
  useFonts: jest.fn(() => [true]),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
};
