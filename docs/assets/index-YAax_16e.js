(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function o(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=o(s);fetch(s.href,n)}})();const w=[{key:"plot",label:"Plot",weight:3,question:"How strong, original, and well-constructed is the story?"},{key:"execution",label:"Execution",weight:3,question:"Direction, cinematography, pacing — how well is it made?"},{key:"acting",label:"Acting",weight:2,question:"How effective is the overall performance?"},{key:"production",label:"Production",weight:1,question:"Score, production design, costume — the craft around the film."},{key:"enjoyability",label:"Enjoyability",weight:4,question:"The most honest question: how much did you actually enjoy it?"},{key:"rewatchability",label:"Rewatchability",weight:1,question:"Would you sit down and watch this again? How eagerly?"},{key:"ending",label:"Ending",weight:1,question:"How satisfying, earned, and well-executed is the conclusion?"},{key:"uniqueness",label:"Uniqueness",weight:2,question:"Does this feel genuinely singular? Could only this film exist this way?"}];let y=[],x=null;function fe(e){x=e}function ye(e){y.length=0,e.forEach(t=>y.push(t))}const bt=[[90,"An all-time favorite"],[85,"Really quite exceptional"],[80,"Excellent"],[75,"Well above average"],[70,"Great"],[65,"Very good"],[60,"A cut above"],[55,"Good"],[50,"Solid"],[45,"Not bad"],[40,"Sub-par"],[35,"Multiple flaws"],[30,"Poor"],[25,"Bad"],[20,"Wouldn't watch by choice"],[15,"So bad I stopped watching"],[10,"Disgusting"],[2,"Insulting"],[0,"Unwatchable"]];function I(e){const t=[];let o=0;for(;o<e.length;)!e[o].includes(" ")&&e[o+1]&&!e[o+1].includes(" ")?(t.push(e[o]+" "+e[o+1]),o+=2):(t.push(e[o]),o++);return t}function V(e){if(e===100)return"No better exists";if(e===1)return"No worse exists";for(const[t,o]of bt)if(e>=t)return o;return"Unwatchable"}function J(e){let t=0,o=0;for(const i of w)e[i.key]!=null&&(t+=e[i.key]*i.weight,o+=i.weight);return o>0?Math.round(t/o*100)/100:0}function re(){y.forEach(e=>{e.total=J(e.scores)})}function G(e){return e>=90?"s90":e>=80?"s80":e>=70?"s70":e>=60?"s60":e>=50?"s50":e>=40?"s40":"s30"}function le(){if(!x||!x.weights)return;const e=x.weights;w.forEach(t=>{e[t.key]!=null&&(t.weight=e[t.key])}),re()}let L={key:"total",dir:"desc"},Se="grid";const wt=[{key:"total",label:"Total"},{key:"plot",label:"Plot"},{key:"execution",label:"Execution"},{key:"acting",label:"Acting"},{key:"production",label:"Production"},{key:"enjoyability",label:"Enjoyability"},{key:"rewatchability",label:"Rewatchability"},{key:"ending",label:"Ending"},{key:"uniqueness",label:"Uniqueness"}];function kt(e){return e==null?"badge-dim":e>=90?"badge-gold":e>=80?"badge-green":e>=70?"badge-olive":e>=60?"badge-amber":"badge-dim"}function $t(){const{key:e,dir:t}=L;return e==="rank"||e==="total"?[...y].sort((o,i)=>t==="desc"?i.total-o.total:o.total-i.total):e==="title"?[...y].sort((o,i)=>t==="desc"?i.title.localeCompare(o.title):o.title.localeCompare(i.title)):[...y].sort((o,i)=>t==="desc"?(i.scores[e]||0)-(o.scores[e]||0):(o.scores[e]||0)-(i.scores[e]||0))}function Ne(e){Se=e,q()}function He(e){L.key===e?L.dir=L.dir==="desc"?"asc":"desc":(L.key=e,L.dir="desc"),document.querySelectorAll(".sort-arrow").forEach(o=>o.classList.remove("active-sort"));const t=document.getElementById("sort-"+e+"-arrow")||document.getElementById("sort-"+e);if(t){const o=t.querySelector?t.querySelector(".sort-arrow"):t;o&&(o.classList.add("active-sort"),o.textContent=L.dir==="desc"?"↓":"↑")}q()}function q(){const e=document.getElementById("filmList"),t=document.getElementById("rankings"),o=document.getElementById("rankings-controls");if(y.length===0){t.classList.add("empty"),t.classList.remove("grid-mode"),document.getElementById("mastheadCount").textContent="0 films ranked",o&&(o.innerHTML=""),e.innerHTML=`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:80px 24px 40px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:28px">palate map · film</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(32px,5vw,52px);line-height:1.1;color:var(--ink);margin-bottom:20px;letter-spacing:-1px">Start with one you love.</div>
        <p style="font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.7;color:var(--dim);max-width:420px;margin:0 0 40px;font-weight:300">Search any title — we'll pull the cast, crew, and details. You score it, category by category.</p>
        <button onclick="document.querySelector('.nav-btn.action-tab').click()" style="font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;background:var(--action);color:white;border:none;padding:18px 48px;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Rate your first film →</button>
      </div>
    `;return}t.classList.remove("empty"),document.getElementById("mastheadCount").textContent=y.length+" films ranked";const i=$t();Se==="grid"?Mt(i,e,o,t):Et(i,e,o,t)}function Fe(e){const t=L.key;return`<div class="rankings-toolbar">
    ${Se==="grid"?`
    <div class="sort-pills">
      ${wt.map(i=>`<button class="sort-pill${t===i.key?" active":""}" onclick="sortBy('${i.key}')">${i.label}</button>`).join("")}
    </div>`:"<div></div>"}
    <div class="view-toggle">
      <button class="view-btn${e==="grid"?" active":""}" onclick="setViewMode('grid')" title="Grid view">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0" y="0" width="6" height="6" fill="currentColor"/><rect x="8" y="0" width="6" height="6" fill="currentColor"/><rect x="0" y="8" width="6" height="6" fill="currentColor"/><rect x="8" y="8" width="6" height="6" fill="currentColor"/></svg>
      </button>
      <button class="view-btn${e==="table"?" active":""}" onclick="setViewMode('table')" title="Table view">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0" y="1" width="14" height="2" fill="currentColor"/><rect x="0" y="6" width="14" height="2" fill="currentColor"/><rect x="0" y="11" width="14" height="2" fill="currentColor"/></svg>
      </button>
    </div>
  </div>`}function Mt(e,t,o,i){i.classList.add("grid-mode"),o&&(o.innerHTML=Fe("grid"));const s=["total","rank","title"].includes(L.key)?"total":L.key,n=[...y].sort((r,d)=>d.total-r.total),a=new Map(n.map((r,d)=>[r.title,d+1]));t.innerHTML=`<div class="film-grid">
    ${e.map(r=>{const d=s==="total"?r.total:r.scores?.[s]??null,c=d!=null?s==="total"?(Math.round(d*10)/10).toFixed(1):d:"—",p=kt(d),m=r.poster?`<img class="film-card-poster" src="https://image.tmdb.org/t/p/w342${r.poster}" alt="" loading="lazy">`:'<div class="film-card-poster-none"></div>';return`<div class="film-card" onclick="openModal(${y.indexOf(r)})">
        <div class="film-card-poster-wrap">
          ${m}
          <div class="film-card-rank">${a.get(r.title)}</div>
          <div class="film-card-score ${p}">${c}</div>
        </div>
        <div class="film-card-meta">
          <div class="film-card-title">${r.title}</div>
          <div class="film-card-sub">${r.year||""}${r.director?" · "+r.director.split(",")[0]:""}</div>
        </div>
      </div>`}).join("")}
  </div>`}function Et(e,t,o,i){i.classList.remove("grid-mode"),o&&(o.innerHTML=Fe("table"));const s=[...y].sort((a,r)=>r.total-a.total),n=new Map(s.map((a,r)=>[a.title,r+1]));t.innerHTML=e.map(a=>{const r=a.scores,d=n.get(a.title),c=a.total!=null?(Math.round(a.total*10)/10).toFixed(1):"—",p=a.poster?`<img class="film-poster-thumb" src="https://image.tmdb.org/t/p/w92${a.poster}" alt="" loading="lazy">`:'<div class="film-poster-none"></div>';return`<div class="film-row" onclick="openModal(${y.indexOf(a)})">
      <div class="film-poster-cell">${p}</div>
      <div class="film-rank">${d}</div>
      <div class="film-title-cell">
        <div class="film-title-main">${a.title}</div>
        <div class="film-title-sub">${a.year||""}${a.director?" · "+a.director.split(",")[0]:""}</div>
      </div>
      ${["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"].map(m=>`<div class="film-score ${r[m]?G(r[m]):""}">${r[m]??"—"}</div>`).join("")}
      <div class="film-total">${c}</div>
    </div>`}).join("")}const St=Object.freeze(Object.defineProperty({__proto__:null,renderRankings:q,setViewMode:Ne,sortBy:He},Symbol.toStringTag,{value:"Module"})),It="modulepreload",Dt=function(e){return"/"+e},je={},D=function(t,o,i){let s=Promise.resolve();if(o&&o.length>0){let d=function(c){return Promise.all(c.map(p=>Promise.resolve(p).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),r=a?.nonce||a?.getAttribute("nonce");s=d(o.map(c=>{if(c=Dt(c),c in je)return;je[c]=!0;const p=c.endsWith(".css"),m=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${m}`))return;const b=document.createElement("link");if(b.rel=p?"stylesheet":It,p||(b.as="script"),b.crossOrigin="",b.href=c,r&&b.setAttribute("nonce",r),document.head.appendChild(b),p)return new Promise((g,l)=>{b.addEventListener("load",g),b.addEventListener("error",()=>l(new Error(`Unable to preload CSS for ${c}`)))})}))}function n(a){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=a,window.dispatchEvent(r),!r.defaultPrevented)throw a}return s.then(a=>{for(const r of a||[])r.status==="rejected"&&n(r.reason);return t().catch(n)})},Pe="palate_migrations_v1";function _t(){let e;try{e=JSON.parse(localStorage.getItem(Pe)||"{}")}catch{e={}}if(!e.fix_split_names){let t=0;y.forEach(o=>{const i=I((o.cast||"").split(",").map(n=>n.trim()).filter(Boolean)).join(", ");i!==(o.cast||"")&&(o.cast=i,t++);const s=I((o.productionCompanies||"").split(",").map(n=>n.trim()).filter(Boolean)).join(", ");s!==(o.productionCompanies||"")&&(o.productionCompanies=s,t++)}),t>0&&(U(),console.log(`Migration fix_split_names: repaired ${t} fields.`)),e.fix_split_names=!0;try{localStorage.setItem(Pe,JSON.stringify(e))}catch{}}}const Ue="filmRankings_v1";function U(){try{localStorage.setItem(Ue,JSON.stringify(y))}catch(e){console.warn("localStorage save failed:",e)}x&&(clearTimeout(U._syncTimer),U._syncTimer=setTimeout(()=>{D(()=>Promise.resolve().then(()=>Ve),void 0).then(e=>e.syncToSupabase())},2e3))}function Ct(){try{const e=localStorage.getItem(Ue);if(!e)return;const t=JSON.parse(e);if(!Array.isArray(t)||t.length===0)return;ye(t),console.log(`Loaded ${y.length} films from localStorage`)}catch(e){console.warn("localStorage load failed:",e)}}const Bt="https://gzuuhjjedrzeqbgxhfip.supabase.co",Tt="sb_publishable_OprjtxkrwknRf8jSZ7bYWg_GGqRiu4z",ue=window.supabase.createClient(Bt,Tt);async function Ie(){const e=x;if(!e)return;const{setCloudStatus:t}=await D(async()=>{const{setCloudStatus:o}=await Promise.resolve().then(()=>ee);return{setCloudStatus:o}},void 0);t("syncing");try{const{error:o}=await ue.from("ledger_users").upsert({id:e.id,username:e.username,display_name:e.display_name,archetype:e.archetype,archetype_secondary:e.archetype_secondary,weights:e.weights,harmony_sensitivity:e.harmony_sensitivity||.3,movies:y,updated_at:new Date().toISOString()},{onConflict:"id"});if(o)throw o;t("synced"),ce()}catch(o){console.warn("Supabase sync error:",JSON.stringify(o)),t("error")}}async function We(e){const{setCloudStatus:t,updateMastheadProfile:o,updateStorageStatus:i}=await D(async()=>{const{setCloudStatus:n,updateMastheadProfile:a,updateStorageStatus:r}=await Promise.resolve().then(()=>ee);return{setCloudStatus:n,updateMastheadProfile:a,updateStorageStatus:r}},void 0),{renderRankings:s}=await D(async()=>{const{renderRankings:n}=await Promise.resolve().then(()=>St);return{renderRankings:n}},void 0);t("syncing");try{const{data:n,error:a}=await ue.from("ledger_users").select("*").eq("id",e).single();if(a)throw a;if(n){if(fe({id:n.id,username:n.username,display_name:n.display_name,archetype:n.archetype,archetype_secondary:n.archetype_secondary,weights:n.weights,harmony_sensitivity:n.harmony_sensitivity}),n.movies&&Array.isArray(n.movies)&&n.movies.length>=y.length){const r=n.movies.map(d=>({...d,cast:I((d.cast||"").split(",").map(c=>c.trim()).filter(Boolean)).join(", "),productionCompanies:I((d.productionCompanies||"").split(",").map(c=>c.trim()).filter(Boolean)).join(", ")}));ye(r)}ce(),le(),t("synced"),o(),s(),i()}}catch(n){console.warn("Supabase load error:",n),t("error")}}function ce(){try{localStorage.setItem("ledger_user",JSON.stringify(x))}catch{}}function Ye(){try{const e=localStorage.getItem("ledger_user");e&&fe(JSON.parse(e))}catch{}}const Ve=Object.freeze(Object.defineProperty({__proto__:null,loadFromSupabase:We,loadUserLocally:Ye,saveUserLocally:ce,sb:ue,syncToSupabase:Ie},Symbol.toStringTag,{value:"Module"})),zt=[[90,"All-time favorite"],[85,"Really exceptional"],[80,"Excellent"],[75,"Well above average"],[70,"Great"],[65,"Very good"],[60,"A cut above"],[55,"Good"],[50,"Solid"],[45,"Not bad"],[40,"Sub-par"],[35,"Multiple flaws"],[30,"Poor"],[25,"Bad"],[20,"Wouldn't watch"],[0,"Unwatchable"]];function be(e){for(const[t,o]of zt)if(e>=t)return o;return"Unwatchable"}let ge=null,B=!1,O={};function At(e){ge=e,B=!1,O={},ve()}function ve(){const e=ge,t=y[e],o=[...y].sort((l,u)=>u.total-l.total),i=o.indexOf(t)+1;o.filter(l=>l!==t&&Math.abs(l.total-t.total)<6).slice(0,5);const s={};w.forEach(l=>{const u=[...y].sort((v,M)=>(M.scores[l.key]||0)-(v.scores[l.key]||0));s[l.key]=u.indexOf(t)+1});const n=(l,u,v)=>`<span class="modal-meta-chip" onclick="exploreEntity('${u}','${v.replace(/'/g,"'")}')">${l}</span>`,a=I((t.director||"").split(",").map(l=>l.trim()).filter(Boolean)).map(l=>n(l,"director",l)).join(""),r=I((t.writer||"").split(",").map(l=>l.trim()).filter(Boolean)).map(l=>n(l,"writer",l)).join(""),d=I((t.cast||"").split(",").map(l=>l.trim()).filter(Boolean)).map(l=>n(l,"actor",l)).join(""),c=I((t.productionCompanies||"").split(",").map(l=>l.trim()).filter(Boolean)).map(l=>n(l,"company",l)).join(""),p=t.poster?`<div class="dark-grid" style="position:relative;display:flex;align-items:stretch;background:var(--surface-dark);margin:-40px -40px 28px;padding:28px 32px">
         <button onclick="closeModal()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--on-dark-dim);line-height:1;padding:4px 8px;transition:color 0.15s" onmouseover="this.style.color='var(--on-dark)'" onmouseout="this.style.color='var(--on-dark-dim)'">×</button>
         <img style="width:100px;height:150px;object-fit:cover;flex-shrink:0;display:block" src="https://image.tmdb.org/t/p/w342${t.poster}" alt="">
         <div style="flex:1;padding:0 40px 0 20px;display:flex;flex-direction:column;justify-content:flex-end">
           <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">Rank #${i} of ${y.length}</div>
           <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(20px,3.5vw,30px);line-height:1.1;color:var(--on-dark);letter-spacing:-0.5px;margin-bottom:8px">${t.title}</div>
           <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim)">${t.year||""}</div>
         </div>
       </div>`:`<div class="dark-grid" style="position:relative;background:var(--surface-dark);margin:-40px -40px 28px;padding:32px 40px 28px">
         <button onclick="closeModal()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--on-dark-dim);line-height:1;padding:4px 8px">×</button>
         <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">Rank #${i} of ${y.length}</div>
         <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(20px,3.5vw,30px);line-height:1.1;color:var(--on-dark);letter-spacing:-0.5px;margin-bottom:8px">${t.title}</div>
         <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim)">${t.year||""}</div>
       </div>`,m=B?O:t.scores,b=B?J(O):t.total,g=w.map(l=>{const u=m[l.key],v=s[l.key];return B?`<div class="breakdown-row" style="align-items:center;gap:12px">
        <div class="breakdown-cat">${l.label}</div>
        <div class="breakdown-bar-wrap" style="flex:1">
          <input type="range" min="1" max="100" value="${u||50}"
            style="width:100%;accent-color:var(--blue);cursor:pointer"
            oninput="modalUpdateScore('${l.key}', this.value)">
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;min-width:60px">
          <div class="breakdown-val ${G(u||50)}" id="modal-edit-val-${l.key}">${u||50}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-align:right;margin-top:2px;white-space:nowrap" id="modal-edit-lbl-${l.key}">${be(u||50)}</div>
        </div>
        <div class="breakdown-wt">×${l.weight}</div>
      </div>`:`<div class="breakdown-row">
      <div class="breakdown-cat">${l.label}</div>
      <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:${u||0}%"></div><div class="bar-tick" style="left:25%"></div><div class="bar-tick" style="left:50%"></div><div class="bar-tick" style="left:75%"></div></div>
      <div class="breakdown-val ${u?G(u):""}">${u??"—"}</div>
      <div class="breakdown-wt">×${l.weight}</div>
      <div class="modal-cat-rank">#${v}</div>
    </div>`}).join("");document.getElementById("modalContent").innerHTML=`
    ${p}
    ${t.overview?`<div class="modal-overview">${t.overview}</div>`:""}
    <div style="margin-bottom:20px">
      ${a?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Dir.</span><div style="display:flex;flex-wrap:wrap;gap:4px">${a}</div></div>`:""}
      ${r?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Wri.</span><div style="display:flex;flex-wrap:wrap;gap:4px">${r}</div></div>`:""}
      ${d?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Cast</span><div style="display:flex;flex-wrap:wrap;gap:4px">${d}</div></div>`:""}
      ${c?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Prod.</span><div style="display:flex;flex-wrap:wrap;gap:4px">${c}</div></div>`:""}
    </div>
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
      <span style="font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--blue);letter-spacing:-2px" id="modal-total-display">${b}</span>
      <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)" id="modal-total-label">${V(b)}</span>
    </div>
    ${B?"":`<div id="modal-insight" style="margin-bottom:20px">
      <div class="insight-loading">
        <div class="insight-loading-label">Analysing your score <div class="insight-loading-dots"><span></span><span></span><span></span></div></div>
        <div class="insight-skeleton"></div>
        <div class="insight-skeleton s2"></div>
        <div class="insight-skeleton s3"></div>
      </div>
    </div>`}
    <div style="margin-bottom:20px">
      ${B?`<button onclick="modalSaveScores()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:var(--blue);color:white;border:none;padding:8px 18px;cursor:pointer;margin-right:8px">Save scores</button>
           <button onclick="modalCancelEdit()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:none;color:var(--dim);border:1px solid var(--rule);padding:8px 18px;cursor:pointer">Cancel</button>`:`<button onclick="modalEnterEdit()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:none;color:var(--dim);border:1px solid var(--rule);padding:6px 14px;cursor:pointer">Edit scores</button>`}
    </div>
    <div>${g}</div>
    ${B?"":(()=>{const l=[];for(let u=-2;u<=2;u++){const v=i+u;v<1||v>o.length||l.push({film:o[v-1],slotRank:v})}return l.length?`<div class="compare-section">
        <div class="compare-title">Nearby in the rankings</div>
        ${l.map(({film:u,slotRank:v})=>{const M=u===t,E=(Math.round(u.total*10)/10).toFixed(1);return M?`<div style="display:flex;align-items:center;gap:12px;padding:9px 12px;background:var(--ink);margin:2px 0">
              <span style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.45);min-width:20px;text-align:right">${v}</span>
              <span style="font-family:'Playfair Display',serif;font-weight:700;font-style:italic;flex:1;color:white;font-size:14px">${u.title} <span style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.5)">${u.year||""}</span></span>
              <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:white">${E}</span>
            </div>`:`<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid var(--rule);cursor:pointer" onclick="closeModal();openModal(${y.indexOf(u)})">
            <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);min-width:20px;text-align:right">${v}</span>
            <span style="font-family:'Playfair Display',serif;font-weight:700;flex:1;color:var(--ink);font-size:14px">${u.title} <span style="font-size:11px;font-weight:400;color:var(--dim)">${u.year||""}</span></span>
            <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${E}</span>
          </div>`}).join("")}
      </div>`:""})()}
  `,document.getElementById("filmModal").classList.add("open"),localStorage.setItem("ledger_last_modal",e),B||Lt(t)}window.modalEnterEdit=function(){const e=y[ge];B=!0,O={...e.scores},ve()};window.modalCancelEdit=function(){B=!1,O={},ve()};window.modalUpdateScore=function(e,t){O[e]=parseInt(t);const o=document.getElementById(`modal-edit-val-${e}`);o&&(o.textContent=t,o.className=`breakdown-val ${G(parseInt(t))}`);const i=document.getElementById(`modal-edit-lbl-${e}`);i&&(i.textContent=be(parseInt(t)));const s=J(O),n=document.getElementById("modal-total-display");n&&(n.textContent=s);const a=document.getElementById("modal-total-label");a&&(a.textContent=be(s))};window.modalSaveScores=function(){const e=y[ge];e.scores={...O},e.total=J(O),B=!1,O={},re(),U(),q(),Ie().catch(t=>console.warn("sync failed",t)),ve()};async function Lt(e){const t=document.getElementById("modal-insight");if(t)try{const{getFilmInsight:o}=await D(async()=>{const{getFilmInsight:s}=await import("./insights-Dw6id4ni.js");return{getFilmInsight:s}},[]),i=await o(e);if(!document.getElementById("modal-insight"))return;t.innerHTML=`
      <div style="padding:14px 18px;background:var(--surface-dark);border-radius:6px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--on-dark-dim);margin-bottom:8px">Why this score</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.7;color:var(--on-dark)">${i}</div>
      </div>`}catch{const i=document.getElementById("modal-insight");i&&(i.style.display="none")}}function jt(e){(!e||e.target===document.getElementById("filmModal"))&&document.getElementById("filmModal").classList.remove("open")}let R="directors";function H(e){return I((e||"").split(",").map(t=>t.trim()).filter(Boolean))}function Pt(e){const t={};return y.forEach(o=>{let i=[];e==="directors"?i=H(o.director):e==="writers"?i=H(o.writer):e==="actors"?i=H(o.cast):e==="companies"?i=H(o.productionCompanies):e==="years"&&(i=o.year?[String(o.year)]:[]),i.forEach(s=>{t[s]||(t[s]=[]),t[s].push(o)})}),t}function Ge(e){const t=Pt(e);return Object.entries(t).filter(([,o])=>o.length>=2).map(([o,i])=>({name:o,films:i,avg:parseFloat((i.reduce((s,n)=>s+n.total,0)/i.length).toFixed(1)),catAvgs:w.reduce((s,n)=>{const a=i.filter(r=>r.scores[n.key]!=null).map(r=>r.scores[n.key]);return s[n.key]=a.length?parseFloat((a.reduce((r,d)=>r+d,0)/a.length).toFixed(1)):null,s},{})})).sort((o,i)=>i.avg-o.avg)}function Je(e){return e>=90?"#C4922A":e>=80?"#1F4A2A":e>=70?"#4A5830":e>=60?"#6B4820":"rgba(12,11,9,0.55)"}function De(e){e&&(R=e);const t=["directors","writers","actors","companies","years"],o={directors:"Directors",writers:"Writers",actors:"Actors",companies:"Production Co.",years:"Years"},i=Ge(R),s=document.getElementById("explore-section");s&&(s.innerHTML=`
    <div class="explore-tabs" style="margin-bottom:24px">
      ${t.map(n=>`<button class="explore-tab ${n===R?"active":""}" onclick="renderExploreIndex('${n}')">${o[n]}</button>`).join("")}
    </div>
    ${i.length===0?`<div style="border:1.5px dashed var(--rule-dark);padding:40px 32px;text-align:center;margin:8px 0">
          <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:12px">— uncharted —</div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:22px;color:var(--ink);margin-bottom:8px">Terra incognita.</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dim);font-weight:300">Rate at least two films from the same ${R==="companies"?"company":R.slice(0,-1)} to map this territory.</div>
        </div>`:i.map((n,a)=>{const r=n.name.replace(/'/g,"\\'");return`<div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--rule);cursor:pointer" onclick="exploreEntity('${R==="companies"?"company":R==="years"?"year":R.slice(0,-1)}','${r}')" onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background=''">
            <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);min-width:28px;text-align:right">${a+1}</div>
            <div style="flex:1;min-width:0">
              <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:18px;font-weight:700;color:var(--ink);line-height:1.2">${n.name}</div>
              <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px">${n.films.length} film${n.films.length!==1?"s":""}</div>
            </div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:17px;color:white;padding:4px 11px 3px;background:${Je(n.avg)};border-radius:4px;flex-shrink:0">${n.avg.toFixed(1)}</div>
          </div>`}).join("")}
  `)}function Ot(e,t){document.getElementById("filmModal").classList.remove("open"),document.querySelectorAll(".screen").forEach(l=>l.classList.remove("active")),document.getElementById("analysis").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(l=>l.classList.remove("active"));const o=document.querySelector('.nav-btn[onclick*="analysis"]');o&&o.classList.add("active"),window.scrollTo(0,0);const i=e==="director"?"directors":e==="writer"?"writers":e==="actor"?"actors":e==="year"?"years":"companies";R=i;const s=e==="director"?"Director":e==="writer"?"Writer":e==="actor"?"Actor":e==="year"?"Year":"Production Co.",n=y.filter(l=>e==="director"?H(l.director).includes(t):e==="writer"?H(l.writer).includes(t):e==="actor"?H(l.cast).includes(t):e==="company"?H(l.productionCompanies).includes(t):e==="year"?String(l.year)===t:!1).sort((l,u)=>u.total-l.total);if(n.length===0){De();return}const a=Ge(i),r=a.findIndex(l=>l.name===t)+1,d=a.length,c=a.find(l=>l.name===t),p=c?c.avg.toFixed(1):(n.reduce((l,u)=>l+u.total,0)/n.length).toFixed(1);n[0];const m={};w.forEach(l=>{const u=a.filter(M=>M.catAvgs[l.key]!=null).sort((M,E)=>E.catAvgs[l.key]-M.catAvgs[l.key]),v=u.findIndex(M=>M.name===t)+1;m[l.key]=v>0?{rank:v,total:u.length}:null});const g=w.map(l=>{const u=n.filter(v=>v.scores[l.key]!=null).map(v=>v.scores[l.key]);return{...l,avg:u.length?parseFloat((u.reduce((v,M)=>v+M,0)/u.length).toFixed(1)):null}}).filter(l=>l.avg!=null).sort((l,u)=>u.avg-l.avg);g[0],g[g.length-1],document.getElementById("analysisContent").innerHTML=`
    <div style="max-width:800px">

      <div class="dark-grid" style="background:var(--surface-dark);margin:-40px -56px 32px;padding:40px 56px 32px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:14px">
          ${s} &nbsp;·&nbsp; <span onclick="renderAnalysis()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">← all ${i}</span>
        </div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(26px,4vw,44px);color:var(--on-dark);letter-spacing:-1.5px;line-height:1.1;margin-bottom:20px">${t}</div>
        <div style="display:flex;align-items:baseline;gap:20px;flex-wrap:wrap">
          <div style="display:flex;align-items:baseline;gap:10px">
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(36px,5vw,52px);color:var(--on-dark);letter-spacing:-2px;line-height:1">${p}</div>
            <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--on-dark-dim);text-transform:uppercase;letter-spacing:1px">avg score</div>
          </div>
          <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--on-dark-dim)">#${r} of ${d} ${i}</div>
          <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--on-dark-dim)">${n.length} film${n.length!==1?"s":""} rated</div>
        </div>
      </div>

      <div id="explore-insight" style="margin-bottom:28px">
        <div class="insight-loading">
          <div class="insight-loading-label">Analysing your taste patterns <div class="insight-loading-dots"><span></span><span></span><span></span></div></div>
          <div class="insight-skeleton"></div>
          <div class="insight-skeleton s2"></div>
          <div class="insight-skeleton s3"></div>
        </div>
      </div>

      ${g.length>0?`

        <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:16px">Category averages</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-bottom:32px">
          ${g.map(l=>{const u=m[l.key];return`<div style="border-bottom:1px solid var(--rule);padding:10px 0">
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
                <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--dim)">${l.label}</div>
                <div style="display:flex;align-items:baseline;gap:8px">
                  ${u?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim)">#${u.rank}</div>`:""}
                  <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:var(--ink)">${l.avg.toFixed(1)}</div>
                </div>
              </div>
              <div style="height:2px;background:var(--rule);border-radius:1px">
                <div style="height:2px;width:${l.avg}%;background:${Je(l.avg)};border-radius:1px"></div>
              </div>
            </div>`}).join("")}
        </div>
      `:""}

      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:12px">Films</div>
      ${n.map((l,u)=>{const v=l.poster?`<img class="film-poster-thumb" src="https://image.tmdb.org/t/p/w92${l.poster}" alt="" loading="lazy">`:'<div class="film-poster-none"></div>',M=l.total!=null?(Math.round(l.total*10)/10).toFixed(1):"—";return`
        <div class="film-row" onclick="openModal(${y.indexOf(l)})" style="cursor:pointer">
          <div class="film-poster-cell">${v}</div>
          <div class="film-rank">${u+1}</div>
          <div class="film-title-cell">
            <div class="film-title-main">${l.title}</div>
            <div class="film-title-sub">${l.year||""} · ${l.director||""}</div>
          </div>
          ${["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"].map(E=>`<div class="film-score ${l.scores[E]?G(l.scores[E]):"}"}">${l.scores[E]??"—"}</div>`).join("")}
          <div class="film-total">${M}</div>
        </div>`}).join("")}
    </div>
  `,qt(e,t,n)}async function qt(e,t,o){const i=document.getElementById("explore-insight");if(i)try{const{getEntityInsight:s}=await D(async()=>{const{getEntityInsight:a}=await import("./insights-Dw6id4ni.js");return{getEntityInsight:a}},[]),n=await s(e,t,o);if(!document.getElementById("explore-insight"))return;i.innerHTML=`
      <div style="padding:18px 20px;background:var(--surface-dark);border-radius:8px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--on-dark-dim);margin-bottom:10px">Your taste in ${t}</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--on-dark)">${n}</div>
      </div>`}catch{const n=document.getElementById("explore-insight");n&&(n.style.display="none")}}function _e(){const e=i=>i.length?Math.round(i.reduce((s,n)=>s+n,0)/i.length*100)/100:null,t=w.map(i=>{const s=y.map(n=>n.scores[i.key]).filter(n=>n!=null);return{...i,avg:e(s)}});function o(i){return i>=90?"#C4922A":i>=80?"#1F4A2A":i>=70?"#4A5830":i>=60?"#6B4820":"rgba(12,11,9,0.65)"}document.getElementById("analysisContent").innerHTML=`
    <div style="max-width:900px">

      <!-- HEADER -->
      <div style="margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid var(--ink)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px">taste intelligence</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(32px,4vw,48px);line-height:1;color:var(--ink);letter-spacing:-1px;margin-bottom:8px">Your taste, decoded.</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:0.5px">${y.length} film${y.length!==1?"s":""} · weighted scoring</div>
      </div>

      <!-- CATEGORY AVERAGES -->
      <div style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--rule)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:20px">Category averages · all films</div>
        ${(()=>{const i=["plot","execution","acting","production"],s=["enjoyability","rewatchability","ending","uniqueness"],n=t.filter(c=>c.avg!=null&&!isNaN(c.avg)),a=n.filter(c=>i.includes(c.key)),r=n.filter(c=>s.includes(c.key));function d(c,p){return p.length?`
              <div style="margin-bottom:24px">
                <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);opacity:0.6;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--rule)">${c}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 40px">
                  ${p.map(m=>{const b=Math.round(m.avg),g=o(m.avg);return`<div style="display:flex;align-items:center;gap:12px;padding:6px 0">
                      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);width:88px;flex-shrink:0">${m.label}</div>
                      <div style="flex:1;height:2px;background:var(--rule);position:relative">
                        <div style="position:absolute;top:0;left:0;height:100%;background:${g};width:${b}%"></div>
                      </div>
                      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:var(--ink);width:36px;text-align:right;letter-spacing:-0.5px">${m.avg}</div>
                    </div>`}).join("")}
                </div>
              </div>`:""}return d("Craft",a)+d("Experience",r)})()}
      </div>

      <!-- EXPLORE SECTION -->
      <div id="explore-section"></div>

    </div>
  `,De()}const we="f5a446a5f70a9f6a16a8ddd052c121f2",ke="https://api.themoviedb.org/3",Rt="https://ledger-proxy.noahparikhcott.workers.dev";let Oe=null,Q=null,$e=null;function Ke(){document.getElementById("predict-search").value="",document.getElementById("predict-search-results").innerHTML="",document.getElementById("predict-result").innerHTML="",Q=null,setTimeout(()=>document.getElementById("predict-search")?.focus(),50)}function Nt(){clearTimeout(Oe),Oe=setTimeout(Qe,500)}async function Qe(){const e=document.getElementById("predict-search").value.trim();if(!e||e.length<2)return;const t=document.getElementById("predict-search-results");t.innerHTML='<div class="tmdb-loading">Searching…</div>';try{const s=((await(await fetch(`${ke}/search/movie?api_key=${we}&query=${encodeURIComponent(e)}&language=en-US&page=1`)).json()).results||[]).slice(0,5);if(!s.length){t.innerHTML='<div class="tmdb-error">No results found.</div>';return}const n=new Set(y.map(a=>a.title.toLowerCase()));t.innerHTML=s.map(a=>{const r=a.release_date?.slice(0,4)||"",d=a.poster_path?`<img class="tmdb-result-poster" src="https://image.tmdb.org/t/p/w92${a.poster_path}">`:'<div class="tmdb-result-poster-placeholder">no img</div>',c=n.has(a.title.toLowerCase());return`<div class="tmdb-result ${c?"opacity-50":""}" onclick="${c?"":`predictSelectFilm(${a.id}, '${a.title.replace(/'/g,"\\'")}', '${r}')`}" style="${c?"opacity:0.4;cursor:default":""}">
        ${d}
        <div class="tmdb-result-info">
          <div class="tmdb-result-title">${a.title}</div>
          <div class="tmdb-result-meta">${r}${c?" · already in your list":""}</div>
          <div class="tmdb-result-overview">${(a.overview||"").slice(0,100)}${a.overview?.length>100?"…":""}</div>
        </div>
      </div>`}).join("")}catch{t.innerHTML='<div class="tmdb-error">Search failed — check connection.</div>'}}async function Ht(e,t,o){document.getElementById("predict-search-results").innerHTML="",document.getElementById("predict-search").value=t,document.getElementById("predict-result").innerHTML=`
    <div class="predict-loading">
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:var(--dim)">Analysing your taste profile…</div>
      <div class="predict-loading-label">Reading ${y.length} films · building your fingerprint · predicting scores</div>
    </div>`;let i={},s={};try{const[m,b]=await Promise.all([fetch(`${ke}/movie/${e}?api_key=${we}`),fetch(`${ke}/movie/${e}/credits?api_key=${we}`)]);i=await m.json(),s=await b.json()}catch{}const n=(s.crew||[]).filter(m=>m.job==="Director").map(m=>m.name).join(", "),a=(s.crew||[]).filter(m=>["Screenplay","Writer","Story"].includes(m.job)).map(m=>m.name).slice(0,2).join(", "),r=(s.cast||[]).slice(0,8).map(m=>m.name).join(", "),d=(i.genres||[]).map(m=>m.name).join(", "),c=i.overview||"",p=i.poster_path||null;Q={tmdbId:e,title:t,year:o,director:n,writer:a,cast:r,genres:d,overview:c,poster:p},await Wt(Q)}function Ft(){const e=["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"],t={};e.forEach(a=>{const r=y.filter(p=>p.scores[a]!=null).map(p=>p.scores[a]);if(!r.length){t[a]={mean:70,std:10,min:0,max:100};return}const d=r.reduce((p,m)=>p+m,0)/r.length,c=Math.sqrt(r.reduce((p,m)=>p+(m-d)**2,0)/r.length);t[a]={mean:Math.round(d*10)/10,std:Math.round(c*10)/10,min:Math.min(...r),max:Math.max(...r)}});const o=[...y].sort((a,r)=>r.total-a.total),i=o.slice(0,10).map(a=>`${a.title} (${a.total})`).join(", "),s=o.slice(-5).map(a=>`${a.title} (${a.total})`).join(", "),n=w.map(a=>`${a.label}×${a.weight}`).join(", ");return{stats:t,top10:i,bottom5:s,weightStr:n,archetype:x?.archetype,archetypeSecondary:x?.archetype_secondary,totalFilms:y.length}}function Ut(e){const t=I((e.director||"").split(",").map(i=>i.trim()).filter(Boolean)),o=I((e.cast||"").split(",").map(i=>i.trim()).filter(Boolean));return y.filter(i=>{const s=I((i.director||"").split(",").map(a=>a.trim()).filter(Boolean)),n=I((i.cast||"").split(",").map(a=>a.trim()).filter(Boolean));return t.some(a=>s.includes(a))||o.some(a=>n.includes(a))}).sort((i,s)=>s.total-i.total).slice(0,8)}async function Wt(e){const t=Ft(),o=Ut(e),i=o.length?o.map(r=>`- ${r.title} (${r.year||""}): total=${r.total}, plot=${r.scores.plot}, execution=${r.scores.execution}, acting=${r.scores.acting}, production=${r.scores.production}, enjoyability=${r.scores.enjoyability}, rewatchability=${r.scores.rewatchability}, ending=${r.scores.ending}, uniqueness=${r.scores.uniqueness}`).join(`
`):"No direct comparisons found in rated list.",s=Object.entries(t.stats).map(([r,d])=>`${r}: mean=${d.mean}, std=${d.std}, range=${d.min}–${d.max}`).join(`
`),n="You are a precise film taste prediction engine. Your job is to predict how a specific user would score an unrated film, based on their detailed rating history and taste profile. You must respond ONLY with valid JSON — no preamble, no markdown, no explanation outside the JSON.",a=`USER TASTE PROFILE:
Archetype: ${t.archetype||"unknown"} (secondary: ${t.archetypeSecondary||"none"})
Total films rated: ${t.totalFilms}
Weighting formula: ${t.weightStr}

Category score statistics (across all rated films):
${s}

Top 10 films: ${t.top10}
Bottom 5 films: ${t.bottom5}

FILMS WITH SHARED DIRECTOR/CAST (most relevant comparisons):
${i}

FILM TO PREDICT:
Title: ${e.title}
Year: ${e.year}
Director: ${e.director||"unknown"}
Writer: ${e.writer||"unknown"}
Cast: ${e.cast||"unknown"}
Genres: ${e.genres||"unknown"}
Synopsis: ${e.overview||"not available"}

TASK:
Predict the scores this person would give this film. Use comparable films as the strongest signal. Weight director/cast patterns heavily.

The reasoning must feel personal and specific to THIS person's taste — not a general film analysis. Write like you genuinely understand how they think about film. Reference their actual rated films by name. Focus on what THEY care about based on their scoring patterns. Be direct and confident. 2-3 sentences max. Never describe the film in general terms — always anchor to their specific ratings and patterns.

Respond with this exact JSON structure:
{
  "predicted_scores": {
    "plot": <integer 1-100>,
    "execution": <integer 1-100>,
    "acting": <integer 1-100>,
    "production": <integer 1-100>,
    "enjoyability": <integer 1-100>,
    "rewatchability": <integer 1-100>,
    "ending": <integer 1-100>,
    "uniqueness": <integer 1-100>
  },
  "confidence": "high" | "medium" | "low",
  "reasoning": "<2-3 sentences in second person (you/your). Reference specific films they have rated. Never say the user. Sound like a trusted friend who knows their taste intimately, not a film critic.>",
  "key_comparables": ["<film title>", "<film title>"]
}`;try{const p=((await(await fetch(Rt,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:n,messages:[{role:"user",content:a}]})})).json()).content?.[0]?.text||"").replace(/```json|```/g,"").trim(),m=JSON.parse(p);$e=m,Yt(e,m,o)}catch(r){document.getElementById("predict-result").innerHTML=`
      <div class="tmdb-error">Prediction failed: ${r.message}. Check that the proxy is running and your API key is valid.</div>`}}function Yt(e,t,o){let i=0,s=0;w.forEach(c=>{const p=t.predicted_scores[c.key];p!=null&&(i+=p*c.weight,s+=c.weight)});const n=s>0?Math.round(i/s*100)/100:0,a=e.poster?`<img class="predict-poster" src="https://image.tmdb.org/t/p/w185${e.poster}" alt="${e.title}">`:`<div class="predict-poster-placeholder">${e.title}</div>`,r={high:"conf-high",medium:"conf-medium",low:"conf-low"}[t.confidence]||"conf-medium",d={high:"High confidence",medium:"Medium confidence",low:"Low confidence"}[t.confidence]||"";document.getElementById("predict-result").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:16px">Prediction</div>

    <div class="predict-film-card">
      ${a}
      <div style="flex:1">
        <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:900;letter-spacing:-0.5px;margin-bottom:2px">${e.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px">${e.year}${e.director?" · "+e.director:""}</div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <div class="predict-total-display">${n}</div>
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${V(n)}</div>
            <span class="predict-confidence ${r}">${d}</span>
          </div>
        </div>
      </div>
    </div>

    <div style="padding:18px 20px;background:var(--surface-dark);border-radius:8px;margin-bottom:24px">
      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--on-dark-dim);margin-bottom:10px">Why this score</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.7;color:var(--on-dark)">${t.reasoning}</div>
    </div>

    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:12px">Predicted category scores</div>
    <div class="predict-score-grid">
      ${w.map(c=>{const p=t.predicted_scores[c.key];return`<div class="predict-score-cell">
          <div class="predict-score-cell-label">${c.label}</div>
          <div class="predict-score-cell-val ${p?G(p):""}">${p??"—"}</div>
        </div>`}).join("")}
    </div>

    ${o.length>0?`
      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin:24px 0 10px">Comparisons from your list</div>
      ${o.slice(0,5).map(c=>{const p=(n-c.total).toFixed(1),m=p>0?"+":"";return`<div class="predict-comp-row" onclick="openModal(${y.indexOf(c)})">
          <div class="predict-comp-title">${c.title} <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);font-weight:400">${c.year||""}</span></div>
          <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${c.total}</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:600;${parseFloat(p)>0?"color:var(--green)":"color:var(--red)"}">${m}${p} predicted</div>
        </div>`}).join("")}
    `:""}

    <div class="btn-row" style="margin-top:32px">
      <button class="btn btn-outline" onclick="initPredict()">← New prediction</button>
      <button class="btn btn-action" onclick="predictAddToList()">Add to list & rate it →</button>
    </div>
  `}function Vt(){Q&&(document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active")),document.getElementById("add").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(e=>e.classList.remove("active")),document.querySelector('.nav-btn[onclick*="add"]').classList.add("active"),setTimeout(()=>{const e=document.getElementById("f-search");e&&(e.value=Q.title,D(()=>Promise.resolve().then(()=>mo),void 0).then(t=>{$e?.predicted_scores&&t.prefillWithPrediction($e.predicted_scores),t.liveSearch(Q.title)}))},100))}let te="all",Xe="focused",W=[],T=0,S={},z={},ne=[];const Gt={focused:15,thorough:30,deep:50},qe=8;function Jt(e){te=e,document.querySelectorAll('[id^="calcat_"]').forEach(t=>t.classList.remove("active")),document.getElementById("calcat_"+e).classList.add("active")}function Kt(e){Xe=e,document.querySelectorAll('[id^="calint_"]').forEach(t=>t.classList.remove("active")),document.getElementById("calint_"+e).classList.add("active")}function Qt(e,t){const o=[];(e==="all"?w.map(a=>a.key):[e]).forEach(a=>{const r=y.filter(d=>d.scores[a]!=null).sort((d,c)=>d.scores[a]-c.scores[a]);for(let d=0;d<r.length-1;d++)for(let c=d+1;c<r.length;c++){const p=Math.abs(r[d].scores[a]-r[c].scores[a]);if(p<=8)o.push({a:r[d],b:r[c],catKey:a,diff:p});else break}}),o.sort((a,r)=>a.diff-r.diff);const s=new Set,n=[];for(const a of o){const r=[a.a.title,a.b.title,a.catKey].join("|");s.has(r)||(s.add(r),n.push(a))}return n.sort(()=>Math.random()-.5).slice(0,t)}function Xt(){const e=Gt[Xe];if(W=Qt(te,e),W.length===0){alert("Not enough films with close scores to calibrate. Try a different category or add more films.");return}T=0,S={},z={},ne=[],y.forEach(t=>{z[t.title]={...t.scores}}),document.getElementById("cal-setup").style.display="none",document.getElementById("cal-matchups").style.display="block",document.getElementById("cal-cat-label").textContent=te==="all"?"All categories":w.find(t=>t.key===te)?.label||te,Ce()}function Ce(){if(T>=W.length){Zt();return}const{a:e,b:t,catKey:o}=W[T],i=W.length,s=Math.round(T/i*100);document.getElementById("cal-progress-label").textContent=`${T+1} / ${i}`,document.getElementById("cal-progress-bar").style.width=s+"%";const n=w.find(d=>d.key===o)?.label||o;z[e.title]?.[o]??e.scores[o],z[t.title]?.[o]??t.scores[o];function a(d,c){const p=d.poster?`<img style="width:100%;height:100%;object-fit:cover;display:block" src="https://image.tmdb.org/t/p/w342${d.poster}" alt="" loading="lazy">`:'<div style="width:100%;height:100%;background:var(--deep-cream)"></div>';return`
      <div class="cal-film-card" id="cal-card-${c}" onclick="calChoose('${c}')">
        <div style="aspect-ratio:2/3;overflow:hidden;background:var(--cream);position:relative;margin-bottom:12px">
          ${p}
        </div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;font-weight:700;line-height:1.3;color:var(--ink);margin-bottom:4px">${d.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim)">${d.year||""}</div>
      </div>`}const r=o==="uniqueness"?"More unique?":`Better ${n.toLowerCase()}?`;document.getElementById("cal-matchup-card").innerHTML=`
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:8px">${n}</div>
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(28px,5vw,44px);color:var(--ink);letter-spacing:-1px;line-height:1.1">${r}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:0;align-items:start">
      ${a(e,"a")}
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:16px;color:var(--dim);text-align:center;padding-top:35%">vs</div>
      ${a(t,"b")}
    </div>
    <div style="text-align:center;margin-top:24px;display:flex;justify-content:center;align-items:center;gap:24px">
      ${T>0?`<span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);cursor:pointer;text-decoration:underline;text-underline-offset:2px" onclick="undoCalChoice()">← Undo</span>`:""}
      <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);cursor:pointer;text-decoration:underline;text-underline-offset:2px;letter-spacing:0.5px" onclick="calChoose('skip')">Too close to call</span>
    </div>
  `}window.undoCalChoice=function(){if(ne.length===0)return;const e=ne.pop();T=e.idx,z=e.tempScores,S=e.deltas,Ce()};window.calChoose=function(e){if(ne.push({idx:T,tempScores:JSON.parse(JSON.stringify(z)),deltas:JSON.parse(JSON.stringify(S))}),e!=="skip"){const{a:t,b:o,catKey:i}=W[T],s=z[t.title]?.[i]??t.scores[i],n=z[o.title]?.[i]??o.scores[i],a=1/(1+Math.pow(10,(n-s)/40)),r=1-a,d=e==="a"?1:0,c=1-d,p=Math.round(Math.min(100,Math.max(1,s+qe*(d-a)))),m=Math.round(Math.min(100,Math.max(1,n+qe*(c-r))));if(S[t.title]||(S[t.title]={}),S[o.title]||(S[o.title]={}),p!==s){const l=S[t.title][i]?.old??s;S[t.title][i]={old:l,new:p},z[t.title][i]=p}if(m!==n){const l=S[o.title][i]?.old??n;S[o.title][i]={old:l,new:m},z[o.title][i]=m}const b=document.getElementById(`cal-card-${e}`),g=document.getElementById(`cal-card-${e==="a"?"b":"a"}`);b&&(b.style.opacity="1"),g&&(g.style.opacity="0.35",g.style.transform="scale(0.97)")}T++,setTimeout(()=>Ce(),e==="skip"?0:140)};function Zt(){document.getElementById("cal-matchups").style.display="none",document.getElementById("cal-review").style.display="block";const e=Object.entries(S).flatMap(([o,i])=>Object.entries(i).map(([s,{old:n,new:a}])=>({title:o,catKey:s,old:n,new:a}))).filter(o=>o.old!==o.new).sort((o,i)=>Math.abs(i.new-i.old)-Math.abs(o.new-o.old));if(e.length===0){document.getElementById("cal-review-header").innerHTML=`
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:36px;color:var(--ink);letter-spacing:-1px;margin-bottom:8px">Well-calibrated.</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:15px;color:var(--dim)">No meaningful inconsistencies found. Your scores are in good shape.</div>`,document.getElementById("cal-diff-list").innerHTML="",document.getElementById("cal-apply-btn").style.display="none";return}document.getElementById("cal-review-header").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:8px">here's what shifted</div>
    <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(28px,3vw,40px);color:var(--ink);letter-spacing:-1px;margin-bottom:8px">${e.length} score${e.length!==1?"s":""} recalibrated.</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dim)">Uncheck anything you want to keep. Nothing changes until you apply.</div>`,document.getElementById("cal-apply-btn").style.display="";const t={};w.forEach(o=>{t[o.key]=[]}),e.forEach((o,i)=>{t[o.catKey]&&t[o.catKey].push({...o,idx:i})}),document.getElementById("cal-diff-list").innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${w.map(o=>{const i=t[o.key],s=i.slice(0,3),n=i.length-3,a=i.length>0;return`<div style="padding:14px;background:var(--cream);border-radius:6px;${a?"":"opacity:0.45"}">
          <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:${a?"10px":"0"}">${o.label}</div>
          ${a?"":`<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--dim)">No changes</div>`}
          ${s.map((r,d)=>{const c=r.new>r.old?"var(--green)":"var(--red)";return`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;${d<s.length-1?"border-bottom:1px solid var(--rule)":""}">
              <input type="checkbox" id="caldiff_${r.idx}" checked style="flex-shrink:0;accent-color:var(--blue);width:14px;height:14px"
                data-movie-idx="${y.findIndex(p=>p.title===r.title)}" data-cat="${r.catKey}" data-old="${r.old}" data-new="${r.new}">
              <div style="flex:1;overflow:hidden">
                <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:13px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.title}</div>
              </div>
              <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);text-decoration:line-through">${r.old}</span>
                <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:${c}">${r.new}</span>
              </div>
            </div>`}).join("")}
          ${n>0?`<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:8px">+${n} more</div>`:""}
        </div>`}).join("")}
    </div>`}function eo(){try{const e=document.querySelectorAll('[id^="caldiff_"]');let t=0;e.forEach(o=>{if(!o.checked)return;const i=parseInt(o.dataset.movieIdx),s=o.dataset.cat,n=parseInt(o.dataset.new),a=y[i];a&&a.scores[s]!==void 0&&(a.scores[s]=n,a.total=J(a.scores),t++)}),re(),U(),D(()=>Promise.resolve().then(()=>ee),void 0).then(o=>o.updateStorageStatus()),q(),document.querySelectorAll(".screen").forEach(o=>o.classList.remove("active")),document.getElementById("rankings").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(o=>o.classList.remove("active")),document.querySelector('.nav-btn[onclick*="rankings"]').classList.add("active"),Be()}catch(e){console.error("applyCalibration error:",e)}}function Be(){W=[],T=0,S={},z={},ne=[],document.getElementById("cal-setup").style.display="block",document.getElementById("cal-matchups").style.display="none",document.getElementById("cal-review").style.display="none",document.getElementById("cal-apply-btn").style.display=""}const Z={Visceralist:{palette:"#D4665A",weights:{plot:2,execution:2,acting:2,production:1,enjoyability:5,rewatchability:3,ending:1,uniqueness:1},quote:`"If I'm not feeling it, nothing else matters."`,description:"You watch with your whole body. If a film doesn't move you — actually move you — you find it hard to call it great regardless of what the craft says. Your taste is honest, unguarded, and completely your own."},Formalist:{palette:"#7AB0CF",weights:{plot:2,execution:4,acting:1,production:3,enjoyability:1,rewatchability:1,ending:1,uniqueness:3},quote:'"How you say it matters as much as what you say."',description:"You're drawn to directors who think in images. The how of filmmaking holds your attention as much as the what — sometimes more. For you, style isn't decoration; it's the argument."},Narrativist:{palette:"#D4A84B",weights:{plot:4,execution:2,acting:2,production:1,enjoyability:1,rewatchability:1,ending:3,uniqueness:1},quote:'"A great story can survive almost anything."',description:"Story is your foundation. You can forgive weak production, uneven performances, almost anything — if the story earns it. You believe a great narrative is cinema's highest achievement."},Humanist:{palette:"#E8906A",weights:{plot:2,execution:2,acting:4,production:1,enjoyability:3,rewatchability:1,ending:1,uniqueness:1},quote:'"I come for the story, I stay for the people."',description:"You come for the story and stay for the people. What moves you most is a performance that makes you forget you're watching — a fully realized human being, right there on screen."},Completionist:{palette:"#52BFA8",weights:{plot:2,execution:3,acting:1,production:1,enjoyability:1,rewatchability:1,ending:1,uniqueness:4},quote:`"I want something I've never seen before."`,description:"You've seen enough to recognize when something's been done before, and you're hungry for the genuinely new. Originality isn't a bonus for you — it's close to a requirement."},Sensualist:{palette:"#B48FD4",weights:{plot:1,execution:4,acting:1,production:4,enjoyability:1,rewatchability:1,ending:1,uniqueness:2},quote:'"Cinema is first an aesthetic experience."',description:"Cinema is, for you, first an aesthetic experience. You respond to texture, light, composition, sound design — the pure sensory architecture of a film. Some of your favorites barely need a plot."},Revisionist:{palette:"#7AB87A",weights:{plot:1,execution:2,acting:1,production:1,enjoyability:1,rewatchability:4,ending:2,uniqueness:3},quote:'"My first watch is just the beginning."',description:"Your relationship with a film deepens over time. You rewatch, reconsider, and sit with things long after the credits roll. The first watch is often just the beginning — and you've changed your mind on more films than most people have seen."},Absolutist:{palette:"#A8C0D4",weights:{plot:3,execution:2,acting:1,production:1,enjoyability:1,rewatchability:1,ending:4,uniqueness:2},quote:'"The ending is the argument."',description:"The ending is the argument. A film can be brilliant for two hours and lose you in the final ten minutes — and that loss matters. A great ending doesn't just conclude; it reframes everything that came before."},Atmospherist:{palette:"#D4A8BE",weights:{plot:1,execution:2,acting:1,production:2,enjoyability:3,rewatchability:5,ending:1,uniqueness:1},quote:'"The right film at the right moment is everything."',description:"The right film at the right moment is almost a spiritual experience for you. Context is part of cinema itself — the mood, the night, who you watched it with. You chase that feeling more than you chase prestige."}},to=[{q:"You finish a film that you admired more than you enjoyed. How do you rate it?",options:[{key:"A",text:"Rate it highly. The craft speaks for itself."},{key:"B",text:"Rate it somewhere in the middle. Both things are true."},{key:"C",text:"Rate it lower. If it didn't connect, something didn't work."},{key:"D",text:"Watch it again before deciding."}]},{q:"A film you've been completely absorbed in for two hours ends in a way that doesn't satisfy you. How much does that affect how you feel about the whole thing?",options:[{key:"A",text:"A lot. The ending is the argument. It reframes everything before it."},{key:"B",text:"Somewhat. It takes the edge off, but two great hours are still two great hours."},{key:"C",text:"Not much. I was there for the ride, not the destination."},{key:"D",text:"Depends on the film. Some endings are meant to be unresolved."}]},{q:"Think about a film you've seen multiple times. Is there a version of that experience — a specific night, a specific mood, a specific person you watched it with — that you remember more than the film itself?",options:[{key:"A",text:"Yes, and honestly that's a big part of why I love it."},{key:"B",text:"Maybe, but I try to rate the film on its own terms."},{key:"C",text:"Not really. A great film is great regardless of when you watch it."},{key:"D",text:"I don't rewatch much. I'd rather see something new."}]},{q:"It's a Sunday. You have the whole afternoon. You're scrolling through options and you see a film you've seen probably four or five times already. Do you put it on?",options:[{key:"A",text:"Honestly, yeah. Sometimes that's exactly what the moment calls for."},{key:"B",text:"Only if I'm in a specific mood for it. Otherwise I'd rather find something new."},{key:"C",text:"Probably not. There's too much I haven't seen."},{key:"D",text:"Depends who I'm watching with."}]},{q:"Sometimes a performance makes you forget you're watching a film. You're not thinking about the script or the direction — you're just fully transported into a character's inner world. How much does that experience shape how you feel about a film overall?",options:[{key:"A",text:"It's everything. A performance like that can carry a film for me."},{key:"B",text:"It elevates it, but I need the rest of the film to hold up too."},{key:"C",text:"I notice it, but it's one piece of a bigger picture."},{key:"D",text:"Honestly I'm usually more absorbed by the world the film creates than the people in it."}]},{q:"A film has one of the greatest performances you've ever seen. The script around it is a mess. Where do you land?",options:[{key:"A",text:"Still a great film. That performance is the film."},{key:"B",text:"Good but frustrating. What could have been."},{key:"C",text:"The script drags it down significantly. A film is only as strong as its weakest part."},{key:"D",text:"Depends how bad the script is. There's a threshold."}]}];let h="name",X={},pe="",j=null,me=null;function he(){const e=document.getElementById("onboarding-overlay");e.style.display="flex",h="name",X={},N()}function N(){const e=document.getElementById("ob-card-content");if(h==="name")e.innerHTML=`
      <div class="ob-eyebrow">palate map · let's begin</div>
      <div class="ob-title">What do you call yourself?</div>
      <div class="ob-sub">No account required. Just a name — your ratings sync to the cloud under this identity, so you can pick up where you left off on any device.</div>
      <input class="ob-name-input" id="ob-name-field" type="text" placeholder="e.g. Alex" maxlength="32" oninput="obCheckName()" onkeydown="if(event.key==='Enter') obSubmitName()">
      <button class="ob-btn" id="ob-name-btn" onclick="obSubmitName()" disabled>Continue →</button>
      <div style="text-align:center;margin-top:20px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px">Been here before? &nbsp;</span>
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obShowReturning()">Restore your profile →</span>
      </div>
      <div style="text-align:center;margin-top:10px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px">Have a film_rankings.json? &nbsp;</span>
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obShowImport()">Import existing list →</span>
      </div>
    `,setTimeout(()=>document.getElementById("ob-name-field")?.focus(),50);else if(h==="returning")e.innerHTML=`
      <div class="ob-eyebrow">palate map · welcome back</div>
      <div class="ob-title">Welcome back.</div>
      <div class="ob-sub">Enter your username to restore your profile and film list from the cloud.</div>
      <input class="ob-name-input" id="ob-returning-field" type="text" placeholder="e.g. alexsmith" maxlength="64" onkeydown="if(event.key==='Enter') obLookupUser()">
      <div id="ob-returning-error" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--red);margin-bottom:12px;display:none">Username not found. Check spelling and try again.</div>
      <button class="ob-btn" id="ob-returning-btn" onclick="obLookupUser()">Restore profile →</button>
      <div style="text-align:center;margin-top:20px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obStep='name';renderObStep()">← New user instead</span>
      </div>
    `,setTimeout(()=>document.getElementById("ob-returning-field")?.focus(),50);else if(h==="import")e.innerHTML=`
      <div class="ob-eyebrow">palate map · import</div>
      <div class="ob-title">Import your films.</div>
      <div class="ob-sub">Select your <em>film_rankings.json</em> exported from a previous version of Palate Map.</div>
      <div id="ob-import-drop" style="border:2px dashed var(--rule-dark);padding:40px 24px;text-align:center;cursor:pointer;margin-bottom:16px;transition:border-color 0.15s"
        onclick="document.getElementById('ob-import-file').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--blue)'"
        ondragleave="this.style.borderColor='var(--rule-dark)'"
        ondrop="obHandleImportDrop(event)">
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:1px">Click to select or drag file here</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--rule-dark);margin-top:6px">film_rankings.json</div>
      </div>
      <input type="file" id="ob-import-file" accept=".json" style="display:none" onchange="obHandleImportFile(this)">
      <div id="ob-import-status" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px;min-height:18px"></div>
      <button class="ob-btn" id="ob-import-btn" onclick="obConfirmImport()" disabled>Continue with imported films →</button>
      <div style="text-align:center;margin-top:20px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obStep='name';renderObStep()">← Back</span>
      </div>
    `;else if(typeof h=="number"){const t=to[h],o=Math.round(h/6*100),i=h===0?`<div style="font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.8;color:var(--dim);margin-bottom:28px;font-style:italic">The films you're drawn to reveal something consistent about you — a set of values, sensitivities, and hungers that show up again and again. A few questions to surface them.</div>`:"";e.innerHTML=`
      ${i}
      <div class="ob-progress">Question ${h+1} of 6</div>
      <div class="ob-progress-bar"><div class="ob-progress-fill" style="width:${o}%"></div></div>
      <div class="ob-question">${t.q}</div>
      ${t.options.map(s=>`
        <div class="ob-option ${X[h]===s.key?"selected":""}" onclick="obSelectAnswer(${h}, '${s.key}', this)">
          <span class="ob-option-key">${s.key}</span>
          <span class="ob-option-text">${s.text}</span>
        </div>`).join("")}
      <div class="ob-nav">
        ${h>0?'<button class="ob-btn-secondary" onclick="obBack()">← Back</button>':""}
        <button class="ob-btn-primary" id="ob-next-btn" onclick="obNext()" ${X[h]?"":"disabled"}>
          ${h===5?"See my archetype →":"Next →"}
        </button>
      </div>
    `}else if(h==="reveal"){const t=oo(X);j=t,j._slug||(j._slug=pe.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"user");const o=Z[t.primary],i=o.palette||"#3d5a80";e.innerHTML=`
      <div class="ob-eyebrow">your palate</div>
      <div style="background:var(--surface-dark);padding:28px 32px;margin:16px -4px 20px">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:10px">you are —</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(36px,8vw,56px);line-height:1;letter-spacing:-1px;color:${i};margin-bottom:16px">${t.primary}</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.75;color:var(--on-dark);margin-bottom:12px;opacity:0.85">${o.description}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim);letter-spacing:0.5px">${o.quote}</div>
        ${t.secondary?`
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(244,239,230,0.1)">
          <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:6px">secondary</div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:var(--on-dark);opacity:0.75">${t.secondary}</div>
        </div>`:""}
      </div>
      <div style="background:var(--card-bg);border:1px solid var(--rule);padding:12px 16px;margin-bottom:24px;font-family:'DM Mono',monospace;font-size:11px;color:var(--dim)">
        Your username: <strong style="color:var(--ink)" id="ob-reveal-username">—</strong><br>
        <span style="font-size:10px">Save this to restore your profile on any device.</span>
      </div>
      <button class="ob-btn" onclick="obFinishFromReveal()">Enter Palate Map →</button>
    `,setTimeout(()=>{const s=document.getElementById("ob-reveal-username");s&&(s.textContent=j._slug)},0)}}window.obCheckName=function(){const e=document.getElementById("ob-name-field")?.value?.trim(),t=document.getElementById("ob-name-btn");t&&(t.disabled=!e||e.length<1)};window.obSubmitName=function(){const e=document.getElementById("ob-name-field")?.value?.trim();e&&(pe=e,h=0,N())};window.obShowReturning=function(){h="returning",N()};window.obShowImport=function(){h="import",me=null,N()};window.obHandleImportDrop=function(e){e.preventDefault(),document.getElementById("ob-import-drop").style.borderColor="var(--rule-dark)";const t=e.dataTransfer.files[0];t&&Ze(t)};window.obHandleImportFile=function(e){const t=e.files[0];t&&Ze(t)};function Ze(e){const t=new FileReader;t.onload=o=>{try{const i=JSON.parse(o.target.result);if(!Array.isArray(i)||i.length===0)throw new Error("invalid");if(!i[0].scores||!i[0].title)throw new Error("invalid");me=i,document.getElementById("ob-import-status").textContent=`✓ ${i.length} films ready to import`,document.getElementById("ob-import-status").style.color="var(--green)",document.getElementById("ob-import-drop").style.borderColor="var(--green)",document.getElementById("ob-import-drop").innerHTML=`<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--green)">${e.name}</div>`,document.getElementById("ob-import-btn").disabled=!1}catch{document.getElementById("ob-import-status").textContent="That doesn't look like a valid Palate Map JSON file.",document.getElementById("ob-import-status").style.color="var(--red)"}},t.readAsText(e)}window.obConfirmImport=function(){me&&(ye(me),h=0,N())};window.obLookupUser=async function(){const e=document.getElementById("ob-returning-btn"),t=document.getElementById("ob-returning-error"),o=document.getElementById("ob-returning-field")?.value?.trim().toLowerCase();if(o){e.disabled=!0,e.textContent="Looking up…",t.style.display="none";try{const{data:i,error:s}=await ue.from("ledger_users").select("*").eq("username",o).single();if(s||!i)throw new Error("not found");fe({id:i.id,username:i.username,display_name:i.display_name,archetype:i.archetype,archetype_secondary:i.archetype_secondary,weights:i.weights,harmony_sensitivity:i.harmony_sensitivity}),i.movies&&Array.isArray(i.movies)&&i.movies.length>0&&ye(i.movies),ce(),U(),le(),re(),document.getElementById("onboarding-overlay").style.display="none";const n=await D(()=>Promise.resolve().then(()=>ee),void 0);n.updateMastheadProfile(),n.setCloudStatus("synced"),n.updateStorageStatus(),q()}catch{e.disabled=!1,e.textContent="Restore profile →",t.style.display="block"}}};window.obSelectAnswer=function(e,t,o){X[e]=t,o.closest(".ob-card").querySelectorAll(".ob-option").forEach(s=>s.classList.remove("selected")),o.classList.add("selected");const i=document.getElementById("ob-next-btn");i&&(i.disabled=!1)};window.obBack=function(){h>0?(h--,N()):(h="name",N())};window.obNext=function(){X[h]&&(h<5?(h++,N()):(h="reveal",N()))};window.obFinishFromReveal=function(){if(!j)return;const e=Z[j.primary];io(j.primary,j.secondary||"",e.weights,j.harmonySensitivity)};function oo(e){const t={};Object.keys(Z).forEach(s=>t[s]=0),e[0]==="A"&&(t.Formalist+=2,t.Sensualist+=1,t.Completionist+=1),e[0]==="C"&&(t.Visceralist+=2,t.Atmospherist+=1),e[0]==="D"&&(t.Revisionist+=3),e[0]==="B"&&(t.Narrativist+=1,t.Humanist+=1),e[1]==="A"&&(t.Absolutist+=3,t.Narrativist+=2),e[1]==="C"&&(t.Visceralist+=2,t.Atmospherist+=2),e[1]==="D"&&(t.Completionist+=1,t.Revisionist+=1),e[1]==="B"&&(t.Humanist+=1,t.Formalist+=1),e[2]==="A"&&(t.Atmospherist+=3),e[2]==="C"&&(t.Formalist+=2,t.Absolutist+=2),e[2]==="D"&&(t.Completionist+=2,t.Revisionist-=1),e[2]==="B"&&(t.Narrativist+=1),e[3]==="A"&&(t.Atmospherist+=2,t.Revisionist+=2),e[3]==="C"&&(t.Completionist+=3),e[3]==="D"&&(t.Atmospherist+=1),e[3]==="B"&&(t.Sensualist+=1),e[4]==="A"&&(t.Humanist+=3,t.Visceralist+=1),e[4]==="D"&&(t.Sensualist+=3),e[4]==="C"&&(t.Formalist+=1,t.Completionist+=1),e[4]==="B"&&(t.Narrativist+=1,t.Absolutist+=1);let o=.3;e[5]==="A"&&(t.Visceralist+=1,o=0),e[5]==="C"&&(t.Absolutist+=1,o=1),e[5]==="B"&&(o=.4);const i=Object.entries(t).sort((s,n)=>n[1]-s[1]);return{primary:i[0][0],secondary:i[1][1]>0?i[1][0]:null,harmonySensitivity:o}}async function io(e,t,o,i){const s=crypto.randomUUID(),n=j._slug||pe.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"user";fe({id:s,username:n,display_name:pe,archetype:e,archetype_secondary:t,weights:o,harmony_sensitivity:i}),le(),re(),document.getElementById("onboarding-overlay").style.display="none";const a=await D(()=>Promise.resolve().then(()=>ee),void 0);a.updateMastheadProfile(),a.updateStorageStatus(),a.setCloudStatus("syncing"),q(),ce(),Ie().catch(r=>console.warn("Initial sync failed:",r))}const no=Object.freeze(Object.defineProperty({__proto__:null,launchOnboarding:he},Symbol.toStringTag,{value:"Module"})),Me="f5a446a5f70a9f6a16a8ddd052c121f2",Ee="https://api.themoviedb.org/3";let f={title:"",year:null,director:"",writer:"",cast:"",scores:{}},oe=[],A={},Y={};function et(e){de(e)}function de(e){for(let t=1;t<=4;t++){const o=document.getElementById("sn"+t),i=document.getElementById("sl"+t);t<e?(o.className="step-num done",o.textContent="✓"):t===e?(o.className="step-num active",o.textContent=t,i.className="step-label active"):(o.className="step-num",o.textContent=t,i.className="step-label")}document.querySelectorAll(".step-panel").forEach((t,o)=>{t.classList.toggle("active",o+1===e)})}let Re=null;function tt(e){clearTimeout(Re);const t=document.getElementById("tmdb-results");if(e.trim().length<2){t.innerHTML="";return}document.getElementById("searchSpinner").style.display="inline",Re=setTimeout(async()=>{try{const i=await(await fetch(`${Ee}/search/movie?api_key=${Me}&query=${encodeURIComponent(e.trim())}&include_adult=false`)).json();if(document.getElementById("searchSpinner").style.display="none",!i.results||i.results.length===0){t.innerHTML='<div class="tmdb-loading">No results yet…</div>';return}const s=i.results.slice(0,6);t.innerHTML=s.map(n=>{const a=n.release_date?n.release_date.slice(0,4):"?",r=n.poster_path?`<img class="tmdb-result-poster" src="https://image.tmdb.org/t/p/w92${n.poster_path}" alt="">`:'<div class="tmdb-result-poster-placeholder">NO IMG</div>',d=(n.overview||"").slice(0,100)+((n.overview||"").length>100?"…":"");return`<div class="tmdb-result" onclick="tmdbSelect(${n.id}, '${n.title.replace(/'/g,"\\'").replace(/"/g,'\\"')}')">
          ${r}
          <div class="tmdb-result-info">
            <div class="tmdb-result-title">${n.title}</div>
            <div class="tmdb-result-meta">${a}${n.vote_average?" · "+n.vote_average.toFixed(1)+" TMDB":""}</div>
            <div class="tmdb-result-overview">${d}</div>
          </div>
        </div>`}).join("")}catch{document.getElementById("searchSpinner").style.display="none",t.innerHTML='<div class="tmdb-error">Search failed — check connection.</div>'}},280)}async function ot(e,t){document.getElementById("tmdb-results").innerHTML='<div class="tmdb-loading">Loading film details…</div>';try{const[o,i]=await Promise.all([fetch(`${Ee}/movie/${e}?api_key=${Me}`),fetch(`${Ee}/movie/${e}/credits?api_key=${Me}`)]),s=await o.json(),n=await i.json(),a=s.release_date?parseInt(s.release_date.slice(0,4)):null,r=s.poster_path?`https://image.tmdb.org/t/p/w185${s.poster_path}`:null,d=n.crew.filter(g=>g.job==="Director").map(g=>g.name),c=n.crew.filter(g=>["Screenplay","Writer","Story","Original Story","Novel"].includes(g.job)).map(g=>g.name).filter((g,l,u)=>u.indexOf(g)===l),p=n.cast||[],m=p.slice(0,8);oe=p;const b=s.production_companies||[];f._tmdbId=e,f._tmdbDetail=s,f.year=a,f._allDirectors=d,f._allWriters=c,f._posterUrl=r,A={},m.forEach(g=>{A[g.id]={actor:g,checked:!0}}),Y={},b.forEach(g=>{Y[g.id]={company:g,checked:!0}}),document.getElementById("tmdb-film-header").innerHTML=`
      ${r?`<img src="${r}" style="width:80px;border-radius:4px;flex-shrink:0" alt="">`:""}
      <div>
        <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;line-height:1.1">${s.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim);margin-top:4px">${a||""} · ${s.runtime?s.runtime+" min":""}</div>
        <div style="font-size:13px;color:var(--dim);margin-top:8px;max-width:480px;line-height:1.5">${(s.overview||"").slice(0,200)}${s.overview&&s.overview.length>200?"…":""}</div>
      </div>`,document.getElementById("curate-directors").textContent=d.join(", ")||"Unknown",document.getElementById("curate-writers").textContent=c.join(", ")||"Unknown",it(m),so(b),document.getElementById("tmdb-search-phase").style.display="none",document.getElementById("tmdb-results").innerHTML="",document.getElementById("tmdb-curation-phase").style.display="block"}catch{document.getElementById("tmdb-results").innerHTML='<div class="tmdb-error">Failed to load film details. Try again.</div>'}}function it(e){const t=document.getElementById("curate-cast");t.innerHTML=`<div class="cast-grid">
    ${e.map(o=>{const i=A[o.id],s=i?i.checked:!0,n=o.profile_path?`<img class="cast-photo" src="https://image.tmdb.org/t/p/w45${o.profile_path}" alt="">`:'<div class="cast-photo" style="background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:14px">👤</div>';return`<div class="cast-item ${s?"checked":"unchecked"}" onclick="toggleCast(${o.id})" id="castItem_${o.id}">
        <div class="cast-check">${s?"✓":""}</div>
        ${n}
        <div>
          <div class="cast-name">${o.name}</div>
          <div class="cast-character">${o.character||""}</div>
        </div>
      </div>`}).join("")}
  </div>`}function nt(e){A[e]&&(A[e].checked=!A[e].checked);const t=document.getElementById("castItem_"+e),o=A[e].checked;t.className="cast-item "+(o?"checked":"unchecked"),t.querySelector(".cast-check").textContent=o?"✓":""}async function st(){const e=document.getElementById("moreCastBtn");e.textContent="Loading…",e.disabled=!0,oe.slice(8,20).forEach(i=>{A[i.id]||(A[i.id]={actor:i,checked:!1})});const o=oe.slice(0,20);it(o),e.textContent="+ More cast",e.disabled=!1,oe.length<=20&&(e.style.display="none")}function so(e){document.getElementById("curate-companies").innerHTML=`<div class="company-chips">
    ${e.map(t=>`
      <div class="company-chip checked" onclick="toggleCompany(${t.id})" id="companyChip_${t.id}">${t.name}</div>
    `).join("")}
    ${e.length===0?'<span style="font-size:13px;color:var(--dim)">None listed</span>':""}
  </div>`}function at(e){Y[e].checked=!Y[e].checked;const t=document.getElementById("companyChip_"+e);t.className="company-chip "+(Y[e].checked?"checked":"unchecked")}function rt(){se=null,document.getElementById("tmdb-search-phase").style.display="block",document.getElementById("tmdb-curation-phase").style.display="none",document.getElementById("tmdb-results").innerHTML=""}function lt(){const e=f._allDirectors||[],t=f._allWriters||[],o=Object.values(A).filter(s=>s.checked).map(s=>s.actor.name),i=Object.values(Y).filter(s=>s.checked).map(s=>s.company.name);f.title=f._tmdbDetail.title,f.director=e.join(", "),f.writer=t.join(", "),f.cast=o.join(", "),f.productionCompanies=i.join(", "),lo(),de(2)}let se=null;function ao(e){se=e}function ro(e){const t=[...y].filter(n=>n.scores[e]!=null).sort((n,a)=>a.scores[e]-n.scores[e]),o=t.length,i=[t[Math.floor(o*.05)],t[Math.floor(o*.25)],t[Math.floor(o*.5)],t[Math.floor(o*.75)],t[Math.floor(o*.95)]].filter(Boolean),s=new Set;return i.filter(n=>s.has(n.title)?!1:(s.add(n.title),!0))}function lo(){const e=document.getElementById("calibrationCategories");e.innerHTML=w.map(t=>{const o=ro(t.key),i=se?.[t.key]??f.scores[t.key]??50;return`<div class="category-section" id="catSection_${t.key}">
      <div class="cat-header">
        <div class="cat-name">${t.label}</div>
        <div class="cat-weight">Weight ×${t.weight} of 17</div>
      </div>
      <div class="cat-question">${t.question}</div>
      ${o.length>0?`
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Reference films — click to anchor your score:</div>
      <div class="anchor-row">
        ${o.map(s=>`
          <div class="anchor-film" onclick="selectAnchor('${t.key}', ${s.scores[t.key]}, this)">
            <div class="anchor-film-title">${s.title}</div>
            <div class="anchor-film-score">${t.label}: ${s.scores[t.key]}</div>
          </div>`).join("")}
      </div>`:""}
      <div class="slider-section">
        <div class="slider-label-row">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px">Your score</div>
          <div>
            <span class="slider-val" id="sliderVal_${t.key}">${i}</span>
            <span class="slider-desc" id="sliderDesc_${t.key}" style="margin-left:8px">${V(i)}</span>
          </div>
        </div>
        <input type="range" min="1" max="100" value="${i}" id="slider_${t.key}"
          style="background:linear-gradient(to right,rgba(180,50,40,0.45) 0%,rgba(180,50,40,0.45) 15%,var(--rule) 15%,var(--rule) 85%,rgba(40,130,60,0.45) 85%,rgba(40,130,60,0.45) 100%)"
          oninput="updateSlider('${t.key}', this.value)">
        <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-top:2px">
          <span>1 — No worse exists</span><span>50 — Solid</span><span>100 — No better exists</span>
        </div>
      </div>
    </div>`}).join(""),w.forEach(t=>{f.scores[t.key]=se?.[t.key]??f.scores[t.key]??50})}window.selectAnchor=function(e,t,o){o.closest(".anchor-row").querySelectorAll(".anchor-film").forEach(n=>n.classList.remove("selected")),o.classList.add("selected");const i=f.scores[e]??50,s=Math.round((i+t)/2);document.getElementById("slider_"+e).value=s,updateSlider(e,s)};window.updateSlider=function(e,t){t=parseInt(t),f.scores[e]=t,document.getElementById("sliderVal_"+e).textContent=t,document.getElementById("sliderDesc_"+e).textContent=V(t)};function ct(){co(),de(3)}let F=[],P=0,ae=[];function co(){F=[],ae=[],w.forEach(e=>{const t=f.scores[e.key];if(!t)return;y.filter(i=>i.scores[e.key]!=null&&Math.abs(i.scores[e.key]-t)<=3).sort((i,s)=>Math.abs(i.scores[e.key]-t)-Math.abs(s.scores[e.key]-t)).slice(0,1).forEach(i=>F.push({cat:e,film:i}))}),F=F.slice(0,6),P=0,xe()}function xe(){const e=document.getElementById("hthContainer");if(F.length===0||P>=F.length){e.innerHTML=`<div style="text-align:center;padding:40px;color:var(--dim);font-style:italic">
      No close comparisons needed — your scores are clearly differentiated. Click Continue.
    </div>`;return}const{cat:t,film:o}=F[P],i=f.scores[t.key];e.innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">
      Comparison ${P+1} of ${F.length} &nbsp;·&nbsp; ${t.label} (×${t.weight})
    </div>
    <div class="hth-prompt">Which has the better <em>${t.label.toLowerCase()}</em>?</div>
    <div class="hth-row">
      <div class="hth-card" onclick="hthChoice('new', '${t.key}', ${o.scores[t.key]})">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">New film</div>
        <div class="hth-title">${f.title}</div>
        <div class="hth-score">${i}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${V(i)}</div>
      </div>
      <div class="hth-vs">vs</div>
      <div class="hth-card" onclick="hthChoice('existing', '${t.key}', ${o.scores[t.key]})">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">From your list</div>
        <div class="hth-title">${o.title}</div>
        <div class="hth-score">${o.scores[t.key]}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${V(o.scores[t.key])}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:center;align-items:center;gap:24px;margin-top:4px">
      ${P>0?'<span class="hth-skip" onclick="hthUndo()">← Undo</span>':""}
      <span class="hth-skip" onclick="hthSkip()">They're equal / skip this one</span>
    </div>
  `}window.hthChoice=function(e,t,o){ae.push({idx:P,scores:{...f.scores}});const i=f.scores[t];e==="new"&&i<=o?f.scores[t]=o+1:e==="existing"&&i>=o&&(f.scores[t]=o-1),P++,xe()};window.hthSkip=function(){ae.push({idx:P,scores:{...f.scores}}),P++,xe()};window.hthUndo=function(){if(ae.length===0)return;const e=ae.pop();P=e.idx,f.scores=e.scores,xe()};function dt(){po(),de(4)}function po(){const e=J(f.scores);f.total=e;const t=[...y,f].sort((i,s)=>s.total-i.total),o=t.indexOf(f)+1;document.getElementById("resultCard").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">
      Would rank #${o} of ${y.length+1}
    </div>
    <div class="result-film-title">${f.title}</div>
    <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim);margin-bottom:12px">${f.year||""} ${f.director?"· "+f.director:""}</div>
    <div class="result-total">${e}</div>
    <div class="result-label">${V(e)}</div>
    <div class="result-grid">
      ${w.map(i=>`
        <div class="result-cat">
          <div class="result-cat-name">${i.label} ×${i.weight}</div>
          <div class="result-cat-val ${G(f.scores[i.key]||0)}">${f.scores[i.key]||"—"}</div>
        </div>`).join("")}
    </div>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--rule)">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px">Where it lands</div>
      ${[-2,-1,0,1,2].map(i=>{const s=o+i;if(s<1||s>t.length)return"";const n=t[s-1],a=n===f,r=a?e:n.total,d=(Math.round(r*10)/10).toFixed(1);return a?`<div style="display:flex;align-items:center;gap:12px;padding:9px 12px;background:var(--ink);margin:2px 0">
            <span style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.45);min-width:20px;text-align:right">${s}</span>
            <span style="font-family:'Playfair Display',serif;font-weight:700;font-style:italic;flex:1;color:white;font-size:14px">${n.title}</span>
            <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:white">${d}</span>
          </div>`:`<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid var(--rule);margin:0">
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);min-width:20px;text-align:right">${s}</span>
          <span style="font-family:'Playfair Display',serif;font-weight:700;flex:1;color:var(--ink);font-size:14px">${n.title}</span>
          <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${d}</span>
        </div>`}).join("")}
    </div>
  `}function pt(){f.total=J(f.scores),y.push({title:f.title,year:f.year,total:f.total,director:f.director,writer:f.writer,cast:f.cast,productionCompanies:f.productionCompanies||"",poster:f._tmdbDetail?.poster_path||null,overview:f._tmdbDetail?.overview||"",scores:{...f.scores}}),U(),D(()=>Promise.resolve().then(()=>ee),void 0).then(e=>e.updateStorageStatus()),f={title:"",year:null,director:"",writer:"",cast:"",productionCompanies:"",scores:{}},A={},Y={},oe=[],se=null,document.getElementById("f-search").value="",document.getElementById("tmdb-results").innerHTML="",document.getElementById("tmdb-search-phase").style.display="block",document.getElementById("tmdb-curation-phase").style.display="none",document.getElementById("moreCastBtn").style.display="",de(1),q(),document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active")),document.getElementById("rankings").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".nav-btn")[0].classList.add("active")}const mo=Object.freeze(Object.defineProperty({__proto__:null,confirmTmdbData:lt,goToStep:et,goToStep3:ct,goToStep4:dt,liveSearch:tt,prefillWithPrediction:ao,resetToSearch:rt,saveFilm:pt,showMoreCast:st,tmdbSelect:ot,toggleCast:nt,toggleCompany:at},Symbol.toStringTag,{value:"Module"}));function fo(){if(!x){D(()=>Promise.resolve().then(()=>no),void 0).then(e=>e.launchOnboarding());return}mt()}function mt(){if(!x)return;const e=x.weights||{},t=Math.max(...Object.values(e));document.getElementById("archetypeModalContent").innerHTML=`
    <button class="modal-close" onclick="closeArchetypeModal()">×</button>
    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:6px">Your archetype</div>
    <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:32px;font-weight:900;color:var(--blue);margin-bottom:4px">${x.archetype||"—"}</div>
    ${x.archetype_secondary?`<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:4px">Secondary: ${x.archetype_secondary}</div>`:""}
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-bottom:28px">${x.username||""}</div>

    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--rule)">
      Weighting formula <span style="font-weight:400;font-style:italic;letter-spacing:0;text-transform:none"> — edit to customize</span>
    </div>

    <div id="archetype-weights-form">
      ${w.map(o=>{const i=e[o.key]||1,s=Math.round(i/t*100);return`<div class="archetype-weight-row">
          <div class="archetype-weight-label">${o.label}</div>
          <div class="archetype-weight-bar-wrap"><div class="archetype-weight-bar" id="awbar_${o.key}" style="width:${s}%"></div></div>
          <input class="archetype-weight-input" type="number" min="1" max="10" value="${i}"
            id="awval_${o.key}" oninput="previewWeight('${o.key}', this.value)">
        </div>`}).join("")}
    </div>

    <div class="btn-row" style="margin-top:24px">
      <button class="btn btn-outline" onclick="resetArchetypeWeights()">Reset to archetype</button>
      <button class="btn btn-primary" onclick="saveArchetypeWeights()">Apply weights</button>
    </div>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--rule);text-align:center">
      <span onclick="logOutUser()" style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--dim);cursor:pointer;text-decoration:underline">Sign out</span>
    </div>
  `,document.getElementById("archetypeModal").classList.add("open")}function ft(e,t){const o=w.map(s=>({key:s.key,val:parseFloat(document.getElementById("awval_"+s.key)?.value)||1})),i=Math.max(...o.map(s=>s.val));o.forEach(s=>{const n=document.getElementById("awbar_"+s.key);n&&(n.style.width=Math.round(s.val/i*100)+"%")})}function yo(){if(!x||!x.archetype)return;const e=Z[x.archetype]?.weights;e&&(w.forEach(t=>{const o=document.getElementById("awval_"+t.key);o&&(o.value=e[t.key]||1)}),ft())}function uo(){const e={};w.forEach(t=>{const o=parseFloat(document.getElementById("awval_"+t.key)?.value);e[t.key]=isNaN(o)||o<1?1:Math.min(10,o)}),x.weights=e,D(()=>Promise.resolve().then(()=>Ve),void 0).then(t=>t.saveUserLocally()),le(),q(),U(),yt()}window.logOutUser=function(){confirm("Sign out? Your data is saved to the cloud under your username.")&&(localStorage.clear(),location.reload())};function yt(e){(!e||e.target===document.getElementById("archetypeModal"))&&document.getElementById("archetypeModal").classList.remove("open")}const C=["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"],ut={plot:"Plot",execution:"Execution",acting:"Acting",production:"Production",enjoyability:"Enjoyability",rewatchability:"Rewatchability",ending:"Ending",uniqueness:"Uniqueness"},go={plot:"Plot",execution:"Exec",acting:"Acting",production:"Prod",enjoyability:"Enjoy",rewatchability:"Rewatch",ending:"Ending",uniqueness:"Unique"};function vo(e,t,o=220){const i=C.length,s=o/2,n=o/2,a=o*.36,r=k=>k/i*Math.PI*2-Math.PI/2,d=(k,_)=>({x:s+a*_*Math.cos(r(k)),y:n+a*_*Math.sin(r(k))}),c=[.25,.5,.75,1].map(k=>`<polygon points="${C.map(($,K)=>`${d(K,k).x},${d(K,k).y}`).join(" ")}" fill="none" stroke="var(--rule)" stroke-width="0.75"/>`).join(""),p=C.map((k,_)=>{const $=d(_,1);return`<line x1="${s}" y1="${n}" x2="${$.x}" y2="${$.y}" stroke="var(--rule)" stroke-width="0.75"/>`}).join(""),m=Math.max(...C.map(k=>e[k]||1)),g=`<polygon points="${C.map((k,_)=>{const $=d(_,(e[k]||1)/m);return`${$.x},${$.y}`}).join(" ")}" fill="var(--blue)" fill-opacity="0.12" stroke="var(--blue)" stroke-width="1.5" stroke-linejoin="round"/>`;let l="";if(t){const k=Math.max(...C.map($=>t[$]||1));l=`<polygon points="${C.map(($,K)=>{const Le=d(K,(t[$]||1)/k);return`${Le.x},${Le.y}`}).join(" ")}" fill="none" stroke="var(--dim)" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.45"/>`}const u=C.map((k,_)=>{const $=d(_,(e[k]||1)/m);return`<circle cx="${$.x}" cy="${$.y}" r="2.5" fill="var(--blue)"/>`}).join(""),v=22,M=C.map((k,_)=>{const $=d(_,1+v/a),K=$.x<s-5?"end":$.x>s+5?"start":"middle";return`<text x="${$.x}" y="${$.y}" font-family="'DM Mono',monospace" font-size="8.5" fill="var(--dim)" text-anchor="${K}" dominant-baseline="middle">${go[k]}</text>`}).join(""),E=36;return`<svg width="${o+E*2}" height="${o+E*2}" viewBox="${-E} ${-E} ${o+E*2} ${o+E*2}" style="overflow:visible;display:block">
    ${c}${p}${l}${g}${u}${M}
  </svg>`}function ho(e){return e.length?C.map(t=>{const o=e.filter(a=>a.scores?.[t]!=null),i=o.length?o.reduce((a,r)=>a+r.scores[t],0)/o.length:null,s=i!=null?i.toFixed(1):"—",n=i??0;return`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);width:88px;flex-shrink:0">${ut[t]}</div>
      <div style="flex:1;height:2px;background:var(--rule);position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;height:100%;background:var(--blue);width:${n}%"></div>
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--ink);width:28px;text-align:right">${s}</div>
    </div>`}).join(""):`<p style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim)">No films rated yet.</p>`}function xo(e){return e==null?"rgba(12,11,9,0.65)":e>=90?"#C4922A":e>=80?"#1F4A2A":e>=70?"#4A5830":e>=60?"#6B4820":"rgba(12,11,9,0.65)"}function bo(e){const t=[...e].sort((o,i)=>i.total-o.total).slice(0,5);return t.length?t.map((o,i)=>{const s=o.poster?`<img style="width:34px;height:51px;object-fit:cover;display:block;flex-shrink:0" src="https://image.tmdb.org/t/p/w92${o.poster}" alt="" loading="lazy">`:'<div style="width:34px;height:51px;background:var(--cream);flex-shrink:0"></div>',n=o.total!=null?(Math.round(o.total*10)/10).toFixed(1):"—";return`
      <div style="display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--rule);min-height:63px;cursor:pointer;transition:background 0.12s"
           onclick="openModal(${y.indexOf(o)})"
           onmouseover="this.style.background='var(--cream)'"
           onmouseout="this.style.background=''">
        <div style="display:flex;align-items:center;justify-content:center;padding:4px 6px 4px 0;height:63px;flex-shrink:0">${s}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--rule-dark);width:24px;flex-shrink:0;text-align:center">${i+1}</div>
        <div style="flex:1">
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;font-weight:700;line-height:1.2;color:var(--ink)">${o.title}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:3px">${o.year||""}${o.director?" · "+o.director.split(",")[0]:""}</div>
        </div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:white;padding:4px 11px 3px;background:${xo(o.total)};border-radius:4px;flex-shrink:0">${n}</div>
      </div>
    `}).join(""):`<p style="font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dim)">Rate some films to see your signature picks.</p>`}function wo(e,t){const o=[...t].sort((n,a)=>a.total-n.total).slice(0,3),i=t.length?(t.reduce((n,a)=>n+a.total,0)/t.length).toFixed(1):"—",s=Z[e.archetype]||{};return`
    <div style="width:320px;border:1px solid var(--ink);background:var(--paper);overflow:hidden">
      <div style="background:var(--surface-dark);padding:20px 24px 20px;border-bottom:3px solid ${s.palette||"#3d5a80"}">
        <div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:14px">palate map</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:28px;color:var(--on-dark);line-height:1;margin-bottom:4px">${e.display_name}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);margin-bottom:14px">${e.username}</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:22px;color:${s.palette||"var(--on-dark)"};margin-bottom:4px">${e.archetype}</div>
        ${e.archetype_secondary?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim)">+ ${e.archetype_secondary}</div>`:""}
      </div>
      <div style="padding:16px 24px">
        <div style="font-family:'DM Sans',sans-serif;font-size:11px;line-height:1.65;color:var(--dim);margin-bottom:12px">${s.description||""}</div>
      <div style="border-top:1px solid var(--rule);padding-top:12px;margin-bottom:4px">
        ${o.map(n=>`<div style="font-family:'DM Sans',sans-serif;font-size:11px;color:var(--ink);margin-bottom:5px;display:flex;justify-content:space-between"><span>${n.title}</span><span style="color:var(--dim);font-family:'DM Mono',monospace;font-size:10px">${n.total}</span></div>`).join("")}
      </div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--rule);font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);display:flex;justify-content:space-between">
        <span>${t.length} films</span>
        <span>avg ${i}</span>
        <span>palatemap.com</span>
      </div>
      </div>
    </div>
  `}function Te(){const e=document.getElementById("profileContent");if(!e)return;const t=x;if(!t){e.innerHTML='<p style="color:var(--dim)">Sign in to view your profile.</p>';return}const o=Z[t.archetype]||{},i=t.weights||{},s=o.weights||null,n=y,a=C.map(c=>{const p=n.filter(m=>m.scores?.[c]!=null);return{c,avg:p.length?p.reduce((m,b)=>m+b.scores[c],0)/p.length:0}}),r=n.length?[...a].sort((c,p)=>p.avg-c.avg)[0]:null,d=n.length?(n.reduce((c,p)=>c+p.total,0)/n.length).toFixed(1):"—";e.innerHTML=`
    <div style="max-width:760px;margin:0 auto">

      <!-- HEADER -->
      <div style="margin-bottom:36px;padding-bottom:28px;border-bottom:2px solid var(--ink)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);margin-bottom:12px">taste profile</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(36px,5vw,56px);line-height:1;color:var(--ink);margin-bottom:10px">${t.display_name}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:0.5px">${t.username} &nbsp;·&nbsp; ${t.archetype}${t.archetype_secondary?" &nbsp;+&nbsp; "+t.archetype_secondary:""}</div>
      </div>

      <!-- ARCHETYPE -->
      <div style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--rule)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:16px">Palate</div>
        <div style="background:var(--surface-dark);padding:28px 32px;margin-bottom:20px;border-top:3px solid ${o.palette||"#3d5a80"}">
          <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:10px">primary</div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:40px;color:${o.palette||"var(--on-dark)"};line-height:1;margin-bottom:14px">${t.archetype}</div>
          ${t.archetype_secondary?`
          <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:6px;margin-top:16px">secondary</div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:var(--on-dark);opacity:0.75">${t.archetype_secondary}</div>`:""}
        </div>
        <p style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.75;color:var(--ink);margin:0 0 10px;max-width:520px">${o.description||""}</p>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:0.5px;margin-bottom:16px">${o.quote||""}</div>
        <span onclick="openArchetypeModal()" style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--blue);cursor:pointer;text-decoration:underline">Edit weights →</span>
      </div>

      <!-- TASTE FINGERPRINT -->
      <div style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--rule)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:24px">Taste Fingerprint</div>
        <div style="display:flex;gap:48px;align-items:flex-start;flex-wrap:wrap">
          <div style="flex-shrink:0">
            ${vo(i,s)}
            <div style="display:flex;gap:16px;justify-content:center;margin-top:8px;font-family:'DM Mono',monospace;font-size:9px;color:var(--dim)">
              <span style="display:flex;align-items:center;gap:5px">
                <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="var(--blue)" stroke-width="1.5"/></svg>yours
              </span>
              <span style="display:flex;align-items:center;gap:5px">
                <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="var(--dim)" stroke-width="1" stroke-dasharray="3,2"/></svg>archetype
              </span>
            </div>
          </div>
          <div style="flex:1;min-width:200px;padding-top:12px">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:16px">avg score by category</div>
            ${ho(n)}
          </div>
        </div>
        ${n.length>0?`
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:24px;border-top:2px solid var(--ink)">
          <div style="padding:16px 20px 16px 0;border-right:1px solid var(--rule)">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Films rated</div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:40px;color:var(--ink);line-height:1;letter-spacing:-1px">${n.length}</div>
          </div>
          <div style="padding:16px 20px;border-right:1px solid var(--rule)">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Avg total</div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:40px;color:var(--ink);line-height:1;letter-spacing:-1px">${d}</div>
          </div>
          ${r?`<div style="padding:16px 0 16px 20px">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Strongest</div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:32px;color:var(--blue);line-height:1;letter-spacing:-1px">${ut[r.c]}</div>
          </div>`:""}
        </div>`:""}
      </div>

      <!-- SIGNATURE FILMS -->
      <div style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--rule)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:20px">Signature Films</div>
        ${bo(n)}
      </div>

      <!-- CANON CARD -->
      <div style="margin-bottom:40px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Your Palate Map Card</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--dim);margin-bottom:20px">Screenshot to share.</div>
        ${wo(t,n)}
      </div>

      <!-- SIGN OUT -->
      <div style="padding-top:20px;padding-bottom:40px;border-top:1px solid var(--rule);text-align:center">
        <span onclick="logOutUser()" style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--dim);cursor:pointer;text-decoration:underline">Sign out</span>
      </div>

    </div>
  `}function gt(e){document.querySelectorAll(".screen").forEach(t=>t.classList.remove("active")),document.getElementById(e).classList.add("active"),document.querySelectorAll(".nav-btn").forEach(t=>t.classList.remove("active")),event.target.classList.add("active"),e==="analysis"&&_e(),e==="calibration"&&Be(),e==="predict"&&Ke(),e==="profile"&&Te(),localStorage.setItem("ledger_last_screen",e)}function ze(){const e=document.getElementById("storageStatus");e&&(y.length>0?(e.textContent=`✓ ${y.length} films · saved`,e.style.color="var(--green)"):(e.textContent="no films yet",e.style.color="var(--dim)"))}function Ae(){const e=x;if(!e)return;const t=document.getElementById("mastheadLeft");t.innerHTML=`<span class="profile-chip" onclick="document.getElementById('nav-profile').click()">
    <strong style="color:var(--ink);font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.5px">${e.display_name}</strong>
  </span>`}function vt(){const e=new Blob([JSON.stringify(y,null,2)],{type:"application/json"}),t=document.createElement("a");t.href=URL.createObjectURL(e),t.download="film_rankings.json",t.click()}function ht(){confirm("Clear all your films and start fresh? This cannot be undone.")&&(localStorage.removeItem("filmRankings_v1"),localStorage.removeItem("ledger_user"),location.reload())}function xt(){const e=document.getElementById("cold-landing");e?e.style.display="flex":he()}window.startFromLanding=function(){const e=document.getElementById("cold-landing");e&&(e.style.display="none"),he()};async function ko(){Ct(),_t(),Ye(),x?(ie("syncing"),Ae(),le(),We(x.id).catch(()=>ie("error"))):(ie("local"),setTimeout(()=>xt(),400)),q(),ze();const e=localStorage.getItem("ledger_last_screen"),t=e==="explore"?"analysis":e;if(t&&t!=="rankings"&&document.getElementById(t)){const o=document.querySelectorAll(".nav-btn");o.forEach(i=>i.classList.remove("active")),document.querySelectorAll(".screen").forEach(i=>i.classList.remove("active")),document.getElementById(t).classList.add("active"),o.forEach(i=>{i.getAttribute("onclick")?.includes(t)&&i.classList.add("active")}),t==="analysis"&&_e(),t==="profile"&&Te()}}function ie(e){const t=document.getElementById("cloudDot"),o=document.getElementById("cloudLabel");t.className="cloud-dot",e==="syncing"?(t.classList.add("syncing"),o.textContent="syncing…"):e==="synced"?(t.classList.add("synced"),o.textContent=x?x.display_name:"synced"):e==="error"?(t.classList.add("error"),o.textContent="offline"):o.textContent="local"}window.__ledger={showScreen:gt,sortBy:He,openModal:At,closeModal:jt,exploreEntity:Ot,renderExploreIndex:De,renderAnalysis:_e,initPredict:Ke,predictSearch:Qe,predictSearchDebounce:Nt,predictSelectFilm:Ht,predictAddToList:Vt,startCalibration:Xt,selectCalCat:Jt,selectCalInt:Kt,applyCalibration:eo,resetCalibration:Be,launchOnboarding:he,liveSearch:tt,tmdbSelect:ot,toggleCast:nt,showMoreCast:st,toggleCompany:at,resetToSearch:rt,confirmTmdbData:lt,goToStep3:ct,goToStep4:dt,saveFilm:pt,goToStep:et,renderProfile:Te,setViewMode:Ne,showSyncPanel:fo,openArchetypeModal:mt,closeArchetypeModal:yt,previewWeight:ft,resetArchetypeWeights:yo,saveArchetypeWeights:uo,exportData:vt,resetStorage:ht,updateStorageStatus:ze,updateMastheadProfile:Ae,setCloudStatus:ie};const $o=["showScreen","sortBy","openModal","closeModal","exploreEntity","renderExploreIndex","initPredict","predictSearch","predictSearchDebounce","predictSelectFilm","predictAddToList","startCalibration","selectCalCat","selectCalInt","applyCalibration","resetCalibration","launchOnboarding","liveSearch","tmdbSelect","toggleCast","showMoreCast","toggleCompany","resetToSearch","confirmTmdbData","goToStep3","goToStep4","saveFilm","goToStep","renderProfile","setViewMode","showSyncPanel","openArchetypeModal","closeArchetypeModal","previewWeight","resetArchetypeWeights","saveArchetypeWeights","exportData","resetStorage","renderAnalysis"];$o.forEach(e=>{window[e]=window.__ledger[e]});ko();const ee=Object.freeze(Object.defineProperty({__proto__:null,exportData:vt,resetStorage:ht,setCloudStatus:ie,showColdLanding:xt,showScreen:gt,updateMastheadProfile:Ae,updateStorageStatus:ze},Symbol.toStringTag,{value:"Module"}));export{w as C,y as M,x as c};
