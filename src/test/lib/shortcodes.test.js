import { describe, it, expect, vi } from 'vitest';
import { currentYear } from '../../lib/shortcodes.js';

describe('shortcodes', () => {
  describe('currentYear', () => {
    it('should return current year as string', () => {
      const mockDate = new Date('2023-06-15');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      const result = currentYear();
      
      expect(result).toBe('2023');
      expect(typeof result).toBe('string');
      
      vi.restoreAllMocks();
    });

    it('should handle year transitions correctly', () => {
      const mockDate = new Date('2024-01-01');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      const result = currentYear();
      
      expect(result).toBe('2024');
      
      vi.restoreAllMocks();
    });
  });
});