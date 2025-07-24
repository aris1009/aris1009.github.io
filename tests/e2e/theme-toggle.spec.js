import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean slate - remove any theme preference
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('theme');
    });
    await page.reload();
  });

  test('theme toggle button is visible and accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check theme toggle container and button are visible
    const toggleContainer = page.getByTestId('theme-toggle-container');
    const toggleButton = page.locator('#theme-toggle');
    
    await expect(toggleContainer).toBeVisible();
    await expect(toggleButton).toBeVisible();
    
    // Check accessibility attributes
    await expect(toggleButton).toHaveAttribute('aria-label');
    // Button elements have implicit role='button', no need to check explicitly
  });

  test('initial theme respects system preference', async ({ page, context }) => {
    // Set system preference to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    // Check that html element has dark class
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    await expect(htmlElement).toHaveClass(/sl-theme-dark/);
  });

  test('initial theme respects light system preference', async ({ page }) => {
    // Set system preference to light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    
    // Wait for theme manager to initialize and apply theme
    await page.waitForFunction(() => window.themeManager !== undefined);
    
    // Check that html element does not have dark classes
    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
    await expect(htmlElement).not.toHaveClass(/sl-theme-dark/);
  });

  test('clicking theme toggle switches from light to dark mode', async ({ page }) => {
    // Start with light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    
    // Wait for theme initialization and force light theme
    await page.waitForFunction(() => window.themeManager !== undefined);
    await page.evaluate(() => {
      window.themeManager.setTheme('light');
    });
    
    // Verify starting state (light mode)
    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
    await expect(htmlElement).not.toHaveClass(/sl-theme-dark/);
    
    // Click the theme toggle button
    const toggleButton = page.locator('#theme-toggle');
    await toggleButton.click();
    
    // Wait for theme transition
    
    // Verify dark mode classes are added
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    await expect(htmlElement).toHaveClass(/sl-theme-dark/);
    
    // Verify localStorage was updated
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBe('dark');
  });

  test('clicking theme toggle switches from dark to light mode', async ({ page }) => {
    // Start with dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    // Wait for initial theme to be applied
    
    // Verify starting state (dark mode)
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    await expect(htmlElement).toHaveClass(/sl-theme-dark/);
    
    // Click the theme toggle button
    const toggleButton = page.locator('#theme-toggle');
    await toggleButton.click();
    
    // Wait for theme transition
    
    // Verify dark mode classes are removed
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
    await expect(htmlElement).not.toHaveClass(/sl-theme-dark/);
    
    // Verify localStorage was updated
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBe('light');
  });

  test('multiple toggle clicks alternate themes correctly', async ({ page }) => {
    await page.goto('/');
    
    const htmlElement = page.locator('html');
    const toggleButton = page.locator('#theme-toggle');
    
    // Initial state should be light (assuming no system dark preference)
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await page.waitForFunction(() => window.themeManager !== undefined);
    
    // Force light theme to ensure consistent starting state
    await page.evaluate(() => {
      window.themeManager.setTheme('light');
    });
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
    
    // First click: light -> dark
    await toggleButton.click();
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    await expect(htmlElement).toHaveClass(/sl-theme-dark/);
    
    // Second click: dark -> light
    await toggleButton.click();
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
    await expect(htmlElement).not.toHaveClass(/sl-theme-dark/);
    
    // Third click: light -> dark
    await toggleButton.click();
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    await expect(htmlElement).toHaveClass(/sl-theme-dark/);
  });

  test('theme preference persists across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Set to dark mode
    const toggleButton = page.locator('#theme-toggle');
    await toggleButton.click();
    
    // Verify dark mode is active
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    
    // Reload the page
    await page.reload();
    
    // Verify dark mode is still active after reload
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    await expect(htmlElement).toHaveClass(/sl-theme-dark/);
  });

  test('theme toggle works with keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    const htmlElement = page.locator('html');
    const toggleButton = page.locator('#theme-toggle');
    
    // Focus the toggle button using keyboard
    await toggleButton.focus();
    await expect(toggleButton).toBeFocused();
    
    // Activate with Enter key
    await page.keyboard.press('Enter');
    
    // Verify theme changed
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    
    // Activate with Space key to toggle back
    await page.keyboard.press('Space');
    
    // Verify theme changed back
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
  });

  test('theme toggle works on different viewport sizes', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const htmlElement = page.locator('html');
    const toggleButton = page.locator('#theme-toggle');
    
    // Verify toggle is visible on mobile
    await expect(toggleButton).toBeVisible();
    
    // Test toggle functionality on mobile
    await toggleButton.click();
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Verify toggle still works on desktop
    await toggleButton.click();
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
  });

  test('theme toggle works across different language pages', async ({ page }) => {
    // Test on English page
    await page.goto('/');
    const toggleButton = page.locator('#theme-toggle');
    await toggleButton.click();
    
    let htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    
    // Navigate to Greek page
    await page.goto('/el/');
    
    // Verify theme persists
    htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    
    // Navigate to Turkish page
    await page.goto('/tr/');
    
    // Verify theme still persists
    htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/\bdark\b/);
  });

  test('theme classes are added and removed correctly', async ({ page }) => {
    await page.goto('/');
    
    const htmlElement = page.locator('html');
    const toggleButton = page.locator('#theme-toggle');
    
    // Verify initial state (should be light)
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    
    // Wait for theme initialization
    await page.waitForFunction(() => window.themeManager !== undefined);
    
    // Force light theme to ensure consistent starting state
    await page.evaluate(() => {
      window.themeManager.setTheme('light');
    });
    
    // Check that neither dark class is present initially
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
    await expect(htmlElement).not.toHaveClass(/sl-theme-dark/);
    
    // Toggle to dark mode
    await toggleButton.click();
    
    // Check that both dark classes are present
    await expect(htmlElement).toHaveClass(/\bdark\b/);
    await expect(htmlElement).toHaveClass(/sl-theme-dark/);
    
    // Toggle back to light mode
    await toggleButton.click();
    
    // Check that dark classes are removed
    await expect(htmlElement).not.toHaveClass(/\bdark\b/);
    await expect(htmlElement).not.toHaveClass(/sl-theme-dark/);
  });

  test('FOUC prevention - theme applied before content loads', async ({ page }) => {
    // Set a theme preference in localStorage before navigation
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    // Navigate to a new page
    await page.goto('/about/', { waitUntil: 'domcontentloaded' });
    
    // Check that dark theme is applied immediately (no flash)
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/\bdark\b/);
  });
});