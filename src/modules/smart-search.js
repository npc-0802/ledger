// Smart movie search with disambiguation support.
// Parses queries into title + context signals (year, director, cast),
// runs multi-strategy TMDB searches, enriches top candidates with credits,
// and reranks results so contextual terms like "Stalker Tarkovsky" or
// "The Thing 1982" surface the correct film.

const TMDB_KEY = 'f5a446a5f70a9f6a16a8ddd052c121f2';
const TMDB = 'https://api.themoviedb.org/3';

// Session-level credits cache to avoid refetching
const _creditsCache = new Map();

/**
 * Parse a search query into structured parts.
 * Extracts year tokens and separates the remainder.
 */
export function parseSearchQuery(raw) {
  const trimmed = raw.trim();
  const yearMatch = trimmed.match(/\b((?:19|20)\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const textWithoutYear = year
    ? trimmed.replace(yearMatch[0], '').replace(/\s{2,}/g, ' ').trim()
    : trimmed;
  const tokens = textWithoutYear.split(/\s+/).filter(Boolean);
  return { year, tokens, textWithoutYear, raw: trimmed };
}

/**
 * Fetch credits for a TMDB movie, with session cache.
 */
async function fetchCredits(tmdbId) {
  const key = String(tmdbId);
  if (_creditsCache.has(key)) return _creditsCache.get(key);
  try {
    const res = await fetch(`${TMDB}/movie/${tmdbId}/credits?api_key=${TMDB_KEY}`);
    const data = await res.json();
    const directors = (data.crew || []).filter(c => c.job === 'Director').map(c => c.name);
    const writers = (data.crew || [])
      .filter(c => ['Screenplay', 'Writer', 'Story'].includes(c.job))
      .map(c => c.name)
      .filter((v, i, a) => a.indexOf(v) === i);
    const cast = (data.cast || []).slice(0, 8).map(c => c.name);
    const result = { directors, writers, cast };
    _creditsCache.set(key, result);
    return result;
  } catch {
    return { directors: [], writers: [], cast: [] };
  }
}

/**
 * Run a single TMDB movie search.
 */
async function tmdbMovieSearch(query, year = null) {
  let url = `${TMDB}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US`;
  if (year) url += `&year=${year}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Compute disambiguation score for a result given parsed query context.
 */
export function computeDisambiguationScore(result, parsed) {
  const { year, tokens, textWithoutYear } = parsed;
  let score = 0;

  const resultTitle = (result.title || '').toLowerCase();
  const resultOrigTitle = (result.original_title || '').toLowerCase();
  const queryText = textWithoutYear.toLowerCase();

  // Split title into matchable words
  const titleWords = new Set(
    (resultTitle + ' ' + resultOrigTitle)
      .split(/[\s:,\-–—.'']+/)
      .filter(w => w.length > 0)
  );

  // Identify which query tokens appear in the title vs are context
  const queryTokensLower = tokens.map(t => t.toLowerCase());
  const titleMatchTokens = [];
  const contextTokens = [];

  for (const t of queryTokensLower) {
    if (titleWords.has(t) || resultTitle.includes(t) || resultOrigTitle.includes(t)) {
      titleMatchTokens.push(t);
    } else {
      contextTokens.push(t);
    }
  }

  // ── Title scoring (dominant, 0–100) ──
  // Exact match of the entire query text against result title
  if (resultTitle === queryText || resultOrigTitle === queryText) {
    score += 100;
  } else {
    // Check how well the title portion matches
    const titleOnlyQuery = titleMatchTokens.join(' ');
    if (titleOnlyQuery && (resultTitle === titleOnlyQuery || resultOrigTitle === titleOnlyQuery)) {
      // Title-matching tokens exactly reconstruct the result title.
      // If there are context tokens (director/year/cast hints), slightly reduce
      // the title bonus so that metadata matches can meaningfully rerank.
      score += contextTokens.length > 0 ? 82 : 95;
    } else if (titleMatchTokens.length > 0) {
      // Proportion of result title covered by query tokens
      const coverage = titleWords.size > 0
        ? [...titleWords].filter(tw => queryTokensLower.some(qt => tw === qt || tw.startsWith(qt) || qt.startsWith(tw))).length / titleWords.size
        : 0;
      // Also consider: what fraction of query's title-tokens matched?
      // A result where all title tokens hit is better than a partial hit.
      const queryHitRatio = titleMatchTokens.length / Math.max(1, queryTokensLower.length);
      score += 40 + coverage * 35 + queryHitRatio * 15; // 40–90 range
    }
  }

  // ── Year scoring (strong, 0–30) ──
  if (year) {
    const resultYear = result.release_date ? parseInt(result.release_date.substring(0, 4)) : null;
    if (resultYear === year) {
      score += 30;
    } else if (resultYear && Math.abs(resultYear - year) <= 1) {
      score += 8;
    }
  }

  // ── Director scoring (strong, 0–25) ──
  if (result._directors && contextTokens.length > 0) {
    const dirStr = result._directors.join(' ').toLowerCase();
    if (contextTokens.some(t => t.length >= 3 && dirStr.includes(t))) {
      score += 25;
    }
  }

  // ── Writer scoring (moderate, 0–12) ──
  if (result._writers && contextTokens.length > 0) {
    const writerStr = result._writers.join(' ').toLowerCase();
    if (contextTokens.some(t => t.length >= 3 && writerStr.includes(t))) {
      score += 12;
    }
  }

  // ── Cast scoring (meaningful, 0–15) ──
  if (result._cast && contextTokens.length > 0) {
    const castStr = result._cast.join(' ').toLowerCase();
    if (contextTokens.some(t => t.length >= 3 && castStr.includes(t))) {
      score += 15;
    }
  }

  // ── Popularity tiebreaker (very weak, max ~1 point) ──
  score += Math.min(result.popularity || 0, 200) * 0.005;

  return score;
}

/**
 * Smart movie search with disambiguation.
 *
 * @param {string} query - Raw user search string
 * @param {object} options
 * @param {number} options.limit - Max results (default 6)
 * @param {boolean} options.requirePoster - Filter to results with posters
 * @param {Set|null} options.excludeIds - TMDB IDs to exclude
 * @returns {Promise<Array>} Enriched, scored, sorted TMDB results
 *   Each result has: standard TMDB fields plus _directors, _cast, _writers, _score, _yearNum
 */
export async function smartSearch(query, { limit = 6, requirePoster = false, excludeIds = null } = {}) {
  const parsed = parseSearchQuery(query);
  if (!parsed.textWithoutYear && !parsed.year) return [];

  // ── Multi-strategy TMDB search ──
  const searches = [];
  const searchText = parsed.textWithoutYear || String(parsed.year);

  // Strategy 1: full text (minus year) with optional TMDB year filter
  searches.push(tmdbMovieSearch(searchText, parsed.year));

  // Strategy 2: if year was extracted and search with year returned nothing,
  // the fallback without year is handled inside. But also search without year
  // explicitly if we have year, to get broader results.
  if (parsed.year && parsed.textWithoutYear) {
    searches.push(tmdbMovieSearch(parsed.textWithoutYear));
  }

  // Strategy 3: if query has 2+ non-year tokens, also try shorter prefixes.
  // This handles "Stalker Tarkovsky" → also search just "Stalker".
  if (parsed.tokens.length >= 2) {
    const shorter = parsed.tokens.slice(0, -1).join(' ');
    if (shorter !== searchText) {
      searches.push(tmdbMovieSearch(shorter, parsed.year));
    }
    if (parsed.tokens.length >= 3) {
      const shortest = parsed.tokens[0];
      if (shortest !== shorter) {
        searches.push(tmdbMovieSearch(shortest, parsed.year));
      }
    }
  }

  const batches = await Promise.all(searches);

  // Merge and deduplicate, preserving order of discovery
  const seen = new Set();
  let merged = [];
  for (const batch of batches) {
    for (const r of batch) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
  }

  // Apply filters
  if (excludeIds) {
    merged = merged.filter(r => !excludeIds.has(String(r.id)));
  }
  if (requirePoster) {
    merged = merged.filter(r => r.poster_path);
  }

  if (merged.length === 0) return [];

  // ── Determine if disambiguation enrichment is needed ──
  const hasContextSignal = parsed.year || parsed.tokens.length >= 2;
  const enrichCount = Math.min(hasContextSignal ? 8 : 5, merged.length);

  // Enrich top candidates with credits (parallel)
  const topSlice = merged.slice(0, enrichCount);
  const creditResults = await Promise.all(topSlice.map(r => fetchCredits(r.id)));
  topSlice.forEach((r, i) => {
    r._directors = creditResults[i].directors;
    r._writers = creditResults[i].writers;
    r._cast = creditResults[i].cast;
  });

  // Add year as number for display convenience
  merged.forEach(r => {
    r._yearNum = r.release_date ? parseInt(r.release_date.substring(0, 4)) : null;
    if (!r._directors) r._directors = [];
    if (!r._writers) r._writers = [];
    if (!r._cast) r._cast = [];
  });

  // ── Score and rerank ──
  if (hasContextSignal) {
    topSlice.forEach(r => {
      r._score = computeDisambiguationScore(r, parsed);
    });
    topSlice.sort((a, b) => b._score - a._score);

    const enrichedIds = new Set(topSlice.map(r => r.id));
    const rest = merged.filter(r => !enrichedIds.has(r.id));
    merged = [...topSlice, ...rest];
  }

  return merged.slice(0, limit);
}

/**
 * Format director string for display (first director, abbreviated if multiple).
 */
export function formatDirector(directors) {
  if (!directors || directors.length === 0) return '';
  if (directors.length === 1) return directors[0];
  return directors[0] + ' +' + (directors.length - 1);
}
