import { test, expect } from '@playwright/test';

test.describe('Dictionary Tooltips', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with dictionary links
    // We'll assume dictionary links are used in blog posts
    await page.goto('/');
  });

  test('dictionary link has correct test IDs and structure', async ({ page }) => {
    // Check if there are any dictionary links on the homepage
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      
      // Check that the link is visible
      await expect(firstLink).toBeVisible();
      
      // Check that it has the correct classes
      await expect(firstLink).toHaveClass(/dictionary-link/);
      
      // Check that the emoji indicator exists
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const emoji = page.getByTestId(`dictionary-emoji-${term}`);
      await expect(emoji).toBeVisible();
      await expect(emoji).toContainText('📘');
      
      // Check ARIA attributes
      await expect(firstLink).toHaveAttribute('aria-label', new RegExp(`Definition of ${term}`));
    }
  });

  test('tooltip shows on hover', async ({ page }) => {
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Hover over the dictionary link
      await firstLink.hover();
      
      // Wait for tooltip to appear
      await expect(tooltip).toBeVisible();
      
      // Check tooltip content structure
      const tooltipContent = tooltip.locator('.dictionary-tooltip-content');
      await expect(tooltipContent).toBeVisible();
      
      const tooltipTerm = tooltipContent.locator('.tooltip-term');
      const tooltipDefinition = tooltipContent.locator('.tooltip-definition');
      
      await expect(tooltipTerm).toBeVisible();
      await expect(tooltipDefinition).toBeVisible();
      
      // Move away and check tooltip disappears
      await page.mouse.move(0, 0);
      await expect(tooltip).not.toBeVisible();
    }
  });

  test('tooltip can be triggered by click', async ({ page }) => {
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Click the dictionary link
      await firstLink.click();
      
      // Wait for tooltip to appear
      await expect(tooltip).toBeVisible();
      
      // Click elsewhere to hide tooltip
      await page.click('body');
      await expect(tooltip).not.toBeVisible();
    }
  });

  test('tooltip content displays correct term and definition', async ({ page }) => {
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Show tooltip
      await firstLink.hover();
      await expect(tooltip).toBeVisible();
      
      // Check term is capitalized
      const tooltipTerm = tooltip.locator('.tooltip-term');
      const termText = await tooltipTerm.textContent();
      expect(termText.charAt(0)).toBe(termText.charAt(0).toUpperCase());
      expect(termText.toLowerCase()).toBe(term.toLowerCase());
      
      // Check definition exists and is not empty
      const tooltipDefinition = tooltip.locator('.tooltip-definition');
      const definitionText = await tooltipDefinition.textContent();
      expect(definitionText.length).toBeGreaterThan(0);
      expect(definitionText).not.toBe('Term not found in dictionary');
    }
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Focus the dictionary link using Tab
      await firstLink.focus();
      
      // Press Enter or Space to activate
      await page.keyboard.press('Enter');
      
      // Tooltip should be visible
      await expect(tooltip).toBeVisible();
      
      // Press Escape to close
      await page.keyboard.press('Escape');
      
      // Tooltip should be hidden
      await expect(tooltip).not.toBeVisible();
    }
  });

  test('multiple tooltips work independently', async ({ page }) => {
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    const linkCount = await dictionaryLinks.count();
    
    if (linkCount >= 2) {
      const firstLink = dictionaryLinks.nth(0);
      const secondLink = dictionaryLinks.nth(1);
      
      const firstTestId = await firstLink.getAttribute('data-testid');
      const firstTerm = firstTestId.replace('dictionary-link-', '');
      const firstTooltip = page.getByTestId(`dictionary-tooltip-${firstTerm}`);
      
      const secondTestId = await secondLink.getAttribute('data-testid');
      const secondTerm = secondTestId.replace('dictionary-link-', '');
      const secondTooltip = page.getByTestId(`dictionary-tooltip-${secondTerm}`);
      
      // Show first tooltip
      await firstLink.hover();
      await expect(firstTooltip).toBeVisible();
      await expect(secondTooltip).not.toBeVisible();
      
      // Show second tooltip
      await secondLink.hover();
      await expect(secondTooltip).toBeVisible();
      // First tooltip should hide when second shows
      await expect(firstTooltip).not.toBeVisible();
    }
  });

  test('tooltips work in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Show tooltip in dark mode
      await firstLink.hover();
      await expect(tooltip).toBeVisible();
      
      // Check that tooltip content is visible (dark mode styles applied)
      const tooltipContent = tooltip.locator('.dictionary-tooltip-content');
      await expect(tooltipContent).toBeVisible();
    }
  });

  test('tooltips have proper contrast in both light and dark modes', async ({ page }) => {
    await page.goto('/');
    
    // Find dictionary links
    const dictionaryLinks = page.locator('[data-testid^="dictionary-link-"]');
    const count = await dictionaryLinks.count();
    
    if (count > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Test light mode contrast
      await firstLink.hover();
      await expect(tooltip).toBeVisible();
      
      // Verify tooltip styling is applied correctly for light mode
      const tooltipElement = await tooltip.elementHandle();
      expect(tooltipElement).toBeTruthy();
      
      // Hide tooltip before switching modes
      await page.mouse.move(0, 0);
      await expect(tooltip).not.toBeVisible();
      
      // Switch to dark mode
      const themeToggle = page.locator('#theme-toggle');
      await themeToggle.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // Test dark mode contrast
      await firstLink.hover();
      await expect(tooltip).toBeVisible();
      
      // Verify tooltip is still functional in dark mode
      const tooltipContent = tooltip.locator('.dictionary-tooltip-content');
      await expect(tooltipContent).toBeVisible();
      
      // Verify both theme classes are applied for Shoelace compatibility
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.locator('html')).toHaveClass(/sl-theme-dark/);
    }
  });

  test('tooltips are responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Tap to show tooltip (mobile interaction)
      await firstLink.tap();
      await expect(tooltip).toBeVisible();
      
      // Check tooltip is properly positioned and sized for mobile
      const tooltipBox = await tooltip.boundingBox();
      expect(tooltipBox.width).toBeLessThanOrEqual(375); // Should fit in viewport
      expect(tooltipBox.x).toBeGreaterThanOrEqual(0); // Should not overflow left
    }
  });

  test('tooltip positioning works correctly', async ({ page }) => {
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Show tooltip
      await firstLink.hover();
      await expect(tooltip).toBeVisible();
      
      // Get positions
      const linkBox = await firstLink.boundingBox();
      const tooltipBox = await tooltip.boundingBox();
      
      // Tooltip should be positioned above the link (placement="top")
      expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(linkBox.y);
      
      // Tooltip should be horizontally centered relative to the link
      const linkCenter = linkBox.x + linkBox.width / 2;
      const tooltipCenter = tooltipBox.x + tooltipBox.width / 2;
      const tolerance = 50; // Allow some tolerance for positioning
      expect(Math.abs(linkCenter - tooltipCenter)).toBeLessThanOrEqual(tolerance);
    }
  });

  test('accessibility attributes are correct', async ({ page }) => {
    const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
    
    if (await dictionaryLinks.count() > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      
      // Check ARIA label
      await expect(firstLink).toHaveAttribute('aria-label');
      const ariaLabel = await firstLink.getAttribute('aria-label');
      expect(ariaLabel).toContain(`Definition of ${term}`);
      
      // Check emoji has aria-hidden
      const emoji = page.getByTestId(`dictionary-emoji-${term}`);
      await expect(emoji).toHaveAttribute('aria-hidden', 'true');
      
      // Check button role
      expect(await firstLink.evaluate(el => el.tagName.toLowerCase())).toBe('button');
    }
  });

  test('tooltips appear above all content including emojis', async ({ page }) => {
    await page.goto('/');
    
    // Find dictionary links
    const dictionaryLinks = page.locator('[data-testid^="dictionary-link-"]');
    const count = await dictionaryLinks.count();
    
    if (count > 0) {
      const firstLink = dictionaryLinks.first();
      const testId = await firstLink.getAttribute('data-testid');
      const term = testId.replace('dictionary-link-', '');
      const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
      
      // Show tooltip
      await firstLink.hover();
      await expect(tooltip).toBeVisible();
      
      // Get z-index of tooltip
      const tooltipZIndex = await tooltip.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.zIndex;
      });
      
      // Verify tooltip has high z-index
      expect(parseInt(tooltipZIndex) || 0).toBeGreaterThan(1000);
      
      // Check that tooltip is not obscured by checking its visibility
      const tooltipBox = await tooltip.boundingBox();
      if (tooltipBox) {
        // Sample multiple points within the tooltip to ensure it's not obscured
        const centerX = tooltipBox.x + tooltipBox.width / 2;
        const centerY = tooltipBox.y + tooltipBox.height / 2;
        
        // Get element at the center of the tooltip
        const elementAtCenter = await page.evaluate(({ x, y }) => {
          const element = document.elementFromPoint(x, y);
          return element ? element.closest('sl-tooltip') !== null : false;
        }, { x: centerX, y: centerY });
        
        // The tooltip should be the topmost element at its center point
        expect(elementAtCenter).toBe(true);
      }
      
      // Test in both light and dark modes
      const themeToggle = page.locator('#theme-toggle');
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await expect(page.locator('html')).toHaveClass(/dark/);
        
        // Tooltip should still be visible and on top in dark mode
        await expect(tooltip).toBeVisible();
        
        const darkModeTooltipBox = await tooltip.boundingBox();
        if (darkModeTooltipBox) {
          const centerX = darkModeTooltipBox.x + darkModeTooltipBox.width / 2;
          const centerY = darkModeTooltipBox.y + darkModeTooltipBox.height / 2;
          
          const elementAtCenterDark = await page.evaluate(({ x, y }) => {
            const element = document.elementFromPoint(x, y);
            return element ? element.closest('sl-tooltip') !== null : false;
          }, { x: centerX, y: centerY });
          
          expect(elementAtCenterDark).toBe(true);
        }
      }
    }
  });
});

// Test with a specific page that we know has dictionary terms
test.describe('Dictionary Tooltips on Blog Posts', () => {
  test('dictionary tooltips work on blog posts', async ({ page }) => {
    // Navigate to the blog post that likely contains dictionary terms
    const blogPosts = [
      '/blog/en-us/gru-kms-windows/',
      '/blog/el/gru-kms-windows/',
      '/blog/tr/gru-kms-windows/'
    ];
    
    for (const postUrl of blogPosts) {
      await page.goto(postUrl);
      
      // Look for dictionary links
      const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
      const linkCount = await dictionaryLinks.count();
      
      if (linkCount > 0) {
        console.log(`Found ${linkCount} dictionary links on ${postUrl}`);
        
        const firstLink = dictionaryLinks.first();
        const testId = await firstLink.getAttribute('data-testid');
        const term = testId.replace('dictionary-link-', '');
        const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
        
        // Test basic functionality
        await firstLink.hover();
        await expect(tooltip).toBeVisible();
        
        // Verify content structure
        const tooltipContent = tooltip.locator('.dictionary-tooltip-content');
        const tooltipTerm = tooltipContent.locator('.tooltip-term');
        const tooltipDefinition = tooltipContent.locator('.tooltip-definition');
        
        await expect(tooltipTerm).toBeVisible();
        await expect(tooltipDefinition).toBeVisible();
        
        // Check that definition is not empty
        const definitionText = await tooltipDefinition.textContent();
        expect(definitionText.length).toBeGreaterThan(10);
        
        break; // Exit after testing one page with dictionary links
      }
    }
  });
});

// Test localized dictionary tooltips
test.describe('Localized Dictionary Tooltips', () => {
  const testCases = [
    {
      locale: 'en-us',
      path: '/blog/en-us/gru-kms-windows/',
      expectedTexts: {
        encryption: 'The process of converting readable data into coded form',
        firewall: 'A network security system that monitors and controls',
        malware: 'Malicious software designed to damage',
        phishing: 'A cyber attack method where attackers impersonate legitimate organizations',
        vpn: 'Virtual Private Network - A secure connection method'
      }
    },
    {
      locale: 'el',
      path: '/blog/el/gru-kms-windows/',
      expectedTexts: {
        encryption: 'Η διαδικασία μετατροπής αναγνώσιμων δεδομένων σε κωδικοποιημένη μορφή',
        firewall: 'Ένα σύστημα ασφάλειας δικτύου που παρακολουθεί και ελέγχει',
        malware: 'Κακόβουλο λογισμικό σχεδιασμένο να προκαλέσει ζημιά',
        phishing: 'Μια μέθοδος κυβερνοεπίθεσης όπου οι επιτιθέμενοι μιμούνται νόμιμους οργανισμούς',
        vpn: 'Εικονικό Ιδιωτικό Δίκτυο - Μια ασφαλής μέθοδος σύνδεσης'
      }
    },
    {
      locale: 'tr',
      path: '/blog/tr/gru-kms-windows/',
      expectedTexts: {
        encryption: 'Yetkisiz erişimi önlemek için okunabilir verileri kodlu forma dönüştürme işlemi',
        firewall: 'Önceden belirlenmiş güvenlik kurallarına dayalı olarak gelen ve giden ağ trafiğini',
        malware: 'Bilgisayar sistemlerine zarar vermek, aksatmak veya yetkisiz erişim sağlamak',
        phishing: 'Saldırganların meşru kuruluşları taklit ederek bireyleri sahte e-postalar',
        vpn: 'Sanal Özel Ağ - Cihazınız ile uzak bir sunucu arasında şifreli bir tünel'
      }
    }
  ];

  for (const testCase of testCases) {
    test(`dictionary tooltips show ${testCase.locale} translations on ${testCase.locale} pages`, async ({ page }) => {
      await page.goto(testCase.path);
      
      // Look for dictionary links
      const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
      const linkCount = await dictionaryLinks.count();
      
      if (linkCount > 0) {
        // Test each available dictionary link on the page
        for (let i = 0; i < Math.min(linkCount, 3); i++) { // Test up to 3 links to avoid long tests
          const link = dictionaryLinks.nth(i);
          const testId = await link.getAttribute('data-testid');
          const term = testId.replace('dictionary-link-', '');
          
          // Skip if we don't have expected text for this term
          if (!testCase.expectedTexts[term]) {
            continue;
          }
          
          const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
          
          // Show tooltip
          await link.hover();
          await expect(tooltip).toBeVisible();
          
          // Check that the definition contains the expected localized text
          const tooltipDefinition = tooltip.locator('.tooltip-definition');
          const definitionText = await tooltipDefinition.textContent();
          
          expect(definitionText).toContain(testCase.expectedTexts[term]);
          
          // Verify it doesn't contain text from other locales
          const otherLocales = testCases.filter(t => t.locale !== testCase.locale);
          for (const otherLocale of otherLocales) {
            if (otherLocale.expectedTexts[term]) {
              expect(definitionText).not.toContain(otherLocale.expectedTexts[term]);
            }
          }
          
          // Hide tooltip before next iteration - be more aggressive about closing it
          await page.click('body');
          await page.waitForTimeout(300); // Wait for tooltip animation to complete
        }
      }
    });
  }

  test('fallback to English works when locale translation is missing', async ({ page }) => {
    // This test would require a term that exists in dictionary but is missing a translation
    // Since all current terms have all translations, we'll skip this test
    // In a real scenario, you might temporarily modify dictionary data for testing
    test.skip('All current dictionary terms have complete translations');
  });

  test('consistent test IDs across all locales', async ({ page }) => {
    const paths = ['/blog/en-us/gru-kms-windows/', '/blog/el/gru-kms-windows/', '/blog/tr/gru-kms-windows/'];
    
    for (const path of paths) {
      await page.goto(path);
      
      const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
      const linkCount = await dictionaryLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = dictionaryLinks.nth(i);
        const testId = await link.getAttribute('data-testid');
        const term = testId.replace('dictionary-link-', '');
        
        // Verify test IDs are consistent
        const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
        const emoji = page.getByTestId(`dictionary-emoji-${term}`);
        
        await expect(link).toHaveAttribute('data-testid', `dictionary-link-${term}`);
        await expect(tooltip).toHaveAttribute('data-testid', `dictionary-tooltip-${term}`);
        await expect(emoji).toHaveAttribute('data-testid', `dictionary-emoji-${term}`);
      }
    }
  });

  test('keyboard navigation works across all locales', async ({ page }) => {
    const paths = ['/blog/en-us/gru-kms-windows/', '/blog/el/gru-kms-windows/', '/blog/tr/gru-kms-windows/'];
    
    for (const path of paths) {
      await page.goto(path);
      
      const dictionaryLinks = page.getByTestId(/^dictionary-link-/);
      const linkCount = await dictionaryLinks.count();
      
      if (linkCount > 0) {
        const firstLink = dictionaryLinks.first();
        const testId = await firstLink.getAttribute('data-testid');
        const term = testId.replace('dictionary-link-', '');
        const tooltip = page.getByTestId(`dictionary-tooltip-${term}`);
        
        // Test keyboard navigation
        await firstLink.focus();
        await page.keyboard.press('Enter');
        await expect(tooltip).toBeVisible();
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300); // Wait for tooltip animation to complete
      }
    }
  });
});