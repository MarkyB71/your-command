/* colours.js – LIVE: each menu group gets its own colour.
   - Group buttons (Fleet, Logistics, …) carry their colour all the time.
   - Dropdown items show the group colour.
   - A coloured strip with a big icon sits above the page: "Group › Page".
   It never changes page buttons' class names (other code checks className==='on'). */
(function(){
  'use strict';

  /* group: [colour, icon, page letters] */
  var GROUPS={
    'Home':      ['#6ec6e6','📋',['N']],
    'SkippyChain':['#ffd24a','🔗',['H']],
    'Fleet':     ['#5b9dff','🚀',['S','C']],
    'Logistics': ['#3fd68a','📦',['P','V','J']],
    'Asteroids': ['#ffab3d','☄️',['A','X','F']],
    'Buildings': ['#b388ff','🏭',['B','T','L']],
    'Trading':   ['#f5c542','💰',['K','Y','M']],
    'Planners':  ['#ff6fae','🧭',['R','Q']],
    'Search':    ['#9aa8bb','🔍',['Z']]
  };
  var BY={};Object.keys(GROUPS).forEach(function(g){GROUPS[g][2].forEach(function(k){BY[k]=g})});
  var rgba=function(hex,a){var n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'};

  /* menu colours */
  var css='';
  Object.keys(GROUPS).forEach(function(g){
    var c=GROUPS[g][0];
    css+='button[data-g="'+g+'"]{border-bottom:3px solid '+c+'!important;color:'+c+'!important}';
    css+='button[data-g="'+g+'"].on{background:'+rgba(c,.18)+'!important;box-shadow:0 0 12px '+rgba(c,.55)+'!important}';
    GROUPS[g][2].forEach(function(k){
      css+='.ddm #v'+k+'{border-left:4px solid '+c+'!important}';
      css+='.ddm #v'+k+':hover,.ddm #v'+k+'.on{color:'+c+'!important;background:'+rgba(c,.14)+'!important;box-shadow:0 0 10px '+rgba(c,.45)+'!important}';
    });
  });
  css+='#pgband{display:flex;align-items:center;gap:14px;margin:6px 0 14px;padding:10px 16px;border-radius:10px;border-left:6px solid var(--pg);background:linear-gradient(90deg,var(--pgbg),transparent 75%)}'+
       '#pgband .pi{font-size:34px;line-height:1;filter:drop-shadow(0 0 8px var(--pgglow))}'+
       '#pgband .pg{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--pg);font-weight:700}'+
       '#pgband .pn{font-size:22px;font-weight:800;color:#eef4fb;text-shadow:0 0 12px var(--pgglow)}'+
       '#pgband.fade{animation:pgin .35s ease-out}@keyframes pgin{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}'+
       '@media (prefers-reduced-motion: reduce){#pgband.fade{animation:none}}';

  /* TEST (?beta=1): our own artwork drawn in code, behind the right side of the strip */
  var BETA=/[?&]beta=1/.test(location.search);
  function rnd(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}}
  function rock(cx,cy,r,n,seed,j){ /* lumpy closed outline, smoothed through mid-points */
    var R=rnd(seed),p=[],i;for(i=0;i<n;i++){var a=i/n*Math.PI*2,k=r*(1-j/2+R()*j);p.push([cx+Math.cos(a)*k,cy+Math.sin(a)*k*.82])}
    var m=function(a,b){return ((a[0]+b[0])/2).toFixed(1)+' '+((a[1]+b[1])/2).toFixed(1)},d='M'+m(p[n-1],p[0]);
    for(i=0;i<n;i++)d+=' Q'+p[i][0].toFixed(1)+' '+p[i][1].toFixed(1)+' '+m(p[i],p[(i+1)%n]);return d+'Z'}
  function stars(seed,cnt){var R=rnd(seed),s='';for(var i=0;i<cnt;i++)s+='<circle cx="'+(R()*460).toFixed(0)+'" cy="'+(R()*120).toFixed(0)+'" r="'+(R()<.15?1.3:.7)+'" fill="#fff" opacity="'+(.25+R()*.6).toFixed(2)+'"/>';return s}
  var SCENES={
    'Fleet':function(){ /* a cargo hauler of our own design crossing in front of the star */
      return '<svg viewBox="0 0 460 120" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><defs>'+
       '<radialGradient id="fStar" cx=".92" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".15" stop-color="#cfe2ff" stop-opacity=".6"/><stop offset=".55" stop-color="#5b9dff" stop-opacity=".15"/><stop offset="1" stop-color="#5b9dff" stop-opacity="0"/></radialGradient>'+
       '<linearGradient id="fHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d6ea"/><stop offset=".5" stop-color="#6d7b92"/><stop offset="1" stop-color="#262d3a"/></linearGradient>'+
       '<linearGradient id="fPlume" x1="1" x2="0"><stop offset="0" stop-color="#bfe0ff"/><stop offset=".3" stop-color="#5b9dff" stop-opacity=".7"/><stop offset="1" stop-color="#5b9dff" stop-opacity="0"/></linearGradient>'+
       '<filter id="fGlow"><feGaussianBlur stdDeviation="2.5"/></filter></defs>'+
       '<rect width="460" height="120" fill="url(#fStar)"/>'+stars(23,50)+
       '<path d="M0 104 Q230 70 460 40" fill="none" stroke="#5b9dff" stroke-opacity=".25" stroke-dasharray="3 6"/>'+
       '<g class="fFly"><g transform="translate(150 50) rotate(-7)">'+
        '<path d="M-78 4 L-8 -3 L-8 11 L-78 6Z" fill="url(#fPlume)" filter="url(#fGlow)"/>'+
        '<rect x="-12" y="-4" width="10" height="16" rx="2" fill="#3a4456"/><circle cx="-12" cy="4" r="5" fill="#cfe6ff" filter="url(#fGlow)"/>'+
        '<rect x="-2" y="-8" width="62" height="24" rx="5" fill="url(#fHull)"/>'+
        '<rect x="6" y="-14" width="18" height="10" rx="2" fill="#4b5870"/><rect x="28" y="-14" width="18" height="10" rx="2" fill="#4b5870"/>'+
        '<rect x="6" y="14" width="18" height="8" rx="2" fill="#2f3747"/><rect x="28" y="14" width="18" height="8" rx="2" fill="#2f3747"/>'+
        '<path d="M60 -6 L80 0 Q84 4 80 8 L60 14Z" fill="url(#fHull)"/><path d="M68 -1 L78 2 L78 5 L68 6Z" fill="#8fd0ff"/>'+
        '<circle cx="10" cy="4" r="1.6" fill="#5b9dff"/><circle cx="50" cy="4" r="1.6" fill="#ff6f6f" class="fBlink"/>'+
        '<path d="M-2 2 L60 2" stroke="#5b9dff" stroke-opacity=".7" stroke-width="1.5"/>'+
       '</g></g></svg>'},
    'Buildings':function(){ /* our own little base on an asteroid's surface */
      var R=rnd(31),ground='M0 120 L0 92';for(var x=0;x<=460;x+=20)ground+=' L'+x+' '+(86-x*.05+R()*6).toFixed(1);ground+=' L460 120Z';
      return '<svg viewBox="0 0 460 120" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><defs>'+
       '<radialGradient id="bStar" cx=".85" cy=".7" r=".55"><stop offset="0" stop-color="#fff1e0" stop-opacity=".9"/><stop offset=".2" stop-color="#d9c2ff" stop-opacity=".45"/><stop offset=".6" stop-color="#b388ff" stop-opacity=".12"/><stop offset="1" stop-color="#b388ff" stop-opacity="0"/></radialGradient>'+
       '<linearGradient id="bGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4152"/><stop offset="1" stop-color="#121016"/></linearGradient>'+
       '<linearGradient id="bWall" x1="1" x2="0"><stop offset="0" stop-color="#cbbbe6"/><stop offset="1" stop-color="#3e3550"/></linearGradient>'+
       '<linearGradient id="bTank" x1="1" x2="0"><stop offset="0" stop-color="#e4dcf3"/><stop offset=".5" stop-color="#8a7da3"/><stop offset="1" stop-color="#2c2638"/></linearGradient>'+
       '<filter id="bGlow"><feGaussianBlur stdDeviation="2"/></filter></defs>'+
       '<rect width="460" height="120" fill="url(#bStar)"/>'+stars(41,40)+
       '<path d="'+ground+'" fill="url(#bGround)"/>'+
       /* warehouse */
       '<path d="M170 82 L170 60 Q205 46 240 60 L240 80Z" fill="url(#bWall)"/><path d="M170 66 Q205 52 240 66" fill="none" stroke="#2a2336" stroke-width="1"/>'+
       '<rect x="196" y="68" width="18" height="12" fill="#1b1724"/><rect x="198" y="70" width="14" height="2" fill="#b388ff" opacity=".8"/>'+
       /* tank farm */
       [[262,79],[284,78],[306,77]].map(function(t){return '<rect x="'+(t[0]-9)+'" y="'+(t[1]-22)+'" width="18" height="22" fill="url(#bTank)"/><ellipse cx="'+t[0]+'" cy="'+(t[1]-22)+'" rx="9" ry="3" fill="#efe8fa"/>'}).join('')+
       '<path d="M240 74 L253 74 M271 70 L275 70 M293 69 L297 69" stroke="#8a7da3" stroke-width="2"/>'+
       /* extractor tower */
       '<path d="M128 86 L136 40 L144 86Z" fill="none" stroke="#9c8fbf" stroke-width="2"/><path d="M131 70 L141 70 M133 56 L139 56" stroke="#9c8fbf" stroke-width="1.5"/>'+
       '<circle cx="136" cy="38" r="3" fill="#b388ff" class="fBlink"/><circle cx="136" cy="38" r="7" fill="#b388ff" opacity=".5" filter="url(#bGlow)" class="fBlink"/>'+
       /* window lights */
       '<circle cx="180" cy="74" r="1.5" fill="#ffe7a8"/><circle cx="230" cy="74" r="1.5" fill="#ffe7a8"/>'+
       '</svg>'},
    'Asteroids':function(){
      var big=rock(250,62,46,23,7,.3),ridge=rock(250,62,46,9,13,.5),craters=[[236,48,9,6],[268,74,7,5],[222,78,5,4],[262,40,4,3],[244,66,3.5,3]];
      return '<svg viewBox="0 0 460 120" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><defs>'+
       '<radialGradient id="scStar" cx="1" cy=".35" r=".55"><stop offset="0" stop-color="#fff4d6" stop-opacity=".95"/><stop offset=".18" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset=".6" stop-color="#ff9a3d" stop-opacity=".12"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></radialGradient>'+
       '<radialGradient id="scRock" cx=".78" cy=".3" r=".95"><stop offset="0" stop-color="#e9c79a"/><stop offset=".35" stop-color="#9a7a5c"/><stop offset=".75" stop-color="#3f3530"/><stop offset="1" stop-color="#17151a"/></radialGradient>'+
       '<radialGradient id="scSmall" cx=".8" cy=".3" r="1"><stop offset="0" stop-color="#c9a27a"/><stop offset=".7" stop-color="#3a302c"/><stop offset="1" stop-color="#141216"/></radialGradient>'+
       '<linearGradient id="scShade" x1="0" x2="1"><stop offset="0" stop-color="#05060a" stop-opacity=".85"/><stop offset=".55" stop-color="#05060a" stop-opacity=".15"/><stop offset="1" stop-color="#05060a" stop-opacity="0"/></linearGradient>'+
       '<clipPath id="scClip"><path d="'+big+'"/></clipPath><filter id="scGlow"><feGaussianBlur stdDeviation="3"/></filter></defs>'+
       '<rect width="460" height="120" fill="url(#scStar)"/>'+stars(11,46)+
       '<ellipse cx="300" cy="66" rx="210" ry="34" fill="none" stroke="#ffab3d" stroke-opacity=".22" stroke-dasharray="2 5" transform="rotate(-8 300 66)"/>'+
       '<g class="scSpin"><path d="'+big+'" fill="#ffab3d" opacity=".35" filter="url(#scGlow)"/><path d="'+big+'" fill="url(#scRock)"/><g clip-path="url(#scClip)"><path d="'+ridge+'" transform="translate(-10 6) scale(.96)" fill="#000" opacity=".22" filter="url(#scGlow)"/></g>'+
       craters.map(function(c){return '<ellipse cx="'+c[0]+'" cy="'+c[1]+'" rx="'+c[2]+'" ry="'+c[3]+'" fill="#000" opacity=".28"/><path d="M'+(c[0]-c[2]*.8)+' '+(c[1]+c[3]*.4)+' A'+c[2]+' '+c[3]+' 0 0 0 '+(c[0]+c[2]*.8)+' '+(c[1]+c[3]*.4)+'" fill="none" stroke="#f3d6ad" stroke-opacity=".35" stroke-width="1"/>'}).join('')+'<path d="'+big+'" fill="url(#scShade)"/></g>'+
       '<g class="scDrift"><path d="'+rock(352,30,9,9,3,.4)+'" fill="url(#scSmall)"/><path d="'+rock(160,92,6,8,5,.45)+'" fill="url(#scSmall)"/><path d="'+rock(395,96,4.5,7,9,.5)+'" fill="url(#scSmall)"/></g>'+
       '</svg>'}
  };
  if(BETA)css+='#pgband.has-sc{position:relative;overflow:hidden;min-height:92px}#pgband .sc{position:absolute;top:0;right:0;bottom:0;width:min(62%,460px);pointer-events:none;-webkit-mask-image:linear-gradient(to left,#000 70%,transparent);mask-image:linear-gradient(to left,#000 70%,transparent)}#pgband .sc svg{width:100%;height:100%;display:block}#pgband>span,#pgband>div:not(.sc){position:relative;z-index:1}'+
    '.scSpin{transform-box:fill-box;transform-origin:center;animation:scSpin 90s linear infinite}.scDrift{animation:scDrift 14s ease-in-out infinite alternate}@keyframes scSpin{to{transform:rotate(360deg)}}.fFly{animation:fFly 18s ease-in-out infinite alternate}@keyframes fFly{from{transform:translate(-14px,5px)}to{transform:translate(18px,-4px)}}.fBlink{animation:fBlink 2.4s steps(1) infinite}@keyframes fBlink{50%{opacity:.15}}@keyframes scDrift{to{transform:translate(-10px,4px)}}@media (prefers-reduced-motion: reduce){.scSpin,.scDrift,.fFly,.fBlink{animation:none}}';
  function addCss(){if(document.getElementById('colours-css'))return;var st=document.createElement('style');st.id='colours-css';st.textContent=css;document.head.appendChild(st)}
  addCss();

  /* the coloured strip above the page */
  var last='';
  function tick(){
    addCss(); /* the site rebuilds <head> while loading, so put the colours back if they vanish */
    var main=document.getElementById('main');if(!main)return;
    var gq=document.getElementById('gq'),key='',name='';
    if(gq&&gq.value.trim()){key='Z';name='Search results'}
    else{var b=[].slice.call(document.querySelectorAll('button.on[id^="v"]')).filter(function(x){return /^v[A-Z]$/.test(x.id)})[0];if(b){key=b.id.slice(1);name=b.textContent.trim()}}
    var g=BY[key],band=document.getElementById('pgband');
    if(!g){if(band)band.style.display='none';last='';return}
    if(!band||band.nextElementSibling!==main){if(band)band.remove();band=document.createElement('div');band.id='pgband';main.before(band);last=''}
    var sig=g+'|'+name;if(sig===last)return;last=sig;
    var c=GROUPS[g][0],grp=(g==='Home'||g==='SkippyChain'||g==='Search')?'':g;
    band.style.cssText='--pg:'+c+';--pgbg:'+rgba(c,.22)+';--pgglow:'+rgba(c,.6);
    band.innerHTML='<span class="pi" aria-hidden="true">'+GROUPS[g][1]+'</span><div>'+(grp?'<div class="pg">'+grp+'</div>':'')+'<div class="pn"></div></div>';
    band.querySelector('.pn').textContent=name;
    band.classList.toggle('has-sc',!!(BETA&&SCENES[g]));if(BETA&&SCENES[g]){var sc=document.createElement('div');sc.className='sc';sc.innerHTML=SCENES[g]();band.appendChild(sc)}
    band.classList.remove('fade');void band.offsetWidth;band.classList.add('fade');
  }
  setInterval(tick,300);
})();
