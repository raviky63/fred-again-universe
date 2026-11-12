// The Fred again.. Universe — the web.
// Starts small (Fred, eras, albums, tours) and opens up when you click. Names only where there is room to read them.
// Eras: data/eras.json · story steps: STORY below · tours: TOURS below.
const COLORS = {fred:"#ff5a36", artist:"#7cc6ff", release:"#ffd166", track:"#ffb38a", event:"#ffffff", fest:"#ffd166"};
const KIND = {fred:"The centre", era:"Era", group:"Shows", artist:"Artist", album:"Album", ep:"EP", mixtape:"Mixtape", single:"Single / collab", feature:"Feature", track:"Track", show:"Show", mix:"DJ mix / radio", upcoming:"Upcoming show", moment:"Moment"};
const TOURS = [
  ["North America 2022","2022-09-23","2022-10-29"],["Actual Life 3 tour (Europe)","2022-11-09","2022-12-09"],
  ["London, three nights with Skrillex & Four Tet","2023-01-05","2023-01-07"],["Australia & NZ 2023","2023-01-25","2023-02-13"],
  ["New York week, Feb 2023","2023-02-14","2023-02-18"],["Ally Pally & Europe 2023","2023-09-04","2023-09-21"],
  ["US autumn 2023","2023-10-12","2023-11-03"],["Australia & NZ 2024","2024-02-26","2024-03-30"],
  ["places we've never been","2024-09-09","2024-10-14"],["Asia 2025","2025-07-21","2025-07-31"],["Italy summer 2025","2025-09-04","2025-09-12"],
  ["USB002","2025-10-03","2026-02-27"]
];
const STORY = ["actual-life","boiler-room-2022","actual-life-3","msg-2023","grammys-2024","la-coliseum-2024","ten-days","usb002-glasgow","bangalter-2026","nine-months"];
const FILES = ["center","artists","releases","tracks","events","eras","merch"];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const flagUrl = (cc,w=40) => `https://flagcdn.com/w${w}/${cc.toLowerCase()}.png`;
const flagsHtml = cs => (cs||[]).map(cc=>`<img src="${flagUrl(cc)}" alt="${cc}" title="${cc}" style="height:11px;border-radius:2px;margin-left:5px;vertical-align:-1px">`).join("");
const hue = s => { let h=0; for (const c of s) h=(h*31+c.charCodeAt(0))%360; return h; };
const initials = n => n.replace(/[^A-Za-z0-9 ]/g,"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const short = (t,n=26) => { t=t.replace(/\s*\(.*\)$/,""); return t.length>n ? t.slice(0,n-1)+"…" : t; };

Promise.all(FILES.map(f=>fetch(`data/${f}.json`).then(r=>r.json())))
  .then(p=>build(Object.fromEntries(FILES.map((f,i)=>[f,p[i]]))))
  .catch(e=>{ console.error(e); document.body.insertAdjacentHTML("beforeend",`<p style="position:fixed;top:45%;width:100%;text-align:center;color:#999">Could not load the data folder.</p>`); });

function build(D){
  const eras = D.eras.slice().sort((a,b)=>a.start.localeCompare(b.start));
  const eraOf = d => { let e=eras[0]; for(const x of eras) if((d||"9999")>=x.start) e=x; return e; };
  const all = {}, edges = [];
  const add = n => (all[n.id]=n);
  const c = D.center;
  add({id:c.id,type:"fred",name:"Fred again..",img:c.photo,r:34,raw:c});
  eras.forEach(e=>add({id:"era-"+e.id,type:"era",name:e.name,era:e,r:22,raw:{story:e.note}}));
  const cover = {}; D.releases.forEach(r=>cover[r.id]=r.cover);
  D.releases.forEach(r=>add({id:r.id,type:"release",kind:r.kind,name:r.title,img:r.cover,era:eraOf(r.date),big:["album","mixtape"].includes(r.kind)||r.kind==="ep"&&!r.part_of,r:r.kind==="album"?17:r.kind==="single"?10:13,raw:r}));
  D.tracks.forEach(t=>add({id:t.id,type:"track",kind:"track",name:t.title,img:t.cover||cover[(t.releases||[])[0]],era:eraOf(t.date),r:6,raw:t}));
  D.artists.forEach(a=>add({id:a.id,type:"artist",kind:"artist",name:a.name,img:a.photo,r:8,deg:0,raw:a}));
  D.events.forEach(e=>add({id:e.id,type:"event",kind:e.kind,name:e.title,era:eraOf(e.date),r:6,raw:e,cc:(e.country||[])[0]}));
  D.events.forEach(e=>{
    const t = TOURS.find(([n,a,b])=>e.date>=a && e.date<=b);
    const gid = t ? "tour-"+t[0] : `y-${e.date.slice(0,4)}-${e.kind==="mix"?"mix":e.setting==="festival"?"fest":"show"}`;
    const gname = t ? t[0] : `${e.date.slice(0,4)} · ${e.kind==="mix"?"mixes & radio":e.setting==="festival"?"festivals":e.kind==="moment"?"moments":"other shows"}`;
    if(!all[gid]) add({id:gid,type:"group",kind:"group",name:gname,era:eraOf(e.date),r:12,kids:[],ccs:new Set(),raw:{}});
    all[gid].kids.push(e.id); (e.country||[]).forEach(x=>all[gid].ccs.add(x)); all[e.id].group=gid;
  });
  Object.values(all).filter(n=>n.type==="group").forEach(g=>{ g.label=`${g.name} · ${g.kids.length}`; g.r=Math.min(20,9+Math.sqrt(g.kids.length)*1.6); });
  const E=(a,b)=>{ if(all[a]&&all[b]&&a!==b) edges.push([a,b]); };
  D.releases.forEach(r=>{(r.with||[]).forEach(w=>E(r.id,w)); (r.tracks||[]).forEach(t=>E(r.id,t));});
  D.tracks.forEach(t=>(t.with||[]).forEach(w=>E(t.id,w)));
  D.events.forEach(e=>{(e.with||[]).forEach(w=>E(e.id,w)); (e.tracks||[]).forEach(t=>E(e.id,t));});
  const nb={}; edges.forEach(([a,b])=>{ (nb[a]??=new Set()).add(b); (nb[b]??=new Set()).add(a); });
  Object.values(all).filter(n=>n.type==="artist").forEach(n=>n.deg=(nb[n.id]||new Set()).size);
  const parent={};
  D.releases.forEach(r=>parent[r.id]=r.part_of||"era-"+all[r.id].era.id);
  D.tracks.forEach(t=>parent[t.id]=(t.releases||[])[0]||"era-"+all[t.id].era.id);
  D.events.forEach(e=>parent[e.id]=all[e.id].group);
  Object.values(all).filter(n=>n.type==="group").forEach(g=>parent[g.id]="era-"+g.era.id);
  eras.forEach(e=>parent["era-"+e.id]=c.id);
  D.artists.forEach(a=>{ const n=[...(nb[a.id]||[])].sort((p,q)=>(all[p].type==="release"?0:1)-(all[q].type==="release"?0:1)); parent[a.id]=n[0]; });
  const expanded=new Set();

  // ---------- what is visible ----------
  function visible(){
    const v=new Set([c.id]);
    for(const n of Object.values(all)){
      if(n.type==="fred"||n.type==="artist") continue;
      if(n.type==="era"){ v.add(n.id); continue; }
      if(n.type==="release" && n.big && !n.raw.part_of){ v.add(n.id); continue; }
      const p=parent[n.id]; if(p && expanded.has(p) && (n.type!=="event"||expanded.has(n.group))) v.add(n.id);
    }
    for(const n of Object.values(all)) if(n.type==="artist")
      if([...(nb[n.id]||[])].some(id=>v.has(id) && (all[id].type!=="release" || expanded.has(id) || expanded.has(parent[id])))) v.add(n.id);
    return v;
  }
  const homeOf=(n,v)=>{ if(n.type==="era") return c.id; const p=parent[n.id]; if(p&&v.has(p)) return p; return c.id; };

  // ---------- labels: only where there is room ----------
  let k=1, hover=null, selected=null;
  const labelW = d => Math.min((d.label||short(d.name)).length, 28)*6.1+10;
  const showsLabel = (d,kk=k) => {
    if(d.id===hover||d.id===selected) return true;
    if(["fred","era","group"].includes(d.type)) return true;
    if(d.type==="release" && (d.big||expanded.has(parent[d.id]))) return true;
    if(expanded.has(parent[d.id])) return true;           // children of something you opened
    if(d.type==="artist") return true;
    return kk>1.3;
  };
  const rad = d => d.type==="artist" ? 4+Math.min(d.deg,10)*1.6 : d.r;
  // nodes that carry a name get a wider "personal space", so names don't sit on top of each other
  // label room only for the important names, and never more than the name needs at normal zoom (otherwise "open everything" explodes)
  let crowd=0;
  const space = d => { const sc=1/Math.min(Math.max(k,.8),2.2); const important = crowd<160 || prio(d)<=4 || (d.type==="artist"&&d.deg>=4);
    return showsLabel(d) && important ? Math.max(rad(d)+(d.type==="group"?16:8), labelW(d)*sc/2+5) : rad(d)+6; };

  // ---------- svg ----------
  const svg=d3.select("#svg"), world=svg.append("g"), defs=svg.append("defs");
  const glow=defs.append("radialGradient").attr("id","glow");
  glow.append("stop").attr("offset","0%").attr("stop-color",COLORS.fred).attr("stop-opacity",.45);
  glow.append("stop").attr("offset","100%").attr("stop-color",COLORS.fred).attr("stop-opacity",0);
  world.append("circle").attr("r",260).attr("fill","url(#glow)");
  const gL=world.append("g"), gN=world.append("g");
  let zt; const zoom=d3.zoom().scaleExtent([.15,5]).on("zoom",e=>{ world.attr("transform",e.transform); k=e.transform.k; labels();
    clearTimeout(zt); zt=setTimeout(()=>{ sim.force("collide").radius(space); sim.alpha(Math.max(sim.alpha(),.15)).restart(); },250); });
  svg.call(zoom).on("dblclick.zoom",null);
  svg.on("click",e=>{ if(e.target===svg.node()) select(null); });
  const sim=d3.forceSimulation()
    .force("charge",d3.forceManyBody().strength(d=>d.type==="fred"?-1100:d.type==="era"?-700:d.type==="group"?-320:-150))
    .force("link",d3.forceLink().id(d=>d.id).distance(l=>l.kind==="also"?160:l.kind==="home"?(l.target.type==="era"?260:l.target.type==="group"?110:80):90).strength(l=>l.kind==="home"?.6:l.kind==="also"?.02:.12))
    .force("collide",d3.forceCollide().radius(space).strength(.9).iterations(2))
    .force("x",d3.forceX(0).strength(.03)).force("y",d3.forceY(0).strength(.03));
  all[c.id].fx=0; all[c.id].fy=0;

  function render(){
    const v=visible(), nodes=[...v].map(id=>all[id]), links=[];
    nodes.forEach(n=>{ const h=homeOf(n,v); if(h&&v.has(h)&&h!==n.id) links.push({source:h,target:n.id,kind:"home"}); });
    edges.forEach(([a,b])=>{ if(v.has(a)&&v.has(b)) links.push({source:a,target:b,kind:"with"}); });
    const seen=new Set(links.map(l=>(l.source.id||l.source)+">"+(l.target.id||l.target)));
    nodes.filter(n=>n.type==="artist").forEach(a=>{
      (nb[a.id]||new Set()).forEach(id=>{
        if(v.has(id)) return;
        let p=id; while(p && !v.has(p)) p=parent[p];          // walk up to whatever is visible (album, tour, era)
        if(!p || p===c.id) return;
        const key=a.id+">"+p; if(seen.has(key)) return; seen.add(key);
        links.push({source:a.id,target:p,kind:"also"});
      });
    });
    nodes.forEach(n=>{ if(n.x==null){ const h=all[homeOf(n,v)]||all[c.id]; n.x=(h.x||0)+(Math.random()-.5)*40; n.y=(h.y||0)+(Math.random()-.5)*40; } });
    const ls=gL.selectAll("line").data(links,d=>(d.source.id||d.source)+">"+(d.target.id||d.target));
    ls.exit().remove(); ls.enter().append("line").attr("class","link");
    const ns=gN.selectAll("g.node").data(nodes,d=>d.id);
    ns.exit().transition().duration(250).style("opacity",0).remove();
    const ne=ns.enter().append("g").attr("class","node").style("cursor","pointer").style("opacity",0)
      .on("click",(e,d)=>{ e.stopPropagation(); toggle(d); select(d.id); })
      .on("mouseenter",(e,d)=>{ hover=d.id; labels(); }).on("mouseleave",()=>{ hover=null; labels(); })
      .call(d3.drag().on("start",(e,d)=>{ if(!e.active) sim.alphaTarget(.2).restart(); d.fx=d.x; d.fy=d.y; })
        .on("drag",(e,d)=>{ d.fx=e.x; d.fy=e.y; }).on("end",(e,d)=>{ if(!e.active) sim.alphaTarget(0); if(d.type!=="fred"){ d.fx=null; d.fy=null; } }));
    ne.transition().duration(450).style("opacity",1);
    ne.each(function(){ const g=d3.select(this); g.append("g").attr("class","shape"); g.append("rect").attr("class","lbg"); g.append("text").attr("class","lab").attr("text-anchor","middle"); });
    gN.selectAll("g.node").each(function(d){ draw(d3.select(this),d); });
    crowd=nodes.length;
    sim.nodes(nodes); sim.force("link").links(links); sim.force("collide").radius(space); sim.alpha(.8).restart();
    labels();
  }
  function toggle(d){
    if(["era","group"].includes(d.type) || (d.type==="release" && (D.tracks.some(t=>(t.releases||[])[0]===d.id) || D.releases.some(r=>r.part_of===d.id) || (d.raw.with||[]).length))){
      expanded.has(d.id)?expanded.delete(d.id):expanded.add(d.id); render();
    }
  }
  function draw(g,d){
    const s=g.select(".shape").html(""), r=rad(d), col=d.era?.color||"#fff";
    const clip=(make)=>{ const id="cp"+d.id.replace(/[^a-z0-9]/gi,""); if(!document.getElementById(id)) make(defs.append("clipPath").attr("id",id)); return `url(#${id})`; };
    const img=(u,shape,size)=>{ if(u) s.append("image").attr("href",u).attr("x",-size).attr("y",-size).attr("width",2*size).attr("height",2*size).attr("preserveAspectRatio","xMidYMid slice").attr("clip-path",clip(shape)).on("error",function(){this.remove();}); };
    if(d.type==="fred"){ s.append("circle").attr("r",r).attr("fill",COLORS.fred); img(d.img,cp=>cp.append("circle").attr("r",r),r); s.append("circle").attr("r",r).attr("fill","none").attr("stroke",COLORS.fred).attr("stroke-width",3); }
    else if(d.type==="era"){ s.append("circle").attr("r",r).attr("fill",d.era.color+"2e").attr("stroke",d.era.color).attr("stroke-width",2).attr("stroke-dasharray",expanded.has(d.id)?null:"4 3"); }
    else if(d.type==="group"){ s.append("circle").attr("r",r).attr("fill","#15141c").attr("stroke",col).attr("stroke-width",1.5).attr("stroke-dasharray",expanded.has(d.id)?null:"2 3");
      [...d.ccs].slice(0,8).forEach((cc,i,a)=>{ const ang=-Math.PI/2+i*2*Math.PI/Math.max(a.length,1); s.append("image").attr("href",flagUrl(cc)).attr("x",Math.cos(ang)*(r+7)-6).attr("y",Math.sin(ang)*(r+7)-4).attr("width",12).attr("height",8).attr("preserveAspectRatio","none"); });
      s.append("text").attr("text-anchor","middle").attr("dy",".35em").attr("font-size",10).attr("fill","#fff").text(d.kids.length); }
    else if(d.type==="artist"){ s.append("circle").attr("r",r).attr("fill","#0f1620"); if(r>6) img(d.img,cp=>cp.append("circle").attr("r",r),r); s.append("circle").attr("r",r).attr("fill","none").attr("stroke",COLORS.artist).attr("stroke-width",1.5); }
    else if(d.type==="event"){ const q=r*1.3, p=`0,${-q} ${q},0 0,${q} ${-q},0`, fest=d.raw.setting==="festival";
      s.append("polygon").attr("points",p).attr("fill",d.cc?"#222":"#ddd");
      if(d.raw.thumbnail) img(d.raw.thumbnail,cp=>cp.append("polygon").attr("points",p),q);
      else if(d.cc) s.append("image").attr("href",flagUrl(d.cc)).attr("x",-q*.71).attr("y",-q*.71).attr("width",q*1.42).attr("height",q*1.42).attr("preserveAspectRatio","none").attr("transform","rotate(45)");
      if(fest){ const o=q+3; s.append("polygon").attr("points",`0,${-o} ${o},0 0,${o} ${-o},0`).attr("fill","none").attr("stroke",COLORS.fest); }
      s.append("polygon").attr("points",p).attr("fill","none").attr("stroke",fest?COLORS.fest:col); }
    else { s.append("rect").attr("x",-r).attr("y",-r).attr("width",2*r).attr("height",2*r).attr("rx",2).attr("fill",`hsl(${hue(d.id)},45%,30%)`);
      img(d.img,cp=>cp.append("rect").attr("x",-r).attr("y",-r).attr("width",2*r).attr("height",2*r).attr("rx",2),r);
      s.append("rect").attr("x",-r).attr("y",-r).attr("width",2*r).attr("height",2*r).attr("rx",2).attr("fill","none").attr("stroke",col).attr("stroke-width",expanded.has(d.id)?2.5:1.3); }
    g.select(".lab").text(d.label||short(d.name));
  }
  // most important names first; a name is skipped if it would sit on top of one already placed
  const prio = d => d.id===selected||d.id===hover?0 : d.type==="fred"?1 : d.type==="era"?2 : d.type==="release"&&d.big?3 : d.type==="group"?4 : d.type==="artist"?5-Math.min(d.deg,8)/10 : d.type==="release"?6 : 7;
  function labels(){
    const fs=11.5/Math.min(Math.max(k,.35),2.2), placed=[];
    const items=[]; gN.selectAll("g.node").each(function(d){ items.push([d,this]); });
    items.sort((a,b)=>prio(a[0])-prio(b[0]));
    for(const [d,el] of items){
      const g=d3.select(el), r=rad(d), off=(d.type==="group"?r+8:r+3)+fs*1.05;
      const w=labelW(d)*fs/11.5, h=fs*1.45;
      let on=showsLabel(d);
      const box={x1:(d.x||0)-w/2,x2:(d.x||0)+w/2,y1:(d.y||0)+off-h/2,y2:(d.y||0)+off+h/2};
      if(on && prio(d)>2 && placed.some(b=>box.x1<b.x2&&box.x2>b.x1&&box.y1<b.y2&&box.y2>b.y1)) on=false;
      if(on) placed.push(box);
      g.select(".lab").style("display",on?null:"none").attr("y",off).style("font-size",fs+"px");
      g.select(".lbg").style("display",on?null:"none").attr("x",-w/2).attr("y",off-h/2).attr("width",w).attr("height",h).attr("rx",3);
    }
  }
  sim.on("tick",()=>{
    gL.selectAll("line").attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y).attr("class",d=>"link"+(d.kind==="home"?" home":d.kind==="also"?" also":""));
    gN.selectAll("g.node").attr("transform",d=>`translate(${d.x},${d.y})`);
    if(++tickN%8===0) labels();
  });
  let tickN=0; sim.on("end",labels);
  const W=()=>svg.node().clientWidth, H=()=>svg.node().clientHeight;
  svg.call(zoom.transform,d3.zoomIdentity.translate(W()/2,H()/2+30).scale(.75));
  const reveal = id => { let p=parent[id]; while(p&&p!==c.id){ expanded.add(p); p=parent[p]; } if(all[id].group) expanded.add(all[id].group); };
  const focusOn = (id,scale=1.6) => { const n=all[id]; const panelW = document.getElementById("panel").classList.contains("open") && innerWidth>720 ? 380 : 0;
    svg.transition().duration(900).call(zoom.transform,d3.zoomIdentity.translate((W()-panelW)/2,H()*.3).scale(scale).translate(-(n.x||0),-(n.y||0))); };

  // ---------- side panel ----------
  const panel=document.getElementById("panel"), body=document.getElementById("panelBody");
  document.getElementById("close").onclick=()=>select(null);
  const pills = ids => `<div class="pills">${ids.map(i=>all[i]).filter(Boolean).map(n=>`<span class="pill" data-id="${n.id}">${esc(short(n.name,40))}</span>`).join("")}</div>`;
  const badge = r => r.verified===false?`<span class="badge no">Still to verify</span>`:`<span class="badge ok">Verified</span>`;
  const nbOf = (id,types) => [...(nb[id]||[])].filter(x=>!types||types.includes(all[x].type));
  function hero(n){
    const hh=hue(n.id), round=["artist","fred"].includes(n.type), im=n.img||n.raw?.thumbnail;
    return `<div class="cover" style="${round?"border-radius:50%;width:60%;margin-left:20%;":""}background:linear-gradient(135deg,hsl(${hh},55%,42%),hsl(${(hh+50)%360},60%,18%))">
      <div style="position:absolute;inset:0;display:grid;place-items:center;font-family:Space Grotesk;font-weight:700;font-size:56px;opacity:.85">${initials(n.name)}</div>
      ${im?`<img src="${esc(im)}" alt="" onerror="this.remove()">`:""}</div>`;
  }
  function select(id){
    selected=id; labels();
    gN.selectAll("g.node").classed("dim",d=>id && d.id!==id && !(nb[id]||new Set()).has(d.id) && parent[d.id]!==id && parent[id]!==d.id);
    if(!id){ panel.classList.remove("open"); return; }
    const n=all[id], r=n.raw||{};
    let h=`<div class="kind" style="color:${n.era?.color||COLORS.fred}">${KIND[n.kind]||KIND[n.type]||n.type}${n.era&&n.type!=="era"?` · ${esc(n.era.name)} era`:""}</div><h2>${esc(n.type==="group"?n.label:n.name)}</h2>`;
    if(n.type==="fred"){
      h+=hero(n)+(r.photo_credit?`<div class="src">Photo: ${esc(r.photo_credit)}</div>`:"")+`<div class="sub">${esc(r.real_name)} · born ${esc(r.born)}</div><p class="story">${esc(r.bio)}</p><p class="story">${esc(r.story)}</p>${r.story_name?`<div class="section"><h3>Where the name comes from</h3><p class="story">${esc(r.story_name)}</p></div>`:""}<div class="section"><h3>Awards</h3><ul class="awards">${(r.awards||[]).map(a=>`<li>${esc(a)}</li>`).join("")}</ul></div>`;
    } else if(n.type==="era"){
      h+=`<p class="story">${esc(r.story)}</p><p class="story" style="color:#8d8a95">Click the circle to open or close everything in this era.</p>`;
      h+=`<div class="section"><h3>In this era</h3>${pills(Object.keys(parent).filter(x=>parent[x]===id))}</div>`;
    } else if(n.type==="group"){
      h+=`<p class="story">${n.kids.length} shows. Click the circle to open them in the web, or walk through them on the timeline.</p><div class="section"><h3>Countries</h3><div>${flagsHtml([...n.ccs])}</div></div><div class="section"><h3>Shows</h3>${pills(n.kids)}</div>`;
    } else if(n.type==="artist"){
      h+=hero(n)+`<p class="story">${esc(r.bio)}</p>`;
      const rel=nbOf(id,["release","track"]), ev=nbOf(id,["event"]);
      if(rel.length) h+=`<div class="section"><h3>With Fred on</h3>${pills(rel)}</div>`;
      if(ev.length) h+=`<div class="section"><h3>On stage together</h3>${pills(ev)}</div>`;
      if(r.photo_credit) h+=`<div class="src">Photo: ${esc(r.photo_credit)}</div>`;
    } else if(n.type==="event"){
      h+=hero(n)+`<div class="sub">${esc(r.date)} · ${esc(r.location)}${flagsHtml(r.country)}${r.setting==="festival"?" · festival":""}</div>${r.story?`<p class="story">${esc(r.story)}</p>`:""}`;
      if(r.tracklist?.length) h+=`<div class="section"><h3>Tracklist</h3><ol class="awards">${r.tracklist.map(t=>`<li>${esc(t)}</li>`).join("")}</ol></div>`;
      if(r.with?.length) h+=`<div class="section"><h3>On stage with</h3>${pills(r.with)}</div>`;
      if(r.support?.length) h+=`<div class="section"><h3>Support / opening</h3><p class="story">${r.support.map(esc).join(", ")}</p><div class="src">${esc(r.support_source||"")}</div></div>`;
      if(r.tracks?.length) h+=`<div class="section"><h3>Tracks tied to this moment</h3>${pills(r.tracks)}</div>`;
    } else if(n.type==="track"){
      h+=(n.img?hero(n):"")+`<div class="sub">${esc(r.date||"Date to add")}</div>${r.story?`<p class="story">${esc(r.story)}</p>`:""}<div class="section"><h3>Appears on</h3>${pills(r.releases||[])}</div>`;
      if(r.with?.length) h+=`<div class="section"><h3>With</h3>${pills(r.with)}</div>`;
    } else {
      h+=hero(n)+`<div class="sub">${esc(r.date||"Date to add")}</div><p class="story">${esc(r.story)}</p>`;
      if(r.part_of) h+=`<div class="section"><h3>Addition to</h3>${pills([r.part_of])}</div>`;
      if(r.with?.length) h+=`<div class="section"><h3>Featuring</h3>${pills(r.with)}</div>`;
      if(r.tracks?.length) h+=`<div class="section"><h3>Tracks</h3>${pills(r.tracks)}</div>`;
    }
    const L=r.links||{}; const ls=[["Spotify",L.spotify],["YouTube",L.youtube],["Instagram",L.instagram],["SoundCloud",L.soundcloud],["Website",L.website]].filter(x=>x[1]);
    if(ls.length) h+=`<div class="section links"><h3>Listen / watch</h3>${ls.map(([k2,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${k2} ↗</a>`).join("")}</div>`;
    if(!["fred","era","group"].includes(n.type)) h+=`<div class="section"><a class="pill" style="text-decoration:none" href="timeline.html#${id}">${n.type==="artist"?"Follow through time":"See on the timeline"} →</a></div>`;
    if(r.source||r.verified!==undefined) h+=`<div class="section"><h3>Source</h3>${badge(r)}<div class="src">${esc(r.source||"")}</div></div>`;
    body.innerHTML=h; panel.classList.add("open"); panel.scrollTop=0;
    body.querySelectorAll(".pill[data-id]").forEach(p=>p.onclick=()=>goTo(p.dataset.id));
    history.replaceState(null,"","#"+id);
  }
  function goTo(id){ if(!all[id]) return; reveal(id); render(); select(id); setTimeout(()=>focusOn(id),500); setTimeout(()=>focusOn(id),1700); }

  // ---------- story ----------
  const steps=STORY.filter(id=>all[id]); let si=0;
  const card=document.getElementById("story");
  function step(){
    const id=steps[si], n=all[id], r=n.raw||{};
    reveal(id); expanded.add(id); render();
    document.getElementById("sT").textContent=n.name;
    document.getElementById("sD").textContent=[r.date, n.era?.name+" era"].filter(Boolean).join(" · ");
    document.getElementById("sP").textContent=r.story||n.era?.note||"";
    document.getElementById("sN").textContent=`${si+1} / ${steps.length}`;
    hover=id; labels();
    setTimeout(()=>focusOn(id,1.5),500); setTimeout(()=>focusOn(id,1.5),1700);
  }
  document.getElementById("storyBtn").onclick=()=>{ select(null); card.classList.add("open"); si=0; step(); };
  document.getElementById("sClose").onclick=()=>{ card.classList.remove("open"); hover=null; labels(); };
  document.getElementById("next").onclick=()=>{ si=(si+1)%steps.length; step(); };
  document.getElementById("prev").onclick=()=>{ si=(si-1+steps.length)%steps.length; step(); };
  // open everything, era by era, so it unfolds like a big bang
  document.getElementById("openAll").onclick=()=>{
    select(null);
    const order=[...eras.map(e=>"era-"+e.id), ...Object.values(all).filter(n=>n.type==="release").map(n=>n.id), ...Object.values(all).filter(n=>n.type==="group").map(n=>n.id)];
    const waves=[order.filter(id=>id.startsWith("era-")), order.filter(id=>all[id].type==="release"), order.filter(id=>all[id].type==="group")];
    waves.forEach((ids,i)=>setTimeout(()=>{ ids.forEach(id=>expanded.add(id)); render(); },i*900));
    const fit=()=>{ const ns=sim.nodes(); const xs=ns.map(n=>n.x), ys=ns.map(n=>n.y);
      const x0=Math.min(...xs)-40,x1=Math.max(...xs)+40,y0=Math.min(...ys)-40,y1=Math.max(...ys)+40;
      const sc=Math.min(W()/(x1-x0),(H()-160)/(y1-y0),1);
      svg.transition().duration(1400).call(zoom.transform,d3.zoomIdentity.translate(W()/2,H()/2+30).scale(sc).translate(-(x0+x1)/2,-(y0+y1)/2)); };
    setTimeout(fit,2600); setTimeout(fit,5200);
  };
  document.getElementById("closeAll").onclick=()=>{ expanded.clear(); select(null); render(); svg.transition().duration(700).call(zoom.transform,d3.zoomIdentity.translate(W()/2,H()/2+30).scale(.75)); };

  // ---------- search ----------
  const list=Object.values(all).filter(n=>!["era","group"].includes(n.type));
  document.getElementById("search").addEventListener("keydown",e=>{
    if(e.key!=="Enter") return; const q=e.target.value.trim().toLowerCase(); if(q.length<2) return;
    const hit=list.find(n=>n.name.toLowerCase().startsWith(q))||list.find(n=>n.name.toLowerCase().includes(q));
    if(hit) goTo(hit.id);
  });

  render();
  const start=decodeURIComponent(location.hash.slice(1));
  if(start && all[start]) setTimeout(()=>goTo(start),800);
}
