/* colours.js – TEST (only with ?beta=1): each menu group gets its own colour.
   - Group buttons (Fleet, Logistics, …) carry their colour all the time.
   - Dropdown items show the group colour.
   - A coloured strip with a big icon sits above the page: "Group › Page".
   It never changes page buttons' class names (other code checks className==='on'). */
(function(){
  'use strict';
  if(!/[?&]beta=1/.test(location.search))return;

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
  var st=document.createElement('style');st.id='colours-css';st.textContent=css;document.head.appendChild(st);

  /* the coloured strip above the page */
  var last='';
  function tick(){
    var main=document.getElementById('main');if(!main)return;
    var gq=document.getElementById('gq'),key='',name='';
    if(gq&&gq.value.trim()){key='Z';name='Search results'}
    else{var b=document.querySelector('button.on[id^="v"]');if(b&&/^v[A-Z]$/.test(b.id)){key=b.id.slice(1);name=b.textContent.trim()}}
    var g=BY[key],band=document.getElementById('pgband');
    if(!g){if(band)band.style.display='none';last='';return}
    if(!band||band.nextElementSibling!==main){if(band)band.remove();band=document.createElement('div');band.id='pgband';main.before(band);last=''}
    var sig=g+'|'+name;if(sig===last)return;last=sig;
    var c=GROUPS[g][0],grp=(g==='Home'||g==='SkippyChain'||g==='Search')?'':g;
    band.style.cssText='--pg:'+c+';--pgbg:'+rgba(c,.22)+';--pgglow:'+rgba(c,.6);
    band.innerHTML='<span class="pi" aria-hidden="true">'+GROUPS[g][1]+'</span><div>'+(grp?'<div class="pg">'+grp+'</div>':'')+'<div class="pn"></div></div>';
    band.querySelector('.pn').textContent=name;
    band.classList.remove('fade');void band.offsetWidth;band.classList.add('fade');
  }
  setInterval(tick,300);
})();
