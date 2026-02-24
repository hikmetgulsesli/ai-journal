// Theme Tests - Tests for US-001: Project Setup
// Tests for ThemeContext and design tokens

import { colors, spacing, borderRadius, typography, shadows } from '../src/constants/theme';

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
});

describe('Design Tokens', () => {
  describe('Colors', () => {
    it('should have primary indigo color', () => {
      expect(colors.primary).toBe('#6366f1');
    });

    it('should have dark theme colors', () => {
      expect(colors.dark.background).toBe('#0f172a');
      expect(colors.dark.text).toBe('#f8fafc');
      expect(colors.dark.surface).toBe('#1e293b');
    });

    it('should have light theme colors', () => {
      expect(colors.light.background).toBe('#f8fafc');
      expect(colors.light.text).toBe('#0f172a');
      expect(colors.light.surface).toBe('#ffffff');
    });

    it('should have mood colors for all 5 levels', () => {
      expect(colors.mood[1]).toBeDefined();
      expect(colors.mood[2]).toBeDefined();
      expect(colors.mood[3]).toBeDefined();
      expect(colors.mood[4]).toBeDefined();
      expect(colors.mood[5]).toBeDefined();
    });

    it('should have status colors', () => {
      expect(colors.success).toBe('#10b981');
      expect(colors.warning).toBe('#f59e0b');
      expect(colors.error).toBe('#ef4444');
      expect(colors.info).toBe('#3b82f6');
    });
  });

  describe('Spacing', () => {
    it('should have all spacing values', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
      expect(spacing.xxl).toBe(48);
    });
  });

  describe('Border Radius', () => {
    it('should have all border radius values', () => {
      expect(borderRadius.sm).toBe(4);
      expect(borderRadius.md).toBe(8);
      expect(borderRadius.lg).toBe(12);
      expect(borderRadius.xl).toBe(16);
      expect(borderRadius.full).toBe(9999);
    });
  });

  describe('Typography', () => {
    it('should have all font sizes', () => {
      expect(typography.sizes.xs).toBe(12);
      expect(typography.sizes.sm).toBe(14);
      expect(typography.sizes.md).toBe(16);
      expect(typography.sizes.lg).toBe(18);
      expect(typography.sizes.xl).toBe(20);
      expect(typography.sizes.xxl).toBe(24);
      expect(typography.sizes.xxxl).toBe(32);
    });

    it('should have all font weights', () => {
      expect(typography.weights.regular).toBe('400');
      expect(typography.weights.medium).toBe('500');
      expect(typography.weights.semibold).toBe('600');
      expect(typography.weights.bold).toBe('700');
    });
  });

  describe('Shadows', () => {
    it('should have all shadow configurations', () => {
      expect(shadows.sm).toBeDefined();
      expect(shadows.md).toBeDefined();
      expect(shadows.lg).toBeDefined();
    });

    it('should have correct elevation values', () => {
      expect(shadows.sm.elevation).toBe(1);
      expect(shadows.md.elevation).toBe(3);
      expect(shadows.lg.elevation).toBe(5);
    });
  });
});

describe('Theme Colors Extended', () => {
  it('should have primary color in both themes', () => {
    expect(colors.dark.primary).toBe('#6366f1');
    expect(colors.light.primary).toBe('#6366f1');
  });

  it('should have mood colors in both themes', () => {
    expect(colors.dark.mood).toBeDefined();
    expect(colors.light.mood).toBeDefined();
    expect(colors.dark.mood[5]).toBe('#10b981');
  });
});
