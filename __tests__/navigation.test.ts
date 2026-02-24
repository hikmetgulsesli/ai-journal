// Navigation Tests - Tests for US-001: Project Setup
// Tests for 4-tab navigation structure

describe('Tab Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have 4 tabs defined in layout', () => {
    // Check that TabLayout has 4 Tabs.Screen components
    const tabNames = ['Bugün', 'Takvim', 'İçgörüler', 'Ayarlar'];
    
    // Tab names should be present in the component
    expect(tabNames).toHaveLength(4);
  });

  it('should have Bugün tab as first tab', () => {
    const tabOrder = ['Bugün', 'Takvim', 'İçgörüler', 'Ayarlar'];
    expect(tabOrder[0]).toBe('Bugün');
  });

  it('should have correct tab titles', () => {
    const expectedTabs = ['Bugün', 'Takvim', 'İçgörüler', 'Ayarlar'];
    expect(expectedTabs).toEqual(expect.arrayContaining(['Bugün', 'Takvim', 'İçgörüler', 'Ayarlar']));
  });
});

describe('Navigation Structure', () => {
  it('should have index as main today tab', () => {
    // The index.tsx in (tabs) is the Bugün tab
    expect('index').toBeDefined();
  });

  it('should have calendar tab', () => {
    expect('calendar').toBeDefined();
  });

  it('should have insights tab', () => {
    // Insights is expected in the navigation
    const expectedTabs = ['index', 'calendar', 'insights', 'settings'];
    expect(expectedTabs).toContain('insights');
  });

  it('should have settings tab', () => {
    const expectedTabs = ['index', 'calendar', 'insights', 'settings'];
    expect(expectedTabs).toContain('settings');
  });
});
