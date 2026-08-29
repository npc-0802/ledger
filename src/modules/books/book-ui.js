// ── BOOKS UI ─────────────────────────────────────────────────────────────────
// Discover > Books tab: heuristic recommendations from the user's film taste,
// book search, a detail modal, and the metered "Get prediction" flow. Reuses the
// existing filmModal / modalContent shell so books feel native, not bolted on.

import { currentUser, MOVIES, CATEGORIES, getLabel } from '../../state.js';
import { track } from '../../analytics.js';
import { getCategoryLabel } from '../../data/category-descriptions.js';
import { credentialChipHTML } from '../../data/credentials.js';
import { bookSeriesInfo, seriesPillHTML } from '../series-metadata.js';
import { searchBooks, getBookDetails, getBookKey, coverFromISBN } from './book-api.js';
import {
  loadBookPrediction, getCachedBookPrediction,
  generateBookPrediction, calcBookPredictedTotal,
} from './book-predict.js';
import { getBookShelf, curateBookShelf } from './book-recommender.js';
import { BOOK_MOODS } from './book-queries.js';

// Registry so onclick handlers can pass a stable string key instead of a serialized object.
const _bookIndex = new Map();
function registerBook(book) {
  const key = getBookKey(book);
  if (key) _bookIndex.set(key, { ...(_bookIndex.get(key) || {}), ...book, bookKey: key });
  return key;
}
function lookupBook(key) { return _bookIndex.get(key) || null; }

let booksSearchTimer = null;
const esc = s => String(s ?? '').replace(/'/g, "\\'");

// Shelf state. The safe shelf reveals row-by-row via "Show more"; the upside
// shelf shows in full. Both come from the staged recommender pipeline.
const INITIAL_ROWS = 2;        // safe rows shown before the first "Show more"
let _safePool = null;          // ordered safe shelf
let _upsidePool = null;        // ordered upside shelf
let _curatedAt = null;         // timestamp if the current shelf was AI-curated
let _booksVisible = null;      // revealed count for the safe shelf
let _mood = 'all';             // selected mood/genre lane ('all' = whole space)

// ── Tab switching ────────────────────────────────────────────────────────────
export function showDiscoverTab(tab) {
  const filmPanel = document.getElementById('discover-film-panel');
  const booksPanel = document.getElementById('discover-books-panel');
  const filmTab = document.getElementById('discover-tab-films');
  const booksTab = document.getElementById('discover-tab-books');
  if (!filmPanel || !booksPanel) return;

  const books = tab === 'books';
  filmPanel.style.display = books ? 'none' : '';
  booksPanel.style.display = books ? '' : 'none';
  filmTab?.classList.toggle('active', !books);
  booksTab?.classList.toggle('active', books);

  if (books) {
    track('discover_books_tab_viewed');
    renderBooksTab();
  }
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}
}
window.showDiscoverTab = showDiscoverTab;

// ── Books tab render ─────────────────────────────────────────────────────────
export function renderBooksTab() {
  const panel = document.getElementById('discover-books-panel');
  if (!panel) return;

  // Fresh tab open → collapse the safe shelf back to its initial rows.
  _booksVisible = null;

  const ready = currentUser?.weights && MOVIES.length >= 3;
  if (!ready) {
    panel.innerHTML = `
      <div style="padding:64px 24px;text-align:center;max-width:440px;margin:0 auto">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:16px">discover · books</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:26px;color:var(--ink);letter-spacing:-1px;margin-bottom:12px">Your taste reads, too.</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--dim);margin-bottom:24px">Rate a few films first. Palate Map uses the same taste profile to find books you'd actually love — before you've rated a single one.</div>
        <button onclick="document.querySelector('.nav-btn.action-tab')?.click()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;background:var(--action);color:white;border:none;padding:14px 32px;cursor:pointer">Rate a film →</button>
      </div>`;
    return;
  }

  const archetype = currentUser?.full_archetype_name || currentUser?.archetype || '';
  const rankedCount = Object.keys(currentUser?.bookPredictions || {}).length;
  panel.innerHTML = `
    <div class="books-header">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px">discover · books · from your film taste</div>
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(26px,5vw,38px);line-height:1;color:var(--ink);letter-spacing:-1px;margin-bottom:10px">What to read next.</div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim)">${archetype ? `${archetype} · ` : ''}derived from ${MOVIES.length} rated films</div>
    </div>

    <!-- Section 1: choose the lane -->
    <div class="books-mood-row">
      <span class="books-mood-label">I'm in the mood for…</span>
      <div class="books-mood-chips">
        ${BOOK_MOODS.map(m => `<button class="books-mood-chip${m.key === _mood ? ' active' : ''}" onclick="booksSetMood('${m.key}')">${m.label}</button>`).join('')}
      </div>
      <div class="books-mood-help">Choose a lane — your taste profile still does the ranking inside it.</div>
    </div>

    <!-- Section 2: act on the shelf -->
    <div class="books-shelf-actions">
      <div class="books-shelf-action">
        <button id="books-refresh-btn" onclick="booksRefreshShelf()" class="books-ctrl-btn">↻ Refresh shelf</button>
        <span class="books-action-help">Pull a new mix from this lane</span>
      </div>
      <div class="books-shelf-action">
        <button id="books-curate-btn" onclick="booksCurate()" class="books-ctrl-btn">✦ Curate this shelf · 1 credit</button>
        <span class="books-action-help">Use AI to refine this shortlist</span>
      </div>
      <span id="books-curated-note" class="books-curated-note"></span>
    </div>

    <!-- Section 3: the shelves -->
    <div class="books-rec-section">
      <div class="foryou-section-header" style="margin-bottom:16px">
        <div>
          <span class="foryou-section-label">Safe picks</span>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-top:3px;letter-spacing:0.3px">Strong fit, higher confidence</div>
        </div>
      </div>
      <div id="books-rec-grid" class="books-grid"></div>
      <div id="books-showmore-wrap" style="text-align:center;margin-top:24px"></div>
    </div>

    <div class="books-rec-section" id="books-upside-section" style="margin-top:36px;display:none">
      <div class="foryou-section-header" style="margin-bottom:16px">
        <div>
          <span class="foryou-section-label">High-upside picks</span>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-top:3px;letter-spacing:0.3px">Lower certainty, higher ceiling</div>
        </div>
      </div>
      <div id="books-upside-grid" class="books-grid"></div>
    </div>

    <!-- Section 5: direct lookup -->
    <div class="books-search-section" style="margin-top:40px;padding-top:24px;border-top:1px solid var(--rule)">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:4px">— search any book —</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--dim);margin-bottom:12px">Already have a book in mind? Look it up directly.</div>
      <input id="books-search" type="text" placeholder="Search a book by title or author…" oninput="booksSearchDebounce()"
        style="width:100%;box-sizing:border-box;padding:13px 16px;border:1px solid var(--rule-dark);background:white;font-family:'DM Sans',sans-serif;font-size:15px;outline:none;color:var(--ink)"
        onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--rule-dark)'">
      <div id="books-search-results" style="margin-top:12px"></div>
    </div>

    ${rankedCount > 0 ? `
    <!-- Section 6: maintenance (demoted — not discovery) -->
    <div class="books-maintenance">
      <button id="books-rerank-all" onclick="booksRerankAll()" class="books-maint-btn">Update ${rankedCount} ranked book${rankedCount !== 1 ? 's' : ''} · ${rankedCount} credit${rankedCount !== 1 ? 's' : ''}</button>
      <span class="books-action-help">Regenerate predictions you've already run, under the current model</span>
    </div>` : ''}`;

  _loadAndRenderShelf({ force: false });
}

// Number of columns the responsive grid currently renders. Reads the resolved
// CSS Grid track list (auto-fill minmax) so the increment matches the real
// layout at any viewport — no hardcoded breakpoints.
function currentBookColumns() {
  const grid = document.getElementById('books-rec-grid');
  if (!grid) return 4;
  const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  return Math.max(1, tracks);
}

// Stage A+B (+ cached C): pull the safe/upside shelves from the recommender.
async function _loadAndRenderShelf({ force = false } = {}) {
  const safeGrid = document.getElementById('books-rec-grid');
  if (safeGrid) safeGrid.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);padding:24px">Finding books across your taste…</div>`;
  try {
    const shelf = await getBookShelf({ force, mood: _mood });
    _safePool = shelf.safe || [];
    _upsidePool = shelf.upside || [];
    _curatedAt = shelf.curatedAt || null;
    _safePool.forEach(registerBook);
    _upsidePool.forEach(registerBook);
    _booksVisible = Math.min(currentBookColumns() * INITIAL_ROWS, _safePool.length) || _safePool.length;
    _renderShelves();
  } catch {
    if (safeGrid) safeGrid.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);padding:24px">Couldn't load recommendations. <span style="color:var(--blue);cursor:pointer" onclick="booksRefreshShelf()">Retry</span></div>`;
  }
}

// Render both shelves from the current pools (no refetch). Safe to call as a
// refresh after a prediction so "ranked" badges update in place.
function _renderShelves() {
  const safeGrid = document.getElementById('books-rec-grid');
  if (safeGrid) {
    safeGrid.innerHTML = _safePool?.length
      ? _safePool.slice(0, _booksVisible).map(bookCard).join('')
      : `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);padding:24px">No recommendations yet.</div>`;
  }
  const upGrid = document.getElementById('books-upside-grid');
  const upSection = document.getElementById('books-upside-section');
  if (upGrid) upGrid.innerHTML = (_upsidePool || []).map(bookCard).join('');
  if (upSection) upSection.style.display = _upsidePool?.length ? '' : 'none';

  _renderShowMoreButton();

  const note = document.getElementById('books-curated-note');
  if (note) note.textContent = _curatedAt ? `AI-curated ${new Date(_curatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
  const curBtn = document.getElementById('books-curate-btn');
  if (curBtn && _curatedAt) curBtn.textContent = '✦ Re-curate this shelf · 1 credit';
}

function _renderShowMoreButton() {
  const wrap = document.getElementById('books-showmore-wrap');
  if (!wrap) return;
  const remaining = (_safePool?.length || 0) - (_booksVisible || 0);
  wrap.innerHTML = remaining > 0
    ? `<button class="books-showmore-btn" onclick="booksShowMore()">Show more</button>`
    : '';
}

// Reveal one more full row of the SAFE shelf, snapped to a row boundary.
window.booksShowMore = function() {
  if (!_safePool) return;
  const cols = currentBookColumns();
  const snapped = Math.ceil((_booksVisible || 0) / cols) * cols;
  _booksVisible = Math.min(snapped + cols, _safePool.length);
  _renderShelves();
  track('discover_books_show_more', { visible: _booksVisible, total: _safePool.length, cols });
};

// Switch mood/genre lane. Mood is part of the shelf identity (separate cache),
// so this re-retrieves within the lane while keeping taste personalization.
window.booksSetMood = function(mood) {
  if (mood === _mood) return;
  _mood = mood;
  _booksVisible = null;
  document.querySelectorAll('#discover-books-panel .books-mood-chip').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${mood}'`));
  });
  track('discover_books_mood', { mood });
  _loadAndRenderShelf({ force: false });
};

// Rebuild shelves from scratch (re-retrieve), dropping any curation overlay.
window.booksRefreshShelf = function() {
  _curatedAt = null;
  _loadAndRenderShelf({ force: true });
};

// Stage C: one metered, reasoned curation pass over the current candidates.
window.booksCurate = async function() {
  if (!_safePool?.length) return;
  const btn = document.getElementById('books-curate-btn');
  const orig = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Curating…'; }
  try {
    const shelf = await curateBookShelf({ safe: _safePool, upside: _upsidePool }, _mood);
    _safePool = shelf.safe; _upsidePool = shelf.upside; _curatedAt = shelf.curatedAt;
    _safePool.forEach(registerBook); _upsidePool.forEach(registerBook);
    _booksVisible = Math.min(currentBookColumns() * INITIAL_ROWS, _safePool.length) || _safePool.length;
    _renderShelves();
  } catch (e) {
    const isQuota = /credit|limit|plan/i.test(e.message || '');
    const { showToast } = await import('../../ui-callbacks.js');
    // curateBookShelf throws user-appropriate messages (formatting / quota /
    // policy); show them directly instead of prefixing "Curation failed:".
    showToast(isQuota ? "You've used this month's credits." : (e.message || "Couldn't curate this shelf. Please try again."), { type: 'error' });
    if (btn) { btn.disabled = false; btn.textContent = orig; }
  }
};

function bookCard(book) {
  const key = book.bookKey || getBookKey(book);
  const cover = book.cover || coverFromISBN(book.isbn);
  const coverHtml = cover
    ? `<img class="books-card-cover" src="${cover}" alt="${esc(book.title)}" loading="lazy" onerror="this.outerHTML='<div class=\\'books-card-cover books-card-cover-fallback\\'>${esc(book.title)}</div>'">`
    : `<div class="books-card-cover books-card-cover-fallback">${book.title}</div>`;

  // "Ranked" = a credit has already been spent on this book. Mark it so the user
  // can tell at a glance which recommendations they've already predicted.
  const pred = getCachedBookPrediction(book)?.prediction || null;
  const total = pred ? Math.round(calcBookPredictedTotal(pred)) : null;

  return `
    <div class="books-card${pred ? ' books-card-ranked' : ''}" onclick="openBookDetail('${key}')">
      <div class="books-card-cover-wrap">
        ${coverHtml}
        ${pred ? `<div class="books-card-ranked-badge" title="Already ranked">✓</div><div class="books-card-score">~${total}</div>` : ''}
      </div>
      <div class="books-card-meta">
        <div class="books-card-title">${book.title}</div>
        <div class="books-card-sub">${book.author || ''}${book.year ? ' · ' + book.year : ''}</div>
        ${(() => {
          const series = bookSeriesInfo(book);
          const cred = credentialChipHTML(book);
          const pill = seriesPillHTML(series);
          if (!cred && !pill) return '';
          return `<div class="books-card-pills">${cred}${pill}</div>`;
        })()}
        ${book.reason ? `<div class="books-card-reason">${book.reason}</div>` : ''}
        <div class="books-card-action${pred ? ' ranked' : ''}">${pred ? 'Ranked · view your score →' : 'Get prediction →'}</div>
      </div>
    </div>`;
}

// ── Detail modal ─────────────────────────────────────────────────────────────
window.openBookDetail = function(key) {
  const book = lookupBook(key);
  if (!book) return;
  _openBookDetailModal(book);
};

// Open the detail modal from a full book object (e.g. a reading-list entry that
// was never rendered as a card this session and isn't in the registry yet).
export function openBookDetailFromObject(book) {
  if (!book) return;
  registerBook(book);
  _openBookDetailModal(book);
}

async function _openBookDetailModal(book) {
  const key = registerBook(book);
  track('book_detail_opened', { book_key: key, title: book.title });

  // Show shell immediately, then enrich + load any stored prediction.
  _renderBookModalShell(book, { loading: true });
  const fmEl = document.getElementById('filmModal');
  fmEl?.classList.add('open');
  requestAnimationFrame(() => fmEl?.classList.add('visible'));

  // Resolve details FIRST (canonicalizes identity to the OL work id), then look
  // up the stored prediction by that canonical key — otherwise a catalog rec
  // (ISBN key) would miss a prediction persisted under the work-id key.
  const detailed = await getBookDetails(book).catch(() => book);
  const mergedBook = { ...book, ...(detailed || {}) };
  registerBook(mergedBook); // keep the registry current; render from the OBJECT, never the returned key
  const stored = await loadBookPrediction(mergedBook).catch(() => null);
  _renderBookModalShell(mergedBook, { prediction: stored?.prediction || null, predictedAt: stored?.predictedAt || null });
}

function _renderBookModalShell(book, { loading = false, prediction = null, predictedAt = null } = {}) {
  const el = document.getElementById('modalContent');
  if (!el) return;
  // Defensive: a registry key string must never reach this renderer. If one
  // slips through, resolve it back to the object so we render real metadata
  // instead of `undefined`. Also normalize null/undefined to an empty object.
  if (typeof book === 'string') book = lookupBook(book) || {};
  book = book || {};
  const key = getBookKey(book);
  const onList = (currentUser?.watchlist || []).some(w => w.medium === 'book' && (w.bookKey || getBookKey(w)) === key);

  // Safe fallbacks — partial/loading metadata should never degrade into broken text.
  const title = book.title || (loading ? 'Loading…' : 'Untitled');
  const author = book.author || '';
  const cover = book.cover || coverFromISBN(book.isbn);
  const coverHtml = cover
    ? `<img style="width:100px;height:150px;object-fit:cover;flex-shrink:0;display:block" src="${cover}" alt="">`
    : '';

  const metaBits = [
    book.year || '',
    book.pageCount ? `${book.pageCount} pages` : '',
  ].filter(Boolean).join(' · ');

  const header = `
    <div style="position:relative;display:flex;align-items:stretch;background:var(--surface-dark);margin:-40px -40px 28px;padding:28px 32px">
      <button onclick="closeModal()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--on-dark-dim);line-height:1;padding:4px 8px">×</button>
      ${coverHtml}
      <div style="flex:1;padding:0 40px 0 ${cover ? '20px' : '0'};display:flex;flex-direction:column;justify-content:flex-end">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">Book</div>
        <div id="book-modal-title" style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(20px,3.5vw,30px);line-height:1.1;color:var(--on-dark);letter-spacing:-0.5px;margin-bottom:8px">${title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim)">${author}${metaBits ? (author ? ' · ' : '') + metaBits : ''}</div>
        ${(() => {
          const cred = credentialChipHTML(book, { dark: true });
          const pill = seriesPillHTML(bookSeriesInfo(book), { dark: true });
          if (!cred && !pill) return '';
          return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">${cred}${pill}</div>`;
        })()}
      </div>
    </div>`;

  const cats = (book.categories || []).slice(0, 4);
  const catChips = cats.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">${cats.map(c =>
        `<span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.5px;text-transform:uppercase;color:var(--dim);border:1px solid var(--rule);padding:4px 8px">${c}</span>`).join('')}</div>`
    : '';

  const descHtml = book.description
    ? `<div class="modal-overview" style="margin-bottom:16px">${String(book.description).slice(0, 600)}${String(book.description).length > 600 ? '…' : ''}</div>`
    : (loading ? `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-bottom:16px">Loading details…</div>` : '');

  let predHtml;
  if (prediction) {
    const total = calcBookPredictedTotal(prediction);
    predHtml = `
      <div style="border-top:1px solid var(--rule);padding-top:20px;margin-top:4px;margin-bottom:20px">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:14px;display:flex;align-items:center;gap:6px">
          <span>— your predicted score —</span>${predictedAt ? `<span style="margin-left:auto;opacity:0.6">Generated ${new Date(predictedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>` : ''}
        </div>
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:20px">
          <span style="font-family:'Playfair Display',serif;font-size:60px;font-weight:900;font-style:italic;color:var(--blue);letter-spacing:-3px;line-height:1">~${Math.round(total)}</span>
          <span style="font-family:'DM Mono',monospace;font-size:13px;color:var(--dim)">${getLabel(Math.round(total))}</span>
        </div>
        ${prediction.reasoning ? `
          <div style="padding:16px 20px;background:var(--surface-dark);border-radius:6px;margin-bottom:16px">
            <div style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--on-dark-dim);margin-bottom:8px">Here's our thinking</div>
            <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--on-dark)">${prediction.reasoning}</div>
          </div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
          ${CATEGORIES.map(cat => {
            const v = prediction.predicted_scores?.[cat.key];
            return v != null ? `<div style="text-align:center;padding:10px 6px;background:var(--cream)">
              <div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:0.5px;color:var(--dim);margin-bottom:4px">${getCategoryLabel(cat.key, 'book')}</div>
              <div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:700;color:var(--ink)">${v}</div>
            </div>` : '';
          }).join('')}
        </div>
      </div>`;
  } else if (loading) {
    predHtml = '';
  } else {
    predHtml = `
      <div style="border-top:1px solid var(--rule);padding-top:20px;margin-top:4px;margin-bottom:16px;text-align:center">
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dim);margin-bottom:14px">Want to know if this is for you?</div>
        <button id="book-predict-btn" onclick="bookGetPrediction('${key}')" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:var(--action);color:white;border:none;padding:12px 28px;cursor:pointer">Get prediction · 1 credit</button>
      </div>`;
  }

  const listBtn = onList
    ? `<button onclick="bookRemoveFromList('${key}')" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:1px solid var(--green);color:var(--green);padding:10px 20px;cursor:pointer;flex:1">✓ On reading list</button>`
    : `<button onclick="bookAddToList('${key}')" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:1px solid var(--rule-dark);color:var(--ink);padding:10px 20px;cursor:pointer;flex:1">＋ Reading list</button>`;

  // Already-ranked books get a metered "Re-rank" to regenerate reasoning under the
  // current model (overwrites the cached prediction + durable artifact).
  const regenBtn = prediction
    ? `<button id="book-regen-btn" onclick="bookRegenerate('${key}')" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:none;border:1px solid var(--rule-dark);color:var(--dim);padding:10px 20px;cursor:pointer;flex:1">↻ Re-rank · 1 credit</button>`
    : '';

  el.innerHTML = `
    ${header}
    ${catChips}
    ${descHtml}
    ${predHtml}
    <div style="display:flex;gap:8px;margin-top:8px">${regenBtn}${listBtn}</div>`;
}

// Generate (or regenerate) a book prediction. Fresh generation is always metered;
// regenerating overwrites the prior cached prediction + durable artifact.
async function _runBookPrediction(key) {
  const book = lookupBook(key);
  if (!book) return false;
  const btn = document.getElementById('book-predict-btn') || document.getElementById('book-regen-btn');
  const orig = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Predicting…'; btn.style.opacity = '0.6'; }
  try {
    const { prediction, predictedAt } = await generateBookPrediction(book);
    registerBook(book);
    _renderBookModalShell(book, { prediction, predictedAt });
    _renderShelves(); // reflect the new score on the card behind the modal
    return true;
  } catch (e) {
    const isQuota = /credit|limit|plan/i.test(e.message || '');
    const { showToast } = await import('../../ui-callbacks.js');
    showToast(isQuota ? "You've used this month's credits." : `Prediction failed: ${e.message}`, { type: 'error' });
    if (btn) { btn.disabled = false; btn.textContent = orig; btn.style.opacity = ''; }
    return false;
  }
}
window.bookGetPrediction = key => _runBookPrediction(key);
window.bookRegenerate = key => _runBookPrediction(key);

// Owner action: regenerate every cached book prediction under the current model.
// Metered (1 credit each), sequential, and stops cleanly if credits run out.
window.booksRerankAll = async function() {
  const entries = Object.values(currentUser?.bookPredictions || {}).filter(e => e?.book);
  if (!entries.length) return;
  const { showToast } = await import('../../ui-callbacks.js');
  if (!window.confirm(`Update predictions for ${entries.length} ranked book${entries.length !== 1 ? 's' : ''} under the current model? This uses ${entries.length} credit${entries.length !== 1 ? 's' : ''}.`)) return;

  const btn = document.getElementById('books-rerank-all');
  if (btn) { btn.disabled = true; btn.textContent = 'Updating…'; }
  let done = 0, failed = 0;
  for (const e of entries) {
    try { await generateBookPrediction(e.book); done++; }
    catch (err) {
      failed++;
      if (/credit|limit|plan/i.test(err.message || '')) { showToast('Out of credits — stopped updating.', { type: 'error' }); break; }
    }
  }
  track('books_update_ranked', { done, failed, total: entries.length });
  showToast(`Updated ${done} ranked book${done !== 1 ? 's' : ''}${failed ? ` · ${failed} failed` : ''}.`);
  renderBooksTab();
};

// ── Watchlist (reading list) ─────────────────────────────────────────────────
window.bookAddToList = async function(key) {
  const book = lookupBook(key);
  if (!book) return;
  const { addToWatchlist } = await import('../watchlist.js');
  addToWatchlist({
    medium: 'book',
    bookKey: key,
    openLibraryId: book.openLibraryId || null,
    isbn: book.isbn || null,
    title: book.title,
    author: book.author || '',
    year: book.year || '',
    cover: book.cover || coverFromISBN(book.isbn) || null,
  });
  _renderBookModalShell(book, _currentModalPredState(book));
};

window.bookRemoveFromList = async function(key) {
  const book = lookupBook(key);
  const { removeFromWatchlist } = await import('../watchlist.js');
  removeFromWatchlist(key); // book watchlist items are keyed by bookKey
  if (book) _renderBookModalShell(book, _currentModalPredState(book));
};

function _currentModalPredState(book) {
  const cached = getCachedBookPrediction(book);
  return cached?.prediction ? { prediction: cached.prediction, predictedAt: cached.predictedAt } : {};
}

// ── Search ───────────────────────────────────────────────────────────────────
window.booksSearchDebounce = function() {
  clearTimeout(booksSearchTimer);
  booksSearchTimer = setTimeout(_booksSearch, 400);
};

async function _booksSearch() {
  const q = document.getElementById('books-search')?.value.trim();
  const resultsEl = document.getElementById('books-search-results');
  if (!resultsEl) return;
  if (!q || q.length < 2) { resultsEl.innerHTML = ''; return; }
  resultsEl.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);padding:12px">Searching…</div>`;

  const results = await searchBooks(q, { limit: 6 });
  if (document.getElementById('books-search')?.value.trim() !== q) return; // stale
  if (!results.length) { resultsEl.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);padding:12px">No results for "${q}".</div>`; return; }
  results.forEach(registerBook);

  resultsEl.innerHTML = `<div style="border:1px solid var(--rule-dark);background:white">` + results.map(b => {
    const key = getBookKey(b);
    const cover = b.cover || coverFromISBN(b.isbn);
    const coverHtml = cover
      ? `<img src="${cover}" style="width:30px;height:45px;object-fit:cover;flex-shrink:0" onerror="this.style.visibility='hidden'">`
      : `<div style="width:30px;height:45px;background:var(--rule);flex-shrink:0"></div>`;
    return `<div onclick="openBookDetail('${key}')" style="display:flex;align-items:center;gap:12px;padding:9px 14px;border-bottom:1px solid var(--rule);cursor:pointer" onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background='white'">
      ${coverHtml}
      <div style="flex:1;min-width:0">
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim)">${b.author || ''}${b.year ? ' · ' + b.year : ''}</div>
        ${(() => {
          const cred = credentialChipHTML(b);
          const pill = seriesPillHTML(bookSeriesInfo(b));
          if (!cred && !pill) return '';
          return `<div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap">${cred}${pill}</div>`;
        })()}
      </div>
      <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--blue);flex-shrink:0">Open →</span>
    </div>`;
  }).join('') + `</div>`;
}
