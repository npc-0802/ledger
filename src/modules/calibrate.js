import { MOVIES, CATEGORIES, calcTotal, recalcAllTotals, scoreClass, getLabel } from '../state.js';
import { saveToStorage } from './storage.js';
import { renderRankings } from './rankings.js';
import { updateEffectiveWeights } from './weight-blend.js';

let calCategory = 'all';
let calIntensity = 'focused';
let calMatchups = [];
let calMatchupIdx = 0;
let calScoreDeltas = {};
let calTempScores = {};
let calHistory = [];
// Non-null = focused mode: every matchup pits this film against another.
let calTargetFilm = null;
const CAL_INTENSITY = { focused: 15, thorough: 30, deep: 50 };
const ELO_K = 8;

export function selectCalCat(cat) {
  calCategory = cat;
  document.querySelectorAll('[id^="calcat_"]').forEach(el => el.classList.remove('active'));
  document.getElementById('calcat_' + cat).classList.add('active');
}

export function selectCalInt(intensity) {
  calIntensity = intensity;
  document.querySelectorAll('[id^="calint_"]').forEach(el => el.classList.remove('active'));
  document.getElementById('calint_' + intensity).classList.add('active');
}

function generateMatchups(catKey, count) {
  const pairs = [];
  const cats = catKey === 'all' ? CATEGORIES.map(c => c.key) : [catKey];

  cats.forEach(key => {
    const films = MOVIES.filter(m => m.scores[key] != null)
      .sort((a,b) => a.scores[key] - b.scores[key]);

    for (let i = 0; i < films.length - 1; i++) {
      for (let j = i + 1; j < films.length; j++) {
        const diff = Math.abs(films[i].scores[key] - films[j].scores[key]);
        if (diff <= 8) pairs.push({ a: films[i], b: films[j], catKey: key, diff });
        else break;
      }
    }
  });

  pairs.sort((a,b) => a.diff - b.diff);
  const seen = new Set();
  const deduped = [];
  for (const p of pairs) {
    const key2 = [p.a.title, p.b.title, p.catKey].join('|');
    if (!seen.has(key2)) { seen.add(key2); deduped.push(p); }
  }
  return deduped.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Focused matchups for ONE film: "I don't think this is ranked right — show me
 * what it actually loses to." Every pair contains `target`.
 *
 * Unlike generateMatchups there is no max-diff cutoff. If a user believes a
 * score is wrong, the informative comparisons may be far from it, so we order
 * by closeness (closest = hardest = most diagnostic) and let breadth win.
 *
 * Round-robin across categories rather than a global sort, so a 15-round
 * session on "All" covers all 8 categories instead of spending every round on
 * whichever category happens to have the tightest cluster.
 */
function generateTargetMatchups(target, catKey, count) {
  const cats = (catKey === 'all' ? CATEGORIES.map(c => c.key) : [catKey])
    .filter(key => target.scores?.[key] != null);
  if (cats.length === 0) return [];

  // Per category: opponents ordered by |score difference| ascending.
  const laddersByCat = cats.map(key => {
    const tScore = target.scores[key];
    return MOVIES
      .filter(m => m !== target && m.title !== target.title && m.scores?.[key] != null)
      .map(m => ({ a: target, b: m, catKey: key, diff: Math.abs(m.scores[key] - tScore) }))
      .sort((x, y) => x.diff - y.diff);
  });

  // Round-robin: closest opponent in every category, then 2nd closest, ...
  const picked = [];
  const depth = Math.max(...laddersByCat.map(l => l.length), 0);
  for (let round = 0; round < depth && picked.length < count; round++) {
    for (const ladder of laddersByCat) {
      if (picked.length >= count) break;
      if (ladder[round]) picked.push(ladder[round]);
    }
  }

  // Randomise which side the target lands on. Without this the target is always
  // the left card, and a user answering 15 rounds learns the position, not the
  // question.
  return picked.map(p => Math.random() < 0.5 ? p : { ...p, a: p.b, b: p.a });
}

export function startCalibration() {
  const count = CAL_INTENSITY[calIntensity];
  calMatchups = calTargetFilm
    ? generateTargetMatchups(calTargetFilm, calCategory, count)
    : generateMatchups(calCategory, count);
  if (calMatchups.length === 0) {
    alert(calTargetFilm
      ? `Not enough scored films to compare "${calTargetFilm.title}" against. Rate a few more films first.`
      : 'Not enough films with close scores to calibrate. Try a different category or add more films.');
    return;
  }
  calMatchupIdx = 0;
  calScoreDeltas = {};
  calTempScores = {};
  calHistory = [];
  MOVIES.forEach(m => { calTempScores[m.title] = { ...m.scores }; });

  document.getElementById('cal-setup').style.display = 'none';
  document.getElementById('cal-matchups').style.display = 'block';
  document.getElementById('cal-cat-label').textContent =
    calCategory === 'all' ? 'All categories' :
    CATEGORIES.find(c => c.key === calCategory)?.label || calCategory;
  renderCalTargetBanner();
  renderCalMatchup();
}

// Standing reminder of which film a focused session is about. Hidden entirely
// in normal (whole-collection) mode.
function renderCalTargetBanner() {
  const el = document.getElementById('cal-target-banner');
  if (!el) return;
  if (!calTargetFilm) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = `Focusing on <strong>${escHtml(calTargetFilm.title)}</strong>${calTargetFilm.year ? ' (' + calTargetFilm.year + ')' : ''} — every matchup includes it.`;
}

function escHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function calBadgeColor(score) {
  if (score >= 90) return '#C4922A';
  if (score >= 80) return '#1F4A2A';
  if (score >= 70) return '#4A5830';
  if (score >= 60) return '#6B4820';
  return 'rgba(12,11,9,0.65)';
}

function renderCalMatchup() {
  if (calMatchupIdx >= calMatchups.length) { showCalReview(); return; }
  const { a, b, catKey } = calMatchups[calMatchupIdx];
  const total = calMatchups.length;
  const pct = Math.round((calMatchupIdx / total) * 100);
  document.getElementById('cal-progress-label').textContent = `${calMatchupIdx + 1} / ${total}`;
  document.getElementById('cal-progress-bar').style.width = pct + '%';

  const catLabel = CATEGORIES.find(c => c.key === catKey)?.label || catKey;
  const aScore = calTempScores[a.title]?.[catKey] ?? a.scores[catKey];
  const bScore = calTempScores[b.title]?.[catKey] ?? b.scores[catKey];

  function filmCard(m, choice) {
    const poster = m.poster
      ? `<img style="width:100%;height:100%;object-fit:cover;display:block" src="https://image.tmdb.org/t/p/w342${m.poster}" alt="" loading="lazy">`
      : `<div style="width:100%;height:100%;background:var(--surface-dark-2)"></div>`;
    return `
      <div class="cal-film-card" id="cal-card-${choice}" onclick="calChoose('${choice}')">
        <div style="aspect-ratio:2/3;overflow:hidden;background:var(--surface-dark-2);position:relative;margin-bottom:12px">
          ${poster}
        </div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;font-weight:700;line-height:1.3;color:var(--on-dark);margin-bottom:4px">${m.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--on-dark-dim)">${m.year || ''}</div>
      </div>`;
  }

  // Keyed to the live category keys. These were still on the pre-rename keys
  // (plot/execution/acting/…), so every category except `ending` silently fell
  // through to the generic "Better <label>?" fallback.
  const PROMPTS = {
    story:       'Which has the better story?',
    craft:       'Which is better made?',
    performance: 'Which has the better performances?',
    world:       'Whose world pulls you in more?',
    experience:  'Which was better to watch?',
    ending:      'Which has the better ending?',
    hold:        'Which has more of a hold on you?',
    singularity: 'Which stands more on its own?',
  };
  const promptQuestion = PROMPTS[catKey] || `Better ${catLabel.toLowerCase()}?`;

  document.getElementById('cal-matchup-card').innerHTML = `
    <div class="dark-grid" style="background:var(--surface-dark);padding:32px 28px;margin-bottom:20px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:8px">${catLabel}</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(28px,5vw,44px);color:var(--on-dark);letter-spacing:-1px;line-height:1.1">${promptQuestion}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:0;align-items:start">
        ${filmCard(a, 'a')}
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:16px;color:var(--on-dark-dim);text-align:center;padding-top:35%">vs</div>
        ${filmCard(b, 'b')}
      </div>
      <div class="cal-actions" style="text-align:center">
        <button type="button" class="cal-tie" onclick="calChoose('skip')">Too close to call</button>
      </div>
      ${calMatchupIdx > 0 ? `
      <div class="cal-utility-row">
        <button type="button" class="cal-utility" onclick="undoCalChoice()">← Undo</button>
        <button type="button" class="cal-utility" onclick="calFinishEarly()">Finish early →</button>
      </div>` : ''}
    </div>
  `;
}

window.calFinishEarly = function() {
  showCalReview();
};

window.undoCalChoice = function() {
  if (calHistory.length === 0) return;
  const prev = calHistory.pop();
  calMatchupIdx = prev.idx;
  calTempScores = prev.tempScores;
  calScoreDeltas = prev.deltas;
  renderCalMatchup();
};

// Expose calChoose to window since it's called from inline HTML
window.calChoose = function(choice) {
  // Save state before modifying
  calHistory.push({
    idx: calMatchupIdx,
    tempScores: JSON.parse(JSON.stringify(calTempScores)),
    deltas: JSON.parse(JSON.stringify(calScoreDeltas))
  });

  if (choice !== 'skip') {
    const { a, b, catKey } = calMatchups[calMatchupIdx];
    const aScore = calTempScores[a.title]?.[catKey] ?? a.scores[catKey];
    const bScore = calTempScores[b.title]?.[catKey] ?? b.scores[catKey];

    const expA = 1 / (1 + Math.pow(10, (bScore - aScore) / 40));
    const expB = 1 - expA;
    const actualA = choice === 'a' ? 1 : 0;
    const actualB = 1 - actualA;

    const newA = Math.round(Math.min(100, Math.max(1, aScore + ELO_K * (actualA - expA))));
    const newB = Math.round(Math.min(100, Math.max(1, bScore + ELO_K * (actualB - expB))));

    if (!calScoreDeltas[a.title]) calScoreDeltas[a.title] = {};
    if (!calScoreDeltas[b.title]) calScoreDeltas[b.title] = {};

    if (newA !== aScore) {
      const original = calScoreDeltas[a.title][catKey]?.old ?? aScore;
      calScoreDeltas[a.title][catKey] = { old: original, new: newA };
      calTempScores[a.title][catKey] = newA;
    }
    if (newB !== bScore) {
      const original = calScoreDeltas[b.title][catKey]?.old ?? bScore;
      calScoreDeltas[b.title][catKey] = { old: original, new: newB };
      calTempScores[b.title][catKey] = newB;
    }

    // Brief visual feedback on chosen card
    const winner = document.getElementById(`cal-card-${choice}`);
    const loser  = document.getElementById(`cal-card-${choice === 'a' ? 'b' : 'a'}`);
    if (winner) winner.style.opacity = '1';
    if (loser)  { loser.style.opacity = '0.35'; loser.style.transform = 'scale(0.97)'; }
  }

  calMatchupIdx++;
  setTimeout(() => renderCalMatchup(), choice === 'skip' ? 0 : 140);
};

function showCalReview() {
  document.getElementById('cal-matchups').style.display = 'none';
  document.getElementById('cal-review').style.display = 'block';

  const entries = Object.entries(calScoreDeltas)
    .flatMap(([title, cats]) =>
      Object.entries(cats).map(([catKey, {old: o, new: n}]) => ({ title, catKey, old: o, new: n }))
    )
    .filter(e => e.old !== e.new)
    .sort((a,b) => Math.abs(b.new - b.old) - Math.abs(a.new - a.old));

  if (entries.length === 0) {
    document.getElementById('cal-review-header').innerHTML = `
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:36px;color:var(--ink);letter-spacing:-1px;margin-bottom:8px">Well-calibrated.</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:15px;color:var(--dim)">No meaningful inconsistencies found. Your scores are in good shape.</div>`;
    document.getElementById('cal-diff-list').innerHTML = '';
    document.getElementById('cal-apply-btn').style.display = 'none';
    return;
  }

  // Count unique films affected
  const uniqueFilms = new Set(entries.map(e => e.title)).size;

  document.getElementById('cal-review-header').innerHTML = `
    <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(28px,3vw,40px);color:var(--ink);letter-spacing:-1px;margin-bottom:8px">${entries.length} score${entries.length !== 1 ? 's' : ''} adjusted across ${uniqueFilms} film${uniqueFilms !== 1 ? 's' : ''}.</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:15px;color:var(--dim);margin-bottom:20px">Your rankings are sharper now.</div>`;

  document.getElementById('cal-apply-btn').style.display = '';

  // Index entries globally so checkboxes have unique IDs for applyCalibration()
  const catGroups = {};
  CATEGORIES.forEach(cat => { catGroups[cat.key] = []; });
  entries.forEach((e, i) => { if (catGroups[e.catKey]) catGroups[e.catKey].push({ ...e, idx: i }); });

  const craftKeys = ['story','craft','performance','world'];
  const expKeys   = ['experience','hold','ending','singularity'];

  function renderCatGroup(groupLabel, keys) {
    const cats = CATEGORIES.filter(c => keys.includes(c.key));
    return `
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin:24px 0 10px;border-top:1px solid var(--rule);padding-top:16px">${groupLabel}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${cats.map(cat => {
          const catEntries = catGroups[cat.key];
          const shown = catEntries.slice(0, 3);
          const more = catEntries.length - 3;
          const hasChanges = catEntries.length > 0;
          return `<div style="padding:14px;background:var(--cream);border-radius:6px;${hasChanges ? '' : 'opacity:0.45'}">
            <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:${hasChanges ? '10px' : '0'}">${cat.label}</div>
            ${!hasChanges ? `<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--dim)">No changes</div>` : ''}
            ${shown.map((e, i) => {
              const col = e.new > e.old ? 'var(--green)' : 'var(--red)';
              return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;${i < shown.length - 1 ? 'border-bottom:1px solid var(--rule)' : ''}">
                <input type="checkbox" id="caldiff_${e.idx}" checked style="flex-shrink:0;accent-color:var(--blue);width:14px;height:14px"
                  data-movie-idx="${MOVIES.findIndex(m => m.title === e.title)}" data-cat="${e.catKey}" data-old="${e.old}" data-new="${e.new}">
                <div style="flex:1;overflow:hidden">
                  <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:13px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.title}</div>
                </div>
                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                  <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);text-decoration:line-through">${e.old}</span>
                  <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:${col}">${e.new}</span>
                </div>
              </div>`;
            }).join('')}
            ${more > 0 ? `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);margin-top:8px;cursor:pointer" onclick="(function(el){var p=el.parentElement;var h=p.querySelector('[data-cal-hidden]');if(h){h.style.display='block';el.remove()}})(this)"><span data-cal-more>+${more} more</span></div>` : ''}
            <div data-cal-hidden style="display:none">${catEntries.slice(3).map((e, i) => {
              const col = e.new > e.old ? 'var(--green)' : 'var(--red)';
              return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;${i < catEntries.length - 4 ? 'border-bottom:1px solid var(--rule)' : ''}">
                <input type="checkbox" id="caldiff_x${e.idx}" checked style="flex-shrink:0;accent-color:var(--blue);width:14px;height:14px"
                  data-movie-idx="${MOVIES.findIndex(m => m.title === e.title)}" data-cat="${e.catKey}" data-old="${e.old}" data-new="${e.new}">
                <div style="flex:1;overflow:hidden">
                  <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:13px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.title}</div>
                </div>
                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                  <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);text-decoration:line-through">${e.old}</span>
                  <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:${col}">${e.new}</span>
                </div>
              </div>`;
            }).join('')}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  const detailsHtml = renderCatGroup('Craft', craftKeys) + renderCatGroup('Experience', expKeys);

  document.getElementById('cal-diff-list').innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <span onclick="document.getElementById('cal-details-expand').style.display=document.getElementById('cal-details-expand').style.display==='none'?'block':'none';this.textContent=document.getElementById('cal-details-expand').style.display==='none'?'Show details ▸':'Hide details ▾'" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--blue);cursor:pointer;letter-spacing:0.5px">Show details ▸</span>
    </div>
    <div id="cal-details-expand" style="display:none">
      <div style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dim);margin-bottom:12px">Uncheck anything you want to keep. Nothing changes until you apply.</div>
      ${detailsHtml}
    </div>`;
}

export function applyCalibration() {
  try {
    const checkboxes = document.querySelectorAll('[id^="caldiff_"]');
    let changed = 0;
    checkboxes.forEach(cb => {
      if (!cb.checked) return;
      const idx = parseInt(cb.dataset.movieIdx);
      const cat = cb.dataset.cat;
      const newVal = parseInt(cb.dataset.new);
      const film = MOVIES[idx];
      if (film && film.scores[cat] !== undefined) {
        film.scores[cat] = newVal;
        film.total = calcTotal(film.scores);
        changed++;
      }
    });
    recalcAllTotals();
    saveToStorage();
    updateEffectiveWeights();
    const threshold = Math.floor(MOVIES.length / 10) * 10;
    localStorage.setItem('palatemap_calibrate_last_threshold', String(threshold));
    import('../ui-callbacks.js').then(({ updateStorageStatus }) => updateStorageStatus());
    renderRankings();
    // Session is finished — a later visit to Calibrate should start clean.
    calTargetFilm = null;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('myfilms').classList.add('active');
    document.querySelectorAll('.nav-btn, .nav-mobile-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('onclick')?.includes("'myfilms'"));
    });
    resetCalibration();
  } catch(e) {
    console.error('applyCalibration error:', e);
  }
}

// ── FOCUSED CALIBRATION: target selection ───────────────────────────────────

// Reflects the current target into the setup screen: either the search input
// or the selected-film chip, never both.
function renderCalTargetPicker() {
  const chip = document.getElementById('cal-target-chip');
  const searchWrap = document.getElementById('cal-target-search-wrap');
  const results = document.getElementById('cal-target-results');
  if (!chip || !searchWrap) return;
  if (results) { results.innerHTML = ''; results.style.display = 'none'; }

  if (calTargetFilm) {
    searchWrap.style.display = 'none';
    chip.style.display = 'flex';
    chip.innerHTML = `
      <span class="cal-target-chip-label">Focusing on</span>
      <span class="cal-target-chip-title">${escHtml(calTargetFilm.title)}</span>
      <button type="button" class="cal-target-chip-clear" onclick="calClearTargetFilm()" aria-label="Clear focused film">×</button>`;
  } else {
    chip.style.display = 'none';
    chip.innerHTML = '';
    searchWrap.style.display = 'block';
    const input = document.getElementById('cal-target-search');
    if (input) input.value = '';
  }
}

// Title search over the rated collection. Local only — you can only calibrate
// films you have already scored.
window.calTargetSearch = function(query) {
  const results = document.getElementById('cal-target-results');
  if (!results) return;
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) { results.innerHTML = ''; results.style.display = 'none'; return; }

  const matches = MOVIES
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => (m.title || '').toLowerCase().includes(q))
    .slice(0, 8);

  if (matches.length === 0) {
    results.style.display = 'block';
    results.innerHTML = `<div class="cal-target-empty">No rated film matches "${escHtml(query)}".</div>`;
    return;
  }

  results.style.display = 'block';
  results.innerHTML = matches.map(({ m, idx }) => `
    <button type="button" class="cal-target-result" onclick="calSelectTargetFilm(${idx})">
      <span class="cal-target-result-title">${escHtml(m.title)}</span>
      <span class="cal-target-result-meta">${m.year || ''}${m.total != null ? ' · ' + Math.round(m.total) : ''}</span>
    </button>`).join('');
};

window.calSelectTargetFilm = function(idx) {
  const film = MOVIES[idx];
  if (!film) return;
  calTargetFilm = film;
  renderCalTargetPicker();
};

window.calClearTargetFilm = function() {
  calTargetFilm = null;
  renderCalTargetPicker();
};

/**
 * Entry point from the film modal ("Recalibrate"). Intent is already explicit,
 * so this skips the setup screen and starts comparing immediately with the
 * current category/rounds settings. "Start over" from the review returns to
 * setup with the film still focused.
 */
window.startFilmCalibration = function(movieIdx) {
  const film = MOVIES[movieIdx];
  if (!film) return;
  calTargetFilm = film;

  if (typeof window.closeModal === 'function') window.closeModal();
  if (typeof window.showScreen === 'function') window.showScreen('calibration');

  renderCalTargetPicker();
  startCalibration();
};

export function resetCalibration() {
  // calTargetFilm intentionally survives: "Start over" should return you to
  // setup still focused on the same film, not silently widen to the whole
  // collection. calClearTargetFilm() is the explicit way out.
  calMatchups = []; calMatchupIdx = 0; calScoreDeltas = {}; calTempScores = {}; calHistory = [];
  renderCalTargetPicker();
  const banner = document.getElementById('cal-target-banner');
  if (banner) { banner.style.display = 'none'; banner.innerHTML = ''; }
  document.getElementById('cal-setup').style.display = 'block';
  document.getElementById('cal-matchups').style.display = 'none';
  document.getElementById('cal-review').style.display = 'none';
  document.getElementById('cal-apply-btn').style.display = '';
}
