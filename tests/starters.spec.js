// @ts-check
import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures.js';

// Helper: skip through quiz to reach starters screen
async function skipToStarters(page) {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => window._testSkipToQuiz('Starter Test'));

  // Answer questions until reveal (adaptive: 3–5 questions)
  for (let q = 0; q < 6; q++) {
    const options = page.locator('.ob-option');
    if (await options.count() === 0) break;
    await options.first().click();
    await page.locator('#ob-next-btn').click();
    await page.waitForTimeout(300);

    // Check if reveal appeared
    const reveal = page.locator('.ob-reveal-card');
    if (await reveal.count() > 0) break;
  }

  // Wait for reveal, then proceed to starters
  await page.waitForSelector('.ob-reveal-card', { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Show what your palate says")').click();
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
  });

  test('tapping a film opens 8-category rating panel', async ({ page }) => {
    await skipToStarters(page);

    // Dismiss scoring spotlight if shown (first-time popup)
    await page.locator('.starter-card-v2:not(.rated)').first().click();
    const spotlight = page.locator('.scoring-spotlight-overlay');
    if (await spotlight.count() > 0) {
      await spotlight.locator('button:has-text("Got it")').click();
      await page.waitForTimeout(300);
    }

    const rateCard = page.locator('.starter-rate-card');
    await expect(rateCard).toBeVisible({ timeout: 3000 });
    // Now shows all 8 category sliders in 50/50 layout (no single slider)
    await expect(rateCard.locator('input[type="range"]')).toHaveCount(8);
    await expect(rateCard.locator('.score-split')).toHaveCount(8);
    await expect(rateCard.locator('button:has-text("Rate")')).toBeVisible();
  });

  test('category slider updates score display', async ({ page }) => {
    await skipToStarters(page);

    // Dismiss scoring spotlight
    await page.locator('.starter-card-v2:not(.rated)').first().click();
    const spotlight = page.locator('.scoring-spotlight-overlay');
    if (await spotlight.count() > 0) {
      await spotlight.locator('button:has-text("Got it")').click();
      await page.waitForTimeout(300);
    }

    await page.waitForSelector('.starter-rate-card', { timeout: 3000 });

    // Change first category slider to 90
    const slider = page.locator('.starter-rate-card input[type="range"]').first();
    await slider.fill('90');
    await slider.dispatchEvent('input');

    // The score value next to the slider should update
    const scoreVal = page.locator('.starter-rate-card .score-split').first().locator('[id^="starter-sv-"]');
    await expect(scoreVal).toHaveText('90');
  });

  test('rating a film updates progress circles', async ({ page }) => {
    await skipToStarters(page);
    const scoredBefore = await page.locator('.starter-progress-circle.scored').count();

    // Dismiss scoring spotlight
    await page.locator('.starter-card-v2:not(.rated)').first().click();
    const spotlight = page.locator('.scoring-spotlight-overlay');
    if (await spotlight.count() > 0) {
      await spotlight.locator('button:has-text("Got it")').click();
      await page.waitForTimeout(300);
    }

    await page.waitForSelector('.starter-rate-card', { timeout: 3000 });
    const cardsBefore = await page.locator('.starter-card-v2').count();
    await page.locator('.starter-rate-card button:has-text("Rate")').click();
    // Wait for stamp animation (800ms) + re-render + scroll
    await page.waitForTimeout(1500);

    const scoredAfter = await page.locator('.starter-progress-circle.scored').count();
    expect(scoredAfter).toBe(scoredBefore + 1);
    // Rated film is removed from grid (filtered out of candidate pool)
    const cardsAfter = await page.locator('.starter-card-v2').count();
    expect(cardsAfter).toBeLessThan(cardsBefore);
  });

  test('back button collapses rating panel', async ({ page }) => {
    await skipToStarters(page);

    // Dismiss scoring spotlight
    await page.locator('.starter-card-v2:not(.rated)').first().click();
    const spotlight = page.locator('.scoring-spotlight-overlay');
    if (await spotlight.count() > 0) {
      await spotlight.locator('button:has-text("Got it")').click();
      await page.waitForTimeout(300);
    }

    await page.waitForSelector('.starter-rate-card', { timeout: 3000 });

    await page.locator('.starter-rate-card').getByText('← Back').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.starter-rate-card')).toHaveCount(0);
  });

  test('"Show me more" loads more films', async ({ page }) => {
    await skipToStarters(page);
    const cardsBefore = await page.locator('.starter-card-v2').count();
    const showMore = page.getByText('Show me more');

    if (await showMore.isVisible()) {
      await showMore.click();
      await page.waitForTimeout(2000);
      expect(await page.locator('.starter-card-v2').count()).toBeGreaterThan(cardsBefore);
    }
  });
});
