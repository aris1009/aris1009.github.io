/**
 * CSPRNG-backed word picker with rejection sampling over [0, 7776).
 * No Math.random anywhere. Browser ESM.
 */

export const WORDLIST_SIZE = 7776;

// Uint16 range is [0, 65536). Largest multiple of 7776 that fits: 7776 * 8 = 62208.
// Accept draws in [0, 62208) and reject the rest to keep the distribution uniform.
export const REJECTION_THRESHOLD = Math.floor(65536 / WORDLIST_SIZE) * WORDLIST_SIZE; // 62208

/**
 * Draw one uniform index in [0, 7776) via rejection sampling on Uint16 values.
 * @param {(buf: Uint16Array) => Uint16Array} getRandomValues - CSPRNG
 */
export function drawIndex(getRandomValues) {
  const buf = new Uint16Array(1);
  // Bounded retry — with acceptance ratio 62208/65536 ≈ 0.949, probability of
  // 64 consecutive rejections is ~1e-81. If this ever fires, the RNG is broken.
  for (let attempt = 0; attempt < 64; attempt++) {
    getRandomValues(buf);
    if (buf[0] < REJECTION_THRESHOLD) {
      return buf[0] % WORDLIST_SIZE;
    }
  }
  throw new Error('CSPRNG rejection sampling exceeded retry budget');
}

/**
 * Return N words drawn uniformly from a sorted word array.
 * @param {number} n - number of words (>=1)
 * @param {string[]} words - ordered word array of length 7776
 * @param {(buf: Uint16Array) => Uint16Array} [getRandomValues] - injectable RNG
 */
export function pickWords(n, words, getRandomValues) {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`word count must be a positive integer, got ${n}`);
  }
  if (words.length !== WORDLIST_SIZE) {
    throw new RangeError(`wordlist must have ${WORDLIST_SIZE} entries, got ${words.length}`);
  }
  const rng = getRandomValues || globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
  if (!rng) throw new Error('crypto.getRandomValues is unavailable');

  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = words[drawIndex(rng)];
  }
  return out;
}

/**
 * Convert a wordlist Map (dice-key -> word) into a sorted array indexed by
 * lexicographic dice-key order. With EFF's 5-digit base-6 keys this is
 * equivalent to numeric order.
 */
export function wordlistMapToArray(map) {
  const keys = [...map.keys()].sort();
  if (keys.length !== WORDLIST_SIZE) {
    throw new RangeError(`wordlist must have ${WORDLIST_SIZE} entries, got ${keys.length}`);
  }
  return keys.map((k) => map.get(k));
}
