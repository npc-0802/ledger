import { currentUser, setCurrentUser } from '../state.js';
import { syncToSupabase, saveUserLocally } from './supabase.js';

export function renderWatchlist() {
  const content = document.getElementById('watchlistContent');
  if (!content) return;
  const list = currentUser?.watchlist || [];

  if (list.length === 0) {
    content.innerHTML = `
      <div style="padding:80px 24px;text-align:center;max-width:440px;margin:0 auto">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:16px">— nothing queued —</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:32px;color:var(--ink);letter-spacing:-1px;margin-bottom:12px">Your queue is empty.</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--dim);font-weight:300">Tap <strong style="color:var(--ink)">＋ Watchlist</strong> on any film — in predictions, entity stubs, and friend overlaps — to save it for later.</div>
      </div>`;
    return;
  }

  content.innerHTML = `
    <div style="padding:28px 0 48px">
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:24px">${list.length} film${list.length !== 1 ? 's' : ''} queued</div>
      ${list.map((item, i) => watchlistRow(item, i)).join('')}
    </div>`;
}

function watchlistRow(item, i) {
  const poster = item.poster
    ? `<img src="https://image.tmdb.org/t/p/w92${item.poster}" style="width:40px;height:60px;object-fit:cover;flex-shrink:0" loading="lazy">`
    : `<div style="width:40px;height:60px;background:var(--rule);flex-shrink:0"></div>`;
  return `
    <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--rule)">
      ${poster}
      <div style="flex:1;min-width:0">
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:700;font-size:16px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:3px">${item.year || ''}${item.director ? ' · ' + item.director.split(',')[0] : ''}</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;align-items:center">
        <button onclick="watchlistRemove(${i})" style="font-family:'DM Mono',monospace;font-size:10px;padding:8px 10px;background:none;border:1px solid var(--rule-dark);color:var(--dim);cursor:pointer">✕</button>
        <button onclick="watchlistRate(${i})" style="font-family:'DM Mono',monospace;font-size:10px;padding:8px 14px;background:var(--action);color:white;border:none;cursor:pointer;letter-spacing:1px;text-transform:uppercase;white-space:nowrap">Rank it →</button>
      </div>
    </div>`;
}

export function addToWatchlist(item) {
  if (!currentUser) return;
  const list = currentUser.watchlist || [];
  if (list.some(w => String(w.tmdbId) === String(item.tmdbId))) {
    import('../main.js').then(({ showToast }) => showToast('Already on your watch list.'));
    return;
  }
  const updated = [{ ...item, addedAt: new Date().toISOString() }, ...list];
  setCurrentUser({ ...currentUser, watchlist: updated });
  saveUserLocally();
  syncToSupabase();
  import('../main.js').then(({ showToast }) => showToast(`${item.title} added to watch list.`));
}

window.watchlistRemove = function(index) {
  if (!currentUser) return;
  const updated = (currentUser.watchlist || []).filter((_, i) => i !== index);
  setCurrentUser({ ...currentUser, watchlist: updated });
  saveUserLocally();
  syncToSupabase();
  renderWatchlist();
};

window.watchlistRate = function(index) {
  const item = currentUser?.watchlist?.[index];
  if (!item) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('add').classList.add('active');
  document.querySelectorAll('.nav-btn, .nav-mobile-btn').forEach(b => b.classList.remove('active'));
  setTimeout(() => {
    const inp = document.getElementById('f-search');
    if (inp) {
      inp.value = item.title;
      import('./addfilm.js').then(m => m.liveSearch(item.title));
    }
  }, 100);
};
