// @ts-check
import { test, expect } from '@playwright/test';
import { injectAuthState, mockSupabase } from './fixtures.js';

// Mock the external book providers so the Books tab is deterministic + offline.
async function mockBookApis(page) {
  // Covers — never let real image requests hang the test
  await page.route('https://covers.openlibrary.org/**', route => route.abort());
  // Open Library search
  await page.route('https://openlibrary.org/search.json**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      docs: [{
        key: '/works/OL27448W',
        title: 'The Left Hand of Darkness',
        author_name: ['Ursula K. Le Guin'],
        first_publish_year: 1969,
        cover_i: 8231856,
        isbn: ['9780441478125'],
        subject: ['science fiction', 'gender'],
        number_of_pages_median: 304,
      }],
    }),
  }));
  // Open Library work endpoint — supplies the canonical description + series.
  // The detail-modal path always calls /works/<id>.json before falling back to
  // Google Books, so this is the primary synopsis source in tests.
  await page.route('https://openlibrary.org/works/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      description: 'A planet where everyone is both, neither, and either gender.',
      series: ['Hainish Cycle (book 4)'],
      subjects: ['gender', 'first contact'],
    }),
  }));
  // Google Books enrichment — empty is fine
  await page.route('https://www.googleapis.com/books/**', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }),
  }));
  // Proxy — branch on the metered source: curation returns a shortlist artifact,
  // everything else returns a per-item prediction. Both piggyback a credit balance.
  await page.route('https://palate-map-proxy.noahparikhcott.workers.dev/**', route => {
    const body = route.request().postData() || '';
    if (body.includes('book_curate')) {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          content: [{ type: 'text', text: JSON.stringify({
            // 9780385539258 is deliberately returned in BOTH lanes to exercise dedupe.
            safe_picks: [{ book_key: 'isbn:9780385539258', rank: 1, why: 'Quiet character intensity', fit_dimensions: ['performance', 'hold'], confidence: 0.85 }],
            upside_picks: [
              { book_key: 'ol:OL27448W', rank: 1, why: 'Singular speculative ceiling', upside_basis: 'singularity + world', confidence: 0.6 },
              { book_key: 'isbn:9780385539258', rank: 2, why: 'Could overdeliver', upside_basis: 'emotional adhesion', confidence: 0.55 },
            ],
          }) }],
          _credits: { used: 2, limit: 500, remaining: 498, tier: 'premium' },
        }),
      });
    }
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        content: [{ type: 'text', text: JSON.stringify({
          predicted_scores: { story: 80, craft: 78, performance: 72, world: 70, experience: 85, hold: 75, ending: 74, singularity: 68 },
          confidence: 'high', reasoning: 'Test reasoning.',
        }) }],
        _credits: { used: 1, limit: 500, remaining: 499, tier: 'premium' },
      }),
    });
  });
}

test.describe('Discover · Books', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await mockBookApis(page);
    await page.addInitScript(injectAuthState());
  });

  test('Books tab shows heuristic recommendations from film taste', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.waitForTimeout(800);

    // Tab bar is present; switch to Books
    await expect(page.locator('#discover-tab-books')).toBeVisible();
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    await expect(page.locator('#discover-books-panel')).toBeVisible();
    await expect(page.locator('#discover-film-panel')).toBeHidden();

    // Real recommendation cards (not a hollow stub)
    const cards = page.locator('.books-card');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first()).toContainText(/prediction/i);
  });

  test('opening a recommended book shows the official synopsis before prediction reasoning', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    await page.locator('.books-card').first().click();
    await page.waitForTimeout(1200); // detail enrichment + modal re-render

    // Modal should render the synopsis sourced from Open Library's work record.
    const overview = page.locator('.modal-overview');
    await expect(overview).toBeVisible();
    await expect(overview).toContainText(/gender/i);

    // Order check: the description must appear ABOVE the predict CTA. (When a
    // prediction exists, it would be the reasoning block; pre-prediction, the
    // CTA stands in for "Here's our thinking" — same ordering invariant.)
    const overviewBox = await overview.boundingBox();
    const ctaBox = await page.locator('#book-predict-btn').boundingBox();
    expect(overviewBox && ctaBox).toBeTruthy();
    expect(overviewBox.y).toBeLessThan(ctaBox.y);

    // Series pill should be present (sourced from the mocked OL series field).
    // Scoped to the modal: the hidden film panel behind it also renders pills.
    await expect(page.locator('#filmModal .series-pill')).toHaveCount(1);
  });

  test('opening a book reveals the metered Get-prediction action', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    const cardTitle = (await page.locator('.books-card-title').first().innerText()).trim();
    await page.locator('.books-card').first().click();
    await page.waitForTimeout(1000);

    await expect(page.locator('#filmModal')).toHaveClass(/visible/);
    // Regression guard: the modal must render the real book object, never the
    // registry key string (which produced a literal `undefined` title).
    await expect(page.locator('#book-modal-title')).toContainText(cardTitle);
    await expect(page.locator('#book-modal-title')).not.toContainText(/undefined/i);
    await expect(page.locator('#book-predict-btn')).toContainText(/1 credit/i);
  });

  test('Show more reveals an additional row of recommendations', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    const initial = await page.locator('.books-card').count();
    expect(initial).toBeGreaterThan(0);

    const btn = page.locator('.books-showmore-btn');
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForTimeout(300);

    // One more full row revealed → strictly more cards than before.
    const after = await page.locator('.books-card').count();
    expect(after).toBeGreaterThan(initial);
  });

  test('a ranked book is visually marked in the grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    // No ranked cards before any prediction.
    expect(await page.locator('.books-card-ranked').count()).toBe(0);

    await page.locator('.books-card').first().click();
    await page.waitForTimeout(800);
    await page.locator('#book-predict-btn').click();
    await page.waitForTimeout(1200);

    // The grid card is now marked ranked, with score + updated copy.
    await expect(page.locator('.books-card-ranked').first()).toBeVisible();
    await expect(page.locator('.books-card-ranked .books-card-action.ranked').first()).toContainText(/ranked/i);
    await expect(page.locator('.books-card-ranked .books-card-score').first()).toContainText(/~\d/);
  });

  test('Safe and High-upside shelves both render', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    expect(await page.locator('#books-rec-grid .books-card').count()).toBeGreaterThan(0);
    await expect(page.locator('#books-upside-section')).toBeVisible();
    expect(await page.locator('#books-upside-grid .books-card').count()).toBeGreaterThan(0);
    await expect(page.locator('#books-rec-grid .books-card-reason').first()).toContainText(/fit|spike|match/i);
  });

  test('Curate with AI annotates the shelf', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    await page.locator('#books-curate-btn').click();
    await page.waitForTimeout(1200);

    await expect(page.locator('#books-curated-note')).toContainText(/curated/i);
    await expect(page.locator('#books-curate-btn')).toContainText(/re-curate/i);

    // Lane integrity: a book the model returned in BOTH lists must render once.
    await expect(page.locator('.books-card[onclick*="9780385539258"]')).toHaveCount(1);
  });

  test('a known-award book shows a credential chip', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    // Search returns The Left Hand of Darkness (1969) → Hugo & Nebula winner.
    await page.fill('#books-search', 'left hand of darkness');
    await page.waitForTimeout(700);
    await page.locator('#books-search-results [onclick*="openBookDetail"]').first().click();
    await page.waitForTimeout(900);

    await expect(page.locator('#filmModal')).toHaveClass(/visible/);
    await expect(page.locator('#modalContent .cred-badge').first()).toContainText(/winner|nominee|prize|finalist/i);
  });

  test('selecting a mood lane re-shelves within that genre', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(900);

    const sciChip = page.locator('.books-mood-chip', { hasText: 'Sci-fi' });
    await expect(sciChip).toBeVisible();
    await sciChip.click();
    await page.waitForTimeout(900);

    await expect(sciChip).toHaveClass(/active/);
    expect(await page.locator('#books-rec-grid .books-card').count()).toBeGreaterThan(0);
  });

  test('switching back to Films restores the film panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.showScreen('predict'));
    await page.evaluate(() => window.showDiscoverTab('books'));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.showDiscoverTab('films'));
    await page.waitForTimeout(300);

    await expect(page.locator('#discover-film-panel')).toBeVisible();
    await expect(page.locator('#discover-books-panel')).toBeHidden();
  });
});
