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

  test('guided flow skip to app works', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.evaluate(() => window._testSkipToQuiz('Skip Test'));

    // Should see search input and skip link
    await expect(page.locator('#guided-search-input')).toBeVisible({ timeout: 5000 });

    // Click skip link
    await page.locator('text=I\'d rather explore on my own →').click();

    // Onboarding overlay should be exiting/gone
    await page.waitForFunction(() => {
      const overlay = document.getElementById('onboarding-overlay');
      return !overlay || overlay.style.display === 'none' || overlay.classList.contains('exiting');
    }, { timeout: 5000 });
  });
});
