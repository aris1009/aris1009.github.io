import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFrontmatter, checkDrift } from '../../../scripts/check-seed-drift.js';

describe('check-seed-drift.js', () => {
  describe('parseFrontmatter', () => {
    it('returns null when the doc has no frontmatter block', () => {
      expect(parseFrontmatter('# Just a heading\n\nBody.')).toBeNull();
    });

    it('parses simple string fields', () => {
      const raw = '---\nstatus: Candidate\nslug: foo-bar\n---\n\n# body';
      expect(parseFrontmatter(raw)).toEqual({
        status: 'Candidate',
        slug: 'foo-bar',
      });
    });

    it('strips surrounding quotes from quoted values', () => {
      const raw = '---\ntitle: "With: colon"\nsource_ref: \'abc\'\n---\n';
      expect(parseFrontmatter(raw)).toEqual({
        title: 'With: colon',
        source_ref: 'abc',
      });
    });
  });

  describe('checkDrift', () => {
    let tmp;
    let seedsDir;
    let postsDir;

    beforeEach(() => {
      tmp = mkdtempSync(join(tmpdir(), 'seed-drift-'));
      seedsDir = join(tmp, 'Blog Seeds');
      postsDir = join(tmp, 'src/blog/en-us');
      mkdirSync(seedsDir, { recursive: true });
      mkdirSync(postsDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tmp, { recursive: true, force: true });
    });

    function seed(name, body) {
      writeFileSync(join(seedsDir, name), body);
    }

    function post(slug) {
      writeFileSync(join(postsDir, `${slug}.md`), '# post\n');
    }

    it('reports no drift when all Drafted seeds have matching posts + pr_url', () => {
      seed(
        'one.md',
        '---\nstatus: Drafted\nslug: alpha\npr_url: https://github.com/x/y/pull/1\n---\n',
      );
      post('alpha');
      const { drift, scanned } = checkDrift(seedsDir, postsDir);
      expect(scanned).toBe(1);
      expect(drift).toEqual([]);
    });

    it('ignores Candidate and Published seeds', () => {
      seed('c.md', '---\nstatus: Candidate\nslug: c\n---\n');
      seed('p.md', '---\nstatus: Published\nslug: p\n---\n');
      const { drift } = checkDrift(seedsDir, postsDir);
      expect(drift).toEqual([]);
    });

    it('flags a Drafted seed missing pr_url', () => {
      seed('x.md', '---\nstatus: Drafted\nslug: x\n---\n');
      post('x');
      const { drift } = checkDrift(seedsDir, postsDir);
      expect(drift).toHaveLength(1);
      expect(drift[0].reason).toMatch(/pr_url/);
    });

    it('flags a Drafted seed with no matching post', () => {
      seed(
        'y.md',
        '---\nstatus: Drafted\nslug: ghost\npr_url: https://github.com/x/y/pull/1\n---\n',
      );
      const { drift } = checkDrift(seedsDir, postsDir);
      expect(drift).toHaveLength(1);
      expect(drift[0].reason).toMatch(/no matching post/);
    });

    it('flags a seed with no frontmatter', () => {
      seed('legacy.md', '# Just a heading\n');
      const { drift } = checkDrift(seedsDir, postsDir);
      expect(drift).toHaveLength(1);
      expect(drift[0].reason).toMatch(/missing frontmatter/);
    });

    it('ignores README.md in the seeds directory', () => {
      seed('README.md', '---\nstatus: Drafted\nslug: readme\n---\n');
      const { scanned } = checkDrift(seedsDir, postsDir);
      expect(scanned).toBe(0);
    });
  });
});
