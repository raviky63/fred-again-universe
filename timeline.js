// Timeline view of the Fred again.. Universe — a horizontal ride through time, era by era.
// Same data/ folder as the web; eras come from data/eras.json.
const COLORS = {artist:"#7cc6ff", crew:"#c3a6ff", album:"#ffd166", ep:"#ffd166", mixtape:"#ffd166", single:"#ff9ecb", feature:"#5ee3b0", track:"#ffb38a", event:"#ffffff", mix:"#9a97a6", upcoming:"#ff5a36", moment:"#ffd166", merch:"#d7ff5e", milestone:"#5ee3b0"};
const GROUP = {album:"releases", ep:"releases", mixtape:"releases", single:"releases", feature:"releases", track:"tracks", event:"shows", upcoming:"shows", moment:"shows", mix:"mixes", merch:"merch", milestone:"milestones"};
const LABEL = {releases:"Releases", tracks:"Tracks", shows:"Shows & moments", mixes:"DJ mixes & radio", merch:"Merch"};
const NAME = {album:"Album", ep:"EP", mixtape:"Mixtape", single:"Single", feature:"Feature", track:"Track", event:"Show", festival:"Festival", upcoming:"Upcoming", moment:"Moment", mix:"DJ mix / radio", merch:"Merch"};
const FILES = ["meta","center","artists","releases","tracks","events","crew","merch","eras","milestones"];
const state = {hidden:new Set(["tracks"]), q:"", follow:null};

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const hue = s => { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))%360; return h; };
const initials = n => n.replace(/[^A-Za-z0-9 ]/g,"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const fmt = d => { if(!d) return "date to add"; const [y,m,dd]=d.split("-"); const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return [dd&&+dd, m&&M[+m-1], y].filter(Boolean).join(" "); };
const flags = cs => (cs||[]).map(c=>`<img class="flag" src="https://flagcdn.com/h20/${c.toLowerCase()}.png" alt="${c}" title="${c}" loading="lazy">`).join("");
function pin(kind, raw){
  const c = COLORS[kind]||"#fff", cc = (raw && raw.country||[])[0];
  if (kind==="event" && cc){
    const fest = raw.setting==="festival", id = "fp"+raw.id.replace(/[^a-z0-9]/gi,"");
    return `<svg class="pin flagpin" viewBox="0 0 20 20"><defs><clipPath id="${id}"><polygon points="10,3 17,10 10,17 3,10"/></clipPath></defs>
      <polygon points="10,3 17,10 10,17 3,10" fill="#222"/><image href="https://flagcdn.com/w40/${cc.toLowerCase()}.png" x="5.05" y="5.05" width="9.9" height="9.9" preserveAspectRatio="none" transform="rotate(45 10 10)"/>
      <polygon points="10,3 17,10 10,17 3,10" fill="none" stroke="${fest?"#ffd166":"#fff"}" stroke-width="1"/>${fest?`<polygon points="10,.5 19.5,10 10,19.5 .5,10" fill="none" stroke="#ffd166" stroke-width="1"/>`:""}</svg>`;
  }
  if (["event","upcoming","mix"].includes(kind)) return `<svg class="pin" viewBox="0 0 14 14"><rect x="3" y="3" width="8" height="8" fill="${c}" transform="rotate(45 7 7)"/></svg>`;
  if (kind==="moment") return `<svg class="pin" viewBox="0 0 14 14" style="filter:drop-shadow(0 0 4px #ffd166)"><polygon points="7,1 8.8,5.2 13,5.4 9.7,8.2 10.8,12.6 7,10.2 3.2,12.6 4.3,8.2 1,5.4 5.2,5.2" fill="#ffd166"/></svg>`;
  if (kind==="milestone") return `<svg class="pin" viewBox="0 0 14 14" style="filter:drop-shadow(0 0 4px #5ee3b0)"><circle cx="7" cy="7" r="5" fill="#5ee3b0"/><circle cx="7" cy="7" r="2" fill="#08080c"/></svg>`;
  if (kind==="merch") return `<svg class="pin" viewBox="0 0 14 14"><polygon points="13,7 10,12.2 4,12.2 1,7 4,1.8 10,1.8" fill="${c}"/></svg>`;
  return `<svg class="pin" viewBox="0 0 14 14"><rect x="1.5" y="1.5" width="11" height="11" rx="1.5" fill="${c}"/></svg>`;
}

Promise.all(FILES.map(f => fetch(`data/${f}.json`, {cache:"no-cache"}).then(r => r.json())))
  .then(parts => build(Object.fromEntries(FILES.map((f,i)=>[f,parts[i]]))));

function build(data){
  const byId = {}, nb = {}, people = {};
  data.artists.forEach(a => people[a.id] = {...a, type:"artist"});
  data.crew.forEach(c => people[c.id] = {...c, type:"crew"});
  const releaseCover = {}; data.releases.forEach(r => releaseCover[r.id] = r.cover);
  const items = [];
  const add = (raw, kind, title, date, img) => { const it = {id:raw.id, raw, kind, title, date:date||"", img, group:GROUP[kind]}; items.push(it); byId[it.id]=it; };
  data.releases.forEach(r => add(r, r.kind, r.title, r.date, r.cover));
  data.tracks.forEach(t => add(t, "track", t.title, t.date, t.cover || releaseCover[(t.releases||[])[0]]));
  data.events.forEach(e => add(e, e.kind==="mix"?"mix":e.kind==="upcoming"?"upcoming":e.kind==="moment"?"moment":"event", e.title, e.date, e.thumbnail));
  data.merch.forEach(m => add(m, "merch", m.title, m.date, m.image));
  (data.milestones||[]).forEach(m => add({...m, story:m.text}, "milestone", m.title, m.date, releaseCover[m.release]));
  const link = (a,b) => { if(!a||!b||a===b) return; (nb[a]??=new Set()).add(b); (nb[b]??=new Set()).add(a); };
  data.releases.forEach(r => { (r.with||[]).forEach(w=>link(r.id,w)); (r.tracks||[]).forEach(t=>link(r.id,t)); link(r.id, r.part_of); });
  (data.milestones||[]).forEach(m => link(m.id, m.release));
  data.tracks.forEach(t => (t.with||[]).forEach(w=>link(t.id,w)));
  data.events.forEach(e => { (e.with||[]).forEach(w=>link(e.id,w)); (e.tracks||[]).forEach(t=>link(e.id,t)); });
  [...data.crew, ...data.merch].forEach(x => (x.links_to||[]).forEach(t=>link(x.id,t)));
  items.sort((a,b) => (a.date||"9999").localeCompare(b.date||"9999"));

  // eras, newest start date wins
  const eras = data.eras.slice().sort((a,b)=>a.start.localeCompare(b.start));
  eras.forEach(e => e.cover = releaseCover[e.release] || "");
  const eraOf = d => { let e = eras[0]; for (const x of eras) if ((d||"9999") >= x.start) e = x; return e; };

  // chips
  const chips = document.getElementById("chips");
  Object.entries(LABEL).forEach(([g,l]) => {
    const el = document.createElement("span"); el.className = "chip" + (state.hidden.has(g)?" off":"");
    const k = Object.keys(GROUP).find(k=>GROUP[k]===g);
    el.innerHTML = `<i style="background:${COLORS[k]};border-radius:${g==="shows"||g==="mixes"?"0;transform:rotate(45deg) scale(.8)":"2px"}"></i>${l}`;
    el.onclick = () => { state.hidden.has(g)?state.hidden.delete(g):state.hidden.add(g); el.classList.toggle("off"); render(); };
    chips.appendChild(el);
  });
  document.getElementById("search").oninput = e => { state.q = e.target.value.trim().toLowerCase(); render(); };

  // era buttons
  const eraBar = document.getElementById("eras");
  eraBar.innerHTML = eras.map(e => `<span class="erabtn" data-era="${e.id}" style="--c:${e.color}">${e.cover?`<img src="${esc(e.cover)}" alt="">`:`<b></b>`}${esc(e.name)}</span>`).join("");
  eraBar.querySelectorAll(".erabtn").forEach(b => b.onclick = () => {
    const el = document.getElementById("era-"+b.dataset.era); if (el) ride.scrollTo({left: el.offsetLeft - 20, behavior:"smooth"});
  });

  function touches(it, pid){
    const n = nb[it.id]||new Set();
    if (n.has(pid)) return true;
    return [...n].some(x => byId[x] && byId[x].kind==="track" && (nb[x]||new Set()).has(pid));
  }
  function visible(it){
    if (state.follow) return touches(it, state.follow);
    if (it.kind==="milestone") return !state.q || (it.title+" "+it.raw.text).toLowerCase().includes(state.q);
    if (state.hidden.has(it.group)) return false;
    if (state.q){
      const hay = (it.title+" "+(it.raw.story||"")+" "+(it.raw.location||"")+" "+[...(nb[it.id]||[])].map(x=>(people[x]||byId[x]||{}).name||(byId[x]||{}).title||"").join(" ")).toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function card(it){
    if (it.kind==="milestone"){ const r = it.raw;
      return `<article class="item milestone" id="t-${it.id}">
        <div class="meta">USB moment <span class="date">· ${fmt(it.date)}</span></div>
        <div class="title">${esc(it.title)}</div><p class="story">${esc(r.text)}</p>
        <div class="pills"><span class="pill" data-go="${r.release}">USB, the never-ending album</span></div>
        <div class="src">${esc(r.source)}</div></article>`; }
    const r = it.raw, c = COLORS[it.kind]||"#fff", year = (it.date||"").slice(0,4);
    const n = [...(nb[it.id]||[])];
    const who = n.filter(x => people[x]);
    const linked = n.filter(x => byId[x]);
    const back = linked.filter(x => byId[x].date && byId[x].date.slice(0,4) < year);
    const fwd = linked.filter(x => byId[x].date && byId[x].date.slice(0,4) > year);
    const same = linked.filter(x => !back.includes(x) && !fwd.includes(x));
    const mini = it.kind==="mix" || (it.kind==="event" && !r.story && !it.img && !who.length && !r.support) || (it.kind==="track" && !r.story && !it.img);
    const h = hue(it.id);
    const thumb = mini ? "" : `<div class="thumb" style="background:linear-gradient(135deg,hsl(${h},55%,42%),hsl(${(h+50)%360},60%,18%))">${initials(it.title)}${it.img?`<img src="${esc(it.img)}" alt="" loading="lazy" onerror="this.remove()">`:""}</div>`;
    const pill = (x, cls="") => { const o = byId[x]; return `<span class="pill ${cls}" data-go="${x}">${cls==="back"?"↩ ":cls==="fwd"?"↪ ":""}${o.date?o.date.slice(0,4)+" · ":""}${esc(o.title.replace(/\s*\(.*\)$/,""))}</span>`; };
    const person = x => `<span class="pill" data-follow="${x}" style="color:${COLORS[people[x].type]}">${esc(people[x].name)}</span>`;
    const tracklist = r.tracklist?.length ? `<details class="story"><summary>Tracklist (${r.tracklist.length})</summary><ol>${r.tracklist.map(t=>`<li>${esc(t)}</li>`).join("")}</ol></details>` : "";
    const L = r.links||{};
    const acts = [`<a href="index.html#${it.id}">See in the web</a>`, L.spotify?`<a href="${esc(L.spotify)}" target="_blank" rel="noopener">Spotify ↗</a>`:"", L.youtube?`<a href="${esc(L.youtube)}" target="_blank" rel="noopener">Watch ↗</a>`:"", r.tracklist_link?`<a href="${esc(r.tracklist_link)}" target="_blank" rel="noopener">Tracklist ↗</a>`:""].join("");
    const where = r.location && r.location!=="Radio / online mix" ? `<div class="where">${r.location!==it.title?esc(r.location):""}${flags(r.country)}</div>` : "";
    return `<article class="item ${mini?"mini":""} ${r.verified===false?"unv":""}" id="t-${it.id}">
        ${thumb}
        <div class="meta" style="color:${r.setting==="festival"?"#ffd166":c}">${r.setting==="festival"?NAME.festival:NAME[it.kind]||it.kind} <span class="date">· ${fmt(it.date)}</span></div>
        <div class="title">${esc(it.title)}</div>${where}${r.part_of&&byId[r.part_of]?`<div class="where">Addition to <span class="pill" data-go="${r.part_of}">${esc(byId[r.part_of].title)}</span></div>`:""}
        ${r.support?.length?`<div class="where">Support: ${r.support.map(esc).join(", ")}</div>`:""}${r.story?`<p class="story">${esc(r.story)}</p>`:""}${tracklist}
        ${(who.length||back.length||fwd.length||same.length)?`<div class="pills">${who.map(person).join("")}${back.map(x=>pill(x,"back")).join("")}${same.slice(0,8).map(x=>pill(x)).join("")}${fwd.map(x=>pill(x,"fwd")).join("")}</div>`:""}
        ${mini?"":`<div class="actions">${acts}</div>`}
        <div class="more"></div>
      </article>`;
  }

  const ride = document.getElementById("ride"), track = document.getElementById("track");
  function render(){
    const fb = document.getElementById("follow");
    if (state.follow){ const p = people[state.follow];
      fb.style.display="block"; fb.innerHTML = `Following <b style="color:${COLORS[p.type]}">${esc(p.name)}</b> through time${p.role?` · ${esc(p.role)}`:""}. ${esc(p.bio||"")}<button id="unfollow">Show everything</button>`;
      document.getElementById("unfollow").onclick = () => { state.follow=null; render(); };
    } else fb.style.display="none";
    let html = "", era = null, year = null, i = 0, shown = 0;
    items.filter(visible).forEach(it => {
      const e = eraOf(it.date), y = (it.date||"").slice(0,4) || "?";
      if (e !== era){
        if (era) html += `</section>`;
        html += `<section class="era" id="era-${e.id}" data-era="${e.id}" style="--c:${e.color}"><div class="eratitle">${esc(e.name)}<small>${esc(e.note||"")}</small></div><div class="eraspace"></div>`;
        era = e; year = null;
      }
      if (y !== year){ html += `<div class="year"><span>${y}</span></div>`; year = y; }
      html += `<div class="col ${i%2?"down":"up"}"><div class="stem"></div>${pin(it.kind, it.raw)}<div class="slot">${card(it)}</div></div>`;
      i++; shown++;
    });
    if (era) html += `</section>`;
    track.innerHTML = html;
    document.getElementById("empty").style.display = shown ? "none" : "block";
    track.querySelectorAll("[data-go]").forEach(p => p.onclick = e => { e.stopPropagation(); go(p.dataset.go); });
    track.querySelectorAll("article.item").forEach(a => a.onclick = e => { if (e.target.closest("a,.pill,details") || dragMoved()) return; open(a.id.slice(2)); });
    track.querySelectorAll("[data-follow]").forEach(p => p.onclick = () => { state.follow = p.dataset.follow; render(); ride.scrollTo({left:0}); });
    observe();
    onScroll();
  }

  // cards pop in as they ride into view
  let io;
  function observe(){
    io && io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("seen"); io.unobserve(e.target); } }), {root: ride, rootMargin: "0px 80px 0px 0px", threshold: .05});
    track.querySelectorAll(".col,.era,.year").forEach(el => io.observe(el));
  }

  // grab anywhere and throw: drag to ride, with a bit of momentum
  let down = null, moved = false, v = 0, raf = 0;
  ride.addEventListener("pointerdown", e => {
    if (e.button !== 0 || e.target.closest("a,summary,details")) return;
    cancelAnimationFrame(raf); down = {x: e.clientX, left: ride.scrollLeft, t: performance.now(), lx: e.clientX}; moved = false; v = 0;
  });
  addEventListener("pointermove", e => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!moved && Math.abs(dx) > 5){ moved = true; ride.classList.add("dragging"); }
    if (!moved) return;
    const now = performance.now(); v = (e.clientX - down.lx) / Math.max(1, now - down.t); down.lx = e.clientX; down.t = now;
    ride.scrollLeft = down.left - dx;
  });
  addEventListener("pointerup", () => {
    if (!down) return; down = null;
    if (moved){ setTimeout(()=>ride.classList.remove("dragging"), 0);
      let vel = -v * 16; const glide = () => { if (Math.abs(vel) < .5) return; ride.scrollLeft += vel; vel *= .94; raf = requestAnimationFrame(glide); }; glide(); }
  });
  ride.addEventListener("click", e => { if (moved){ e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  // which era is in the middle of the screen → colour the page and light up its button
  let current = null;
  function onScroll(){
    const mid = ride.scrollLeft + ride.clientWidth/2;
    let id = null;
    track.querySelectorAll(".era").forEach(s => { if (s.offsetLeft <= mid) id = s.dataset.era; });
    if (!id){ const f = track.querySelector(".era"); id = f && f.dataset.era; }
    if (id === current) return; current = id;
    const e = eras.find(x=>x.id===id); if (!e) return;
    document.documentElement.style.setProperty("--era", e.color);
    eraBar.querySelectorAll(".erabtn").forEach(b => { const on = b.dataset.era===id; b.classList.toggle("on", on); if (on) b.scrollIntoView({inline:"center", block:"nearest", behavior:"smooth"}); });
  }
  ride.addEventListener("scroll", () => { onScroll(); document.getElementById("hint").style.opacity = ride.scrollLeft > 200 ? 0 : 1; }, {passive:true});
  // a normal mouse wheel rides sideways
  ride.addEventListener("wheel", e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.target.closest(".item")){ ride.scrollLeft += e.deltaY; e.preventDefault(); } }, {passive:false});
  addEventListener("keydown", e => { if (e.key==="ArrowRight") ride.scrollBy({left:400, behavior:"smooth"}); if (e.key==="ArrowLeft") ride.scrollBy({left:-400, behavior:"smooth"}); });

  // ---------- click a card: details in a side panel ----------
  const dragMoved = () => false; // a drag never ends in a click (see the capture handler below)
  addEventListener("keydown", e => { if (e.key === "Escape") track.querySelectorAll(".item.open").forEach(x => open(x.id.slice(2))); });
  // ---------- click a card: it moves away from the line and unfolds in place ----------
  function details(id){
    const it = byId[id], r = it.raw;
    const n = [...(nb[id]||[])], linked = n.filter(x => byId[x]);
    const L = r.links||{};
    const ls = [["Spotify",L.spotify],["YouTube",L.youtube],["SoundCloud",L.soundcloud],["Instagram",L.instagram]].filter(x=>x[1]);
    return `${r.support?.length?`<h4>Support / opening</h4><div class="mt">${r.support.map(esc).join(", ")}<div class="src">${esc(r.support_source||"")}</div></div>`:""}
      ${r.part_of&&byId[r.part_of]?`<h4>Addition to</h4><div class="pills"><span class="pill" data-go="${r.part_of}">${esc(byId[r.part_of].title)}</span></div>`:""}
      ${linked.length?`<h4>Connected</h4><div class="pills">${linked.slice(0,30).map(x=>`<span class="pill" data-go="${x}">${byId[x].date?byId[x].date.slice(0,4)+" · ":""}${esc(byId[x].title.replace(/\s*\(.*\)$/,""))}</span>`).join("")}</div>`:""}
      ${r.tracklist?.length?`<h4>Tracklist</h4><ol>${r.tracklist.map(t=>`<li>${esc(t)}</li>`).join("")}</ol>`:""}
      ${ls.length?`<h4>Listen / watch</h4><div class="mt">${ls.map(([k,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${k} ↗</a>`).join(" ")}</div>`:""}
      <h4>Source</h4><div class="mt">${r.verified===false?`<span class="badge no">Still to verify</span>`:`<span class="badge ok">Verified</span>`} <span class="src">${esc(r.source||"")}</span></div>
      ${it.kind!=="milestone"?`<div class="mt"><a href="index.html#${id}">See its connections in the web →</a></div>`:""}`;
  }
  function open(id){
    const el = document.getElementById("t-"+id); if (!el) return;
    const was = el.classList.contains("open");
    track.querySelectorAll(".item.open").forEach(x => { x.classList.remove("open"); x.style.maxHeight=""; x.closest(".col").classList.remove("open"); });
    if (was){ history.replaceState(null,"",location.pathname); return; }
    const more = el.querySelector(".more");
    more.innerHTML = details(id);
    more.querySelectorAll("[data-go]").forEach(p => p.onclick = e => { e.stopPropagation(); go(p.dataset.go); setTimeout(()=>open(p.dataset.go), 650); });
    el.classList.add("open"); el.closest(".col").classList.add("open"); el.scrollTop = 0;
    const r = ride.getBoundingClientRect(), line = r.top + r.height/2, up = el.closest(".col").classList.contains("up");
    el.style.maxHeight = Math.max(220, (up ? line - r.top : r.bottom - line) - 70) + "px";
    const col = el.closest(".col"), left = col.offsetLeft + col.closest(".era").offsetLeft;
    if (left < ride.scrollLeft + 40 || left + 400 > ride.scrollLeft + ride.clientWidth) ride.scrollTo({left: left - ride.clientWidth/2 + 190, behavior:"smooth"});
    history.replaceState(null, "", "#"+id);
  }

  function go(id){
    let el = document.getElementById("t-"+id);
    if (!el){ state.hidden.delete(byId[id].group); document.querySelectorAll(".chip").forEach((c,i)=>{ if(Object.keys(LABEL)[i]===byId[id].group) c.classList.remove("off"); }); state.q=""; document.getElementById("search").value=""; state.follow=null; render(); el = document.getElementById("t-"+id); }
    if (!el) return;
    const col = el.closest(".col");
    ride.scrollTo({left: col.offsetLeft + col.closest(".era").offsetLeft - ride.clientWidth/2 + 115, behavior:"smooth"});
    el.classList.add("flash"); setTimeout(()=>el.classList.remove("flash"), 1800);
    history.replaceState(null, "", "#"+id);
  }
  render();
  const start = decodeURIComponent(location.hash.slice(1));
  if (start && byId[start]) setTimeout(()=>go(start), 200);
  else if (start && people[start]) { state.follow = start; render(); }
}
