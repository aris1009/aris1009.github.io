import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseWordlist,
  verifyAndParse,
  loadWordlist,
  WordlistIntegrityError,
  WordlistParseError
} from 'src/_static/js/tools/diceware/wordlist-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wordlistPath = path.resolve(
  __dirname,
  '../../../../src/_static/wordlists/eff_large_wordlist-v1.txt'
);
const WORDLIST_BYTES = readFileSync(wordlistPath);
const WORDLIST_SHA256 = 'addd35536511597a02fa0a9ff1e5284677b8883b83e986e43f15a3db996b903e';

describe('parseWordlist', () => {
  it('parses EFF large wordlist: 7776 entries', () => {
    const map = parseWordlist(WORDLIST_BYTES.toString('utf8'));
    expect(map.size).toBe(7776);
    expect(map.get('11111')).toBe('abacus');
    expect(map.get('66666')).toBe('zoom');
  });

  it('rejects missing tab separator', () => {
    expect(() => parseWordlist('11111 abacus\n')).toThrow(WordlistParseError);
  });

  it('rejects invalid dice key', () => {
    expect(() => parseWordlist('11711\tabacus\n')).toThrow(WordlistParseError);
    expect(() => parseWordlist('1111\tabacus\n')).toThrow(WordlistParseError);
  });

  it('rejects invalid word characters', () => {
    expect(() => parseWordlist('11111\tAbacus\n')).toThrow(WordlistParseError);
    expect(() => parseWordlist('11111\tabacus!\n')).toThrow(WordlistParseError);
  });

  it('rejects duplicate keys', () => {
    expect(() => parseWordlist('11111\tabacus\n11111\tabdomen\n')).toThrow(WordlistParseError);
  });

  it('tolerates trailing CR (CRLF input)', () => {
    const map = parseWordlist('11111\tabacus\r\n11112\tabdomen\r\n');
    expect(map.get('11111')).toBe('abacus');
    expect(map.get('11112')).toBe('abdomen');
  });
});

describe('verifyAndParse', () => {
  it('parses when hash matches', async () => {
    const map = await verifyAndParse(WORDLIST_BYTES, WORDLIST_SHA256, webcrypto.subtle);
    expect(map.size).toBe(7776);
  });

  it('throws WordlistIntegrityError when hash mismatches', async () => {
    const bogus = '0'.repeat(64);
    await expect(
      verifyAndParse(WORDLIST_BYTES, bogus, webcrypto.subtle)
    ).rejects.toBeInstanceOf(WordlistIntegrityError);
  });

  it('throws WordlistIntegrityError when bytes tampered', async () => {
    const tampered = Buffer.from(WORDLIST_BYTES);
    tampered[0] = (tampered[0] + 1) & 0xff;
    await expect(
      verifyAndParse(tampered, WORDLIST_SHA256, webcrypto.subtle)
    ).rejects.toBeInstanceOf(WordlistIntegrityError);
  });
});

describe('loadWordlist', () => {
  function makeFakeResponse(bytes) {
    let consumed = false;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      clone() {
        return makeFakeResponse(bytes);
      },
      async arrayBuffer() {
        if (consumed) throw new Error('already consumed');
        consumed = true;
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      }
    };
  }

  function makeFakeCache() {
    const store = new Map();
    return {
      store,
      async open() {
        return this;
      },
      async match(url) {
        return store.get(url);
      },
      async put(url, res) {
        store.set(url, res);
      }
    };
  }

  it('fetches on first call, reuses cache on second call', async () => {
    const url = '/wordlists/eff_large_wordlist-v1.txt';
    let fetchCount = 0;
    const fetchImpl = async () => {
      fetchCount++;
      return makeFakeResponse(WORDLIST_BYTES);
    };
    const cachesImpl = makeFakeCache();

    const map1 = await loadWordlist({
      url,
      expectedSha256: WORDLIST_SHA256,
      deps: { fetchImpl, cachesImpl, subtle: webcrypto.subtle }
    });
    expect(map1.size).toBe(7776);
    expect(fetchCount).toBe(1);

    const map2 = await loadWordlist({
      url,
      expectedSha256: WORDLIST_SHA256,
      deps: { fetchImpl, cachesImpl, subtle: webcrypto.subtle }
    });
    expect(map2.size).toBe(7776);
    expect(fetchCount).toBe(1); // served from cache
  });

  it('propagates integrity errors without populating cache', async () => {
    const url = '/wordlists/eff_large_wordlist-v1.txt';
    const fetchImpl = async () => makeFakeResponse(WORDLIST_BYTES);
    const cachesImpl = makeFakeCache();

    await expect(
      loadWordlist({
        url,
        expectedSha256: '0'.repeat(64),
        deps: { fetchImpl, cachesImpl, subtle: webcrypto.subtle }
      })
    ).rejects.toBeInstanceOf(WordlistIntegrityError);

    expect(cachesImpl.store.has(url)).toBe(false);
  });
});
