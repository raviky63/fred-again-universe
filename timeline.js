// Timeline view of the Fred again.. Universe — same data/ folder as the web.
const COLORS = {artist:"#7cc6ff", crew:"#c3a6ff", album:"#ffd166", ep:"#ffd166", mixtape:"#ffd166", single:"#ff9ecb", feature:"#5ee3b0", track:"#ffb38a", event:"#ffffff", mix:"#9a97a6", upcoming:"#ff5a36", merch:"#d7ff5e"};
const GROUP = {album:"releases", ep:"releases", mixtape:"releases", single:"releases", feature:"releases", track:"tracks", event:"shows", upcoming:"shows", mix:"mixes", merch:"merch"};
const LABEL = {releases:"Releases", tracks:"Tracks", shows:"Shows & moments", mixes:"DJ mixes & radio", merch:"Merch"};
const NAME = {album:"Album", ep:"EP", mixtape:"Mixtape", single:"Single", feature:"Feature", track:"Track", event:"Show / moment", upcoming:"Upcoming", mix:"DJ mix / radio", merch:"Merch"};
const FILES = ["meta","center","artists","releases","tracks","events","crew","merch"];
const state = {hidden:new Set(["tracks"]), q:"", follow:null};

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const hue = s => { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))%360; return h; };
const initials = n => n.replace(/[^A-Za-z0-9 ]/g,"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const fmt = d => { if(!d) return "date to add"; const [y,m,dd]=d.split("-"); const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return [dd&&+dd, m&&M[+m-1], y].filter(Boolean).join(" "); };
function shape(kind){
  const c = COLORS[kind]||"#fff";
  if (["event","upcoming","mix"].includes(kind)) return `<svg class="dot" viewBox="0 0 14 14"><rect x="3" y="3" width="8" height="8" fill="${c}" transform="rotate(45 7 7)"/></svg>`;
  if (kind==="merch") return `<svg class="dot" viewBox="0 0 14 14"><polygon points="13,7 10,12.2 4,12.2 1,7 4,1.8 10,1.8" fill="${c}"/></svg>`;
  return `<svg class="dot" viewBox="0 0 14 14"><rect x="1.5" y="1.5" width="11" height="11" rx="1.5" fill="${c}"/></svg>`;
}

Promise.all(FILES.map(f => fetch(`data/${f}.json`).then(r => r.json())))
  .then(parts => build(Object.fromEntries(FILES.map((f,i)=>[f,parts[i]]))));

function build(data){
  const byId = {}, nb = {};
  const people = {};
  data.artists.forEach(a => people[a.id] = {...a, type:"artist"});
  data.crew.forEach(c => people[c.id] = {...c, type:"crew"});
  const items = [];
  const add = (raw, kind, title, date, img) => { const it = {id:raw.id, raw, kind, title, date:date||"", img, group:GROUP[kind]}; items.push(it); byId[it.id]=it; };
  data.releases.forEach(r => add(r, r.kind, r.title, r.date, r.cover));
  data.tracks.forEach(t => add(t, "track", t.title, t.date, t.cover));
  data.events.forEach(e => add(e, e.kind==="mix"?"mix":e.kind==="upcoming"?"upcoming":"event", e.title, e.date, e.thumbnail));
  data.merch.forEach(m => add(m, "merch", m.title, m.date, m.image));
  const link = (a,b) => { if(!a||!b||a===b) return; (nb[a]??=new Set()).add(b); (nb[b]??=new Set()).add(a); };
  data.releases.forEach(r => { (r.with||[]).forEach(w=>link(r.id,w)); (r.tracks||[]).forEach(t=>link(r.id,t)); });
  data.tracks.forEach(t => (t.with||[]).forEach(w=>link(t.id,w)));
  data.events.forEach(e => { (e.with||[]).forEach(w=>link(e.id,w)); (e.tracks||[]).forEach(t=>link(e.id,t)); });
  [...data.crew, ...data.merch].forEach(x => (x.links_to||[]).forEach(t=>link(x.id,t)));
  items.sort((a,b) => (a.date||"9999").localeCompare(b.date||"9999"));

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

  // a person's whole path through time (artists and crew, plus via tracks for album items)
  function touches(it, pid){
    const n = nb[it.id]||new Set();
    if (n.has(pid)) return true;
    return [...n].some(x => byId[x] && byId[x].kind==="track" && (nb[x]||new Set()).has(pid));
  }
  function visible(it){
    if (state.follow) return touches(it, state.follow);
    if (state.hidden.has(it.group)) return false;
    if (state.q){
      const hay = (it.title+" "+(it.raw.story||"")+" "+(it.raw.location||"")+" "+[...(nb[it.id]||[])].map(x=>(people[x]||byId[x]||{}).name||(byId[x]||{}).title||"").join(" ")).toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function card(it){
    const r = it.raw, c = COLORS[it.kind]||"#fff", year = (it.date||"").slice(0,4);
    const n = [...(nb[it.id]||[])];
    const who = n.filter(x => people[x]);
    const linked = n.filter(x => byId[x]);
    const back = linked.filter(x => byId[x].date && byId[x].date.slice(0,4) < year);
    const fwd = linked.filter(x => byId[x].date && byId[x].date.slice(0,4) > year);
    const same = linked.filter(x => !back.includes(x) && !fwd.includes(x));
    const mini = it.kind==="mix" || (it.kind==="track" && !r.story && !it.img);
    const h = hue(it.id);
    const thumb = mini ? "" : `<div class="thumb" style="background:linear-gradient(135deg,hsl(${h},55%,42%),hsl(${(h+50)%360},60%,18%));${["event","upcoming"].includes(it.kind)?"border-radius:50% 6px":""}">${initials(it.title)}${it.img?`<img src="${esc(it.img)}" alt="" loading="lazy" onerror="this.remove()">`:""}</div>`;
    const pill = (x, cls="") => { const o = byId[x]; return `<span class="pill ${cls}" data-go="${x}">${cls==="back"?"↩ ":cls==="fwd"?"↪ ":""}${o.date?o.date.slice(0,4)+" · ":""}${esc(o.title.replace(/\s*\(.*\)$/,""))}</span>`; };
    const person = x => `<span class="pill" data-follow="${x}" style="color:${COLORS[people[x].type]}">${esc(people[x].name)}</span>`;
    const tracklist = r.tracklist?.length ? `<details class="story"><summary>Tracklist (${r.tracklist.length})</summary><ol>${r.tracklist.map(t=>`<li>${esc(t)}</li>`).join("")}</ol></details>` : "";
    const L = r.links||{};
    const acts = [`<a href="index.html#${it.id}">See in the web</a>`, L.spotify?`<a href="${esc(L.spotify)}" target="_blank" rel="noopener">Spotify ↗</a>`:"", r.tracklist_link?`<a href="${esc(r.tracklist_link)}" target="_blank" rel="noopener">Full tracklist ↗</a>`:""].join("");
    return `<article class="item ${mini?"mini":""} ${r.verified===false?"unv":""}" id="t-${it.id}">
      ${shape(it.kind)}${thumb}
      <div>
        <div class="meta" style="color:${c}">${NAME[it.kind]||it.kind} <span class="date">· ${fmt(it.date)}${r.location&&!["Radio / online mix"].includes(r.location)?" · "+esc(r.location):""}</span></div>
        <div class="title">${esc(it.title)}</div>
        ${r.story?`<p class="story">${esc(r.story)}</p>`:""}${tracklist}
        ${(who.length||back.length||fwd.length||same.length)?`<div class="pills">${who.map(person).join("")}${back.map(x=>pill(x,"back")).join("")}${same.slice(0,12).map(x=>pill(x)).join("")}${fwd.map(x=>pill(x,"fwd")).join("")}</div>`:""}
        ${mini?"":`<div class="actions">${acts}</div>`}
      </div></article>`;
  }

  function render(){
    const main = document.getElementById("main"), fb = document.getElementById("follow");
    if (state.follow){ const p = people[state.follow];
      fb.style.display="block"; fb.innerHTML = `Following <b style="color:${COLORS[p.type]}">${esc(p.name)}</b> through time${p.role?` · ${esc(p.role)}`:""}. ${esc(p.bio||"")}<button id="unfollow">Show everything</button>`;
      document.getElementById("unfollow").onclick = () => { state.follow=null; render(); };
    } else fb.style.display="none";
    let html = "", year = null, shown = 0;
    items.filter(visible).forEach(it => {
      const y = (it.date||"").slice(0,4) || "Undated";
      if (y !== year){ if (year!==null) html += `</div>`; html += `<div class="year"><span>${y}</span></div><div class="rail">`; year = y; }
      html += card(it); shown++;
    });
    if (year!==null) html += `</div>`;
    main.innerHTML = html;
    document.getElementById("empty").style.display = shown ? "none" : "block";
    main.querySelectorAll("[data-go]").forEach(p => p.onclick = () => go(p.dataset.go));
    main.querySelectorAll("[data-follow]").forEach(p => p.onclick = () => { state.follow = p.dataset.follow; render(); scrollTo({top:0}); });
  }
  function go(id){
    let el = document.getElementById("t-"+id);
    if (!el){ state.hidden.delete(byId[id].group); document.querySelectorAll(".chip").forEach((c,i)=>{ if(Object.keys(LABEL)[i]===byId[id].group) c.classList.remove("off"); }); state.q=""; document.getElementById("search").value=""; state.follow=null; render(); el = document.getElementById("t-"+id); }
    if (!el) return;
    el.scrollIntoView({behavior:"smooth", block:"center"});
    el.classList.add("flash"); setTimeout(()=>el.classList.remove("flash"), 1800);
    history.replaceState(null, "", "#"+id);
  }
  render();
  const start = decodeURIComponent(location.hash.slice(1));
  if (start && byId[start]) setTimeout(()=>go(start), 200);
  else if (start && people[start]) { state.follow = start; render(); }
}
