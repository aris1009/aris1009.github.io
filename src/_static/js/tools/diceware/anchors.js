/**
 * Greek-history → geological/cosmic anchor ladder for crack-time scale.
 * Each entry is (years-before-anchor-event, phrase). `pickAnchor` returns the
 * entry whose `years` is the greatest value <= the input years.
 *
 * Year values are measured back from 2026. Historical dates are rounded;
 * geological/cosmic figures use standard consensus values (age of Earth,
 * age of the universe, expected end of the stelliferous era).
 */

export const ANCHORS = Object.freeze([
  { years: 0, phrase: 'less than a blink of history' },
  { years: 205, phrase: 'about as long as since the Greek War of Independence (1821)' },
  { years: 573, phrase: 'about as long as since the fall of Constantinople (1453)' },
  { years: 1000, phrase: 'about as long as the Byzantine Empire endured' },
  { years: 2349, phrase: 'about as long as since the death of Alexander the Great (323 BCE)' },
  { years: 2464, phrase: 'about as long as the Parthenon has stood (completed ~438 BCE)' },
  { years: 2776, phrase: 'about as long as since the composition of the Iliad (~750 BCE)' },
  { years: 3000, phrase: 'about as long as since the founding of Athens' },
  { years: 3600, phrase: 'about as long as since the peak of Minoan civilization' },
  { years: 5000, phrase: 'about as long as since the Cycladic culture began' },
  { years: 10000, phrase: 'older than the invention of agriculture' },
  { years: 20000, phrase: 'older than the Last Glacial Maximum' },
  { years: 70000, phrase: 'older than the Toba supervolcano eruption' },
  { years: 300000, phrase: 'older than our species, Homo sapiens' },
  { years: 2.5e6, phrase: 'older than the genus Homo' },
  { years: 6.6e7, phrase: 'older than the extinction of the non-avian dinosaurs' },
  { years: 2.5e8, phrase: 'older than the Permian–Triassic extinction' },
  { years: 5.4e8, phrase: 'older than complex animal life on Earth' },
  { years: 4.5e9, phrase: 'older than the Earth itself' },
  { years: 1.38e10, phrase: 'older than the universe' },
  { years: 1e14, phrase: 'longer than the stelliferous era will last' }
]);

const SECONDS_PER_YEAR = 365.25 * 86400;
const LOG2_SECONDS_PER_YEAR = Math.log2(SECONDS_PER_YEAR);

/**
 * Pick the largest anchor whose `years` value <= input.
 * @param {number} years - positive real
 */
export function pickAnchor(years) {
  if (!Number.isFinite(years) || years < 0) {
    return ANCHORS[0];
  }
  let match = ANCHORS[0];
  for (const a of ANCHORS) {
    if (a.years <= years) match = a;
    else break;
  }
  return match;
}

/**
 * Pick an anchor given a log2(seconds) value. Kept separate from pickAnchor
 * so callers can feed the log-scale value used by crack-time.js without
 * losing precision for very large entropies.
 */
export function pickAnchorForLog2Seconds(log2s) {
  if (!Number.isFinite(log2s)) return ANCHORS[ANCHORS.length - 1];
  const log2Years = log2s - LOG2_SECONDS_PER_YEAR;
  // If years would be >= the largest anchor's years, pick the last one directly
  // (Math.pow may return Infinity for very large log2Years).
  const lastAnchor = ANCHORS[ANCHORS.length - 1];
  if (log2Years >= Math.log2(lastAnchor.years)) return lastAnchor;
  if (log2Years < 0) return ANCHORS[0];
  return pickAnchor(Math.pow(2, log2Years));
}
