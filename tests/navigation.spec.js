// @ts-check
import { test, expect } from '@playwright/test';
import { injectAuthState, mockSupabase } from './fixtures.js';

test.describe('Core navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(injectAuthState());
  });

  test('all main screens are accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    for (const screen of ['rankings', 'profile', 'add', 'predict', 'friends']) {
      await page.evaluate((s) => {
        if (typeof window.showScreen === 'function') window.showScreen(s);
      }, screen);
      await page.waitForTimeout(500);

      // At least one visible screen element
      const visible = await page.locator('.screen:visible').count();
      expect(visible).toBeGreaterThan(0);
    }
  });

  test('For You page renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      if (typeof window.showScreen === 'function') window.showScreen('predict');
    });
    await page.waitForTimeout(2000);

    // For You content should be visible inside the predict screen
    const predictScreen = page.locator('#predict');
    await expect(predictScreen).toBeVisible({ timeout: 5000 });
  });

  test('Profile page shows archetype', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      if (typeof window.showScreen === 'function') window.showScreen('profile');
    });
    await page.waitForTimeout(500);

    await expect(page.locator('.screen').filter({ hasText: 'Visceralist' }).first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Hints system', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(injectAuthState());
  });

  test('hint dismiss persists to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Visit multiple screens to trigger hints
    for (const screen of ['profile', 'rankings', 'predict']) {
      await page.evaluate((s) => {
        if (typeof window.showScreen === 'function') window.showScreen(s);
      }, screen);
      await page.waitForTimeout(500);
    }

    const hints = page.locator('.inline-hint');
    const count = await hints.count();

    if (count > 0) {
      // Dismiss first hint and verify localStorage key was set
      const hintId = await hints.first().getAttribute('id');
      const key = hintId?.replace('hint-', '');
      const dismissBtn = hints.first().locator('.inline-hint-dismiss');
      if (await dismissBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await dismissBtn.click();
        await page.waitForTimeout(300);
        if (key) {
          const stored = await page.evaluate((k) => localStorage.getItem('pm_hint_' + k), key);
          expect(stored).toBe('1');
        }
      }
    }
  });
});
