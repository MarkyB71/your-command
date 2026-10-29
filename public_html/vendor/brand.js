// Site logo + header style (our own artwork – not the Influence logo).
// LIVE for everyone (tested on ?beta=1 first, 19 Oct 2026).
(function(){
  const CSS=
    '#brand-logo,#brand-logo2{flex:none;width:76px;height:76px;overflow:visible;filter:drop-shadow(0 0 6px rgba(95,195,228,.45))}'+
    'header h1.brand{display:flex;flex-wrap:wrap;text-align:center;align-items:center;gap:18px;justify-content:center;margin:2px 0 10px;font-family:Jura,sans-serif;font-weight:500;'+
      'font-size:40px;letter-spacing:1px;text-transform:uppercase;color:#e6ebf2}'+
    'header h1.brand .brand-t{text-shadow:0 0 6px rgba(143,227,255,.7),0 0 16px rgba(95,195,228,.5)}'+
    'header h1.brand .brand-t>span{color:#5fc3e4;text-shadow:0 0 6px rgba(143,227,255,.7),0 0 16px rgba(95,195,228,.5)}'+
    'header h1.brand .brand-t .bw{font-weight:inherit;color:#fff!important;text-shadow:0 0 6px rgba(255,255,255,.55),0 0 14px rgba(95,195,228,.4)}'+
    'header{border-bottom:0!important}'+
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
    if(/^The /.test(name))return ['The',name.slice(4),''];
    // New titles (beta): "Your <Page>", no group word, no doubles
    {const NM={S:'Ships',C:'Crews',P:'Products',V:'Deliveries',J:'Activity Log',A:'Asteroids',X:'Core Samples',F:'Lot Resources',E:'Supply Chain',B:'Building Contents',T:'Building Status',L:'Leases',K:'Market',Y:'Trade Finder',M:'Market History',Q:'Crew Planner',R:'Travel Planner',U:(/[?&]beta=1/.test(location.search)?'Construction Planner':'Asteroid Planner'),D:'Production Planner',O:'Where to Buy',G:'Fuel Check'};if(NM[k])return ['Your',NM[k],''];}
    // Trading and Planners read better without the group word
    if(k==='R')return ['Your','Travel Planner',''];
    if(GRP[k]==='Trading'||GRP[k]==='Planners')return ['Your',name,''];
    return ['Your'+(GRP[k]?' '+GRP[k]:''),name,''];
  }
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
      l.href='https://fonts.googleapis.com/css2?family=Jura:wght@400;500;600&family=Rye&display=swap';d.head.appendChild(l);
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
    if(false&&hd&&hd.firstElementChild!==h1)hd.prepend(h1);
    // Title font: Rye (western whiskey-label style)
    if(h1){const t0=h1.querySelector('.brand-t');if(t0&&t0.style.fontFamily.indexOf('Rye')<0)t0.style.fontFamily='Rye,Jura,serif'}
    // Title follows the page: landing = Quartermaster Skippy's Command Deck, others = Your <Group> <Page>
    const t=h1&&h1.querySelector('.brand-t');
    if(t){
      const T=title();
      if(t.dataset.n!==T.join('|')){t.dataset.n=T.join('|');
        t.innerHTML=T[0]==='Quartermaster Skippy\'s'?'<span>Quartermaster</span> <b class="bw">Skippy&#39;s</b> <span>Command Deck</span>':esc(T[0])+(T[0]?' ':'')+'<span>'+esc(T[1])+'</span>'+(T[2]?' '+esc(T[2]):'');
        d.title=T.filter(Boolean).join(' ');}
    }
    // TEST (MVB): banner at the very top with the title in the middle, then the menu (sticky), then the Updated/search strip
    if(hd){const main=d.getElementById('main'),hb=hd.querySelector(':scope > .bar'),tr=hd.querySelector(':scope > .toprow');
      if(main&&hb){hb.dataset.mv='1';main.before(hb)}
      if(main&&tr){tr.dataset.mv='1';main.before(tr)}
      const hb2=d.querySelector('.bar[data-mv="1"]'),tr2=d.querySelector('.toprow[data-mv="1"]');
      if(hb2&&tr2){const hb=hb2,info=tr2.firstElementChild;if(info&&!info.querySelector('h1')&&!info.dataset.inf&&info.textContent.indexOf('Updated')>=0){info.dataset.inf='1';const cv=hb.querySelector('#csv');cv?cv.before(info):hb.append(info)}}
      if(tr2){const g=d.getElementById('gq'),box=g&&g.closest('.toprow > div');if(box&&!box.dataset.srch){box.dataset.srch='1';hd.append(box)}
        {const sb=d.querySelector('[data-srch="1"]');if(sb&&hb2&&sb.parentElement!==hb2){sb.dataset.srch='2';const inf=hb2.querySelector('[data-inf="1"]'),cv=hb2.querySelector('#csv');inf?inf.before(sb):cv?cv.before(sb):hb2.append(sb)}}
        if(!tr2.children.length&&tr2.style.display!=='none')tr2.style.display='none'}
      if(!d.getElementById('srch-css')){const st=d.createElement('style');st.id='srch-css';st.textContent='.bar [data-srch="2"]{margin:0 0 0 auto!important;padding:0 4px}.bar [data-srch="2"] input{min-width:0!important;width:200px!important;padding:5px 9px!important;font-size:12px!important}.bar [data-srch="2"]+[data-inf="1"]{margin-left:0!important}'+'header [data-srch="1"]{position:absolute!important;top:58px;right:14px;z-index:5!important;margin:0!important}@media (max-width:700px){header [data-srch="1"]{position:static!important;padding:6px 16px}}';d.head.appendChild(st)}
      if(!d.getElementById('inf-css')){const st=d.createElement('style');st.id='inf-css';st.textContent='.bar [data-inf="1"]{font-size:11px;line-height:1.35;color:#8b9ab0;margin-left:auto;text-align:right;padding:0 10px}.bar [data-inf="1"] *{font-size:11px!important;margin:0!important}.bar [data-inf="1"]+#csv{margin-left:0!important}';d.head.appendChild(st)}
      if(h1&&h1.parentElement!==hd){const bd=d.getElementById('pgband');if(bd&&bd.parentElement===hd)bd.after(h1);else hd.prepend(h1)}
      if(hd.style.top!=='0px'||hd.style.position!=='sticky'){hd.style.setProperty('top','0px','important');hd.style.setProperty('position','sticky','important')}
      if(!d.getElementById('mvb-css')){const st=d.createElement('style');st.id='mvb-css';st.textContent=
        'header{padding:0!important;z-index:41!important;background:#05070a}'+
        'header #pgband{margin:0!important;border-radius:0!important;min-height:130px!important;padding:10px 20px!important}'+
        'header h1.brand{position:absolute!important;left:0;right:0;top:65px;transform:translateY(-50%);margin:0!important;z-index:3!important;pointer-events:none}'+
        'header #pgband>*{position:relative;z-index:2}'+
        '#wc-top{z-index:5!important}'+
        '.bar[data-mv="1"]{position:sticky!important;top:0!important;z-index:40!important;background:rgba(5,7,10,.94);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:8px 20px!important;margin:0!important;border-bottom:1px solid rgba(95,195,228,.35);box-shadow:0 4px 14px rgba(0,0,0,.5)}'+
        '.toprow[data-mv="1"]{display:flex!important;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:6px 20px 10px!important;margin:0!important;font-size:12px;color:#8b9ab0}'+
        '@media (max-width:700px){header h1.brand{position:static!important;transform:none;padding:6px 0}header #pgband{min-height:0!important}}';
        d.head.appendChild(st)}
      const mb=d.querySelector('.bar[data-mv="1"]');
      if(mb){const ht=hd.offsetHeight;if(mb.style.top!==ht+'px')mb.style.setProperty('top',ht+'px','important');const vis=ht+mb.offsetHeight;d.querySelectorAll('.pc-bar.stick').forEach(b=>{if(b.style.top!==vis+'px')b.style.top=vis+'px'});}
      return}
    // Title scrolls away; header stops with the menu buttons at the top
    if(hd){const bar=hd.querySelector(':scope > .bar');
      if(bar){const top=-Math.max(0,bar.offsetTop-8);
        if(hd.style.top!==top+'px')hd.style.setProperty('top',top+'px','important');
        const vis=hd.offsetHeight+top;
        d.querySelectorAll('.pc-bar.stick').forEach(b=>{if(b.style.top!==vis+'px')b.style.top=vis+'px'});}}
  }
  setInterval(tick,300);tick();
  // TEST (?beta=1): title shrinks to fit between the banner's page label and the edges; if it would get too small, the small label hides
  function fit(){
    const h=document.querySelector('h1.brand'),t=h&&h.querySelector('.brand-t'),b=document.querySelector('#pgband');if(!t)return;
    const W=document.documentElement.clientWidth;
    if(W<=700){if(h.style.fontSize)h.style.fontSize='';b&&b.classList.remove('yic-nolab');return}
    const fs=parseFloat(getComputedStyle(h).fontSize)||40,per=t.scrollWidth/fs;   // text width per px of font size
    const logos=[...h.children].filter(c=>c!==t).reduce((s,c)=>s+c.getBoundingClientRect().width,0),gap=(parseFloat(getComputedStyle(h).columnGap)||0)*(h.children.length-1);
    const wb=[...document.querySelectorAll('header button')].find(x=>/wallet/i.test(x.textContent));
    const edge=(lab)=>{let c=16;if(lab&&b){b.querySelectorAll('.pg,.pn').forEach(e=>{const r=e.getBoundingClientRect();if(r.width)c=Math.max(c,r.right+14)})}
      if(wb){const r=wb.getBoundingClientRect(),hr=h.getBoundingClientRect();if(r.bottom>hr.top+4)c=Math.max(c,W-r.left+8)}return c};
    const size=lab=>Math.min(40,Math.floor((W-2*edge(lab)-logos-gap)/per));
    let n=size(true),hide=false;if(n<26){hide=true;b&&b.classList.add('yic-nolab');n=Math.max(18,Math.min(25,size(false)))}else b&&b.classList.remove('yic-nolab');
    if(h.style.fontSize!==n+'px')h.style.setProperty('font-size',n+'px','important');
    if(!document.getElementById('fit-css')){const st=document.createElement('style');st.id='fit-css';st.textContent='#pgband.yic-nolab .pg,#pgband.yic-nolab .pn{visibility:hidden}h1.brand .brand-t{white-space:nowrap}';document.head.appendChild(st)}}
  // TEST (?beta=1): Updated/wallet lines and the Download button stay together, on the right, on one row
  function ic(){const bar=document.querySelector('.bar[data-mv="1"]');if(!bar)return;
    if(!document.getElementById('ic-css')){const st=document.createElement('style');st.id='ic-css';st.textContent='.bar .yic-ic{display:flex;align-items:center;gap:8px;margin-left:auto;flex:0 0 auto}.bar .yic-ic>[data-inf="1"]{margin-left:0}.bar [data-srch="2"]{margin-left:0!important}';document.head.appendChild(st)}
    const inf=bar.querySelector(':scope > [data-inf="1"]'),cv=bar.querySelector(':scope > #csv');if(!inf||!cv||bar.querySelector('.yic-ic'))return;
    const w=document.createElement('div');w.className='yic-ic';inf.before(w);w.append(inf,cv)}
  {setInterval(()=>{fit();ic()},500);addEventListener('resize',fit);fit();ic()}
})();
