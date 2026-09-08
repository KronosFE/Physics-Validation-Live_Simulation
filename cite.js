// Subtle "Cite" affordance on every figure — builds a citation string + copies it. Progressive enhancement.
(function(){
  var BASE='https://kronosfusionenergy.com/Physics-Validation-Live_Simulation/';
  function css(){
    if(document.getElementById('cite-css'))return;
    var s=document.createElement('style');s.id='cite-css';
    s.textContent='.cite-btn{margin-left:8px;font-family:"Space Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.06em;'+
      'text-transform:uppercase;color:#8fa0b8;background:none;border:1px solid rgba(150,165,190,.28);border-radius:5px;'+
      'padding:2px 7px;cursor:pointer;opacity:.55;transition:.15s;vertical-align:middle}'+
      '.cite-btn:hover,.cite-btn:focus-visible{opacity:1;border-color:#d4ad5c;color:#d4ad5c;outline:none}'+
      '.cite-btn.ok{opacity:1;color:#57b98a;border-color:#57b98a}';
    document.head.appendChild(s);
  }
  function cite(name,url){return 'Kronos Fusion Energy (2026). "'+name+'." Kronos Physics De-Risking Figure Library. '+url;}
  function flash(b,t){var o=b.dataset.o||b.textContent;b.dataset.o=o;b.textContent=t;b.classList.add('ok');setTimeout(function(){b.textContent=o;b.classList.remove('ok');},1500);}
  function wire(){
    css();
    document.querySelectorAll('figure').forEach(function(fig){
      var img=fig.querySelector('img'); if(!img||fig.querySelector('.cite-btn'))return;
      var name=(img.getAttribute('alt')||'').replace(/\s*[—–-]\s*Kronos.*$/,'').replace(/[,;]\s*$/,'').trim();
      if(!name){var fc=fig.querySelector('figcaption');name=fc?fc.textContent.trim().slice(0,80):'Kronos figure';}
      var src=(img.getAttribute('src')||'').replace(/^\.?\//,'');
      var url=BASE+src;
      var b=document.createElement('button');b.type='button';b.className='cite-btn';b.textContent='Cite';
      b.setAttribute('aria-label','Cite this figure');
      b.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        var c=cite(name,url);
        function fallback(){try{var ta=document.createElement('textarea');ta.value=c;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();var ok=document.execCommand('copy');document.body.removeChild(ta);flash(b,ok?'Copied ✓':'Press ⌘/Ctrl+C');}catch(_){flash(b,'Copy failed');}}
        if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(c).then(function(){flash(b,'Copied ✓');},fallback);}
        else fallback();
      });
      var cap=fig.querySelector('figcaption')||fig;
      cap.appendChild(b);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire); else wire();
})();
