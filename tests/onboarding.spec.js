// @ts-check
import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures.js';

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(() => { localStorage.clear(); });
  });

  test('cold landing shows for new users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#cold-landing')).toBeVisible({ timeout: 5000 });
  });

  test('quiz flow → reveal archetype', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Skip to quiz (bypasses auth)
    await page.evaluate(() => window._testSkipToQuiz('Playwright Test'));
    await expect(page.locator('#onboarding-overlay')).toBeVisible();
    await page.waitForSelector('.ob-option', { timeout: 5000 });

    // Answer all 6 questions (pick option A)
    for (let q = 0; q < 6; q++) {
      await page.locator('.ob-option').first().click();
      await expect(page.locator('#ob-next-btn')).toBeEnabled({ timeout: 2000 });
      await page.locator('#ob-next-btn').click();
      if (q < 5) {
        await page.waitForTimeout(300);
        await page.waitForSelector('.ob-option', { timeout: 3000 });
      }
    }

    // Should see reveal screen
    await expect(page.locator('.ob-reveal-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('quiz back navigation preserves answers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.evaluate(() => window._testSkipToQuiz('Nav Test'));
    await page.waitForSelector('.ob-option', { timeout: 5000 });

    // Select option B on Q1
    await page.locator('.ob-option').nth(1).click();
    await expect(page.locator('.ob-option').nth(1)).toHaveClass(/selected/);
    await expect(page.locator('#ob-next-btn')).toBeEnabled();

    // Go to Q2, answer, then back
    await page.locator('#ob-next-btn').click();
    await page.waitForTimeout(300);
    await page.waitForSelector('.ob-option', { timeout: 3000 });
    await page.locator('.ob-option').first().click();
    await page.locator('.ob-btn-secondary').click();
    await page.waitForTimeout(300);

    // Q1 answer should persist
    await expect(page.locator('.ob-option.selected')).toHaveCount(1);
  });
});
