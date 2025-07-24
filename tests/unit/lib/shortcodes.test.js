import { describe, it, expect, vi } from 'vitest';
import { currentYear, dictionaryLink } from 'src/lib/shortcodes.js';

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

  describe('dictionaryLink', () => {
    it('should generate Shoelace tooltip with correct structure', () => {
      const result = dictionaryLink('encryption technology', 'encryption');
      
      // Check for Shoelace tooltip wrapper
      expect(result).toContain('<sl-tooltip');
      expect(result).toContain('placement="bottom"');
      expect(result).toContain('data-testid="dictionary-tooltip-encryption"');
      
      // Check for slot content (HTML is now in a slot)
      expect(result).toContain('slot="content"');
      expect(result).toContain('class="dictionary-tooltip-content"');
      
      // Check for term and definition in slot content
      expect(result).toContain('class="tooltip-term"');
      expect(result).toContain('Encryption'); // Capitalized term
      expect(result).toContain('class="tooltip-definition"');
      expect(result).toContain('The process of converting readable data');
      
      // Check for button with test IDs
      expect(result).toContain('data-testid="dictionary-link-encryption"');
      expect(result).toContain('data-testid="dictionary-emoji-encryption"');
      
      // Check for proper ARIA label
      expect(result).toContain('aria-label="Definition of encryption"');
      
      // Check for dictionary emoji
      expect(result).toContain('📘');
      
      // Check for text content
      expect(result).toContain('encryption technology');
    });

    it('should handle unknown terms gracefully', () => {
      const result = dictionaryLink('unknown term', 'nonexistent');
      
      expect(result).toContain('<sl-tooltip');
      expect(result).toContain('data-testid="dictionary-tooltip-nonexistent"');
      expect(result).toContain('Term not found in dictionary');
      expect(result).toContain('Nonexistent'); // Capitalized unknown term
      expect(result).toContain('unknown term'); // Original text preserved
    });

    it('should generate unique test IDs for different terms', () => {
      const encryptionResult = dictionaryLink('test', 'encryption');
      const firewallResult = dictionaryLink('test', 'firewall');
      
      expect(encryptionResult).toContain('data-testid="dictionary-tooltip-encryption"');
      expect(encryptionResult).toContain('data-testid="dictionary-link-encryption"');
      expect(encryptionResult).toContain('data-testid="dictionary-emoji-encryption"');
      
      expect(firewallResult).toContain('data-testid="dictionary-tooltip-firewall"');
      expect(firewallResult).toContain('data-testid="dictionary-link-firewall"');
      expect(firewallResult).toContain('data-testid="dictionary-emoji-firewall"');
    });

    it('should handle terms with special characters in text', () => {
      const result = dictionaryLink('VPN & security', 'vpn');
      
      expect(result).toContain('VPN & security'); // Text preserved as-is
      expect(result).toContain('data-testid="dictionary-tooltip-vpn"');
      expect(result).toContain('Virtual Private Network');
    });

    it('should capitalize term names correctly', () => {
      const result = dictionaryLink('test', 'malware');
      
      expect(result).toContain('class="tooltip-term">Malware</div>'); // Direct HTML in slot content
    });

    it('should include all required accessibility attributes', () => {
      const result = dictionaryLink('test text', 'encryption');
      
      // Check for ARIA label
      expect(result).toContain('aria-label="Definition of encryption"');
      
      // Check for aria-hidden on emoji
      expect(result).toContain('aria-hidden="true"');
      
      // Check button structure
      expect(result).toContain('<button class="dictionary-link');
    });

    it('should use English definition by default', () => {
      const result = dictionaryLink('test', 'phishing');
      
      expect(result).toContain('A cyber attack method where attackers impersonate legitimate organizations');
      expect(result).not.toContain('Μια μέθοδος κυβερνοεπίθεσης'); // Greek text should not appear
    });

    it('should preserve CSS classes for styling', () => {
      const result = dictionaryLink('test', 'encryption');
      
      expect(result).toContain('class="dictionary-link inline-flex items-center"');
      expect(result).toContain('class="dictionary-text"');
      expect(result).toContain('class="emoji-indicator dictionary-emoji"');
      expect(result).toContain('class="dictionary-tooltip-content"'); // Direct HTML in slot content
    });
  });
});