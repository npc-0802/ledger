import { MOVIES, CATEGORIES } from '../state.js';

export function renderAnalysis() {
  const directors = {}, actors = {}, years = {};
  MOVIES.forEach(m => {
    m.director.split(',').forEach(d => {
      d = d.trim();
      if (d) { if (!directors[d]) directors[d] = []; directors[d].push(m.total); }
    });
    m.cast.split(',').forEach(a => {
      a = a.trim();
      if (a) { if (!actors[a]) actors[a] = []; actors[a].push(m.total); }
    });
    if (m.year) { if (!years[m.year]) years[m.year] = []; years[m.year].push(m.total); }
  });

  const avg = arr => Math.round(arr.reduce((s,v) => s+v, 0) / arr.length * 100) / 100;

  const topDirs = Object.entries(directors).filter(([,v]) => v.length >= 2)
    .map(([k,v]) => ({name:k, avg:avg(v), count:v.length}))
    .sort((a,b) => b.avg - a.avg).slice(0, 10);

  const topActors = Object.entries(actors).filter(([,v]) => v.length >= 2)
    .map(([k,v]) => ({name:k, avg:avg(v), count:v.length}))
    .sort((a,b) => b.avg - a.avg).slice(0, 10);

  const topYears = Object.entries(years).filter(([,v]) => v.length >= 2)
    .map(([k,v]) => ({name:k, avg:avg(v), count:v.length}))
    .sort((a,b) => b.avg - a.avg).slice(0, 10);

  const catAvgs = CATEGORIES.map(cat => {
    const vals = MOVIES.map(m => m.scores[cat.key]).filter(v => v != null);
    return { ...cat, avg: avg(vals) };
  });

  function scoreBadgeColor(v) {
    if (v >= 90) return '#C4922A';
    if (v >= 80) return '#1F4A2A';
    if (v >= 70) return '#4A5830';
    if (v >= 60) return '#6B4820';
    return 'rgba(12,11,9,0.65)';
  }

  function entityRows(list) {
    if (!list.length) return `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);padding:16px 0">Not enough data yet.</div>`;
    return list.map((e, i) => {
      const bg = scoreBadgeColor(e.avg);
      return `
        <div style="display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid var(--rule)">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--rule-dark);width:20px;flex-shrink:0;text-align:center">${i + 1}</div>
          <div style="flex:1">
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;font-weight:700;line-height:1.2;color:var(--ink)">${e.name}</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-top:2px">${e.count} film${e.count !== 1 ? 's' : ''}</div>
          </div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:17px;color:white;padding:3px 10px 2px;background:${bg};border-radius:4px;flex-shrink:0">${e.avg}</div>
        </div>`;
    }).join('');
  }

  document.getElementById('analysisContent').innerHTML = `
    <div style="max-width:900px">

      <!-- HEADER -->
      <div style="margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid var(--ink)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px">taste intelligence</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(32px,4vw,48px);line-height:1;color:var(--ink);letter-spacing:-1px;margin-bottom:8px">Your taste, decoded.</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:0.5px">${MOVIES.length} film${MOVIES.length !== 1 ? 's' : ''} · weighted scoring</div>
      </div>

      <!-- CATEGORY AVERAGES -->
      <div style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--rule)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:20px">Category averages · all films</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 40px">
          ${catAvgs.filter(c => c.avg != null && !isNaN(c.avg)).map(c => {
            const pct = Math.round(c.avg);
            const bg = scoreBadgeColor(c.avg);
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:6px 0">
              <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);width:88px;flex-shrink:0">${c.label}</div>
              <div style="flex:1;height:2px;background:var(--rule);position:relative;overflow:hidden">
                <div style="position:absolute;top:0;left:0;height:100%;background:${bg};width:${pct}%"></div>
              </div>
              <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:var(--ink);width:36px;text-align:right;letter-spacing:-0.5px">${c.avg}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- ENTITY CARDS -->
      <div class="analysis-grid">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:4px;padding-bottom:12px;border-bottom:2px solid var(--ink)">Directors</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-bottom:12px;padding-top:4px">2+ films · by avg score</div>
          ${entityRows(topDirs)}
        </div>
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:4px;padding-bottom:12px;border-bottom:2px solid var(--ink)">Actors</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-bottom:12px;padding-top:4px">2+ films · by avg score</div>
          ${entityRows(topActors)}
        </div>
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:4px;padding-bottom:12px;border-bottom:2px solid var(--ink)">Years</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-bottom:12px;padding-top:4px">2+ films · by avg score</div>
          ${entityRows(topYears)}
        </div>
      </div>

    </div>
  `;
}
