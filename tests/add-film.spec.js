// @ts-check
import { test, expect } from '@playwright/test';
import { injectAuthState, mockSupabase } from './fixtures.js';

test.describe('Add Film flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(injectAuthState());
  });

  test('app loads with rankings for authenticated user', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    await expect(page.locator('#cold-landing')).toBeHidden();
    await expect(page.locator('#onboarding-overlay')).toBeHidden();
    await expect(page.locator('#rankings')).toBeVisible({ timeout: 3000 });
  });

  test('navigate to Add Film screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      if (typeof window.showScreen === 'function') window.showScreen('add');
    });
    await page.waitForTimeout(500);

    await expect(page.locator('#f-search')).toBeVisible({ timeout: 3000 });
  });

  test('TMDB search returns results', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      if (typeof window.showScreen === 'function') window.showScreen('add');
    });
    await page.waitForTimeout(500);

    await page.locator('#f-search').fill('Interstellar');
    await page.waitForTimeout(2000);

    const results = page.locator('.tmdb-result');
    expect(await results.count()).toBeGreaterThan(0);
  });
});
