// ── CURATION RESPONSE PARSE + NORMALIZE ──────────────────────────────────────
// Robust parsing for the metered `book_curate` Claude response. Kept dependency-
// free and pure so it can be unit-tested in node and so the parse/normalize
// contract is independently inspectable — the user has already been charged a
// credit by the time we run this, so brittleness here directly wastes money.
//
// parseCurationJSON(text)  → object | null   (never throws)
//   - strips ```json fences
//   - strict JSON.parse first
//   - extracts the largest BALANCED {…} (handles prose before/after, truncation)
//   - repairs trailing commas
//
// normalizeCuration(parsed) → { safe_picks, upside_picks } | null
//   - tolerant of common omissions (rank → array index; missing upside_basis;
//     low/medium/high confidence strings; missing upside_picks entirely)
//   - rejects only when nothing usable remains

// Walk the string to find the first {…} block whose braces actually balance.
// Tracks string literals + escapes so braces inside JSON strings don't count.
function extractBalancedObject(s) {
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null; // unbalanced (truncated mid-object)
}

const tryParse = (s) => { try { return JSON.parse(s); } catch { return undefined; } };

/** Parse a model curation response into an object, or null. Never throws. */
export function parseCurationJSON(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 1. strict parse of the whole cleaned string
  let obj = tryParse(clean);
  if (obj && typeof obj === 'object') return obj;

  // 2. extract the largest balanced { … } and try that
  const extracted = extractBalancedObject(clean);
  if (extracted) {
    obj = tryParse(extracted);
    if (obj && typeof obj === 'object') return obj;
    // 3. common repair: trailing commas before } or ]
    obj = tryParse(extracted.replace(/,(\s*[}\]])/g, '$1'));
    if (obj && typeof obj === 'object') return obj;
  }

  // 4. last resort: trailing-comma repair on the whole cleaned string
  obj = tryParse(clean.replace(/,(\s*[}\]])/g, '$1'));
  if (obj && typeof obj === 'object') return obj;

  return null;
}

const CONF_MAP = { high: 0.85, medium: 0.6, med: 0.6, low: 0.4 };
function normConfidence(c) {
  if (typeof c === 'number' && Number.isFinite(c)) return c > 1 ? Math.min(1, c / 100) : Math.max(0, c);
  if (typeof c === 'string') {
    const v = CONF_MAP[c.toLowerCase().trim()];
    if (v != null) return v;
    const num = parseFloat(c);
    if (Number.isFinite(num)) return num > 1 ? Math.min(1, num / 100) : Math.max(0, num);
  }
  return null;
}

function normPick(p, i) {
  if (!p || typeof p !== 'object') return null;
  const book_key = p.book_key || p.key || p.bookKey;
  if (!book_key || typeof book_key !== 'string') return null;
  const why = typeof p.why === 'string' ? p.why : typeof p.reason === 'string' ? p.reason : '';
  return {
    book_key,
    rank: typeof p.rank === 'number' ? p.rank : i + 1,
    why: why.slice(0, 160),
    fit_dimensions: Array.isArray(p.fit_dimensions) ? p.fit_dimensions : null,
    upside_basis: typeof p.upside_basis === 'string' ? p.upside_basis : null,
    confidence: normConfidence(p.confidence),
  };
}

/**
 * Validate + normalize a parsed curation object into the canonical shape. Tolerant
 * of common minor omissions; returns null only when nothing usable could be
 * recovered (caller then surfaces a graceful error / falls back to free shelves).
 */
export function normalizeCuration(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const safeRaw = Array.isArray(parsed.safe_picks) ? parsed.safe_picks
    : Array.isArray(parsed.safe) ? parsed.safe : [];
  const upRaw = Array.isArray(parsed.upside_picks) ? parsed.upside_picks
    : Array.isArray(parsed.upside) ? parsed.upside : [];
  const safe_picks = safeRaw.map(normPick).filter(Boolean);
  const upside_picks = upRaw.map(normPick).filter(Boolean);
  if (!safe_picks.length && !upside_picks.length) return null;
  return { safe_picks, upside_picks };
}
