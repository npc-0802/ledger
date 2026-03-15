// @ts-check
import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures.js';

// Helper: skip auth and land on guided film 1 search
async function skipToGuided(page) {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => window._testSkipToQuiz('Autosave Test'));
  await page.waitForSelector('[data-testid="guided-search"]', { timeout: 5000 });
}

// Helper: search for a film and select it
async function searchAndSelectFilm(page, query) {
  await page.fill('[data-testid="guided-search"]', query);
  await page.waitForFunction(() => {
    const results = document.getElementById('guided-search-results');
    return results && results.children.length > 0;
  }, { timeout: 10000 });
  await page.locator('#guided-search-results > div').first().click();
  await page.waitForSelector('.score-split-dark', { timeout: 3000 });
}

// Helper: rate a film with all 8 sliders (set all to the same value for simplicity)
async function rateFilm(page, score = 75) {
  // If on first film, need to reveal beat sliders first
  const beatBtn = page.locator('button:has-text("ones that take a beat")');
  if (await beatBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await beatBtn.click();
    await page.waitForTimeout(300);
  }

  // Set all sliders
  const sliders = page.locator('input.score-slider');
  const count = await sliders.count();
  for (let i = 0; i < count; i++) {
    await sliders.nth(i).fill(String(score));
  }

  // Click Rate
  await page.locator('button:has-text("Rate →")').click();
  await page.waitForTimeout(500);
}

// Helper: advance from insight screen to next film
async function advanceFromInsight(page) {
  const continueBtn = page.locator('button:has-text("Continue →")');
  await continueBtn.click({ timeout: 3000 });
  await page.waitForTimeout(300);
}

// Helper: complete one full guided film (search, select, rate, advance)
async function completeGuidedFilm(page, filmQuery, score = 75) {
  await searchAndSelectFilm(page, filmQuery);
  await rateFilm(page, score);
  await advanceFromInsight(page);
}

test.describe('Onboarding Autosave & Resume', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(() => { localStorage.clear(); });
    // Mock TMDB API for deterministic search results
    await page.route('https://api.themoviedb.org/3/search/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { id: 278, title: 'The Shawshank Redemption', release_date: '1994-09-23', poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg' },
            { id: 680, title: 'Pulp Fiction', release_date: '1994-10-14', poster_path: '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg' },
            { id: 155, title: 'The Dark Knight', release_date: '2008-07-18', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
          ],
        }),
      });
    });
    // Mock TMDB movie detail calls
    await page.route('https://api.themoviedb.org/3/movie/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 278, title: 'The Shawshank Redemption', release_date: '1994-09-23',
          poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
          credits: { crew: [{ job: 'Director', name: 'Frank Darabont' }] },
        }),
      });
    });
  });

  test('autosave writes to localStorage after rating a guided film', async ({ page }) => {
    await skipToGuided(page);
    await searchAndSelectFilm(page, 'Shawshank');
    await rateFilm(page, 80);

    // Check localStorage for autosave
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });

    expect(saved).not.toBeNull();
    expect(saved.version).toBe(1);
    expect(saved.guidedFilms.length).toBe(1);
    expect(saved.obStep).toMatch(/guided-insight|guided/);
  });

  test('autosave captures correct progress percentage', async ({ page }) => {
    await skipToGuided(page);
    await searchAndSelectFilm(page, 'Shawshank');
    await rateFilm(page, 80);

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });

    // 1 film rated = 12% progress
    expect(saved.progressPercent).toBe(12);
  });

  test('resume prompt shows when saved state exists', async ({ page }) => {
    // Inject a saved state into localStorage before page load
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        obStep: 'guided',
        guidedStep: 3,
        guidedFilms: [
          { tmdbId: 278, title: 'The Shawshank Redemption', year: 1994, poster: '/test.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 },
          { tmdbId: 680, title: 'Pulp Fiction', year: 1994, poster: '/test2.jpg', scores: { story: 85, craft: 90, performance: 80, world: 75, experience: 88, hold: 82, ending: 78, singularity: 92 }, total: 84 },
        ],
        guidedSelectedFilm: null,
        guidedScores: {},
        guidedSliderStage: 'gut',
        guidedInsight: null,
        selectSelectedFilms: [],
        selectVisibleCount: 15,
        selectSearchAdded: [],
        obCalComparisons: [],
        obCalIndex: 0,
        obCalResults: [],
        absoluteIndex: 0,
        absoluteResponses: {},
        progressPercent: 24,
        obDisplayName: 'Test Resume',
      }));
    });

    await page.goto('/');
    await page.waitForTimeout(800);

    // Click the start button that triggers onboarding
    const startBtn = page.locator('button:has-text("Continue with Google"), [onclick="startFromLanding()"]');
    if (await startBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.evaluate(() => window.startFromLanding());
    }

    // Resume prompt should appear
    await expect(page.locator('[data-testid="resume-continue"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="resume-start-over"]')).toBeVisible();
  });

  test('resume continue restores onboarding state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        obStep: 'guided',
        guidedStep: 3,
        guidedFilms: [
          { tmdbId: 278, title: 'The Shawshank Redemption', year: 1994, poster: '/test.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 },
          { tmdbId: 680, title: 'Pulp Fiction', year: 1994, poster: '/test2.jpg', scores: { story: 85, craft: 90, performance: 80, world: 75, experience: 88, hold: 82, ending: 78, singularity: 92 }, total: 84 },
        ],
        guidedSelectedFilm: null,
        guidedScores: {},
        guidedSliderStage: 'gut',
        guidedInsight: null,
        selectSelectedFilms: [],
        selectVisibleCount: 15,
        selectSearchAdded: [],
        obCalComparisons: [],
        obCalIndex: 0,
        obCalResults: [],
        absoluteIndex: 0,
        absoluteResponses: {},
        progressPercent: 24,
        obDisplayName: 'Test Resume',
      }));
    });

    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await page.locator('[data-testid="resume-continue"]').click();

    // Should restore to guided step 3 (film search visible)
    await expect(page.locator('[data-testid="guided-search"]')).toBeVisible({ timeout: 5000 });

    // Debug helper should report correct state
    const debugState = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debugState.guidedStep).toBe(3);
    expect(debugState.guidedFilms.length).toBe(2);
    expect(debugState.obStep).toBe('guided');
  });

  test('start over clears saved state and begins fresh', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        obStep: 'guided',
        guidedStep: 3,
        guidedFilms: [
          { tmdbId: 278, title: 'The Shawshank Redemption', year: 1994, poster: '/test.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 },
        ],
        guidedSelectedFilm: null,
        guidedScores: {},
        guidedSliderStage: 'gut',
        selectSelectedFilms: [],
        selectVisibleCount: 15,
        selectSearchAdded: [],
        obCalComparisons: [],
        obCalIndex: 0,
        obCalResults: [],
        absoluteIndex: 0,
        absoluteResponses: {},
        progressPercent: 12,
        obDisplayName: 'Test Start Over',
      }));
    });

    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await page.locator('[data-testid="resume-start-over"]').click();

    // localStorage should be cleared
    const saved = await page.evaluate(() => localStorage.getItem('palatemap_onboarding_state'));
    expect(saved).toBeNull();

    // Should be at step 1 of onboarding
    const debugState = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debugState.guidedStep).toBe(1);
    expect(debugState.guidedFilms.length).toBe(0);
  });

  test('expired saved state is not resumed (7-day expiry)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1,
        savedAt: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
        obStep: 'guided',
        guidedStep: 3,
        guidedFilms: [{ tmdbId: 278, title: 'Test', year: 1994, poster: '/t.jpg', scores: { story: 80 }, total: 78 }],
        guidedSelectedFilm: null,
        guidedScores: {},
        guidedSliderStage: 'gut',
        selectSelectedFilms: [],
        obCalComparisons: [],
        obCalIndex: 0,
        obCalResults: [],
        absoluteIndex: 0,
        absoluteResponses: {},
        progressPercent: 12,
        obDisplayName: 'Expired User',
      }));
    });

    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());

    // Should NOT show resume prompt — expired state should be cleared
    // Instead should show the fresh onboarding name screen
    await expect(page.locator('[data-testid="resume-continue"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('wrong version saved state is not resumed', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 999, // wrong version
        savedAt: Date.now(),
        obStep: 'guided',
        guidedStep: 3,
        guidedFilms: [],
        progressPercent: 12,
      }));
    });

    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await expect(page.locator('[data-testid="resume-continue"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('save and exit preserves state in localStorage', async ({ page }) => {
    // Skip to guided, rate one film, then verify save-exit works via state injection
    await skipToGuided(page);
    await searchAndSelectFilm(page, 'Shawshank');
    await rateFilm(page, 80);

    // At this point, one film is rated and autosave has triggered.
    // Verify autosaved state has the film.
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });
    expect(saved).not.toBeNull();
    expect(saved.guidedFilms.length).toBe(1);
    expect(saved.guidedFilms[0].title).toBe('The Shawshank Redemption');
    expect(saved.version).toBe(1);
    expect(saved.savedAt).toBeGreaterThan(0);

    // Now call saveAndExitOnboarding directly and verify state persists
    await page.evaluate(() => window.saveAndExitOnboarding());
    await page.waitForTimeout(300);

    const savedAfterExit = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });
    expect(savedAfterExit).not.toBeNull();
    expect(savedAfterExit.guidedFilms.length).toBe(1);
  });

  test('progress bar percentage updates correctly through guided phase', async ({ page }) => {
    await skipToGuided(page);

    // Before any films: 0%
    let pctText = await page.locator('#ob-progress-pct').textContent();
    expect(pctText).toBe('0%');

    // Rate first film
    await searchAndSelectFilm(page, 'Shawshank');
    await rateFilm(page, 80);

    // After 1 film: 12%
    pctText = await page.locator('#ob-progress-pct').textContent();
    expect(pctText).toBe('12%');
  });

  test('debug helper exposes correct state', async ({ page }) => {
    await skipToGuided(page);

    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.obStep).toBe('guided');
    expect(debug.guidedStep).toBe(1);
    expect(debug.guidedFilms).toEqual([]);
    expect(debug.progressPercent).toBe(0);
    expect(debug.ABSOLUTE_BUCKETS).toHaveLength(5);
  });

  test('resume animates progress bar from 0 to saved percentage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        obStep: 'guided',
        guidedStep: 4,
        guidedFilms: [
          { tmdbId: 278, title: 'Film A', year: 1994, poster: '/a.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 },
          { tmdbId: 680, title: 'Film B', year: 1994, poster: '/b.jpg', scores: { story: 85, craft: 90, performance: 80, world: 75, experience: 88, hold: 82, ending: 78, singularity: 92 }, total: 84 },
          { tmdbId: 155, title: 'Film C', year: 2008, poster: '/c.jpg', scores: { story: 70, craft: 80, performance: 75, world: 85, experience: 82, hold: 78, ending: 72, singularity: 88 }, total: 79 },
        ],
        guidedSelectedFilm: null,
        guidedScores: {},
        guidedSliderStage: 'gut',
        selectSelectedFilms: [],
        selectVisibleCount: 15,
        selectSearchAdded: [],
        obCalComparisons: [],
        obCalIndex: 0,
        obCalResults: [],
        absoluteIndex: 0,
        absoluteResponses: {},
        progressPercent: 36,
        obDisplayName: 'Animate Test',
      }));
    });

    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await page.locator('[data-testid="resume-continue"]').click();

    // Wait for progress bar to settle
    await page.waitForTimeout(600);

    // Progress bar fill should be at 36%
    const fillWidth = await page.locator('#ob-progress-fill').evaluate(el => el.style.width);
    expect(fillWidth).toBe('36%');
  });
});
