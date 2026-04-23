import { describe, it, expect } from 'vitest';
import {
  BITS_PER_WORD,
  ATTACKER_MODELS,
  entropyBits,
  log2CrackSeconds,
  formatLog2Seconds,
  crackTimes
} from 'src/_static/js/tools/diceware/crack-time.js';

describe('entropy math', () => {
  it('BITS_PER_WORD = log2(7776)', () => {
    expect(BITS_PER_WORD).toBeCloseTo(12.924812503605781, 10);
  });

  it('6 words of EFF large list ≈ 77.5 bits', () => {
    expect(entropyBits(6)).toBeCloseTo(77.548875, 4);
  });

  it('rejects negative word count', () => {
    expect(() => entropyBits(-1)).toThrow(RangeError);
  });
});

describe('log2CrackSeconds', () => {
  it('matches closed form for typical case', () => {
    // 77.5 bits, 1e11/s: log2(t) = 76.5 - log2(1e11) ≈ 76.5 - 36.54 ≈ 39.96
    const v = log2CrackSeconds(77.548875, 1e11);
    expect(v).toBeCloseTo(77.548875 - 1 - Math.log2(1e11), 10);
  });

  it('rejects non-positive rate', () => {
    expect(() => log2CrackSeconds(80, 0)).toThrow(RangeError);
    expect(() => log2CrackSeconds(80, -1)).toThrow(RangeError);
  });
});

describe('formatLog2Seconds boundary values', () => {
  it('returns ∞ for non-finite input', () => {
    expect(formatLog2Seconds(Infinity)).toBe('∞');
  });

  it('<1 nanosecond for very small values', () => {
    expect(formatLog2Seconds(Math.log2(1e-12))).toBe('<1 nanosecond');
  });

  it('formats milliseconds', () => {
    const s = formatLog2Seconds(Math.log2(0.005));
    expect(s).toMatch(/milliseconds$/);
  });

  it('formats seconds', () => {
    const s = formatLog2Seconds(Math.log2(5));
    expect(s).toMatch(/seconds$/);
  });

  it('formats hours', () => {
    const s = formatLog2Seconds(Math.log2(3600 * 2));
    expect(s).toMatch(/hours$/);
  });

  it('formats years', () => {
    const s = formatLog2Seconds(Math.log2(365.25 * 86400 * 5));
    expect(s).toMatch(/years$/);
  });

  it('formats billion years near the age of the universe', () => {
    const s = formatLog2Seconds(Math.log2(13.8e9 * 365.25 * 86400));
    expect(s).toMatch(/billion years$/);
  });

  it('expresses huge times as multiples of the age of the universe', () => {
    // 200 bits offline fast = log2(2^199 / 1e11) = 199 - log2(1e11) ≈ 162.46
    const log2s = 199 - Math.log2(1e11);
    const s = formatLog2Seconds(log2s);
    expect(s).toMatch(/age of the universe/);
  });

  it('uses scientific notation for absurd times', () => {
    // 500 bits
    const log2s = 499 - Math.log2(1e11);
    const s = formatLog2Seconds(log2s);
    expect(s).toMatch(/×10\^/);
    expect(s).toMatch(/age of the universe/);
  });
});

describe('crackTimes', () => {
  it('returns one row per attacker model', () => {
    const rows = crackTimes(77.5);
    expect(rows).toHaveLength(ATTACKER_MODELS.length);
    for (const row of rows) {
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('formatted');
      expect(row).toHaveProperty('log2Seconds');
    }
    const offlineFast = rows.find((r) => r.id === 'offline_fast');
    expect(offlineFast.highlight).toBe(true);
  });

  it('online throttled is orders slower than offline fast', () => {
    const rows = crackTimes(77.5);
    const online = rows.find((r) => r.id === 'online_throttled').log2Seconds;
    const fast = rows.find((r) => r.id === 'offline_fast').log2Seconds;
    // Difference equals log2(1e11) - log2(10) = log2(1e10) ≈ 33.22
    expect(online - fast).toBeCloseTo(Math.log2(1e10), 8);
  });
});
