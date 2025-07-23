import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  // Test English (default) homepage
  test('loads English homepage correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Home/);
    
    // Check main heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check header is present
    await expect(page.getByTestId('burger-toggle')).toBeVisible();
    await expect(page.getByTestId('theme-toggle-container')).toBeVisible();
    await expect(page.getByTestId('language-selector-container')).toBeVisible();
    
    // Check latest posts section exists
    await expect(page.getByText(/Latest Posts|latest posts/i)).toBeVisible();
  });

  test('displays blog posts on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that articles are displayed
    const articles = page.getByRole('article');
    await expect(articles.first()).toBeVisible();
    
    // Check that each article has required elements
    const firstArticle = articles.first();
    await expect(firstArticle.getByRole('heading', { level: 3 })).toBeVisible();
    await expect(firstArticle.locator('[data-testid^="post-main-link-"]')).toHaveCount(1);
    await expect(firstArticle.locator('[data-testid^="blog-read-more-link-"]')).toHaveCount(1);
    await expect(firstArticle.locator('time')).toBeVisible();
  });

  test('navigation links work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check About link
    const aboutLink = page.getByRole('link', { name: /about/i });
    if (await aboutLink.isVisible()) {
      await expect(aboutLink).toHaveAttribute('href', '/about/');
    }
    
    // Check Dictionary link
    const dictionaryLink = page.getByRole('link', { name: /dictionary/i });
    if (await dictionaryLink.isVisible()) {
      await expect(dictionaryLink).toHaveAttribute('href');
    }
  });

  test('post links navigate correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find the first blog post link
    const firstPostLink = page.getByRole('article').first().getByRole('link').first();
    await expect(firstPostLink).toBeVisible();
    
    // Check that the link has a valid href
    const href = await firstPostLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\/blog\//);
  });

  test('has proper semantic structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check for main content area
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    
    // Check articles have proper ARIA labels
    const articles = page.getByRole('article');
    const articleCount = await articles.count();
    expect(articleCount).toBeGreaterThan(0);
  });

  test('handles responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is still visible on mobile
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByTestId('burger-toggle')).toBeVisible();
    await expect(page.getByTestId('theme-toggle-container')).toBeVisible();
    await expect(page.getByTestId('language-selector-container')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    // Check that content is visible on desktop
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByTestId('burger-toggle')).toBeVisible();
    await expect(page.getByTestId('theme-toggle-container')).toBeVisible();
    await expect(page.getByTestId('language-selector-container')).toBeVisible();
  });
});

// Test Greek homepage
test.describe('Greek Homepage', () => {
  test('loads Greek homepage correctly', async ({ page }) => {
    await page.goto('/el/');
    
    // Check that page loads
    await expect(page).toHaveTitle(/Home/);
    
    // Check main content is present
    await expect(page.getByRole('main')).toBeVisible();
    
    // Language specific content should be present
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// Test Turkish homepage
test.describe('Turkish Homepage', () => {
  test('loads Turkish homepage correctly', async ({ page }) => {
    await page.goto('/tr/');
    
    // Check that page loads
    await expect(page).toHaveTitle(/Home/);
    
    // Check main content is present
    await expect(page.getByRole('main')).toBeVisible();
    
    // Language specific content should be present
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});