module.exports = {
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
};
