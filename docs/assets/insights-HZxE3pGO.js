import{C as p,M as y,c as S}from"./index-DGujDO-s.js";const j="https://ledger-proxy.noahparikhcott.workers.dev",C="palate_insights_v1";function f(){try{return JSON.parse(localStorage.getItem(C)||"{}")}catch{return{}}}function m(e){try{localStorage.setItem(C,JSON.stringify(e))}catch{}}function x(e,t,s){return!e||Date.now()-e.ts>720*60*60*1e3||Math.abs((e.filmCount||0)-t)>=2||e.scoreKey!==s}function I(){const e={};return p.forEach(t=>{const s=y.filter(n=>n.scores[t.key]!=null).map(n=>n.scores[t.key]);e[t.key]=s.length?Math.round(s.reduce((n,c)=>n+c,0)/s.length):null}),e}async function E(e,t){return((await(await fetch(j,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:e,messages:[{role:"user",content:t}]})})).json()).content?.[0]?.text||"").trim()}async function O(e,t,s){const n=f(),c=`${e}::${t}`,l=s.length,d=Math.round(s.reduce((r,h)=>r+(h.total||0),0)/l),g=`${d}:${s.map(r=>r.total).sort().join(",")}`;if(!x(n[c],l,g))return n[c].text;const w=I(),v=p.map(r=>`${r.label} ${w[r.key]??"—"}`).join(", "),k=S?.archetype||"unknown",$=[...s].sort((r,h)=>h.total-r.total).map(r=>{const h=p.map(b=>`${b.label.toLowerCase()}=${r.scores[b.key]??"—"}`).join(", ");return`- ${r.title} (${r.year||"?"}): total=${r.total}, ${h}`}).join(`
`),a=e==="year"?`the year ${t}`:`${e} ${t}`,o=`You are a film taste analyst writing short personal insights for a taste-tracking app called Palate Map. Write exactly 2–3 sentences. Second person only ("you", "your"). No preamble, no hedging. Be direct and specific — always cite actual film titles and scores. Never describe the entity generically; only describe what THIS user's scores reveal about their relationship with the work.`,i=`User archetype: ${k}
User's category averages across all ${y.length} films: ${v}

Entity: ${a}
Films this user has rated: ${l} | Average score: ${d}

${$}

Write 2–3 sentences in second person about what this user's scoring patterns reveal about what they value in ${a}'s work. Be precise — reference film titles, specific scores, category highs/lows.`,u=await E(o,i);return n[c]={text:u,filmCount:l,scoreKey:g,ts:Date.now()},m(n),u}async function N(e){const t=f(),s=`film::${e.title}`,n=p.map(a=>e.scores[a.key]??0).join(",");if(!x(t[s],1,n))return t[s].text;const c=I(),d=[...y].sort((a,o)=>o.total-a.total).findIndex(a=>a.title===e.title)+1,g=S?.archetype||"unknown",w=p.map(a=>{const o=e.scores[a.key]??null,i=c[a.key]??null;if(o==null)return null;const u=i!=null?o-i>0?`+${o-i}`:`${o-i}`:"";return`  ${a.label}: ${o} (your avg ${i??"—"}${u?", "+u:""})`}).filter(Boolean).join(`
`),v=`You are a film taste analyst writing short personal score insights for a taste-tracking app called Palate Map. Write exactly 2–3 sentences. Second person only ("you", "your"). No preamble. Be direct — reference specific category scores and how they compare to the user's averages. Explain the score pattern, not the film in general.`,k=`User archetype: ${g}
Total films rated: ${y.length}

Film: ${e.title} (${e.year||"?"}) — directed by ${e.director||"unknown"}
Total score: ${e.total} — ranked #${d} of ${y.length}

Category scores vs your averages:
${w}

Write 2–3 sentences in second person about what this scoring pattern reveals about how this user experienced ${e.title}. What stood out (scored above their avg)? What fell short? Make it feel personal and specific.`,$=await E(v,k);return t[s]={text:$,filmCount:1,scoreKey:n,ts:Date.now()},m(t),$}function P(e,t){const s=f();delete s[`${e}::${t}`],m(s)}function T(e){const t=f();delete t[`film::${e}`],m(t)}export{O as getEntityInsight,N as getFilmInsight,T as invalidateFilmInsight,P as invalidateInsight};
