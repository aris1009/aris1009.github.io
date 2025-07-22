import { describe, it, expect, vi } from 'vitest';
import { postsEn_us, postsEl, postsTr, allPosts } from '../../lib/collections.js';

describe('collections', () => {
  const mockCollectionApi = {
    getFilteredByGlob: vi.fn()
  };

  const samplePosts = [
    { data: { draft: false }, date: new Date('2023-01-01') },
    { data: { draft: true }, date: new Date('2023-01-02') },
    { data: { draft: false }, date: new Date('2023-01-03') }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('postsEn_us', () => {
    it('should return non-draft English posts', () => {
      mockCollectionApi.getFilteredByGlob.mockReturnValue(samplePosts);
      
      const result = postsEn_us(mockCollectionApi);
      
      expect(mockCollectionApi.getFilteredByGlob).toHaveBeenCalledWith('src/blog/en/*.md');
      expect(result).toHaveLength(2);
      expect(result.every(post => !post.data.draft)).toBe(true);
    });
  });

  describe('postsEl', () => {
    it('should return non-draft Greek posts', () => {
      mockCollectionApi.getFilteredByGlob.mockReturnValue(samplePosts);
      
      const result = postsEl(mockCollectionApi);
      
      expect(mockCollectionApi.getFilteredByGlob).toHaveBeenCalledWith('src/blog/el/*.md');
      expect(result).toHaveLength(2);
      expect(result.every(post => !post.data.draft)).toBe(true);
    });
  });

  describe('postsTr', () => {
    it('should return non-draft Turkish posts', () => {
      mockCollectionApi.getFilteredByGlob.mockReturnValue(samplePosts);
      
      const result = postsTr(mockCollectionApi);
      
      expect(mockCollectionApi.getFilteredByGlob).toHaveBeenCalledWith('src/blog/tr/*.md');
      expect(result).toHaveLength(2);
      expect(result.every(post => !post.data.draft)).toBe(true);
    });
  });

  describe('allPosts', () => {
    it('should return all non-draft posts sorted by date descending', () => {
      const enPosts = [
        { data: { draft: false }, date: new Date('2023-01-01') },
        { data: { draft: true }, date: new Date('2023-01-02') }
      ];
      const elPosts = [
        { data: { draft: false }, date: new Date('2023-01-03') }
      ];
      const trPosts = [
        { data: { draft: false }, date: new Date('2023-01-04') }
      ];

      mockCollectionApi.getFilteredByGlob
        .mockReturnValueOnce(enPosts)
        .mockReturnValueOnce(elPosts)
        .mockReturnValueOnce(trPosts);
      
      const result = allPosts(mockCollectionApi);
      
      expect(mockCollectionApi.getFilteredByGlob).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
      expect(result.every(post => !post.data.draft)).toBe(true);
      expect(result[0].date.getTime()).toBeGreaterThan(result[1].date.getTime());
    });
  });
});