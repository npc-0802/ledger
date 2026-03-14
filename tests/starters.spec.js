// @ts-check
import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures.js';

// Helper: skip auth and land on guided film 1 search
async function skipToGuided(page) {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => window._testSkipToQuiz('Guided Test'));
  await page.waitForSelector('#guided-search-input', { timeout: 5000 });
}

test.describe('Guided onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(() => { localStorage.clear(); });
  });

  test('guided flow shows film search on step 1', async ({ page }) => {
    await skipToGuided(page);
    // Search input should be visible
    await expect(page.locator('#guided-search-input')).toBeVisible();
    // Should see the "Let's find your taste" title
    await expect(page.locator('text=Let\'s find your taste.')).toBeVisible();
  });

  test('film search returns results', async ({ page }) => {
    await skipToGuided(page);
    // Type in search
    await page.fill('#guided-search-input', 'The Matrix');
    // Wait for search results to appear
    await page.waitForFunction(() => {
      const results = document.getElementById('guided-search-results');
      return results && results.children.length > 0;
    }, { timeout: 8000 });
    // Should have at least one result
    const results = page.locator('#guided-search-results > div');
    expect(await results.count()).toBeGreaterThan(0);
  });

  test('selecting a film shows scoring sliders', async ({ page }) => {
    await skipToGuided(page);
    await page.fill('#guided-search-input', 'The Matrix');
    await page.waitForFunction(() => {
      const results = document.getElementById('guided-search-results');
      return results && results.children.length > 0;
    }, { timeout: 8000 });
    // Click first result
    await page.locator('#guided-search-results > div').first().click();
    // Should show scoring sliders (score-split-dark class)
    await expect(page.locator('.score-split-dark').first()).toBeVisible({ timeout: 3000 });
  });

  test('first film shows staged sliders (gut first)', async ({ page }) => {
    await skipToGuided(page);
    await page.fill('#guided-search-input', 'The Matrix');
    await page.waitForFunction(() => {
      const results = document.getElementById('guided-search-results');
      return results && results.children.length > 0;
    }, { timeout: 8000 });
    await page.locator('#guided-search-results > div').first().click();
    await page.waitForSelector('.score-split-dark', { timeout: 3000 });

    // Should show 4 gut sliders initially (not all 8)
    const sliders = page.locator('.score-split-dark');
    expect(await sliders.count()).toBe(4);

    // Should have "take a beat" button
    await expect(page.locator('text=ones that take a beat')).toBeVisible();
  });

  test('reveal beat sliders shows all 8', async ({ page }) => {
    await skipToGuided(page);
    await page.fill('#guided-search-input', 'The Matrix');
    await page.waitForFunction(() => {
      const results = document.getElementById('guided-search-results');
      return results && results.children.length > 0;
    }, { timeout: 8000 });
    await page.locator('#guided-search-results > div').first().click();
    await page.waitForSelector('.score-split-dark', { timeout: 3000 });

    // Click reveal button
    await page.locator('button:has-text("ones that take a beat")').click();
    await page.waitForTimeout(500);

    // Should now show all 8 sliders
    const sliders = page.locator('.score-split-dark');
    expect(await sliders.count()).toBe(8);

    // Should now have "Rate →" button
    await expect(page.locator('button:has-text("Rate →")')).toBeVisible();
  });

  test('skip link exits onboarding', async ({ page }) => {
    await skipToGuided(page);
    await page.locator('text=I\'d rather explore on my own →').click();
    // Onboarding should exit
    await page.waitForFunction(() => {
      const overlay = document.getElementById('onboarding-overlay');
      return !overlay || overlay.style.display === 'none' || overlay.classList.contains('exiting');
    }, { timeout: 5000 });
  });
});
