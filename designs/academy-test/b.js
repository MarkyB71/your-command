
(function(){
var P={
 campus:{name:'Main Campus',c:'var(--c-campus)',hex:'#5b9dff',sub:'Where it all begins',r:150,a:200,size:16},
 library:{name:'Student Library',c:'var(--c-lib)',hex:'#b388ff',sub:'Research on bonuses & traits',r:150,a:330,size:12},
 guides:{name:'Guides',c:'var(--c-guide)',hex:'#3fd68a',sub:'How to play',r:230,a:250,size:13},
 tutorials:{name:'Tutorials',c:'var(--c-tut)',hex:'#ff6fae',sub:'Step-by-step lessons',r:230,a:40,size:10},
 links:{name:'Community links',c:'var(--c-link)',hex:'#ffab3d',sub:'Other players’ tools',r:300,a:140,size:11},
 command:{name:'Your Command',c:'var(--c-cmd)',hex:'#ffd24a',sub:'Your live player console',r:300,a:305,size:17}
};
var GUIDES=[['Starter guide','Your first steps in Adalia.','TestNet-Phase-3-Starter-Guide-326dc348c11e410b8a83fbf8a953ef9f'],['Recruiting crewmates','Building and growing your crew.','Creating-Crewmates-0e3cf6d88a924d608fa30da94dac3de4'],['Mining asteroids','Extracting raw materials.','Mining-Asteroids-7742c46ae3d942ef95fc50d836d545fa'],['Taking core samples','Finding the richest deposits.','Core-Sampling-8f9d82a2cfc4416699fea83955490bfc'],['Buying asteroids','Getting a rock of your own.','Minting-Asteroids-7d846eb0346248daa5633c7ad3cddbd9'],['Scanning asteroids','Revealing what’s inside.','Scanning-Asteroids-db8f7f2866b84dcda1162c7b2391076f'],['Building infrastructure','Warehouses, extractors and more.','Building-Infrastructure-1c45a5c9f1a2429ca6477c6d829b313a']];
var LINKS=[['Influence Wiki','Official wiki and user guides.','https://wiki.influenceth.io/en/community/user-guides'],['Gluonic','Community content hub.','https://gluonic.gg/influence'],['Tyrell-Yutani','Asteroid and crewmate portfolio manager.','https://tyrell-yutani.app/'],['Daharius Influence Tools','Asteroid and crewmate manager.','https://influence.daharius.com/AsteroidLookup/1'],['Influence Sales','Asteroid and crewmate market activity.','https://starksight.xyz/'],['Adalia.info','In-depth asteroid data and analysis.','https://adalia.info/'],['Asteroids Planner','Production chain planner.','https://influence.elerium.dev/asteroids-planner.html']];
var CX=500,CY=290,K=0.38;
function pos(p){var a=p.a*Math.PI/180;return [CX+Math.cos(a)*p.r*1.5,CY+Math.sin(a)*p.r*1.5*K];}
function rock(hex,s){return '<circle r="'+s+'" fill="'+hex+'"/><circle r="'+s+'" fill="url(#shade)"/>';}
function card(t,d,u,go){return '<a class="card" target="_blank" rel="noopener" href="'+u+'"><h3>'+t+'</h3><p>'+d+'</p><span class="go">'+go+' ↗</span></a>';}
function icon(k){var p=P[k];return '<svg viewBox="-50 -50 100 100" aria-hidden="true"><defs><radialGradient id="shade2" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs><circle r="44" fill="none" stroke="'+p.hex+'" stroke-opacity=".3" stroke-dasharray="3 5"/><circle r="26" fill="'+p.hex+'"/><circle r="26" fill="url(#shade2)"/></svg>';}

function home(){
  var rings='',places='',belt='';
  [150,230,300].forEach(function(r){rings+='<ellipse cx="'+CX+'" cy="'+CY+'" rx="'+r*1.5+'" ry="'+r*1.5*K+'" fill="none" stroke="#5fc3e4" stroke-opacity=".22" stroke-dasharray="2 6"/>';});
  for(var i=0;i<160;i++){var a=Math.random()*6.283,r=(185+Math.random()*25)*1.5;belt+='<circle cx="'+(CX+Math.cos(a)*r).toFixed(1)+'" cy="'+(CY+Math.sin(a)*r*K).toFixed(1)+'" r="'+(.6+Math.random()*1.5).toFixed(1)+'" fill="#9aa8bb" opacity="'+(.25+Math.random()*.5).toFixed(2)+'"/>';}
  Object.keys(P).forEach(function(k){var p=P[k],xy=pos(p),below=xy[1]>CY;
    places+='<g class="place" tabindex="0" role="link" aria-label="'+p.name+'" data-go="'+k+'" transform="translate('+xy[0].toFixed(0)+','+xy[1].toFixed(0)+')"><circle class="halo" r="'+(p.size+14)+'" fill="'+p.hex+'"/>'+rock(p.hex,p.size)+'<text text-anchor="middle" y="'+(below?p.size+20:-p.size-24)+'">'+p.name+'</text><text class="sub" text-anchor="middle" y="'+(below?p.size+36:-p.size-9)+'">'+p.sub+'</text></g>';});
  var sv='<svg viewBox="0 0 1000 580" role="img" aria-label="Map of the Academy: click a place to visit it"><defs><radialGradient id="sun"><stop offset="0" stop-color="#fffaf0"/><stop offset=".3" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></radialGradient><radialGradient id="shade" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs><circle cx="'+CX+'" cy="'+CY+'" r="90" fill="url(#sun)"/><circle cx="'+CX+'" cy="'+CY+'" r="18" fill="#fffaf0"/>'+rings+belt+'<g><circle r="3" fill="#cfe8ff"/><animateMotion class="mv" dur="30s" repeatCount="indefinite" path="M'+(CX+345)+','+CY+' a345,'+(345*K).toFixed(1)+' 0 1,1 -690,0 a345,'+(345*K).toFixed(1)+' 0 1,1 690,0"/></g>'+places+'</svg>';
  var btns='';Object.keys(P).forEach(function(k){btns+='<button style="--c:'+P[k].c+'" data-go="'+k+'"><b>'+P[k].name+'</b><span>'+P[k].sub+'</span></button>';});
  return '<div class="mapbox"><div class="hint">Pick a destination</div>'+sv+'<h1>ADALIA <span>ACADEMY</span></h1></div><div class="intro">'+btns+'</div><p class="about">INFLUENCE is an online strategy game set in Adalia, a star system with no habitable planets but a vast asteroid belt holding every mineral its colonists need. The Academy is a community school to help players find their way.</p>';
}
function page(k){
  var p=P[k],b='';
  if(k==='campus')b='<div class="chips"><span class="chip">Location <b>Adalia Academy</b></span><span class="chip">Size <b>2,427 km²</b></span><span class="chip">Type <b>Rare Main Belt · CMS</b></span><span class="chip">Chancellor <b>Professor Zakalwe Grey</b></span></div><p>Professor Grey welcomes you to Adalia Academy. The campus sits on its own Rare main-belt asteroid and is where every student’s education begins.</p>';
  if(k==='library')b='<p>The Library gives Academy members reference and source material through their studies and on into their careers in Adalia. Its academics share their latest research, including in-depth studies of how class efficiency bonuses and traits change the time or yield of each action.</p><div class="grid"><div class="card"><h3>The Historian</h3><p>Lore and records of the belt.</p></div><div class="card"><h3>The Librarians</h3><p>Research on class bonuses and crewmate traits.</p></div></div>';
  if(k==='guides')b='<p class="note">These guides were written for Testnet Phase 3 and may be out of date.</p><div class="grid">'+GUIDES.map(function(g){return card(g[0],g[1],'https://mire-limburger-8b4.notion.site/'+g[2],'Read');}).join('')+'</div>';
  if(k==='tutorials')b='<div class="card"><h3>Crewmate tutorial</h3><p>Coming soon, with more step-by-step lessons.</p></div>';
  if(k==='links')b='<div class="grid">'+LINKS.map(function(l){return card(l[0],l[1],l[2],l[2].split('/')[2]);}).join('')+'</div>';
  if(k==='command')b='<p>The Academy’s own player tool. Enter your wallet and it shows everything you run in the belt, live from the game: stock in your warehouses, today’s jobs, ships, crews, asteroids and trading.</p><p><a class="btn" href="https://your-command.adalia.academy/" target="_blank" rel="noopener">Open Your Command ↗</a></p>';
  return '<div class="page" style="--c:'+p.c+'"><div class="phead">'+icon(k)+'<div><h2>'+p.name+'</h2><p>'+p.sub+'</p></div></div>'+b+'</div>';
}
var main=document.getElementById('main'),cr=document.getElementById('crumbs');
function show(k){
  if(!P[k])k='home';
  main.innerHTML=k==='home'?home():page(k);
  cr.innerHTML=k==='home'?'':'<button data-go="home">← Map</button> › '+P[k].name;
  try{history.replaceState(null,'',k==='home'?location.pathname:'#'+k);}catch(e){}
  scrollTo(0,0);
}
document.addEventListener('click',function(e){var t=e.target.closest('[data-go]');if(t){e.preventDefault();show(t.getAttribute('data-go'));}});
document.addEventListener('keydown',function(e){var t=e.target.closest&&e.target.closest('.place');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();show(t.getAttribute('data-go'));}});
show(location.hash.slice(1)||'home');

var c=document.getElementById('stars'),x=c.getContext('2d'),st=[],w,h,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
function size(){w=c.width=innerWidth;h=c.height=innerHeight;st=[];for(var i=0;i<Math.round(w*h/6000);i++)st.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.3+.2,v:Math.random()*.15+.03,a:Math.random()*.7+.2});}
function draw(){x.clearRect(0,0,w,h);for(var i=0;i<st.length;i++){var p=st[i];x.globalAlpha=p.a;x.fillStyle='#cfe8ff';x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill();if(!still){p.x-=p.v;if(p.x<0)p.x=w;}}if(!still)requestAnimationFrame(draw);}
addEventListener('resize',function(){size();if(still)draw();});size();draw();
})();
