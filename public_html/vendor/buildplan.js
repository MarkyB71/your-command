/* Building planner for Your Influence Command (Planners › Building planner).
   Pick an asteroid + a building: shows the materials it needs, what you already hold on that asteroid,
   and the nearest of your other asteroids that has the rest.
   Building recipes from @influenceth/sdk 2.7.2 (Apache-2.0, (c) Unstoppable Games, Inc.). */
const BLDS={"1":["Warehouse",{"44":400000,"69":350000,"70":200000}],"2":["Extractor",{"44":250000,"69":300000,"125":3000,"237":1,"243":6}],"3":["Refinery",{"44":600000,"69":300000,"70":200000,"104":2,"237":12,"238":2,"240":2,"243":16,"244":4}],"4":["Bioreactor",{"24":1400000,"41":300000,"44":500000,"56":300000,"69":100000,"70":300000,"74":25000,"180":125000,"237":16,"238":12,"240":3,"243":8}],"5":["Factory",{"44":900000,"69":1100000,"70":700000,"237":4,"238":40,"240":8,"243":20,"244":6}],"6":["Shipyard",{"44":1500000,"69":2000000,"70":1000000,"237":8,"238":60,"240":10,"243":24,"244":6}],"7":["Spaceport",{"44":3000000,"69":1600000,"70":2500000,"101":200000,"237":50,"238":180,"240":40,"243":150,"244":60}],"8":["Marketplace",{"44":3000000,"69":2500000,"70":3000000,"101":500000,"133":6,"235":80,"240":160,"243":60,"244":40}],"9":["Habitat",{"24":300000,"44":5000000,"56":200000,"69":4000000,"70":5000000,"101":1000000,"133":12,"235":240,"240":200,"243":240,"244":320}],"10":["Tank Farm",{"44":200000,"69":50000,"70":50000,"171":200000,"237":2}]};
const BETA=/[?&]beta=1/.test(location.search); /* TEST: only on ?beta=1 for now */
const S={ast:null,bld:9};
let run=0;const memo={};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tkg=n=>{const a=Math.abs(n);if(a>=1e6){const k=n/1e6;return (Math.abs(k)>=100?Math.round(k):+k.toFixed(2)).toLocaleString()+' kt'}if(a>=1000){const t=n/1000;return (Math.abs(t)>=100?Math.round(t):+t.toFixed(1)).toLocaleString()+' t'}return Math.round(n).toLocaleString()+' kg'};
const CSS=`#bpw .bp-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:4px 0 12px}
#bpw .bp-bar select{font-size:15px;padding:5px 8px}
#bpw .bp-sum{font-size:16px;margin:0 0 12px}
#bpw td img{width:30px;height:30px;object-fit:contain;vertical-align:middle;margin-right:8px}
#bpw .ok{color:#5fd38d;font-weight:600}#bpw .part{color:#ffb547;font-weight:600}#bpw .none{color:#ff6b6b;font-weight:600}
#bpw .a{color:#8b9ab0;font-size:12px}#bpw .bp-hd{display:flex;align-items:center;gap:12px;margin:0 0 10px}
#bpw .bp-hd img{width:64px;height:48px;object-fit:contain}`;

function asteroids(){
  const Y=window.YIC,D=Y.D||{},out=[],seen={};
  (Y.asts||[]).forEach((a,i)=>{if(a.id&&!seen[a.id]){seen[a.id]=1;out.push({id:a.id,name:a.name,i})}});
  (D.owned||[]).forEach(a=>{if(!seen[a.id]){seen[a.id]=1;out.push({id:a.id,name:(a.Name&&a.Name.name)||('Asteroid #'+a.id),i:null})}});
  return out.sort((x,y)=>x.name.localeCompare(y.name));
}

export function drawBuildPlan(m){
  const Y=window.YIC;if(!Y)return;
  const D=Y.D||{},PX=D.products||{},A=asteroids(),me=++run;
  if(!A.length){m.innerHTML='<div class="note">No asteroids found for this wallet.</div>';return}
  if(S.ast===null||!A.find(a=>a.id===S.ast)){const s=document.getElementById('ast'),v=s&&s.value!==''?(Y.asts[+s.value]||{}).id:null;S.ast=v||A[0].id}
  const here=A.find(a=>a.id===S.ast),stk=here.i===null?{}:(Y.tot[here.i]||{});
  const isCnt=id=>!!(PX[id]&&PX[id][3]),kgOf=(id,n)=>n*((PX[id]&&PX[id][2])||1000)/1000;
  const amt=(id,n)=>isCnt(id)?Math.round(n).toLocaleString():tkg(kgOf(id,n));
  const nm=id=>(PX[id]&&PX[id][0])||('Product '+id);
  const [bName,inp]=BLDS[S.bld];
  const rows=Object.keys(inp).map(id=>{const need=inp[id],have=stk[id]||0,short=Math.max(0,need-have);
    const others=A.filter(a=>a.id!==S.ast&&a.i!==null&&(Y.tot[a.i]||{})[id]>0).map(a=>({a,have:Y.tot[a.i][id]}));
    return{id,need,have,short,others}}).sort((x,y)=>(y.short>0)-(x.short>0)||nm(x.id).localeCompare(nm(y.id)));
  const done=rows.filter(r=>!r.short).length;
  let h='<style>'+CSS+'</style><div id="bpw"><div class="bp-bar">Build on <select id="bpA">'+A.map(a=>'<option value="'+a.id+'"'+(a.id===S.ast?' selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select> a <select id="bpB">'+
    Object.keys(BLDS).sort((x,y)=>BLDS[x][0].localeCompare(BLDS[y][0])).map(k=>'<option value="'+k+'"'+(+k===S.bld?' selected':'')+'>'+esc(BLDS[k][0])+'</option>').join('')+'</select></div>'+
    '<div class="bp-hd"><img src="bimg.php?t='+S.bld+'" alt="" data-hide><div class="bp-sum"><b>'+esc(bName)+'</b> on <b>'+esc(here.name)+'</b>: '+
    (done===rows.length?'<span class="ok">✓ you have everything on this asteroid</span>':'<span class="'+(done?'part':'none')+'">'+done+' of '+rows.length+' materials covered here</span>')+'</div></div>'+
    '<div class="wrap"><table><thead><tr><th>Material</th><th class="num">Needed</th><th class="num">On '+esc(here.name)+'</th><th class="num">Still needed</th><th>Nearest asteroid of yours that has it</th></tr></thead><tbody>'+
    rows.map(r=>'<tr><td><img src="rimg.php?p='+r.id+'" alt="" data-hide>'+esc(nm(r.id))+'</td><td class="num">'+amt(r.id,r.need)+'</td>'+
      '<td class="num"><span class="'+(r.have>=r.need?'ok':r.have>0?'part':'none')+'">'+(r.have>0?amt(r.id,r.have):'None')+'</span></td>'+
      '<td class="num">'+(r.short?'<b>'+amt(r.id,r.short)+'</b>':'<span class="ok">✓</span>')+'</td>'+
      '<td data-near="'+r.id+'">'+(!r.short?'<span class="a">–</span>':r.others.length?'<span class="a">working out…</span>':'<span class="none">None of your asteroids has it</span>')+'</td></tr>').join('')+
    '</tbody></table></div><div class="note" style="padding:10px 0 0">Stock = what is in your warehouses and tank farms. Nearest = closest of your asteroids right now that holds the rest (or the most of it). Flight time is for a standard Light Transport, full tank, carrying the missing amount (up to 2,000 t), leaving now, no crew bonus.</div></div>';
  m.innerHTML=h;
  m.querySelector('#bpA').onchange=e=>{S.ast=+e.target.value;drawBuildPlan(m)};
  m.querySelector('#bpB').onchange=e=>{S.bld=+e.target.value;drawBuildPlan(m)};

  const need=rows.filter(r=>r.short&&r.others.length);if(!need.length)return;
  const ids=[...new Set([S.ast,...need.flatMap(r=>r.others.map(o=>o.a.id))])];
  Promise.all([fetch('orbits.php?ids='+ids.slice(0,200).join(',')).then(r=>r.json()).catch(()=>({})),import('./travel.js?v='+(Y.VER||1))]).then(async([j,T])=>{
    const O=j.orbits||{},to=O[S.ast],now=(Date.now()/1000-1609459200)/3600,AU=1.495978707e11;
    for(const r of need){
      if(me!==run)return;const td=m.querySelector('td[data-near="'+r.id+'"]');if(!td)continue;
      const L=r.others.map(o=>({...o,d:to&&O[o.a.id]?T.distance(O[o.a.id].o,to.o,now)/AU:Infinity})).sort((x,y)=>x.d-y.d);
      const b=L.find(o=>o.have>=r.short)||L.slice().sort((x,y)=>y.have-x.have)[0],full=b.have>=r.short;
      let fl='';
      if(to&&O[b.a.id]){const kg=Math.min(kgOf(r.id,Math.min(r.short,b.have)),2e6),k=b.a.id+'>'+S.ast+'>'+Math.round(kg/1e5)+'>'+Math.floor(now);
        if(!(k in memo)){const ship=T.SHIPS[2];const f=await T.fastest(O[b.a.id].o,to.o,now,T.maxDeltaV(2,1,1,kg,ship[2]/1000));memo[k]=f?f.tof:0;await new Promise(z=>setTimeout(z,0))}
        fl=memo[k]?' · <b>'+memo[k]+' h</b> by Light Transport':' · out of range for a Light Transport'}
      if(me!==run||!td.isConnected)return;
      td.innerHTML='<b>'+esc(b.a.name)+'</b> <span class="'+(full?'ok':'part')+'">has '+amt(r.id,b.have)+(full?'':' (not all)')+'</span><br><span class="a">'+(isFinite(b.d)?b.d.toFixed(2)+' AU away now':'distance unknown')+fl+(L.length>1?' · also on '+L.filter(o=>o!==b).map(o=>esc(o.a.name)).join(', '):'')+'</span>';
    }
  }).catch(()=>{m.querySelectorAll('td[data-near]').forEach(td=>{if(/working/.test(td.textContent))td.innerHTML='<span class="a">Couldn\'t work out distances</span>'})});
}

/* Adds "Building planner" to the Planners menu, after Travel (TEST: ?beta=1 only) */
if(BETA){
  const hook=()=>{
    const vr=document.getElementById('vR'),main=document.getElementById('main');
    if(!vr||!main||!window.YIC||document.getElementById('vU'))return;
    const b=document.createElement('button');b.id='vU';b.textContent='Building planner';vr.after(b);
    b.addEventListener('click',()=>{
      document.querySelectorAll('button.on').forEach(x=>x.classList.remove('on'));try{window.YIC.view='M'}catch(e){}
      b.className='on';drawBuildPlan(main)});
  };
  document.addEventListener('click',e=>{const b=document.getElementById('vU'),t=e.target.closest&&e.target.closest('button[id^="v"]');if(b&&t&&t!==b)b.className=''},true);
  setInterval(hook,700);
}
