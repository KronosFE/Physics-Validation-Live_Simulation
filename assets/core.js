/* Kronos Live Physics — shared runtime: Pyodide boot + verification + SVG charts + nav
   2026 rebuild: breeder (HYPERION) + burner (Kronos generator). No economics. */
window.KL=(function(){
"use strict";
const C={gold:'#e8c476',blue:'#7fb2e5',teal:'#6ec9b2',coral:'#e28f6b',mut:'#93a4bd',dim:'#5e7292',line:'#1d3050',ink:'#edf1f8'};
const DOI_BREEDER='10.5281/zenodo.21746157';
const DOI_BURNER='10.5281/zenodo.21746479';
const $=id=>document.getElementById(id);
const fmt=(v,d)=>Number(v).toLocaleString('en-US',{maximumFractionDigits:d===undefined?2:d});

/* nav highlight */
document.addEventListener('DOMContentLoaded',()=>{
  /* favicon (injected so all pages share it without per-file <head> edits) */
  if(!document.querySelector('link[rel="icon"]')){
    const l=document.createElement('link');l.rel='icon';l.type='image/png';l.href='assets/img/favicon.png';document.head.appendChild(l);
    const a=document.createElement('link');a.rel='apple-touch-icon';a.href='assets/img/favicon_180.png';document.head.appendChild(a);
  }
  /* unified footer with company links + citation (replaces per-page footers) */
  const foot=document.querySelector('.foot');
  if(foot){
    foot.classList.add('foot2');
    foot.innerHTML=
      '<div class="footinner">'+
        '<div class="fbrand"><img class="femblem" src="assets/img/kfe_emblem.png" alt=""><span><b>KRONOS</b> FUSION ENERGY · Live Physics</span></div>'+
        '<div class="flinks">'+
          '<a href="https://www.kronosfusionenergy.com/">Main site</a>'+
          '<a href="https://www.kronosfusionenergy.com/publications">Publications</a>'+
          '<a href="https://www.kronosfusionenergy.com/whitepapers">Whitepapers</a>'+
          '<a href="deposit.html">The deposits</a>'+
        '</div>'+
        '<div class="fcite">Cite — breeder <b>10.5281/zenodo.21746157</b> · burner <b>10.5281/zenodo.21746479</b> · CC BY 4.0</div>'+
        '<div class="fdis">Conceptual design and simulation study; no machine has been built. Every number re-derives from the open deposits; this page runs entirely in your browser and nothing is sent to any server.</div>'+
      '</div>';
  }
  const here=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.navlinks a').forEach(a=>{
    if((a.getAttribute('href')||'').split('/').pop()===here)a.classList.add('on');});
  /* browsers restore form state across reloads — always start at declared defaults */
  document.querySelectorAll('input[type=range]').forEach(s=>{s.value=s.defaultValue;fillRange(s);
    s.addEventListener('input',()=>fillRange(s));});
});
function fillRange(s){const p=(s.value-s.min)/(s.max-s.min)*100;s.style.setProperty('--fill',p+'%');}

/* ---------- engine boot ---------- */
let _py=null;
async function loadEngine(){
  if(_py)return _py;
  const mod=await import('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs');
  const py=await mod.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'});
  await py.loadPackage('numpy');
  /* ship the ACTUAL deposit modules into the runtime and import them */
  for(const f of ['kronos_clean.py','dt_evaluator.py']){
    const t=await (await fetch('assets/engine/'+f,{cache:'no-cache'})).text();
    py.FS.writeFile(f,t);
  }
  py.runPython("import sys\nif '.' not in sys.path: sys.path.insert(0,'.')");
  const src=await (await fetch('assets/kronos_engine.py',{cache:'no-cache'})).text();
  py.runPython(src);
  _py=py;return py;
}

/* compact engine bar for sim pages; returns py when verified */
async function bootCompact(barId){
  const bar=$(barId), msg=bar.querySelector('.msg');
  try{
    msg.textContent='loading WebAssembly Python runtime …';
    const py=await loadEngine();
    msg.textContent='re-deriving the frozen design points …';
    const checks=JSON.parse(py.runPython('self_check()'));
    const allok=checks.every(c=>c[3]);
    if(allok){
      bar.classList.add('ok');
      msg.innerHTML='<span class="ok-t">engine verified against the deposits</span> — '+
        'HYPERION <span class="v">Q 3.424</span> · <span class="v">88.7 MW</span> · <span class="v">9.86 MA</span> '+
        're-derived · generator <span class="v">Q_E 1.31</span> · <span class="v">f_n 5.44%</span> · '+
        '<a href="deposit.html">about the deposits →</a>';
    }else{
      bar.classList.add('err');
      msg.textContent='verification deviation — results shown, treat with care.';
    }
    document.querySelectorAll('.panel.locked').forEach(p=>p.classList.remove('locked'));
    return py;
  }catch(e){
    bar.classList.add('err');
    msg.innerHTML='could not load the runtime (offline?). The equations live at '+
      '<a href="https://doi.org/'+DOI_BREEDER+'">doi.org/'+DOI_BREEDER+'</a> (breeder) and '+
      '<a href="https://doi.org/'+DOI_BURNER+'">'+DOI_BURNER+'</a> (generator) — reload to retry.';
    throw e;
  }
}

/* full terminal boot for the landing page */
async function bootFull(bootId){
  const boot=$(bootId);
  const line=html=>{const d=document.createElement('div');d.className='ln';d.innerHTML=html;
    boot.insertBefore(d,boot.lastElementChild);
    requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('show')));return d;};
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  line('&#9656; loading WebAssembly Python runtime &hellip;');
  let py;
  try{py=await loadEngine();}
  catch(e){line('<span class="fail">&#10007; could not load the runtime (offline?). Reload to retry &mdash; or fetch the equations at doi.org/'+DOI_BREEDER+'.</span>');throw e;}
  line('<span class="ok">&#10003;</span> Python '+py.runPython('import sys;sys.version.split()[0]')+' (WASM) ready &mdash; running entirely in this tab');
  line('&#9656; loading the deposited engines &mdash; breeder (D&ndash;T power balance) &middot; generator (D&ndash;&sup3;He tandem mirror + direct conversion) &hellip;');
  await pause(140);
  line('<span class="ok">&#10003;</span> kronos_engine loaded &mdash; equations verbatim from DOI '+DOI_BREEDER+' &amp; '+DOI_BURNER);
  line('&#9656; re-deriving the frozen design points before unlocking anything &hellip;');
  await pause(160);
  const checks=JSON.parse(py.runPython('self_check()'));
  let allok=true;
  for(const [name,got,want,ok] of checks){
    allok=allok&&ok;
    line('&nbsp;&nbsp;&nbsp;'+(ok?'<span class="ok">&#10003;</span>':'<span class="fail">&#10007;</span>')+' '+name+
      ' &rarr; <span class="val">'+fmt(got)+'</span> <span style="color:#5e7292">(card: '+want+')</span>');
    await pause(120);
  }
  line(allok?'<span class="ok">&#9656; engines verified against the deposited design cards &mdash; explore below.</span>'
            :'<span class="fail">&#9656; verification deviation &mdash; treat results with care.</span>');
  boot.lastElementChild.remove();
  document.querySelectorAll('.panel.locked').forEach(p=>p.classList.remove('locked'));
  return py;
}

/* ---------- SVG chart ---------- */
function chart(el,o){
  const W=o.w||660,H=o.h||300,M={t:16,r:o.mr||120,b:40,l:60};
  const iw=W-M.l-M.r, ih=H-M.t-M.b;
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  el.appendChild(svg);
  const tip=document.createElement('div');tip.className='tip';el.appendChild(tip);
  const xs=v=>M.l+(o.xlog?(Math.log10(v)-Math.log10(o.x0))/(Math.log10(o.x1)-Math.log10(o.x0)):(v-o.x0)/(o.x1-o.x0))*iw;
  const ys=v=>M.t+ih-(o.ylog?(Math.log10(v)-Math.log10(o.y0))/(Math.log10(o.y1)-Math.log10(o.y0)):(v-o.y0)/(o.y1-o.y0))*ih;
  function mk(n,at,parent){const e=document.createElementNS(NS,n);for(const k in at)e.setAttribute(k,at[k]);(parent||svg).appendChild(e);return e;}
  (o.bands||[]).forEach(b=>{
    mk('rect',{x:M.l,y:ys(b.y1),width:iw,height:ys(b.y0)-ys(b.y1),fill:b.fill||'rgba(232,196,118,.07)',rx:3});
    if(b.label)mk('text',{x:M.l+8,y:ys(b.y1)+15,fill:C.dim,'font-size':10.5}).textContent=b.label;});
  (o.yticks||[]).forEach(t=>{const y=ys(t);
    mk('line',{x1:M.l,x2:M.l+iw,y1:y,y2:y,stroke:C.line,'stroke-width':1});
    mk('text',{x:M.l-8,y:y+4,fill:C.dim,'font-size':11,'text-anchor':'end'}).textContent=o.yfmt?o.yfmt(t):t;});
  (o.xticks||[]).forEach(t=>{const x=xs(t);
    mk('line',{x1:x,x2:x,y1:M.t,y2:M.t+ih,stroke:C.line,'stroke-width':1});
    mk('text',{x:x,y:M.t+ih+19,fill:C.dim,'font-size':11,'text-anchor':'middle'}).textContent=o.xfmt?o.xfmt(t):t;});
  mk('text',{x:M.l+iw/2,y:H-5,fill:C.mut,'font-size':11.5,'text-anchor':'middle'}).textContent=o.xlabel||'';
  mk('text',{x:15,y:M.t+ih/2,fill:C.mut,'font-size':11.5,'text-anchor':'middle',transform:'rotate(-90 15 '+(M.t+ih/2)+')'}).textContent=o.ylabel||'';
  const gS=mk('g',{}),gM=mk('g',{}),gH=mk('g',{});
  const cross=mk('line',{y1:M.t,y2:M.t+ih,stroke:C.dim,'stroke-width':1,'stroke-dasharray':'3,3',opacity:0},gH);
  let data=[];
  function update(series,markers){
    data=series;gS.innerHTML='';gM.innerHTML='';
    series.forEach(s=>{
      const pts=s.pts.filter(p=>p[1]>((o.ylog?o.y0:-1e30)));
      const d=pts.map((p,i)=>(i?'L':'M')+xs(p[0]).toFixed(1)+' '+ys(Math.min(p[1],o.y1)).toFixed(1)).join(' ');
      mk('path',{d:d,fill:'none',stroke:s.color,'stroke-width':2.2,'stroke-linejoin':'round','stroke-linecap':'round'},gS);
      if(s.label){const last=pts[pts.length-1];
        mk('text',{x:xs(last[0])+7,y:ys(Math.min(last[1],o.y1))+4,fill:s.color,'font-size':11.5,'font-weight':600},gS).textContent=s.label;}
    });
    (markers||[]).forEach(m=>{
      mk('circle',{cx:xs(m.x),cy:ys(m.y),r:6,fill:m.color||C.gold,stroke:'#0a1322','stroke-width':2.5},gM);
      if(m.label)mk('text',{x:xs(m.x)+10,y:ys(m.y)-10,fill:m.color||C.gold,'font-size':11,'font-weight':600},gM).textContent=m.label;});
  }
  svg.addEventListener('mousemove',ev=>{
    if(!data.length)return;
    const r=svg.getBoundingClientRect(),px=(ev.clientX-r.left)*(W/r.width);
    if(px<M.l||px>M.l+iw){tip.style.opacity=0;cross.setAttribute('opacity',0);return;}
    const xv=o.xlog?Math.pow(10,Math.log10(o.x0)+(px-M.l)/iw*(Math.log10(o.x1)-Math.log10(o.x0))):o.x0+(px-M.l)/iw*(o.x1-o.x0);
    cross.setAttribute('x1',px);cross.setAttribute('x2',px);cross.setAttribute('opacity',.7);
    let html='<span style="color:'+C.mut+'">'+(o.xlabel||'x')+': <b>'+(o.xtipfmt?o.xtipfmt(xv):xv.toFixed(1))+'</b></span>';
    data.forEach(s=>{
      let best=s.pts[0];for(const p of s.pts)if(Math.abs(p[0]-xv)<Math.abs(best[0]-xv))best=p;
      html+='<br><span class="sw" style="background:'+s.color+'"></span>'+s.name+': <b>'+(o.ytipfmt?o.ytipfmt(best[1]):best[1].toFixed(1))+'</b>';});
    tip.innerHTML=html;tip.style.opacity=1;
    const er=el.getBoundingClientRect();
    let tx=(ev.clientX-er.left)+14;if(tx>er.width-180)tx-=200;
    tip.style.left=tx+'px';tip.style.top=((ev.clientY-er.top)-10)+'px';
  });
  svg.addEventListener('mouseleave',()=>{tip.style.opacity=0;cross.setAttribute('opacity',0);});
  return {update};
}

/* ---------- popup instructions (help modal + floating button) ---------- */
function help(opts){
  const ov=document.createElement('div');ov.className='kl-overlay';
  ov.innerHTML='<div class="kl-modal" role="dialog" aria-modal="true" aria-label="'+(opts.title||'Instructions')+'">'+
    '<button class="x" aria-label="close">&times;</button>'+
    '<div class="eyebrow">'+(opts.eyebrow||'HOW TO READ THIS')+'</div><h3>'+(opts.title||'')+'</h3>'+
    (opts.html||'')+'</div>';
  document.body.appendChild(ov);
  const btn=document.createElement('button');btn.className='kl-help-btn';btn.setAttribute('aria-label','Instructions');
  btn.innerHTML='?<span class="lbl">'+(opts.btnLabel||'How to read this')+'</span>';
  document.body.appendChild(btn);
  const open=()=>ov.classList.add('on'),close=()=>ov.classList.remove('on');
  btn.addEventListener('click',open);
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.classList.contains('x'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  if(opts.autoOpenOnce){try{if(!localStorage.getItem(opts.autoOpenOnce)){open();localStorage.setItem(opts.autoOpenOnce,'1');}}catch(e){}}
  return {open,close};
}

/* lightbox for the figures gallery */
function lightbox(src,cap){
  let ov=document.getElementById('kl-lb');
  if(!ov){
    ov=document.createElement('div');ov.id='kl-lb';ov.className='kl-overlay';
    ov.innerHTML='<div class="kl-lbox"><button class="x" aria-label="close">&times;</button><img alt=""><div class="lbcap"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',e=>{if(e.target===ov||e.target.classList.contains('x'))ov.classList.remove('on');});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')ov.classList.remove('on');});
  }
  ov.querySelector('img').src=src;ov.querySelector('.lbcap').textContent=cap||'';
  ov.classList.add('on');
}

/* shareable deep-links: encode/decode slider state in the URL hash */
function getHash(){ return new URLSearchParams(location.hash.replace(/^#/,'')); }
function setHash(obj){ const p=new URLSearchParams(); for(const k in obj) p.set(k,obj[k]);
  try{ history.replaceState(null,'','#'+p.toString()); }catch(e){} }
function copyLink(btn){
  const done=(t)=>{const o=btn.textContent;btn.textContent=t;setTimeout(()=>btn.textContent=o,1500);};
  try{ navigator.clipboard.writeText(location.href).then(()=>done('✓ link copied'),()=>done('press ⌘/Ctrl+C')); }
  catch(e){ done('press ⌘/Ctrl+C'); }
}

/* hex color lerp */
function mix(a,b,t){
  t=Math.max(0,Math.min(1,t));
  const h=x=>[parseInt(x.slice(1,3),16),parseInt(x.slice(3,5),16),parseInt(x.slice(5,7),16)];
  const A=h(a),B=h(b);
  const c=A.map((v,i)=>Math.round(v+(B[i]-v)*t));
  return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
}

/* 2-D heatmap over an xs×ys grid. o:{xs,ys,w,h,mr,xlabel,ylabel,xfmt,yfmt,color(v)}.
   returns {draw(v2d, marker, contour)} where v2d[iy][ix], marker{x,y}, contour=level. */
function heatmap(el,o){
  const W=o.w||680,H=o.h||300,M={t:16,r:o.mr||18,b:42,l:64};
  const iw=W-M.l-M.r, ih=H-M.t-M.b, NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 '+W+' '+H);el.appendChild(svg);
  const tip=document.createElement('div');tip.className='tip';el.appendChild(tip);
  function mk(n,at,p){const e=document.createElementNS(NS,n);for(const k in at)e.setAttribute(k,at[k]);(p||svg).appendChild(e);return e;}
  const nx=o.xs.length, ny=o.ys.length, cw=iw/nx, ch=ih/ny;
  const xpix=ix=>M.l+ix*cw, ypix=iy=>M.t+ih-(iy+1)*ch;
  const xval=x=>M.l+((x-o.xs[0])/((o.xs[nx-1]-o.xs[0])||1))*iw;
  const yval=y=>M.t+ih-((y-o.ys[0])/((o.ys[ny-1]-o.ys[0])||1))*ih;
  const gC=mk('g',{}),gK=mk('g',{}),gM=mk('g',{});
  mk('text',{x:M.l+iw/2,y:H-6,fill:C.mut,'font-size':11.5,'text-anchor':'middle'}).textContent=o.xlabel||'';
  mk('text',{x:15,y:M.t+ih/2,fill:C.mut,'font-size':11.5,'text-anchor':'middle',transform:'rotate(-90 15 '+(M.t+ih/2)+')'}).textContent=o.ylabel||'';
  [0,(nx-1)/2|0,nx-1].forEach(ix=>mk('text',{x:xpix(ix)+cw/2,y:M.t+ih+18,fill:C.dim,'font-size':10,'text-anchor':'middle'}).textContent=(o.xfmt?o.xfmt(o.xs[ix]):o.xs[ix]));
  [0,(ny-1)/2|0,ny-1].forEach(iy=>mk('text',{x:M.l-8,y:ypix(iy)+ch/2+3,fill:C.dim,'font-size':10,'text-anchor':'end'}).textContent=(o.yfmt?o.yfmt(o.ys[iy]):o.ys[iy]));
  function draw(v2d,marker){
    gC.innerHTML='';gM.innerHTML='';
    for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
      const val=v2d[iy][ix]; if(val===null||val===undefined)continue;
      mk('rect',{x:xpix(ix).toFixed(2),y:ypix(iy).toFixed(2),width:(cw+0.7).toFixed(2),height:(ch+0.7).toFixed(2),fill:o.color(val)},gC);
    }
    if(marker){const mx=xval(marker.x),my=yval(marker.y);
      mk('circle',{cx:mx,cy:my,r:7,fill:'none',stroke:'#fff','stroke-width':2},gM);
      mk('circle',{cx:mx,cy:my,r:2.5,fill:'#fff'},gM);}
  }
  return {draw};
}

/* live horizontal power-flow bar: segs=[{cls,val,label}] */
function flow(el,segs){
  const tot=segs.reduce((s,x)=>s+Math.max(x.val,0),0)||1;
  el.innerHTML=segs.map(s=>{
    const w=Math.max(0,s.val)/tot*100;
    return '<div class="seg '+s.cls+'" style="width:'+w.toFixed(2)+'%" title="'+s.label+'">'+(w>11?s.label:'')+'</div>';
  }).join('');
}

return {C,DOI_BREEDER,DOI_BURNER,$,fmt,fillRange,loadEngine,bootCompact,bootFull,chart,help,flow,heatmap,mix,getHash,setHash,copyLink,lightbox};
})();
