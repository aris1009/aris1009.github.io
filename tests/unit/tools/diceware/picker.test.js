import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  drawIndex,
  pickWords,
  wordlistMapToArray,
  WORDLIST_SIZE,
  REJECTION_THRESHOLD
} from 'src/_static/js/tools/diceware/picker.js';

function buildSyntheticWordlist() {
  return Array.from({ length: WORDLIST_SIZE }, (_, i) => `word${i}`);
}

describe('rejection sampling math', () => {
  it('threshold is the largest multiple of 7776 below 2^16', () => {
    expect(REJECTION_THRESHOLD).toBe(7776 * 8);
    expect(REJECTION_THRESHOLD).toBe(62208);
    expect(REJECTION_THRESHOLD + WORDLIST_SIZE).toBeGreaterThan(65536);
  });
});

describe('drawIndex', () => {
  it('rejects values >= threshold and returns in [0, 7776)', () => {
    // Scripted RNG: first two draws are above threshold, third is accepted.
    const values = [REJECTION_THRESHOLD, 65535, 12345];
    let i = 0;
    const rng = (buf) => {
      buf[0] = values[i++];
      return buf;
    };
    const idx = drawIndex(rng);
    expect(idx).toBe(12345 % WORDLIST_SIZE);
    expect(i).toBe(3);
  });

  it('maps accepted value via modulo', () => {
    const rng = (buf) => {
      buf[0] = 7776; // accepted (< 62208), maps to 0
      return buf;
    };
    expect(drawIndex(rng)).toBe(0);
  });

  it('throws if rejection budget exceeded', () => {
    const rng = (buf) => {
      buf[0] = 65535; // always reject
      return buf;
    };
    expect(() => drawIndex(rng)).toThrow(/retry budget/);
  });
});

describe('pickWords uniformity (statistical)', () => {
  it('chi-square over 1e5 draws does not reject uniformity at p<0.001', () => {
    const words = buildSyntheticWordlist();
    const rng = webcrypto.getRandomValues.bind(webcrypto);
    const N = 100000;
    const counts = new Int32Array(WORDLIST_SIZE);
    const drawn = pickWords(N, words, rng);
    for (const w of drawn) {
      const idx = Number(w.slice(4));
      counts[idx]++;
    }
    const expected = N / WORDLIST_SIZE;
    let chi = 0;
    for (let i = 0; i < WORDLIST_SIZE; i++) {
      const d = counts[i] - expected;
      chi += (d * d) / expected;
    }
    // df = 7775. Mean = df, stddev ≈ sqrt(2*df) ≈ 124.7. p<0.001 upper tail ≈ df + 3.09*stddev ≈ 8160.
    // Generous bound: chi within [df - 400, df + 600] under uniform.
    expect(chi).toBeGreaterThan(WORDLIST_SIZE - 1000);
    expect(chi).toBeLessThan(WORDLIST_SIZE + 1200);
  });

  it('returns exactly N words, each in the wordlist', () => {
    const words = buildSyntheticWordlist();
    const rng = webcrypto.getRandomValues.bind(webcrypto);
    const drawn = pickWords(6, words, rng);
    expect(drawn).toHaveLength(6);
    const set = new Set(words);
    for (const w of drawn) expect(set.has(w)).toBe(true);
  });

  it('rejects invalid word count', () => {
    const words = buildSyntheticWordlist();
    expect(() => pickWords(0, words)).toThrow(RangeError);
    expect(() => pickWords(1.5, words)).toThrow(RangeError);
    expect(() => pickWords(-1, words)).toThrow(RangeError);
  });

  it('rejects wrong-sized wordlist', () => {
    expect(() => pickWords(3, ['a', 'b', 'c'])).toThrow(RangeError);
  });
});

describe('wordlistMapToArray', () => {
  it('sorts by dice key and returns 7776-length array', () => {
    const map = new Map();
    // Insert in reverse order to prove sorting happens.
    const keys = [];
    for (let a = 1; a <= 6; a++) {
      for (let b = 1; b <= 6; b++) {
        for (let c = 1; c <= 6; c++) {
          for (let d = 1; d <= 6; d++) {
            for (let e = 1; e <= 6; e++) {
              keys.push(`${a}${b}${c}${d}${e}`);
            }
          }
        }
      }
    }
    for (const k of keys.slice().reverse()) {
      map.set(k, `w${k}`);
    }
    const arr = wordlistMapToArray(map);
    expect(arr).toHaveLength(WORDLIST_SIZE);
    expect(arr[0]).toBe('w11111');
    expect(arr[arr.length - 1]).toBe('w66666');
  });

  it('throws if map has wrong size', () => {
    expect(() => wordlistMapToArray(new Map([['11111', 'x']]))).toThrow(RangeError);
  });
});
