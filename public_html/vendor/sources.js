/* Where can I get it? (Mark, 7 Nov 2026) – one shared helper for every page that says "fly it in":
   which of your OTHER rocks hold it in stock, or can mine it.
   window.YICSRC(productId, amount, exceptRockId) → {stock:[{id,name,have}], mine:[{id,name}]}
   window.YICSRCTXT(productId, amount, exceptRockId) → short text, e.g. "mine it on Argathos" ('' when none). */
(function(){
  const BETA=/[?&]beta=1/.test(location.search);
  const Y=()=>window.YIC||{};
  const mineOn=(a,r)=>{const c=a.Celestial||{},y=Y();if((c.scanStatus||0)>=4&&c.abundances&&y.astAbund)return(y.astAbund(c.abundances)[r]||0)>0;
    const sp=(y.SPEC||{})[c.celestialType];return!!(sp&&sp[1].includes(+r))};
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,ch=>'&#'+ch.charCodeAt(0)+';');
  window.YICSRC=function(id,q,except){id=String(id);q=+q||0;const y=Y(),asts=y.asts||[],tot=y.tot||[],D=y.D||{};
    const stock=[];asts.forEach((a,i)=>{if(a.id===except)return;const h=(tot[i]||{})[id]||0;if(h>0)stock.push({id:a.id,name:a.name,have:h})});
    stock.sort((x,z)=>(z.have>=q)-(x.have>=q)||z.have-x.have);
    const mine=+id<=22?(D.owned||[]).filter(a=>a.id!==except&&mineOn(a,id)).map(a=>({id:a.id,name:(a.Name&&a.Name.name)||('Asteroid #'+a.id)})):[];
    return{stock,mine}};
  /* text: a rock with enough in stock first, then a rock that mines it, then the biggest part stock */
  window.YICSRCTXT=function(id,q,except){if(!BETA)return'';const s=window.YICSRC(id,q,except),full=s.stock.find(x=>x.have>=q*0.999);
    if(full)return'in stock on '+esc(full.name);
    if(s.mine.length)return'mine it on '+esc(s.mine[0].name)+(s.mine.length>1?' (+'+(s.mine.length-1)+' more)':'');
    if(s.stock.length)return'some on '+esc(s.stock[0].name);
    return''};
})();
