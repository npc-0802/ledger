// @ts-check
import { test, expect } from '@playwright/test';
import { injectAuthState, mockSupabase } from './fixtures.js';

// MOVIES isn't exposed on window.__ledger; the persisted list is the same order.
const movieIndex = title => page => page.evaluate(t => {
  const films = JSON.parse(localStorage.getItem('palatemap_films_v1') || '[]');
  return films.findIndex(f => f.title === t);
}, title);
const titleAt = i => page => page.evaluate(n => {
  const films = JSON.parse(localStorage.getItem('palatemap_films_v1') || '[]');
  return films[n].title;
}, i);

test.describe('Focused calibration (one film)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(injectAuthState());
    await page.goto('/');
    await page.waitForTimeout(1200);
  });

  test('every category filter can start a session', async ({ page }) => {
    const alerts = [];
    page.on('dialog', async d => { alerts.push(d.message()); await d.dismiss(); });
    await page.evaluate(() => window.showScreen('calibration'));

    for (const cat of ['all','story','craft','performance','world','experience','hold','ending','singularity']) {
      alerts.length = 0;
      await page.evaluate(c => window.selectCalCat(c), cat);
      await page.evaluate(() => window.startCalibration());
      await page.waitForTimeout(200);
      await expect(page.locator('#cal-matchups'), `category "${cat}" should start`).toBeVisible();
      expect(alerts, `category "${cat}" should not alert`).toHaveLength(0);
      await page.evaluate(() => window.resetCalibration());
    }
  });

  test('search selects a film and every matchup includes it', async ({ page }) => {
    await page.evaluate(() => window.showScreen('calibration'));
    await page.fill('#cal-target-search', 'parasite');
    await page.waitForTimeout(200);

    await expect(page.locator('.cal-target-result')).toHaveCount(1);
    await page.locator('.cal-target-result').first().click();

    // Chip replaces the search box
    await expect(page.locator('#cal-target-chip')).toBeVisible();
    await expect(page.locator('#cal-target-chip')).toContainText('Parasite');
    await expect(page.locator('#cal-target-search-wrap')).toBeHidden();

    await page.evaluate(() => window.startCalibration());
    await page.waitForTimeout(250);
    await expect(page.locator('#cal-target-banner')).toContainText('Parasite');

    // Walk the session; the target must appear in every single matchup.
    for (let i = 0; i < 8; i++) {
      const visible = await page.locator('#cal-matchups').isVisible();
      if (!visible) break;
      await expect(page.locator('#cal-matchup-card')).toContainText('Parasite');
      await page.evaluate(() => window.calChoose('a'));
      await page.waitForTimeout(200);
    }
  });

  test('target film appears on both sides across a session', async ({ page }) => {
    // Guards the side-randomisation: if the target were always card A, a user
    // would learn the position rather than answer the question.
    const idx = await movieIndex('Parasite')(page);
    const sides = await page.evaluate(idx => {
      const seen = new Set();
      for (let run = 0; run < 40; run++) {
        window.calSelectTargetFilm(idx);
        window.startCalibration();
        const card = document.getElementById('cal-matchup-card');
        const first = card.querySelector('.cal-film-card');
        seen.add(first && first.textContent.includes('Parasite') ? 'A' : 'B');
        window.resetCalibration();
      }
      return [...seen];
    }, idx);
    expect(sides.sort()).toEqual(['A', 'B']);
  });

  test('Recalibrate in the film modal starts a focused session', async ({ page }) => {
    await page.evaluate(() => window.showScreen('myfilms'));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.openModal(0));
    await page.waitForTimeout(400);

    const title = await titleAt(0)(page);
    await page.locator('.modal-recalibrate-btn').click();
    await page.waitForTimeout(500);

    // Modal closed, Calibrate screen active, session already running
    await expect(page.locator('#filmModal')).not.toHaveClass(/open/);
    await expect(page.locator('#calibration')).toHaveClass(/active/);
    await expect(page.locator('#cal-matchups')).toBeVisible();
    await expect(page.locator('#cal-target-banner')).toContainText(title);
    await expect(page.locator('#cal-matchup-card')).toContainText(title);
  });

  test('clearing the focus returns to whole-collection mode', async ({ page }) => {
    await page.evaluate(() => window.showScreen('calibration'));
    await page.evaluate(i => window.calSelectTargetFilm(i), await movieIndex('Parasite')(page));
    await expect(page.locator('#cal-target-chip')).toBeVisible();

    await page.locator('.cal-target-chip-clear').click();
    await expect(page.locator('#cal-target-chip')).toBeHidden();
    await expect(page.locator('#cal-target-search-wrap')).toBeVisible();

    await page.evaluate(() => window.startCalibration());
    await page.waitForTimeout(250);
    await expect(page.locator('#cal-target-banner')).toBeHidden();
  });

  test('start over keeps the focused film', async ({ page }) => {
    await page.evaluate(() => window.showScreen('calibration'));
    await page.evaluate(i => { window.calSelectTargetFilm(i); window.startCalibration(); },
      await movieIndex('Parasite')(page));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.resetCalibration());
    await page.waitForTimeout(200);

    await expect(page.locator('#cal-setup')).toBeVisible();
    await expect(page.locator('#cal-target-chip')).toContainText('Parasite');
  });
});
