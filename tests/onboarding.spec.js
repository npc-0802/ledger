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

  test('guided flow shows search after skip to guided', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Skip to guided flow (bypasses auth)
    await page.evaluate(() => window._testSkipToQuiz('Playwright Test'));
    await expect(page.locator('#onboarding-overlay')).toBeVisible();

    // Should see the guided film search screen
    await expect(page.locator('#guided-search-input')).toBeVisible({ timeout: 5000 });
  });

  test('guided flow has no skip on first film', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.evaluate(() => window._testSkipToQuiz('Skip Test'));

    await expect(page.locator('#guided-search-input')).toBeVisible({ timeout: 5000 });

    // No skip or save-and-finish on step 1 (no films rated yet)
    await expect(page.locator('text=explore on my own')).not.toBeVisible();
    await expect(page.locator('text=Save and finish later')).not.toBeVisible();
  });
});
