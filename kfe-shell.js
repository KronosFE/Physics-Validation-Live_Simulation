/* Kronos universal site shell — self-injecting header + footer. One source of truth. v3 (2026-10-18).
   Include on any page:  <link rel="stylesheet" href="kfe-shell.css"><script src="kfe-shell.js" defer></script>
   Idempotent: skips injection if a .kfe-header / .kfe-footer already exists. Root-absolute links. */
(function(){
  setTimeout(function(){if(document.body)document.body.classList.add('kfe-ready');},2500);
  var LOGO='<svg viewBox="0 0 120 120" role="img" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><circle cx="60" cy="60" r="50"/><line x1="60" y1="16" x2="60" y2="104"/><path d="M26,60 C44,42 76,42 94,60"/><path d="M26,60 C44,78 76,78 94,60"/></g><circle cx="60" cy="60" r="7.5" fill="#d4ad5c"/></svg>';
  var CARET='<svg class="kfe-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
  // Matches the live kronosfusionenergy.com header: 6 items + Kronos Model + Log in.
  // Blueprint lives under Technology; Computing/HPC/Science under Proof (keeps the bar clean).
  var NAV=[
    {label:'Technology',items:[['/how-it-works','How it works'],['/hyperion','Breeder — Hyperion'],['/aegis','Burner — Aegis'],['/metrovolt','Burner — MetroVolt'],['/ai','AI-Native Architecture'],['/magnets','Magnets'],['/fuel-cycle','Fuel cycle'],['/safety','Safety'],['/roadmap','Roadmap'],['/blueprints','Engineering Blueprint'],['/BOM','Bill of materials'],['/derisking','De-risking &amp; physics']]},
    {label:'Solutions',items:[['/metrovolt','AI & Data Centers'],['/defense','Defense & Government'],['/metrovolt','Grid & Baseload'],['/defense','Neutron Detection'],['/ai','Quantum']]},
    {link:['/learn/','Learn']},
    {link:['/technical/','Technical Library']},
    {link:['/kodex','Kodex']},
    {label:'Proof',items:[['/publications','Publications'],['/whitepapers','Whitepapers'],['/technical/','Technical Library'],['/mission','Open Science & Reproducibility'],['/science','Science & Evidence'],['/computing','Computing & De-risking'],['/computing/hpc','High-Performance Computing']]},
    {label:'Company',items:[['/mission','About / Mission'],['/leadership','Leadership'],['/ehs','Environment, Health & Safety'],['/investors','Investors'],['/careers','Careers'],['/press','Press'],['/faq','FAQ'],['/contact','Contact']]}
  ];
  function esc(s){return (''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function navHtml(){
    return NAV.map(function(n){
      if(n.link)return '<li><a class="kfe-nav-link" href="'+n.link[0]+'">'+esc(n.link[1])+'</a></li>';
      return '<li data-kfe-menu><button class="kfe-nav-trigger" aria-expanded="false">'+esc(n.label)+CARET+'</button>'+
        '<div class="kfe-dropdown">'+n.items.map(function(i){return '<a href="'+i[0]+'">'+esc(i[1])+'</a>';}).join('')+'</div></li>';
    }).join('');
  }
  function mobileHtml(){
    return NAV.map(function(n){
      if(n.link)return '<a href="'+n.link[0]+'">'+esc(n.link[1])+'</a>';
      return '<div class="kfe-mgroup"><b>'+esc(n.label)+'</b>'+n.items.map(function(i){return '<a href="'+i[0]+'">'+esc(i[1])+'</a>';}).join('')+'</div>';
    }).join('')+'<a class="kfe-m-login" href="/login">Log in</a><a class="kfe-m-login" href="/3D_Model">Kronos Model</a>';
  }
  function header(){
    return '<header class="kfe-header"><div class="kfe-header-inner">'+
      '<a class="kfe-brand" href="/" aria-label="Kronos Fusion Energy — home">'+LOGO+
      '<span class="kfe-brand-text"><b>Kronos</b><span>Fusion Energy</span></span></a>'+
      '<nav aria-label="Primary"><ul class="kfe-nav">'+navHtml()+'</ul></nav>'+
      '<div class="kfe-actions">'+
        '<a class="kfe-cta" href="/3D_Model">Kronos Model</a>'+
        '<a class="kfe-login" href="/login">Log in</a>'+
      '</div>'+
      '<button class="kfe-burger" aria-label="Open menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>'+
      '</div><div class="kfe-mobile">'+mobileHtml()+'</div></header>';
  }
  function footer(){
    var col=function(h,items){return '<div class="kfe-col"><h3>'+h+'</h3>'+items.map(function(i){return '<a href="'+i[0]+'">'+esc(i[1])+'</a>';}).join('')+'</div>';};
    return '<footer class="kfe-footer"><div class="kfe-footer-inner">'+
      '<div class="kfe-footer-brand"><a class="kfe-brand" href="/">'+LOGO+'<span class="kfe-brand-text"><b>Kronos</b><span>Fusion Energy</span></span></a>'+
      '<p class="kfe-footer-tag">A fusion energy company. Isotopes first, electricity next — building toward first construction in 2027.</p></div>'+
      '<div class="kfe-cols">'+
        col('Technology',[['/hyperion','Breeder — Hyperion'],['/aegis','Burner — Aegis'],['/metrovolt','Burner — MetroVolt'],['/how-it-works','How it works'],['/roadmap','Roadmap']])+
        col('Blueprint & Computing',[['/blueprints','Blueprint overview'],['/BOM','Bill of materials'],['/derisking','De-risking & physics'],['/blueprints/','Engineering portal 🔒'],['/computing','Computing & de-risking'],['/science','Science & evidence']])+
        col('Proof',[['/publications','Publications'],['/whitepapers','Whitepapers'],['/technical/','Technical Library'],['/mission','Open science']])+
        col('Company',[['/mission','About / Mission'],['/leadership','Leadership'],['/investors','Investors'],['/careers','Careers'],['/press','Press'],['/faq','FAQ'],['/contact','Contact']])+
      '</div></div>'+
      '<div class="kfe-footer-legal"><span>© 2026 Kronos Fusion Energy — a fusion energy company.<button class="kfe-cite" type="button" title="Copy a citation for this page">Cite this page</button></span>'+
        '<span class="kfe-legal-links"><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/legal-notices">Legal notices</a><a href="/legal/accessibility">Accessibility</a></span></div>'+
      '</footer>';
  }
  function wire(root){
    // dropdown toggles (click)
    root.querySelectorAll('[data-kfe-menu] > .kfe-nav-trigger').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var li=btn.parentNode, open=li.classList.contains('kfe-open');
        root.querySelectorAll('[data-kfe-menu].kfe-open').forEach(function(o){o.classList.remove('kfe-open');o.querySelector('.kfe-nav-trigger').setAttribute('aria-expanded','false');});
        if(!open){li.classList.add('kfe-open');btn.setAttribute('aria-expanded','true');}
      });
    });
    document.addEventListener('click',function(){root.querySelectorAll('[data-kfe-menu].kfe-open').forEach(function(o){o.classList.remove('kfe-open');});});
    // burger
    var burger=root.querySelector('.kfe-burger'), mob=root.querySelector('.kfe-mobile');
    if(burger&&mob)burger.addEventListener('click',function(e){e.stopPropagation();var on=mob.classList.toggle('kfe-open');burger.setAttribute('aria-expanded',on?'true':'false');});
    // active state by path
    var path=location.pathname.replace(/\/index\.html$/,'/');
    root.querySelectorAll('.kfe-nav a, .kfe-nav-link').forEach(function(a){
      var href=a.getAttribute('href')||''; if(href!=='/'&&path.indexOf(href.split('#')[0])===0){var link=a.closest('li')?a.closest('li').querySelector('.kfe-nav-link,.kfe-nav-trigger'):a; if(link)link.classList.add('kfe-active');}
    });
  }
  // secondary (section/app) header — page sets window.KFE_SUBNAV = {title, items:[{label, tab} | {label, href}]}
  function subnav(){
    var s=window.KFE_SUBNAV; if(!s) return '';
    var tabs=s.items.map(function(i){
      if(i.href) return '<a class="kfe-subtab" href="'+i.href+'">'+esc(i.label)+'</a>';
      return '<button class="kfe-subtab" data-tab="'+esc(i.tab)+'"'+(i.tab===(s.active||s.items[0].tab)?' aria-current="true"':'')+'>'+esc(i.label)+'</button>';
    }).join('');
    return '<div class="kfe-subnav"><div class="kfe-subnav-inner">'+
      (s.title?'<span class="kfe-subnav-title">'+esc(s.title)+'</span>':'')+
      '<nav class="kfe-subtabs" aria-label="Section">'+tabs+'</nav></div></div>';
  }
  function wireSub(){
    var btns=document.querySelectorAll('.kfe-subtab[data-tab]');
    btns.forEach(function(b){b.addEventListener('click',function(){
      btns.forEach(function(x){x.removeAttribute('aria-current');});
      b.setAttribute('aria-current','true');
      document.dispatchEvent(new CustomEvent('kfe:subtab',{detail:b.getAttribute('data-tab')}));
    });});
  }
  // per-section footer strips — auto-detected from the URL's first path segment (or window.KFE_SECTION / ?section=)
  var SECTIONS={
    hyperion:{name:'Hyperion — Breeder',links:[['/hyperion','Overview'],['/how-it-works','How it works'],['/fuel-cycle','Fuel cycle'],['/magnets','Magnets']],faq:'/faq/breeder'},
    aegis:{name:'Aegis — Burner',links:[['/aegis','Overview'],['/defense','Defense & Government'],['/how-it-works','How it works']],faq:'/faq/aegis'},
    metrovolt:{name:'MetroVolt — Burner',links:[['/metrovolt','Overview'],['/how-it-works','How it works']],faq:'/faq/metrovolt'},
    defense:{name:'Defense & Government',links:[['/defense','Overview'],['/aegis','Aegis burner']],faq:'/faq/defense'},
    ai:{name:'AI-Native Architecture',links:[['/ai','Overview'],['/computing','Computing']],faq:'/faq/ai'},
    computing:{name:'Computing & De-risking',links:[['/computing','Overview'],['/science','Science & Evidence']],faq:'/faq/computing'},
    learn:{name:'Learn',links:[['/learn/','Knowledge base'],['/technical/','Technical Library']],faq:'/faq/general'},
    technical:{name:'Technical Library',links:[['/technical/','Library'],['/publications','Publications'],['/whitepapers','Whitepapers']],faq:'/faq/technical'},
    publications:{name:'Publications',links:[['/publications','Publications'],['/technical/','Technical Library']],faq:'/faq/publications'},
    whitepapers:{name:'Whitepapers',links:[['/whitepapers','Whitepapers'],['/publications','Publications']],faq:'/faq/publications'},
    mission:{name:'Mission',links:[['/mission','About'],['/leadership','Leadership']],faq:'/faq/about'},
    investors:{name:'Investors',links:[['/investors','Overview'],['/mission','Mission']],faq:'/faq/investors'},
    careers:{name:'Careers',links:[['/careers','Openings'],['/mission','Mission']],faq:'/faq/careers'},
    ehs:{name:'Environment, Health & Safety',links:[['/ehs','Overview']],faq:'/faq/environment'},
    leadership:{name:'Leadership',links:[['/leadership','Team'],['/mission','Mission']],faq:'/faq/about'},
    press:{name:'Press',links:[['/press','Press'],['/mission','Mission']],faq:'/faq/about'},
    blueprint:{name:'Engineering Blueprint',links:[['/blueprints','Overview'],['/BOM','Bill of materials'],['/derisking','De-risking'],['/blueprints/','Team portal 🔒']],faq:'/faq/blueprints'},
    bom:{name:'Bill of materials',links:[['/BOM','Overview'],['/blueprints','Blueprint'],['/derisking','De-risking']],faq:'/faq/blueprints'},
    derisking:{name:'De-risking & physics',links:[['/derisking','Overview'],['/blueprints','Blueprint'],['/BOM','Bill of materials'],['/science','Science']],faq:'/faq/science'},
    faq:{name:'FAQ',links:[['/faq','All questions'],['/mission','About']],faq:'/faq'}
  };
  function currentSection(){
    var q=(location.search.match(/[?&]section=([^&]+)/)||[])[1];
    var seg=(location.pathname.replace(/^\//,'').split('/')[0]||'').toLowerCase();
    return SECTIONS[(q||window.KFE_SECTION||seg||'').toLowerCase()]||null;
  }
  function secfoot(){
    var s=currentSection(); if(!s) return '';
    var links=s.links.map(function(l){return '<a href="'+l[0]+'">'+esc(l[1])+'</a>';}).join('');
    return '<div class="kfe-secfoot"><div class="kfe-secfoot-inner"><b>'+esc(s.name)+'</b>'+links+
      (s.faq&&s.faq!=='/faq'?'<a class="kfe-secfaq" href="'+s.faq+'">'+esc(s.name.split(/ [—·]/)[0])+' FAQ ↗</a>':'')+
      '</div></div>';
  }

  // ---- v3 modules (2026-10-18): verify-this-number cards · figure lightbox · related pages · breadcrumbs JSON-LD ----
  var VN=[
    {rx:/\b3\.076\b/g,label:'Breeder design gain Q = 3.076',cond:'HYPERION at the ratified 2026-08-27 design point (A = 2.5, R₀ = 1.2 m, δ = −0.30). Fusion gain only — the breeder has no net-electricity milestone.',id:'BR-L1-A1'},
    {rx:/\b85\.04\b/g,label:'Breeder fusion power 85.04 MW',cond:'0-D power balance at the frozen point; sets the blanket yield of ~2.0 kg tritium per year per unit.',id:'BR-L1-A1'},
    {rx:/\b9\.66\s?MA\b/g,label:'Breeder plasma current 9.66 MA',cond:'Frozen point: 8.16 MA driven with bootstrap fraction 0.155.',id:'BR-L1-A1'},
    {rx:/\b5\.44\s?%/g,label:'Burner neutron fraction fₙ ≈ 5.44 %',cond:'D–³He at the Mode-M design point (x = 0.30); 7.70 % at the 80:20 operating baseline. Both are published envelope points.',id:'burner register'},
    {rx:/\b1\.318\b/g,label:'Burner engineering gain Q_E = 1.318',cond:'Tandem-mirror burner with direct energy conversion at the frozen point.',id:'burner register'},
    {rx:/\b99\.98\s?%/g,label:'Alpha confinement 99.98 %',cond:'ASCOT5 orbit-following at the frozen breeder point.',id:'validator'},
    {rx:/\b26\.49\s?T\b/g,label:'Peak mirror-throat field 26.49 T',cond:'REBCO high-field basis for the burner throats (17 T WHAM-demonstrated class).',id:'magnet register'}
  ];
  var VN_DOI='https://doi.org/10.5281/zenodo.22645689';
  function verifyNumbers(){
    if(document.querySelector('.kfe-vn'))return;
    var roots=document.querySelectorAll('main, article, .wrap, .kr-authored, section'); if(!roots.length)roots=[document.body];
    var seen=[], count=0, walker, n;
    var skip=/^(A|CODE|PRE|SCRIPT|STYLE|BUTTON|H1|TEXTAREA|INPUT|SVG|svg|NOSCRIPT)$/;
    function inSkip(el){while(el&&el!==document.body){if(skip.test(el.nodeName)||(el.classList&&(el.classList.contains('kfe-vn')||el.classList.contains('kfe-header')||el.classList.contains('kfe-footer'))))return true;el=el.parentNode;}return false;}
    [].forEach.call(roots,function(root){
      if(seen.some(function(r){return r.contains(root);}))return; seen.push(root);
      walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null); var nodes=[];
      while((n=walker.nextNode())){ if(count>60)break; if(!n.nodeValue||n.nodeValue.length<4||inSkip(n.parentNode))continue; nodes.push(n); }
      nodes.forEach(function(t){
        var txt=t.nodeValue, hit=-1;
        for(var i=0;i<VN.length;i++){VN[i].rx.lastIndex=0;if(VN[i].rx.test(txt)){hit=i;break;}}
        if(hit<0||count>60)return;
        var v=VN[hit]; v.rx.lastIndex=0; var m=v.rx.exec(txt); if(!m)return;
        var span=document.createElement('span'); span.className='kfe-vn'; span.tabIndex=0; span.setAttribute('data-vn',hit); span.setAttribute('aria-label','Verify: '+v.label);
        span.textContent=m[0]; var sup=document.createElement('sup'); sup.textContent='✓'; span.appendChild(sup);
        var after=document.createTextNode(txt.slice(m.index+m[0].length)); t.nodeValue=txt.slice(0,m.index);
        t.parentNode.insertBefore(span,t.nextSibling); t.parentNode.insertBefore(after,span.nextSibling); count++;
      });
    });
    if(!count)return;
    var pop=document.createElement('div'); pop.className='kfe-vnpop'; pop.hidden=true; pop.setAttribute('role','tooltip'); document.body.appendChild(pop);
    function show(span){var v=VN[+span.getAttribute('data-vn')];
      pop.innerHTML='<b>Verify this number</b><strong>'+esc(v.label)+'</strong><p>'+esc(v.cond)+'</p><span class="kfe-vnlinks"><a href="/derisking">De-risking center</a><a href="'+VN_DOI+'" target="_blank" rel="noopener">Register 1.0 DOI ↗</a><a href="/open-science">The open record</a></span>';
      pop.hidden=false; var r=span.getBoundingClientRect(), w=pop.offsetWidth, x=Math.max(8,Math.min(window.innerWidth-w-8,r.left)), y=r.bottom+window.scrollY+8;
      pop.style.left=x+'px'; pop.style.top=y+'px';}
    function hide(){pop.hidden=true;}
    var hideT;
    document.addEventListener('mouseover',function(e){var s=e.target.closest&&e.target.closest('.kfe-vn');if(s){clearTimeout(hideT);show(s);}});
    document.addEventListener('mouseout',function(e){var s=e.target.closest&&e.target.closest('.kfe-vn');if(s){hideT=setTimeout(hide,250);}});
    pop.addEventListener('mouseenter',function(){clearTimeout(hideT);}); pop.addEventListener('mouseleave',function(){hideT=setTimeout(hide,250);});
    document.addEventListener('focusin',function(e){var s=e.target.closest&&e.target.closest('.kfe-vn');if(s)show(s);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')hide();});
  }
  function lightbox(){
    var imgs=document.querySelectorAll('figure img, .kfe-ctx-fig img, .kfe-embed img');
    [].forEach.call(imgs,function(img){ if(img.closest('a')||img.closest('.kfe-header')||img.naturalWidth&&img.naturalWidth<160)return; img.classList.add('kfe-zoomable');
      img.addEventListener('click',function(){
        var fig=img.closest('figure'), cap=fig&&fig.querySelector('figcaption')?fig.querySelector('figcaption').textContent:(img.getAttribute('alt')||'');
        var box=document.createElement('div'); box.className='kfe-lightbox'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Figure');
        box.innerHTML='<img src="'+img.currentSrc||img.src+'" alt="'+esc(img.getAttribute('alt')||'')+'"><figcaption>'+esc(cap)+'</figcaption>';
        box.querySelector('img').src=img.currentSrc||img.src;
        function close(){box.remove();document.removeEventListener('keydown',onk);}
        function onk(e){if(e.key==='Escape')close();}
        box.addEventListener('click',close); document.addEventListener('keydown',onk); document.body.appendChild(box);
      });
    });
  }
  function relatedPages(){
    var seg=(location.pathname.replace(/^\//,'').split('/')[0]||'').toLowerCase(); var sec=SECTIONS[seg]; if(!sec||!window.fetch)return;
    var stop={the:1,and:1,for:1,with:1,from:1,that:1,this:1,kronos:1,fusion:1,energy:1,into:1,what:1,when:1,how:1,why:1,are:1,its:1,our:1,your:1,page:1,library:1,technical:1,learn:1};
    function toks(s){return (s||'').toLowerCase().replace(/[^a-z0-9À-ɏ\s-]/g,' ').split(/[\s-]+/).filter(function(w){return w.length>3&&!stop[w];});}
    var here=location.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'');
    var h1=document.querySelector('h1'), md=document.querySelector('meta[name="description"]');
    var mine={}; toks(document.title+' '+(h1?h1.textContent:'')+' '+(md?md.content:'')).forEach(function(w){mine[w]=1;});
    var keys=Object.keys(mine); if(keys.length<2)return;
    fetch('/'+seg+'/search-index.json',{credentials:'omit'}).then(function(r){return r.ok?r.json():null;}).then(function(list){
      if(!list||!list.length)return;
      var scored=list.map(function(e){var u=(e.u||e.url||'');var path=u.replace(/^https?:\/\/[^/]+/,'').replace(/\.html$/,'');if(!u||path===here)return null;
        var s=0; toks((e.t||e.title||'')+' '+(e.d||e.description||'')).forEach(function(w){if(mine[w])s+=1;}); return s>1?{s:s,t:e.t||e.title,u:u}:null;}).filter(Boolean)
        .sort(function(a,b){return b.s-a.s;}).slice(0,5);
      if(scored.length<3)return;
      var el=document.createElement('section'); el.className='kfe-related'; el.setAttribute('aria-label','Related pages');
      el.innerHTML='<div class="kfe-related-inner"><b>Related in '+esc(sec.name)+'</b>'+scored.map(function(e){return '<a href="'+esc(e.u)+'">'+esc(e.t)+'</a>';}).join('')+'</div>';
      var anchor=document.querySelector('.kfe-secfoot')||document.querySelector('.kfe-footer'); if(anchor)anchor.parentNode.insertBefore(el,anchor);
    }).catch(function(){});
  }
  function breadcrumbsLd(){
    if(document.getElementById('kfe-ld'))return;
    var existing=[].map.call(document.querySelectorAll('script[type="application/ld+json"]'),function(s){return s.textContent;}).join(' ');
    if(existing.indexOf('BreadcrumbList')>=0)return;
    var BASE='https://www.kronosfusionenergy.com', seg=(location.pathname.replace(/^\//,'').split('/')[0]||'').toLowerCase(); if(!seg)return;
    var sec=SECTIONS[seg], name=sec?sec.name:seg.replace(/[-_]/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
    var title=(document.title||'').replace(/\s*[·—|\-]\s*Kronos Fusion Energy.*$/,'').trim();
    var path=location.pathname.replace(/\/index\.html$/,'/'); var items=[{"@type":"ListItem","position":1,"name":"Home","item":BASE+"/"},{"@type":"ListItem","position":2,"name":name,"item":BASE+"/"+seg+"/"}];
    if(path!=='/'+seg+'/'&&path!=='/'+seg)items.push({"@type":"ListItem","position":3,"name":title||path,"item":BASE+path});
    var ld={"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","itemListElement":items},{"@type":"WebPage","@id":BASE+path,"url":BASE+path,"name":title,"isPartOf":{"@type":"WebSite","name":"Kronos Fusion Energy","url":BASE+"/"},"publisher":{"@type":"Organization","name":"Kronos Fusion Energy","url":BASE+"/"}}]};
    var s=document.createElement('script'); s.type='application/ld+json'; s.id='kfe-ld'; s.textContent=JSON.stringify(ld); document.head.appendChild(s);
  }
  function inject(){
    // unify: replace ANY existing site header/subnav/footer with the shell's; leave page heros (header.hero).
    ['.kfe-header','.kfe-subnav','header.top','.kfe-secfoot'].forEach(function(s){
      [].slice.call(document.querySelectorAll(s)).forEach(function(el){el.remove();});
    });
    [].slice.call(document.querySelectorAll('body > footer, .kfe-footer')).forEach(function(el){el.remove();});
    [].slice.call(document.querySelectorAll('nav.sitebar, header.nav')).forEach(function(el){ if(el.querySelector('a[href="/"], a[href^="https://kronosfusionenergy.com"], a[href^="https://www.kronosfusionenergy.com"]'))el.remove(); });
    document.body.insertAdjacentHTML('afterbegin', header());
    var sub=subnav(); if(sub) document.querySelector('.kfe-header').insertAdjacentHTML('afterend', sub);
    document.body.insertAdjacentHTML('beforeend', secfoot()+footer());
    wire(document); wireSub();
    // "Cite this page" — copies a plain citation (title · site · URL · access date)
    var cb=document.querySelector('.kfe-cite');
    if(cb)cb.addEventListener('click',function(){
      var t=(document.title||'').replace(/\s*[·—|\-]\s*Kronos Fusion Energy.*$/,'').trim()||'Kronos Fusion Energy';
      var d=new Date(), c='Kronos Fusion Energy ('+d.getFullYear()+'). "'+t+'". '+location.href.split('#')[0]+' (accessed '+d.toISOString().slice(0,10)+').';
      function done(){cb.textContent='Citation copied \u2713';setTimeout(function(){cb.textContent='Cite this page';},2200);}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(c).then(done,function(){window.prompt('Copy this citation:',c);});}
      else{window.prompt('Copy this citation:',c);}
    });
    document.body.classList.add('kfe-ready');   // releases the zero-CLS placeholder (see kfe-shell.css)
    try{breadcrumbsLd();}catch(e){} try{verifyNumbers();}catch(e){} try{lightbox();}catch(e){} try{relatedPages();}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject); else inject();
})();
