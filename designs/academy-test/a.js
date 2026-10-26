
(function(){
  // belt rocks around the star in the hero
  var g=document.getElementById('belt'),s='';
  for(var i=0;i<90;i++){var a=Math.random()*Math.PI*2,r=135+Math.random()*38;var x=200+Math.cos(a)*r,y=150+Math.sin(a)*r*0.365;s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(0.6+Math.random()*1.6).toFixed(1)+'" fill="#9aa8bb" opacity="'+(0.3+Math.random()*0.6).toFixed(2)+'"/>';}
  g.innerHTML=s;

  // drifting starfield, as on Your Command
  var c=document.getElementById('stars'),x=c.getContext('2d'),st=[],w,h;
  var still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size(){w=c.width=innerWidth;h=c.height=innerHeight;st=[];for(var i=0;i<Math.round(w*h/6000);i++)st.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.3+.2,v:Math.random()*.15+.03,a:Math.random()*.7+.2});}
  function draw(){x.clearRect(0,0,w,h);for(var i=0;i<st.length;i++){var p=st[i];x.globalAlpha=p.a;x.fillStyle='#cfe8ff';x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill();if(!still){p.x-=p.v;if(p.x<0)p.x=w;}}if(!still)requestAnimationFrame(draw);}
  addEventListener('resize',function(){size();if(still)draw();});size();draw();

  // highlight the menu item for the section in view
  var links=[].slice.call(document.querySelectorAll('#nav a'));
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)});}})},{rootMargin:'-45% 0px -50% 0px'});
  document.querySelectorAll('section[id]').forEach(function(s){io.observe(s)});
})();
