// AI Service Tests
import { generatePrompt, generateReflection, getContextualPrompt } from '../services/aiService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('AI Service', () => {
  describe('getContextualPrompt', () => {
    it('should return a string', () => {
      const prompt = getContextualPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include time context', () => {
      const prompt = getContextualPrompt();
      const timeKeywords = ['Sabah', 'Öğleden sonra', 'Akşam', 'Gece'];
      const hasTimeKeyword = timeKeywords.some(keyword => prompt.includes(keyword));
      expect(hasTimeKeyword).toBe(true);
    });

    it('should include day context', () => {
      const prompt = getContextualPrompt();
      const dayKeywords = ['hafta sonu', 'hafta içi'];
      const hasDayKeyword = dayKeywords.some(keyword => prompt.includes(keyword));
      expect(hasDayKeyword).toBe(true);
    });
  });

  describe('generatePrompt', () => {
    it('should return error when no API keys are configured', async () => {
      const result = await generatePrompt();
      expect(result.success).toBe(false);
      expect(result.error).toContain('API anahtarları');
    });
  });

  describe('generateReflection', () => {
    it('should return error when no API keys are configured', async () => {
      const result = await generateReflection('Bu çok uzun bir yazı. Bu yazıda bugün olan olayları anlatıyorum. Bugün çok çalıştım ve yoruldum. Ama aynı zamanda mutluyum çünkü bir şeyler başardım.');
      expect(result.success).toBe(false);
      expect(result.error).toContain('API anahtarları');
    });

    it('should accept text with 50+ words', async () => {
      const longText = 'Bu test için yazılmış uzun bir metin. '.repeat(10);
      const result = await generateReflection(longText);
      // Should return error because no API key, but should not crash
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });
});
