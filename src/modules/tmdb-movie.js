const TMDB_KEY = 'f5a446a5f70a9f6a16a8ddd052c121f2';
const TMDB = 'https://api.themoviedb.org/3';

export async function searchMovieCandidates(query, year = null, limit = 12) {
  const runSearch = async (withYear) => {
    const url = new URL(`${TMDB}/search/movie`);
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('query', query);
    url.searchParams.set('include_adult', 'false');
    if (withYear && year) url.searchParams.set('year', String(year));
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  };

  let results = await runSearch(true);
  if (!results.length && year) results = await runSearch(false);
  return results.slice(0, limit);
}

export async function fetchTmdbMovieBundle(tmdbId) {
  const [detailRes, creditsRes] = await Promise.all([
    fetch(`${TMDB}/movie/${tmdbId}?api_key=${TMDB_KEY}`),
    fetch(`${TMDB}/movie/${tmdbId}/credits?api_key=${TMDB_KEY}`)
  ]);
  const detail = await detailRes.json();
  const credits = await creditsRes.json();

  const year = detail.release_date ? parseInt(detail.release_date.slice(0, 4)) : null;
  const posterUrl = detail.poster_path ? `https://image.tmdb.org/t/p/w185${detail.poster_path}` : null;
  const directors = (credits.crew || []).filter(c => c.job === 'Director').map(c => c.name);
  const writers = (credits.crew || [])
    .filter(c => ['Screenplay', 'Writer', 'Story', 'Original Story', 'Novel'].includes(c.job))
    .map(c => c.name)
    .filter((v, i, a) => a.indexOf(v) === i);
  const allCast = credits.cast || [];
  const top8Cast = allCast.slice(0, 8);
  const companies = detail.production_companies || [];

  return { detail, credits, year, posterUrl, directors, writers, allCast, top8Cast, companies };
}
