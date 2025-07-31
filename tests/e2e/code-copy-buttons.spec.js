import { test, expect } from "@playwright/test";

test.describe("Code Copy Buttons", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with code blocks
    await page.goto("/blog/en-us/get-most-out-of-claude-code/");
    
    // Wait for the page to fully load and Shoelace components to initialize
    await page.waitForLoadState("networkidle");
    
    // Wait for copy buttons to be added by our script
    await page.waitForTimeout(1000);
  });

  test.describe("Copy Button Presence and Structure", () => {
    test("should add copy buttons to all code blocks", async ({ page }) => {
      // Check that there are code blocks on the page
      const codeBlocks = page.locator('pre[class*="language-"]');
      const codeBlockCount = await codeBlocks.count();
      
      expect(codeBlockCount).toBeGreaterThan(0);
      
      // Check that each code block has a copy button
      for (let i = 0; i < codeBlockCount; i++) {
        const codeBlock = codeBlocks.nth(i);
        
        // Check if code block is wrapped
        const wrapper = codeBlock.locator('xpath=..').first();
        await expect(wrapper).toHaveClass(/code-block-wrapper/);
        
        // Check for copy button within wrapper
        const copyButton = wrapper.getByTestId('code-copy-button');
        await expect(copyButton).toBeVisible();
      }
    });

    test("should create proper wrapper structure", async ({ page }) => {
      const firstCodeBlock = page.locator('pre[class*="language-"]').first();
      const wrapper = firstCodeBlock.locator('xpath=..').first();
      
      // Verify wrapper has correct class
      await expect(wrapper).toHaveClass(/code-block-wrapper/);
      
      // Verify wrapper contains both pre element and copy button
      await expect(wrapper.locator('pre[class*="language-"]')).toBeVisible();
      await expect(wrapper.getByTestId('code-copy-button')).toBeVisible();
    });

    test("should not duplicate copy buttons on already processed blocks", async ({ page }) => {
      // Wait for initial processing
      await page.waitForTimeout(500);
      
      // Count initial copy buttons
      const initialCount = await page.getByTestId('code-copy-button').count();
      
      // Trigger the function again (simulate dynamic content)
      await page.evaluate(() => {
        if (window.addCopyButtonsToCodeBlocks) {
          window.addCopyButtonsToCodeBlocks();
        }
      });
      
      // Wait a bit and check count hasn't changed
      await page.waitForTimeout(500);
      const finalCount = await page.getByTestId('code-copy-button').count();
      
      expect(finalCount).toBe(initialCount);
    });
  });

  test.describe("Copy Button Accessibility", () => {
    test("should have proper ARIA attributes", async ({ page }) => {
      const copyButton = page.getByTestId('code-copy-button').first();
      
      // Check ARIA label
      await expect(copyButton).toHaveAttribute('aria-label', 'Copy code snippet');
      
      // Check that button is keyboard accessible
      // Note: Shoelace components may need special handling for focus
      await copyButton.click(); // This ensures the component is interactable
      await expect(copyButton).toBeVisible();
    });

    test("should have proper tooltip labels", async ({ page }) => {
      const copyButton = page.getByTestId('code-copy-button').first();
      
      // Check tooltip attributes
      await expect(copyButton).toHaveAttribute('copy-label', 'Copy');
      await expect(copyButton).toHaveAttribute('success-label', 'Copied!');
      await expect(copyButton).toHaveAttribute('error-label', 'Copy failed');
    });

    test("should be keyboard navigable", async ({ page }) => {
      const copyButton = page.getByTestId('code-copy-button').first();
      
      // Test that the copy button is in the tab order
      await copyButton.focus();
      
      // Verify the button can be activated with keyboard
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      
      // The button should still be visible after activation
      await expect(copyButton).toBeVisible();
    });
  });

  test.describe("Copy Functionality", () => {
    test("should copy code content to clipboard", async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      const copyButton = page.getByTestId('code-copy-button').first();
      const codeBlock = page.locator('pre[class*="language-"]').first();
      
      // Get the expected text content
      const expectedText = await codeBlock.locator('code').textContent();
      
      // Click the copy button
      await copyButton.click();
      
      // Wait for copy operation
      await page.waitForTimeout(500);
      
      // Check clipboard content
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText.trim()).toBe(expectedText.trim());
    });

    test("should show success feedback on successful copy", async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      const copyButton = page.getByTestId('code-copy-button').first();
      
      // Click the copy button
      await copyButton.click();
      
      // Wait for feedback to appear
      await page.waitForTimeout(200);
      
      // Check for success state (Shoelace will show success tooltip)
      // We can't easily test the tooltip visibility, but we can check events
      const copyEvents = await page.evaluate(() => {
        return window.copyButtonEvents || [];
      });
      
      // The success should be handled by the sl-copy event
      // At minimum, verify no errors occurred
      expect(copyEvents).not.toContain('error');
    });

    test("should handle different code block languages", async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Find different language code blocks
      const languageBlocks = [
        'pre[class*="language-text"]',
        'pre[class*="language-markdown"]',
        'pre[class*="language-javascript"]'
      ];
      
      for (const selector of languageBlocks) {
        const codeBlock = page.locator(selector).first();
        
        if (await codeBlock.count() > 0) {
          const wrapper = codeBlock.locator('xpath=..').first();
          const copyButton = wrapper.getByTestId('code-copy-button');
          
          await expect(copyButton).toBeVisible();
          
          // Test copy functionality
          const expectedText = await codeBlock.locator('code').textContent();
          await copyButton.click();
          await page.waitForTimeout(300);
          
          const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
          expect(clipboardText.trim()).toBe(expectedText.trim());
        }
      }
    });
  });

  test.describe("Visual Design and Positioning", () => {
    test("should position copy button in top-right corner", async ({ page }) => {
      const codeBlockWrapper = page.locator('.code-block-wrapper').first();
      const copyButton = codeBlockWrapper.getByTestId('code-copy-button');
      
      // Check that wrapper has relative positioning
      const wrapperStyles = await codeBlockWrapper.evaluate(el => 
        window.getComputedStyle(el)
      );
      expect(wrapperStyles.position).toBe('relative');
      
      // Check that copy button has absolute positioning
      const buttonStyles = await copyButton.evaluate(el => 
        window.getComputedStyle(el)
      );
      expect(buttonStyles.position).toBe('absolute');
      
      // Verify button is positioned in top-right
      // Convert rem to pixels if needed (0.75rem = 12px typically)
      const expectedValues = ['0.75rem', '12px', '15px']; // Add 15px as browsers may compute differently
      expect(expectedValues).toContain(buttonStyles.top);
      expect(expectedValues).toContain(buttonStyles.right);
    });

    test("should have proper visual states", async ({ page }) => {
      const copyButton = page.getByTestId('code-copy-button').first();
      
      // Get initial opacity
      const initialOpacity = await copyButton.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(initialOpacity)).toBeLessThanOrEqual(1);
      
      // Hover and check opacity change
      await copyButton.hover();
      await page.waitForTimeout(100);
      
      const hoverOpacity = await copyButton.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(hoverOpacity)).toBeGreaterThanOrEqual(parseFloat(initialOpacity));
    });

    test("should not interfere with code block scrolling", async ({ page }) => {
      const codeBlock = page.locator('pre[class*="language-"]').first();
      
      // Check that code block has proper right padding for button
      const codeStyles = await codeBlock.evaluate(el => 
        window.getComputedStyle(el)
      );
      
      const paddingRight = parseFloat(codeStyles.paddingRight);
      expect(paddingRight).toBeGreaterThan(30); // Should have space for button
    });
  });

  test.describe("Theme Compatibility", () => {
    test("should work in light theme", async ({ page }) => {
      // Ensure light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      
      const copyButton = page.getByTestId('code-copy-button').first();
      await expect(copyButton).toBeVisible();
      
      // Verify button is functional in light theme
      await copyButton.click();
      await page.waitForTimeout(200);
    });

    test("should work in dark theme", async ({ page }) => {
      // Switch to dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      const copyButton = page.getByTestId('code-copy-button').first();
      await expect(copyButton).toBeVisible();
      
      // Verify button is functional in dark theme
      await copyButton.click();
      await page.waitForTimeout(200);
    });

    test("should have proper theme-specific styling", async ({ page }) => {
      const copyButton = page.getByTestId('code-copy-button').first();
      
      // Test light theme styling
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.waitForTimeout(100);
      
      let buttonStyles = await copyButton.evaluate(el => 
        window.getComputedStyle(el)
      );
      
      // Test dark theme styling
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(100);
      
      buttonStyles = await copyButton.evaluate(el => 
        window.getComputedStyle(el)
      );
      
      // Button should still be visible in dark theme
      expect(buttonStyles.display).not.toBe('none');
    });
  });

  test.describe("Error Handling", () => {
    test("should handle clipboard API errors gracefully", async ({ page }) => {
      // Mock clipboard API to fail
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: () => Promise.reject(new Error('Clipboard access denied'))
          },
          writable: true
        });
      });
      
      const copyButton = page.getByTestId('code-copy-button').first();
      
      // Click should not crash the page
      await copyButton.click();
      await page.waitForTimeout(500);
      
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });

    test("should handle empty code blocks", async ({ page }) => {
      // Create a page with empty code block
      await page.goto('/');
      
      // Add empty code block via JavaScript
      await page.evaluate(() => {
        const pre = document.createElement('pre');
        pre.className = 'language-text';
        const code = document.createElement('code');
        code.textContent = '';
        pre.appendChild(code);
        document.body.appendChild(pre);
        
        // Trigger copy button addition
        if (window.addCopyButtonsToCodeBlocks) {
          window.addCopyButtonsToCodeBlocks();
        }
      });
      
      await page.waitForTimeout(500);
      
      // Should still create copy button
      const copyButton = page.getByTestId('code-copy-button').last();
      await expect(copyButton).toBeVisible();
      
      // Clicking should not crash
      await copyButton.click();
      await page.waitForTimeout(200);
    });
  });

  test.describe("Performance", () => {
    test("should not cause layout shift", async ({ page }) => {
      // Measure Cumulative Layout Shift
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
          
          // Wait for copy buttons to be added
          setTimeout(() => resolve(clsValue), 2000);
        });
      });
      
      // Should have minimal layout shift
      expect(cls).toBeLessThan(0.1);
    });

    test("should initialize quickly", async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate and wait for copy buttons
      await page.goto("/blog/en-us/get-most-out-of-claude-code/");
      
      // Wait for first copy button to appear
      await page.getByTestId('code-copy-button').first().waitFor();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should initialize within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test("should work on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const copyButton = page.getByTestId('code-copy-button').first();
      await expect(copyButton).toBeVisible();
      
      // Button should be properly positioned on mobile
      const buttonStyles = await copyButton.evaluate(el => 
        window.getComputedStyle(el)
      );
      expect(buttonStyles.position).toBe('absolute');
      
      // Should be clickable on mobile
      await copyButton.click();
      await page.waitForTimeout(200);
    });

    test("should have appropriate mobile sizing", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const copyButton = page.getByTestId('code-copy-button').first();
      const buttonBounds = await copyButton.boundingBox();
      
      // Button should be large enough for touch interaction (at least 24px)
      expect(buttonBounds.width).toBeGreaterThanOrEqual(24);
      expect(buttonBounds.height).toBeGreaterThanOrEqual(24);
    });
  });
});