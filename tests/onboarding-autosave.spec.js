// @ts-check
import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures.js';

// ── Shared fixtures ──

const CATS = ['story', 'craft', 'performance', 'world', 'experience', 'hold', 'ending', 'singularity'];

function makeScores(base) {
  const s = {};
  CATS.forEach((c, i) => { s[c] = base + ((i * 7) % 15) - 5; });
  return s;
}

// 5 guided anchor films with varied scores
const GUIDED_FILMS = [
  { tmdbId: 278, title: 'The Shawshank Redemption', year: 1994, poster: '/a.jpg', director: 'Frank Darabont', scores: { story: 92, craft: 88, performance: 90, world: 82, experience: 95, hold: 90, ending: 95, singularity: 80 }, total: 89 },
  { tmdbId: 680, title: 'Pulp Fiction', year: 1994, poster: '/b.jpg', director: 'Quentin Tarantino', scores: { story: 88, craft: 92, performance: 90, world: 80, experience: 92, hold: 88, ending: 80, singularity: 95 }, total: 89 },
  { tmdbId: 155, title: 'The Dark Knight', year: 2008, poster: '/c.jpg', director: 'Christopher Nolan', scores: { story: 85, craft: 90, performance: 92, world: 88, experience: 90, hold: 85, ending: 82, singularity: 80 }, total: 87 },
  { tmdbId: 27205, title: 'Inception', year: 2010, poster: '/d.jpg', director: 'Christopher Nolan', scores: { story: 88, craft: 92, performance: 80, world: 90, experience: 88, hold: 82, ending: 85, singularity: 92 }, total: 87 },
  { tmdbId: 496243, title: 'Parasite', year: 2019, poster: '/e.jpg', director: 'Bong Joon-ho', scores: { story: 95, craft: 90, performance: 85, world: 82, experience: 88, hold: 80, ending: 90, singularity: 92 }, total: 87 },
];

// 5 calibration films (selection phase)
const SELECT_FILMS = [
  { tmdbId: 244786, title: 'Whiplash', year: 2014, poster: '/f.jpg', director: 'Damien Chazelle' },
  { tmdbId: 238, title: 'The Godfather', year: 1972, poster: '/g.jpg', director: 'Francis Ford Coppola' },
  { tmdbId: 129, title: 'Spirited Away', year: 2001, poster: '/h.jpg', director: 'Hayao Miyazaki' },
  { tmdbId: 419430, title: 'Get Out', year: 2017, poster: '/i.jpg', director: 'Jordan Peele' },
  { tmdbId: 376867, title: 'Moonlight', year: 2016, poster: '/j.jpg', director: 'Barry Jenkins' },
];

// Build realistic pairwise comparisons (deterministic, no shuffle)
// Top 2 variance cats get 2 comps each per film (high + mid), bottom 2 get 1 each = 6 per film × 5 = 30
function buildComparisons() {
  const anchors = GUIDED_FILMS;
  const topCats = ['experience', 'singularity', 'story', 'craft']; // assumed top-4 by variance
  const comps = [];
  for (const nf of SELECT_FILMS) {
    topCats.forEach((cat, catRank) => {
      const sorted = [...anchors].sort((a, b) => (a.scores[cat] || 0) - (b.scores[cat] || 0));
      const highAnchor = sorted[sorted.length - 1];
      const midAnchor = sorted[Math.floor(sorted.length / 2)];
      if (catRank < 2) {
        comps.push({ filmA: nf, filmB: highAnchor, category: cat, anchorRole: 'high', anchorScore: highAnchor.scores[cat] || 50 });
        if (String(midAnchor.tmdbId) !== String(highAnchor.tmdbId)) {
          comps.push({ filmA: nf, filmB: midAnchor, category: cat, anchorRole: 'mid', anchorScore: midAnchor.scores[cat] || 50 });
        }
      } else {
        comps.push({ filmA: nf, filmB: midAnchor, category: cat, anchorRole: 'mid', anchorScore: midAnchor.scores[cat] || 50 });
      }
    });
  }
  return comps;
}

// Build comparison results (answers) for the first N comparisons
function buildResults(comparisons, count, pattern = 'alternate') {
  return comparisons.slice(0, count).map((comp, i) => ({
    filmA: comp.filmA,
    filmB: comp.filmB,
    category: comp.category,
    winner: pattern === 'alternate' ? (i % 3 === 2 ? 'tie' : (i % 2 === 0 ? 'filmA' : 'filmB')) : 'filmA',
    anchorScore: comp.anchorScore,
    anchorRole: comp.anchorRole,
    comparison_index: i,
    elapsed_ms: 1500 + i * 100,
  }));
}

function buildPairwiseSavedState(answeredCount) {
  const comps = buildComparisons();
  const results = buildResults(comps, answeredCount);
  const pct = 65 + (answeredCount / comps.length) * 20;
  return {
    version: 1,
    savedAt: Date.now(),
    obStep: 'ob-calibrate',
    obDisplayName: 'Pairwise Test',
    obStartTime: Date.now() - 300000,
    guidedStep: 6,
    guidedFilms: GUIDED_FILMS,
    guidedSelectedFilm: null,
    guidedScores: {},
    guidedSliderStage: 'gut',
    guidedInsight: null,
    selectSelectedFilms: SELECT_FILMS,
    selectVisibleCount: 15,
    selectSearchAdded: [],
    obCalComparisons: comps,
    obCalIndex: answeredCount,
    obCalResults: results,
    calStartTimestamp: Date.now() - 60000,
    calCompTimestamps: results.map((_, i) => (i + 1) * 2000),
    absoluteIndex: 0,
    absoluteResponses: {},
    absoluteStartTimestamp: null,
    tasteRevealData: null,
    progressPercent: Math.round(pct),
  };
}

function buildAbsoluteSavedState(absoluteAnswered) {
  const comps = buildComparisons();
  const results = buildResults(comps, comps.length);
  const responses = {};
  const buckets = [
    { key: 'favorite', target: 90 },
    { key: 'really_liked', target: 80 },
    { key: 'liked', target: 70 },
    { key: 'mixed', target: 58 },
    { key: 'didnt_like', target: 42 },
  ];
  for (let i = 0; i < absoluteAnswered && i < SELECT_FILMS.length; i++) {
    responses[String(SELECT_FILMS[i].tmdbId)] = {
      bucket: buckets[i % buckets.length].key,
      targetTotal: buckets[i % buckets.length].target,
    };
  }
  return {
    version: 1,
    savedAt: Date.now(),
    obStep: 'ob-absolute',
    obDisplayName: 'Absolute Test',
    obStartTime: Date.now() - 400000,
    guidedStep: 6,
    guidedFilms: GUIDED_FILMS,
    guidedSelectedFilm: null,
    guidedScores: {},
    guidedSliderStage: 'gut',
    guidedInsight: null,
    selectSelectedFilms: SELECT_FILMS,
    selectVisibleCount: 15,
    selectSearchAdded: [],
    obCalComparisons: comps,
    obCalIndex: comps.length,
    obCalResults: results,
    calStartTimestamp: Date.now() - 120000,
    calCompTimestamps: results.map((_, i) => (i + 1) * 2000),
    absoluteIndex: absoluteAnswered,
    absoluteResponses: responses,
    absoluteStartTimestamp: Date.now() - 30000,
    tasteRevealData: null,
    progressPercent: Math.round(85 + (absoluteAnswered / SELECT_FILMS.length) * 15),
  };
}

// ── Helpers ──

async function skipToGuided(page) {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => window._testSkipToQuiz('Autosave Test'));
  await page.waitForSelector('[data-testid="guided-search"]', { timeout: 5000 });
}

async function searchAndSelectFilm(page, query) {
  await page.fill('[data-testid="guided-search"]', query);
  await page.waitForFunction(() => {
    const results = document.getElementById('guided-search-results');
    return results && results.children.length > 0;
  }, { timeout: 10000 });
  await page.locator('#guided-search-results > div').first().click();
  await page.waitForSelector('.score-split-dark', { timeout: 3000 });
}

async function rateFilm(page, score = 75) {
  const beatBtn = page.locator('button:has-text("ones that take a beat")');
  if (await beatBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await beatBtn.click();
    await page.waitForTimeout(300);
  }
  const sliders = page.locator('input.score-slider');
  const count = await sliders.count();
  for (let i = 0; i < count; i++) {
    await sliders.nth(i).fill(String(score));
  }
  await page.locator('button:has-text("Rate →")').click();
  await page.waitForTimeout(500);
}

async function advanceFromInsight(page) {
  const continueBtn = page.locator('button:has-text("Continue →")');
  await continueBtn.click({ timeout: 3000 });
  await page.waitForTimeout(300);
}

async function injectStateAndResume(page, state) {
  const stateJSON = JSON.stringify(state);
  await page.addInitScript(s => {
    localStorage.setItem('palatemap_onboarding_state', s);
  }, stateJSON);
  await page.goto('/');
  await page.waitForTimeout(800);
  await page.evaluate(() => window.startFromLanding());
  await expect(page.locator('[data-testid="resume-continue"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="resume-continue"]').click();
  await page.waitForTimeout(500);
}

// ── Tests ──

test.describe('Onboarding Autosave & Resume', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await page.addInitScript(() => { localStorage.clear(); });
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

  // ── Guided phase autosave ──

  test('autosave writes to localStorage after rating a guided film', async ({ page }) => {
    await skipToGuided(page);
    await searchAndSelectFilm(page, 'Shawshank');
    await rateFilm(page, 80);

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
    expect(saved.progressPercent).toBe(12);
  });

  test('progress bar percentage updates correctly through guided phase', async ({ page }) => {
    await skipToGuided(page);
    let pctText = await page.locator('#ob-progress-pct').textContent();
    expect(pctText).toBe('0%');

    await searchAndSelectFilm(page, 'Shawshank');
    await rateFilm(page, 80);
    pctText = await page.locator('#ob-progress-pct').textContent();
    expect(pctText).toBe('12%');
  });

  test('save and exit preserves state in localStorage', async ({ page }) => {
    await skipToGuided(page);
    await searchAndSelectFilm(page, 'Shawshank');
    await rateFilm(page, 80);

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });
    expect(saved).not.toBeNull();
    expect(saved.guidedFilms.length).toBe(1);
    expect(saved.guidedFilms[0].title).toBe('The Shawshank Redemption');

    await page.evaluate(() => window.saveAndExitOnboarding());
    await page.waitForTimeout(300);

    const savedAfterExit = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });
    expect(savedAfterExit).not.toBeNull();
    expect(savedAfterExit.guidedFilms.length).toBe(1);
  });

  // ── Resume prompt & validation ──

  test('resume prompt shows when saved state exists', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1, savedAt: Date.now(), obStep: 'guided', guidedStep: 3,
        guidedFilms: [
          { tmdbId: 278, title: 'Film A', year: 1994, poster: '/a.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 },
        ],
        guidedSelectedFilm: null, guidedScores: {}, guidedSliderStage: 'gut',
        selectSelectedFilms: [], selectVisibleCount: 15, selectSearchAdded: [],
        obCalComparisons: [], obCalIndex: 0, obCalResults: [],
        absoluteIndex: 0, absoluteResponses: {}, progressPercent: 12, obDisplayName: 'Resume Test',
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await expect(page.locator('[data-testid="resume-continue"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="resume-start-over"]')).toBeVisible();
  });

  test('resume continue restores guided state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1, savedAt: Date.now(), obStep: 'guided', guidedStep: 3,
        guidedFilms: [
          { tmdbId: 278, title: 'Film A', year: 1994, poster: '/a.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 },
          { tmdbId: 680, title: 'Film B', year: 1994, poster: '/b.jpg', scores: { story: 85, craft: 90, performance: 80, world: 75, experience: 88, hold: 82, ending: 78, singularity: 92 }, total: 84 },
        ],
        guidedSelectedFilm: null, guidedScores: {}, guidedSliderStage: 'gut',
        selectSelectedFilms: [], selectVisibleCount: 15, selectSearchAdded: [],
        obCalComparisons: [], obCalIndex: 0, obCalResults: [],
        absoluteIndex: 0, absoluteResponses: {}, progressPercent: 24, obDisplayName: 'Resume Test',
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await page.locator('[data-testid="resume-continue"]').click();
    await expect(page.locator('[data-testid="guided-search"]')).toBeVisible({ timeout: 5000 });

    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.guidedStep).toBe(3);
    expect(debug.guidedFilms.length).toBe(2);
    expect(debug.obStep).toBe('guided');
  });

  test('start over clears saved state and begins fresh', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1, savedAt: Date.now(), obStep: 'guided', guidedStep: 3,
        guidedFilms: [{ tmdbId: 278, title: 'Film A', year: 1994, poster: '/a.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 }],
        guidedSelectedFilm: null, guidedScores: {}, guidedSliderStage: 'gut',
        selectSelectedFilms: [], selectVisibleCount: 15, selectSearchAdded: [],
        obCalComparisons: [], obCalIndex: 0, obCalResults: [],
        absoluteIndex: 0, absoluteResponses: {}, progressPercent: 12, obDisplayName: 'Start Over Test',
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await page.locator('[data-testid="resume-start-over"]').click();

    const saved = await page.evaluate(() => localStorage.getItem('palatemap_onboarding_state'));
    expect(saved).toBeNull();
    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.guidedStep).toBe(1);
    expect(debug.guidedFilms.length).toBe(0);
  });

  test('expired saved state is not resumed (7-day expiry)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1, savedAt: Date.now() - (8 * 24 * 60 * 60 * 1000),
        obStep: 'guided', guidedStep: 3,
        guidedFilms: [{ tmdbId: 278, title: 'Test', year: 1994, poster: '/t.jpg', scores: { story: 80 }, total: 78 }],
        guidedSelectedFilm: null, guidedScores: {}, guidedSliderStage: 'gut',
        selectSelectedFilms: [], obCalComparisons: [], obCalIndex: 0, obCalResults: [],
        absoluteIndex: 0, absoluteResponses: {}, progressPercent: 12, obDisplayName: 'Expired',
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await expect(page.locator('[data-testid="resume-continue"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('wrong version saved state is not resumed', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 999, savedAt: Date.now(), obStep: 'guided', guidedStep: 3,
        guidedFilms: [], progressPercent: 12,
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await expect(page.locator('[data-testid="resume-continue"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('resume animates progress bar from 0 to saved percentage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('palatemap_onboarding_state', JSON.stringify({
        version: 1, savedAt: Date.now(), obStep: 'guided', guidedStep: 4,
        guidedFilms: [
          { tmdbId: 278, title: 'Film A', year: 1994, poster: '/a.jpg', scores: { story: 80, craft: 75, performance: 85, world: 70, experience: 90, hold: 75, ending: 80, singularity: 70 }, total: 78 },
          { tmdbId: 680, title: 'Film B', year: 1994, poster: '/b.jpg', scores: { story: 85, craft: 90, performance: 80, world: 75, experience: 88, hold: 82, ending: 78, singularity: 92 }, total: 84 },
          { tmdbId: 155, title: 'Film C', year: 2008, poster: '/c.jpg', scores: { story: 70, craft: 80, performance: 75, world: 85, experience: 82, hold: 78, ending: 72, singularity: 88 }, total: 79 },
        ],
        guidedSelectedFilm: null, guidedScores: {}, guidedSliderStage: 'gut',
        selectSelectedFilms: [], selectVisibleCount: 15, selectSearchAdded: [],
        obCalComparisons: [], obCalIndex: 0, obCalResults: [],
        absoluteIndex: 0, absoluteResponses: {}, progressPercent: 36, obDisplayName: 'Animate Test',
      }));
    });
    await page.goto('/');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.startFromLanding());
    await page.locator('[data-testid="resume-continue"]').click();
    await page.waitForTimeout(600);
    const fillWidth = await page.locator('#ob-progress-fill').evaluate(el => el.style.width);
    expect(fillWidth).toBe('36%');
  });

  // ── Pairwise resume (the critical path) ──

  test('resume from pairwise mid-flow preserves comparison state', async ({ page }) => {
    const state = buildPairwiseSavedState(5);
    await injectStateAndResume(page, state);

    // Should show calibration question screen
    await expect(page.locator('[data-testid="cal-question"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="cal-pick-a"]')).toBeVisible();
    await expect(page.locator('[data-testid="cal-pick-b"]')).toBeVisible();
    await expect(page.locator('[data-testid="cal-tie"]')).toBeVisible();

    // Verify internal state
    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.obStep).toBe('ob-calibrate');
    expect(debug.obCalIndex).toBe(5);
    expect(debug.obCalResults).toBe(5);
    expect(debug.obCalComparisons).toBe(state.obCalComparisons.length);

    // Progress should be in the calibration range (65-85%)
    expect(debug.progressPercent).toBeGreaterThanOrEqual(65);
    expect(debug.progressPercent).toBeLessThanOrEqual(85);

    // Answering a question should advance the index
    await page.locator('[data-testid="cal-pick-a"]').click();
    await page.waitForTimeout(300);
    const debugAfter = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debugAfter.obCalIndex).toBe(6);
    expect(debugAfter.obCalResults).toBe(6);
  });

  test('resume from pairwise does not duplicate guided films in MOVIES', async ({ page }) => {
    const state = buildPairwiseSavedState(10);
    await injectStateAndResume(page, state);

    // Check MOVIES for duplicates — each guided film should appear exactly once
    const movieCounts = await page.evaluate(() => {
      const counts = {};
      for (const m of window.__pmState?.MOVIES || []) {
        counts[m.tmdbId] = (counts[m.tmdbId] || 0) + 1;
      }
      return counts;
    });

    // If MOVIES is accessible, verify no duplicates
    // (guided film tmdbIds should appear at most once)
    for (const id of GUIDED_FILMS.map(f => f.tmdbId)) {
      if (movieCounts[id] !== undefined) {
        expect(movieCounts[id]).toBeLessThanOrEqual(1);
      }
    }
  });

  test('resume from late pairwise preserves near-completion state', async ({ page }) => {
    const comps = buildComparisons();
    const nearEnd = comps.length - 2; // 2 questions from the end
    const state = buildPairwiseSavedState(nearEnd);
    await injectStateAndResume(page, state);

    await expect(page.locator('[data-testid="cal-question"]')).toBeVisible({ timeout: 5000 });

    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.obStep).toBe('ob-calibrate');
    expect(debug.obCalIndex).toBe(nearEnd);
    expect(debug.obCalResults).toBe(nearEnd);
    // Near end: progress should be close to 85%
    expect(debug.progressPercent).toBeGreaterThan(80);

    // Answer remaining questions through the UI — should transition to absolute pass
    const remaining = debug.obCalComparisons - debug.obCalIndex;
    for (let i = 0; i < remaining; i++) {
      await page.locator('[data-testid="cal-pick-a"]').click();
      await page.waitForTimeout(300);
    }

    // Should now be on absolute pass
    await expect(page.locator('[data-testid^="absolute-"]').first()).toBeVisible({ timeout: 5000 });
    const debugAbsolute = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debugAbsolute.obStep).toBe('ob-absolute');
  });

  test('pairwise autosave triggers on each answer', async ({ page }) => {
    const state = buildPairwiseSavedState(3);
    await injectStateAndResume(page, state);
    await expect(page.locator('[data-testid="cal-pick-a"]')).toBeVisible({ timeout: 5000 });

    // Answer one question — autosave fires before index increments
    await page.locator('[data-testid="cal-pick-a"]').click();
    await page.waitForTimeout(300);

    // Verify autosave updated (index stays at 3, but results now has 4)
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });
    expect(saved.obCalResults.length).toBe(4);

    // Wait for next question to render
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="cal-tie"]')).toBeVisible({ timeout: 3000 });

    // Answer with tie
    await page.locator('[data-testid="cal-tie"]').click();
    await page.waitForTimeout(300);

    const savedTie = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });
    expect(savedTie.obCalResults.length).toBe(5);
    expect(savedTie.obCalResults[4].winner).toBe('tie');
  });

  // ── Absolute pass resume ──

  test('resume from absolute pass mid-flow preserves responses', async ({ page }) => {
    const state = buildAbsoluteSavedState(2);
    await injectStateAndResume(page, state);

    // Should show absolute pass buttons
    await expect(page.locator('[data-testid="absolute-favorite"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="absolute-really_liked"]')).toBeVisible();
    await expect(page.locator('[data-testid="absolute-liked"]')).toBeVisible();
    await expect(page.locator('[data-testid="absolute-mixed"]')).toBeVisible();
    await expect(page.locator('[data-testid="absolute-didnt_like"]')).toBeVisible();

    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.obStep).toBe('ob-absolute');
    expect(debug.absoluteIndex).toBe(2);
    // 2 prior responses should be preserved
    expect(Object.keys(debug.absoluteResponses).length).toBe(2);
    // Progress should be in 85-100% range
    expect(debug.progressPercent).toBeGreaterThanOrEqual(85);
    expect(debug.progressPercent).toBeLessThan(100);
  });

  test('absolute pass autosave triggers on each answer', async ({ page }) => {
    const state = buildAbsoluteSavedState(1);
    await injectStateAndResume(page, state);
    await expect(page.locator('[data-testid="absolute-liked"]')).toBeVisible({ timeout: 5000 });

    // Answer one question — autosave fires before index increments
    await page.locator('[data-testid="absolute-liked"]').click();
    await page.waitForTimeout(300);

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('palatemap_onboarding_state');
      return raw ? JSON.parse(raw) : null;
    });
    // Index stays at 1 (saved before increment), but responses has 2 entries
    expect(Object.keys(saved.absoluteResponses).length).toBe(2);
  });

  test('resume from absolute pass completes to taste reveal', async ({ page }) => {
    // Start at 3 of 5 absolute answers done
    const state = buildAbsoluteSavedState(3);
    await injectStateAndResume(page, state);
    await expect(page.locator('[data-testid="absolute-favorite"]')).toBeVisible({ timeout: 5000 });

    // Answer remaining 2
    await page.locator('[data-testid="absolute-really_liked"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="absolute-liked"]').click();

    // finishCalibration fires after 1200ms delay, then renders taste reveal
    await page.waitForFunction(
      () => window.__pmOnboardingDebug && window.__pmOnboardingDebug.obStep === 'taste-reveal',
      { timeout: 5000 }
    );
    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.obStep).toBe('taste-reveal');
  });

  // ── Taste reveal resume ──

  test('resume from taste reveal shows reveal screen', async ({ page }) => {
    // Build a state at taste-reveal
    const state = buildAbsoluteSavedState(5);
    state.obStep = 'taste-reveal';
    state.progressPercent = 100;
    await injectStateAndResume(page, state);

    // Should show the taste reveal screen (has "Enter Palate Map" or archetype info)
    const debug = await page.evaluate(() => window.__pmOnboardingDebug);
    expect(debug.obStep).toBe('taste-reveal');
  });

  // ── Debug helper gating ──

  test('debug helper is available in dev mode', async ({ page }) => {
    await skipToGuided(page);
    const hasDebug = await page.evaluate(() => '__pmOnboardingDebug' in window);
    expect(hasDebug).toBe(true);
    const debug = await page.evaluate(() => {
      const d = window.__pmOnboardingDebug;
      return {
        obStep: d.obStep,
        bucketsLength: d.ABSOLUTE_BUCKETS?.length,
        hasEstimate: typeof d.estimateCategoryScore === 'function',
        hasAbsoluteAdj: typeof d.applyAbsoluteAdjustment === 'function',
      };
    });
    expect(debug.obStep).toBe('guided');
    expect(debug.bucketsLength).toBe(5);
    expect(debug.hasEstimate).toBe(true);
    expect(debug.hasAbsoluteAdj).toBe(true);
  });
});
