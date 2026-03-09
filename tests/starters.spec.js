// @ts-check
import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures.js';

// Helper: skip through quiz to reach starters screen
async function skipToStarters(page) {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => window._testSkipToQuiz('Starter Test'));

  // Answer all 6 questions (pick option A)
  for (let q = 0; q < 6; q++) {
    await page.waitForSelector('.ob-option', { timeout: 5000 });
    await page.locator('.ob-option').first().click();
    await page.locator('#ob-next-btn').click();
    if (q < 5) await page.waitForTimeout(300);
  }

  // Wait for reveal, then proceed to starters
  await page.waitForSelector('.ob-reveal-card', { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.locator('button:has-text("See what your palate says")').click();
  await page.waitForTimeout(600);
  await page.waitForSelector('.starter-card-v2', { timeout: 5000 });
}

test.describe('Starter films flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(() => { localStorage.clear(); });
  });

  test('starters page renders poster grid and progress circles', async ({ page }) => {
    await skipToStarters(page);
    await expect(page.locator('.starter-progress-circle')).toHaveCount(10);
    expect(await page.locator('.starter-card-v2').count()).toBeGreaterThanOrEqual(4);
    expect(await page.locator('.starter-genre-label').count()).toBeGreaterThanOrEqual(1);
  });

  test('tapping a film opens single-slider rating panel', async ({ page }) => {
    await skipToStarters(page);
    await page.locator('.starter-card-v2:not(.rated)').first().click();

    const rateCard = page.locator('.starter-rate-card');
    await expect(rateCard).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#starter-overall-val')).toBeVisible();
    await expect(rateCard.locator('input[type="range"]').first()).toBeVisible();
    await expect(page.locator('.starter-finetune-toggle')).toBeVisible();
    await expect(rateCard.locator('button:has-text("Rate")')).toBeVisible();
  });

  test('single slider updates score display', async ({ page }) => {
    await skipToStarters(page);
    await page.locator('.starter-card-v2:not(.rated)').first().click();
    await page.waitForSelector('.starter-rate-card', { timeout: 3000 });

    const slider = page.locator('.starter-rate-card input[type="range"]').first();
    await slider.fill('90');
    await slider.dispatchEvent('input');
    await expect(page.locator('#starter-overall-val')).toHaveText('90');
  });

  test('fine-tune toggle reveals 8 category sliders', async ({ page }) => {
    await skipToStarters(page);
    await page.locator('.starter-card-v2:not(.rated)').first().click();
    await page.waitForSelector('.starter-rate-card', { timeout: 3000 });

    await page.locator('.starter-finetune-toggle').click();
    await page.waitForTimeout(300);

    const grid = page.locator('.starter-sliders-grid');
    await expect(grid).toBeVisible({ timeout: 3000 });
    await expect(grid.locator('input[type="range"]')).toHaveCount(8);
  });

  test('rating a film updates progress circles', async ({ page }) => {
    await skipToStarters(page);
    const scoredBefore = await page.locator('.starter-progress-circle.scored').count();

    await page.locator('.starter-card-v2:not(.rated)').first().click();
    await page.waitForSelector('.starter-rate-card', { timeout: 3000 });
    await page.locator('.starter-rate-card button:has-text("Rate")').click();
    await page.waitForTimeout(1200);

    const scoredAfter = await page.locator('.starter-progress-circle.scored').count();
    expect(scoredAfter).toBe(scoredBefore + 1);
    expect(await page.locator('.starter-card-v2.rated').count()).toBeGreaterThanOrEqual(1);
  });

  test('back button collapses rating panel', async ({ page }) => {
    await skipToStarters(page);
    await page.locator('.starter-card-v2:not(.rated)').first().click();
    await page.waitForSelector('.starter-rate-card', { timeout: 3000 });

    await page.locator('.starter-rate-card').getByText('← Back').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.starter-rate-card')).toHaveCount(0);
  });

  test('"Show me different films" loads more films', async ({ page }) => {
    await skipToStarters(page);
    const cardsBefore = await page.locator('.starter-card-v2').count();
    const showMore = page.getByText('Show me different films');

    if (await showMore.isVisible()) {
      await showMore.click();
      await page.waitForTimeout(500);
      expect(await page.locator('.starter-card-v2').count()).toBeGreaterThan(cardsBefore);
    }
  });
});
