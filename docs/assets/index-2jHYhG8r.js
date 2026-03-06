(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function o(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(n){if(n.ep)return;n.ep=!0;const a=o(n);fetch(n.href,a)}})();const x=[{key:"plot",label:"Plot",weight:3,question:"How strong, original, and well-constructed is the story?"},{key:"execution",label:"Execution",weight:3,question:"Direction, cinematography, pacing — how well is it made?"},{key:"acting",label:"Acting",weight:2,question:"How effective is the overall performance?"},{key:"production",label:"Production",weight:1,question:"Score, production design, costume — the craft around the film."},{key:"enjoyability",label:"Enjoyability",weight:4,question:"The most honest question: how much did you actually enjoy it?"},{key:"rewatchability",label:"Rewatchability",weight:1,question:"Would you sit down and watch this again? How eagerly?"},{key:"ending",label:"Ending",weight:1,question:"How satisfying, earned, and well-executed is the conclusion?"},{key:"uniqueness",label:"Uniqueness",weight:2,question:"Does this feel genuinely singular? Could only this film exist this way?"}];let y=[],b=null;function ie(e){b=e}function ne(e){y.length=0,e.forEach(t=>y.push(t))}const ot=[[90,"An all-time favorite"],[85,"Really quite exceptional"],[80,"Excellent"],[75,"Well above average"],[70,"Great"],[65,"Very good"],[60,"A cut above"],[55,"Good"],[50,"Solid"],[45,"Not bad"],[40,"Sub-par"],[35,"Multiple flaws"],[30,"Poor"],[25,"Bad"],[20,"Wouldn't watch by choice"],[0,"Unwatchable"]];function D(e){if(e>=90&&e===Math.max(...y.map(t=>t.total)))return"No better exists";for(const[t,o]of ot)if(e>=t)return o;return"Unwatchable"}function H(e){let t=0,o=0;for(const i of x)e[i.key]!=null&&(t+=e[i.key]*i.weight,o+=i.weight);return o>0?Math.round(t/o*100)/100:0}function K(){y.forEach(e=>{e.total=H(e.scores)})}function T(e){return e>=90?"s90":e>=80?"s80":e>=70?"s70":e>=60?"s60":e>=50?"s50":e>=40?"s40":"s30"}function Q(){if(!b||!b.weights)return;const e=b.weights;x.forEach(t=>{e[t.key]!=null&&(t.weight=e[t.key])}),K()}let O={key:"rank",dir:"desc"};function Ee(e){O.key===e?O.dir=O.dir==="desc"?"asc":"desc":(O.key=e,O.dir="desc"),document.querySelectorAll(".sort-arrow").forEach(o=>o.classList.remove("active-sort"));const t=document.getElementById("sort-"+e+"-arrow")||document.getElementById("sort-"+e);if(t){const o=t.querySelector?t.querySelector(".sort-arrow"):t;o&&(o.classList.add("active-sort"),o.textContent=O.dir==="desc"?"↓":"↑")}A()}function A(){const e=[...y].sort((s,l)=>l.total-s.total),t=new Map(e.map((s,l)=>[s.title,l+1]));let o;const{key:i,dir:n}=O;i==="rank"||i==="total"?o=[...y].sort((s,l)=>n==="desc"?l.total-s.total:s.total-l.total):i==="title"?o=[...y].sort((s,l)=>n==="desc"?l.title.localeCompare(s.title):s.title.localeCompare(l.title)):o=[...y].sort((s,l)=>n==="desc"?(l.scores[i]||0)-(s.scores[i]||0):(s.scores[i]||0)-(l.scores[i]||0)),document.getElementById("mastheadCount").textContent=o.length+" films ranked";const a=document.getElementById("filmList");a.innerHTML=o.map(s=>{const l=s.scores,r=t.get(s.title);return`<div class="film-row" onclick="openModal(${y.indexOf(s)})">
      <div class="film-rank">${r}</div>
      <div class="film-title-cell">
        <div class="film-title-main">${s.title}</div>
        <div class="film-title-sub">${s.year||""} ${s.director?"· "+s.director.split(",")[0]:""}</div>
      </div>
      ${["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"].map(c=>`<div class="film-score ${l[c]?T(l[c]):""}">${l[c]??"—"}</div>`).join("")}
      <div class="film-total">${s.total}</div>
    </div>`}).join("")}const it=Object.freeze(Object.defineProperty({__proto__:null,renderRankings:A,sortBy:Ee},Symbol.toStringTag,{value:"Module"})),nt="modulepreload",st=function(e){return"/ledger/"+e},we={},E=function(t,o,i){let n=Promise.resolve();if(o&&o.length>0){let c=function(p){return Promise.all(p.map(f=>Promise.resolve(f).then(w=>({status:"fulfilled",value:w}),w=>({status:"rejected",reason:w}))))};var s=c;document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),r=l?.nonce||l?.getAttribute("nonce");n=c(o.map(p=>{if(p=st(p),p in we)return;we[p]=!0;const f=p.endsWith(".css"),w=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${w}`))return;const h=document.createElement("link");if(h.rel=f?"stylesheet":nt,f||(h.as="script"),h.crossOrigin="",h.href=p,r&&h.setAttribute("nonce",r),document.head.appendChild(h),f)return new Promise((S,m)=>{h.addEventListener("load",S),h.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${p}`)))})}))}function a(l){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=l,window.dispatchEvent(r),!r.defaultPrevented)throw l}return n.then(l=>{for(const r of l||[])r.status==="rejected"&&a(r.reason);return t().catch(a)})},Se="filmRankings_v1";function N(){try{localStorage.setItem(Se,JSON.stringify(y))}catch(e){console.warn("localStorage save failed:",e)}b&&(clearTimeout(N._syncTimer),N._syncTimer=setTimeout(()=>{E(()=>Promise.resolve().then(()=>Ce),void 0).then(e=>e.syncToSupabase())},2e3))}function at(){try{const e=localStorage.getItem(Se);if(!e)return;const t=JSON.parse(e);if(!Array.isArray(t)||t.length===0)return;ne(t),console.log(`Loaded ${y.length} films from localStorage`)}catch(e){console.warn("localStorage load failed:",e)}}const rt="https://gzuuhjjedrzeqbgxhfip.supabase.co",lt="sb_publishable_OprjtxkrwknRf8jSZ7bYWg_GGqRiu4z",se=window.supabase.createClient(rt,lt);async function fe(){const e=b;if(!e)return;const{setCloudStatus:t}=await E(async()=>{const{setCloudStatus:o}=await Promise.resolve().then(()=>Y);return{setCloudStatus:o}},void 0);t("syncing");try{const{error:o}=await se.from("ledger_users").upsert({id:e.id,username:e.username,display_name:e.display_name,archetype:e.archetype,archetype_secondary:e.archetype_secondary,weights:e.weights,harmony_sensitivity:e.harmony_sensitivity||.3,movies:y,updated_at:new Date().toISOString()},{onConflict:"id"});if(o)throw o;t("synced"),X()}catch(o){console.warn("Supabase sync error:",JSON.stringify(o)),t("error")}}async function Ie(e){const{setCloudStatus:t,updateMastheadProfile:o,updateStorageStatus:i}=await E(async()=>{const{setCloudStatus:a,updateMastheadProfile:s,updateStorageStatus:l}=await Promise.resolve().then(()=>Y);return{setCloudStatus:a,updateMastheadProfile:s,updateStorageStatus:l}},void 0),{renderRankings:n}=await E(async()=>{const{renderRankings:a}=await Promise.resolve().then(()=>it);return{renderRankings:a}},void 0);t("syncing");try{const{data:a,error:s}=await se.from("ledger_users").select("*").eq("id",e).single();if(s)throw s;a&&(ie({id:a.id,username:a.username,display_name:a.display_name,archetype:a.archetype,archetype_secondary:a.archetype_secondary,weights:a.weights,harmony_sensitivity:a.harmony_sensitivity}),a.movies&&Array.isArray(a.movies)&&a.movies.length>=y.length&&ne(a.movies),X(),Q(),t("synced"),o(),n(),i())}catch(a){console.warn("Supabase load error:",a),t("error")}}function X(){try{localStorage.setItem("ledger_user",JSON.stringify(b))}catch{}}function _e(){try{const e=localStorage.getItem("ledger_user");e&&ie(JSON.parse(e))}catch{}}const Ce=Object.freeze(Object.defineProperty({__proto__:null,loadFromSupabase:Ie,loadUserLocally:_e,saveUserLocally:X,sb:se,syncToSupabase:fe},Symbol.toStringTag,{value:"Module"})),ct=[[90,"All-time favorite"],[85,"Really exceptional"],[80,"Excellent"],[75,"Well above average"],[70,"Great"],[65,"Very good"],[60,"A cut above"],[55,"Good"],[50,"Solid"],[45,"Not bad"],[40,"Sub-par"],[35,"Multiple flaws"],[30,"Poor"],[25,"Bad"],[20,"Wouldn't watch"],[0,"Unwatchable"]];function de(e){for(const[t,o]of ct)if(e>=t)return o;return"Unwatchable"}let ae=null,C=!1,_={};function dt(e){ae=e,C=!1,_={},re()}function re(){const e=ae,t=y[e],o=[...y].sort((m,d)=>d.total-m.total),i=o.indexOf(t)+1,n=o.filter(m=>m!==t&&Math.abs(m.total-t.total)<6).slice(0,5),a={};x.forEach(m=>{const d=[...y].sort((v,$)=>($.scores[m.key]||0)-(v.scores[m.key]||0));a[m.key]=d.indexOf(t)+1});const s=(m,d,v)=>`<span class="modal-meta-chip" onclick="exploreEntity('${d}','${v.replace(/'/g,"'")}')">${m}</span>`,l=(t.director||"").split(",").map(m=>m.trim()).filter(Boolean).map(m=>s(m,"director",m)).join(""),r=(t.writer||"").split(",").map(m=>m.trim()).filter(Boolean).map(m=>s(m,"writer",m)).join(""),c=(t.cast||"").split(",").map(m=>m.trim()).filter(Boolean).map(m=>s(m,"actor",m)).join(""),p=(t.productionCompanies||"").split(",").map(m=>m.trim()).filter(Boolean).map(m=>s(m,"company",m)).join(""),f=t.poster?`<img class="modal-poster" src="https://image.tmdb.org/t/p/w780${t.poster}" alt="${t.title}">`:`<div class="modal-poster-placeholder">${t.title} · ${t.year||""}</div>`,w=C?_:t.scores,h=C?H(_):t.total,S=x.map(m=>{const d=w[m.key],v=a[m.key];return C?`<div class="breakdown-row" style="align-items:center;gap:12px">
        <div class="breakdown-cat">${m.label}</div>
        <div class="breakdown-bar-wrap" style="flex:1">
          <input type="range" min="1" max="100" value="${d||50}"
            style="width:100%;accent-color:var(--blue);cursor:pointer"
            oninput="modalUpdateScore('${m.key}', this.value)">
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;min-width:60px">
          <div class="breakdown-val ${T(d||50)}" id="modal-edit-val-${m.key}">${d||50}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-align:right;margin-top:2px;white-space:nowrap" id="modal-edit-lbl-${m.key}">${de(d||50)}</div>
        </div>
        <div class="breakdown-wt">×${m.weight}</div>
      </div>`:`<div class="breakdown-row">
      <div class="breakdown-cat">${m.label}</div>
      <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:${d||0}%"></div></div>
      <div class="breakdown-val ${d?T(d):""}">${d??"—"}</div>
      <div class="breakdown-wt">×${m.weight}</div>
      <div class="modal-cat-rank">#${v}</div>
    </div>`}).join("");document.getElementById("modalContent").innerHTML=`
    ${f}
    <button class="modal-close" onclick="closeModal()" style="position:sticky;top:8px;float:right;z-index:10">×</button>
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">Rank #${i} of ${y.length}</div>
    <div class="modal-title">${t.title}</div>
    <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px">${t.year||""}</div>
    ${t.overview?`<div class="modal-overview">${t.overview}</div>`:""}
    <div style="margin-bottom:20px">
      ${l?`<div style="margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);margin-right:8px">Dir.</span>${l}</div>`:""}
      ${r?`<div style="margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);margin-right:8px">Wri.</span>${r}</div>`:""}
      ${c?`<div style="margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);margin-right:8px">Cast</span><div style="display:inline">${c}</div></div>`:""}
      ${p?`<div style="margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);margin-right:8px">Prod.</span><div style="display:inline">${p}</div></div>`:""}
    </div>
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
      <span style="font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--blue);letter-spacing:-2px" id="modal-total-display">${h}</span>
      <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)" id="modal-total-label">${D(h)}</span>
    </div>
    <div style="margin-bottom:20px">
      ${C?`<button onclick="modalSaveScores()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:var(--blue);color:white;border:none;padding:8px 18px;cursor:pointer;margin-right:8px">Save scores</button>
           <button onclick="modalCancelEdit()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:none;color:var(--dim);border:1px solid var(--rule);padding:8px 18px;cursor:pointer">Cancel</button>`:`<button onclick="modalEnterEdit()" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;background:none;color:var(--dim);border:1px solid var(--rule);padding:6px 14px;cursor:pointer">Edit scores</button>`}
    </div>
    <div>${S}</div>
    ${!C&&n.length>0?`<div class="compare-section">
      <div class="compare-title">Nearby in the rankings</div>
      ${n.map(m=>{const d=(m.total-t.total).toFixed(2),v=d>0?"+":"";return`<div class="compare-film" style="cursor:pointer" onclick="closeModal();openModal(${y.indexOf(m)})">
          <div class="compare-film-title">${m.title} <span style="font-family:'DM Mono';font-size:10px;color:var(--dim);font-weight:400">${m.year||""}</span></div>
          <div class="compare-film-score">${m.total}</div>
          <div class="compare-diff ${d>0?"diff-pos":"diff-neg"}">${v}${d}</div>
        </div>`}).join("")}
    </div>`:""}
  `,document.getElementById("filmModal").classList.add("open"),localStorage.setItem("ledger_last_modal",e)}window.modalEnterEdit=function(){const e=y[ae];C=!0,_={...e.scores},re()};window.modalCancelEdit=function(){C=!1,_={},re()};window.modalUpdateScore=function(e,t){_[e]=parseInt(t);const o=document.getElementById(`modal-edit-val-${e}`);o&&(o.textContent=t,o.className=`breakdown-val ${T(parseInt(t))}`);const i=document.getElementById(`modal-edit-lbl-${e}`);i&&(i.textContent=de(parseInt(t)));const n=H(_),a=document.getElementById("modal-total-display");a&&(a.textContent=n);const s=document.getElementById("modal-total-label");s&&(s.textContent=de(n))};window.modalSaveScores=function(){const e=y[ae];e.scores={..._},e.total=H(_),C=!1,_={},K(),N(),A(),fe().catch(t=>console.warn("sync failed",t)),re()};function pt(e){(!e||e.target===document.getElementById("filmModal"))&&document.getElementById("filmModal").classList.remove("open")}let ee="directors";function mt(e){const t={};return y.forEach(o=>{let i=[];e==="directors"?i=(o.director||"").split(",").map(n=>n.trim()).filter(Boolean):e==="writers"?i=(o.writer||"").split(",").map(n=>n.trim()).filter(Boolean):e==="actors"?i=(o.cast||"").split(",").map(n=>n.trim()).filter(Boolean):e==="companies"&&(i=(o.productionCompanies||"").split(",").map(n=>n.trim()).filter(Boolean)),i.forEach(n=>{t[n]||(t[n]=[]),t[n].push(o)})}),t}function Be(e){const t=mt(e);return Object.entries(t).filter(([,o])=>o.length>=2).map(([o,i])=>({name:o,films:i,avg:parseFloat((i.reduce((n,a)=>n+a.total,0)/i.length).toFixed(1)),catAvgs:x.reduce((n,a)=>{const s=i.filter(l=>l.scores[a.key]!=null).map(l=>l.scores[a.key]);return n[a.key]=s.length?parseFloat((s.reduce((l,r)=>l+r,0)/s.length).toFixed(1)):null,n},{})})).sort((o,i)=>i.avg-o.avg)}function le(e){e&&(ee=e);const t=["directors","writers","actors","companies"],o={directors:"Directors",writers:"Writers",actors:"Actors",companies:"Companies"},i=Be(ee);document.getElementById("exploreContent").innerHTML=`
    <div style="max-width:960px">
      <h2 style="font-family:'Playfair Display',serif;font-style:italic;font-size:36px;font-weight:900;letter-spacing:-1px;margin-bottom:6px">Explore</h2>
      <p style="color:var(--dim);font-size:13px;margin-bottom:28px">Click any name to see their full filmography in your list, scored by category.</p>

      <div class="explore-tabs">
        ${t.map(n=>`<button class="explore-tab ${n===ee?"active":""}" onclick="renderExploreIndex('${n}')">${o[n]}</button>`).join("")}
      </div>

      ${i.length===0?'<div style="color:var(--dim);font-style:italic;padding:40px 0">Not enough data yet — add more films to see patterns.</div>':`<div class="explore-index">
          ${i.map((n,a)=>`
            <div class="explore-index-card" onclick="exploreEntity('${ee.slice(0,-1)}','${n.name.replace(/'/g,"\\'")}')">
              <div style="display:flex;align-items:baseline;gap:10px">
                <div class="explore-index-name">${n.name}</div>
                <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:0.5px">#${a+1} of ${i.length}</div>
              </div>
              <div class="explore-index-meta">${n.films.length} film${n.films.length!==1?"s":""} · avg ${n.avg.toFixed(1)}</div>
            </div>`).join("")}
        </div>`}
    </div>
  `}function ut(e,t){document.getElementById("filmModal").classList.remove("open"),document.querySelectorAll(".screen").forEach(d=>d.classList.remove("active")),document.getElementById("explore").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(d=>d.classList.remove("active")),document.querySelectorAll(".nav-btn")[1].classList.add("active"),window.scrollTo(0,0),document.getElementById("exploreContent").scrollTop=0;const o=e==="director"?"directors":e==="writer"?"writers":e==="actor"?"actors":"companies",i=e==="director"?"Director":e==="writer"?"Writer":e==="actor"?"Actor":"Company",n=y.filter(d=>e==="director"?(d.director||"").split(",").map(v=>v.trim()).includes(t):e==="writer"?(d.writer||"").split(",").map(v=>v.trim()).includes(t):e==="actor"?(d.cast||"").split(",").map(v=>v.trim()).includes(t):e==="company"?(d.productionCompanies||"").split(",").map(v=>v.trim()).includes(t):!1).sort((d,v)=>v.total-d.total);if(n.length===0){le();return}const a=Be(o),s=a.findIndex(d=>d.name===t)+1,l=a.length,r=a.find(d=>d.name===t),c=r?r.avg.toFixed(1):(n.reduce((d,v)=>d+v.total,0)/n.length).toFixed(1),p=n[0],f={};x.forEach(d=>{const v=a.filter(P=>P.catAvgs[d.key]!=null).sort((P,tt)=>tt.catAvgs[d.key]-P.catAvgs[d.key]),$=v.findIndex(P=>P.name===t)+1;f[d.key]=$>0?{rank:$,total:v.length}:null});const h=x.map(d=>{const v=n.filter($=>$.scores[d.key]!=null).map($=>$.scores[d.key]);return{...d,avg:v.length?parseFloat((v.reduce(($,P)=>$+P,0)/v.length).toFixed(1)):null}}).filter(d=>d.avg!=null).sort((d,v)=>v.avg-d.avg),S=h[0],m=h[h.length-1];document.getElementById("exploreContent").innerHTML=`
    <div style="max-width:960px">
      <span class="explore-back" onclick="renderExploreIndex('${o}')">← Back to Explore</span>

      <div class="explore-entity-header">
        <div class="explore-entity-name">${t}</div>
        <div class="explore-entity-role">${i}</div>
      </div>

      <div class="explore-stat-row">
        <div class="explore-stat">
          <div class="explore-stat-val">${c}</div>
          <div class="explore-stat-label">Avg score</div>
        </div>
        <div class="explore-stat">
          <div class="explore-stat-val" style="color:var(--blue)">#${s} <span style="font-size:16px;color:var(--dim)">of ${l}</span></div>
          <div class="explore-stat-label">Rank among ${o}</div>
        </div>
        <div class="explore-stat">
          <div class="explore-stat-val">${n.length}</div>
          <div class="explore-stat-label">Films in list</div>
        </div>
        <div class="explore-stat">
          <div class="explore-stat-val ${T(p.total)}">${p.total}</div>
          <div class="explore-stat-label">Best: ${p.title.length>14?p.title.slice(0,13)+"…":p.title}</div>
        </div>
      </div>

      ${h.length>0?`
        <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:12px">Category averages · with rank among ${o}</div>
        <div class="explore-cat-breakdown">
          ${h.map(d=>{const v=f[d.key];return`
            <div class="explore-cat-cell">
              <div class="explore-cat-cell-label">${d.label}</div>
              <div class="explore-cat-cell-val ${T(d.avg)}">${d.avg.toFixed(1)}</div>
              ${v?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);margin-top:2px">#${v.rank} of ${v.total}</div>`:""}
            </div>`}).join("")}
        </div>

        ${S&&m&&S.key!==m.key?`
          <div style="background:var(--blue-pale);border:1px solid var(--rule);padding:16px 20px;margin:20px 0;font-size:13px;line-height:1.7;color:var(--ink)">
            You rate ${t}'s <strong>${S.label.toLowerCase()}</strong> highest (avg ${S.avg.toFixed(1)})${m.avg<70?`, but find their <strong>${m.label.toLowerCase()}</strong> less compelling (avg ${m.avg.toFixed(1)})`:""}.
            ${s<=3?` Ranks <strong>#${s}</strong> among all ${o} in your list.`:""}
          </div>`:""}
      `:""}

      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin:24px 0 12px">Films</div>
      ${n.map((d,v)=>`
        <div class="film-row" onclick="openModal(${y.indexOf(d)})" style="cursor:pointer">
          <div class="film-rank">${v+1}</div>
          <div class="film-title-cell">
            <div class="film-title-main">${d.title}</div>
            <div class="film-title-sub">${d.year||""} · ${d.director||""}</div>
          </div>
          ${["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"].map($=>`<div class="film-score ${d.scores[$]?T(d.scores[$]):"}"}">${d.scores[$]??"—"}</div>`).join("")}
          <div class="film-total">${d.total}</div>
        </div>`).join("")}
    </div>
  `}function Te(){const e={},t={},o={};y.forEach(r=>{r.director.split(",").forEach(c=>{c=c.trim(),c&&(e[c]||(e[c]=[]),e[c].push(r.total))}),r.cast.split(",").forEach(c=>{c=c.trim(),c&&(t[c]||(t[c]=[]),t[c].push(r.total))}),r.year&&(o[r.year]||(o[r.year]=[]),o[r.year].push(r.total))});const i=r=>Math.round(r.reduce((c,p)=>c+p,0)/r.length*100)/100,n=Object.entries(e).filter(([,r])=>r.length>=2).map(([r,c])=>({name:r,avg:i(c),count:c.length})).sort((r,c)=>c.avg-r.avg).slice(0,10),a=Object.entries(t).filter(([,r])=>r.length>=2).map(([r,c])=>({name:r,avg:i(c),count:c.length})).sort((r,c)=>c.avg-r.avg).slice(0,10),s=Object.entries(o).filter(([,r])=>r.length>=2).map(([r,c])=>({name:r,avg:i(c),count:c.length})).sort((r,c)=>c.avg-r.avg).slice(0,10),l=x.map(r=>{const c=y.map(p=>p.scores[r.key]).filter(p=>p!=null);return{...r,avg:i(c)}});document.getElementById("analysisContent").innerHTML=`
    <h2 style="font-family:'Playfair Display',serif;font-style:italic;font-size:36px;font-weight:900;letter-spacing:-1px;margin-bottom:8px">Your taste, decoded</h2>
    <p style="color:var(--dim);font-size:13px;margin-bottom:32px">${y.length} films ranked · Weighted formula: Enjoyability×4, Plot×3, Execution×3, Uniqueness×2, Acting×2, Production×1, Rewatchability×1, Ending×1</p>

    <div style="background:var(--cream);border:1px solid var(--rule);border-radius:6px;padding:24px;margin-bottom:32px">
      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:16px">Category Averages Across All Films</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${l.map(r=>`
          <div style="text-align:center">
            <div style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);margin-bottom:4px">${r.label}</div>
            <div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--blue)">${r.avg}</div>
          </div>`).join("")}
      </div>
    </div>

    <div class="analysis-grid">
      <div class="analysis-card">
        <div class="analysis-card-title">Top Directors (2+ films)</div>
        ${n.map(r=>`<div class="analysis-item">
          <div class="analysis-name">${r.name}</div>
          <div class="analysis-count">${r.count}f</div>
          <div class="analysis-score-val">${r.avg}</div>
        </div>`).join("")}
      </div>
      <div class="analysis-card">
        <div class="analysis-card-title">Top Actors (2+ films)</div>
        ${a.map(r=>`<div class="analysis-item">
          <div class="analysis-name">${r.name}</div>
          <div class="analysis-count">${r.count}f</div>
          <div class="analysis-score-val">${r.avg}</div>
        </div>`).join("")}
      </div>
      <div class="analysis-card">
        <div class="analysis-card-title">Best Years (2+ films)</div>
        ${s.map(r=>`<div class="analysis-item">
          <div class="analysis-name">${r.name}</div>
          <div class="analysis-count">${r.count}f</div>
          <div class="analysis-score-val">${r.avg}</div>
        </div>`).join("")}
      </div>
    </div>
  `}const pe="f5a446a5f70a9f6a16a8ddd052c121f2",me="https://api.themoviedb.org/3",yt="https://ledger-proxy.noahparikhcott.workers.dev";let $e=null,F=null;function De(){document.getElementById("predict-search").value="",document.getElementById("predict-search-results").innerHTML="",document.getElementById("predict-result").innerHTML="",F=null,setTimeout(()=>document.getElementById("predict-search")?.focus(),50)}function ft(){clearTimeout($e),$e=setTimeout(Le,500)}async function Le(){const e=document.getElementById("predict-search").value.trim();if(!e||e.length<2)return;const t=document.getElementById("predict-search-results");t.innerHTML='<div class="tmdb-loading">Searching…</div>';try{const n=((await(await fetch(`${me}/search/movie?api_key=${pe}&query=${encodeURIComponent(e)}&language=en-US&page=1`)).json()).results||[]).slice(0,5);if(!n.length){t.innerHTML='<div class="tmdb-error">No results found.</div>';return}const a=new Set(y.map(s=>s.title.toLowerCase()));t.innerHTML=n.map(s=>{const l=s.release_date?.slice(0,4)||"",r=s.poster_path?`<img class="tmdb-result-poster" src="https://image.tmdb.org/t/p/w92${s.poster_path}">`:'<div class="tmdb-result-poster-placeholder">no img</div>',c=a.has(s.title.toLowerCase());return`<div class="tmdb-result ${c?"opacity-50":""}" onclick="${c?"":`predictSelectFilm(${s.id}, '${s.title.replace(/'/g,"\\'")}', '${l}')`}" style="${c?"opacity:0.4;cursor:default":""}">
        ${r}
        <div class="tmdb-result-info">
          <div class="tmdb-result-title">${s.title}</div>
          <div class="tmdb-result-meta">${l}${c?" · already in your list":""}</div>
          <div class="tmdb-result-overview">${(s.overview||"").slice(0,100)}${s.overview?.length>100?"…":""}</div>
        </div>
      </div>`}).join("")}catch{t.innerHTML='<div class="tmdb-error">Search failed — check connection.</div>'}}async function vt(e,t,o){document.getElementById("predict-search-results").innerHTML="",document.getElementById("predict-search").value=t,document.getElementById("predict-result").innerHTML=`
    <div class="predict-loading">
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:var(--dim)">Analysing your taste profile…</div>
      <div class="predict-loading-label">Reading ${y.length} films · building your fingerprint · predicting scores</div>
    </div>`;let i={},n={};try{const[f,w]=await Promise.all([fetch(`${me}/movie/${e}?api_key=${pe}`),fetch(`${me}/movie/${e}/credits?api_key=${pe}`)]);i=await f.json(),n=await w.json()}catch{}const a=(n.crew||[]).filter(f=>f.job==="Director").map(f=>f.name).join(", "),s=(n.crew||[]).filter(f=>["Screenplay","Writer","Story"].includes(f.job)).map(f=>f.name).slice(0,2).join(", "),l=(n.cast||[]).slice(0,8).map(f=>f.name).join(", "),r=(i.genres||[]).map(f=>f.name).join(", "),c=i.overview||"",p=i.poster_path||null;F={tmdbId:e,title:t,year:o,director:a,writer:s,cast:l,genres:r,overview:c,poster:p},await bt(F)}function ht(){const e=["plot","execution","acting","production","enjoyability","rewatchability","ending","uniqueness"],t={};e.forEach(s=>{const l=y.filter(p=>p.scores[s]!=null).map(p=>p.scores[s]);if(!l.length){t[s]={mean:70,std:10,min:0,max:100};return}const r=l.reduce((p,f)=>p+f,0)/l.length,c=Math.sqrt(l.reduce((p,f)=>p+(f-r)**2,0)/l.length);t[s]={mean:Math.round(r*10)/10,std:Math.round(c*10)/10,min:Math.min(...l),max:Math.max(...l)}});const o=[...y].sort((s,l)=>l.total-s.total),i=o.slice(0,10).map(s=>`${s.title} (${s.total})`).join(", "),n=o.slice(-5).map(s=>`${s.title} (${s.total})`).join(", "),a=x.map(s=>`${s.label}×${s.weight}`).join(", ");return{stats:t,top10:i,bottom5:n,weightStr:a,archetype:b?.archetype,archetypeSecondary:b?.archetype_secondary,totalFilms:y.length}}function gt(e){const t=(e.director||"").split(",").map(i=>i.trim()).filter(Boolean),o=(e.cast||"").split(",").map(i=>i.trim()).filter(Boolean);return y.filter(i=>{const n=(i.director||"").split(",").map(s=>s.trim()),a=(i.cast||"").split(",").map(s=>s.trim());return t.some(s=>n.includes(s))||o.some(s=>a.includes(s))}).sort((i,n)=>n.total-i.total).slice(0,8)}async function bt(e){const t=ht(),o=gt(e),i=o.length?o.map(l=>`- ${l.title} (${l.year||""}): total=${l.total}, plot=${l.scores.plot}, execution=${l.scores.execution}, acting=${l.scores.acting}, production=${l.scores.production}, enjoyability=${l.scores.enjoyability}, rewatchability=${l.scores.rewatchability}, ending=${l.scores.ending}, uniqueness=${l.scores.uniqueness}`).join(`
`):"No direct comparisons found in rated list.",n=Object.entries(t.stats).map(([l,r])=>`${l}: mean=${r.mean}, std=${r.std}, range=${r.min}–${r.max}`).join(`
`),a="You are a precise film taste prediction engine. Your job is to predict how a specific user would score an unrated film, based on their detailed rating history and taste profile. You must respond ONLY with valid JSON — no preamble, no markdown, no explanation outside the JSON.",s=`USER TASTE PROFILE:
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
}`;try{const p=((await(await fetch(yt,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:a,messages:[{role:"user",content:s}]})})).json()).content?.[0]?.text||"").replace(/```json|```/g,"").trim(),f=JSON.parse(p);xt(e,f,o)}catch(l){document.getElementById("predict-result").innerHTML=`
      <div class="tmdb-error">Prediction failed: ${l.message}. Check that the proxy is running and your API key is valid.</div>`}}function xt(e,t,o){let i=0,n=0;x.forEach(c=>{const p=t.predicted_scores[c.key];p!=null&&(i+=p*c.weight,n+=c.weight)});const a=n>0?Math.round(i/n*100)/100:0,s=e.poster?`<img class="predict-poster" src="https://image.tmdb.org/t/p/w185${e.poster}" alt="${e.title}">`:`<div class="predict-poster-placeholder">${e.title}</div>`,l={high:"conf-high",medium:"conf-medium",low:"conf-low"}[t.confidence]||"conf-medium",r={high:"High confidence",medium:"Medium confidence",low:"Low confidence"}[t.confidence]||"";document.getElementById("predict-result").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:16px">Prediction</div>

    <div class="predict-film-card">
      ${s}
      <div style="flex:1">
        <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:900;letter-spacing:-0.5px;margin-bottom:2px">${e.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px">${e.year}${e.director?" · "+e.director:""}</div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <div class="predict-total-display">${a}</div>
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${D(a)}</div>
            <span class="predict-confidence ${l}">${r}</span>
          </div>
        </div>
      </div>
    </div>

    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:12px">Predicted category scores</div>
    <div class="predict-score-grid">
      ${x.map(c=>{const p=t.predicted_scores[c.key];return`<div class="predict-score-cell">
          <div class="predict-score-cell-label">${c.label}</div>
          <div class="predict-score-cell-val ${p?T(p):""}">${p??"—"}</div>
        </div>`}).join("")}
    </div>

    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:10px">Reasoning</div>
    <div class="predict-reasoning">${t.reasoning}</div>

    ${o.length>0?`
      <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin:24px 0 10px">Comparisons from your list</div>
      ${o.slice(0,5).map(c=>{const p=(a-c.total).toFixed(1),f=p>0?"+":"";return`<div class="predict-comp-row" onclick="openModal(${y.indexOf(c)})">
          <div class="predict-comp-title">${c.title} <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);font-weight:400">${c.year||""}</span></div>
          <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim)">${c.total}</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:600;${parseFloat(p)>0?"color:var(--green)":"color:var(--red)"}">${f}${p} predicted</div>
        </div>`}).join("")}
    `:""}

    <div class="btn-row" style="margin-top:32px">
      <button class="btn btn-outline" onclick="initPredict()">← New prediction</button>
      <button class="btn btn-action" onclick="predictAddToList()">Add to list & rate it →</button>
    </div>
  `}function wt(){F&&(document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active")),document.getElementById("add").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(e=>e.classList.remove("active")),document.querySelector('.nav-btn[onclick*="add"]').classList.add("active"),setTimeout(()=>{const e=document.getElementById("f-search");e&&(e.value=F.title,E(()=>Promise.resolve().then(()=>Ot),void 0).then(t=>t.liveSearch(F.title)))},100))}let V="all",Ae="focused",q=[],j=0,k={},B={};const $t={focused:15,thorough:30,deep:50},ke=8;function kt(e){V=e,document.querySelectorAll('[id^="calcat_"]').forEach(t=>t.className="company-chip"),document.getElementById("calcat_"+e).className="company-chip checked"}function Mt(e){Ae=e,document.querySelectorAll('[id^="calint_"]').forEach(t=>t.className="company-chip"),document.getElementById("calint_"+e).className="company-chip checked"}function Et(e,t){const o=[];(e==="all"?x.map(s=>s.key):[e]).forEach(s=>{const l=y.filter(r=>r.scores[s]!=null).sort((r,c)=>r.scores[s]-c.scores[s]);for(let r=0;r<l.length-1;r++)for(let c=r+1;c<l.length;c++){const p=Math.abs(l[r].scores[s]-l[c].scores[s]);if(p<=8)o.push({a:l[r],b:l[c],catKey:s,diff:p});else break}}),o.sort((s,l)=>s.diff-l.diff);const n=new Set,a=[];for(const s of o){const l=[s.a.title,s.b.title,s.catKey].join("|");n.has(l)||(n.add(l),a.push(s))}return a.sort(()=>Math.random()-.5).slice(0,t)}function St(){const e=$t[Ae];if(q=Et(V,e),q.length===0){alert("Not enough films with close scores to calibrate. Try a different category or add more films.");return}j=0,k={},B={},y.forEach(t=>{B[t.title]={...t.scores}}),document.getElementById("cal-setup").style.display="none",document.getElementById("cal-matchups").style.display="block",document.getElementById("cal-cat-label").textContent=V==="all"?"All categories":x.find(t=>t.key===V)?.label||V,je()}function je(){if(j>=q.length){It();return}const{a:e,b:t,catKey:o}=q[j],i=q.length,n=Math.round(j/i*100);document.getElementById("cal-progress-label").textContent=`Matchup ${j+1} of ${i}`,document.getElementById("cal-progress-bar").style.width=n+"%";const a=x.find(r=>r.key===o)?.label||o,s=B[e.title]?.[o]??e.scores[o],l=B[t.title]?.[o]??t.scores[o];document.getElementById("cal-matchup-card").innerHTML=`
    <div class="hth-prompt">Which has better <em>${a}</em>?</div>
    <div class="hth-row">
      <div class="hth-card" onclick="calChoose('a')">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${a}</div>
        <div class="hth-title">${e.title}</div>
        <div class="hth-score">${e.year||""}</div>
        <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:var(--blue);margin-top:8px">${s}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${D(s)}</div>
      </div>
      <div class="hth-vs">vs</div>
      <div class="hth-card" onclick="calChoose('b')">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${a}</div>
        <div class="hth-title">${t.title}</div>
        <div class="hth-score">${t.year||""}</div>
        <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:var(--blue);margin-top:8px">${l}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${D(l)}</div>
      </div>
    </div>
    <div class="hth-skip" onclick="calChoose('skip')">Too close to call — skip</div>
  `}window.calChoose=function(e){if(e!=="skip"){const{a:t,b:o,catKey:i}=q[j],n=B[t.title]?.[i]??t.scores[i],a=B[o.title]?.[i]??o.scores[i],s=1/(1+Math.pow(10,(a-n)/40)),l=1-s,r=e==="a"?1:0,c=1-r,p=Math.round(Math.min(100,Math.max(1,n+ke*(r-s)))),f=Math.round(Math.min(100,Math.max(1,a+ke*(c-l))));if(k[t.title]||(k[t.title]={}),k[o.title]||(k[o.title]={}),p!==n){const w=k[t.title][i]?.old??n;k[t.title][i]={old:w,new:p},B[t.title][i]=p}if(f!==a){const w=k[o.title][i]?.old??a;k[o.title][i]={old:w,new:f},B[o.title][i]=f}}j++,je()};function It(){document.getElementById("cal-matchups").style.display="none",document.getElementById("cal-review").style.display="block";const e=Object.entries(k).flatMap(([o,i])=>Object.entries(i).map(([n,{old:a,new:s}])=>({title:o,catKey:n,old:a,new:s}))).filter(o=>o.old!==o.new).sort((o,i)=>Math.abs(i.new-i.old)-Math.abs(o.new-o.old));if(e.length===0){document.getElementById("cal-diff-list").innerHTML=`
      <div style="text-align:center;padding:40px;color:var(--dim)">
        <div style="font-family:'Playfair Display',serif;font-size:20px;margin-bottom:8px">Your list is well-calibrated.</div>
        <div style="font-size:13px">No significant inconsistencies found.</div>
      </div>`,document.getElementById("cal-apply-btn").style.display="none";return}document.getElementById("cal-apply-btn").style.display="";const t=Object.fromEntries(x.map(o=>[o.key,o.label]));document.getElementById("cal-diff-list").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">
      ${e.length} score${e.length!==1?"s":""} would change
    </div>
    ${e.map((o,i)=>{const n=o.new>o.old?"up":"down",a=n==="up"?"↑":"↓",s=n==="up"?"var(--green)":"var(--red)",l=y.find(r=>r.title===o.title);return`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule)">
        <input type="checkbox" id="caldiff_${i}" checked style="width:16px;height:16px;accent-color:var(--blue);flex-shrink:0"
          data-movie-idx="${y.findIndex(r=>r.title===o.title)}" data-cat="${o.catKey}" data-old="${o.old}" data-new="${o.new}">
        <div style="flex:1">
          <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:15px">${o.title}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px">${t[o.catKey]} · ${l?.year||""}</div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--dim)">${o.old}</div>
        <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:${s}">${a} ${o.new}</div>
      </div>`}).join("")}
  `}function _t(){try{const e=document.querySelectorAll('[id^="caldiff_"]');let t=0;e.forEach(o=>{if(!o.checked)return;const i=parseInt(o.dataset.movieIdx),n=o.dataset.cat,a=parseInt(o.dataset.new),s=y[i];s&&s.scores[n]!==void 0&&(s.scores[n]=a,s.total=H(s.scores),t++)}),K(),N(),E(()=>Promise.resolve().then(()=>Y),void 0).then(o=>o.updateStorageStatus()),A(),document.querySelectorAll(".screen").forEach(o=>o.classList.remove("active")),document.getElementById("rankings").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(o=>o.classList.remove("active")),document.querySelector('.nav-btn[onclick*="rankings"]').classList.add("active"),ve(),alert(`Applied ${t} score change${t!==1?"s":""}. Rankings updated.`)}catch(e){console.error("applyCalibration error:",e),alert("Error applying changes: "+e.message)}}function ve(){q=[],j=0,k={},B={},document.getElementById("cal-setup").style.display="block",document.getElementById("cal-matchups").style.display="none",document.getElementById("cal-review").style.display="none",document.getElementById("cal-apply-btn").style.display=""}const ce={Visceralist:{weights:{plot:2,execution:2,acting:2,production:1,enjoyability:5,rewatchability:3,ending:1,uniqueness:1},quote:`"If I'm not feeling it, nothing else matters."`},Formalist:{weights:{plot:2,execution:4,acting:1,production:3,enjoyability:1,rewatchability:1,ending:1,uniqueness:3},quote:'"How you say it matters as much as what you say."'},Narrativist:{weights:{plot:4,execution:2,acting:2,production:1,enjoyability:1,rewatchability:1,ending:3,uniqueness:1},quote:'"A great story can survive almost anything."'},Humanist:{weights:{plot:2,execution:2,acting:4,production:1,enjoyability:3,rewatchability:1,ending:1,uniqueness:1},quote:'"I come for the story, I stay for the people."'},Completionist:{weights:{plot:2,execution:3,acting:1,production:1,enjoyability:1,rewatchability:1,ending:1,uniqueness:4},quote:`"I want something I've never seen before."`},Sensualist:{weights:{plot:1,execution:4,acting:1,production:4,enjoyability:1,rewatchability:1,ending:1,uniqueness:2},quote:'"Cinema is first an aesthetic experience."'},Revisionist:{weights:{plot:1,execution:2,acting:1,production:1,enjoyability:1,rewatchability:4,ending:2,uniqueness:3},quote:'"My first watch is just the beginning."'},Absolutist:{weights:{plot:3,execution:2,acting:1,production:1,enjoyability:1,rewatchability:1,ending:4,uniqueness:2},quote:'"The ending is the argument."'},Atmospherist:{weights:{plot:1,execution:2,acting:1,production:2,enjoyability:3,rewatchability:5,ending:1,uniqueness:1},quote:'"The right film at the right moment is everything."'}},Ct=[{q:"You finish a film that you admired more than you enjoyed. How do you rate it?",options:[{key:"A",text:"Rate it highly. The craft speaks for itself."},{key:"B",text:"Rate it somewhere in the middle. Both things are true."},{key:"C",text:"Rate it lower. If it didn't connect, something didn't work."},{key:"D",text:"Watch it again before deciding."}]},{q:"A film you've been completely absorbed in for two hours ends in a way that doesn't satisfy you. How much does that affect how you feel about the whole thing?",options:[{key:"A",text:"A lot. The ending is the argument. It reframes everything before it."},{key:"B",text:"Somewhat. It takes the edge off, but two great hours are still two great hours."},{key:"C",text:"Not much. I was there for the ride, not the destination."},{key:"D",text:"Depends on the film. Some endings are meant to be unresolved."}]},{q:"Think about a film you've seen multiple times. Is there a version of that experience — a specific night, a specific mood, a specific person you watched it with — that you remember more than the film itself?",options:[{key:"A",text:"Yes, and honestly that's a big part of why I love it."},{key:"B",text:"Maybe, but I try to rate the film on its own terms."},{key:"C",text:"Not really. A great film is great regardless of when you watch it."},{key:"D",text:"I don't rewatch much. I'd rather see something new."}]},{q:"It's a Sunday. You have the whole afternoon. You're scrolling through options and you see a film you've seen probably four or five times already. Do you put it on?",options:[{key:"A",text:"Honestly, yeah. Sometimes that's exactly what the moment calls for."},{key:"B",text:"Only if I'm in a specific mood for it. Otherwise I'd rather find something new."},{key:"C",text:"Probably not. There's too much I haven't seen."},{key:"D",text:"Depends who I'm watching with."}]},{q:"Sometimes a performance makes you forget you're watching a film. You're not thinking about the script or the direction — you're just completely inside another person. How much does that experience shape how you feel about a film overall?",options:[{key:"A",text:"It's everything. A performance like that can carry a film for me."},{key:"B",text:"It elevates it, but I need the rest of the film to hold up too."},{key:"C",text:"I notice it, but it's one piece of a bigger picture."},{key:"D",text:"Honestly I'm usually more absorbed by the world the film creates than the people in it."}]},{q:"A film has one of the greatest performances you've ever seen. The script around it is a mess. Where do you land?",options:[{key:"A",text:"Still a great film. That performance is the film."},{key:"B",text:"Good but frustrating. What could have been."},{key:"C",text:"The script drags it down significantly. A film is only as strong as its weakest part."},{key:"D",text:"Depends how bad the script is. There's a threshold."}]}];let g="name",W={},te="",I=null,oe=null;function he(){const e=document.getElementById("onboarding-overlay");e.style.display="flex",g="name",W={},L()}function L(){const e=document.getElementById("ob-card-content");if(g==="name")e.innerHTML=`
      <div class="ob-eyebrow">ledger · onboarding</div>
      <div class="ob-title">What do you call yourself?</div>
      <div class="ob-sub">No account, no password. Just a name. Your ratings sync to the cloud under this identity. You can open ledger on any device and pick up where you left off.</div>
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
    `,setTimeout(()=>document.getElementById("ob-name-field")?.focus(),50);else if(g==="returning")e.innerHTML=`
      <div class="ob-eyebrow">ledger · returning user</div>
      <div class="ob-title">Welcome back.</div>
      <div class="ob-sub">Enter your username to restore your profile and film list from the cloud. It looks like <em>alex-7742</em>.</div>
      <input class="ob-name-input" id="ob-returning-field" type="text" placeholder="e.g. alex-7742" maxlength="64" onkeydown="if(event.key==='Enter') obLookupUser()">
      <div id="ob-returning-error" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--red);margin-bottom:12px;display:none">Username not found. Check spelling and try again.</div>
      <button class="ob-btn" id="ob-returning-btn" onclick="obLookupUser()">Restore profile →</button>
      <div style="text-align:center;margin-top:20px">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:1px;cursor:pointer;text-decoration:underline" onclick="obStep='name';renderObStep()">← New user instead</span>
      </div>
    `,setTimeout(()=>document.getElementById("ob-returning-field")?.focus(),50);else if(g==="import")e.innerHTML=`
      <div class="ob-eyebrow">ledger · import</div>
      <div class="ob-title">Import your films.</div>
      <div class="ob-sub">Select your <em>film_rankings.json</em> exported from a previous version of ledger.</div>
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
    `;else if(typeof g=="number"){const t=Ct[g],o=Math.round(g/6*100);e.innerHTML=`
      <div class="ob-progress">Question ${g+1} of 6</div>
      <div class="ob-progress-bar"><div class="ob-progress-fill" style="width:${o}%"></div></div>
      <div class="ob-question">${t.q}</div>
      ${t.options.map(i=>`
        <div class="ob-option ${W[g]===i.key?"selected":""}" onclick="obSelectAnswer(${g}, '${i.key}', this)">
          <span class="ob-option-key">${i.key}</span>
          <span class="ob-option-text">${i.text}</span>
        </div>`).join("")}
      <div class="ob-nav">
        ${g>0?'<button class="ob-btn-secondary" onclick="obBack()">← Back</button>':""}
        <button class="ob-btn-primary" id="ob-next-btn" onclick="obNext()" ${W[g]?"":"disabled"}>
          ${g===5?"See my archetype →":"Next →"}
        </button>
      </div>
    `}else if(g==="reveal"){const t=Bt(W);I=t,I._slug||(I._slug=te.toLowerCase().replace(/[^a-z0-9]/g,"-")+"-"+Math.floor(Math.random()*9e3+1e3));const o=ce[t.primary];e.innerHTML=`
      <div class="ob-eyebrow">Your taste profile</div>
      <div class="ob-reveal">
        <div class="ob-archetype-name">${t.primary}</div>
        <div class="ob-archetype-quote">${o.quote}</div>
        ${t.secondary?`<div style="font-size:13px;color:var(--dim);margin-bottom:4px">Secondary archetype</div>
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:20px;color:var(--ink);margin-bottom:20px">${t.secondary}</div>`:""}
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:12px">Your scoring weights</div>
      <div class="ob-weights-grid">
        ${Object.entries(o.weights).map(([i,n])=>`
          <div class="ob-weight-row">
            <span class="ob-weight-label">${i.charAt(0).toUpperCase()+i.slice(1)}</span>
            <span class="ob-weight-val">×${n}</span>
          </div>`).join("")}
      </div>
      <div class="ob-sub" style="margin-top:16px;margin-bottom:8px">Weights shape how your scores are calculated. You can adjust them anytime from your profile.</div>
      <div style="background:var(--cream);border:1px solid var(--rule);padding:12px 16px;margin-bottom:24px;font-family:'DM Mono',monospace;font-size:11px;color:var(--dim)">
        Your username: <strong style="color:var(--ink)" id="ob-reveal-username">—</strong><br>
        <span style="font-size:10px">Save this to restore your profile on any device.</span>
      </div>
      <button class="ob-btn" onclick="obFinishFromReveal()">Enter ledger →</button>
    `,setTimeout(()=>{const i=document.getElementById("ob-reveal-username");i&&(i.textContent=I._slug)},0)}}window.obCheckName=function(){const e=document.getElementById("ob-name-field")?.value?.trim(),t=document.getElementById("ob-name-btn");t&&(t.disabled=!e||e.length<1)};window.obSubmitName=function(){const e=document.getElementById("ob-name-field")?.value?.trim();e&&(te=e,g=0,L())};window.obShowReturning=function(){g="returning",L()};window.obShowImport=function(){g="import",oe=null,L()};window.obHandleImportDrop=function(e){e.preventDefault(),document.getElementById("ob-import-drop").style.borderColor="var(--rule-dark)";const t=e.dataTransfer.files[0];t&&ze(t)};window.obHandleImportFile=function(e){const t=e.files[0];t&&ze(t)};function ze(e){const t=new FileReader;t.onload=o=>{try{const i=JSON.parse(o.target.result);if(!Array.isArray(i)||i.length===0)throw new Error("invalid");if(!i[0].scores||!i[0].title)throw new Error("invalid");oe=i,document.getElementById("ob-import-status").textContent=`✓ ${i.length} films ready to import`,document.getElementById("ob-import-status").style.color="var(--green)",document.getElementById("ob-import-drop").style.borderColor="var(--green)",document.getElementById("ob-import-drop").innerHTML=`<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--green)">${e.name}</div>`,document.getElementById("ob-import-btn").disabled=!1}catch{document.getElementById("ob-import-status").textContent="That doesn't look like a valid ledger JSON file.",document.getElementById("ob-import-status").style.color="var(--red)"}},t.readAsText(e)}window.obConfirmImport=function(){oe&&(ne(oe),g=0,L())};window.obLookupUser=async function(){const e=document.getElementById("ob-returning-btn"),t=document.getElementById("ob-returning-error"),o=document.getElementById("ob-returning-field")?.value?.trim().toLowerCase();if(o){e.disabled=!0,e.textContent="Looking up…",t.style.display="none";try{const{data:i,error:n}=await se.from("ledger_users").select("*").eq("username",o).single();if(n||!i)throw new Error("not found");ie({id:i.id,username:i.username,display_name:i.display_name,archetype:i.archetype,archetype_secondary:i.archetype_secondary,weights:i.weights,harmony_sensitivity:i.harmony_sensitivity}),i.movies&&Array.isArray(i.movies)&&i.movies.length>0&&ne(i.movies),X(),N(),Q(),K(),document.getElementById("onboarding-overlay").style.display="none";const a=await E(()=>Promise.resolve().then(()=>Y),void 0);a.updateMastheadProfile(),a.setCloudStatus("synced"),a.updateStorageStatus(),A()}catch{e.disabled=!1,e.textContent="Restore profile →",t.style.display="block"}}};window.obSelectAnswer=function(e,t,o){W[e]=t,o.closest(".ob-card").querySelectorAll(".ob-option").forEach(n=>n.classList.remove("selected")),o.classList.add("selected");const i=document.getElementById("ob-next-btn");i&&(i.disabled=!1)};window.obBack=function(){g>0?(g--,L()):(g="name",L())};window.obNext=function(){W[g]&&(g<5?(g++,L()):(g="reveal",L()))};window.obFinishFromReveal=function(){if(!I)return;const e=ce[I.primary];Tt(I.primary,I.secondary||"",e.weights,I.harmonySensitivity)};function Bt(e){const t={};Object.keys(ce).forEach(n=>t[n]=0),e[0]==="A"&&(t.Formalist+=2,t.Sensualist+=1,t.Completionist+=1),e[0]==="C"&&(t.Visceralist+=2,t.Atmospherist+=1),e[0]==="D"&&(t.Revisionist+=3),e[0]==="B"&&(t.Narrativist+=1,t.Humanist+=1),e[1]==="A"&&(t.Absolutist+=3,t.Narrativist+=2),e[1]==="C"&&(t.Visceralist+=2,t.Atmospherist+=2),e[1]==="D"&&(t.Completionist+=1,t.Revisionist+=1),e[1]==="B"&&(t.Humanist+=1,t.Formalist+=1),e[2]==="A"&&(t.Atmospherist+=3),e[2]==="C"&&(t.Formalist+=2,t.Absolutist+=2),e[2]==="D"&&(t.Completionist+=2,t.Revisionist-=1),e[2]==="B"&&(t.Narrativist+=1),e[3]==="A"&&(t.Atmospherist+=2,t.Revisionist+=2),e[3]==="C"&&(t.Completionist+=3),e[3]==="D"&&(t.Atmospherist+=1),e[3]==="B"&&(t.Sensualist+=1),e[4]==="A"&&(t.Humanist+=3,t.Visceralist+=1),e[4]==="D"&&(t.Sensualist+=3),e[4]==="C"&&(t.Formalist+=1,t.Completionist+=1),e[4]==="B"&&(t.Narrativist+=1,t.Absolutist+=1);let o=.3;e[5]==="A"&&(t.Visceralist+=1,o=0),e[5]==="C"&&(t.Absolutist+=1,o=1),e[5]==="B"&&(o=.4);const i=Object.entries(t).sort((n,a)=>a[1]-n[1]);return{primary:i[0][0],secondary:i[1][1]>0?i[1][0]:null,harmonySensitivity:o}}async function Tt(e,t,o,i){const n=crypto.randomUUID(),a=I._slug||te.toLowerCase().replace(/[^a-z0-9]/g,"-")+"-"+Math.floor(Math.random()*9e3+1e3);ie({id:n,username:a,display_name:te,archetype:e,archetype_secondary:t,weights:o,harmony_sensitivity:i}),Q(),K(),document.getElementById("onboarding-overlay").style.display="none";const s=await E(()=>Promise.resolve().then(()=>Y),void 0);s.updateMastheadProfile(),s.updateStorageStatus(),s.setCloudStatus("syncing"),A(),X(),fe().catch(l=>console.warn("Initial sync failed:",l))}const Dt=Object.freeze(Object.defineProperty({__proto__:null,launchOnboarding:he},Symbol.toStringTag,{value:"Module"})),ue="f5a446a5f70a9f6a16a8ddd052c121f2",ye="https://api.themoviedb.org/3";let u={title:"",year:null,director:"",writer:"",cast:"",scores:{}},J=[],M={},R={};function Pe(e){Z(e)}function Z(e){for(let t=1;t<=4;t++){const o=document.getElementById("sn"+t),i=document.getElementById("sl"+t);t<e?(o.className="step-num done",o.textContent="✓"):t===e?(o.className="step-num active",o.textContent=t,i.className="step-label active"):(o.className="step-num",o.textContent=t,i.className="step-label")}document.querySelectorAll(".step-panel").forEach((t,o)=>{t.classList.toggle("active",o+1===e)})}let Me=null;function Oe(e){clearTimeout(Me);const t=document.getElementById("tmdb-results");if(e.trim().length<2){t.innerHTML="";return}document.getElementById("searchSpinner").style.display="inline",Me=setTimeout(async()=>{try{const i=await(await fetch(`${ye}/search/movie?api_key=${ue}&query=${encodeURIComponent(e.trim())}&include_adult=false`)).json();if(document.getElementById("searchSpinner").style.display="none",!i.results||i.results.length===0){t.innerHTML='<div class="tmdb-loading">No results yet…</div>';return}const n=i.results.slice(0,6);t.innerHTML=n.map(a=>{const s=a.release_date?a.release_date.slice(0,4):"?",l=a.poster_path?`<img class="tmdb-result-poster" src="https://image.tmdb.org/t/p/w92${a.poster_path}" alt="">`:'<div class="tmdb-result-poster-placeholder">NO IMG</div>',r=(a.overview||"").slice(0,100)+((a.overview||"").length>100?"…":"");return`<div class="tmdb-result" onclick="tmdbSelect(${a.id}, '${a.title.replace(/'/g,"\\'").replace(/"/g,'\\"')}')">
          ${l}
          <div class="tmdb-result-info">
            <div class="tmdb-result-title">${a.title}</div>
            <div class="tmdb-result-meta">${s}${a.vote_average?" · "+a.vote_average.toFixed(1)+" TMDB":""}</div>
            <div class="tmdb-result-overview">${r}</div>
          </div>
        </div>`}).join("")}catch{document.getElementById("searchSpinner").style.display="none",t.innerHTML='<div class="tmdb-error">Search failed — check connection.</div>'}},280)}async function qe(e,t){document.getElementById("tmdb-results").innerHTML='<div class="tmdb-loading">Loading film details…</div>';try{const[o,i]=await Promise.all([fetch(`${ye}/movie/${e}?api_key=${ue}`),fetch(`${ye}/movie/${e}/credits?api_key=${ue}`)]),n=await o.json(),a=await i.json(),s=n.release_date?parseInt(n.release_date.slice(0,4)):null,l=n.poster_path?`https://image.tmdb.org/t/p/w185${n.poster_path}`:null,r=a.crew.filter(h=>h.job==="Director").map(h=>h.name),c=a.crew.filter(h=>["Screenplay","Writer","Story","Original Story","Novel"].includes(h.job)).map(h=>h.name).filter((h,S,m)=>m.indexOf(h)===S),p=a.cast||[],f=p.slice(0,8);J=p;const w=n.production_companies||[];u._tmdbId=e,u._tmdbDetail=n,u.year=s,u._allDirectors=r,u._allWriters=c,u._posterUrl=l,M={},f.forEach(h=>{M[h.id]={actor:h,checked:!0}}),R={},w.forEach(h=>{R[h.id]={company:h,checked:!0}}),document.getElementById("tmdb-film-header").innerHTML=`
      ${l?`<img src="${l}" style="width:80px;border-radius:4px;flex-shrink:0" alt="">`:""}
      <div>
        <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;line-height:1.1">${n.title}</div>
        <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim);margin-top:4px">${s||""} · ${n.runtime?n.runtime+" min":""}</div>
        <div style="font-size:13px;color:var(--dim);margin-top:8px;max-width:480px;line-height:1.5">${(n.overview||"").slice(0,200)}${n.overview&&n.overview.length>200?"…":""}</div>
      </div>`,document.getElementById("curate-directors").textContent=r.join(", ")||"Unknown",document.getElementById("curate-writers").textContent=c.join(", ")||"Unknown",Re(f),Lt(w),document.getElementById("tmdb-search-phase").style.display="none",document.getElementById("tmdb-results").innerHTML="",document.getElementById("tmdb-curation-phase").style.display="block"}catch{document.getElementById("tmdb-results").innerHTML='<div class="tmdb-error">Failed to load film details. Try again.</div>'}}function Re(e){const t=document.getElementById("curate-cast");t.innerHTML=`<div class="cast-grid">
    ${e.map(o=>{const i=M[o.id],n=i?i.checked:!0,a=o.profile_path?`<img class="cast-photo" src="https://image.tmdb.org/t/p/w45${o.profile_path}" alt="">`:'<div class="cast-photo" style="background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:14px">👤</div>';return`<div class="cast-item ${n?"checked":"unchecked"}" onclick="toggleCast(${o.id})" id="castItem_${o.id}">
        <div class="cast-check">${n?"✓":""}</div>
        ${a}
        <div>
          <div class="cast-name">${o.name}</div>
          <div class="cast-character">${o.character||""}</div>
        </div>
      </div>`}).join("")}
  </div>`}function Ne(e){M[e]&&(M[e].checked=!M[e].checked);const t=document.getElementById("castItem_"+e),o=M[e].checked;t.className="cast-item "+(o?"checked":"unchecked"),t.querySelector(".cast-check").textContent=o?"✓":""}async function He(){const e=document.getElementById("moreCastBtn");e.textContent="Loading…",e.disabled=!0,J.slice(8,20).forEach(i=>{M[i.id]||(M[i.id]={actor:i,checked:!1})});const o=J.slice(0,20);Re(o),e.textContent="+ More cast",e.disabled=!1,J.length<=20&&(e.style.display="none")}function Lt(e){document.getElementById("curate-companies").innerHTML=`<div class="company-chips">
    ${e.map(t=>`
      <div class="company-chip checked" onclick="toggleCompany(${t.id})" id="companyChip_${t.id}">${t.name}</div>
    `).join("")}
    ${e.length===0?'<span style="font-size:13px;color:var(--dim)">None listed</span>':""}
  </div>`}function Fe(e){R[e].checked=!R[e].checked;const t=document.getElementById("companyChip_"+e);t.className="company-chip "+(R[e].checked?"checked":"unchecked")}function We(){document.getElementById("tmdb-search-phase").style.display="block",document.getElementById("tmdb-curation-phase").style.display="none",document.getElementById("tmdb-results").innerHTML=""}function Ue(){const e=u._allDirectors||[],t=u._allWriters||[],o=Object.values(M).filter(n=>n.checked).map(n=>n.actor.name),i=Object.values(R).filter(n=>n.checked).map(n=>n.company.name);u.title=u._tmdbDetail.title,u.director=e.join(", "),u.writer=t.join(", "),u.cast=o.join(", "),u.productionCompanies=i.join(", "),jt(),Z(2)}function At(e){const t=[...y].filter(i=>i.scores[e]!=null).sort((i,n)=>n.scores[e]-i.scores[e]),o=t.length;return[t[Math.floor(o*.05)],t[Math.floor(o*.25)],t[Math.floor(o*.5)],t[Math.floor(o*.75)],t[Math.floor(o*.95)]].filter(Boolean)}function jt(){const e=document.getElementById("calibrationCategories");e.innerHTML=x.map(t=>{const o=At(t.key),i=u.scores[t.key]||75;return`<div class="category-section" id="catSection_${t.key}">
      <div class="cat-header">
        <div class="cat-name">${t.label}</div>
        <div class="cat-weight">Weight ×${t.weight} of 17</div>
      </div>
      <div class="cat-question">${t.question}</div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Closest anchor film:</div>
      <div class="anchor-row">
        ${o.map(n=>`
          <div class="anchor-film" onclick="selectAnchor('${t.key}', ${n.scores[t.key]}, this)">
            <div class="anchor-film-title">${n.title}</div>
            <div class="anchor-film-score">${t.label}: ${n.scores[t.key]}</div>
          </div>`).join("")}
      </div>
      <div class="slider-section">
        <div class="slider-label-row">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px">Your score</div>
          <div>
            <span class="slider-val" id="sliderVal_${t.key}">${i}</span>
            <span class="slider-desc" id="sliderDesc_${t.key}" style="margin-left:8px">${D(i)}</span>
          </div>
        </div>
        <input type="range" min="1" max="100" value="${i}" id="slider_${t.key}"
          oninput="updateSlider('${t.key}', this.value)">
        <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--dim)">
          <span>1 — Insulting</span><span>50 — Solid</span><span>100 — Perfect</span>
        </div>
      </div>
    </div>`}).join(""),x.forEach(t=>{u.scores[t.key]||(u.scores[t.key]=75)})}window.selectAnchor=function(e,t,o){o.closest(".anchor-row").querySelectorAll(".anchor-film").forEach(a=>a.classList.remove("selected")),o.classList.add("selected");const i=u.scores[e]||75,n=Math.round((i+t)/2);document.getElementById("slider_"+e).value=n,updateSlider(e,n)};window.updateSlider=function(e,t){t=parseInt(t),u.scores[e]=t,document.getElementById("sliderVal_"+e).textContent=t,document.getElementById("sliderDesc_"+e).textContent=D(t)};function Ye(){zt(),Z(3)}let z=[],U=0;function zt(){z=[],x.forEach(e=>{const t=u.scores[e.key];if(!t)return;y.filter(i=>i.scores[e.key]!=null&&Math.abs(i.scores[e.key]-t)<=3).sort((i,n)=>Math.abs(i.scores[e.key]-t)-Math.abs(n.scores[e.key]-t)).slice(0,1).forEach(i=>z.push({cat:e,film:i}))}),z=z.slice(0,6),U=0,ge()}function ge(){const e=document.getElementById("hthContainer");if(z.length===0||U>=z.length){e.innerHTML=`<div style="text-align:center;padding:40px;color:var(--dim);font-style:italic">
      No close comparisons needed — your scores are clearly differentiated. Click Continue.
    </div>`;return}const{cat:t,film:o}=z[U],i=u.scores[t.key];e.innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">
      Comparison ${U+1} of ${z.length} &nbsp;·&nbsp; ${t.label} (×${t.weight})
    </div>
    <div class="hth-prompt">Which has the better <em>${t.label.toLowerCase()}</em>?</div>
    <div class="hth-row">
      <div class="hth-card" onclick="hthChoice('new', '${t.key}', ${o.scores[t.key]})">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">New film</div>
        <div class="hth-title">${u.title}</div>
        <div class="hth-score">${i}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${D(i)}</div>
      </div>
      <div class="hth-vs">vs</div>
      <div class="hth-card" onclick="hthChoice('existing', '${t.key}', ${o.scores[t.key]})">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">From your list</div>
        <div class="hth-title">${o.title}</div>
        <div class="hth-score">${o.scores[t.key]}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px">${D(o.scores[t.key])}</div>
      </div>
    </div>
    <div class="hth-skip" onclick="hthSkip()">They're equal / skip this one</div>
  `}window.hthChoice=function(e,t,o){const i=u.scores[t];e==="new"&&i<=o?u.scores[t]=o+1:e==="existing"&&i>=o&&(u.scores[t]=o-1),U++,ge()};window.hthSkip=function(){U++,ge()};function Ve(){Pt(),Z(4)}function Pt(){const e=H(u.scores);u.total=e;const t=[...y,u].sort((i,n)=>n.total-i.total),o=t.indexOf(u)+1;document.getElementById("resultCard").innerHTML=`
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">
      Would rank #${o} of ${y.length+1}
    </div>
    <div class="result-film-title">${u.title}</div>
    <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--dim);margin-bottom:12px">${u.year||""} ${u.director?"· "+u.director:""}</div>
    <div class="result-total">${e}</div>
    <div class="result-label">${D(e)}</div>
    <div class="result-grid">
      ${x.map(i=>`
        <div class="result-cat">
          <div class="result-cat-name">${i.label} ×${i.weight}</div>
          <div class="result-cat-val ${T(u.scores[i.key]||0)}">${u.scores[i.key]||"—"}</div>
        </div>`).join("")}
    </div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--rule)">
      ${[-2,-1,0,1,2].map(i=>{const n=t[o-1+i];if(!n||n===u)return"";const a=(n.total-e).toFixed(2);return`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--rule);font-size:13px">
          <span style="font-family:'Playfair Display',serif;font-weight:700;flex:1">${n.title}</span>
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim)">${n.total}</span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:${a>0?"var(--green)":"var(--red)"}">${a>0?"+":""}${a}</span>
        </div>`}).join("")}
    </div>
  `}function Je(){u.total=H(u.scores),y.push({title:u.title,year:u.year,total:u.total,director:u.director,writer:u.writer,cast:u.cast,productionCompanies:u.productionCompanies||"",poster:u._tmdbDetail?.poster_path||null,overview:u._tmdbDetail?.overview||"",scores:{...u.scores}}),N(),E(()=>Promise.resolve().then(()=>Y),void 0).then(e=>e.updateStorageStatus()),u={title:"",year:null,director:"",writer:"",cast:"",productionCompanies:"",scores:{}},M={},R={},J=[],document.getElementById("f-search").value="",document.getElementById("tmdb-results").innerHTML="",document.getElementById("tmdb-search-phase").style.display="block",document.getElementById("tmdb-curation-phase").style.display="none",document.getElementById("moreCastBtn").style.display="",Z(1),A(),document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active")),document.getElementById("rankings").classList.add("active"),document.querySelectorAll(".nav-btn").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".nav-btn")[0].classList.add("active")}const Ot=Object.freeze(Object.defineProperty({__proto__:null,confirmTmdbData:Ue,goToStep:Pe,goToStep3:Ye,goToStep4:Ve,liveSearch:Oe,resetToSearch:We,saveFilm:Je,showMoreCast:He,tmdbSelect:qe,toggleCast:Ne,toggleCompany:Fe},Symbol.toStringTag,{value:"Module"}));function qt(){if(!b){E(()=>Promise.resolve().then(()=>Dt),void 0).then(e=>e.launchOnboarding());return}Ge()}function Ge(){if(!b)return;const e=b.weights||{},t=Math.max(...Object.values(e));document.getElementById("archetypeModalContent").innerHTML=`
    <button class="modal-close" onclick="closeArchetypeModal()">×</button>
    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:6px">Your archetype</div>
    <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:32px;font-weight:900;color:var(--blue);margin-bottom:4px">${b.archetype||"—"}</div>
    ${b.archetype_secondary?`<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:4px">Secondary: ${b.archetype_secondary}</div>`:""}
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);margin-bottom:28px">${b.username||""}</div>

    <div style="font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--rule)">
      Weighting formula <span style="font-weight:400;font-style:italic;letter-spacing:0;text-transform:none"> — edit to customize</span>
    </div>

    <div id="archetype-weights-form">
      ${x.map(o=>{const i=e[o.key]||1,n=Math.round(i/t*100);return`<div class="archetype-weight-row">
          <div class="archetype-weight-label">${o.label}</div>
          <div class="archetype-weight-bar-wrap"><div class="archetype-weight-bar" id="awbar_${o.key}" style="width:${n}%"></div></div>
          <input class="archetype-weight-input" type="number" min="1" max="10" value="${i}"
            id="awval_${o.key}" oninput="previewWeight('${o.key}', this.value)">
        </div>`}).join("")}
    </div>

    <div class="btn-row" style="margin-top:24px">
      <button class="btn btn-outline" onclick="resetArchetypeWeights()">Reset to archetype</button>
      <button class="btn btn-primary" onclick="saveArchetypeWeights()">Apply weights</button>
    </div>
  `,document.getElementById("archetypeModal").classList.add("open")}function Ke(e,t){const o=x.map(n=>({key:n.key,val:parseFloat(document.getElementById("awval_"+n.key)?.value)||1})),i=Math.max(...o.map(n=>n.val));o.forEach(n=>{const a=document.getElementById("awbar_"+n.key);a&&(a.style.width=Math.round(n.val/i*100)+"%")})}function Rt(){if(!b||!b.archetype)return;const e=ce[b.archetype]?.weights;e&&(x.forEach(t=>{const o=document.getElementById("awval_"+t.key);o&&(o.value=e[t.key]||1)}),Ke())}function Nt(){const e={};x.forEach(t=>{const o=parseFloat(document.getElementById("awval_"+t.key)?.value);e[t.key]=isNaN(o)||o<1?1:Math.min(10,o)}),b.weights=e,E(()=>Promise.resolve().then(()=>Ce),void 0).then(t=>t.saveUserLocally()),Q(),A(),N(),Qe()}function Qe(e){(!e||e.target===document.getElementById("archetypeModal"))&&document.getElementById("archetypeModal").classList.remove("open")}function Xe(e){document.querySelectorAll(".screen").forEach(t=>t.classList.remove("active")),document.getElementById(e).classList.add("active"),document.querySelectorAll(".nav-btn").forEach(t=>t.classList.remove("active")),event.target.classList.add("active"),e==="analysis"&&Te(),e==="calibration"&&ve(),e==="explore"&&le(),e==="predict"&&De(),localStorage.setItem("ledger_last_screen",e)}function be(){const e=document.getElementById("storageStatus");e&&(y.length>0?(e.textContent=`✓ ${y.length} films · saved`,e.style.color="var(--green)"):(e.textContent="no films yet",e.style.color="var(--dim)"))}function xe(){const e=b;if(!e)return;const t=document.getElementById("mastheadLeft");t.innerHTML=`<span class="profile-chip" onclick="window.__ledger.showSyncPanel()">
    <span style="font-size:9px">▾</span>
    <strong style="color:var(--ink)">${e.display_name}</strong>
    &nbsp;·&nbsp; ${e.archetype||"film watcher"}
  </span>`}function Ze(){const e=new Blob([JSON.stringify(y,null,2)],{type:"application/json"}),t=document.createElement("a");t.href=URL.createObjectURL(e),t.download="film_rankings.json",t.click()}function et(){confirm("Clear all your films and start fresh? This cannot be undone.")&&(localStorage.removeItem("filmRankings_v1"),localStorage.removeItem("ledger_user"),location.reload())}async function Ht(){at(),_e(),b?(G("syncing"),xe(),Q(),Ie(b.id).catch(()=>G("error"))):(G("local"),setTimeout(()=>he(),400)),A(),be();const e=localStorage.getItem("ledger_last_screen");if(e&&e!=="rankings"&&document.getElementById(e)){const t=document.querySelectorAll(".nav-btn");t.forEach(o=>o.classList.remove("active")),document.querySelectorAll(".screen").forEach(o=>o.classList.remove("active")),document.getElementById(e).classList.add("active"),t.forEach(o=>{o.getAttribute("onclick")?.includes(e)&&o.classList.add("active")}),e==="analysis"&&Te(),e==="explore"&&le()}}function G(e){const t=document.getElementById("cloudDot"),o=document.getElementById("cloudLabel");t.className="cloud-dot",e==="syncing"?(t.classList.add("syncing"),o.textContent="syncing…"):e==="synced"?(t.classList.add("synced"),o.textContent=b?b.display_name:"synced"):e==="error"?(t.classList.add("error"),o.textContent="offline"):o.textContent="local"}window.__ledger={showScreen:Xe,sortBy:Ee,openModal:dt,closeModal:pt,exploreEntity:ut,renderExploreIndex:le,initPredict:De,predictSearch:Le,predictSearchDebounce:ft,predictSelectFilm:vt,predictAddToList:wt,startCalibration:St,selectCalCat:kt,selectCalInt:Mt,applyCalibration:_t,resetCalibration:ve,launchOnboarding:he,liveSearch:Oe,tmdbSelect:qe,toggleCast:Ne,showMoreCast:He,toggleCompany:Fe,resetToSearch:We,confirmTmdbData:Ue,goToStep3:Ye,goToStep4:Ve,saveFilm:Je,goToStep:Pe,showSyncPanel:qt,openArchetypeModal:Ge,closeArchetypeModal:Qe,previewWeight:Ke,resetArchetypeWeights:Rt,saveArchetypeWeights:Nt,exportData:Ze,resetStorage:et,updateStorageStatus:be,updateMastheadProfile:xe,setCloudStatus:G};const Ft=["showScreen","sortBy","openModal","closeModal","exploreEntity","renderExploreIndex","initPredict","predictSearch","predictSearchDebounce","predictSelectFilm","predictAddToList","startCalibration","selectCalCat","selectCalInt","applyCalibration","resetCalibration","launchOnboarding","liveSearch","tmdbSelect","toggleCast","showMoreCast","toggleCompany","resetToSearch","confirmTmdbData","goToStep3","goToStep4","saveFilm","goToStep","showSyncPanel","openArchetypeModal","closeArchetypeModal","previewWeight","resetArchetypeWeights","saveArchetypeWeights","exportData","resetStorage"];Ft.forEach(e=>{window[e]=window.__ledger[e]});Ht();const Y=Object.freeze(Object.defineProperty({__proto__:null,exportData:Ze,resetStorage:et,setCloudStatus:G,showScreen:Xe,updateMastheadProfile:xe,updateStorageStatus:be},Symbol.toStringTag,{value:"Module"}));
