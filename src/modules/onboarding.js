import { MOVIES, setMovies, setCurrentUser, currentUser, applyUserWeights, recalcAllTotals, CATEGORIES, calcTotal } from '../state.js';
import { ARCHETYPES } from '../data/archetypes.js';
import { classifyArchetype } from './quiz-engine.js';
import { saveToStorage } from './storage.js';
import { renderRankings } from './rankings.js';
import { sb, syncToSupabase, saveUserLocally, signInWithGoogle, sendMagicLink } from './supabase.js';
import { fetchTmdbMovieBundle } from './tmdb-movie.js';
import { track } from '../analytics.js';
import { recordWeightSnapshot } from './weight-blend.js';

const TMDB_KEY = 'f5a446a5f70a9f6a16a8ddd052c121f2';

// ── GUIDED FLOW STATE ──
let obStep = 'name';
let obDisplayName = '';
let obImportedMovies = null;
let obMagicLinkEmail = '';
let _obStartTime = null;

// Guided conversation state
let guidedStep = 1;          // which film prompt (1-5)
let guidedFilms = [];         // rated films: { tmdbId, title, year, poster, director, scores, total }
let guidedSelectedFilm = null; // currently selected film from search
let guidedScores = {};        // current film's scores being edited
let guidedSliderStage = 'gut'; // 'gut' or 'all' (Film 1 only)
let guidedInsight = null;     // insight text after rating

// Category grouping for staged sliders
const GUT_CATS = ['experience', 'story', 'performance', 'hold'];
const BEAT_CATS = ['craft', 'world', 'ending', 'singularity'];

const CAT_LABELS = {};
CATEGORIES.forEach(c => { CAT_LABELS[c.key] = c.fullLabel || c.label; });

// ── PROMPTS ──
const FILM_PROMPTS = {
  1: {
    eyebrow: "palate map · let's find your taste",
    title: "Let's find your taste.",
    sub: `Think of a film you love. Not the "best" film — the one that's yours. The one you'd put on right now if nothing else mattered.`,
  },
  3: {
    eyebrow: 'palate map · the guilty pleasure',
    title: 'One more kind of film.',
    sub: `Pick a guilty pleasure. Something you love that maybe you can't fully defend. A film that's not "great" but is absolutely yours.\n\nIf you don't have guilty pleasures, pick a film that surprised you — something you expected to dislike and didn't.`,
  },
  4: {
    eyebrow: 'palate map · the litmus test',
    title: 'Almost there.',
    sub: `Pick a film that's widely loved — one that most people would rate highly — but that you don't particularly like. Or at least, that you like less than the world seems to.\n\nThis one teaches us the most.`,
  },
  // Film 5 is dynamic — see getFilm5Prompt()
};

// ── ONBOARDING ROLE METADATA ──
const ONBOARDING_ROLES = {
  1: 'anchor',
  2: 'contrast',
  3: 'guilty_pleasure',
  4: 'rejection',
  5: 'wildcard',
};

function getOnboardingRoleMeta(step) {
  const role = ONBOARDING_ROLES[step] || 'anchor';
  const meta = { onboarding_role: role };
  if (step === 2 && guidedFilms.length >= 1) {
    // Record which category we asked them to suppress
    const sorted = CATEGORIES
      .map(c => ({ key: c.key, score: guidedFilms[0].scores[c.key] || 50 }))
      .sort((a, b) => b.score - a.score);
    meta.contrast_target = sorted[0].key;
  }
  return meta;
}

// Dynamic prompt for Film 2 based on Film 1's scores
function getFilm2Prompt(film1Scores) {
  const sorted = CATEGORIES
    .map(c => ({ key: c.key, label: CAT_LABELS[c.key], score: film1Scores[c.key] || 50 }))
    .sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const prompts = {
    story: "Now pick a film you love that isn't really about the story. Something where the narrative doesn't matter — you love it for something else entirely.",
    craft: "Now pick a film you love that's kind of a mess. Not well-made in the traditional sense — but something about it works for you anyway.",
    performance: "Now pick a film you love where the performances aren't the point. Maybe it's animated, or a spectacle, or the characters are secondary to something else.",
    world: "Now pick a film you love that doesn't have much of a 'world.' A small film, maybe. Something intimate or bare where the environment isn't doing the work.",
    experience: "Now pick a film you admire more than you enjoy. Something you respect deeply but wouldn't put on for fun.",
    hold: "Now pick a film you loved in the moment but haven't thought much about since. A great time, but it didn't stick.",
    ending: "Now pick a film where the ending doesn't really matter. Something where the journey was the point.",
    singularity: "Now pick a film you love that's not particularly original. A familiar genre, a well-worn story — but done in a way that gets you.",
  };
  return {
    eyebrow: 'palate map · the contrast',
    title: 'Good. Now let\'s find the edges.',
    sub: prompts[top.key] || prompts.experience,
    reason: `${top.label} was your highest on ${guidedFilms[0]?.title || 'your first film'}. Let's see what happens when that's not driving things.`,
  };
}

// Dynamic prompt for Film 5 — find the blind spot in the taste profile so far
function getFilm5Prompt(films) {
  const cats = CATEGORIES.map(c => c.key);

  // Compute per-category mean and variance across rated films
  const means = {};
  const variances = {};
  cats.forEach(k => {
    const vals = films.map(f => f.scores[k] || 50);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    means[k] = mean;
    variances[k] = vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;
  });

  // Find the category with the least variance — we know the least about it
  const blindSpot = cats.reduce((a, b) => variances[a] < variances[b] ? a : b);
  const blindLabel = (CAT_LABELS[blindSpot] || blindSpot).replace('The ', '');

  // Build a readable summary of the taste so far for the "we wouldn't guess" framing
  const sorted = cats.map(k => ({ key: k, mean: means[k] })).sort((a, b) => b.mean - a.mean);
  const topTwo = sorted.slice(0, 2).map(s => (CAT_LABELS[s.key] || s.key).replace('The ', '').toLowerCase());
  const tasteShape = topTwo.join(' and ');

  return {
    eyebrow: 'palate map · the wild card',
    title: 'Last one. Surprise us.',
    sub: `So far your taste leans toward ${tasteShape}. Now pick the film we wouldn't guess.\n\nThe weird one. The one that doesn't fit the pattern. Something you love that would make someone who'd only seen your first four picks say "wait, really?"\n\nBonus points if it tells us something about ${blindLabel.toLowerCase()} — that's where your profile has the biggest blind spot.`,
  };
}

function getPromptForStep(step) {
  if (step === 2 && guidedFilms.length >= 1) {
    return getFilm2Prompt(guidedFilms[0].scores);
  }
  if (step === 5 && guidedFilms.length >= 4) {
    return getFilm5Prompt(guidedFilms);
  }
  return FILM_PROMPTS[step] || FILM_PROMPTS[1];
}

// ── INSIGHT GENERATION (role-aware) ──
function generateInsight(films, latest) {
  const scores = latest.scores;
  const cats = CATEGORIES.map(c => c.key);
  const peak = cats.reduce((a, b) => (scores[a] || 0) > (scores[b] || 0) ? a : b);
  const valley = cats.reduce((a, b) => (scores[a] || 0) < (scores[b] || 0) ? a : b);
  const peakVal = scores[peak] || 0;
  const valleyVal = scores[valley] || 0;
  const gap = peakVal - valleyVal;
  const role = latest.onboarding_role;

  // Film 1 — anchor
  if (role === 'anchor' || films.length === 1) {
    if (gap > 25) {
      return `${CAT_LABELS[peak]} is where this film hits you hardest — ${peakVal}. ${CAT_LABELS[valley]} barely registers at ${valleyVal}. That ${gap}-point gap says something about what you're here for.`;
    }
    return `Your scores are tightly clustered — this film works for you on almost every level. ${CAT_LABELS[peak]} leads at ${peakVal}, but nothing falls far behind. You might be someone who experiences films as whole things, not parts.`;
  }

  // Film 2 — contrast
  if (role === 'contrast' || films.length === 2) {
    const prev = films[0].scores;
    const prevPeak = cats.reduce((a, b) => (prev[a] || 0) > (prev[b] || 0) ? a : b);
    const suppressed = latest.contrast_target;
    if (suppressed && (scores[suppressed] || 0) < (prev[suppressed] || 0)) {
      const secondaryDriver = cats.filter(c => c !== suppressed).reduce((a, b) => (scores[a] || 0) > (scores[b] || 0) ? a : b);
      return `Without ${(CAT_LABELS[suppressed] || suppressed).replace('The ', '').toLowerCase()} doing the heavy lifting, ${CAT_LABELS[secondaryDriver]} takes over. That's your secondary driver — the thing that pulls you into a film when your main instinct isn't engaged.`;
    }
    if (peak === prevPeak) {
      return `Interesting — both films peak on ${CAT_LABELS[peak]}. Your taste has a strong center of gravity. Let's see if we can find the edge of it.`;
    }
    return `${films[0].title} is a ${CAT_LABELS[prevPeak]} film for you. ${latest.title} is a ${CAT_LABELS[peak]} film. Your taste isn't one thing — it has at least two modes.`;
  }

  // Film 3 — guilty pleasure
  if (role === 'guilty_pleasure') {
    const highCats = cats.filter(c => (scores[c] || 0) >= 70);
    const lowCats = cats.filter(c => (scores[c] || 0) <= 35);
    if (highCats.length > 0 && lowCats.length > 0) {
      const highLabels = highCats.map(c => (CAT_LABELS[c] || c).replace('The ', '').toLowerCase()).join(' and ');
      const lowLabels = lowCats.map(c => (CAT_LABELS[c] || c).replace('The ', '').toLowerCase()).join(' and ');
      return `You gave ${latest.title} strong marks on ${highLabels} despite low ${lowLabels}. That's not a guilty pleasure — that's self-knowledge. You know exactly what this film does for you, and you don't need it to do anything else.`;
    }
    return `Your guilty pleasure scores tell us something honest. ${CAT_LABELS[peak]} at ${peakVal} — that's what you reach for when your guard is down.`;
  }

  // Film 4 — rejection
  if (role === 'rejection') {
    const lowCats = cats.filter(c => (scores[c] || 0) <= 40).sort((a, b) => (scores[a] || 0) - (scores[b] || 0));
    if (lowCats.length > 0) {
      const lowestLabel = (CAT_LABELS[lowCats[0]] || lowCats[0]).replace('The ', '');
      return `Everyone loves ${latest.title}. You gave ${lowestLabel} a ${scores[lowCats[0]]}. That's not indifference — that's a standard. ${lowestLabel} is something you need a film to earn, and this one didn't.`;
    }
    return `Interesting — even on a film you don't love, nothing scored terribly low. You might not reject films categorically so much as lose interest when nothing stands out. ${CAT_LABELS[peak]} at ${peakVal} was the closest this one came to reaching you.`;
  }

  // Film 5 — wildcard
  if (role === 'wildcard') {
    // Compare wildcard to the pattern from films 1-4
    const priorFilms = films.slice(0, -1);
    const avgScores = {};
    cats.forEach(c => {
      avgScores[c] = priorFilms.reduce((s, f) => s + (f.scores[c] || 0), 0) / priorFilms.length;
    });
    // Find the biggest positive divergence — where wildcard exceeds the prior pattern
    const divergences = cats.map(c => ({ key: c, delta: (scores[c] || 0) - avgScores[c] }))
      .sort((a, b) => b.delta - a.delta);
    const biggestUp = divergences[0];
    if (biggestUp.delta > 15) {
      const label = (CAT_LABELS[biggestUp.key] || biggestUp.key).replace('The ', '');
      return `This one breaks the pattern. ${label} jumped ${Math.round(biggestUp.delta)} points above your average — that's the hidden range your first four films didn't show us. Your taste has a side door.`;
    }
    return `Your wild card isn't as wild as you think — it fits the pattern more than it breaks it. That's still a finding: your taste might be more coherent than you realize.`;
  }

  // Fallback for films 3+ without role tags
  const avgScores = {};
  cats.forEach(c => {
    avgScores[c] = films.reduce((s, f) => s + (f.scores[c] || 0), 0) / films.length;
  });
  const highestAvg = cats.reduce((a, b) => avgScores[a] > avgScores[b] ? a : b);
  const variances = {};
  cats.forEach(c => {
    const mean = avgScores[c];
    variances[c] = films.reduce((s, f) => s + ((f.scores[c] || 0) - mean) ** 2, 0) / films.length;
  });
  const mostVariance = cats.reduce((a, b) => variances[a] > variances[b] ? a : b);
  const lowestAvg = cats.reduce((a, b) => avgScores[a] < avgScores[b] ? a : b);

  return `Your palate is taking shape. ${CAT_LABELS[highestAvg]} matters most to you (avg ${Math.round(avgScores[highestAvg])}). ${CAT_LABELS[mostVariance]} is where you discriminate — it swings the most between films. ${CAT_LABELS[lowestAvg]} matters least, and that's fine.`;
}

// ── SCORE LABEL ──
function getScoreLabel(v) {
  if (v === 100) return 'No better exists';
  if (v === 1) return 'No worse exists';
  if (v >= 95) return 'Nearly perfect';
  if (v >= 90) return 'An all-time favorite';
  if (v >= 85) return 'Really quite exceptional';
  if (v >= 80) return 'Excellent';
  if (v >= 75) return 'Well above average';
  if (v >= 70) return 'Great';
  if (v >= 65) return 'Very good';
  if (v >= 60) return 'A cut above';
  if (v >= 55) return 'Good';
  if (v >= 50) return 'Solid';
  if (v >= 45) return 'Not bad';
  if (v >= 40) return 'Sub-par';
  if (v >= 35) return 'Multiple flaws';
  if (v >= 30) return 'Poor';
  if (v >= 25) return 'Bad';
  if (v >= 20) return "Wouldn't watch by choice";
  if (v >= 15) return 'So bad I stopped watching';
  if (v >= 10) return 'Disgusting';
  if (v >= 5) return 'Insulting';
  if (v >= 2) return 'Nearly the worst possible';
  return 'Unwatchable';
}

// ── LAUNCH / RENDER ──
export function launchOnboarding(opts = {}) {
  const overlay = document.getElementById('onboarding-overlay');
  overlay.style.display = 'flex';
  overlay.classList.remove('starters-mode');
  _obStartTime = Date.now();
  guidedStep = 1;
  guidedFilms = [];
  guidedSelectedFilm = null;
  guidedScores = {};
  guidedSliderStage = 'gut';
  guidedInsight = null;
  if (opts.skipToGuided) {
    obDisplayName = opts.name || '';
    obStep = 'guided';
    track('onboarding_start', { method: 'google' });
  } else {
    obStep = 'name';
  }
  renderObStep();
}

function renderObStep() {
  const card = document.getElementById('ob-card-content');
  const signoutWrap = document.getElementById('ob-signout-wrap');
  if (signoutWrap) signoutWrap.style.display = 'none';

  // Render topbar
  const topbar = document.getElementById('ob-topbar');
  if (topbar) {
    const userLabel = currentUser?.display_name || currentUser?.email || obDisplayName || '';
    topbar.innerHTML = `
      <span class="ob-topbar-wordmark">palate map</span>
      ${userLabel ? `<span class="ob-topbar-user">${userLabel}</span>` : ''}
    `;
  }

  if (obStep === 'name') {
    card.innerHTML = `
      <div class="ob-eyebrow">palate map · let's begin</div>
      <div class="ob-title">Taste is everything.</div>
      <div class="ob-sub">Build your taste profile. Syncs to the cloud so you can continue from any device.</div>
      <button class="ob-google-btn" onclick="obSignInWithGoogle()">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      <div class="ob-divider"><span>or</span></div>
      <input class="ob-name-input" id="ob-ml-name" type="text" placeholder="Your name" maxlength="32" oninput="obCheckMagicLink()" style="margin-bottom:10px">
      <input class="ob-name-input" id="ob-ml-email" type="email" placeholder="Email address" oninput="obCheckMagicLink()" onkeydown="if(event.key==='Enter') obSendMagicLink()">
      <div id="ob-ml-error" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--red);margin-bottom:8px;display:none"></div>
      <button class="ob-btn" id="ob-ml-btn" onclick="obSendMagicLink()" disabled>Send magic link →</button>
      <div style="text-align:center;margin-top:20px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px">Been here before? &nbsp;</span>
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obShowReturning()">Log in →</span>
      </div>
      <div style="text-align:center;margin-top:10px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px">On Letterboxd? &nbsp;</span>
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obShowImport()">Import your ratings →</span>
      </div>
      <div style="text-align:center;margin-top:24px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px;cursor:pointer" onclick="obBackToLanding()">← Back</span>
      </div>
    `;
    setTimeout(() => document.getElementById('ob-ml-name')?.focus(), 50);

  } else if (obStep === 'magic-link-sent') {
    card.innerHTML = `
      <div class="ob-eyebrow">palate map · check your inbox</div>
      <div class="ob-title">Magic link sent.</div>
      <div class="ob-sub">We sent a sign-in link to <strong>${obMagicLinkEmail}</strong>. Open it to continue — it'll bring you right back.</div>
      <button class="ob-btn" id="ob-resend-btn" onclick="obResendMagicLink()" style="margin-bottom:16px">Resend link →</button>
      <div style="text-align:center">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obBack()">← Back</span>
      </div>
    `;

  } else if (obStep === 'returning') {
    card.innerHTML = `
      <div class="ob-eyebrow">palate map · welcome back</div>
      <div class="ob-title">Log in.</div>
      <div class="ob-sub">Enter the email you signed up with. We'll send you a magic link to get back in.</div>
      <button class="ob-google-btn" onclick="obSignInWithGoogle()" style="margin-bottom:16px">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      <div class="ob-divider"><span>or</span></div>
      <input class="ob-name-input" id="ob-returning-email" type="email" placeholder="Email address" onkeydown="if(event.key==='Enter') obLoginMagicLink()">
      <div id="ob-returning-error" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--red);margin-bottom:12px;display:none"></div>
      <button class="ob-btn" id="ob-returning-btn" onclick="obLoginMagicLink()">Send magic link →</button>
      <div style="text-align:center;margin-top:20px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obBack()">← New user</span>
      </div>
    `;
    setTimeout(() => document.getElementById('ob-returning-email')?.focus(), 50);

  } else if (obStep === 'import') {
    card.innerHTML = `
      <div class="ob-eyebrow">palate map · letterboxd import</div>
      <div class="ob-title">Bring your watchlist.</div>
      <div class="ob-sub">Your Letterboxd ratings become your starting point. We'll map your star ratings to scores and let you go deeper from there.</div>

      <div style="background:var(--cream);border:1px solid var(--rule);padding:14px 16px;margin-bottom:20px;font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);line-height:1.9">
        <strong style="color:var(--ink)">How to export from Letterboxd:</strong><br>
        1. letterboxd.com → Settings → <strong>Import & Export</strong><br>
        2. Select <strong>Export Your Data</strong> → download the .zip<br>
        3. Unzip → upload <strong>ratings.csv</strong> below
      </div>

      <div id="ob-import-drop-lb" style="border:2px dashed var(--rule-dark);padding:40px 24px;text-align:center;cursor:pointer;margin-bottom:8px;transition:border-color 0.15s"
        onclick="document.getElementById('ob-import-file-lb').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--blue)'"
        ondragleave="this.style.borderColor='var(--rule-dark)'"
        ondrop="obHandleLetterboxdDrop(event)">
        <div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--dim);letter-spacing:1px;margin-bottom:6px">Drop ratings.csv here</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--rule-dark)">or click to browse</div>
      </div>
      <input type="file" id="ob-import-file-lb" accept=".csv,.json" style="display:none" onchange="obHandleLetterboxdFile(this)">
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-bottom:20px;line-height:1.6;text-align:center">
        5★ = 100 · 4★ = 80 · 3★ = 60 · 2★ = 40 · 1★ = 20 &nbsp;·&nbsp; Category scores added via Calibrate
      </div>

      <div id="ob-import-status" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px;min-height:18px"></div>
      <button class="ob-btn" id="ob-import-btn" onclick="obConfirmImport()" disabled>Continue with imported films →</button>
      <div style="text-align:center;margin-top:16px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obBack()">← Back</span>
      </div>
    `;

  } else if (obStep === 'guided') {
    renderGuidedStep();

  } else if (obStep === 'guided-insight') {
    renderGuidedInsight();

  } else if (obStep === 'guided-score') {
    renderGuidedScoring();

  } else if (obStep === 'guided-weights') {
    renderGuidedWeights();
  }
}

// ── GUIDED FILM PROMPT (search screen) ──
function renderGuidedStep() {
  const card = document.getElementById('ob-card-content');
  const overlay = document.getElementById('onboarding-overlay');
  overlay.classList.add('starters-mode');
  const prompt = getPromptForStep(guidedStep);

  card.innerHTML = `
    <div style="max-width:520px;margin:0 auto;padding:60px 24px 40px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:14px;opacity:0;animation:fadeIn 0.4s ease 0.2s both">${prompt.eyebrow}</div>
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(26px,6vw,36px);line-height:1.1;color:var(--on-dark);letter-spacing:-0.5px;margin-bottom:14px;opacity:0;animation:fadeIn 0.5s ease 0.4s both">${prompt.title}</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--on-dark-dim);margin-bottom:8px;white-space:pre-line;opacity:0;animation:fadeIn 0.4s ease 0.6s both">${prompt.sub}</div>
      ${prompt.reason ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim);opacity:0.7;margin-bottom:24px;opacity:0;animation:fadeIn 0.3s ease 0.8s both">${prompt.reason}</div>` : '<div style="margin-bottom:24px"></div>'}

      <div style="position:relative;max-width:440px;margin:0 auto;opacity:0;animation:fadeIn 0.4s ease 0.8s both">
        <input id="guided-search-input" type="text" placeholder="Search for a film..."
          style="width:100%;box-sizing:border-box;background:rgba(244,239,230,0.06);border:1px solid rgba(244,239,230,0.15);color:var(--on-dark);font-family:'DM Sans',sans-serif;font-size:16px;padding:14px 16px;border-radius:3px;outline:none"
          oninput="guidedSearchFilm(this.value)">
        <div id="guided-search-results" style="margin-top:8px"></div>
      </div>

      <div style="display:flex;justify-content:center;gap:24px;margin-top:32px;opacity:0;animation:fadeIn 0.3s ease 1s both">
        ${guidedStep > 1 ? `<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--on-dark-dim);cursor:pointer;letter-spacing:0.5px;text-decoration:underline;text-underline-offset:2px" onclick="guidedBack()">← Back</span>` : ''}
        ${guidedFilms.length >= 1 ? `<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--on-dark-dim);cursor:pointer;letter-spacing:0.5px;text-decoration:underline;text-underline-offset:2px" onclick="guidedSaveAndFinish()">Save and finish later</span>` : ''}
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById('guided-search-input')?.focus(), 100);
}

// ── GUIDED SCORING (sliders) ──
function renderGuidedScoring() {
  const card = document.getElementById('ob-card-content');
  const film = guidedSelectedFilm;
  if (!film) return;

  const posterUrl = film.poster ? `https://image.tmdb.org/t/p/w185${film.poster}` : null;
  const isFirstFilm = guidedFilms.length === 0;
  const showAll = !isFirstFilm || guidedSliderStage === 'all';
  const visibleCats = showAll ? CATEGORIES : CATEGORIES.filter(c => GUT_CATS.includes(c.key));

  // Check if all gut sliders have been touched (for Film 1 staged reveal)
  const gutTouched = GUT_CATS.every(k => guidedScores[k] !== 65);

  let slidersHTML = '';
  if (isFirstFilm && guidedSliderStage === 'gut') {
    slidersHTML += '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--on-dark-dim);margin:0 0 16px">Start with your gut</div>';
  }

  visibleCats.forEach((cat, idx) => {
    const val = guidedScores[cat.key] || 65;
    // Insert divider before beat group on first film
    if (isFirstFilm && guidedSliderStage === 'all' && idx === GUT_CATS.length) {
      slidersHTML += '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--on-dark-dim);margin:28px 0 16px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);opacity:0;animation:fadeIn 0.4s ease 0.1s both">Now the ones that take a beat longer.</div>';
    }
    const animStyle = isFirstFilm && guidedSliderStage === 'all' && BEAT_CATS.includes(cat.key)
      ? `opacity:0;animation:fadeIn 0.4s ease ${0.1 + (idx - GUT_CATS.length) * 0.08}s both`
      : '';
    slidersHTML += `
      <div class="score-split score-split-dark" style="margin-bottom:16px;${animStyle}">
        <div class="score-split-copy">
          <div class="score-split-copy-fullname">${cat.fullLabel || cat.label}</div>
          <div class="score-split-copy-prompt">"${cat.question}"</div>
          <div class="score-split-copy-desc">${cat.description || ''}</div>
        </div>
        <div class="score-split-slider">
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:28px;color:var(--on-dark)" id="guided-sv-${cat.key}">${val}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);margin-bottom:8px" id="guided-sl-${cat.key}">${getScoreLabel(val)}</div>
          <div class="score-slider-wrap" style="width:100%;padding:0 8px">
            <input type="range" min="1" max="100" value="${val}" class="score-slider starter-slider" oninput="guidedSliderChange('${cat.key}',this.value)" onpointerdown="this.parentElement.classList.add('touched')">
            <div class="score-scale-labels score-scale-labels-dark" style="margin-top:2px"><span class="scale-label-poor">Poor</span><span class="scale-label-solid">Solid</span><span class="scale-label-exceptional">Exceptional</span></div>
          </div>
        </div>
      </div>`;
  });

  card.innerHTML = `
    <div style="max-width:560px;margin:0 auto;padding:20px 24px 40px">
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06)">
        ${posterUrl ? `<img src="${posterUrl}" style="width:50px;flex-shrink:0;border-radius:2px">` : ''}
        <div style="flex:1;min-width:0">
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:18px;color:var(--on-dark)">${film.title}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim)">${film.year}${film.director ? ' · ' + film.director : ''}</div>
        </div>
        <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);cursor:pointer;text-decoration:underline;flex-shrink:0" onclick="guidedBackToSearch()">← Change</span>
      </div>

      ${isFirstFilm && guidedSliderStage === 'gut' ? `
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;color:var(--on-dark);opacity:0.7;line-height:1.6;margin-bottom:20px">These 8 sliders capture different dimensions of how a film hits you. There are no wrong answers. Just be honest with yourself.</div>
      ` : ''}

      ${slidersHTML}

      ${isFirstFilm && guidedSliderStage === 'gut' ? `
        <div style="text-align:center;margin-top:20px">
          <button class="ob-btn" style="max-width:320px;background:var(--blue)" onclick="guidedRevealBeatSliders()">Now the ones that take a beat →</button>
        </div>
      ` : `
        <div style="display:flex;justify-content:flex-end;margin-top:12px">
          <button class="ob-btn" style="max-width:200px;margin:0;padding:12px 28px;background:var(--blue)" onclick="guidedRateFilm()">Rate →</button>
        </div>
      `}
    </div>
  `;

  // Scroll to top
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) overlay.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── GUIDED INSIGHT (after rating) ──
function renderGuidedInsight() {
  const card = document.getElementById('ob-card-content');
  const latest = guidedFilms[guidedFilms.length - 1];
  if (!latest) return;

  const insight = guidedInsight || '';
  const isLast = guidedStep > 5;
  const buttonText = isLast ? 'See your palate →' : 'Continue →';
  const buttonAction = isLast ? 'guidedShowWeights()' : 'guidedNextFilm()';

  // Build a mini bar chart of the latest film's scores
  const catKeys = CATEGORIES.map(c => c.key);
  const maxScore = Math.max(...catKeys.map(k => latest.scores[k] || 0), 1);
  const barsHTML = catKeys.map(k => {
    const val = latest.scores[k] || 0;
    const pct = Math.round((val / 100) * 100);
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);width:80px;text-align:right">${CAT_LABELS[k]?.replace('The ', '') || k}</div>
        <div style="flex:1;height:8px;background:rgba(255,255,255,0.06);position:relative;border-radius:1px">
          <div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:var(--blue);border-radius:1px;transition:width 0.5s ease"></div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--on-dark);width:24px">${val}</div>
      </div>`;
  }).join('');

  card.innerHTML = `
    <div style="max-width:520px;margin:0 auto;padding:60px 24px 40px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:14px;opacity:0;animation:fadeIn 0.3s ease 0.3s both">
        ${guidedFilms.length === 1 ? 'your first signature' : `film ${guidedFilms.length} of 5`}
      </div>
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:20px;color:var(--on-dark);margin-bottom:4px;opacity:0;animation:fadeIn 0.3s ease 0.4s both">${latest.title} — ${Math.round(latest.total)}</div>
      <div style="margin:16px 0 24px;opacity:0;animation:fadeIn 0.4s ease 0.6s both">
        ${barsHTML}
      </div>
      <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--on-dark);opacity:0;animation:fadeIn 0.4s ease 0.9s both">${insight}</div>
      <div style="margin-top:32px;opacity:0;animation:fadeIn 0.3s ease 1.2s both">
        <button class="ob-btn" style="max-width:300px;background:var(--blue)" onclick="${buttonAction}">${buttonText}</button>
      </div>
    </div>
  `;
}

// ── GUIDED WEIGHTS (after Film 5) ──
function renderGuidedWeights() {
  const card = document.getElementById('ob-card-content');
  const cats = CATEGORIES.map(c => c.key);

  // Compute average scores and variance from the 5 films
  const avgScores = {};
  const variances = {};
  cats.forEach(c => {
    avgScores[c] = guidedFilms.reduce((s, f) => s + (f.scores[c] || 0), 0) / guidedFilms.length;
  });
  cats.forEach(c => {
    const mean = avgScores[c];
    variances[c] = guidedFilms.reduce((s, f) => s + ((f.scores[c] || 0) - mean) ** 2, 0) / guidedFilms.length;
  });

  // Sort by average descending for the bar chart
  const sorted = cats
    .map(k => ({ key: k, avg: avgScores[k], variance: variances[k] }))
    .sort((a, b) => b.avg - a.avg);

  const highestAvg = sorted[0];
  const mostVariance = cats.reduce((a, b) => variances[a] > variances[b] ? a : b);
  const lowestAvg = sorted[sorted.length - 1];

  // Generate insight
  let summaryInsight = '';
  const craftCats = ['story', 'craft', 'performance', 'world'];
  const expCats = ['experience', 'hold', 'ending', 'singularity'];
  const craftAvg = craftCats.reduce((s, k) => s + avgScores[k], 0) / craftCats.length;
  const expAvg = expCats.reduce((s, k) => s + avgScores[k], 0) / expCats.length;

  if (Math.abs(craftAvg - expAvg) > 8) {
    if (expAvg > craftAvg) {
      summaryInsight = `You care about how a film makes you feel more than how it's made. Craft impresses you but doesn't move the needle. ${CAT_LABELS[highestAvg.key]} and ${CAT_LABELS[sorted[1].key]} are where a film wins or loses you.`;
    } else {
      summaryInsight = `You're drawn to how films are built — the filmmaking itself matters to you. ${CAT_LABELS[highestAvg.key]} leads the way. But when ${CAT_LABELS[lowestAvg.key]} falls short, you notice less.`;
    }
  } else {
    summaryInsight = `Your taste has a balanced center — you care about both how a film is made and how it makes you feel. ${CAT_LABELS[highestAvg.key]} matters most, and ${CAT_LABELS[mostVariance]} is where you discriminate between films.`;
  }

  const maxAvg = sorted[0].avg;
  const barsHTML = sorted.map(({ key, avg }) => {
    const pct = Math.round((avg / 100) * 100);
    const label = CAT_LABELS[key]?.replace('The ', '') || key;
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--on-dark-dim);width:90px;text-align:right">${label}</div>
        <div style="flex:1;height:10px;background:rgba(255,255,255,0.06);position:relative;border-radius:2px">
          <div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:var(--blue);border-radius:2px;transition:width 0.6s ease"></div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark);width:28px">${Math.round(avg)}</div>
      </div>`;
  }).join('');

  card.innerHTML = `
    <div style="max-width:520px;margin:0 auto;padding:60px 24px 40px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:14px;opacity:0;animation:fadeIn 0.3s ease 0.3s both">your palate</div>
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(24px,5vw,32px);line-height:1.1;color:var(--on-dark);letter-spacing:-0.5px;margin-bottom:14px;opacity:0;animation:fadeIn 0.5s ease 0.5s both">This is your palate.</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.7;color:var(--on-dark-dim);margin-bottom:28px;opacity:0;animation:fadeIn 0.4s ease 0.7s both">Five films. Five different relationships. One throughline:</div>

      <div style="margin-bottom:28px;opacity:0;animation:fadeIn 0.4s ease 0.9s both">
        ${barsHTML}
      </div>

      <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--on-dark);margin-bottom:12px;opacity:0;animation:fadeIn 0.4s ease 1.1s both">${summaryInsight}</div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim);margin-bottom:32px;opacity:0;animation:fadeIn 0.3s ease 1.3s both">These weights shape how Palate Map calculates your scores and what we recommend. They'll evolve as you rate more films.</div>

      <div style="opacity:0;animation:fadeIn 0.3s ease 1.5s both">
        <button class="ob-btn" style="max-width:300px;background:var(--blue)" onclick="guidedFinish()">Enter Palate Map →</button>
      </div>
    </div>
  `;
}

// ── WINDOW HANDLERS: AUTH ──

window.obCheckMagicLink = function() {
  const name = document.getElementById('ob-ml-name')?.value?.trim();
  const email = document.getElementById('ob-ml-email')?.value?.trim();
  const btn = document.getElementById('ob-ml-btn');
  if (btn) btn.disabled = !(name && email && email.includes('@'));
};

window.obSignInWithGoogle = async function() {
  const name = document.getElementById('ob-ml-name')?.value?.trim();
  if (name) localStorage.setItem('palatemap_pending_name', name);
  await signInWithGoogle();
};

window.obSendMagicLink = async function() {
  const name = document.getElementById('ob-ml-name')?.value?.trim();
  const email = document.getElementById('ob-ml-email')?.value?.trim();
  if (!name || !email) return;
  const btn = document.getElementById('ob-ml-btn');
  const errEl = document.getElementById('ob-ml-error');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  if (errEl) errEl.style.display = 'none';
  try {
    localStorage.setItem('palatemap_pending_name', name);
    await sendMagicLink(email);
    obMagicLinkEmail = email;
    obStep = 'magic-link-sent';
    renderObStep();
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Send magic link →';
    if (errEl) { errEl.textContent = 'Something went wrong. Try again.'; errEl.style.display = 'block'; }
  }
};

window.obResendMagicLink = async function() {
  const btn = document.getElementById('ob-resend-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    await sendMagicLink(obMagicLinkEmail);
    btn.textContent = 'Sent ✓';
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Resend link →'; }, 3000);
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Resend link →';
  }
};

window.obShowReturning = function() { obStep = 'returning'; renderObStep(); };
window.obBackToLanding = function() {
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) overlay.remove();
  const landing = document.getElementById('cold-landing');
  if (landing) landing.style.display = 'block';
};

window.obSignOut = async function() {
  const { signOutUser } = await import('./supabase.js');
  await signOutUser();
};

window.obLoginMagicLink = async function() {
  const emailEl = document.getElementById('ob-returning-email');
  const btn = document.getElementById('ob-returning-btn');
  const errEl = document.getElementById('ob-returning-error');
  const email = emailEl?.value?.trim();
  if (!email || !email.includes('@')) {
    if (errEl) { errEl.textContent = 'Enter a valid email address.'; errEl.style.display = 'block'; }
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Sending…';
  if (errEl) errEl.style.display = 'none';
  try {
    await sendMagicLink(email);
    obMagicLinkEmail = email;
    obStep = 'magic-link-sent';
    renderObStep();
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Send magic link →';
    if (errEl) { errEl.textContent = 'Something went wrong. Try again.'; errEl.style.display = 'block'; }
  }
};

window.obShowImport = function() { obStep = 'import'; obImportedMovies = null; renderObStep(); };

// ── WINDOW HANDLERS: IMPORT ──

window.obHandleLetterboxdDrop = function(e) {
  e.preventDefault();
  const drop = document.getElementById('ob-import-drop-lb');
  if (drop) drop.style.borderColor = 'var(--rule-dark)';
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (file.name.endsWith('.json')) obReadImportFile(file);
  else obReadLetterboxdFile(file);
};

window.obHandleLetterboxdFile = function(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.name.endsWith('.json')) obReadImportFile(file);
  else obReadLetterboxdFile(file);
};

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  });
}

function obReadLetterboxdFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const rows = parseCSV(e.target.result);
      const films = rows
        .filter(r => r.Name && r.Rating && parseFloat(r.Rating) > 0)
        .map(r => {
          const stars = parseFloat(r.Rating);
          const total = Math.round(stars * 20);
          return {
            title: r.Name, year: parseInt(r.Year) || null, total,
            scores: {}, director: '', writer: '', cast: '',
            productionCompanies: '', poster: null, overview: ''
          };
        });
      if (films.length === 0) throw new Error('No rated films found');
      obImportedMovies = films;
      document.getElementById('ob-import-status').textContent = `✓ ${films.length} films ready to import`;
      document.getElementById('ob-import-status').style.color = 'var(--green)';
      const dropLb = document.getElementById('ob-import-drop-lb');
      if (dropLb) { dropLb.style.borderColor = 'var(--green)'; dropLb.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--green)">${file.name}</div><div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--green);margin-top:4px">${films.length} films ready to import</div>`; }
      document.getElementById('ob-import-btn').disabled = false;
    } catch(err) {
      document.getElementById('ob-import-status').textContent = "Couldn't parse that file — make sure it's ratings.csv from Letterboxd.";
      document.getElementById('ob-import-status').style.color = 'var(--red)';
    }
  };
  reader.readAsText(file);
}

function obReadImportFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('invalid');
      if (!parsed[0].scores || !parsed[0].title) throw new Error('invalid');
      obImportedMovies = parsed;
      document.getElementById('ob-import-status').textContent = `✓ ${parsed.length} films ready to import`;
      document.getElementById('ob-import-status').style.color = 'var(--green)';
      document.getElementById('ob-import-btn').disabled = false;
    } catch(err) {
      document.getElementById('ob-import-status').textContent = "That doesn't look like a valid Palate Map JSON file.";
      document.getElementById('ob-import-status').style.color = 'var(--red)';
    }
  };
  reader.readAsText(file);
}

window.obConfirmImport = function() {
  if (!obImportedMovies) return;
  setMovies(obImportedMovies);
  // Skip guided flow, go straight to finish with defaults
  guidedFinishWithDefaults();
};

window.obBack = function() {
  if (obStep === 'guided-score') {
    obStep = 'guided';
    guidedSelectedFilm = null;
    guidedScores = {};
    renderObStep();
  } else {
    obStep = 'name';
    renderObStep();
  }
};

// ── WINDOW HANDLERS: GUIDED SEARCH ──

let _guidedSearchTimer = null;
window.guidedSearchFilm = function(query) {
  const resultsEl = document.getElementById('guided-search-results');
  if (!resultsEl) return;
  clearTimeout(_guidedSearchTimer);
  if (!query || query.length < 2) { resultsEl.innerHTML = ''; return; }
  _guidedSearchTimer = setTimeout(async () => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
      const data = await res.json();
      const ratedSet = new Set([...MOVIES.map(m => String(m.tmdbId)), ...guidedFilms.map(f => String(f.tmdbId))]);
      const results = (data.results || [])
        .filter(f => f.poster_path && !ratedSet.has(String(f.id)))
        .slice(0, 6);
      if (!results.length) {
        resultsEl.innerHTML = '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--on-dark-dim);padding:8px 0">No results</div>';
        return;
      }
      resultsEl.innerHTML = results.map(f => {
        const year = f.release_date ? f.release_date.slice(0, 4) : '';
        const safeTitle = f.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 4px;cursor:pointer;border-bottom:1px solid rgba(244,239,230,0.08)" onclick="guidedSelectFilm(${f.id}, '${f.poster_path}', '${safeTitle}', '${year}')">
          <img src="https://image.tmdb.org/t/p/w92${f.poster_path}" style="width:36px;height:54px;object-fit:cover;border-radius:2px;flex-shrink:0" alt="">
          <div style="min-width:0">
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;color:var(--on-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.title}</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim)">${year}</div>
          </div>
        </div>`;
      }).join('');
    } catch(e) {
      resultsEl.innerHTML = '';
    }
  }, 300);
};

window.guidedSelectFilm = function(tmdbId, posterPath, title, year) {
  guidedSelectedFilm = { tmdbId, poster: posterPath, title, year, director: '' };
  // Init scores
  guidedScores = {};
  CATEGORIES.forEach(c => { guidedScores[c.key] = 65; });
  guidedSliderStage = guidedFilms.length === 0 ? 'gut' : 'all';
  obStep = 'guided-score';
  renderObStep();

  // Fetch director in background
  fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_KEY}`)
    .then(r => r.json())
    .then(data => {
      const dir = (data.crew || []).filter(c => c.job === 'Director').map(c => c.name).join(', ');
      if (dir && guidedSelectedFilm?.tmdbId === tmdbId) {
        guidedSelectedFilm.director = dir;
        const dirEl = document.querySelector('.score-split-dark')?.parentElement;
        // Update inline if still on scoring screen
      }
    })
    .catch(() => {});
};

// ── WINDOW HANDLERS: GUIDED SCORING ──

window.guidedSliderChange = function(catKey, val) {
  val = parseInt(val);
  guidedScores[catKey] = val;
  const el = document.getElementById('guided-sv-' + catKey);
  if (el) el.textContent = val;
  const labelEl = document.getElementById('guided-sl-' + catKey);
  if (labelEl) labelEl.textContent = getScoreLabel(val);
};

window.guidedRevealBeatSliders = function() {
  guidedSliderStage = 'all';
  renderGuidedScoring();
};

window.guidedBackToSearch = function() {
  guidedSelectedFilm = null;
  guidedScores = {};
  obStep = 'guided';
  renderObStep();
};

window.guidedRateFilm = async function() {
  const film = guidedSelectedFilm;
  if (!film) return;

  const scores = { ...guidedScores };
  const total = calcTotal(scores);

  // Build role metadata for this onboarding step
  const roleMeta = getOnboardingRoleMeta(guidedStep);

  // Build full film object
  const filmObj = {
    title: film.title, year: film.year,
    director: film.director || '', writer: '', cast: '',
    productionCompanies: '', poster: film.poster,
    overview: '', tmdbId: film.tmdbId,
    scores: { ...scores }, total,
    ...roleMeta,
  };

  // Push to MOVIES
  MOVIES.push(filmObj);
  guidedFilms.push({ tmdbId: film.tmdbId, title: film.title, year: film.year, poster: film.poster, director: film.director, scores: { ...scores }, total, ...roleMeta });

  // Generate insight
  guidedInsight = generateInsight(guidedFilms, guidedFilms[guidedFilms.length - 1]);

  // Move to next step
  guidedStep++;
  guidedSelectedFilm = null;
  guidedScores = {};

  obStep = 'guided-insight';
  renderObStep();

  // Lazy-load full TMDB metadata in background
  try {
    const bundle = await fetchTmdbMovieBundle(film.tmdbId);
    const existing = MOVIES.find(m => String(m.tmdbId) === String(film.tmdbId));
    if (existing && bundle) {
      existing.writer = bundle.writers?.join(', ') || '';
      existing.cast = bundle.top8Cast?.map(c => c.name).join(', ') || '';
      existing.productionCompanies = bundle.companies?.map(c => c.name).join(', ') || '';
      existing.overview = bundle.detail?.overview || '';
      if (bundle.detail?.poster_path) existing.poster = bundle.detail.poster_path;
    }
  } catch (e) {
    console.warn('Guided film TMDB fetch failed:', e);
  }
};

window.guidedNextFilm = function() {
  obStep = 'guided';
  renderObStep();
};

window.guidedShowWeights = function() {
  obStep = 'guided-weights';
  renderObStep();
};

window.guidedBack = function() {
  if (guidedStep <= 1) return;
  // Remove the last rated film if going back from a search screen
  if (guidedFilms.length >= guidedStep) {
    const removed = guidedFilms.pop();
    // Also remove from MOVIES
    const idx = MOVIES.findIndex(m => String(m.tmdbId) === String(removed.tmdbId));
    if (idx !== -1) MOVIES.splice(idx, 1);
  }
  guidedStep--;
  guidedSelectedFilm = null;
  guidedScores = {};
  guidedSliderStage = 'gut';
  guidedInsight = null;
  obStep = 'guided';
  renderObStep();
};

window.guidedSaveAndFinish = function() {
  if (guidedFilms.length < 1) return;
  guidedFinishWithDefaults();
};

window.guidedFinish = function() {
  guidedFinishWithDefaults();
};

// ── FINISH ──

function guidedFinishWithDefaults() {
  // Set uniform default quiz_weights (preserves backward compat with quiz_weights sentinel)
  const defaultWeights = {};
  CATEGORIES.forEach(c => { defaultWeights[c.key] = 2.5; });

  obFinish({
    primary: 'Holist', // will be computed properly from ratings later
    secondary: '',
    weights: { ...defaultWeights },
    archetypeKey: 'balanced',
    adjective: null,
    fullName: null,
    quiz_weights: { ...defaultWeights },
    quiz_answers: [],
    quiz_log: [],
    _slug: obDisplayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user',
  });
}

async function obFinish(reveal, opts = {}) {
  // Preserve existing user identity for re-onboarding; generate new id only for fresh sign-ups
  const existing = currentUser;
  const id = existing?.id || crypto.randomUUID();
  const slug = existing?.username || reveal._slug || (obDisplayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user');
  const session = window._pendingAuthSession || null;

  // If user has enough films, compute archetype from actual ratings
  let archetype = reveal.primary;
  let archetypeKey = reveal.archetypeKey;
  let adjective = reveal.adjective;
  let fullName = reveal.fullName;
  let weights = { ...reveal.weights };

  if (MOVIES.length >= 5) {
    // Compute rating-derived weights
    const catKeys = CATEGORIES.map(c => c.key);
    const avgScores = {};
    catKeys.forEach(c => {
      avgScores[c] = MOVIES.reduce((s, m) => s + (m.scores?.[c] || 50), 0) / MOVIES.length;
    });
    // Normalize to weight-like scale (1-5)
    const maxAvg = Math.max(...Object.values(avgScores));
    const minAvg = Math.min(...Object.values(avgScores));
    const range = maxAvg - minAvg || 1;
    catKeys.forEach(c => {
      weights[c] = 1 + ((avgScores[c] - minAvg) / range) * 4;
    });

    const classification = classifyArchetype(weights);
    archetype = classification.archetype;
    archetypeKey = classification.archetypeKey;
    adjective = classification.adjective;
    fullName = classification.fullName;
  }

  setCurrentUser({
    id, username: slug, display_name: obDisplayName,
    archetype, archetype_secondary: reveal.secondary || '',
    archetype_key: archetypeKey,
    adjective,
    full_archetype_name: fullName,
    weights: { ...weights },
    quiz_weights: reveal.quiz_weights,
    quiz_answers: reveal.quiz_answers,
    quiz_log: reveal.quiz_log,
    email: session?.user?.email || existing?.email || null,
    auth_id: session?.user?.id || existing?.auth_id || null,
    // Preserve existing data that shouldn't be reset
    ...(existing?.watchlist ? { watchlist: existing.watchlist } : {}),
    ...(existing?.predictions ? { predictions: existing.predictions } : {}),
    ...(existing?.harmony_sensitivity != null ? { harmony_sensitivity: existing.harmony_sensitivity } : {}),
  });
  window._pendingAuthSession = null;

  applyUserWeights();
  recalcAllTotals();
  recordWeightSnapshot('onboarding');

  // For users with enough ratings, blend weights
  if (MOVIES.length >= 3) {
    const { updateEffectiveWeights } = await import('./weight-blend.js');
    updateEffectiveWeights();
  }

  // Render app content underneath the overlay before animating
  const { updateMastheadProfile, updateStorageStatus, setCloudStatus } = await import('../ui-callbacks.js');
  updateMastheadProfile();
  updateStorageStatus();
  setCloudStatus('syncing');
  renderRankings();
  saveUserLocally();

  // Curtain lift: overlay slides up while app settles in
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay.classList.contains('exiting')) return;
  document.body.classList.add('app-entering');
  overlay.classList.add('exiting');
  overlay.addEventListener('animationend', async () => {
    overlay.style.display = 'none';
    overlay.classList.remove('exiting');
    overlay.classList.remove('starters-mode');
    document.body.classList.remove('app-entering');
    if (opts.goToAdd) {
      const { showScreen } = await import('../main.js');
      showScreen('add');
    }
  }, { once: true });

  // Mark welcome modal as shown
  localStorage.setItem('palatemap_welcome_shown', '1');

  syncToSupabase().catch(e => console.warn('Initial sync failed:', e));

  track('onboarding_completed', {
    films_rated_count: MOVIES.length,
    archetype,
    archetype_key: archetypeKey,
    adjective,
    guided_films: guidedFilms.length,
    time_in_onboarding_seconds: _obStartTime ? Math.round((Date.now() - _obStartTime) / 1000) : null,
  });
}
