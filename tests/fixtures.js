// Shared test fixtures — inject into localStorage to bypass auth

export const TEST_USER = {
  id: 'test-00000000-0000-0000-0000-000000000001',
  username: 'testuser',
  display_name: 'Test User',
  archetype: 'Visceralist',
  archetype_secondary: 'Narrativist',
  weights: {
    plot: 2, execution: 2, acting: 2, production: 1,
    enjoyability: 5, rewatchability: 3, ending: 1, uniqueness: 1,
  },
  harmony_sensitivity: 0.3,
  email: null,
  auth_id: null,
};

// 12 films — enough to unlock Predict (≥10)
export const TEST_MOVIES = [
  { title: 'The Shawshank Redemption', year: 1994, tmdbId: 278, poster: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg', director: 'Frank Darabont', writer: 'Stephen King, Frank Darabont', cast: 'Tim Robbins, Morgan Freeman', productionCompanies: 'Castle Rock', overview: '', scores: { plot: 92, execution: 88, acting: 90, production: 82, enjoyability: 95, rewatchability: 90, ending: 95, uniqueness: 80 }, total: 90.94 },
  { title: 'Pulp Fiction', year: 1994, tmdbId: 680, poster: '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg', director: 'Quentin Tarantino', writer: 'Quentin Tarantino', cast: 'John Travolta, Samuel L. Jackson', productionCompanies: 'Miramax', overview: '', scores: { plot: 88, execution: 92, acting: 90, production: 80, enjoyability: 92, rewatchability: 88, ending: 80, uniqueness: 95 }, total: 89.65 },
  { title: 'The Dark Knight', year: 2008, tmdbId: 155, poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', director: 'Christopher Nolan', writer: 'Jonathan Nolan, Christopher Nolan', cast: 'Christian Bale, Heath Ledger', productionCompanies: 'Warner Bros.', overview: '', scores: { plot: 85, execution: 90, acting: 92, production: 88, enjoyability: 90, rewatchability: 85, ending: 82, uniqueness: 80 }, total: 87.76 },
  { title: 'Inception', year: 2010, tmdbId: 27205, poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', director: 'Christopher Nolan', writer: 'Christopher Nolan', cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt', productionCompanies: 'Warner Bros.', overview: '', scores: { plot: 88, execution: 92, acting: 80, production: 90, enjoyability: 88, rewatchability: 82, ending: 85, uniqueness: 92 }, total: 86.82 },
  { title: 'Parasite', year: 2019, tmdbId: 496243, poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', director: 'Bong Joon-ho', writer: 'Bong Joon-ho, Han Jin-won', cast: 'Song Kang-ho, Lee Sun-kyun', productionCompanies: 'Barunson E&A', overview: '', scores: { plot: 95, execution: 90, acting: 85, production: 82, enjoyability: 88, rewatchability: 80, ending: 90, uniqueness: 92 }, total: 87.06 },
  { title: 'Whiplash', year: 2014, tmdbId: 244786, poster: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg', director: 'Damien Chazelle', writer: 'Damien Chazelle', cast: 'Miles Teller, J.K. Simmons', productionCompanies: 'Bold Films', overview: '', scores: { plot: 80, execution: 88, acting: 95, production: 78, enjoyability: 90, rewatchability: 85, ending: 92, uniqueness: 85 }, total: 87.76 },
  { title: 'The Godfather', year: 1972, tmdbId: 238, poster: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', director: 'Francis Ford Coppola', writer: 'Mario Puzo, Francis Ford Coppola', cast: 'Marlon Brando, Al Pacino', productionCompanies: 'Paramount', overview: '', scores: { plot: 90, execution: 88, acting: 95, production: 85, enjoyability: 82, rewatchability: 78, ending: 88, uniqueness: 85 }, total: 84.59 },
  { title: 'Spirited Away', year: 2001, tmdbId: 129, poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', director: 'Hayao Miyazaki', writer: 'Hayao Miyazaki', cast: '', productionCompanies: 'Studio Ghibli', overview: '', scores: { plot: 82, execution: 90, acting: 78, production: 92, enjoyability: 88, rewatchability: 85, ending: 80, uniqueness: 90 }, total: 85.59 },
  { title: 'Get Out', year: 2017, tmdbId: 419430, poster: '/tFXcEccSQMf3zy7uCiqrmopQ3Ib.jpg', director: 'Jordan Peele', writer: 'Jordan Peele', cast: 'Daniel Kaluuya, Allison Williams', productionCompanies: 'Blumhouse', overview: '', scores: { plot: 88, execution: 85, acting: 82, production: 78, enjoyability: 85, rewatchability: 80, ending: 82, uniqueness: 90 }, total: 83.94 },
  { title: 'Moonlight', year: 2016, tmdbId: 376867, poster: '/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg', director: 'Barry Jenkins', writer: 'Barry Jenkins', cast: 'Mahershala Ali, Naomie Harris', productionCompanies: 'A24', overview: '', scores: { plot: 80, execution: 90, acting: 92, production: 85, enjoyability: 78, rewatchability: 72, ending: 80, uniqueness: 88 }, total: 80.47 },
  { title: 'Mad Max: Fury Road', year: 2015, tmdbId: 76341, poster: '/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg', director: 'George Miller', writer: 'George Miller, Brendan McCarthy, Nick Lathouris', cast: 'Tom Hardy, Charlize Theron', productionCompanies: 'Warner Bros.', overview: '', scores: { plot: 65, execution: 95, acting: 78, production: 95, enjoyability: 88, rewatchability: 82, ending: 75, uniqueness: 90 }, total: 83.24 },
  { title: 'Everything Everywhere All at Once', year: 2022, tmdbId: 545611, poster: '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', director: 'Daniel Kwan, Daniel Scheinert', writer: 'Daniel Kwan, Daniel Scheinert', cast: 'Michelle Yeoh, Ke Huy Quan', productionCompanies: 'A24', overview: '', scores: { plot: 78, execution: 85, acting: 88, production: 80, enjoyability: 92, rewatchability: 85, ending: 82, uniqueness: 92 }, total: 86.47 },
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
