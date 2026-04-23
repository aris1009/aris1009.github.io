import { describe, it, expect } from 'vitest';
import {
  ANCHORS,
  pickAnchor,
  pickAnchorForLog2Seconds
} from 'src/_static/js/tools/diceware/anchors.js';

describe('ANCHORS table', () => {
  it('is monotonically increasing by years', () => {
    for (let i = 1; i < ANCHORS.length; i++) {
      expect(ANCHORS[i].years).toBeGreaterThan(ANCHORS[i - 1].years);
    }
  });

  it('includes Parthenon and fall-of-Constantinople anchors', () => {
    expect(ANCHORS.some((a) => /Parthenon/.test(a.phrase))).toBe(true);
    expect(ANCHORS.some((a) => /Constantinople/.test(a.phrase))).toBe(true);
  });
});

describe('pickAnchor', () => {
  it('returns floor-anchor for typical values', () => {
    expect(pickAnchor(2500).phrase).toMatch(/Parthenon/);
    expect(pickAnchor(600).phrase).toMatch(/Constantinople/);
  });

  it('exact boundary: value equal to anchor years selects that anchor', () => {
    const a = pickAnchor(2464);
    expect(a.years).toBe(2464);
  });

  it('one below boundary selects the prior anchor', () => {
    const a = pickAnchor(2463);
    expect(a.years).toBeLessThan(2464);
  });

  it('below smallest anchor returns the first anchor', () => {
    expect(pickAnchor(0).years).toBe(0);
  });

  it('huge values select the last anchor', () => {
    const last = ANCHORS[ANCHORS.length - 1];
    expect(pickAnchor(1e30)).toBe(last);
  });

  it('non-finite years returns first anchor', () => {
    expect(pickAnchor(NaN).years).toBe(0);
    expect(pickAnchor(-1).years).toBe(0);
  });
});

describe('pickAnchorForLog2Seconds', () => {
  const SECONDS_PER_YEAR = 365.25 * 86400;

  it('matches pickAnchor for finite values', () => {
    const years = 2500;
    const log2s = Math.log2(years * SECONDS_PER_YEAR);
    expect(pickAnchorForLog2Seconds(log2s)).toEqual(pickAnchor(years));
  });

  it('huge log2s returns the final cosmic anchor', () => {
    expect(pickAnchorForLog2Seconds(10000)).toBe(ANCHORS[ANCHORS.length - 1]);
  });

  it('negative log2s returns first anchor', () => {
    expect(pickAnchorForLog2Seconds(-100).years).toBe(0);
  });
});
