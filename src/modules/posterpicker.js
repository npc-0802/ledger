import { searchMovieCandidates } from './tmdb-movie.js';

function closePosterPicker() {
  document.getElementById('poster-picker-overlay')?.remove();
}

export async function openPosterPicker({ title, year = null, selectedTmdbId = null, onSelect }) {
  closePosterPicker();

  const overlay = document.createElement('div');
  overlay.id = 'poster-picker-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(12,11,9,0.78);z-index:11000;display:flex;align-items:center;justify-content:center;padding:24px';

  const panel = document.createElement('div');
  panel.style.cssText = 'width:min(920px,100%);max-height:88vh;overflow:auto;background:var(--paper);border:1.5px solid var(--ink);padding:28px 28px 24px;box-sizing:border-box';
  panel.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px">
      <div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Choose the right match</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:30px;line-height:1.05;color:var(--ink)">Select the correct poster</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.6;color:var(--dim);margin-top:10px">We searched TMDB for ${title}${year ? ` (${year})` : ''}. Pick the correct match to update the poster and linked film metadata.</div>
      </div>
      <button type="button" id="poster-picker-close" style="background:none;border:none;font-size:24px;line-height:1;color:var(--dim);cursor:pointer;padding:0 4px">×</button>
    </div>
    <div id="poster-picker-results" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px"></div>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('poster-picker-close');
  if (closeBtn) closeBtn.onclick = closePosterPicker;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePosterPicker(); });

  const resultsEl = document.getElementById('poster-picker-results');
  if (!resultsEl) return;
  resultsEl.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);padding:10px 0">Loading options…</div>`;

  try {
    const results = await searchMovieCandidates(title, year);
    if (!results.length) {
      resultsEl.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);padding:10px 0">No alternate matches found.</div>`;
      return;
    }

    resultsEl.innerHTML = '';
    results.forEach(movie => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `display:flex;gap:12px;align-items:flex-start;text-align:left;background:${movie.id === selectedTmdbId ? 'var(--cream)' : 'white'};border:1px solid var(--rule);padding:12px;cursor:pointer`;
      const poster = movie.poster_path
        ? `<img src="https://image.tmdb.org/t/p/w154${movie.poster_path}" alt="" style="width:58px;height:87px;object-fit:cover;flex-shrink:0">`
        : `<div style="width:58px;height:87px;background:var(--cream);display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:8px;color:var(--dim);flex-shrink:0">NO IMG</div>`;
      const releaseYear = movie.release_date?.slice(0, 4) || '—';
      const selectedLabel = movie.id === selectedTmdbId
        ? `<div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--blue);margin-bottom:6px">Current</div>`
        : '';
      btn.innerHTML = `
        ${poster}
        <div style="min-width:0">
          ${selectedLabel}
          <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;line-height:1.1;color:var(--ink);margin-bottom:4px">${movie.title}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-bottom:8px">${releaseYear}</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.5;color:var(--dim)">${(movie.overview || 'No overview available.').slice(0, 120)}${(movie.overview || '').length > 120 ? '…' : ''}</div>
        </div>
      `;
      btn.onclick = async () => {
        closePosterPicker();
        await onSelect(movie);
      };
      resultsEl.appendChild(btn);
    });
  } catch (e) {
    resultsEl.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--red);padding:10px 0">Couldn’t load poster options.</div>`;
  }
}
