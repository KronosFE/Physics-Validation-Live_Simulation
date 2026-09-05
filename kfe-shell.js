/* Kronos universal site shell — self-injecting header + footer. One source of truth.
   Include on any page:  <link rel="stylesheet" href="kfe-shell.css"><script src="kfe-shell.js" defer></script>
   Idempotent: skips injection if a .kfe-header / .kfe-footer already exists. Root-absolute links. */
(function(){
  var LOGO='<svg viewBox="0 0 120 120" role="img" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><circle cx="60" cy="60" r="50"/><line x1="60" y1="16" x2="60" y2="104"/><path d="M26,60 C44,42 76,42 94,60"/><path d="M26,60 C44,78 76,78 94,60"/></g><circle cx="60" cy="60" r="7.5" fill="#d4ad5c"/></svg>';
  var CARET='<svg class="kfe-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
  // Matches the live kronosfusionenergy.com header: 6 items + Kronos Model + Log in.
  // Blueprint lives under Technology; Computing/HPC/Science under Proof (keeps the bar clean).
  var NAV=[
    {label:'Technology',items:[['/how-it-works','How it works'],['/hyperion','Breeder — Hyperion'],['/aegis','Burner — Aegis'],['/metrovolt','Burner — MetroVolt'],['/ai','AI-Native Architecture'],['/magnets','Magnets'],['/fuel-cycle','Fuel cycle'],['/safety','Safety'],['/roadmap','Roadmap'],['/blueprint','Engineering Blueprint']]},
    {label:'Solutions',items:[['/metrovolt','AI & Data Centers'],['/defense','Defense & Government'],['/metrovolt','Grid & Baseload'],['/defense','Neutron Detection'],['/ai','Quantum']]},
    {link:['/learn/','Learn']},
    {link:['/technical/','Technical Library']},
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
        col('Blueprint & Computing',[['/blueprint','Blueprint overview'],['/blueprints/','Engineering portal 🔒'],['/computing','Computing & de-risking'],['/computing/hpc','High-performance computing'],['/science','Science & evidence']])+
        col('Proof',[['/publications','Publications'],['/whitepapers','Whitepapers'],['/technical/','Technical Library'],['/mission','Open science']])+
        col('Company',[['/mission','About / Mission'],['/leadership','Leadership'],['/investors','Investors'],['/careers','Careers'],['/press','Press'],['/faq','FAQ'],['/contact','Contact']])+
      '</div></div>'+
      '<div class="kfe-footer-legal"><span>© 2026 Kronos Fusion Energy — a fusion energy company.</span>'+
        '<span class="kfe-legal-links"><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/corrections">Corrections</a><a href="/legal/accessibility">Accessibility</a></span></div>'+
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
    hyperion:{name:'Hyperion — Breeder',links:[['/hyperion','Overview'],['/how-it-works','How it works'],['/fuel-cycle','Fuel cycle'],['/magnets','Magnets']],faq:'/faq/breeder.html'},
    aegis:{name:'Aegis — Burner',links:[['/aegis','Overview'],['/defense','Defense & Government'],['/how-it-works','How it works']],faq:'/faq/aegis.html'},
    metrovolt:{name:'MetroVolt — Burner',links:[['/metrovolt','Overview'],['/how-it-works','How it works']],faq:'/faq/metrovolt.html'},
    defense:{name:'Defense & Government',links:[['/defense','Overview'],['/aegis','Aegis burner']],faq:'/faq/defense.html'},
    ai:{name:'AI-Native Architecture',links:[['/ai','Overview'],['/computing','Computing']],faq:'/faq/ai.html'},
    computing:{name:'Computing & De-risking',links:[['/computing','Overview'],['/science','Science & Evidence']],faq:'/faq/computing.html'},
    learn:{name:'Learn',links:[['/learn/','Knowledge base'],['/technical/','Technical Library']],faq:'/faq/general.html'},
    technical:{name:'Technical Library',links:[['/technical/','Library'],['/publications','Publications'],['/whitepapers','Whitepapers']],faq:'/faq/technical.html'},
    publications:{name:'Publications',links:[['/publications','Publications'],['/technical/','Technical Library']],faq:'/faq/publications.html'},
    whitepapers:{name:'Whitepapers',links:[['/whitepapers','Whitepapers'],['/publications','Publications']],faq:'/faq/publications.html'},
    mission:{name:'Mission',links:[['/mission','About'],['/leadership','Leadership']],faq:'/faq/about.html'},
    investors:{name:'Investors',links:[['/investors','Overview'],['/mission','Mission']],faq:'/faq/investors.html'},
    careers:{name:'Careers',links:[['/careers','Openings'],['/mission','Mission']],faq:'/faq/careers.html'},
    ehs:{name:'Environment, Health & Safety',links:[['/ehs','Overview']],faq:'/faq/environment.html'},
    leadership:{name:'Leadership',links:[['/leadership','Team'],['/mission','Mission']],faq:'/faq/about.html'},
    press:{name:'Press',links:[['/press','Press'],['/mission','Mission']],faq:'/faq/about.html'},
    blueprint:{name:'Engineering Blueprint',links:[['/blueprint','Overview'],['/blueprints/','Team portal 🔒']],faq:'/faq/blueprint.html'},
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
  function inject(){
    // unify: replace ANY existing site header/subnav/footer with the shell's; leave page heros (header.hero).
    ['.kfe-header','.kfe-subnav','header.top','.kfe-secfoot'].forEach(function(s){
      [].slice.call(document.querySelectorAll(s)).forEach(function(el){el.remove();});
    });
    [].slice.call(document.querySelectorAll('body > footer, .kfe-footer')).forEach(function(el){el.remove();});
    document.body.insertAdjacentHTML('afterbegin', header());
    var sub=subnav(); if(sub) document.querySelector('.kfe-header').insertAdjacentHTML('afterend', sub);
    document.body.insertAdjacentHTML('beforeend', secfoot()+footer());
    wire(document); wireSub();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject); else inject();
})();
