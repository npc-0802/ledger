import { MOVIES, CATEGORIES, scoreClass } from '../state.js';

let exploreActiveTab = 'directors';

function buildEntityMap(type) {
  const map = {};
  MOVIES.forEach(m => {
    let names = [];
    if (type === 'directors') names = (m.director||'').split(',').map(s=>s.trim()).filter(Boolean);
    else if (type === 'writers') names = (m.writer||'').split(',').map(s=>s.trim()).filter(Boolean);
    else if (type === 'actors') names = (m.cast||'').split(',').map(s=>s.trim()).filter(Boolean);
    else if (type === 'companies') names = (m.productionCompanies||'').split(',').map(s=>s.trim()).filter(Boolean);
    names.forEach(name => {
      if (!map[name]) map[name] = [];
      map[name].push(m);
    });
  });
  return map;
}

function getEntities(type) {
  const map = buildEntityMap(type);
  return Object.entries(map)
    .filter(([, films]) => films.length >= 2)
    .map(([name, films]) => ({
      name, films,
      avg: parseFloat((films.reduce((s,f) => s + f.total, 0) / films.length).toFixed(1)),
      catAvgs: CATEGORIES.reduce((acc, cat) => {
        const vals = films.filter(f => f.scores[cat.key] != null).map(f => f.scores[cat.key]);
        acc[cat.key] = vals.length ? parseFloat((vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(1)) : null;
        return acc;
      }, {})
    }))
    .sort((a,b) => b.avg - a.avg);
}

export function renderExploreIndex(tab) {
  if (tab) exploreActiveTab = tab;
  const tabs = ['directors','writers','actors','companies'];
  const tabLabels = { directors: 'Directors', writers: 'Writers', actors: 'Actors', companies: 'Companies' };

  const entities = getEntities(exploreActiveTab);

  document.getElementById('exploreContent').innerHTML = `
    <div style="max-width:960px">
      <h2 style="font-family:'Playfair Display',serif;font-style:italic;font-size:36px;font-weight:900;letter-spacing:-1px;margin-bottom:6px">Explore</h2>
      <p style="color:var(--dim);font-size:13px;margin-bottom:28px">Click any name to see their full filmography in your list, scored by category.</p>

      <div class="explore-tabs">
        ${tabs.map(t => `<button class="explore-tab ${t===exploreActiveTab?'active':''}" onclick="renderExploreIndex('${t}')">${tabLabels[t]}</button>`).join('')}
      </div>

      ${entities.length === 0 ? `<div style="color:var(--dim);font-style:italic;padding:40px 0">Not enough data yet — add more films to see patterns.</div>` :
        `<div class="explore-index">
          ${entities.map((e, i) => `
            <div class="explore-index-card" onclick="exploreEntity('${exploreActiveTab.slice(0,-1)}','${e.name.replace(/'/g,"\\'")}')">
              <div style="display:flex;align-items:baseline;gap:10px">
                <div class="explore-index-name">${e.name}</div>
                <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:0.5px">#${i+1} of ${entities.length}</div>
              </div>
              <div class="explore-index-meta">${e.films.length} film${e.films.length!==1?'s':''} · avg ${e.avg.toFixed(1)}</div>
            </div>`).join('')}
        </div>`}
    </div>
  `;
}

export function exploreEntity(type, name) {
  document.getElementById('filmModal').classList.remove('open');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('explore').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-btn')[1].classList.add('active');

  // scroll to top for wayfinding
  window.scrollTo(0, 0);
  document.getElementById('exploreContent').scrollTop = 0;

  const pluralType = type === 'director' ? 'directors' : type === 'writer' ? 'writers' : type === 'actor' ? 'actors' : 'companies';
  const typeLabel = type === 'director' ? 'Director' : type === 'writer' ? 'Writer' : type === 'actor' ? 'Actor' : 'Company';

  const films = MOVIES.filter(m => {
    if (type === 'director') return (m.director||'').split(',').map(s=>s.trim()).includes(name);
    if (type === 'writer') return (m.writer||'').split(',').map(s=>s.trim()).includes(name);
    if (type === 'actor') return (m.cast||'').split(',').map(s=>s.trim()).includes(name);
    if (type === 'company') return (m.productionCompanies||'').split(',').map(s=>s.trim()).includes(name);
    return false;
  }).sort((a,b) => b.total - a.total);

  if (films.length === 0) { renderExploreIndex(); return; }

  // Build full ranked entity list for ranking context
  const allEntities = getEntities(pluralType);
  const entityRank = allEntities.findIndex(e => e.name === name) + 1;
  const totalEntities = allEntities.length;
  const thisEntity = allEntities.find(e => e.name === name);

  const avg = thisEntity ? thisEntity.avg.toFixed(1) : (films.reduce((s,f) => s+f.total, 0) / films.length).toFixed(1);
  const best = films[0];

  // Per-category ranks
  const catRanks = {};
  CATEGORIES.forEach(cat => {
    const sorted = allEntities
      .filter(e => e.catAvgs[cat.key] != null)
      .sort((a,b) => b.catAvgs[cat.key] - a.catAvgs[cat.key]);
    const rank = sorted.findIndex(e => e.name === name) + 1;
    catRanks[cat.key] = rank > 0 ? { rank, total: sorted.length } : null;
  });

  const catAvgs = CATEGORIES.map(cat => {
    const vals = films.filter(f => f.scores[cat.key] != null).map(f => f.scores[cat.key]);
    return { ...cat, avg: vals.length ? parseFloat((vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(1)) : null };
  });

  const scored = catAvgs.filter(c => c.avg != null).sort((a,b) => b.avg - a.avg);
  const strength = scored[0];
  const weakness = scored[scored.length-1];

  document.getElementById('exploreContent').innerHTML = `
    <div style="max-width:960px">
      <span class="explore-back" onclick="renderExploreIndex('${pluralType}')">← Back to Explore</span>

      <div class="explore-entity-header">
        <div class="explore-entity-name">${name}</div>
        <div class="explore-entity-role">${typeLabel}</div>
      </div>

      <div class="explore-stat-row">
        <div class="explore-stat">
          <div class="explore-stat-val">${avg}</div>
          <div class="explore-stat-label">Avg score</div>
        </div>
        <div class="explore-stat">
          <div class="explore-stat-val" style="color:var(--blue)">#${entityRank} <span style="font-size:16px;color:var(--dim)">of ${totalEntities}</span></div>
          <div class="explore-stat-label">Rank among ${pluralType}</div>
        </div>
        <div class="explore-stat">
          <div class="explore-stat-val">${films.length}</div>
          <div class="explore-stat-label">Films in list</div>
        </div>
        <div class="explore-stat">
          <div class="explore-stat-val ${scoreClass(best.total)}">${best.total}</div>
          <div class="explore-stat-label">Best: ${best.title.length > 14 ? best.title.slice(0,13)+'…' : best.title}</div>
        </div>
      </div>

      ${scored.length > 0 ? `
        <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:12px">Category averages · with rank among ${pluralType}</div>
        <div class="explore-cat-breakdown">
          ${scored.map(c => {
            const cr = catRanks[c.key];
            return `
            <div class="explore-cat-cell">
              <div class="explore-cat-cell-label">${c.label}</div>
              <div class="explore-cat-cell-val ${scoreClass(c.avg)}">${c.avg.toFixed(1)}</div>
              ${cr ? `<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-top:2px">#${cr.rank} of ${cr.total}</div>` : ''}
            </div>`;
          }).join('')}
        </div>

        ${strength && weakness && strength.key !== weakness.key ? `
          <div style="background:var(--blue-pale);border:1px solid var(--rule);padding:16px 20px;margin:20px 0;font-size:13px;line-height:1.7;color:var(--ink)">
            You rate ${name}'s <strong>${strength.label.toLowerCase()}</strong> highest (avg ${strength.avg.toFixed(1)})${weakness.avg < 70 ? `, but find their <strong>${weakness.label.toLowerCase()}</strong> less compelling (avg ${weakness.avg.toFixed(1)})` : ''}.
            ${entityRank <= 3 ? ` Ranks <strong>#${entityRank}</strong> among all ${pluralType} in your list.` : ''}
          </div>` : ''}
      ` : ''}

      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin:24px 0 12px">Films</div>
      ${films.map((f,i) => {
        const poster = f.poster
          ? `<img class="film-poster-thumb" src="https://image.tmdb.org/t/p/w92${f.poster}" alt="" loading="lazy">`
          : `<div class="film-poster-none"></div>`;
        const total = f.total != null ? (Math.round(f.total * 10) / 10).toFixed(1) : '—';
        return `
        <div class="film-row" onclick="openModal(${MOVIES.indexOf(f)})" style="cursor:pointer">
          <div class="film-poster-cell">${poster}</div>
          <div class="film-rank">${i+1}</div>
          <div class="film-title-cell">
            <div class="film-title-main">${f.title}</div>
            <div class="film-title-sub">${f.year||''} · ${f.director||''}</div>
          </div>
          ${['plot','execution','acting','production','enjoyability','rewatchability','ending','uniqueness'].map(k =>
            `<div class="film-score ${f.scores[k]?scoreClass(f.scores[k]):'}'}">${f.scores[k]??'—'}</div>`
          ).join('')}
          <div class="film-total">${total}</div>
        </div>`;
      }).join('')}
    </div>
  `;
}
