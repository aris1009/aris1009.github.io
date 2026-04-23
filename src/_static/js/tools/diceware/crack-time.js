/**
 * Entropy and crack-time estimation for diceware passphrases.
 *
 * Attacker models:
 *   online_throttled : 10 guesses/sec   (rate-limited web login)
 *   offline_fast     : 1e11 guesses/sec (modern GPU vs fast hash, e.g. NTLM)
 *   offline_slow     : 1e4 guesses/sec  (memory-hard KDF like argon2/bcrypt)
 *
 * Average-case time to crack ≈ 2^(bits - 1) / rate. We work in log-base-2 of
 * seconds and exponentiate only at formatting time to avoid Infinity/NaN for
 * passphrases with hundreds of bits of entropy.
 */

export const BITS_PER_WORD = Math.log2(7776); // 12.924812503605781

export const ATTACKER_MODELS = [
  { id: 'online_throttled', label: 'Online throttled (~10/s)', rate: 1e1, highlight: false },
  { id: 'offline_fast', label: 'Offline fast hash (~10¹¹/s)', rate: 1e11, highlight: true },
  { id: 'offline_slow', label: 'Offline slow KDF (~10⁴/s)', rate: 1e4, highlight: false }
];

export function entropyBits(wordCount, bitsPerWord = BITS_PER_WORD) {
  if (!Number.isFinite(wordCount) || wordCount < 0) {
    throw new RangeError(`wordCount must be non-negative, got ${wordCount}`);
  }
  return wordCount * bitsPerWord;
}

/**
 * log2 of average-case crack time in seconds.
 * @param {number} bits - passphrase entropy in bits
 * @param {number} ratePerSec - attacker guesses per second
 */
export function log2CrackSeconds(bits, ratePerSec) {
  if (ratePerSec <= 0) throw new RangeError('rate must be positive');
  // t = 2^(bits-1) / rate  ⇒  log2(t) = (bits - 1) - log2(rate)
  return (bits - 1) - Math.log2(ratePerSec);
}

const TIME_UNITS = [
  { name: 'nanoseconds', seconds: 1e-9 },
  { name: 'microseconds', seconds: 1e-6 },
  { name: 'milliseconds', seconds: 1e-3 },
  { name: 'seconds', seconds: 1 },
  { name: 'minutes', seconds: 60 },
  { name: 'hours', seconds: 3600 },
  { name: 'days', seconds: 86400 },
  { name: 'years', seconds: 365.25 * 86400 },
  { name: 'thousand years', seconds: 1e3 * 365.25 * 86400 },
  { name: 'million years', seconds: 1e6 * 365.25 * 86400 },
  { name: 'billion years', seconds: 1e9 * 365.25 * 86400 },
  { name: 'trillion years', seconds: 1e12 * 365.25 * 86400 }
];

const AGE_OF_UNIVERSE_SEC = 13.8e9 * 365.25 * 86400; // ~4.35e17 s
const LOG2_AGE_UNIVERSE = Math.log2(AGE_OF_UNIVERSE_SEC);

function formatNumber(x) {
  if (x >= 100) return Math.round(x).toLocaleString('en-US');
  if (x >= 10) return x.toFixed(1);
  return x.toFixed(2);
}

/**
 * Format a log2-seconds duration as a human-readable string.
 * Handles everything from nanoseconds to multiples of the age of the universe
 * without losing precision via Infinity.
 */
export function formatLog2Seconds(log2s) {
  if (!Number.isFinite(log2s)) return '∞';
  if (log2s < Math.log2(1e-9)) return '<1 nanosecond';

  // Past the age of the universe? express as a multiple.
  if (log2s > LOG2_AGE_UNIVERSE + 1) {
    const log10Multiple = (log2s - LOG2_AGE_UNIVERSE) * Math.log10(2);
    if (log10Multiple > 6) {
      // Scientific notation: 10^N times the age of the universe.
      const exp = Math.floor(log10Multiple);
      const mant = Math.pow(10, log10Multiple - exp);
      return `${formatNumber(mant)}×10^${exp} × age of the universe`;
    }
    const multiple = Math.pow(10, log10Multiple);
    return `${formatNumber(multiple)}× the age of the universe`;
  }

  // Walk units from largest down to find the first that fits.
  for (let i = TIME_UNITS.length - 1; i >= 0; i--) {
    const unit = TIME_UNITS[i];
    const log2Unit = Math.log2(unit.seconds);
    if (log2s >= log2Unit - 1) {
      const value = Math.pow(2, log2s - log2Unit);
      return `${formatNumber(value)} ${unit.name}`;
    }
  }
  return '<1 nanosecond';
}

/**
 * Compute crack time across all attacker models.
 * @param {number} bits
 * @returns {Array<{id:string,label:string,rate:number,log2Seconds:number,formatted:string,highlight:boolean}>}
 */
export function crackTimes(bits) {
  return ATTACKER_MODELS.map((m) => {
    const log2s = log2CrackSeconds(bits, m.rate);
    return {
      id: m.id,
      label: m.label,
      rate: m.rate,
      log2Seconds: log2s,
      formatted: formatLog2Seconds(log2s),
      highlight: m.highlight
    };
  });
}
