// Site logo + header style (our own artwork – not the Influence logo).
// TEST: only on ?beta=1 until Mark says go live.
(function(){
  const ON=/[?&]beta=1/.test(location.search);
  if(!ON)return;
  const CSS=
    '#brand-logo,#brand-logo2{flex:none;width:76px;height:76px;overflow:visible;filter:drop-shadow(0 0 6px rgba(95,195,228,.45))}'+
    'header h1.brand{display:flex;flex-wrap:wrap;text-align:center;align-items:center;gap:18px;justify-content:center;margin:2px 0 10px;font-family:Jura,sans-serif;font-weight:500;'+
      'font-size:40px;letter-spacing:1px;text-transform:uppercase;color:#e6ebf2}'+
    'header h1.brand .brand-t{text-shadow:0 0 6px rgba(143,227,255,.7),0 0 16px rgba(95,195,228,.5)}'+
    'header h1.brand .brand-t>span{color:#5fc3e4;text-shadow:0 0 6px rgba(143,227,255,.7),0 0 16px rgba(95,195,228,.5)}'+
    'header{border-bottom:0!important}'+
    '#brand-fp{text-align:center;font-size:12px;color:#ffab3d;margin:-4px 0 8px}#brand-fp button{font-size:15px;padding:3px 10px}#brand-fp button.sel{background:#5fc3e4;color:#04121a}'+
    'header::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;pointer-events:none;'+
      'background:linear-gradient(90deg,transparent,#5fc3e4 20%,#8fe3ff 50%,#5fc3e4 80%,transparent);'+
      'box-shadow:0 0 10px rgba(95,195,228,.8),0 0 22px rgba(91,157,255,.5)}'+
    '@media (max-width:600px){header h1.brand{font-size:24px;gap:10px}#brand-logo,#brand-logo2{width:50px;height:50px}}';
  const GRP={S:'Fleet',C:'Fleet',P:'Logistics',V:'Logistics',J:'Logistics',A:'Asteroids',X:'Asteroids',F:'Asteroids',
    B:'Buildings',T:'Buildings',L:'Buildings',K:'Trading',Y:'Trading',M:'Trading',R:'Planners',Q:'Planners'};
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  // returns [before, highlighted word(s), after]
  function title(){
    const gq=document.getElementById('gq');
    if(gq&&gq.value.trim())return ['Your','Search','Results'];
    const b=[].slice.call(document.querySelectorAll('button.on[id^="v"]')).filter(x=>/^v[A-Z]$/.test(x.id))[0];
    const k=b?b.id.slice(1):'N';
    if(k==='N'||!b)return ['Quartermaster Skippy\'s','Command','Deck'];
    const name=b.textContent.replace(/[▾▸◂]/g,'').trim();
    return ['Your'+(GRP[k]?' '+GRP[k]:''),name,''];
  }
  const FONTS=['Rye','Sancreek','Smokum','Jura'];let FI=0;
  const NS='http://www.w3.org/2000/svg';
  const MOVE=!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const LOGO=
    '<defs><radialGradient id="bl-s"><stop offset="0" stop-color="#fffaf0"/><stop offset=".35" stop-color="#ffe2b0" stop-opacity=".9"/>'+
    '<stop offset="1" stop-color="#ffd09a" stop-opacity="0"/></radialGradient></defs>'+
    '<g transform="rotate(-18)"><ellipse rx="21" ry="8" fill="none" stroke="#5fc3e4" stroke-width="1.3" opacity=".75"/>'+
    '<path id="bl-o" d="M21 0A21 8 0 1 1 -21 0A21 8 0 1 1 21 0" fill="none"/></g>'+
    '<circle r="11" fill="url(#bl-s)"/><circle r="4.2" fill="#fff8e8"/>'+
    '<g transform="rotate(-18)"><g><path d="M3.2 0L-2.4 -2.3L-1.2 0L-2.4 2.3Z" fill="#8fe3ff"/>'+
    '<circle cx="-2.6" r="1.1" fill="#5b9dff" opacity=".9"/>'+
    (MOVE?'<animateMotion dur="9s" repeatCount="indefinite" rotate="auto"><mpath href="#bl-o"/></animateMotion>'
         :'<animateTransform attributeName="transform" type="translate" values="0 8" dur="1s" fill="freeze"/>')+
    '</g></g>';
  function tick(){
    const d=document;
    if(!d.head)return;
    if(!d.getElementById('brand-font')){
      const l=d.createElement('link');l.id='brand-font';l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Jura:wght@400;500;600&family=Rye&family=Sancreek&family=Smokum&display=swap';d.head.appendChild(l);
    }
    if(!d.getElementById('brand-css')){const st=d.createElement('style');st.id='brand-css';st.textContent=CSS;d.head.appendChild(st)}
    const h1=d.querySelector('header h1');
    if(h1&&!d.getElementById('brand-logo')){
      const s=d.createElementNS(NS,'svg');s.id='brand-logo';s.setAttribute('viewBox','-26 -26 52 52');
      s.setAttribute('aria-hidden','true');s.innerHTML=LOGO;
      const t=d.createElement('span');t.className='brand-t';while(h1.firstChild)t.appendChild(h1.firstChild);
      const s2=s.cloneNode(true);s2.id='brand-logo2';s2.style.transform='scaleX(-1)';
      h1.classList.add('brand');h1.append(s,t,s2);
    }
    // own centred row at the very top of the header
    const hd=d.querySelector('header');
    if(h1&&hd&&hd.firstElementChild!==h1)hd.prepend(h1);
    // TEST: title font picker (western style, like a whiskey label)
    if(h1){
      const t0=h1.querySelector('.brand-t');if(t0)t0.style.fontFamily=FONTS[FI]+',Jura,serif';
      let fp=d.getElementById('brand-fp');
      if(!fp){fp=d.createElement('div');fp.id='brand-fp';h1.after(fp);
        fp.addEventListener('click',e=>{const b=e.target.closest('[data-fi]');if(!b)return;FI=+b.dataset.fi;fp.dataset.k='';tick()})}
      if(fp.dataset.k!==String(FI)){fp.dataset.k=String(FI);
        fp.innerHTML='Test – title font: '+FONTS.map((f,i)=>'<button type="button" data-fi="'+i+'" style="font-family:'+f+'"'+(i===FI?' class="sel"':'')+'>'+f+'</button>').join(' ');}
    }
    // Title follows the page: landing = Quartermaster Skippy's Command Deck, others = Your <Group> <Page>
    const t=h1&&h1.querySelector('.brand-t');
    if(t){
      const T=title();
      if(t.dataset.n!==T.join('|')){t.dataset.n=T.join('|');
        t.innerHTML=esc(T[0])+(T[0]?' ':'')+'<span>'+esc(T[1])+'</span>'+(T[2]?' '+esc(T[2]):'');
        d.title=T.filter(Boolean).join(' ');}
    }
  }
  setInterval(tick,300);tick();
})();
