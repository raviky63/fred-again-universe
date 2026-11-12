// The Fred again.. Universe — reads the data/ folder and draws the web.
const COLORS = {fred:"#ff5a36", artist:"#7cc6ff", crew:"#c3a6ff", album:"#ffd166", single:"#ff9ecb", feature:"#5ee3b0", track:"#ffb38a", event:"#ffffff", merch:"#d7ff5e", fest:"#ffd166"};
const LABELS = {artist:"Artists", album:"Albums & EPs", single:"Singles", track:"Tracks", feature:"Features", event:"Shows & sets", merch:"Merch"};
const KIND_NAME = {hub:"Year of shows", artist:"Artist", crew:"Crew", album:"Album", ep:"EP", mixtape:"Mixtape", single:"Single / collab", feature:"Feature", track:"Track", event:"Show / moment", mix:"DJ mix / radio", upcoming:"Upcoming show", merch:"Merch", fred:"The centre"};
const FILES = ["meta","center","artists","releases","tracks","events","crew","merch"];
const state = {hidden:new Set(), year:"", selected:null, query:"", focus:null};

const hue = s => { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))%360; return h; };
const initials = n => n.replace(/[^A-Za-z0-9 ]/g,"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const yearOf = d => { const m = String(d || "").match(/(19|20)\d\d/); return m ? +m[0] : null; };
const flagUrl = (cc,w=40) => `https://flagcdn.com/w${w}/${cc.toLowerCase()}.png`;
const flagsHtml = cs => (cs||[]).map(cc=>`<img src="${flagUrl(cc)}" alt="${cc}" title="${cc}" style="height:11px;border-radius:2px;margin-left:5px;vertical-align:-1px">`).join("");
const shortTitle = t => { t = t.replace(/\s*\(.*\)$/,""); return t.length>24 ? t.slice(0,22)+"…" : t; };

Promise.all(FILES.map(f => fetch(`data/${f}.json`).then(r => r.json())))
  .then(parts => build(Object.fromEntries(FILES.map((f,i)=>[f,parts[i]]))))
  .catch(() => document.body.insertAdjacentHTML("beforeend",
    `<p style="position:fixed;top:45%;width:100%;text-align:center;color:#999">Could not load the data folder.</p>`));

function build(data){
  // ---------- graph ----------
  const nodes=[], links=[], byId={};
  const add = n => { nodes.push(n); byId[n.id]=n; };
  const link = (a,b,main=false) => { if (byId[a] && byId[b]) links.push({source:a,target:b,main}); };
  const c = data.center;

  add({id:c.id, type:"fred", name:c.name, raw:c, r:46, img:c.photo});
  data.artists.forEach(a => add({id:a.id, type:"artist", name:a.name, raw:a, r:13, img:a.photo}));
  data.releases.forEach(r => { const t=["ep","mixtape"].includes(r.kind)?"album":r.kind; add({id:r.id, type:t, kind:r.kind, name:r.title, raw:r, year:yearOf(r.date), s:r.kind==="album"?34:r.kind==="single"?22:28, img:r.cover}); });
  const relCover = Object.fromEntries(data.releases.map(r=>[r.id,r.cover]));
  data.tracks.forEach(t => add({id:t.id, type:"track", name:t.title, raw:t, year:yearOf(t.date), s:13, img:t.cover||relCover[(t.releases||[])[0]]}));
  data.events.forEach(e => add({id:e.id, type:"event", kind:e.kind, name:e.title, raw:e, year:yearOf(e.date), s:e.kind==="mix"?11:16, img:e.thumbnail}));
  // crew stays in data/crew.json for a future crew page, but is left out of the web for now
  (data.merch||[]).forEach(m => add({id:m.id, type:"merch", name:m.title, raw:m, year:yearOf(m.date), s:15, img:m.image}));

  data.releases.forEach(r => { if (r.part_of && byId[r.part_of]) link(r.part_of, r.id); else link(c.id, r.id, true); (r.with||[]).forEach(w=>link(r.id,w)); (r.tracks||[]).forEach(t=>link(r.id,t)); });
  data.tracks.forEach(t => (t.with||[]).forEach(w=>link(t.id,w)));
  // every show hangs on its year, so nothing floats loose; special shows keep their own links to artists and tracks
  data.events.forEach(e => {
    const y = yearOf(e.date);
    if (y){
      const hid = "year-"+y;
      if (!byId[hid]){ add({id:hid, type:"hub", name:`${y} · shows`, raw:{story:"", source:"setlist.fm / 1001Tracklists"}, year:y, r:15}); link(c.id, hid, true); }
      byId[hid].count = (byId[hid].count||0)+1; link(hid, e.id);
    } else link(c.id, e.id, true);
    (e.with||[]).forEach(w=>link(e.id,w)); (e.tracks||[]).forEach(t=>link(e.id,t));
  });
  nodes.filter(n=>n.type==="hub").forEach(n=>{ n.name=`${n.year} · ${n.count} shows`; });
  (data.merch||[]).forEach(x => { const l=(x.links_to||[]).filter(i=>byId[i]); if(!l.length) link(c.id, x.id, true); l.forEach(i=>link(x.id,i)); });

  const nb = {};
  links.forEach(l => { (nb[l.source]??=new Set()).add(l.target); (nb[l.target]??=new Set()).add(l.source); });
  nodes.filter(n=>n.type==="artist").forEach(n => {
    const k=(nb[n.id]||new Set()).size; n.r = 11+Math.min(k,6)*3;
  });

  // ---------- UI chrome ----------
  const chips=document.getElementById("chips");
  Object.entries(LABELS).forEach(([k,label])=>{
    const el=document.createElement("div"); el.className="chip";
    const shape = (k==="artist"||k==="crew")?"border-radius:50%":k==="event"?"transform:rotate(45deg) scale(.8)":"border-radius:2px";
    el.innerHTML=`<i style="background:${COLORS[k]};${shape}"></i>${label}`;
    el.onclick=()=>{ state.hidden.has(k)?state.hidden.delete(k):state.hidden.add(k); el.classList.toggle("off"); refresh(); };
    chips.appendChild(el);
  });
  document.getElementById("legend").innerHTML=`
    <div><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${COLORS.artist}"/></svg>Artist / person</div>
    <div><svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="1" fill="${COLORS.album}"/></svg>Release (cover)</div>
    <div><svg viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8" rx="1" fill="${COLORS.track}"/></svg>Track</div>
    <div><svg viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8" fill="#c8102e" stroke="#fff" transform="rotate(45 8 8)"/></svg>Own show (flag = country)</div>
    <div><svg viewBox="0 0 16 16"><rect x="4.5" y="4.5" width="7" height="7" fill="#c8102e" stroke="#ffd166" transform="rotate(45 8 8)"/><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#ffd166" transform="rotate(45 8 8)"/></svg>Festival</div>
    <div><svg viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8" fill="#fff" transform="rotate(45 8 8)"/></svg>Online / DJ mix</div>
    <div><svg viewBox="0 0 16 16"><polygon points="13,8 10.5,12.3 5.5,12.3 3,8 5.5,3.7 10.5,3.7" fill="${COLORS.merch}"/></svg>Merch</div>
    <div><svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="1" fill="none" stroke="#aaa" stroke-dasharray="2 2"/></svg>Still to verify</div>`;
  const yearSel=document.getElementById("year");
  [...new Set(nodes.map(n=>n.year).filter(Boolean))].sort().forEach(y=>yearSel.insertAdjacentHTML("beforeend",`<option>${y}</option>`));
  yearSel.onchange=()=>{ state.year=yearSel.value; refresh(); };
  document.getElementById("reset").onclick=()=>setFocus(null);

  // ---------- SVG ----------
  const svg=d3.select("#svg"); let W=innerWidth, H=innerHeight;
  const defs=svg.append("defs");
  const glow=defs.append("radialGradient").attr("id","glow");
  glow.append("stop").attr("offset","0%").attr("stop-color",COLORS.fred).attr("stop-opacity",.5);
  glow.append("stop").attr("offset","100%").attr("stop-color",COLORS.fred).attr("stop-opacity",0);
  const stars=svg.append("g");
  for (let i=0;i<160;i++) stars.append("circle").attr("cx",Math.random()*W).attr("cy",Math.random()*H).attr("r",Math.random()*1.1).attr("fill","#fff").attr("opacity",Math.random()*.35);

  const world=svg.append("g");
  svg.on("click",e=>{ if(e.target===svg.node()) select(null); });
  world.append("circle").attr("r",280).attr("fill","url(#glow)");

  const linkSel=world.append("g").selectAll("line").data(links).join("line").attr("class","link").attr("stroke-opacity",d=>d.main?.3:.7);
  const nodeSel=world.append("g").selectAll("g").data(nodes).join("g").attr("class","node").style("cursor","pointer")
    .style("--d",d=>d.type==="fred"?"0s":`${Math.min(1.6,.15+Math.random()*1.4).toFixed(2)}s`)
    .on("click",(e,d)=>{ e.stopPropagation(); select(d.id); })
    .on("dblclick",(e,d)=>{ e.stopPropagation(); setFocus(d.id); })
    .on("mouseenter",(e,d)=>{ if(!state.selected) highlight(d.id); })
    .on("mouseleave",()=>{ if(!state.selected) highlight(state.focus); })
    .call(d3.drag()
      .on("start",(e,d)=>{ if(!e.active) sim.alphaTarget(.2).restart(); d.fx=d.x; d.fy=d.y; })
      .on("drag",(e,d)=>{ d.fx=e.x; d.fy=e.y; })
      .on("end",(e,d)=>{ if(!e.active) sim.alphaTarget(0); if(d.type!=="fred"){ d.fx=null; d.fy=null; } }));

  // photo inside any shape: clip + image, removed again if it fails to load
  function photo(g, d, clipShape){
    if (!d.img) return;
    const id="c"+d.id.replace(/[^a-z0-9]/gi,"");
    clipShape(defs.append("clipPath").attr("id",id));
    const size=(d.r?d.r*2:d.s*1.42);
    g.append("image").attr("href",d.img).attr("x",-size/2).attr("y",-size/2).attr("width",size).attr("height",size)
      .attr("preserveAspectRatio","xMidYMid slice").attr("clip-path",`url(#${id})`).on("error",function(){ this.remove(); });
  }

  nodeSel.each(function(d){
    const g=d3.select(this), unv=d.raw.verified===false, col=COLORS[d.type]||"#fff";
    if (d.type==="fred"){
      g.append("circle").attr("r",d.r).attr("fill",COLORS.fred);
      g.append("text").attr("text-anchor","middle").attr("dy","-.1em").attr("font-family","Space Grotesk").attr("font-weight",700).attr("font-size",15).attr("fill","#000").text("Fred");
      g.append("text").attr("text-anchor","middle").attr("dy","1.1em").attr("font-family","Space Grotesk").attr("font-weight",700).attr("font-size",15).attr("fill","#000").text("again..");
      photo(g,d,cp=>cp.append("circle").attr("r",d.r));
      g.append("circle").attr("r",d.r).attr("fill","none").attr("stroke",COLORS.fred).attr("stroke-width",3);
    } else if (d.type==="hub"){
      g.append("circle").attr("r",d.r).attr("fill","#111").attr("stroke","#fff").attr("stroke-dasharray","2 3").attr("stroke-width",1.5);
      g.append("text").attr("text-anchor","middle").attr("dy",".35em").attr("font-size",10).attr("font-family","Space Grotesk").attr("font-weight",700).attr("fill","#fff").text(d.year);
      g.append("text").attr("text-anchor","middle").attr("y",d.r+12).attr("font-size",10).attr("fill","#bbb").text(d.name);
    } else if (d.type==="merch"){
      const s=d.s, pts=[0,1,2,3,4,5].map(i=>{const a=Math.PI/3*i+Math.PI/6; return `${(Math.cos(a)*s*.62).toFixed(1)},${(Math.sin(a)*s*.62).toFixed(1)}`}).join(" ");
      g.append("polygon").attr("points",pts).attr("fill","#1a1f0c");
      photo(g,d,cp=>cp.append("polygon").attr("points",pts));
      g.append("polygon").attr("points",pts).attr("fill","none").attr("stroke",col).attr("stroke-width",1.8);
      g.append("text").attr("text-anchor","middle").attr("y",s*.62+11).attr("font-size",10).attr("fill",col).text(shortTitle(d.name));
    } else if (d.type==="artist" || d.type==="crew"){
      g.append("circle").attr("r",d.r).attr("fill","#0f1620");
      g.append("text").attr("text-anchor","middle").attr("dy",".35em").attr("font-size",Math.max(9,d.r*.7)).attr("font-weight",500).attr("fill",col).text(initials(d.name));
      photo(g,d,cp=>cp.append("circle").attr("r",d.r));
      g.append("circle").attr("r",d.r).attr("fill","none").attr("stroke",col).attr("stroke-width",2).attr("stroke-dasharray",unv?"3 3":null);
      g.append("text").attr("text-anchor","middle").attr("y",d.r+13).attr("font-size",11).attr("fill","#cfd8e3").text(d.name);
    } else if (d.type==="event"){
      const s=d.s, pts=`0,${-s*.71} ${s*.71},0 0,${s*.71} ${-s*.71},0`, cc=(d.raw.country||[])[0], fest=d.raw.setting==="festival";
      g.append("polygon").attr("points",pts).attr("fill",cc?"#222":"#fff").attr("fill-opacity",unv?.5:1);
      // the flag of the country is the icon itself; a photo (if we have one) still wins
      if (!d.img && cc){ const id="f"+d.id.replace(/[^a-z0-9]/gi,""); defs.append("clipPath").attr("id",id).append("polygon").attr("points",pts);
        // the whole flag, turned 45° so it fills the diamond exactly (no stripes cut off)
        g.append("image").attr("href",flagUrl(cc,80)).attr("x",-s/2).attr("y",-s/2).attr("width",s).attr("height",s)
          .attr("preserveAspectRatio","none").attr("transform","rotate(45)").on("error",function(){ this.remove(); }); }
      photo(g,d,cp=>cp.append("polygon").attr("points",pts));
      if (fest){ const o=s*.71+4; g.append("polygon").attr("points",`0,${-o} ${o},0 0,${o} ${-o},0`).attr("fill","none").attr("stroke",COLORS.fest).attr("stroke-width",1.4); }
      g.append("polygon").attr("points",pts).attr("fill","none").attr("stroke",fest?COLORS.fest:"#fff").attr("stroke-width",1.2).attr("stroke-dasharray",unv?"3 3":null);
      g.append("text").attr("text-anchor","middle").attr("y",s+(fest?12:8)).attr("font-size",10.5).attr("fill","#bbb").text(d.name.length>30?d.name.slice(0,28)+"…":d.name);
    } else {
      const s=d.s, h=hue(d.id), gid="g"+d.id.replace(/[^a-z0-9]/gi,"");
      const gr=defs.append("linearGradient").attr("id",gid).attr("x1",0).attr("y1",0).attr("x2",1).attr("y2",1);
      gr.append("stop").attr("offset","0%").attr("stop-color",`hsl(${h},55%,42%)`);
      gr.append("stop").attr("offset","100%").attr("stop-color",`hsl(${(h+50)%360},60%,18%)`);
      if (d.type!=="track") g.append("circle").attr("cx",s*.18).attr("r",s*.46).attr("fill","#050505").attr("stroke","#222");
      g.append("rect").attr("x",-s/2).attr("y",-s/2).attr("width",s).attr("height",s).attr("rx",2).attr("fill",`url(#${gid})`);
      if (s>20) g.append("text").attr("text-anchor","middle").attr("dy",".35em").attr("font-size",s>30?11:8.5).attr("font-weight",700).attr("font-family","Space Grotesk").attr("fill","#fff").attr("opacity",.9).text(initials(d.name));
      photo(g,d,cp=>cp.append("rect").attr("x",-s/2).attr("y",-s/2).attr("width",s).attr("height",s).attr("rx",2));
      g.append("rect").attr("x",-s/2).attr("y",-s/2).attr("width",s).attr("height",s).attr("rx",2).attr("fill","none")
        .attr("stroke",col).attr("stroke-width",1.5).attr("stroke-dasharray",unv?"3 3":null);
      g.append("text").attr("text-anchor","middle").attr("y",s/2+11).attr("font-size",d.type==="track"?9.5:11).attr("fill",col).text(shortTitle(d.name));
    }
  });

  const sim=d3.forceSimulation(nodes)
    .force("link",d3.forceLink(links).id(d=>d.id)
      .distance(l=>l.main?(l.target.type==="event"?260:190):(l.target.type==="track"||l.source.type==="track")?45:75)
      .strength(l=>l.main?.2:.6))
    .force("charge",d3.forceManyBody().strength(d=>d.type==="fred"?-900:d.type==="track"?-70:d.type==="artist"?-150:-240))
    .force("collide",d3.forceCollide().radius(d=>(d.r||d.s*.75)+9))
    .force("radial",d3.forceRadial(d=>({artist:420,crew:330,event:560,track:300,merch:360,hub:520}[d.type]||220),0,0).strength(.1));
  byId[c.id].fx=0; byId[c.id].fy=0;
  sim.on("tick",()=>{
    linkSel.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
    nodeSel.attr("transform",d=>`translate(${d.x},${d.y})`);
  });

  const zoom=d3.zoom().scaleExtent([.2,4]).on("zoom",e=>world.attr("transform",e.transform));
  svg.call(zoom).on("dblclick.zoom",null);
  // fit the whole web on screen; keeps doing so until the visitor zooms or drags themselves
  let userMoved=false;
  svg.on("wheel.track mousedown.track touchstart.track",()=>{ userMoved=true; });
  function fitView(ms=0){
    W=svg.node().clientWidth; H=svg.node().clientHeight;
    const xs=nodes.map(n=>n.x), ys=nodes.map(n=>n.y);
    const x0=Math.min(...xs)-60, x1=Math.max(...xs)+60, y0=Math.min(...ys)-60, y1=Math.max(...ys)+60;
    const k=Math.min(W/(x1-x0), (H-140)/(y1-y0), 1.5);
    const t=d3.zoomIdentity.translate(W/2, H/2+30).scale(k).translate(-(x0+x1)/2, -(y0+y1)/2);
    (ms?svg.transition().duration(ms):svg).call(zoom.transform,t);
  }
  sim.on("tick.fit",()=>{ if(!userMoved) fitView(); });
  sim.on("end",()=>{ sim.on("tick.fit",null); });
  const startId=decodeURIComponent(location.hash.slice(1));
  if (startId && byId[startId]) setTimeout(()=>{ userMoved=true; select(startId); const n=byId[startId]; W=svg.node().clientWidth; H=svg.node().clientHeight; svg.transition().duration(800).call(zoom.transform,d3.zoomIdentity.translate(W/2-150,H/2).scale(1.4).translate(-n.x,-n.y)); }, 2500);
  let rt; addEventListener("resize",()=>{ clearTimeout(rt); rt=setTimeout(()=>{ if(!userMoved) fitView(400); },150); });

  // ---------- filtering ----------
  function within(id,depth){ const seen=new Set([id]); let f=[id];
    for(let i=0;i<depth;i++){ const nx=[]; f.forEach(x=>(nb[x]||[]).forEach(y=>{ if(!seen.has(y)&&y!==c.id){ seen.add(y); nx.push(y);} })); f=nx; }
    return seen; }
  let focusSet=null;
  function visibleBase(d){
    if (d.type==="fred") return true;
    if (state.hidden.has(d.type==="hub"?"event":d.type)) return false;
    if (focusSet && !focusSet.has(d.id)) return false;
    return true;
  }
  function visible(d){
    if (!visibleBase(d)) return false;
    if (!state.year || d.type==="fred") return true;
    if (d.type==="artist") return [...(nb[d.id]||[])].some(x=>byId[x].year==state.year);
    return d.year==state.year;
  }
  function refresh(){
    nodeSel.classed("faded",d=>!visible(d));
    linkSel.classed("faded",l=>!visible(l.source)||!visible(l.target));
    if (state.query){
      const q=state.query.toLowerCase();
      nodeSel.classed("dim",d=>d.type!=="fred" && !d.name.toLowerCase().includes(q));
    } else highlight(state.selected);
  }
  function highlight(id){
    if (!id){ nodeSel.classed("dim",false); linkSel.classed("hot",false).classed("dim",false); return; }
    const n=nb[id]||new Set();
    nodeSel.classed("dim",d=>d.id!==id && !n.has(d.id));
    linkSel.classed("hot",l=>l.source.id===id||l.target.id===id).classed("dim",l=>!(l.source.id===id||l.target.id===id));
  }
  function setFocus(id){
    state.focus=id; focusSet=id?within(id,2):null;
    document.getElementById("focusInfo").textContent=id?`Starting from: ${byId[id].name.replace(/\s*\(.*\)$/,"")}`:"";
    document.getElementById("reset").style.display=id?"":"none";
    refresh();
    if (id){ const n=byId[id]; userMoved=true; W=svg.node().clientWidth; H=svg.node().clientHeight; svg.transition().duration(700).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(1.3).translate(-n.x,-n.y)); }
  }

  // ---------- side panel ----------
  const panel=document.getElementById("panel"), body=document.getElementById("panelBody");
  document.getElementById("close").onclick=()=>select(null);
  const pills = ids => `<div class="pills">${ids.map(i=>byId[i]).filter(Boolean).map(n=>`<span class="pill" data-id="${n.id}">${esc(n.name)}</span>`).join("")}</div>`;
  const badge = r => r.verified===false?`<span class="badge no">Still to verify</span>`:`<span class="badge ok">Verified</span>`;
  const linksOf = id => [...(nb[id]||[])].filter(x=>x!==c.id);
  const ofType = (id,types) => linksOf(id).filter(x=>types.includes(byId[x].type));
  function hero(n){
    const hh=hue(n.id), round=["artist","fred","crew"].includes(n.type);
    return `<div class="cover" style="${round?"border-radius:50%;width:60%;margin-left:20%;":""}background:linear-gradient(135deg,hsl(${hh},55%,42%),hsl(${(hh+50)%360},60%,18%))">
      <div style="position:absolute;inset:0;display:grid;place-items:center;font-family:Space Grotesk;font-weight:700;font-size:56px;opacity:.85">${initials(n.name)}</div>
      ${n.img?`<img src="${esc(n.img)}" alt="" onerror="this.remove()">`:""}</div>`;
  }
  function media(list){
    if (!list?.length) return "";
    return `<div class="section"><h3>Clips & fan stories</h3>${list.map(m=>`<p class="story">${m.url?`<a href="${esc(m.url)}" target="_blank" rel="noopener" style="color:var(--ink)">${esc(m.title||m.url)} ↗</a>`:""}${m.text?`<br>${esc(m.text)}`:""}${m.by?`<br><span class="src">— ${esc(m.by)}</span>`:""}</p>`).join("")}</div>`;
  }

  function select(id){
    state.selected=id; highlight(id||state.focus);
    if (!id){ panel.classList.remove("open"); return; }
    const n=byId[id], r=n.raw, col=COLORS[n.type]||COLORS.fred;
    let h=`<div class="kind" style="color:${col}">${KIND_NAME[n.kind]||KIND_NAME[n.type]||n.type}</div><h2>${esc(n.name)}</h2>`;
    if (n.type==="fred"){
      h+=hero(n)+`<div class="sub">${esc(r.real_name)} · born ${esc(r.born)}</div><p class="story">${esc(r.bio)}</p><p class="story">${esc(r.story)}</p>${r.story_name?`<div class="section"><h3>Where the name comes from</h3><p class="story">${esc(r.story_name)}</p></div>`:""}
        <div class="section"><h3>Awards</h3><ul class="awards">${r.awards.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></div>`;
    } else if (n.type==="artist"){
      h+=hero(n)+`<p class="story">${esc(r.bio)}</p>`;
      const rel=ofType(id,["album","single","feature","track"]), ev=ofType(id,["event"]);
      if (rel.length) h+=`<div class="section"><h3>With Fred on</h3>${pills(rel)}</div>`;
      if (ev.length) h+=`<div class="section"><h3>On stage together</h3>${pills(ev)}</div>`;
      if (r.photo_credit) h+=`<div class="src">Photo: ${esc(r.photo_credit)}</div>`;
    } else if (n.type==="hub"){
      h+=`<p class="story">Every show in ${n.year} that has no extra story or collaborators yet. Open the timeline to walk through them one by one.</p><div class="section"><h3>Shows</h3>${pills(linksOf(id).filter(x=>byId[x].type==="event"))}</div>`;
    } else if (n.type==="crew"){
      h+=hero(n)+`<div class="sub">${esc(r.role)}</div><p class="story">${esc(r.bio)}</p>`;
      const w=linksOf(id); if (w.length) h+=`<div class="section"><h3>Worked on</h3>${pills(w)}</div>`;
    } else if (n.type==="merch"){
      h+=hero(n)+`<div class="sub">${esc(r.date)}</div><p class="story">${esc(r.story)}</p>`;
      const w=linksOf(id); if (w.length) h+=`<div class="section"><h3>Tied to</h3>${pills(w)}</div>`;
    } else if (n.type==="event"){
      h+=hero(n)+`<div class="sub">${esc(r.date)} · ${esc(r.location)}${flagsHtml(r.country)}${r.setting==="festival"?" · festival":r.setting==="own"?" · own show":""}</div>${r.story?`<p class="story">${esc(r.story)}</p>`:""}`;
      if (r.tracklist?.length) h+=`<div class="section"><h3>Tracklist</h3><ol class="awards">${r.tracklist.map(t=>`<li>${esc(t)}</li>`).join("")}</ol></div>`;
      if (r.tracklist_link) h+=`<div class="section links"><a href="${esc(r.tracklist_link)}" target="_blank" rel="noopener">Full tracklist ↗</a></div>`;
      const cw=ofType(id,["crew"]); if (cw.length) h+=`<div class="section"><h3>Crew</h3>${pills(cw)}</div>`;
      if (r.with?.length) h+=`<div class="section"><h3>On stage with</h3>${pills(r.with)}</div>`;
      if (r.tracks?.length) h+=`<div class="section"><h3>Tracks tied to this moment</h3>${pills(r.tracks)}</div>`;
      h+=media(r.media);
    } else if (n.type==="track"){
      h+=(n.img?hero(n):"")+`<div class="sub">${esc(r.date||"Date to add")}</div>${r.story?`<p class="story">${esc(r.story)}</p>`:""}`;
      h+=`<div class="section"><h3>Appears on</h3>${pills(r.releases||[])}</div>`;
      if (r.with?.length) h+=`<div class="section"><h3>With</h3>${pills(r.with)}</div>`;
      const ev=ofType(id,["event"]); if (ev.length) h+=`<div class="section"><h3>Moments</h3>${pills(ev)}</div>`;
      const cw=ofType(id,["crew"]); if (cw.length) h+=`<div class="section"><h3>Crew</h3>${pills(cw)}</div>`;
    } else {
      h+=hero(n)+`<div class="sub">${esc(r.date||"Date to add")}</div><p class="story">${esc(r.story)}</p>`;
      if (r.part_of) h+=`<div class="section"><h3>Addition to</h3>${pills([r.part_of])}</div>`;
      if (r.with?.length) h+=`<div class="section"><h3>Featuring</h3>${pills(r.with)}</div>`;
      if (r.tracks?.length) h+=`<div class="section"><h3>Tracks</h3>${pills(r.tracks)}</div>`;
      const mm=ofType(id,["merch"]); if (mm.length) h+=`<div class="section"><h3>Merch</h3>${pills(mm)}</div>`;
    }
    const L=r.links||{};
    const ls=[["Spotify",L.spotify],["YouTube",L.youtube],["Instagram",L.instagram],["SoundCloud",L.soundcloud],["Website",L.website]].filter(x=>x[1]);
    if (ls.length) h+=`<div class="section links"><h3>Listen / watch</h3>${ls.map(([k,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${k} ↗</a>`).join("")}</div>`;
    if (n.type!=="fred") h+=`<div class="section"><button class="pill" id="focusBtn">Start the web from here</button> <a class="pill" style="text-decoration:none" href="timeline.html#${id}">${["artist","crew"].includes(n.type)?"Follow through time":"See on the timeline"} →</a></div>`;
    h+=`<div class="section"><h3>Source</h3>${badge(r)}<div class="src">${esc(r.source||"")}</div></div>`;
    body.innerHTML=h; panel.classList.add("open"); panel.scrollTop=0;
    body.querySelectorAll(".pill[data-id]").forEach(p=>p.onclick=()=>select(p.dataset.id));
    const fb=document.getElementById("focusBtn"); if (fb) fb.onclick=()=>setFocus(id);
  }

  // ---------- search ----------
  document.getElementById("search").addEventListener("input",e=>{
    state.query=e.target.value.trim(); refresh();
    const q=state.query.toLowerCase();
    const hit=q.length>2 && nodes.find(n=>n.name.toLowerCase().startsWith(q));
    if (hit){ userMoved=true; W=svg.node().clientWidth; H=svg.node().clientHeight; } if (hit) svg.transition().duration(600).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(1.4).translate(-hit.x,-hit.y));
  });
}
