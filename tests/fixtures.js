// Shared test fixtures — inject into localStorage to bypass auth

export const TEST_USER = {
  id: 'test-00000000-0000-0000-0000-000000000001',
  username: 'testuser',
  display_name: 'Test User',
  archetype: 'Visceralist',
  archetype_secondary: 'Narrativist',
  weights: {
    story: 2, craft: 2, performance: 2, world: 1,
    experience: 5, hold: 3, ending: 1, singularity: 1,
  },
  quiz_weights: {
    story: 2, craft: 2, performance: 2, world: 1,
    experience: 5, hold: 3, ending: 1, singularity: 1,
  },
  harmony_sensitivity: 0.3,
  email: null,
  auth_id: null,
};

// 12 films — enough to unlock Predict (≥10)
export const TEST_MOVIES = [
  { title: 'The Shawshank Redemption', year: 1994, tmdbId: 278, poster: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg', director: 'Frank Darabont', writer: 'Stephen King, Frank Darabont', cast: 'Tim Robbins, Morgan Freeman', productionCompanies: 'Castle Rock', overview: '', scores: { story: 92, craft: 88, performance: 90, world: 82, experience: 95, hold: 90, ending: 95, singularity: 80 }, total: 90.94 },
  { title: 'Pulp Fiction', year: 1994, tmdbId: 680, poster: '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg', director: 'Quentin Tarantino', writer: 'Quentin Tarantino', cast: 'John Travolta, Samuel L. Jackson', productionCompanies: 'Miramax', overview: '', scores: { story: 88, craft: 92, performance: 90, world: 80, experience: 92, hold: 88, ending: 80, singularity: 95 }, total: 89.65 },
  { title: 'The Dark Knight', year: 2008, tmdbId: 155, poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', director: 'Christopher Nolan', writer: 'Jonathan Nolan, Christopher Nolan', cast: 'Christian Bale, Heath Ledger', productionCompanies: 'Warner Bros.', overview: '', scores: { story: 85, craft: 90, performance: 92, world: 88, experience: 90, hold: 85, ending: 82, singularity: 80 }, total: 87.76 },
  { title: 'Inception', year: 2010, tmdbId: 27205, poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', director: 'Christopher Nolan', writer: 'Christopher Nolan', cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt', productionCompanies: 'Warner Bros.', overview: '', scores: { story: 88, craft: 92, performance: 80, world: 90, experience: 88, hold: 82, ending: 85, singularity: 92 }, total: 86.82 },
  { title: 'Parasite', year: 2019, tmdbId: 496243, poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', director: 'Bong Joon-ho', writer: 'Bong Joon-ho, Han Jin-won', cast: 'Song Kang-ho, Lee Sun-kyun', productionCompanies: 'Barunson E&A', overview: '', scores: { story: 95, craft: 90, performance: 85, world: 82, experience: 88, hold: 80, ending: 90, singularity: 92 }, total: 87.06 },
  { title: 'Whiplash', year: 2014, tmdbId: 244786, poster: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg', director: 'Damien Chazelle', writer: 'Damien Chazelle', cast: 'Miles Teller, J.K. Simmons', productionCompanies: 'Bold Films', overview: '', scores: { story: 80, craft: 88, performance: 95, world: 78, experience: 90, hold: 85, ending: 92, singularity: 85 }, total: 87.76 },
  { title: 'The Godfather', year: 1972, tmdbId: 238, poster: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', director: 'Francis Ford Coppola', writer: 'Mario Puzo, Francis Ford Coppola', cast: 'Marlon Brando, Al Pacino', productionCompanies: 'Paramount', overview: '', scores: { story: 90, craft: 88, performance: 95, world: 85, experience: 82, hold: 78, ending: 88, singularity: 85 }, total: 84.59 },
  { title: 'Spirited Away', year: 2001, tmdbId: 129, poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', director: 'Hayao Miyazaki', writer: 'Hayao Miyazaki', cast: '', productionCompanies: 'Studio Ghibli', overview: '', scores: { story: 82, craft: 90, performance: 78, world: 92, experience: 88, hold: 85, ending: 80, singularity: 90 }, total: 85.59 },
  { title: 'Get Out', year: 2017, tmdbId: 419430, poster: '/tFXcEccSQMf3zy7uCiqrmopQ3Ib.jpg', director: 'Jordan Peele', writer: 'Jordan Peele', cast: 'Daniel Kaluuya, Allison Williams', productionCompanies: 'Blumhouse', overview: '', scores: { story: 88, craft: 85, performance: 82, world: 78, experience: 85, hold: 80, ending: 82, singularity: 90 }, total: 83.94 },
  { title: 'Moonlight', year: 2016, tmdbId: 376867, poster: '/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg', director: 'Barry Jenkins', writer: 'Barry Jenkins', cast: 'Mahershala Ali, Naomie Harris', productionCompanies: 'A24', overview: '', scores: { story: 80, craft: 90, performance: 92, world: 85, experience: 78, hold: 72, ending: 80, singularity: 88 }, total: 80.47 },
  { title: 'Mad Max: Fury Road', year: 2015, tmdbId: 76341, poster: '/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg', director: 'George Miller', writer: 'George Miller, Brendan McCarthy, Nick Lathouris', cast: 'Tom Hardy, Charlize Theron', productionCompanies: 'Warner Bros.', overview: '', scores: { story: 65, craft: 95, performance: 78, world: 95, experience: 88, hold: 82, ending: 75, singularity: 90 }, total: 83.24 },
  { title: 'Everything Everywhere All at Once', year: 2022, tmdbId: 545611, poster: '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', director: 'Daniel Kwan, Daniel Scheinert', writer: 'Daniel Kwan, Daniel Scheinert', cast: 'Michelle Yeoh, Ke Huy Quan', productionCompanies: 'A24', overview: '', scores: { story: 78, craft: 85, performance: 88, world: 80, experience: 92, hold: 85, ending: 82, singularity: 92 }, total: 86.47 },
];

/**
 * Inject test user + movies into localStorage so the app boots as if logged in.
 * Call this in page.addInitScript() before navigating.
 */
export function injectAuthState(user = TEST_USER, movies = TEST_MOVIES) {
  return `
    localStorage.setItem('palatemap_user', JSON.stringify(${JSON.stringify(user)}));
    localStorage.setItem('palatemap_films_v1', JSON.stringify(${JSON.stringify(movies)}));
  `;
}

/**
 * Block Supabase API calls so the app doesn't hang/error on auth checks.
 * Routes intercept the actual Supabase domain (not the local JS imports).
 */
export async function mockSupabase(page) {
  await page.route('https://*.supabase.co/**', route => {
    const url = route.request().url();
    const headers = route.request().headers();

    if (url.includes('/auth/')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { session: null, user: null }, error: null }),
      });
    } else {
      // PostgREST: if Accept header has "vnd.pgrst.object" it's a .single() call
      // Return 406 to trigger error path (no matching row) so local data isn't overwritten
      const accept = headers['accept'] || '';
      if (accept.includes('vnd.pgrst.object')) {
        route.fulfill({
          status: 406,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not found', details: '', hint: '', code: 'PGRST116' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    }
  });
}
