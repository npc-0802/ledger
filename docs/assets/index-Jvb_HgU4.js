(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();const M=[{key:"plot",label:"Plot",weight:3,question:"How strong, original, and well-constructed is the story?"},{key:"execution",label:"Execution",weight:3,question:"Direction, cinematography, pacing — how well is it made?"},{key:"acting",label:"Acting",weight:2,question:"How effective is the overall performance?"},{key:"production",label:"Production",weight:1,question:"Score, production design, costume — the craft around the film."},{key:"enjoyability",label:"Enjoyability",weight:4,question:"The most honest question: how much did you actually enjoy it?"},{key:"rewatchability",label:"Rewatchability",weight:1,question:"Would you sit down and watch this again? How eagerly?"},{key:"ending",label:"Ending",weight:1,question:"How satisfying, earned, and well-executed is the conclusion?"},{key:"uniqueness",label:"Uniqueness",weight:2,question:"Does this feel genuinely singular? Could only this film exist this way?"}];let f=[],x=null;function ye(e){x=e}function ue(e){f.length=0,e.forEach(t=>f.push(t))}const Mt=[[90,"An all-time favorite"],[85,"Really quite exceptional"],[80,"Excellent"],[75,"Well above average"],[70,"Great"],[65,"Very good"],[60,"A cut above"],[55,"Good"],[50,"Solid"],[45,"Not bad"],[40,"Sub-par"],[35,"Multiple flaws"],[30,"Poor"],[25,"Bad"],[20,"Wouldn't watch by choice"],[15,"So bad I stopped watching"],[10,"Disgusting"],[2,"Insulting"],[0,"Unwatchable"]];function _(e){const t=[];let o=0;for(;o<e.length;)!e[o].includes(" ")&&e[o+1]&&!e[o+1].includes(" ")?(t.push(e[o]+" "+e[o+1]),o+=2):(t.push(e[o]),o++);return t}function K(e){if(e===100)return"No better exists";if(e===1)return"No worse exists";for(const[t,o]of Mt)if(e>=t)return o;return"Unwatchable"}function X(e){let t=0,o=0;for(const i of M)e[i.key]!=null&&(t+=e[i.key]*i.weight,o+=i.weight);return o>0?Math.round(t/o*100)/100:0}function ce(){f.forEach(e=>{e.total=X(e.scores)})}function Q(e){return e>=90?"s90":e>=80?"s80":e>=70?"s70":e>=60?"s60":e>=50?"s50":e>=40?"s40":"s30"}function de(){if(!x||!x.weights)return;const e=x.weights;M.forEach(t=>{e[t.key]!=null&&(t.weight=e[t.key])}),ce()}let P={key:"total",dir:"desc"},De="grid";const Et=[{key:"total",label:"Total"},{key:"plot",label:"Plot"},{key:"execution",label:"Execution"},{key:"acting",label:"Acting"},{key:"production",label:"Production"},{key:"enjoyability",label:"Enjoyability"},{key:"rewatchability",label:"Rewatchability"},{key:"ending",label:"Ending"},{key:"uniqueness",label:"Uniqueness"}];function St(e){return e==null?"badge-dim":e>=90?"badge-gold":e>=80?"badge-green":e>=70?"badge-olive":e>=60?"badge-amber":"badge-dim"}function It(){const{key:e,dir:t}=P;return e==="rank"||e==="total"?[...f].sort((o,i)=>t==="desc"?i.total-o.total:o.total-i.total):e==="title"?[...f].sort((o,i)=>t==="desc"?i.title.localeCompare(o.title):o.title.localeCompare(i.title)):[...f].sort((o,i)=>t==="desc"?(i.scores[e]||0)-(o.scores[e]||0):(o.scores[e]||0)-(i.scores[e]||0))}function We(e){De=e,N()}function Ue(e){P.key===e?P.dir=P.dir==="desc"?"asc":"desc":(P.key=e,P.dir="desc"),document.querySelectorAll(".sort-arrow").forEach(o=>o.classList.remove("active-sort"));const t=document.getElementById("sort-"+e+"-arrow")||document.getElementById("sort-"+e);if(t){const o=t.querySelector?t.querySelector(".sort-arrow"):t;o&&(o.classList.add("active-sort"),o.textContent=P.dir==="desc"?"↓":"↑")}N()}function N(){const e=document.getElementById("filmList"),t=document.getElementById("rankings"),o=document.getElementById("rankings-controls");if(f.length===0){t.classList.add("empty"),t.classList.remove("grid-mode"),document.getElementById("mastheadCount").textContent="0 films ranked",o&&(o.innerHTML=""),e.innerHTML=`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:80px 24px 40px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:28px">palate map · film</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(32px,5vw,52px);line-height:1.1;color:var(--ink);margin-bottom:20px;letter-spacing:-1px">Start with one you love.</div>
        <p style="font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.7;color:var(--dim);max-width:420px;margin:0 0 40px;font-weight:300">Search any title — we'll pull the cast, crew, and details. You score it, category by category.</p>
        <button onclick="document.querySelector('.nav-btn.action-tab').click()" style="font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;background:var(--action);color:white;border:none;padding:18px 48px;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Rate your first film →</button>
      </div>
    `;return}t.classList.remove("empty"),document.getElementById("mastheadCount").textContent=f.length+" films ranked";const i=It();De==="grid"?Dt(i,e,o,t):Ct(i,e,o,t)}function Ye(e){const t=P.key;return`<div class="rankings-toolbar">
    ${De==="grid"?`
    <div class="sort-pills">
      ${Et.map(i=>`<button class="sort-pill${t===i.key?" active":""}" onclick="sortBy('${i.key}')">${i.label}</button>`).join("")}
    </div>`:"<div></div>"}
    <div class="view-toggle">
      <button class="view-btn${e==="grid"?" active":""}" onclick="setViewMode('grid')" title="Grid view">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0" y="0" width="6" height="6" fill="currentColor"/><rect x="8" y="0" width="6" height="6" fill="currentColor"/><rect x="0" y="8" width="6" height="6" fill="currentColor"/><rect x="8" y="8" width="6" height="6" fill="currentColor"/></svg>
      </button>
      <button class="view-btn${e==="table"?" active":""}" onclick="setViewMode('table')" title="Table view">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0" y="1" width="14" height="2" fill="currentColor"/><rect x="0" y="6" width="14" height="2" fill="currentColor"/><rect x="0" y="11" width="14" height="2" fill="currentColor"/></svg>
      </button>
    </div>
  </div>`}function Dt(e,t,o,i){i.classList.add("grid-mode"),o&&(o.innerHTML=Ye("grid"));const n=["total","rank","title"].includes(P.key)?"total":P.key,s=[...f].sort((r,c)=>c.total-r.total),a=new Map(s.map((r,c)=>[r.title,c+1]));t.innerHTML=`<div class="film-grid">
    ${e.map(r=>{const c=n==="total"?r.total:r.scores?.[n]??null,l=c!=null?n==="total"?(Math.round(c*10)/10).toFixed(1):c:"—",d=St(c),p=r.poster?`<img class="film-card-poster" src="https://image.tmdb.org/t/p/w342${r.poster}" alt="" loading="lazy">`:'<div class="film-card-poster-none"></div>';return`<div class="film-card" onclick="openModal(${f.indexOf(r)})">
        <div class="film-card-poster-wrap">
          ${p}
          <div class="film-card-rank">${a.get(r.title)}</div>
          <div class="film-card-score ${d}">${l}</div>
        </div>
        <div class="film-card-meta">
          <div class="film-card-title">${r.title}</div>
          <div class="film-card-sub">${r.year||""}${r.director?" · "+r.director.split(",")[0]:""}</div>
        </div>
      </div>`}).join("")}
  </div>`}function Ct(e,t,o,i){i.classList.remove("grid-mode"),o&&(o.innerHTML=Ye("table"));const n=[...f].sort((a,r)=>r.total-a.total),s=new Map(n.map((a,r)=>[a.title,r+1]));t.innerHTML=e.map(a=>{const r=a.scores,c=s.get(a.title),l=a.total!=null?(Math.round(a.total*10)/10).toFixed(1):"—",d=a.poster?`<img class="film-poster-thumb" src="https://image.tmdb.org/t/p/w92${a.poster}" alt="" loading="lazy">`:'<div class="film-poster-none"></div>';return`<div class="film-row" onclick="openModal(${f.indexOf(a)})">
      <div class="film-poster-cell">${d}</div>
      <div class="film-rank">${c}</div>
      <div class="film-title-cell">
        <div class="film-title-main">${a.title}</div>
        <div class="film-title-sub">${a.year||""}${a.director?" · "+a.director.split(",")[0]:""}</div>
      </div>
      ${["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"].map(p=>`<div class="film-score ${r[p]?Q(r[p]):""}">${r[p]??"—"}</div>`).join("")}
      <div class="film-total">${l}</div>
    </div>`}).join("")}const _t=Object.freeze(Object.defineProperty({__proto__:null,renderRankings:N,setViewMode:We,sortBy:Ue},Symbol.toStringTag,{value:"Module"})),Bt="modulepreload",zt=function(e){return"/"+e},Oe={},B=function(t,o,i){let n=Promise.resolve();if(o&&o.length>0){let c=function(l){return Promise.all(l.map(d=>Promise.resolve(d).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),r=a?.nonce||a?.getAttribute("nonce");n=c(o.map(l=>{if(l=zt(l),l in Oe)return;Oe[l]=!0;const d=l.endsWith(".css"),p=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${p}`))return;const b=document.createElement("link");if(b.rel=d?"stylesheet":Bt,d||(b.as="script"),b.crossOrigin="",b.href=l,r&&b.setAttribute("nonce",r),document.head.appendChild(b),d)return new Promise((h,m)=>{b.addEventListener("load",h),b.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${l}`)))})}))}function s(a){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=a,window.dispatchEvent(r),!r.defaultPrevented)throw a}return n.then(a=>{for(const r of a||[])r.status==="rejected"&&s(r.reason);return t().catch(s)})},Re="palate_migrations_v1";function Tt(){let e;try{e=JSON.parse(localStorage.getItem(Re)||"{}")}catch{e={}}if(!e.fix_split_names){let t=0;f.forEach(o=>{const i=_((o.cast||"").split(",").map(s=>s.trim()).filter(Boolean)).join(", ");i!==(o.cast||"")&&(o.cast=i,t++);const n=_((o.productionCompanies||"").split(",").map(s=>s.trim()).filter(Boolean)).join(", ");n!==(o.productionCompanies||"")&&(o.productionCompanies=n,t++)}),t>0&&(Y(),console.log(`Migration fix_split_names: repaired ${t} fields.`)),e.fix_split_names=!0;try{localStorage.setItem(Re,JSON.stringify(e))}catch{}}}const Ve="filmRankings_v1";function Y(){try{localStorage.setItem(Ve,JSON.stringify(f))}catch(e){console.warn("localStorage save failed:",e)}x&&(clearTimeout(Y._syncTimer),Y._syncTimer=setTimeout(()=>{B(()=>Promise.resolve().then(()=>Ke),void 0).then(e=>e.syncToSupabase())},2e3))}function At(){try{const e=localStorage.getItem(Ve);if(!e)return;const t=JSON.parse(e);if(!Array.isArray(t)||t.length===0)return;ue(t),console.log(`Loaded ${f.length} films from localStorage`)}catch(e){console.warn("localStorage load failed:",e)}}const Lt="https://gzuuhjjedrzeqbgxhfip.supabase.co",jt="sb_publishable_OprjtxkrwknRf8jSZ7bYWg_GGqRiu4z",ge=window.supabase.createClient(Lt,jt);async function Ce(){const e=x;if(!e)return;const{setCloudStatus:t}=await B(async()=>{const{setCloudStatus:o}=await Promise.resolve().then(()=>oe);return{setCloudStatus:o}},void 0);t("syncing");try{const{error:o}=await ge.from("ledger_users").upsert({id:e.id,username:e.username,display_name:e.display_name,archetype:e.archetype,archetype_secondary:e.archetype_secondary,weights:e.weights,harmony_sensitivity:e.harmony_sensitivity||.3,movies:f,updated_at:new Date().toISOString()},{onConflict:"id"});if(o)throw o;t("synced"),pe()}catch(o){console.warn("Supabase sync error:",JSON.stringify(o)),t("error")}}async function Ge(e){const{setCloudStatus:t,updateMastheadProfile:o,updateStorageStatus:i}=await B(async()=>{const{setCloudStatus:s,updateMastheadProfile:a,updateStorageStatus:r}=await Promise.resolve().then(()=>oe);return{setCloudStatus:s,updateMastheadProfile:a,updateStorageStatus:r}},void 0),{renderRankings:n}=await B(async()=>{const{renderRankings:s}=await Promise.resolve().then(()=>_t);return{renderRankings:s}},void 0);t("syncing");try{const{data:s,error:a}=await ge.from("ledger_users").select("*").eq("id",e).single();if(a)throw a;if(s){if(ye({id:s.id,username:s.username,display_name:s.display_name,archetype:s.archetype,archetype_secondary:s.archetype_secondary,weights:s.weights,harmony_sensitivity:s.harmony_sensitivity}),s.movies&&Array.isArray(s.movies)&&s.movies.length>=f.length){const r=s.movies.map(c=>({...c,cast:_((c.cast||"").split(",").map(l=>l.trim()).filter(Boolean)).join(", "),productionCompanies:_((c.productionCompanies||"").split(",").map(l=>l.trim()).filter(Boolean)).join(", ")}));ue(r)}pe(),de(),t("synced"),o(),n(),i()}}catch(s){console.warn("Supabase load error:",s),t("error")}}function pe(){try{localStorage.setItem("ledger_user",JSON.stringify(x))}catch{}}function Je(){try{const e=localStorage.getItem("ledger_user");e&&ye(JSON.parse(e))}catch{}}const Ke=Object.freeze(Object.defineProperty({__proto__:null,loadFromSupabase:Ge,loadUserLocally:Je,saveUserLocally:pe,sb:ge,syncToSupabase:Ce},Symbol.toStringTag,{value:"Module"})),Pt=[[90,"All-time favorite"],[85,"Really exceptional"],[80,"Excellent"],[75,"Well above average"],[70,"Great"],[65,"Very good"],[60,"A cut above"],[55,"Good"],[50,"Solid"],[45,"Not bad"],[40,"Sub-par"],[35,"Multiple flaws"],[30,"Poor"],[25,"Bad"],[20,"Wouldn't watch"],[0,"Unwatchable"]];function ke(e){for(const[t,o]of Pt)if(e>=t)return o;return"Unwatchable"}let ve=null,T=!1,q={};function Ot(e){ve=e,T=!1,q={},he()}function he(){const e=ve,t=f[e],o=[...f].sort((u,g)=>g.total-u.total),i=o.indexOf(t)+1;o.filter(u=>u!==t&&Math.abs(u.total-t.total)<6).slice(0,5);const n={};M.forEach(u=>{const g=[...f].sort((v,w)=>(w.scores[u.key]||0)-(v.scores[u.key]||0));n[u.key]=g.indexOf(t)+1});const s=(u,g,v)=>`<span class="modal-meta-chip" onclick="exploreEntity('${g}','${v.replace(/'/g,"'")}')">${u}</span>`,a=_((t.director||"").split(",").map(u=>u.trim()).filter(Boolean)).map(u=>s(u,"director",u)).join(""),r=_((t.writer||"").split(",").map(u=>u.trim()).filter(Boolean)).map(u=>s(u,"writer",u)).join(""),c=_((t.cast||"").split(",").map(u=>u.trim()).filter(Boolean)).map(u=>s(u,"actor",u)).join(""),l=_((t.productionCompanies||"").split(",").map(u=>u.trim()).filter(Boolean)).map(u=>s(u,"company",u)).join(""),d=t.poster?`<div class="dark-grid" style="position:relative;display:flex;align-items:stretch;background:var(--surface-dark);margin:-40px -40px 28px;padding:28px 32px">
         <button onclick="closeModal()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--on-dark-dim);line-height:1;padding:4px 8px;transition:color 0.15s" onmouseover="this.style.color='var(--on-dark)'" onmouseout="this.style.color='var(--on-dark-dim)'">×</button>
         <img style="width:100px;height:150px;object-fit:cover;flex-shrink:0;display:block" src="https://image.tmdb.org/t/p/w342${t.poster}" alt="">
         <div style="flex:1;padding:0 40px 0 20px;display:flex;flex-direction:column;justify-content:flex-end">
           <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">Rank #${i} of ${f.length}</div>
           <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(20px,3.5vw,30px);line-height:1.1;color:var(--on-dark);letter-spacing:-0.5px;margin-bottom:8px">${t.title}</div>
           <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim)">${t.year||""}</div>
         </div>
       </div>`:`<div class="dark-grid" style="position:relative;background:var(--surface-dark);margin:-40px -40px 28px;padding:32px 40px 28px">
         <button onclick="closeModal()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--on-dark-dim);line-height:1;padding:4px 8px">×</button>
         <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">Rank #${i} of ${f.length}</div>
         <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(20px,3.5vw,30px);line-height:1.1;color:var(--on-dark);letter-spacing:-0.5px;margin-bottom:8px">${t.title}</div>
         <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-dark-dim)">${t.year||""}</div>
       </div>`,p=T?q:t.scores,b=T?X(q):t.total,h=["plot","execution","acting","production"],m=["enjoyability","rewatchability","ending","uniqueness"];function E(u,g){const v=M.filter(S=>g.includes(S.key)),w=`<div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);opacity:0.6;padding:12px 0 6px;border-bottom:1px solid var(--rule)">${u}</div>`,k=v.map(S=>{const D=p[S.key],$t=n[S.key];return T?`<div class="breakdown-row" style="align-items:center;gap:12px">
          <div class="breakdown-cat">${S.label} <span class="breakdown-wt">×${S.weight}</span></div>
          <div class="breakdown-bar-wrap" style="flex:1">
            <input type="range" min="1" max="100" value="${D||50}"
              style="width:100%;accent-color:var(--blue);cursor:pointer"
              oninput="modalUpdateScore('${S.key}', this.value)">
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;min-width:60px">
            <div class="breakdown-val ${Q(D||50)}" id="modal-edit-val-${S.key}">${D||50}</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-align:right;margin-top:2px;white-space:nowrap" id="modal-edit-lbl-${S.key}">${ke(D||50)}</div>
          </div>
        </div>`:`<div class="breakdown-row">
        <div class="breakdown-cat">${S.label} <span class="breakdown-wt">×${S.weight}</span></div>
        <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:${D||0}%"></div><div class="bar-tick" style="left:25%"></div><div class="bar-tick bar-tick-mid" style="left:50%"></div><div class="bar-tick" style="left:75%"></div></div>
        <div class="breakdown-val ${D?Q(D):""}">${D??"—"}</div>
        <div class="modal-cat-rank">#${$t}</div>
      </div>`}).join("");return w+k}const I=E("Craft",h)+E("Experience",m);document.getElementById("modalContent").innerHTML=`
    ${d}
    ${t.overview?`<div class="modal-overview">${t.overview}</div>`:""}
    <div style="margin-bottom:20px">
      ${a?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Dir.</span><div style="display:flex;flex-wrap:wrap;gap:4px">${a}</div></div>`:""}
      ${r?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Wri.</span><div style="display:flex;flex-wrap:wrap;gap:4px">${r}</div></div>`:""}
      ${c?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Cast</span><div style="display:flex;flex-wrap:wrap;gap:4px">${c}</div></div>`:""}
      ${l?`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);min-width:44px;flex-shrink:0;padding-top:5px">Prod.</span><div style="display:flex;flex-wrap:wrap;gap:4px">${l}</div></div>`:""}
    </div>
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
      <span style="font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--blue);letter-spacing:-2px" id="modal-total-display">${b}</span>
      <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)" id="modal-total-label">${K(b)}</span>
    </div>
    ${T?"":`<div id="modal-insight" style="margin-bottom:20px">
      <div class="insight-loading">
        <div class="insight-loading-label">Analysing your score <div class="insight-loading-dots"><span></span><span></span><span></span></div></div>
        <div class="insight-skeleton"></div>
        <div class="insight-skeleton s2"></div>
        <div class="insight-skeleton s3"></div>
      </div>
    </div>`}
    <div style="margin-bottom:20px">
      ${T?`<button onclick="modalSaveScores()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:var(--blue);color:white;border:none;padding:8px 18px;cursor:pointer;margin-right:8px">Save scores</button>
           <button onclick="modalCancelEdit()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:none;color:var(--dim);border:1px solid var(--rule);padding:8px 18px;cursor:pointer">Cancel</button>`:`<button onclick="modalEnterEdit()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:none;color:var(--dim);border:1px solid var(--rule);padding:6px 14px;cursor:pointer">Edit scores</button>`}
    </div>
    <div>${I}</div>
    ${T?"":(()=>{const u=[];for(let g=-2;g<=2;g++){const v=i+g;v<1||v>o.length||u.push({film:o[v-1],slotRank:v})}return u.length?`<div class="compare-section">
        <div class="compare-title">Nearby in the rankings</div>
        ${u.map(({film:g,slotRank:v})=>{const w=g===t,k=(Math.round(g.total*10)/10).toFixed(1);if(w)return`<div style="display:flex;align-items:center;gap:12px;padding:9px 12px;background:var(--ink);margin:2px 0">
              <span style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.45);min-width:20px;text-align:right">${v}</span>
              <span style="font-family:'Playfair Display',serif;font-weight:700;font-style:italic;flex:1;color:white;font-size:14px">${g.title} <span style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.5)">${g.year||""}</span></span>
              <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:white">${k}</span>
            </div>`;const S=(g.total-t.total).toFixed(1),D=S>0?"var(--green)":"var(--red)";return`<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid var(--rule);cursor:pointer" onclick="closeModal();openModal(${f.indexOf(g)})">
            <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);min-width:20px;text-align:right">${v}</span>
            <span style="font-family:'Playfair Display',serif;font-weight:700;flex:1;color:var(--ink);font-size:14px">${g.title} <span style="font-size:11px;font-weight:400;color:var(--dim)">${g.year||""}</span></span>
            <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${k}</span>
            <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:${D};min-width:36px;text-align:right">${S>0?"+":""}${S}</span>
          </div>`}).join("")}
      </div>`:""})()}
  `,document.getElementById("filmModal").classList.add("open"),localStorage.setItem("ledger_last_modal",e),T||Rt(t)}window.modalEnterEdit=function(){const e=f[ve];T=!0,q={...e.scores},he()};window.modalCancelEdit=function(){T=!1,q={},he()};window.modalUpdateScore=function(e,t){q[e]=parseInt(t);const o=document.getElementById(`modal-edit-val-${e}`);o&&(o.textContent=t,o.className=`breakdown-val ${Q(parseInt(t))}`);const i=document.getElementById(`modal-edit-lbl-${e}`);i&&(i.textContent=ke(parseInt(t)));const n=X(q),s=document.getElementById("modal-total-display");s&&(s.textContent=n);const a=document.getElementById("modal-total-label");a&&(a.textContent=ke(n))};window.modalSaveScores=function(){const e=f[ve];e.scores={...q},e.total=X(q),T=!1,q={},ce(),Y(),N(),Ce().catch(t=>console.warn("sync failed",t)),he()};async function Rt(e){const t=document.getElementById("modal-insight");if(t)try{const{getFilmInsight:o}=await B(async()=>{const{getFilmInsight:n}=await import("./insights-CcGa9zKU.js");return{getFilmInsight:n}},[]),i=await o(e);if(!document.getElementById("modal-insight"))return;t.innerHTML=`
      <div style="padding:14px 18px;background:var(--surface-dark);border-radius:6px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--on-dark-dim);margin-bottom:8px">Why this score</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.7;color:var(--on-dark)">${i}</div>
      </div>`}catch{const i=document.getElementById("modal-insight");i&&(i.style.display="none")}}function qt(e){(!e||e.target===document.getElementById("filmModal"))&&document.getElementById("filmModal").classList.remove("open")}const Qe="f5a446a5f70a9f6a16a8ddd052c121f2",qe=["director","writer","actor"];let H="directors";function W(e){return _((e||"").split(",").map(t=>t.trim()).filter(Boolean))}function Nt(e){const t={};return f.forEach(o=>{let i=[];e==="directors"?i=W(o.director):e==="writers"?i=W(o.writer):e==="actors"?i=W(o.cast):e==="companies"?i=W(o.productionCompanies):e==="years"&&(i=o.year?[String(o.year)]:[]),i.forEach(n=>{t[n]||(t[n]=[]),t[n].push(o)})}),t}function Xe(e){const t=Nt(e);return Object.entries(t).filter(([,o])=>o.length>=2).map(([o,i])=>({name:o,films:i,avg:parseFloat((i.reduce((n,s)=>n+s.total,0)/i.length).toFixed(1)),catAvgs:M.reduce((n,s)=>{const a=i.filter(r=>r.scores[s.key]!=null).map(r=>r.scores[s.key]);return n[s.key]=a.length?parseFloat((a.reduce((r,c)=>r+c,0)/a.length).toFixed(1)):null,n},{})})).sort((o,i)=>i.avg-o.avg)}function Ze(e){return e>=90?"#C4922A":e>=80?"#1F4A2A":e>=70?"#4A5830":e>=60?"#6B4820":"rgba(12,11,9,0.55)"}function _e(e){e&&(H=e);const t=["directors","writers","actors","companies","years"],o={directors:"Directors",writers:"Writers",actors:"Actors",companies:"Production Co.",years:"Years"},i=Xe(H),n=document.getElementById("explore-section");n&&(n.innerHTML=`
    <div class="explore-tabs" style="margin-bottom:24px">
      ${t.map(s=>`<button class="explore-tab ${s===H?"active":""}" onclick="renderExploreIndex('${s}')">${o[s]}</button>`).join("")}
    </div>
    ${i.length===0?`<div style="border:1.5px dashed var(--rule-dark);padding:40px 32px;text-align:center;margin:8px 0">
          <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:12px">— uncharted —</div>
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:22px;color:var(--ink);margin-bottom:8px">Terra incognita.</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dim);font-weight:300">Rate at least two films from the same ${H==="companies"?"company":H.slice(0,-1)} to map this territory.</div>
        </div>`:i.map((s,a)=>{const r=s.name.replace(/'/g,"\\'");return`<div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--rule);cursor:pointer" onclick="exploreEntity('${H==="companies"?"company":H==="years"?"year":H.slice(0,-1)}','${r}')" onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background=''">
            <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);min-width:28px;text-align:right">${a+1}</div>
            <div style="flex:1;min-width:0">
              <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:18px;font-weight:700;color:var(--ink);line-height:1.2">${s.name}</div>
              <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px">${s.films.length} film${s.films.length!==1?"s":""}</div>
            </div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:17px;color:white;padding:4px 11px 3px;background:${Ze(s.avg)};border-radius:4px;flex-shrink:0">${s.avg.toFixed(1)}</div>
          </div>`}).join("")}
  `)}function Ht(e,t){document.getElementById("filmModal").classList.remove("open"),document.querySelectorAll(".screen").forEach(m=>m.classList.remove("active")),document.getElementById("analysis").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(m=>m.classList.remove("active"));const o=document.querySelector('.nav-btn[onclick*="analysis"]');o&&o.classList.add("active"),window.scrollTo(0,0);const i=e==="director"?"directors":e==="writer"?"writers":e==="actor"?"actors":e==="year"?"years":"companies";H=i;const n=e==="director"?"Director":e==="writer"?"Writer":e==="actor"?"Actor":e==="year"?"Year":"Production Co.",s=f.filter(m=>e==="director"?W(m.director).includes(t):e==="writer"?W(m.writer).includes(t):e==="actor"?W(m.cast).includes(t):e==="company"?W(m.productionCompanies).includes(t):e==="year"?String(m.year)===t:!1).sort((m,E)=>E.total-m.total);if(s.length===0){_e();return}const a=Xe(i),r=a.findIndex(m=>m.name===t)+1,c=a.length,l=a.find(m=>m.name===t),d=l?l.avg.toFixed(1):(s.reduce((m,E)=>m+E.total,0)/s.length).toFixed(1);s[0];const p={};M.forEach(m=>{const E=a.filter(u=>u.catAvgs[m.key]!=null).sort((u,g)=>g.catAvgs[m.key]-u.catAvgs[m.key]),I=E.findIndex(u=>u.name===t)+1;p[m.key]=I>0?{rank:I,total:E.length}:null});const b=M.map(m=>{const E=s.filter(I=>I.scores[m.key]!=null).map(I=>I.scores[m.key]);return{...m,avg:E.length?parseFloat((E.reduce((I,u)=>I+u,0)/E.length).toFixed(1)):null}}),h=b.filter(m=>m.avg!=null).sort((m,E)=>E.avg-m.avg);h[0],h[h.length-1],document.getElementById("analysisContent").innerHTML=`
    <div style="max-width:800px">

      <div class="dark-grid" style="background:var(--surface-dark);margin:-40px -56px 32px;padding:40px 56px 32px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:14px">
          ${n} &nbsp;·&nbsp; <span onclick="renderAnalysis()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">← all ${i}</span>
        </div>
        <div style="display:flex;align-items:flex-end;gap:20px">
          ${qe.includes(e)||e==="company"?'<img id="explore-person-img" src="" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:50%;display:none;flex-shrink:0;border:2px solid rgba(255,255,255,0.12)">':""}
          <div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(26px,4vw,44px);color:var(--on-dark);letter-spacing:-1.5px;line-height:1.1;margin-bottom:20px">${t}</div>
            <div style="display:flex;align-items:baseline;gap:20px;flex-wrap:wrap">
              <div style="display:flex;align-items:baseline;gap:10px">
                <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(36px,5vw,52px);color:var(--on-dark);letter-spacing:-2px;line-height:1">${d}</div>
                <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--on-dark-dim);text-transform:uppercase;letter-spacing:1px">avg score</div>
              </div>
              <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--on-dark-dim)">#${r} of ${c} ${i}</div>
              <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--on-dark-dim)">${s.length} film${s.length!==1?"s":""} rated</div>
            </div>
          </div>
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

      ${h.length>0?(()=>{const m=["plot","execution","acting","production"],E=["enjoyability","rewatchability","ending","uniqueness"];function I(u,g){const v=b.filter(w=>g.includes(w.key)&&w.avg!=null);return v.length?`<div style="margin-bottom:28px">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);opacity:0.6;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--rule)">${u}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 40px">
              ${v.map(w=>{const k=p[w.key];return`<div style="border-bottom:1px solid var(--rule);padding:10px 0">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
                    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--dim)">${w.label}</div>
                    <div style="display:flex;align-items:baseline;gap:8px">
                      ${k?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim)">#${k.rank}</div>`:""}
                      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:var(--ink)">${w.avg.toFixed(1)}</div>
                    </div>
                  </div>
                  <div style="height:2px;background:var(--rule);border-radius:1px">
                    <div style="height:2px;width:${w.avg}%;background:${Ze(w.avg)};border-radius:1px"></div>
                  </div>
                </div>`}).join("")}
            </div>
          </div>`:""}return`<div style="margin-bottom:32px">
          <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:16px">Category averages</div>
          ${I("Craft",m)}
          ${I("Experience",E)}
        </div>`})():""}

      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:12px">Films</div>
      ${s.map((m,E)=>{const I=m.poster?`<img class="film-poster-thumb" src="https://image.tmdb.org/t/p/w92${m.poster}" alt="" loading="lazy">`:'<div class="film-poster-none"></div>',u=m.total!=null?(Math.round(m.total*10)/10).toFixed(1):"—";return`
        <div class="film-row" onclick="openModal(${f.indexOf(m)})" style="cursor:pointer">
          <div class="film-poster-cell">${I}</div>
          <div class="film-rank">${E+1}</div>
          <div class="film-title-cell">
            <div class="film-title-main">${m.title}</div>
            <div class="film-title-sub">${m.year||""} · ${m.director||""}</div>
          </div>
          ${["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"].map(g=>`<div class="film-score ${m.scores[g]?Q(m.scores[g]):"}"}">${m.scores[g]??"—"}</div>`).join("")}
          <div class="film-total">${u}</div>
        </div>`}).join("")}
    </div>
  `,Ut(e,t,s),qe.includes(e)?Ft(t):e==="company"&&Wt(t)}async function Ft(e){try{const i=(await(await fetch(`https://api.themoviedb.org/3/search/person?api_key=${Qe}&query=${encodeURIComponent(e)}&language=en-US`)).json()).results?.[0];if(!i?.profile_path)return;const n=document.getElementById("explore-person-img");if(!n)return;n.src=`https://image.tmdb.org/t/p/w185${i.profile_path}`,n.style.display="block"}catch{}}async function Wt(e){try{const i=(await(await fetch(`https://api.themoviedb.org/3/search/company?api_key=${Qe}&query=${encodeURIComponent(e)}`)).json()).results?.[0];if(!i?.logo_path)return;const n=document.getElementById("explore-person-img");if(!n)return;n.src=`https://image.tmdb.org/t/p/w185${i.logo_path}`,n.style.display="block",n.style.borderRadius="4px",n.style.background="white",n.style.padding="6px",n.style.objectFit="contain"}catch{}}async function Ut(e,t,o){const i=document.getElementById("explore-insight");if(i)try{const{getEntityInsight:n}=await B(async()=>{const{getEntityInsight:a}=await import("./insights-CcGa9zKU.js");return{getEntityInsight:a}},[]),s=await n(e,t,o);if(!document.getElementById("explore-insight"))return;i.innerHTML=`
      <div style="padding:18px 20px;background:var(--surface-dark);border-radius:8px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--on-dark-dim);margin-bottom:10px">Your taste in ${t}</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--on-dark)">${s}</div>
      </div>`}catch{const s=document.getElementById("explore-insight");s&&(s.style.display="none")}}function Be(){const e=i=>i.length?Math.round(i.reduce((n,s)=>n+s,0)/i.length*100)/100:null,t=M.map(i=>{const n=f.map(s=>s.scores[i.key]).filter(s=>s!=null);return{...i,avg:e(n)}});function o(i){return i>=90?"#C4922A":i>=80?"#1F4A2A":i>=70?"#4A5830":i>=60?"#6B4820":"rgba(12,11,9,0.65)"}document.getElementById("analysisContent").innerHTML=`
    <div style="max-width:900px">

      <!-- HEADER -->
      <div style="margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid var(--ink)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px">taste is everything</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(32px,4vw,48px);line-height:1;color:var(--ink);letter-spacing:-1px;margin-bottom:8px">Your taste, decoded.</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:0.5px">${f.length} film${f.length!==1?"s":""} · weighted scoring</div>
      </div>

      <!-- CATEGORY AVERAGES -->
      <div style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--rule)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:20px">Category averages · all films</div>
        ${(()=>{const i=["plot","execution","acting","production"],n=["enjoyability","rewatchability","ending","uniqueness"],s=t.filter(l=>l.avg!=null&&!isNaN(l.avg)),a=s.filter(l=>i.includes(l.key)),r=s.filter(l=>n.includes(l.key));function c(l,d){return d.length?`
              <div style="margin-bottom:24px">
                <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);opacity:0.6;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--rule)">${l}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 40px">
                  ${d.map(p=>{const b=Math.round(p.avg),h=o(p.avg);return`<div style="display:flex;align-items:center;gap:12px;padding:6px 0">
                      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);width:88px;flex-shrink:0">${p.label}</div>
                      <div style="flex:1;height:2px;background:var(--rule);position:relative">
                        <div style="position:absolute;top:0;left:0;height:100%;background:${h};width:${b}%"></div>
                      </div>
                      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:var(--ink);width:36px;text-align:right;letter-spacing:-0.5px">${p.avg}</div>
                    </div>`}).join("")}
                </div>
              </div>`:""}return c("Craft",a)+c("Experience",r)})()}
      </div>

      <!-- EXPLORE SECTION -->
      <div id="explore-section"></div>

    </div>
  `,_e()}const $e="f5a446a5f70a9f6a16a8ddd052c121f2",Me="https://api.themoviedb.org/3",Yt="https://ledger-proxy.noahparikhcott.workers.dev";let Ne=null,Z=null,Ee=null;function et(){if(f.length<10){const i=10-f.length;if(document.getElementById("predict-result").innerHTML="",document.getElementById("predict-search-results").innerHTML="",document.getElementById("predict-search").value="",document.getElementById("predict-search")?.closest(".screen")||document.getElementById("predict"),!document.getElementById("predict-lock-state")){const s=document.getElementById("predict-search")?.parentElement;s&&(s.style.display="none");const a=document.createElement("div");a.id="predict-lock-state",a.style.cssText="padding:48px 0;text-align:center;max-width:440px;margin:0 auto",a.innerHTML=`
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:16px">— uncharted —</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:32px;color:var(--ink);letter-spacing:-1px;margin-bottom:12px">Not enough data yet.</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.7;color:var(--dim);font-weight:300">Add <strong style="color:var(--ink)">${i} more film${i!==1?"s":""}</strong> to your rankings before Palate Map can predict your taste. The more you've rated, the more accurate the prediction.</div>
        <div style="margin-top:28px">
          <button onclick="document.querySelector('.nav-btn.action-tab').click()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;background:var(--action);color:white;border:none;padding:14px 32px;cursor:pointer">Rate films →</button>
        </div>
      `;const r=document.getElementById("predict");r&&r.insertBefore(a,r.firstChild)}return}const t=document.getElementById("predict-lock-state");t&&t.remove();const o=document.getElementById("predict-search")?.parentElement;o&&(o.style.display=""),document.getElementById("predict-search").value="",document.getElementById("predict-search-results").innerHTML="",document.getElementById("predict-result").innerHTML="",Z=null,setTimeout(()=>document.getElementById("predict-search")?.focus(),50)}function Vt(){clearTimeout(Ne),Ne=setTimeout(tt,500)}async function tt(){const e=document.getElementById("predict-search").value.trim();if(!e||e.length<2)return;const t=document.getElementById("predict-search-results");t.innerHTML='<div class="tmdb-loading">Searching…</div>';try{const n=((await(await fetch(`${Me}/search/movie?api_key=${$e}&query=${encodeURIComponent(e)}&language=en-US&page=1`)).json()).results||[]).slice(0,5);if(!n.length){t.innerHTML='<div class="tmdb-error">No results found.</div>';return}const s=new Set(f.map(a=>a.title.toLowerCase()));t.innerHTML=n.map(a=>{const r=a.release_date?.slice(0,4)||"",c=a.poster_path?`<img class="tmdb-result-poster" src="https://image.tmdb.org/t/p/w92${a.poster_path}">`:'<div class="tmdb-result-poster-placeholder">no img</div>',l=s.has(a.title.toLowerCase());return`<div class="tmdb-result ${l?"opacity-50":""}" onclick="${l?"":`predictSelectFilm(${a.id}, '${a.title.replace(/'/g,"\\'")}', '${r}')`}" style="${l?"opacity:0.4;cursor:default":""}">
        ${c}
        <div class="tmdb-result-info">
          <div class="tmdb-result-title">${a.title}</div>
          <div class="tmdb-result-meta">${r}${l?" · already in your list":""}</div>
          <div class="tmdb-result-overview">${(a.overview||"").slice(0,100)}${a.overview?.length>100?"…":""}</div>
        </div>
      </div>`}).join("")}catch{t.innerHTML='<div class="tmdb-error">Search failed — check connection.</div>'}}async function Gt(e,t,o){document.getElementById("predict-search-results").innerHTML="",document.getElementById("predict-search").value=t,document.getElementById("predict-result").innerHTML=`
    <div class="predict-loading">
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:var(--dim)">Analysing your taste profile…</div>
      <div class="predict-loading-label">Reading ${f.length} films · building your fingerprint · predicting scores</div>
    </div>`;let i={},n={};try{const[p,b]=await Promise.all([fetch(`${Me}/movie/${e}?api_key=${$e}`),fetch(`${Me}/movie/${e}/credits?api_key=${$e}`)]);i=await p.json(),n=await b.json()}catch{}const s=(n.crew||[]).filter(p=>p.job==="Director").map(p=>p.name).join(", "),a=(n.crew||[]).filter(p=>["Screenplay","Writer","Story"].includes(p.job)).map(p=>p.name).slice(0,2).join(", "),r=(n.cast||[]).slice(0,8).map(p=>p.name).join(", "),c=(i.genres||[]).map(p=>p.name).join(", "),l=i.overview||"",d=i.poster_path||null;Z={tmdbId:e,title:t,year:o,director:s,writer:a,cast:r,genres:c,overview:l,poster:d},await Qt(Z)}function Jt(){const e=["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"],t={};e.forEach(a=>{const r=f.filter(d=>d.scores[a]!=null).map(d=>d.scores[a]);if(!r.length){t[a]={mean:70,std:10,min:0,max:100};return}const c=r.reduce((d,p)=>d+p,0)/r.length,l=Math.sqrt(r.reduce((d,p)=>d+(p-c)**2,0)/r.length);t[a]={mean:Math.round(c*10)/10,std:Math.round(l*10)/10,min:Math.min(...r),max:Math.max(...r)}});const o=[...f].sort((a,r)=>r.total-a.total),i=o.slice(0,10).map(a=>`${a.title} (${a.total})`).join(", "),n=o.slice(-5).map(a=>`${a.title} (${a.total})`).join(", "),s=M.map(a=>`${a.label}×${a.weight}`).join(", ");return{stats:t,top10:i,bottom5:n,weightStr:s,archetype:x?.archetype,archetypeSecondary:x?.archetype_secondary,totalFilms:f.length}}function Kt(e){const t=_((e.director||"").split(",").map(i=>i.trim()).filter(Boolean)),o=_((e.cast||"").split(",").map(i=>i.trim()).filter(Boolean));return f.filter(i=>{const n=_((i.director||"").split(",").map(a=>a.trim()).filter(Boolean)),s=_((i.cast||"").split(",").map(a=>a.trim()).filter(Boolean));return t.some(a=>n.includes(a))||o.some(a=>s.includes(a))}).sort((i,n)=>n.total-i.total).slice(0,8)}async function Qt(e){const t=Jt(),o=Kt(e),i=o.length?o.map(r=>`- ${r.title} (${r.year||""}): total=${r.total}, plot=${r.scores.plot}, execution=${r.scores.execution}, acting=${r.scores.acting}, production=${r.scores.production}, enjoyability=${r.scores.enjoyability}, rewatchability=${r.scores.rewatchability}, ending=${r.scores.ending}, uniqueness=${r.scores.uniqueness}`).join(`
`):"No direct comparisons found in rated list.",n=Object.entries(t.stats).map(([r,c])=>`${r}: mean=${c.mean}, std=${c.std}, range=${c.min}–${c.max}`).join(`
`),s="You are a precise film taste prediction engine. Your job is to predict how a specific user would score an unrated film, based on their detailed rating history and taste profile. You must respond ONLY with valid JSON — no preamble, no markdown, no explanation outside the JSON.",a=`USER TASTE PROFILE:
Archetype: ${t.archetype||"unknown"} (secondary: ${t.archetypeSecondary||"none"})
Total films rated: ${t.totalFilms}
Weighting formula: ${t.weightStr}

Category score statistics (across all rated films):
${n}

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
}`;try{const d=((await(await fetch(Yt,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:s,messages:[{role:"user",content:a}]})})).json()).content?.[0]?.text||"").replace(/```json|```/g,"").trim(),p=JSON.parse(d);Ee=p,Xt(e,p,o)}catch(r){document.getElementById("predict-result").innerHTML=`
      <div class="tmdb-error">Prediction failed: ${r.message}. Check that the proxy is running and your API key is valid.</div>`}}function Xt(e,t,o){let i=0,n=0;M.forEach(l=>{const d=t.predicted_scores[l.key];d!=null&&(i+=d*l.weight,n+=l.weight)});const s=n>0?Math.round(i/n*100)/100:0,a=e.poster?`<img class="predict-poster" src="https://image.tmdb.org/t/p/w185${e.poster}" alt="${e.title}">`:`<div class="predict-poster-placeholder">${e.title}</div>`,r={high:"conf-high",medium:"conf-medium",low:"conf-low"}[t.confidence]||"conf-medium",c={high:"High confidence",medium:"Medium confidence",low:"Low confidence"}[t.confidence]||"";document.getElementById("predict-result").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:16px">Prediction</div>

    <div class="predict-film-card">
      ${a}
      <div style="flex:1">
        <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:900;letter-spacing:-0.5px;margin-bottom:2px">${e.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px">${e.year}${e.director?" · "+e.director:""}</div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <div class="predict-total-display">${s}</div>
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${K(s)}</div>
            <span class="predict-confidence ${r}">${c}</span>
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
      ${M.map(l=>{const d=t.predicted_scores[l.key];return`<div class="predict-score-cell">
          <div class="predict-score-cell-label">${l.label}</div>
          <div class="predict-score-cell-val ${d?Q(d):""}">${d??"—"}</div>
        </div>`}).join("")}
    </div>

    ${o.length>0?`
      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin:24px 0 10px">Comparisons from your list</div>
      ${o.slice(0,5).map(l=>{const d=(s-l.total).toFixed(1),p=d>0?"+":"";return`<div class="predict-comp-row" onclick="openModal(${f.indexOf(l)})">
          <div class="predict-comp-title">${l.title} <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);font-weight:400">${l.year||""}</span></div>
          <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${l.total}</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:600;${parseFloat(d)>0?"color:var(--green)":"color:var(--red)"}">${p}${d} predicted</div>
        </div>`}).join("")}
    `:""}

    <div class="btn-row" style="margin-top:32px">
      <button class="btn btn-outline" onclick="initPredict()">← New prediction</button>
      <button class="btn btn-action" onclick="predictAddToList()">Add to list & rate it →</button>
    </div>
  `}function Zt(){Z&&(document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active")),document.getElementById("add").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(e=>e.classList.remove("active")),document.querySelector('.nav-btn[onclick*="add"]').classList.add("active"),setTimeout(()=>{const e=document.getElementById("f-search");e&&(e.value=Z.title,B(()=>Promise.resolve().then(()=>xo),void 0).then(t=>{Ee?.predicted_scores&&t.prefillWithPrediction(Ee.predicted_scores),t.liveSearch(Z.title)}))},100))}let ie="all",ot="focused",G=[],A=0,C={},L={},ae=[];const eo={focused:15,thorough:30,deep:50},He=8;function to(e){ie=e,document.querySelectorAll('[id^="calcat_"]').forEach(t=>t.classList.remove("active")),document.getElementById("calcat_"+e).classList.add("active")}function oo(e){ot=e,document.querySelectorAll('[id^="calint_"]').forEach(t=>t.classList.remove("active")),document.getElementById("calint_"+e).classList.add("active")}function io(e,t){const o=[];(e==="all"?M.map(a=>a.key):[e]).forEach(a=>{const r=f.filter(c=>c.scores[a]!=null).sort((c,l)=>c.scores[a]-l.scores[a]);for(let c=0;c<r.length-1;c++)for(let l=c+1;l<r.length;l++){const d=Math.abs(r[c].scores[a]-r[l].scores[a]);if(d<=8)o.push({a:r[c],b:r[l],catKey:a,diff:d});else break}}),o.sort((a,r)=>a.diff-r.diff);const n=new Set,s=[];for(const a of o){const r=[a.a.title,a.b.title,a.catKey].join("|");n.has(r)||(n.add(r),s.push(a))}return s.sort(()=>Math.random()-.5).slice(0,t)}function no(){const e=eo[ot];if(G=io(ie,e),G.length===0){alert("Not enough films with close scores to calibrate. Try a different category or add more films.");return}A=0,C={},L={},ae=[],f.forEach(t=>{L[t.title]={...t.scores}}),document.getElementById("cal-setup").style.display="none",document.getElementById("cal-matchups").style.display="block",document.getElementById("cal-cat-label").textContent=ie==="all"?"All categories":M.find(t=>t.key===ie)?.label||ie,ze()}function ze(){if(A>=G.length){so();return}const{a:e,b:t,catKey:o}=G[A],i=G.length,n=Math.round(A/i*100);document.getElementById("cal-progress-label").textContent=`${A+1} / ${i}`,document.getElementById("cal-progress-bar").style.width=n+"%";const s=M.find(l=>l.key===o)?.label||o;L[e.title]?.[o]??e.scores[o],L[t.title]?.[o]??t.scores[o];function a(l,d){const p=l.poster?`<img style="width:100%;height:100%;object-fit:cover;display:block" src="https://image.tmdb.org/t/p/w342${l.poster}" alt="" loading="lazy">`:'<div style="width:100%;height:100%;background:var(--deep-cream)"></div>';return`
      <div class="cal-film-card" id="cal-card-${d}" onclick="calChoose('${d}')">
        <div style="aspect-ratio:2/3;overflow:hidden;background:var(--cream);position:relative;margin-bottom:12px">
          ${p}
        </div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;font-weight:700;line-height:1.3;color:var(--ink);margin-bottom:4px">${l.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim)">${l.year||""}</div>
      </div>`}const c={uniqueness:"Which is more unique?",enjoyability:"Which is more enjoyable?",execution:"Which is better executed?",acting:"Which has better acting?",plot:"Which has a better plot?",production:"Which has better production?",ending:"Which has the better ending?",rewatchability:"Which is more rewatchable?"}[o]||`Better ${s.toLowerCase()}?`;document.getElementById("cal-matchup-card").innerHTML=`
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:8px">${s}</div>
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(28px,5vw,44px);color:var(--ink);letter-spacing:-1px;line-height:1.1">${c}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:0;align-items:start">
      ${a(e,"a")}
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:16px;color:var(--dim);text-align:center;padding-top:35%">vs</div>
      ${a(t,"b")}
    </div>
    <div style="text-align:center;margin-top:24px;display:flex;justify-content:center;align-items:center;gap:24px">
      ${A>0?`<span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);cursor:pointer;text-decoration:underline;text-underline-offset:2px" onclick="undoCalChoice()">← Undo</span>`:""}
      <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);cursor:pointer;text-decoration:underline;text-underline-offset:2px;letter-spacing:0.5px" onclick="calChoose('skip')">Too close to call</span>
    </div>
  `}window.undoCalChoice=function(){if(ae.length===0)return;const e=ae.pop();A=e.idx,L=e.tempScores,C=e.deltas,ze()};window.calChoose=function(e){if(ae.push({idx:A,tempScores:JSON.parse(JSON.stringify(L)),deltas:JSON.parse(JSON.stringify(C))}),e!=="skip"){const{a:t,b:o,catKey:i}=G[A],n=L[t.title]?.[i]??t.scores[i],s=L[o.title]?.[i]??o.scores[i],a=1/(1+Math.pow(10,(s-n)/40)),r=1-a,c=e==="a"?1:0,l=1-c,d=Math.round(Math.min(100,Math.max(1,n+He*(c-a)))),p=Math.round(Math.min(100,Math.max(1,s+He*(l-r))));if(C[t.title]||(C[t.title]={}),C[o.title]||(C[o.title]={}),d!==n){const m=C[t.title][i]?.old??n;C[t.title][i]={old:m,new:d},L[t.title][i]=d}if(p!==s){const m=C[o.title][i]?.old??s;C[o.title][i]={old:m,new:p},L[o.title][i]=p}const b=document.getElementById(`cal-card-${e}`),h=document.getElementById(`cal-card-${e==="a"?"b":"a"}`);b&&(b.style.opacity="1"),h&&(h.style.opacity="0.35",h.style.transform="scale(0.97)")}A++,setTimeout(()=>ze(),e==="skip"?0:140)};function so(){document.getElementById("cal-matchups").style.display="none",document.getElementById("cal-review").style.display="block";const e=Object.entries(C).flatMap(([o,i])=>Object.entries(i).map(([n,{old:s,new:a}])=>({title:o,catKey:n,old:s,new:a}))).filter(o=>o.old!==o.new).sort((o,i)=>Math.abs(i.new-i.old)-Math.abs(o.new-o.old));if(e.length===0){document.getElementById("cal-review-header").innerHTML=`
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:36px;color:var(--ink);letter-spacing:-1px;margin-bottom:8px">Well-calibrated.</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:15px;color:var(--dim)">No meaningful inconsistencies found. Your scores are in good shape.</div>`,document.getElementById("cal-diff-list").innerHTML="",document.getElementById("cal-apply-btn").style.display="none";return}document.getElementById("cal-review-header").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:8px">here's what shifted</div>
    <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:clamp(28px,3vw,40px);color:var(--ink);letter-spacing:-1px;margin-bottom:8px">${e.length} score${e.length!==1?"s":""} recalibrated.</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dim)">Uncheck anything you want to keep. Nothing changes until you apply.</div>`,document.getElementById("cal-apply-btn").style.display="";const t={};M.forEach(o=>{t[o.key]=[]}),e.forEach((o,i)=>{t[o.catKey]&&t[o.catKey].push({...o,idx:i})}),document.getElementById("cal-diff-list").innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${M.map(o=>{const i=t[o.key],n=i.slice(0,3),s=i.length-3,a=i.length>0;return`<div style="padding:14px;background:var(--cream);border-radius:6px;${a?"":"opacity:0.45"}">
          <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:${a?"10px":"0"}">${o.label}</div>
          ${a?"":`<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--dim)">No changes</div>`}
          ${n.map((r,c)=>{const l=r.new>r.old?"var(--green)":"var(--red)";return`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;${c<n.length-1?"border-bottom:1px solid var(--rule)":""}">
              <input type="checkbox" id="caldiff_${r.idx}" checked style="flex-shrink:0;accent-color:var(--blue);width:14px;height:14px"
                data-movie-idx="${f.findIndex(d=>d.title===r.title)}" data-cat="${r.catKey}" data-old="${r.old}" data-new="${r.new}">
              <div style="flex:1;overflow:hidden">
                <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:13px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.title}</div>
              </div>
              <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);text-decoration:line-through">${r.old}</span>
                <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:${l}">${r.new}</span>
              </div>
            </div>`}).join("")}
          ${s>0?`<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:8px">+${s} more</div>`:""}
        </div>`}).join("")}
    </div>`}function ao(){try{const e=document.querySelectorAll('[id^="caldiff_"]');let t=0;e.forEach(o=>{if(!o.checked)return;const i=parseInt(o.dataset.movieIdx),n=o.dataset.cat,s=parseInt(o.dataset.new),a=f[i];a&&a.scores[n]!==void 0&&(a.scores[n]=s,a.total=X(a.scores),t++)}),ce(),Y(),B(()=>Promise.resolve().then(()=>oe),void 0).then(o=>o.updateStorageStatus()),N(),document.querySelectorAll(".screen").forEach(o=>o.classList.remove("active")),document.getElementById("rankings").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(o=>o.classList.remove("active")),document.querySelector('.nav-btn[onclick*="rankings"]').classList.add("active"),Te()}catch(e){console.error("applyCalibration error:",e)}}function Te(){G=[],A=0,C={},L={},ae=[],document.getElementById("cal-setup").style.display="block",document.getElementById("cal-matchups").style.display="none",document.getElementById("cal-review").style.display="none",document.getElementById("cal-apply-btn").style.display=""}const V={Visceralist:{palette:"#D4665A",weights:{plot:2,execution:2,acting:2,production:1,enjoyability:5,rewatchability:3,ending:1,uniqueness:1},quote:`"If I'm not feeling it, nothing else matters."`,description:"You watch with your whole body. If a film doesn't move you — actually move you — you find it hard to call it great regardless of what the craft says. Your taste is honest, unguarded, and completely your own."},Formalist:{palette:"#7AB0CF",weights:{plot:2,execution:4,acting:1,production:3,enjoyability:1,rewatchability:1,ending:1,uniqueness:3},quote:'"How you say it matters as much as what you say."',description:"You're drawn to directors who think in images. The how of filmmaking holds your attention as much as the what — sometimes more. For you, style isn't decoration; it's the argument."},Narrativist:{palette:"#D4A84B",weights:{plot:4,execution:2,acting:2,production:1,enjoyability:1,rewatchability:1,ending:3,uniqueness:1},quote:'"A great story can survive almost anything."',description:"Story is your foundation. You can forgive weak production, uneven performances, almost anything — if the story earns it. You believe a great narrative is cinema's highest achievement."},Humanist:{palette:"#E8906A",weights:{plot:2,execution:2,acting:4,production:1,enjoyability:3,rewatchability:1,ending:1,uniqueness:1},quote:'"I come for the story, I stay for the people."',description:"You come for the story and stay for the people. What moves you most is a performance that makes you forget you're watching — a fully realized human being, right there on screen."},Completionist:{palette:"#52BFA8",weights:{plot:2,execution:3,acting:1,production:1,enjoyability:1,rewatchability:1,ending:1,uniqueness:4},quote:`"I want something I've never seen before."`,description:"You've seen enough to recognize when something's been done before, and you're hungry for the genuinely new. Originality isn't a bonus for you — it's close to a requirement."},Sensualist:{palette:"#B48FD4",weights:{plot:1,execution:4,acting:1,production:4,enjoyability:1,rewatchability:1,ending:1,uniqueness:2},quote:'"Cinema is first an aesthetic experience."',description:"Cinema is, for you, first an aesthetic experience. You respond to texture, light, composition, sound design — the pure sensory architecture of a film. Some of your favorites barely need a plot."},Revisionist:{palette:"#7AB87A",weights:{plot:1,execution:2,acting:1,production:1,enjoyability:1,rewatchability:4,ending:2,uniqueness:3},quote:'"My first watch is just the beginning."',description:"Your relationship with a film deepens over time. You rewatch, reconsider, and sit with things long after the credits roll. The first watch is often just the beginning — and you've changed your mind on more films than most people have seen."},Absolutist:{palette:"#A8C0D4",weights:{plot:3,execution:2,acting:1,production:1,enjoyability:1,rewatchability:1,ending:4,uniqueness:2},quote:'"The ending is the argument."',description:"The ending is the argument. A film can be brilliant for two hours and lose you in the final ten minutes — and that loss matters. A great ending doesn't just conclude; it reframes everything that came before."},Atmospherist:{palette:"#D4A8BE",weights:{plot:1,execution:2,acting:1,production:2,enjoyability:3,rewatchability:5,ending:1,uniqueness:1},quote:'"The right film at the right moment is everything."',description:"The right film at the right moment is almost a spiritual experience for you. Context is part of cinema itself — the mood, the night, who you watched it with. You chase that feeling more than you chase prestige."}},ro=[{q:"You finish a film that you admired more than you enjoyed. How do you rate it?",options:[{key:"A",text:"Rate it highly. The craft speaks for itself."},{key:"B",text:"Rate it somewhere in the middle. Both things are true."},{key:"C",text:"Rate it lower. If it didn't connect, something didn't work."},{key:"D",text:"Watch it again before deciding."}]},{q:"A film you've been completely absorbed in for two hours ends in a way that doesn't satisfy you. How much does that affect how you feel about the whole thing?",options:[{key:"A",text:"A lot. The ending is the argument. It reframes everything before it."},{key:"B",text:"Somewhat. It takes the edge off, but two great hours are still two great hours."},{key:"C",text:"Not much. I was there for the ride, not the destination."},{key:"D",text:"Depends on the film. Some endings are meant to be unresolved."}]},{q:"Think about a film you've seen multiple times. Is there a version of that experience — a specific night, a specific mood, a specific person you watched it with — that you remember more than the film itself?",options:[{key:"A",text:"Yes, and honestly that's a big part of why I love it."},{key:"B",text:"Maybe, but I try to rate the film on its own terms."},{key:"C",text:"Not really. A great film is great regardless of when you watch it."},{key:"D",text:"I don't rewatch much. I'd rather see something new."}]},{q:"It's a Sunday. You have the whole afternoon. You're scrolling through options and you see a film you've seen probably four or five times already. Do you put it on?",options:[{key:"A",text:"Honestly, yeah. Sometimes that's exactly what the moment calls for."},{key:"B",text:"Only if I'm in a specific mood for it. Otherwise I'd rather find something new."},{key:"C",text:"Probably not. There's too much I haven't seen."},{key:"D",text:"Depends who I'm watching with."}]},{q:"Sometimes a performance makes you forget you're watching a film. You're not thinking about the script or the direction — you're just fully transported into a character's inner world. How much does that experience shape how you feel about a film overall?",options:[{key:"A",text:"It's everything. A performance like that can carry a film for me."},{key:"B",text:"It elevates it, but I need the rest of the film to hold up too."},{key:"C",text:"I notice it, but it's one piece of a bigger picture."},{key:"D",text:"Honestly I'm usually more absorbed by the world the film creates than the people in it."}]},{q:"A film has one of the greatest performances you've ever seen. The script around it is a mess. Where do you land?",options:[{key:"A",text:"Still a great film. That performance is the film."},{key:"B",text:"Good but frustrating. What could have been."},{key:"C",text:"The script drags it down significantly. A film is only as strong as its weakest part."},{key:"D",text:"Depends how bad the script is. There's a threshold."}]}];let $="name",ee={},fe="",O=null,te=null;function xe(){const e=document.getElementById("onboarding-overlay");e.style.display="flex",$="name",ee={},F()}function F(){const e=document.getElementById("ob-card-content");if($==="name")e.innerHTML=`
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
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px">On Letterboxd? &nbsp;</span>
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obShowImport()">Import your ratings →</span>
      </div>
    `,setTimeout(()=>document.getElementById("ob-name-field")?.focus(),50);else if($==="returning")e.innerHTML=`
      <div class="ob-eyebrow">palate map · welcome back</div>
      <div class="ob-title">Welcome back.</div>
      <div class="ob-sub">Enter your username to restore your profile and film list from the cloud.</div>
      <input class="ob-name-input" id="ob-returning-field" type="text" placeholder="e.g. alexsmith" maxlength="64" onkeydown="if(event.key==='Enter') obLookupUser()">
      <div id="ob-returning-error" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--red);margin-bottom:12px;display:none">Username not found. Check spelling and try again.</div>
      <button class="ob-btn" id="ob-returning-btn" onclick="obLookupUser()">Restore profile →</button>
      <div style="text-align:center;margin-top:20px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obStep='name';renderObStep()">← New user instead</span>
      </div>
    `,setTimeout(()=>document.getElementById("ob-returning-field")?.focus(),50);else if($==="import")e.innerHTML=`
      <div class="ob-eyebrow">palate map · letterboxd import</div>
      <div class="ob-title">Bring your watchlist.</div>
      <div class="ob-sub">Your Letterboxd ratings become your starting point. We'll map your star ratings to scores and let you go deeper from there.</div>

      <div style="background:var(--cream);border:1px solid var(--rule);padding:14px 16px;margin-bottom:20px;font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);line-height:1.9">
        <strong style="color:var(--ink)">How to export from Letterboxd:</strong><br>
        1. letterboxd.com → Settings → <strong>Import & Export</strong><br>
        2. Click <strong>Export Your Data</strong> → download the .zip<br>
        3. Unzip → upload <strong>ratings.csv</strong> below
      </div>

      <div id="ob-import-drop-lb" style="border:2px dashed var(--rule-dark);padding:40px 24px;text-align:center;cursor:pointer;margin-bottom:8px;transition:border-color 0.15s"
        onclick="document.getElementById('ob-import-file-lb').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--blue)'"
        ondragleave="this.style.borderColor='var(--rule-dark)'"
        ondrop="obHandleLetterboxdDrop(event)">
        <div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--dim);letter-spacing:1px;margin-bottom:6px">Drop ratings.csv here</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--rule-dark)">or click to browse</div>
      </div>
      <input type="file" id="ob-import-file-lb" accept=".csv,.json" style="display:none" onchange="obHandleLetterboxdFile(this)">
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-bottom:20px;line-height:1.6;text-align:center">
        5★ = 100 · 4★ = 80 · 3★ = 60 · 2★ = 40 · 1★ = 20 &nbsp;·&nbsp; Category scores added via Calibrate
      </div>

      <div id="ob-import-status" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px;min-height:18px"></div>
      <button class="ob-btn" id="ob-import-btn" onclick="obConfirmImport()" disabled>Continue with imported films →</button>
      <div style="text-align:center;margin-top:16px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obStep='name';renderObStep()">← Back</span>
      </div>
    `;else if(typeof $=="number"){const t=ro[$],o=Math.round($/6*100),i=$===0?`<div style="font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.8;color:var(--dim);margin-bottom:28px;font-style:italic">The films you're drawn to reveal something consistent about you — a set of values, sensitivities, and hungers that show up again and again. A few questions to surface them.</div>`:"";e.innerHTML=`
      ${i}
      <div class="ob-progress">Question ${$+1} of 6</div>
      <div class="ob-progress-bar"><div class="ob-progress-fill" style="width:${o}%"></div></div>
      <div class="ob-question">${t.q}</div>
      ${t.options.map(n=>`
        <div class="ob-option ${ee[$]===n.key?"selected":""}" onclick="obSelectAnswer(${$}, '${n.key}', this)">
          <span class="ob-option-key">${n.key}</span>
          <span class="ob-option-text">${n.text}</span>
        </div>`).join("")}
      <div class="ob-nav">
        ${$>0?'<button class="ob-btn-secondary" onclick="obBack()">← Back</button>':""}
        <button class="ob-btn-primary" id="ob-next-btn" onclick="obNext()" ${ee[$]?"":"disabled"}>
          ${$===5?"See my archetype →":"Next →"}
        </button>
      </div>
    `}else if($==="reveal"){const t=co(ee);O=t,O._slug||(O._slug=fe.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"user");const o=V[t.primary],i=o.palette||"#3d5a80";e.innerHTML=`
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
    `,setTimeout(()=>{const n=document.getElementById("ob-reveal-username");n&&(n.textContent=O._slug)},0)}}window.obCheckName=function(){const e=document.getElementById("ob-name-field")?.value?.trim(),t=document.getElementById("ob-name-btn");t&&(t.disabled=!e||e.length<1)};window.obSubmitName=function(){const e=document.getElementById("ob-name-field")?.value?.trim();e&&(fe=e,$=0,F())};window.obShowReturning=function(){$="returning",F()};window.obShowImport=function(){$="import",te=null,F()};window.obSwitchImportTab=function(e){document.getElementById("ob-import-panel-pm").style.display=e==="pm"?"":"none",document.getElementById("ob-import-panel-lb").style.display=e==="lb"?"":"none",document.getElementById("ob-import-tab-pm").style.borderBottomColor=e==="pm"?"var(--ink)":"transparent",document.getElementById("ob-import-tab-pm").style.color=e==="pm"?"var(--ink)":"var(--dim)",document.getElementById("ob-import-tab-lb").style.borderBottomColor=e==="lb"?"var(--ink)":"transparent",document.getElementById("ob-import-tab-lb").style.color=e==="lb"?"var(--ink)":"var(--dim)",te=null,document.getElementById("ob-import-status").textContent="",document.getElementById("ob-import-btn").disabled=!0};window.obHandleLetterboxdDrop=function(e){e.preventDefault();const t=document.getElementById("ob-import-drop-lb");t&&(t.style.borderColor="var(--rule-dark)");const o=e.dataTransfer.files[0];o&&(o.name.endsWith(".json")?be(o):it(o))};window.obHandleLetterboxdFile=function(e){const t=e.files[0];t&&(t.name.endsWith(".json")?be(t):it(t))};function lo(e){const t=e.trim().split(`
`),o=t[0].split(",").map(i=>i.replace(/^"|"$/g,"").trim());return t.slice(1).map(i=>{const n=[];let s="",a=!1;for(const r of i)r==='"'?a=!a:r===","&&!a?(n.push(s.trim()),s=""):s+=r;return n.push(s.trim()),Object.fromEntries(o.map((r,c)=>[r,n[c]||""]))})}function it(e){const t=new FileReader;t.onload=o=>{try{const n=lo(o.target.result).filter(a=>a.Name&&a.Rating&&parseFloat(a.Rating)>0).map(a=>{const r=parseFloat(a.Rating),c=Math.round(r*20);return{title:a.Name,year:parseInt(a.Year)||null,total:c,scores:{},director:"",writer:"",cast:"",productionCompanies:"",poster:null,overview:""}});if(n.length===0)throw new Error("No rated films found");te=n,document.getElementById("ob-import-status").textContent=`✓ ${n.length} films ready to import`,document.getElementById("ob-import-status").style.color="var(--green)";const s=document.getElementById("ob-import-drop-lb");s&&(s.style.borderColor="var(--green)",s.innerHTML=`<div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--green)">${e.name}</div><div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--green);margin-top:4px">${n.length} films ready to import</div>`),document.getElementById("ob-import-btn").disabled=!1}catch{document.getElementById("ob-import-status").textContent="Couldn't parse that file — make sure it's ratings.csv from Letterboxd.",document.getElementById("ob-import-status").style.color="var(--red)"}},t.readAsText(e)}window.obHandleImportDrop=function(e){e.preventDefault(),document.getElementById("ob-import-drop").style.borderColor="var(--rule-dark)";const t=e.dataTransfer.files[0];t&&be(t)};window.obHandleImportFile=function(e){const t=e.files[0];t&&be(t)};function be(e){const t=new FileReader;t.onload=o=>{try{const i=JSON.parse(o.target.result);if(!Array.isArray(i)||i.length===0)throw new Error("invalid");if(!i[0].scores||!i[0].title)throw new Error("invalid");te=i,document.getElementById("ob-import-status").textContent=`✓ ${i.length} films ready to import`,document.getElementById("ob-import-status").style.color="var(--green)",document.getElementById("ob-import-drop").style.borderColor="var(--green)",document.getElementById("ob-import-drop").innerHTML=`<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--green)">${e.name}</div>`,document.getElementById("ob-import-btn").disabled=!1}catch{document.getElementById("ob-import-status").textContent="That doesn't look like a valid Palate Map JSON file.",document.getElementById("ob-import-status").style.color="var(--red)"}},t.readAsText(e)}window.obConfirmImport=function(){te&&(ue(te),$=0,F())};window.obLookupUser=async function(){const e=document.getElementById("ob-returning-btn"),t=document.getElementById("ob-returning-error"),o=document.getElementById("ob-returning-field")?.value?.trim().toLowerCase();if(o){e.disabled=!0,e.textContent="Looking up…",t.style.display="none";try{const{data:i,error:n}=await ge.from("ledger_users").select("*").eq("username",o).single();if(n||!i)throw new Error("not found");ye({id:i.id,username:i.username,display_name:i.display_name,archetype:i.archetype,archetype_secondary:i.archetype_secondary,weights:i.weights,harmony_sensitivity:i.harmony_sensitivity}),i.movies&&Array.isArray(i.movies)&&i.movies.length>0&&ue(i.movies),pe(),Y(),de(),ce(),document.getElementById("onboarding-overlay").style.display="none";const s=await B(()=>Promise.resolve().then(()=>oe),void 0);s.updateMastheadProfile(),s.setCloudStatus("synced"),s.updateStorageStatus(),N()}catch{e.disabled=!1,e.textContent="Restore profile →",t.style.display="block"}}};window.obSelectAnswer=function(e,t,o){ee[e]=t,o.closest(".ob-card").querySelectorAll(".ob-option").forEach(n=>n.classList.remove("selected")),o.classList.add("selected");const i=document.getElementById("ob-next-btn");i&&(i.disabled=!1)};window.obBack=function(){$>0?($--,F()):($="name",F())};window.obNext=function(){ee[$]&&($<5?($++,F()):($="reveal",F()))};window.obFinishFromReveal=function(){if(!O)return;const e=V[O.primary];po(O.primary,O.secondary||"",e.weights,O.harmonySensitivity)};function co(e){const t={};Object.keys(V).forEach(n=>t[n]=0),e[0]==="A"&&(t.Formalist+=2,t.Sensualist+=1,t.Completionist+=1),e[0]==="C"&&(t.Visceralist+=2,t.Atmospherist+=1),e[0]==="D"&&(t.Revisionist+=3),e[0]==="B"&&(t.Narrativist+=1,t.Humanist+=1),e[1]==="A"&&(t.Absolutist+=3,t.Narrativist+=2),e[1]==="C"&&(t.Visceralist+=2,t.Atmospherist+=2),e[1]==="D"&&(t.Completionist+=1,t.Revisionist+=1),e[1]==="B"&&(t.Humanist+=1,t.Formalist+=1),e[2]==="A"&&(t.Atmospherist+=3),e[2]==="C"&&(t.Formalist+=2,t.Absolutist+=2),e[2]==="D"&&(t.Completionist+=2,t.Revisionist-=1),e[2]==="B"&&(t.Narrativist+=1),e[3]==="A"&&(t.Atmospherist+=2,t.Revisionist+=2),e[3]==="C"&&(t.Completionist+=3),e[3]==="D"&&(t.Atmospherist+=1),e[3]==="B"&&(t.Sensualist+=1),e[4]==="A"&&(t.Humanist+=3,t.Visceralist+=1),e[4]==="D"&&(t.Sensualist+=3),e[4]==="C"&&(t.Formalist+=1,t.Completionist+=1),e[4]==="B"&&(t.Narrativist+=1,t.Absolutist+=1);let o=.3;e[5]==="A"&&(t.Visceralist+=1,o=0),e[5]==="C"&&(t.Absolutist+=1,o=1),e[5]==="B"&&(o=.4);const i=Object.entries(t).sort((n,s)=>s[1]-n[1]);return{primary:i[0][0],secondary:i[1][1]>0?i[1][0]:null,harmonySensitivity:o}}async function po(e,t,o,i){const n=crypto.randomUUID(),s=O._slug||fe.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"user";ye({id:n,username:s,display_name:fe,archetype:e,archetype_secondary:t,weights:o,harmony_sensitivity:i}),de(),ce(),document.getElementById("onboarding-overlay").style.display="none";const a=await B(()=>Promise.resolve().then(()=>oe),void 0);a.updateMastheadProfile(),a.updateStorageStatus(),a.setCloudStatus("syncing"),N(),pe(),Ce().catch(r=>console.warn("Initial sync failed:",r))}const mo=Object.freeze(Object.defineProperty({__proto__:null,launchOnboarding:xe},Symbol.toStringTag,{value:"Module"})),Se="f5a446a5f70a9f6a16a8ddd052c121f2",Ie="https://api.themoviedb.org/3";let y={title:"",year:null,director:"",writer:"",cast:"",scores:{}},ne=[],j={},J={};function nt(e){me(e)}function me(e){for(let t=1;t<=4;t++){const o=document.getElementById("sn"+t),i=document.getElementById("sl"+t);t<e?(o.className="step-num done",o.textContent="✓"):t===e?(o.className="step-num active",o.textContent=t,i.className="step-label active"):(o.className="step-num",o.textContent=t,i.className="step-label")}document.querySelectorAll(".step-panel").forEach((t,o)=>{t.classList.toggle("active",o+1===e)})}let Fe=null;function st(e){clearTimeout(Fe);const t=document.getElementById("tmdb-results");if(e.trim().length<2){t.innerHTML="";return}document.getElementById("searchSpinner").style.display="inline",Fe=setTimeout(async()=>{try{const i=await(await fetch(`${Ie}/search/movie?api_key=${Se}&query=${encodeURIComponent(e.trim())}&include_adult=false`)).json();if(document.getElementById("searchSpinner").style.display="none",!i.results||i.results.length===0){t.innerHTML='<div class="tmdb-loading">No results yet…</div>';return}const n=i.results.slice(0,6);t.innerHTML=n.map(s=>{const a=s.release_date?s.release_date.slice(0,4):"?",r=s.poster_path?`<img class="tmdb-result-poster" src="https://image.tmdb.org/t/p/w92${s.poster_path}" alt="">`:'<div class="tmdb-result-poster-placeholder">NO IMG</div>',c=(s.overview||"").slice(0,100)+((s.overview||"").length>100?"…":"");return`<div class="tmdb-result" onclick="tmdbSelect(${s.id}, '${s.title.replace(/'/g,"\\'").replace(/"/g,'\\"')}')">
          ${r}
          <div class="tmdb-result-info">
            <div class="tmdb-result-title">${s.title}</div>
            <div class="tmdb-result-meta">${a}${s.vote_average?" · "+s.vote_average.toFixed(1)+" TMDB":""}</div>
            <div class="tmdb-result-overview">${c}</div>
          </div>
        </div>`}).join("")}catch{document.getElementById("searchSpinner").style.display="none",t.innerHTML='<div class="tmdb-error">Search failed — check connection.</div>'}},280)}async function at(e,t){document.getElementById("tmdb-results").innerHTML='<div class="tmdb-loading">Loading film details…</div>';try{const[o,i]=await Promise.all([fetch(`${Ie}/movie/${e}?api_key=${Se}`),fetch(`${Ie}/movie/${e}/credits?api_key=${Se}`)]),n=await o.json(),s=await i.json(),a=n.release_date?parseInt(n.release_date.slice(0,4)):null,r=n.poster_path?`https://image.tmdb.org/t/p/w185${n.poster_path}`:null,c=s.crew.filter(h=>h.job==="Director").map(h=>h.name),l=s.crew.filter(h=>["Screenplay","Writer","Story","Original Story","Novel"].includes(h.job)).map(h=>h.name).filter((h,m,E)=>E.indexOf(h)===m),d=s.cast||[],p=d.slice(0,8);ne=d;const b=n.production_companies||[];y._tmdbId=e,y._tmdbDetail=n,y.year=a,y._allDirectors=c,y._allWriters=l,y._posterUrl=r,j={},p.forEach(h=>{j[h.id]={actor:h,checked:!0}}),J={},b.forEach(h=>{J[h.id]={company:h,checked:!0}}),document.getElementById("tmdb-film-header").innerHTML=`
      ${r?`<img src="${r}" style="width:80px;border-radius:4px;flex-shrink:0" alt="">`:""}
      <div>
        <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;line-height:1.1">${n.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim);margin-top:4px">${a||""} · ${n.runtime?n.runtime+" min":""}</div>
        <div style="font-size:13px;color:var(--dim);margin-top:8px;max-width:480px;line-height:1.5">${(n.overview||"").slice(0,200)}${n.overview&&n.overview.length>200?"…":""}</div>
      </div>`,document.getElementById("curate-directors").textContent=c.join(", ")||"Unknown",document.getElementById("curate-writers").textContent=l.join(", ")||"Unknown",rt(p),fo(b),document.getElementById("tmdb-search-phase").style.display="none",document.getElementById("tmdb-results").innerHTML="",document.getElementById("tmdb-curation-phase").style.display="block"}catch{document.getElementById("tmdb-results").innerHTML='<div class="tmdb-error">Failed to load film details. Try again.</div>'}}function rt(e){const t=document.getElementById("curate-cast");t.innerHTML=`<div class="cast-grid">
    ${e.map(o=>{const i=j[o.id],n=i?i.checked:!0,s=o.profile_path?`<img class="cast-photo" src="https://image.tmdb.org/t/p/w45${o.profile_path}" alt="">`:'<div class="cast-photo" style="background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:14px">👤</div>';return`<div class="cast-item ${n?"checked":"unchecked"}" onclick="toggleCast(${o.id})" id="castItem_${o.id}">
        <div class="cast-check">${n?"✓":""}</div>
        ${s}
        <div>
          <div class="cast-name">${o.name}</div>
          <div class="cast-character">${o.character||""}</div>
        </div>
      </div>`}).join("")}
  </div>`}function lt(e){j[e]&&(j[e].checked=!j[e].checked);const t=document.getElementById("castItem_"+e),o=j[e].checked;t.className="cast-item "+(o?"checked":"unchecked"),t.querySelector(".cast-check").textContent=o?"✓":""}async function ct(){const e=document.getElementById("moreCastBtn");e.textContent="Loading…",e.disabled=!0,ne.slice(8,20).forEach(i=>{j[i.id]||(j[i.id]={actor:i,checked:!1})});const o=ne.slice(0,20);rt(o),e.textContent="+ More cast",e.disabled=!1,ne.length<=20&&(e.style.display="none")}function fo(e){document.getElementById("curate-companies").innerHTML=`<div class="company-chips">
    ${e.map(t=>`
      <div class="company-chip checked" onclick="toggleCompany(${t.id})" id="companyChip_${t.id}">${t.name}</div>
    `).join("")}
    ${e.length===0?'<span style="font-size:13px;color:var(--dim)">None listed</span>':""}
  </div>`}function dt(e){J[e].checked=!J[e].checked;const t=document.getElementById("companyChip_"+e);t.className="company-chip "+(J[e].checked?"checked":"unchecked")}function pt(){re=null,document.getElementById("tmdb-search-phase").style.display="block",document.getElementById("tmdb-curation-phase").style.display="none",document.getElementById("tmdb-results").innerHTML=""}function mt(){const e=y._allDirectors||[],t=y._allWriters||[],o=Object.values(j).filter(n=>n.checked).map(n=>n.actor.name),i=Object.values(J).filter(n=>n.checked).map(n=>n.company.name);y.title=y._tmdbDetail.title,y.director=e.join(", "),y.writer=t.join(", "),y.cast=o.join(", "),y.productionCompanies=i.join(", "),go(),me(2)}let re=null;function yo(e){re=e}function uo(e){const t=[...f].filter(s=>s.scores[e]!=null).sort((s,a)=>a.scores[e]-s.scores[e]),o=t.length,i=[t[Math.floor(o*.05)],t[Math.floor(o*.25)],t[Math.floor(o*.5)],t[Math.floor(o*.75)],t[Math.floor(o*.95)]].filter(Boolean),n=new Set;return i.filter(s=>n.has(s.title)?!1:(n.add(s.title),!0))}function go(){const e=document.getElementById("calibrationCategories");e.innerHTML=M.map(t=>{const o=uo(t.key),i=re?.[t.key]??y.scores[t.key]??50;return`<div class="category-section" id="catSection_${t.key}">
      <div class="cat-header">
        <div class="cat-name">${t.label}</div>
        <div class="cat-weight">Weight ×${t.weight} of 17</div>
      </div>
      <div class="cat-question">${t.question}</div>
      ${o.length>0?`
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Reference films — click to anchor your score:</div>
      <div class="anchor-row">
        ${o.map(n=>`
          <div class="anchor-film" onclick="selectAnchor('${t.key}', ${n.scores[t.key]}, this)">
            <div class="anchor-film-title">${n.title}</div>
            <div class="anchor-film-score">${t.label}: ${n.scores[t.key]}</div>
          </div>`).join("")}
      </div>`:""}
      <div class="slider-section">
        <div class="slider-label-row">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px">Your score</div>
          <div>
            <span class="slider-val" id="sliderVal_${t.key}">${i}</span>
            <span class="slider-desc" id="sliderDesc_${t.key}" style="margin-left:8px">${K(i)}</span>
          </div>
        </div>
        <input type="range" min="1" max="100" value="${i}" id="slider_${t.key}"
          style="background:linear-gradient(to right,rgba(180,50,40,0.45) 0%,rgba(180,50,40,0.45) 15%,var(--rule) 15%,var(--rule) 85%,rgba(40,130,60,0.45) 85%,rgba(40,130,60,0.45) 100%)"
          oninput="updateSlider('${t.key}', this.value)">
        <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-top:2px">
          <span>1 — No worse exists</span><span>50 — Solid</span><span>100 — No better exists</span>
        </div>
      </div>
    </div>`}).join(""),M.forEach(t=>{y.scores[t.key]=re?.[t.key]??y.scores[t.key]??50})}window.selectAnchor=function(e,t,o){o.closest(".anchor-row").querySelectorAll(".anchor-film").forEach(s=>s.classList.remove("selected")),o.classList.add("selected");const i=y.scores[e]??50,n=Math.round((i+t)/2);document.getElementById("slider_"+e).value=n,updateSlider(e,n)};window.updateSlider=function(e,t){t=parseInt(t),y.scores[e]=t,document.getElementById("sliderVal_"+e).textContent=t,document.getElementById("sliderDesc_"+e).textContent=K(t)};function ft(){vo(),me(3)}let U=[],R=0,le=[];function vo(){U=[],le=[],M.forEach(e=>{const t=y.scores[e.key];if(!t)return;f.filter(i=>i.scores[e.key]!=null&&Math.abs(i.scores[e.key]-t)<=3).sort((i,n)=>Math.abs(i.scores[e.key]-t)-Math.abs(n.scores[e.key]-t)).slice(0,1).forEach(i=>U.push({cat:e,film:i}))}),U=U.slice(0,6),R=0,we()}function we(){const e=document.getElementById("hthContainer");if(U.length===0||R>=U.length){e.innerHTML=`<div style="text-align:center;padding:40px;color:var(--dim);font-style:italic">
      No close comparisons needed — your scores are clearly differentiated. Click Continue.
    </div>`;return}const{cat:t,film:o}=U[R],i=y.scores[t.key];e.innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">
      Comparison ${R+1} of ${U.length} &nbsp;·&nbsp; ${t.label} (×${t.weight})
    </div>
    <div class="hth-prompt">Which has the better <em>${t.label.toLowerCase()}</em>?</div>
    <div class="hth-row">
      <div class="hth-card" onclick="hthChoice('new', '${t.key}', ${o.scores[t.key]})">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">New film</div>
        <div class="hth-title">${y.title}</div>
        <div class="hth-score">${i}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${K(i)}</div>
      </div>
      <div class="hth-vs">vs</div>
      <div class="hth-card" onclick="hthChoice('existing', '${t.key}', ${o.scores[t.key]})">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">From your list</div>
        <div class="hth-title">${o.title}</div>
        <div class="hth-score">${o.scores[t.key]}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${K(o.scores[t.key])}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:center;align-items:center;gap:24px;margin-top:4px">
      ${R>0?'<span class="hth-skip" onclick="hthUndo()">← Undo</span>':""}
      <span class="hth-skip" onclick="hthSkip()">They're equal / skip this one</span>
    </div>
  `}window.hthChoice=function(e,t,o){le.push({idx:R,scores:{...y.scores}});const i=y.scores[t];e==="new"&&i<=o?y.scores[t]=o+1:e==="existing"&&i>=o&&(y.scores[t]=o-1),R++,we()};window.hthSkip=function(){le.push({idx:R,scores:{...y.scores}}),R++,we()};window.hthUndo=function(){if(le.length===0)return;const e=le.pop();R=e.idx,y.scores=e.scores,we()};function yt(){ho(),me(4)}function ho(){const e=X(y.scores);y.total=e;const t=[...f,y].sort((i,n)=>n.total-i.total),o=t.indexOf(y)+1;document.getElementById("resultCard").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">
      Would rank #${o} of ${f.length+1}
    </div>
    <div class="result-film-title">${y.title}</div>
    <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim);margin-bottom:12px">${y.year||""} ${y.director?"· "+y.director:""}</div>
    <div class="result-total">${e}</div>
    <div class="result-label">${K(e)}</div>
    <div class="result-grid">
      ${M.map(i=>`
        <div class="result-cat">
          <div class="result-cat-name">${i.label} ×${i.weight}</div>
          <div class="result-cat-val ${Q(y.scores[i.key]||0)}">${y.scores[i.key]||"—"}</div>
        </div>`).join("")}
    </div>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--rule)">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px">Where it lands</div>
      ${[-2,-1,0,1,2].map(i=>{const n=o+i;if(n<1||n>t.length)return"";const s=t[n-1],a=s===y,r=a?e:s.total,c=(Math.round(r*10)/10).toFixed(1);if(a)return`<div style="display:flex;align-items:center;gap:12px;padding:9px 12px;background:var(--ink);margin:2px 0">
            <span style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.45);min-width:20px;text-align:right">${n}</span>
            <span style="font-family:'Playfair Display',serif;font-weight:700;font-style:italic;flex:1;color:white;font-size:14px">${s.title}</span>
            <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:white">${c}</span>
          </div>`;const l=(s.total-e).toFixed(1),d=l>0?"var(--green)":"var(--red)";return`<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid var(--rule);margin:0">
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);min-width:20px;text-align:right">${n}</span>
          <span style="font-family:'Playfair Display',serif;font-weight:700;flex:1;color:var(--ink);font-size:14px">${s.title}</span>
          <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${c}</span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:${d};min-width:36px;text-align:right">${l>0?"+":""}${l}</span>
        </div>`}).join("")}
    </div>
  `}function ut(){y.total=X(y.scores),f.push({title:y.title,year:y.year,total:y.total,director:y.director,writer:y.writer,cast:y.cast,productionCompanies:y.productionCompanies||"",poster:y._tmdbDetail?.poster_path||null,overview:y._tmdbDetail?.overview||"",scores:{...y.scores}}),Y(),B(()=>Promise.resolve().then(()=>oe),void 0).then(e=>e.updateStorageStatus()),y={title:"",year:null,director:"",writer:"",cast:"",productionCompanies:"",scores:{}},j={},J={},ne=[],re=null,document.getElementById("f-search").value="",document.getElementById("tmdb-results").innerHTML="",document.getElementById("tmdb-search-phase").style.display="block",document.getElementById("tmdb-curation-phase").style.display="none",document.getElementById("moreCastBtn").style.display="",me(1),N(),document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active")),document.getElementById("rankings").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".nav-btn")[0].classList.add("active")}const xo=Object.freeze(Object.defineProperty({__proto__:null,confirmTmdbData:mt,goToStep:nt,goToStep3:ft,goToStep4:yt,liveSearch:st,prefillWithPrediction:yo,resetToSearch:pt,saveFilm:ut,showMoreCast:ct,tmdbSelect:at,toggleCast:lt,toggleCompany:dt},Symbol.toStringTag,{value:"Module"}));function bo(){if(!x){B(()=>Promise.resolve().then(()=>mo),void 0).then(e=>e.launchOnboarding());return}gt()}function gt(){if(!x)return;const e=x.weights||{},t=Math.max(...Object.values(e));document.getElementById("archetypeModalContent").innerHTML=`
    <button class="modal-close" onclick="closeArchetypeModal()">×</button>
    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:6px">Your archetype</div>
    <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:32px;font-weight:900;color:var(--blue);margin-bottom:4px">${x.archetype||"—"}</div>
    ${x.archetype_secondary?`<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:4px">Secondary: ${x.archetype_secondary}</div>`:""}
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-bottom:28px">${x.username||""}</div>

    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--rule)">
      Weighting formula <span style="font-weight:400;font-style:italic;letter-spacing:0;text-transform:none"> — edit to customize</span>
    </div>

    <div id="archetype-weights-form">
      ${M.map(o=>{const i=e[o.key]||1,n=Math.round(i/t*100);return`<div class="archetype-weight-row">
          <div class="archetype-weight-label">${o.label}</div>
          <div class="archetype-weight-bar-wrap"><div class="archetype-weight-bar" id="awbar_${o.key}" style="width:${n}%"></div></div>
          <input class="archetype-weight-input" type="number" min="1" max="5" value="${i}"
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
  `,document.getElementById("archetypeModal").classList.add("open")}function vt(e,t){const o=M.map(n=>({key:n.key,val:parseFloat(document.getElementById("awval_"+n.key)?.value)||1})),i=Math.max(...o.map(n=>n.val));o.forEach(n=>{const s=document.getElementById("awbar_"+n.key);s&&(s.style.width=Math.round(n.val/i*100)+"%")})}function wo(){if(!x||!x.archetype)return;const e=V[x.archetype]?.weights;e&&(M.forEach(t=>{const o=document.getElementById("awval_"+t.key);o&&(o.value=e[t.key]||1)}),vt())}function ko(e){const t=M.map(s=>s.key),o=s=>{const a=Math.sqrt(t.reduce((r,c)=>r+(s[c]||1)**2,0));return t.map(r=>(s[r]||1)/a)},i=o(e),n=Object.entries(V).map(([s,a])=>{const r=o(a.weights),c=i.reduce((l,d,p)=>l+d*r[p],0);return{name:s,sim:c}}).sort((s,a)=>a.sim-s.sim);return{primary:n[0].name,secondary:n[1].name}}function $o(){const e={};M.forEach(i=>{const n=parseFloat(document.getElementById("awval_"+i.key)?.value);e[i.key]=isNaN(n)||n<1?1:Math.min(5,n)});const t=x.archetype,o=ko(e);x.weights=e,x.archetype=o.primary,x.archetype_secondary=o.secondary,B(()=>Promise.resolve().then(()=>Ke),void 0).then(i=>{i.saveUserLocally(),i.syncToSupabase().catch(()=>{})}),de(),N(),Y(),ht(),o.primary!==t&&Mo(t,o.primary)}function Mo(e,t){const o=document.getElementById("archetype-shift-toast");o&&o.remove();const i=document.createElement("div");i.id="archetype-shift-toast",i.innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:6px">Palate shift detected</div>
    <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:white;line-height:1.2">${e} <span style="color:var(--on-dark-dim);font-size:14px">→</span> ${t}</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--on-dark-dim);margin-top:4px">Your archetype has updated.</div>
  `,i.style.cssText=`
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:var(--surface-dark);border:1px solid rgba(255,255,255,0.12);
    padding:16px 20px;max-width:260px;
    animation:fadeIn 0.25s ease;
  `,document.body.appendChild(i),setTimeout(()=>{i.style.transition="opacity 0.4s",i.style.opacity="0",setTimeout(()=>i.remove(),400)},4e3)}window.logOutUser=function(){confirm("Sign out? Your data is saved to the cloud under your username.")&&(localStorage.clear(),location.reload())};function ht(e){(!e||e.target===document.getElementById("archetypeModal"))&&document.getElementById("archetypeModal").classList.remove("open")}const z=["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"],Ae={plot:"Plot",execution:"Execution",acting:"Acting",production:"Production",enjoyability:"Enjoyability",rewatchability:"Rewatchability",ending:"Ending",uniqueness:"Uniqueness"},Eo={plot:"Plot",execution:"Exec",acting:"Acting",production:"Prod",enjoyability:"Enjoy",rewatchability:"Rewatch",ending:"Ending",uniqueness:"Unique"};function So(e,t,o=220){const i=z.length,n=o/2,s=o/2,a=o*.36,r=v=>v/i*Math.PI*2-Math.PI/2,c=(v,w)=>({x:n+a*w*Math.cos(r(v)),y:s+a*w*Math.sin(r(v))}),l=[.25,.5,.75,1].map(v=>`<polygon points="${z.map((k,S)=>`${c(S,v).x},${c(S,v).y}`).join(" ")}" fill="none" stroke="var(--rule)" stroke-width="0.75"/>`).join(""),d=z.map((v,w)=>{const k=c(w,1);return`<line x1="${n}" y1="${s}" x2="${k.x}" y2="${k.y}" stroke="var(--rule)" stroke-width="0.75"/>`}).join(""),p=Math.max(...z.map(v=>e[v]||1)),h=`<polygon points="${z.map((v,w)=>{const k=c(w,(e[v]||1)/p);return`${k.x},${k.y}`}).join(" ")}" fill="var(--blue)" fill-opacity="0.12" stroke="var(--blue)" stroke-width="1.5" stroke-linejoin="round"/>`;let m="";if(t){const v=Math.max(...z.map(k=>t[k]||1));m=`<polygon points="${z.map((k,S)=>{const D=c(S,(t[k]||1)/v);return`${D.x},${D.y}`}).join(" ")}" fill="none" stroke="var(--dim)" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.45"/>`}const E=z.map((v,w)=>{const k=c(w,(e[v]||1)/p);return`<circle cx="${k.x}" cy="${k.y}" r="2.5" fill="var(--blue)"/>`}).join(""),I=22,u=z.map((v,w)=>{const k=c(w,1+I/a),S=k.x<n-5?"end":k.x>n+5?"start":"middle";return`<text x="${k.x}" y="${k.y}" font-family="'DM Mono',monospace" font-size="8.5" fill="var(--dim)" text-anchor="${S}" dominant-baseline="middle">${Eo[v]}</text>`}).join(""),g=36;return`<svg width="${o+g*2}" height="${o+g*2}" viewBox="${-g} ${-g} ${o+g*2} ${o+g*2}" style="overflow:visible;display:block">
    ${l}${d}${m}${h}${E}${u}
  </svg>`}function Io(e){return e.length?z.map(t=>{const o=e.filter(a=>a.scores?.[t]!=null),i=o.length?o.reduce((a,r)=>a+r.scores[t],0)/o.length:null,n=i!=null?i.toFixed(1):"—",s=i??0;return`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);width:88px;flex-shrink:0">${Ae[t]}</div>
      <div style="flex:1;height:2px;background:var(--rule);position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;height:100%;background:var(--blue);width:${s}%"></div>
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--ink);width:28px;text-align:right">${n}</div>
    </div>`}).join(""):`<p style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim)">No films rated yet.</p>`}function Do(e){return e==null?"rgba(12,11,9,0.65)":e>=90?"#C4922A":e>=80?"#1F4A2A":e>=70?"#4A5830":e>=60?"#6B4820":"rgba(12,11,9,0.65)"}function Co(e){const t=[...e].sort((o,i)=>i.total-o.total).slice(0,5);return t.length?t.map((o,i)=>{const n=o.poster?`<img style="width:34px;height:51px;object-fit:cover;display:block;flex-shrink:0" src="https://image.tmdb.org/t/p/w92${o.poster}" alt="" loading="lazy">`:'<div style="width:34px;height:51px;background:var(--cream);flex-shrink:0"></div>',s=o.total!=null?(Math.round(o.total*10)/10).toFixed(1):"—";return`
      <div style="display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--rule);min-height:63px;cursor:pointer;transition:background 0.12s"
           onclick="openModal(${f.indexOf(o)})"
           onmouseover="this.style.background='var(--cream)'"
           onmouseout="this.style.background=''">
        <div style="display:flex;align-items:center;justify-content:center;padding:4px 6px 4px 0;height:63px;flex-shrink:0">${n}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--rule-dark);width:24px;flex-shrink:0;text-align:center">${i+1}</div>
        <div style="flex:1">
          <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;font-weight:700;line-height:1.2;color:var(--ink)">${o.title}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:3px">${o.year||""}${o.director?" · "+o.director.split(",")[0]:""}</div>
        </div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:18px;color:white;padding:4px 11px 3px;background:${Do(o.total)};border-radius:4px;flex-shrink:0">${s}</div>
      </div>
    `}).join(""):`<p style="font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dim)">Rate some films to see your signature picks.</p>`}function _o(e,t){const o=V[e.archetype]||{},i=t.length?(t.reduce((c,l)=>c+l.total,0)/t.length).toFixed(1):"—",n=z.map(c=>{const l=t.filter(d=>d.scores?.[c]!=null);return{c,avg:l.length?l.reduce((d,p)=>d+p.scores[c],0)/l.length:0}}),s=t.length?[...n].sort((c,l)=>l.avg-c.avg)[0]:null,a=o.quote||"",r=o.palette||"#3d5a80";return`
    <div style="width:320px;height:440px;flex-shrink:0;border:1px solid var(--ink);background:var(--paper);overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box">
      <div style="padding:28px 28px 0">
        <div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:40px">palate map · taste note</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:26px;line-height:1.25;color:var(--ink);letter-spacing:-0.5px;margin-bottom:24px">${a}</div>
        <div style="width:32px;height:2px;background:${r};margin-bottom:20px"></div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:700;font-size:18px;color:var(--ink);margin-bottom:4px">${e.display_name}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:1px">${e.archetype}${e.archetype_secondary?" · "+e.archetype_secondary:""}</div>
      </div>
      <div style="padding:0 28px 24px">
        <div style="border-top:1px solid var(--rule);padding-top:14px;display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--dim)">
          <span>${t.length} films</span>
          ${s?`<span>best: ${Ae[s.c]}</span>`:`<span>avg ${i}</span>`}
          <span>palatemap.com</span>
        </div>
      </div>
    </div>
  `}function Bo(e,t){const o=[...t].sort((s,a)=>a.total-s.total).slice(0,3),i=t.length?(t.reduce((s,a)=>s+a.total,0)/t.length).toFixed(1):"—",n=V[e.archetype]||{};return`
    <div style="width:320px;height:440px;flex-shrink:0;border:1px solid var(--ink);background:var(--paper);overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box">
      <div class="dark-grid" style="background:var(--surface-dark);padding:20px 24px 20px;border-bottom:3px solid ${n.palette||"#3d5a80"};flex-shrink:0">
        <div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--on-dark-dim);margin-bottom:14px">palate map</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:28px;color:var(--on-dark);line-height:1;margin-bottom:4px">${e.display_name}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim);margin-bottom:14px">${e.username}</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:22px;color:${n.palette||"var(--on-dark)"};margin-bottom:4px">${e.archetype}</div>
        ${e.archetype_secondary?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--on-dark-dim)">+ ${e.archetype_secondary}</div>`:""}
      </div>
      <div style="padding:16px 24px;flex:1;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div style="font-family:'DM Sans',sans-serif;font-size:11px;line-height:1.65;color:var(--dim);margin-bottom:12px">${n.description||""}</div>
          <div style="border-top:1px solid var(--rule);padding-top:12px;margin-bottom:4px">
            ${o.map(s=>`<div style="font-family:'DM Sans',sans-serif;font-size:11px;color:var(--ink);margin-bottom:5px;display:flex;justify-content:space-between"><span>${s.title}</span><span style="color:var(--dim);font-family:'DM Mono',monospace;font-size:10px">${s.total}</span></div>`).join("")}
          </div>
        </div>
        <div style="padding-top:10px;border-top:1px solid var(--rule);font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);display:flex;justify-content:space-between">
          <span>${t.length} films</span>
          <span>avg ${i}</span>
          <span>palatemap.com</span>
        </div>
      </div>
    </div>
  `}function Le(){const e=document.getElementById("profileContent");if(!e)return;const t=x;if(!t){e.innerHTML='<p style="color:var(--dim)">Sign in to view your profile.</p>';return}const o=V[t.archetype]||{},i=t.weights||{},n=o.weights||null,s=f,a=z.map(l=>{const d=s.filter(p=>p.scores?.[l]!=null);return{c:l,avg:d.length?d.reduce((p,b)=>p+b.scores[l],0)/d.length:0}}),r=s.length?[...a].sort((l,d)=>d.avg-l.avg)[0]:null,c=s.length?(s.reduce((l,d)=>l+d.total,0)/s.length).toFixed(1):"—";e.innerHTML=`
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
        <div class="dark-grid" style="background:var(--surface-dark);padding:28px 32px;margin-bottom:20px;border-top:3px solid ${o.palette||"#3d5a80"}">
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
            ${So(i,n)}
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
            ${Io(s)}
          </div>
        </div>
        ${s.length>0?`
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:24px;border-top:2px solid var(--ink)">
          <div style="padding:16px 20px 16px 0;border-right:1px solid var(--rule)">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Films rated</div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:40px;color:var(--ink);line-height:1;letter-spacing:-1px">${s.length}</div>
          </div>
          <div style="padding:16px 20px;border-right:1px solid var(--rule)">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Avg total</div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:40px;color:var(--ink);line-height:1;letter-spacing:-1px">${c}</div>
          </div>
          ${r?`<div style="padding:16px 0 16px 20px">
            <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Strongest</div>
            <div style="font-family:'Playfair Display',serif;font-style:italic;font-weight:900;font-size:32px;color:var(--blue);line-height:1;letter-spacing:-1px">${Ae[r.c]}</div>
          </div>`:""}
        </div>`:""}
      </div>

      <!-- SIGNATURE FILMS -->
      <div style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--rule)">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:20px">Signature Films</div>
        ${Co(s)}
      </div>

      <!-- CANON CARD -->
      <div style="margin-bottom:40px">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:6px">Your Palate Map Card</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--dim);margin-bottom:20px">Screenshot to share.</div>
        <div style="display:flex;gap:20px;align-items:flex-start">
          ${Bo(t,s)}
          ${_o(t,s)}
        </div>
      </div>

      <!-- SIGN OUT -->
      <div style="padding-top:20px;padding-bottom:40px;border-top:1px solid var(--rule);text-align:center">
        <span onclick="logOutUser()" style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--dim);cursor:pointer;text-decoration:underline">Sign out</span>
      </div>

    </div>
  `}function xt(e){document.querySelectorAll(".screen").forEach(t=>t.classList.remove("active")),document.getElementById(e).classList.add("active"),document.querySelectorAll(".nav-btn, .nav-mobile-btn").forEach(t=>{t.classList.toggle("active",t.getAttribute("onclick")?.includes(`'${e}'`))}),e==="analysis"&&Be(),e==="calibration"&&Te(),e==="predict"&&et(),e==="profile"&&Le(),localStorage.setItem("ledger_last_screen",e)}function je(){const e=document.getElementById("storageStatus");e&&(f.length>0?(e.textContent=`✓ ${f.length} films · saved`,e.style.color="var(--green)"):(e.textContent="no films yet",e.style.color="var(--dim)"))}function Pe(){const e=x;if(!e)return;const t=document.getElementById("mastheadLeft");t.innerHTML=`<span class="profile-chip" onclick="document.getElementById('nav-profile').click()">
    <strong style="color:var(--ink);font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.5px">${e.display_name}</strong>
  </span>`}function bt(){const e=new Blob([JSON.stringify(f,null,2)],{type:"application/json"}),t=document.createElement("a");t.href=URL.createObjectURL(e),t.download="film_rankings.json",t.click()}function wt(){confirm("Clear all your films and start fresh? This cannot be undone.")&&(localStorage.removeItem("filmRankings_v1"),localStorage.removeItem("ledger_user"),location.reload())}function kt(){const e=document.getElementById("cold-landing");e?e.style.display="flex":xe()}window.startFromLanding=function(){const e=document.getElementById("cold-landing");e&&(e.style.display="none"),xe()};async function zo(){At(),Tt(),Je(),x?(se("syncing"),Pe(),de(),Ge(x.id).catch(()=>se("error"))):(se("local"),setTimeout(()=>kt(),400)),N(),je();const e=localStorage.getItem("ledger_last_screen"),t=e==="explore"?"analysis":e;if(t&&t!=="rankings"&&document.getElementById(t)){const o=document.querySelectorAll(".nav-btn");o.forEach(i=>i.classList.remove("active")),document.querySelectorAll(".screen").forEach(i=>i.classList.remove("active")),document.getElementById(t).classList.add("active"),o.forEach(i=>{i.getAttribute("onclick")?.includes(t)&&i.classList.add("active")}),t==="analysis"&&Be(),t==="profile"&&Le()}}function se(e){const t=document.getElementById("cloudDot"),o=document.getElementById("cloudLabel");t.className="cloud-dot",e==="syncing"?(t.classList.add("syncing"),o.textContent="syncing…"):e==="synced"?(t.classList.add("synced"),o.textContent=x?x.display_name:"synced"):e==="error"?(t.classList.add("error"),o.textContent="offline"):o.textContent="local"}window.__ledger={showScreen:xt,sortBy:Ue,openModal:Ot,closeModal:qt,exploreEntity:Ht,renderExploreIndex:_e,renderAnalysis:Be,initPredict:et,predictSearch:tt,predictSearchDebounce:Vt,predictSelectFilm:Gt,predictAddToList:Zt,startCalibration:no,selectCalCat:to,selectCalInt:oo,applyCalibration:ao,resetCalibration:Te,launchOnboarding:xe,liveSearch:st,tmdbSelect:at,toggleCast:lt,showMoreCast:ct,toggleCompany:dt,resetToSearch:pt,confirmTmdbData:mt,goToStep3:ft,goToStep4:yt,saveFilm:ut,goToStep:nt,renderProfile:Le,setViewMode:We,showSyncPanel:bo,openArchetypeModal:gt,closeArchetypeModal:ht,previewWeight:vt,resetArchetypeWeights:wo,saveArchetypeWeights:$o,exportData:bt,resetStorage:wt,updateStorageStatus:je,updateMastheadProfile:Pe,setCloudStatus:se};const To=["showScreen","sortBy","openModal","closeModal","exploreEntity","renderExploreIndex","initPredict","predictSearch","predictSearchDebounce","predictSelectFilm","predictAddToList","startCalibration","selectCalCat","selectCalInt","applyCalibration","resetCalibration","launchOnboarding","liveSearch","tmdbSelect","toggleCast","showMoreCast","toggleCompany","resetToSearch","confirmTmdbData","goToStep3","goToStep4","saveFilm","goToStep","renderProfile","setViewMode","showSyncPanel","openArchetypeModal","closeArchetypeModal","previewWeight","resetArchetypeWeights","saveArchetypeWeights","exportData","resetStorage","renderAnalysis"];To.forEach(e=>{window[e]=window.__ledger[e]});zo();const oe=Object.freeze(Object.defineProperty({__proto__:null,exportData:bt,resetStorage:wt,setCloudStatus:se,showColdLanding:kt,showScreen:xt,updateMastheadProfile:Pe,updateStorageStatus:je},Symbol.toStringTag,{value:"Module"}));export{M as C,f as M,x as c};
