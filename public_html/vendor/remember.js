/* remember.js – keeps the page you are on after a refresh (browser refresh or the site's Refresh link).
   Saves the last menu page in the address (#vX) and in this tab's sessionStorage,
   then clicks that menu button again once the page has loaded. */
(function(){
  'use strict';
  var KEY='yicPage', isPage=function(id){return /^v[A-Z]$/.test(id||'')};
  function save(id){
    try{sessionStorage.setItem(KEY,id)}catch(e){}
    try{history.replaceState(history.state,'',location.pathname+location.search+(id==='vN'?'':'#'+id))}catch(e){}
  }
  function saved(){
    var h=(location.hash||'').slice(1);if(isPage(h))return h;
    try{var s=sessionStorage.getItem(KEY);if(isPage(s))return s}catch(e){}
    return 'vN';
  }
  /* remember every menu page the player opens (main pages and add-on pages) */
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('button[id]');
    if(b&&isPage(b.id)){save(b.id);return}
    if(e.target&&e.target.closest&&e.target.closest('header h1[data-home]'))save('vN'); /* site title = back to Today's Workload */
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target&&e.target.closest&&e.target.closest('header h1[data-home]'))save('vN');
  },true);
  /* remember the asteroid box (#ast) by asteroid name */
  var AKEY='yicAst';
  document.addEventListener('change',function(e){
    var s=e.target;if(!s||s.id!=='ast')return;
    var o=s.options[s.selectedIndex];
    try{sessionStorage.setItem(AKEY,s.value===''?'':(o?o.textContent:''))}catch(e){}
  },true);
  function restoreAst(){
    var s=document.getElementById('ast');if(!s||s.options.length<2||s.options[0].dataset.rem)return;
    s.options[0].dataset.rem='1';
    var n='';try{n=sessionStorage.getItem(AKEY)||''}catch(e){}
    if(!n||s.value!=='')return;
    for(var i=0;i<s.options.length;i++)if(s.options[i].textContent===n&&s.options[i].value!==''){
      s.value=s.options[i].value;s.dispatchEvent(new Event('change',{bubbles:true}));return}
  }
  /* after a (re)load the site opens on Today's Workload – jump back to the saved page */
  var last=0;
  setInterval(function(){
    restoreAst();
    var id=saved();if(id==='vN')return;
    var home=document.getElementById('vN'),b=document.getElementById(id);
    if(!home||!b||!/\bon\b/.test(home.className)||/\bon\b/.test(b.className))return;
    var t=Date.now();if(t-last<3000)return;last=t;
    b.click();
  },400);
})();
