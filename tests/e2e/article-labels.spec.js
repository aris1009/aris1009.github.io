import { test, expect } from "@playwright/test";

test.describe("Article Labels", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page with article labels
    // We'll use the main blog page which should have articles with labels
    await page.goto("/");
  });

  test("difficulty labels are rendered with correct variants", async ({ page }) => {
    // Look for any difficulty labels on the page
    const beginnerLabels = page.getByTestId(/^difficulty-label-beginner$/);
    const expertLabels = page.getByTestId(/^difficulty-label-expert$/);

    // Test beginner labels (success variant)
    if ((await beginnerLabels.count()) > 0) {
      const firstBeginner = beginnerLabels.first();
      await expect(firstBeginner).toBeVisible();
      await expect(firstBeginner).toHaveAttribute("variant", "success");
      await expect(firstBeginner).toHaveAttribute("size", "small");
      await expect(firstBeginner).toHaveAttribute("pill");
      await expect(firstBeginner).toHaveAttribute("role", "img");
    }

    // Test expert labels (primary variant)
    if ((await expertLabels.count()) > 0) {
      const firstExpert = expertLabels.first();
      await expect(firstExpert).toBeVisible();
      await expect(firstExpert).toHaveAttribute("variant", "primary");
      await expect(firstExpert).toHaveAttribute("size", "small");
      await expect(firstExpert).toHaveAttribute("pill");
      await expect(firstExpert).toHaveAttribute("role", "img");
    }
  });

  test("content type labels are rendered correctly", async ({ page }) => {
    // Look for content type labels
    const contentTypeLabels = page.getByTestId(/^content-type-label-/);
    
    if ((await contentTypeLabels.count()) > 0) {
      const firstLabel = contentTypeLabels.first();
      await expect(firstLabel).toBeVisible();
      await expect(firstLabel).toHaveAttribute("size", "small");
      await expect(firstLabel).toHaveAttribute("pill");
      await expect(firstLabel).toHaveAttribute("role", "img");
      
      // Check that it has proper ARIA label
      await expect(firstLabel).toHaveAttribute("aria-label");
      const ariaLabel = await firstLabel.getAttribute("aria-label");
      expect(ariaLabel).toMatch(/Content type:|Τύπος περιεχομένου:|İçerik türü:/);
    }
  });

  test("technology tags are rendered correctly", async ({ page }) => {
    // Look for technology tags
    const techTags = page.getByTestId(/^tech-tag-/);
    
    if ((await techTags.count()) > 0) {
      const firstTag = techTags.first();
      await expect(firstTag).toBeVisible();
      await expect(firstTag).toHaveAttribute("size", "small");
      await expect(firstTag).toHaveAttribute("pill");
      await expect(firstTag).toHaveAttribute("role", "img");
      
      // Check that it has proper ARIA label
      await expect(firstTag).toHaveAttribute("aria-label");
      const ariaLabel = await firstTag.getAttribute("aria-label");
      expect(ariaLabel).toMatch(/Technology:|Τεχνολογία:|Teknoloji:/);
    }
  });

  test("article labels container has proper accessibility attributes", async ({ page }) => {
    // Look for article labels containers
    const labelContainers = page.locator('.article-labels');
    
    if ((await labelContainers.count()) > 0) {
      const firstContainer = labelContainers.first();
      await expect(firstContainer).toBeVisible();
      await expect(firstContainer).toHaveAttribute("role", "group");
      await expect(firstContainer).toHaveAttribute("aria-label");
      
      const ariaLabel = await firstContainer.getAttribute("aria-label");
      expect(ariaLabel).toMatch(/Content classifications|Ταξινομήσεις περιεχομένου|İçerik sınıflandırmaları/);
      
      // Check container styling
      await expect(firstContainer).toHaveClass(/flex/);
      await expect(firstContainer).toHaveClass(/flex-wrap/);
      await expect(firstContainer).toHaveClass(/gap-2/);
      await expect(firstContainer).toHaveClass(/mb-4/);
    }
  });

  test("labels maintain correct order: difficulty, content type, technologies", async ({ page }) => {
    // Look for containers with multiple labels
    const labelContainers = page.locator('.article-labels');
    
    if ((await labelContainers.count()) > 0) {
      for (let i = 0; i < await labelContainers.count(); i++) {
        const container = labelContainers.nth(i);
        const allLabels = container.locator('sl-tag');
        const labelCount = await allLabels.count();
        
        if (labelCount > 1) {
          let lastDifficultyIndex = -1;
          let lastContentTypeIndex = -1;
          let lastTechIndex = -1;
          
          for (let j = 0; j < labelCount; j++) {
            const label = allLabels.nth(j);
            const testId = await label.getAttribute('data-testid');
            
            if (testId?.includes('difficulty-label-')) {
              lastDifficultyIndex = j;
            } else if (testId?.includes('content-type-label-')) {
              lastContentTypeIndex = j;
            } else if (testId?.includes('tech-tag-')) {
              lastTechIndex = j;
            }
          }
          
          // Verify order: difficulty < content type < tech tags
          if (lastDifficultyIndex >= 0 && lastContentTypeIndex >= 0) {
            expect(lastDifficultyIndex).toBeLessThan(lastContentTypeIndex);
          }
          if (lastContentTypeIndex >= 0 && lastTechIndex >= 0) {
            expect(lastContentTypeIndex).toBeLessThan(lastTechIndex);
          }
          if (lastDifficultyIndex >= 0 && lastTechIndex >= 0) {
            expect(lastDifficultyIndex).toBeLessThan(lastTechIndex);
          }
          
          break; // Found a container with multiple labels, no need to check others
        }
      }
    }
  });

  test("labels work correctly in different languages", async ({ page }) => {
    const locales = [
      { path: "/", lang: "en-us", expectedAriaPrefix: "Content classifications" },
      { path: "/el/", lang: "el", expectedAriaPrefix: "Ταξινομήσεις περιεχομένου" },
      { path: "/tr/", lang: "tr", expectedAriaPrefix: "İçerik sınıflandırmaları" }
    ];

    for (const locale of locales) {
      await page.goto(locale.path);
      
      const labelContainers = page.locator('.article-labels');
      
      if ((await labelContainers.count()) > 0) {
        const firstContainer = labelContainers.first();
        const ariaLabel = await firstContainer.getAttribute("aria-label");
        
        // Should contain the expected localized text
        expect(ariaLabel).toContain(locale.expectedAriaPrefix);
        
        // Test difficulty labels in this locale
        const difficultyLabels = firstContainer.locator('[data-testid^="difficulty-label-"]');
        if ((await difficultyLabels.count()) > 0) {
          const firstDifficulty = difficultyLabels.first();
          const difficultyAriaLabel = await firstDifficulty.getAttribute("aria-label");
          
          if (locale.lang === "en-us") {
            expect(difficultyAriaLabel).toMatch(/Difficulty level:/);
          } else if (locale.lang === "el") {
            expect(difficultyAriaLabel).toMatch(/Επίπεδο δυσκολίας:/);
          } else if (locale.lang === "tr") {
            expect(difficultyAriaLabel).toMatch(/Zorluk seviyesi:/);
          }
        }
        
        // Test content type labels in this locale
        const contentTypeLabels = firstContainer.locator('[data-testid^="content-type-label-"]');
        if ((await contentTypeLabels.count()) > 0) {
          const firstContentType = contentTypeLabels.first();
          const contentTypeAriaLabel = await firstContentType.getAttribute("aria-label");
          
          if (locale.lang === "en-us") {
            expect(contentTypeAriaLabel).toMatch(/Content type:/);
          } else if (locale.lang === "el") {
            expect(contentTypeAriaLabel).toMatch(/Τύπος περιεχομένου:/);
          } else if (locale.lang === "tr") {
            expect(contentTypeAriaLabel).toMatch(/İçerik türü:/);
          }
        }
        
        // Test technology labels in this locale
        const techLabels = firstContainer.locator('[data-testid^="tech-tag-"]');
        if ((await techLabels.count()) > 0) {
          const firstTech = techLabels.first();
          const techAriaLabel = await firstTech.getAttribute("aria-label");
          
          if (locale.lang === "en-us") {
            expect(techAriaLabel).toMatch(/Technology:/);
          } else if (locale.lang === "el") {
            expect(techAriaLabel).toMatch(/Τεχνολογία:/);
          } else if (locale.lang === "tr") {
            expect(techAriaLabel).toMatch(/Teknoloji:/);
          }
        }
      }
    }
  });

  test("labels are responsive and work on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const labelContainers = page.locator('.article-labels');
    
    if ((await labelContainers.count()) > 0) {
      const firstContainer = labelContainers.first();
      await expect(firstContainer).toBeVisible();
      
      // Container should be responsive with flex-wrap
      await expect(firstContainer).toHaveClass(/flex-wrap/);
      
      // Labels should be visible and not overflow
      const allLabels = firstContainer.locator('sl-tag');
      const labelCount = await allLabels.count();
      
      for (let i = 0; i < Math.min(labelCount, 5); i++) {
        const label = allLabels.nth(i);
        await expect(label).toBeVisible();
        
        const labelBox = await label.boundingBox();
        if (labelBox) {
          // Should not overflow the viewport
          expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(375);
          expect(labelBox.x).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test("labels work correctly in dark mode", async ({ page }) => {
    const labelContainers = page.locator('.article-labels');
    
    if ((await labelContainers.count()) > 0) {
      // Test in light mode first
      const firstContainer = labelContainers.first();
      await expect(firstContainer).toBeVisible();
      
      // Switch to dark mode
      const themeToggle = page.getByTestId("theme-toggle");
      if ((await themeToggle.count()) > 0) {
        await themeToggle.click();
        await expect(page.locator("html")).toHaveClass(/dark/);
        
        // Labels should still be visible in dark mode
        await expect(firstContainer).toBeVisible();
        
        const allLabels = firstContainer.locator('sl-tag');
        const labelCount = await allLabels.count();
        
        for (let i = 0; i < Math.min(labelCount, 3); i++) {
          const label = allLabels.nth(i);
          await expect(label).toBeVisible();
        }
      }
    }
  });

  test("technology tags respect 5-tag limit", async ({ page }) => {
    const labelContainers = page.locator('.article-labels');
    
    if ((await labelContainers.count()) > 0) {
      for (let i = 0; i < await labelContainers.count(); i++) {
        const container = labelContainers.nth(i);
        const techTags = container.locator('[data-testid^="tech-tag-"]');
        const techCount = await techTags.count();
        
        // Should never have more than 5 technology tags
        expect(techCount).toBeLessThanOrEqual(5);
        
        if (techCount > 0) {
          // All tech tags should be visible
          for (let j = 0; j < techCount; j++) {
            await expect(techTags.nth(j)).toBeVisible();
          }
        }
      }
    }
  });

  test("test IDs are unique and properly formatted", async ({ page }) => {
    const labelContainers = page.locator('.article-labels');
    
    if ((await labelContainers.count()) > 0) {
      const allTestIds = [];
      
      for (let i = 0; i < await labelContainers.count(); i++) {
        const container = labelContainers.nth(i);
        const allLabels = container.locator('sl-tag[data-testid]');
        
        for (let j = 0; j < await allLabels.count(); j++) {
          const label = allLabels.nth(j);
          const testId = await label.getAttribute('data-testid');
          
          // Test ID should follow expected pattern
          expect(testId).toMatch(/^(difficulty-label-|content-type-label-|tech-tag-)/);
          
          // Test ID should be unique on the page
          expect(allTestIds).not.toContain(testId);
          allTestIds.push(testId);
          
          // Difficulty labels should match known patterns
          if (testId.startsWith('difficulty-label-')) {
            expect(testId).toMatch(/^difficulty-label-(beginner|expert|intermediate)/);
          }
          
          // Content type labels should match known patterns
          if (testId.startsWith('content-type-label-')) {
            expect(testId).toMatch(/^content-type-label-(tutorial|guide|opinion|news|case-study)/);
          }
          
          // Tech tags should have normalized IDs
          if (testId.startsWith('tech-tag-')) {
            // Should be lowercase and have special characters replaced
            expect(testId).toMatch(/^tech-tag-[a-z0-9-]+$/);
          }
        }
      }
    }
  });
});

// Test specific blog posts that might have article labels
test.describe("Article Labels on Blog Posts", () => {
  test("blog posts display article labels correctly", async ({ page }) => {
    const blogPosts = [
      "/blog/en-us/gru-kms-windows/",
      "/blog/el/gru-kms-windows/", 
      "/blog/tr/gru-kms-windows/"
    ];

    for (const postUrl of blogPosts) {
      await page.goto(postUrl);
      
      // Look for article labels on the post
      const labelContainers = page.locator('.article-labels');
      
      if ((await labelContainers.count()) > 0) {
        console.log(`Found article labels on ${postUrl}`);
        
        const firstContainer = labelContainers.first();
        await expect(firstContainer).toBeVisible();
        
        // Should be positioned near the top of the article
        const containerBox = await firstContainer.boundingBox();
        expect(containerBox.y).toBeLessThan(400); // Should be in the first part of the page
        
        // Check that labels are properly spaced
        const allLabels = firstContainer.locator('sl-tag');
        const labelCount = await allLabels.count();
        
        if (labelCount > 1) {
          // Container should have gap classes for proper spacing
          await expect(firstContainer).toHaveClass(/gap-2/);
        }
        
        break; // Exit after testing one post with labels
      }
    }
  });

  test("article labels don't interfere with other page elements", async ({ page }) => {
    await page.goto("/");
    
    const labelContainers = page.locator('.article-labels');
    
    if ((await labelContainers.count()) > 0) {
      const firstContainer = labelContainers.first();
      
      // Labels should not overlap with other content
      const containerBox = await firstContainer.boundingBox();
      
      // Check that labels don't interfere with navigation
      const nav = page.locator('nav');
      if ((await nav.count()) > 0) {
        const navBox = await nav.boundingBox();
        // Should not overlap
        expect(containerBox.y).toBeGreaterThan(navBox.y + navBox.height - 10);
      }
      
      // Labels should have proper margins
      await expect(firstContainer).toHaveClass(/mb-4/);
    }
  });
});