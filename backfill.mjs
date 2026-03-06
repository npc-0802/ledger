import { createClient } from '@supabase/supabase-js';

const TMDB_KEY = 'f5a446a5f70a9f6a16a8ddd052c121f2';
const SUPABASE_URL = 'https://gzuuhjjedrzeqbgxhfip.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OprjtxkrwknRf8jSZ7bYWg_GGqRiu4z';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const MOVIES = [{"title":"Eternal Sunshine of the Spotless Mind","year":2004},{"title":"In Bruges","year":2008},{"title":"Parasite","year":2019},{"title":"Children of Men","year":2006},{"title":"Synecdoche, New York","year":2008},{"title":"Lord of the Rings: The Two Towers","year":2002},{"title":"Lord of the Rings: Fellowship of the Ring","year":2001},{"title":"Arrival","year":2016},{"title":"The Truman Show","year":1998},{"title":"2001: A Space Odyssey","year":1968},{"title":"There Will Be Blood","year":2007},{"title":"Ex Machina","year":2014},{"title":"A Different Man","year":2024},{"title":"The Matrix","year":1999},{"title":"Everything Everywhere All At Once","year":2022},{"title":"Incendies","year":2010},{"title":"The Grand Budapest Hotel","year":2014},{"title":"Lord of the Rings: Return of the King","year":2003},{"title":"No Country For Old Men","year":2007},{"title":"The Shawshank Redemption","year":1994},{"title":"The Prestige","year":2006},{"title":"The Darjeeling Limited","year":2007},{"title":"Spirited Away","year":2001},{"title":"Birdman","year":2014},{"title":"Warfare","year":2025},{"title":"The Master","year":2012},{"title":"Interstellar","year":2014},{"title":"Whiplash","year":2014},{"title":"Inglourious Basterds","year":2009},{"title":"Ratatouille","year":2007},{"title":"Anomalisa","year":2015},{"title":"Primer","year":2004},{"title":"Gravity","year":2013},{"title":"Boyhood","year":2014},{"title":"Raiders of the Lost Ark","year":1981},{"title":"Indiana Jones and the Last Crusade","year":1989},{"title":"Moonrise Kingdom","year":2012},{"title":"Dune: Part 2","year":2024},{"title":"The Royal Tenenbaums","year":2001},{"title":"Enemy","year":2013},{"title":"Airplane!","year":1980},{"title":"Civil War","year":2024},{"title":"Eighth Grade","year":2018},{"title":"The Departed","year":2006},{"title":"Snowpiercer","year":2013},{"title":"The End of the Tour","year":2015},{"title":"Oldboy","year":2003},{"title":"Unforgiven","year":1992},{"title":"Borat","year":2006},{"title":"Poor Things","year":2023},{"title":"Mad Max: Fury Road","year":2015},{"title":"Gladiator","year":2000},{"title":"Moon","year":2009},{"title":"Dune: Part 1","year":2021},{"title":"Conclave","year":2024},{"title":"Battle Royale","year":2000},{"title":"Tinker, Tailor, Soldier, Spy","year":2011},{"title":"The Banshees of Inisherin","year":2022},{"title":"Boogie Nights","year":1997},{"title":"Don't Look Up","year":2021},{"title":"Mrs. Doubtfire","year":1993},{"title":"Memento","year":2000},{"title":"Anora","year":2024},{"title":"Love and Mercy","year":2014},{"title":"Four Lions","year":2010},{"title":"The Menu","year":2022},{"title":"Fargo","year":1996},{"title":"How to Train Your Dragon","year":2010},{"title":"District 9","year":2009},{"title":"Coherence","year":2013},{"title":"Edge of Tomorrow","year":2014},{"title":"Gangs of New York","year":2002},{"title":"The Wolf of Wall Street","year":2013},{"title":"Sunshine","year":2007},{"title":"Spotlight","year":2015},{"title":"Mickey 17","year":2025},{"title":"A Real Pain","year":2024},{"title":"Catch Me If You Can","year":2002},{"title":"The Big Short","year":2015},{"title":"Anchorman","year":2004},{"title":"The Goodbye Girl","year":1977},{"title":"Seven Psychopaths","year":2012},{"title":"Oppenheimer","year":2024},{"title":"Fight Club","year":1999},{"title":"Stalker","year":1979},{"title":"Lincoln","year":2012},{"title":"Friendship","year":2025},{"title":"Wonder Boys","year":2000},{"title":"The Princess Bride","year":1987},{"title":"Train to Busan","year":2016},{"title":"Elvis","year":2022},{"title":"Anchorman 2","year":2013},{"title":"Nosferatu","year":2024},{"title":"Indiana Jones and the Temple of Doom","year":1984}];

async function fetchTMDB(title, year) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  // Try exact year match first, then closest
  let match = data.results.find(r => r.release_date?.startsWith(String(year)));
  if (!match) match = data.results[0];
  return {
    poster: match.poster_path || null,
    overview: match.overview || null,
    tmdb_id: match.id || null
  };
}

async function run() {
  // Load all users from Supabase
  const { data: users, error } = await sb.from('ledger_users').select('id, username, movies');
  if (error) { console.error('Failed to load users:', error); process.exit(1); }
  console.log(`Found ${users.length} user(s)\n`);

  // Build poster/overview lookup from TMDB
  const lookup = {};
  for (const film of MOVIES) {
    process.stdout.write(`Fetching: ${film.title} (${film.year})... `);
    try {
      const result = await fetchTMDB(film.title, film.year);
      if (result && (result.poster || result.overview)) {
        lookup[`${film.title}|${film.year}`] = result;
        console.log(`✓`);
      } else {
        console.log(`✗ not found`);
      }
    } catch (e) {
      console.log(`✗ error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 100)); // rate limit
  }

  console.log(`\nTMDB lookup complete. Updating ${users.length} user(s)...\n`);

  // Update each user's movies array
  for (const user of users) {
    if (!user.movies || !Array.isArray(user.movies)) continue;
    let changed = 0;
    const updated = user.movies.map(film => {
      const key = `${film.title}|${film.year}`;
      const tmdb = lookup[key];
      if (tmdb) {
        changed++;
        return {
          ...film,
          poster: film.poster || tmdb.poster,
          overview: film.overview || tmdb.overview
        };
      }
      return film;
    });
    if (changed === 0) { console.log(`${user.username}: no changes needed`); continue; }
    const { error: updateError } = await sb.from('ledger_users').update({ movies: updated }).eq('id', user.id);
    if (updateError) console.error(`${user.username}: update failed`, updateError);
    else console.log(`${user.username}: updated ${changed} films ✓`);
  }

  console.log('\nDone!');
}

run();
