/**
 * Wordlist loader with SHA-256 integrity verification and Cache Storage reuse.
 * Browser ESM. Pure except for fetch + crypto.subtle + caches.
 */

export class WordlistIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WordlistIntegrityError';
  }
}

export class WordlistParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WordlistParseError';
  }
}

const CACHE_NAME = 'diceware-wordlists-v1';

function bytesToHex(buf) {
  const view = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < view.length; i++) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out;
}

export function parseWordlist(text) {
  const map = new Map();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.length === 0) continue;
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (line.length === 0) continue;
    const tab = line.indexOf('\t');
    if (tab < 1) {
      throw new WordlistParseError(`malformed line ${i + 1}: missing tab separator`);
    }
    const key = line.slice(0, tab);
    const word = line.slice(tab + 1);
    if (!/^[1-6]{5}$/.test(key)) {
      throw new WordlistParseError(`malformed line ${i + 1}: invalid dice key "${key}"`);
    }
    if (!/^[a-z][a-z0-9-]*$/.test(word)) {
      throw new WordlistParseError(`malformed line ${i + 1}: invalid word "${word}"`);
    }
    if (map.has(key)) {
      throw new WordlistParseError(`malformed line ${i + 1}: duplicate key "${key}"`);
    }
    map.set(key, word);
  }
  return map;
}

export async function verifyAndParse(bytes, expectedSha256, subtle) {
  const digest = await subtle.digest('SHA-256', bytes);
  const actual = bytesToHex(digest);
  if (actual !== expectedSha256.toLowerCase()) {
    throw new WordlistIntegrityError(
      `wordlist hash mismatch: expected ${expectedSha256}, got ${actual}`
    );
  }
  const text = new TextDecoder('utf-8').decode(bytes);
  return parseWordlist(text);
}

/**
 * Load a pinned wordlist, using Cache Storage on subsequent loads.
 * @param {object} opts
 * @param {string} opts.url - versioned URL
 * @param {string} opts.expectedSha256 - lowercase hex digest
 * @param {object} [opts.deps] - injectable for tests
 * @returns {Promise<Map<string,string>>}
 */
export async function loadWordlist({ url, expectedSha256, deps = {} }) {
  const {
    fetchImpl = globalThis.fetch?.bind(globalThis),
    cachesImpl = globalThis.caches,
    subtle = globalThis.crypto?.subtle
  } = deps;

  if (!fetchImpl) throw new Error('fetch is unavailable');
  if (!subtle) throw new Error('crypto.subtle is unavailable');

  let response;
  let cache;
  if (cachesImpl) {
    cache = await cachesImpl.open(CACHE_NAME);
    response = await cache.match(url);
  }
  if (!response) {
    response = await fetchImpl(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`wordlist fetch failed: ${response.status} ${response.statusText}`);
    }
  }

  const cloned = response.clone();
  const bytes = await cloned.arrayBuffer();
  const map = await verifyAndParse(bytes, expectedSha256, subtle);

  if (cache) {
    try {
      await cache.put(url, response);
    } catch {
      // cache.put on a used Response throws; ignore, we already have the map
    }
  }
  return map;
}
