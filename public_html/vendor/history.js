/* Activity log: everything your crews have done, newest first. Read-only, from the game's own activity records (history.php). */
const BETA=/[?&]beta=1(&|$)/.test(location.search);
const CSS=`.hl-title{font-size:22px;margin:4px 0 6px;color:#8fe3ff}
.hl-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0 12px}
.hl-bar select,.hl-bar input,.hl-bar button{font-size:15px;padding:6px 10px}
.hl-day{margin:16px 0 6px;font-size:14px;color:#8b9ab0;font-weight:600;border-bottom:1px solid #2a3648;padding-bottom:4px}
.hl-row{display:grid;grid-template-columns:62px 28px minmax(0,1fr) minmax(120px,220px);gap:10px;align-items:start;padding:7px 4px;border-bottom:1px solid #151d29;font-size:15px}
.hl-row:hover{background:#0f141c}
.hl-tm{color:#8b9ab0;font-variant-numeric:tabular-nums}
.hl-ic{font-size:17px;line-height:1.2;text-align:center}
.hl-what b{color:#e6ebf2}
.hl-what .s{color:#8b9ab0;font-size:13px}
.hl-crew{color:#8fe3ff;font-size:13px;text-align:right;overflow:hidden;text-overflow:ellipsis}
.hl-more{margin:14px 0}`;
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS=[
  ['trade','Trades and orders','🪙',n=>/Order|Purchased|Exchange|Swap|Sale/i.test(n)],
  ['deliv','Deliveries','📦',n=>/Delivery|Transfer$/i.test(n)],
  ['mine','Mining and samples','⛏️',n=>/Extraction|Sampling|Deposit/i.test(n)],
  ['make','Refining and making','🏭',n=>/Processing|Assembly|Integration/i.test(n)],
  ['build','Building','🏗️',n=>/Construction|Repossessed/i.test(n)],
  ['ship','Ships and travel','🚀',n=>/Ship|Transit|Docked|Undocked|Propellant/i.test(n)],
  ['crew','Crew','👥',n=>/Crew|Food|Recruited|Name/i.test(n)],
  ['lease','Leases and permissions','📜',n=>/Agreement|Policy|Whitelist|Permission/i.test(n)],
  ['other','Other','•',()=>true]];
const cat=n=>CATS.find(c=>c[3](n));
const words=n=>n.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase()).toLowerCase().replace(/^./,c=>c.toUpperCase());
let H=null,load=null;const S={cat:'',q:'',crew:'',show:300};

export function drawHistory(m){
  if(!document.getElementById('hl-css')){const st=el('style');st.id='hl-css';st.textContent=CSS;document.head.appendChild(st)}
  const Y=window.YIC;let D;try{D=Y.D}catch(e){}
  if(!D){m.innerHTML='<div class="note">Still loading your data…</div>';return}
  let pf=null,pn=null;try{pf=Y.pfmt;pn=Y.pn}catch(e){}
  const pName=p=>pn?pn(p):'Product '+p,pAmt=(p,a)=>{try{return pf?pf(p,a):String(a)}catch(e){return String(a)}};
  const crewName={};(D.crewList||[]).forEach(c=>crewName[c.id]=c.name);
  const bName={};(D.allB||[]).forEach(b=>{const nm=(b.Name&&b.Name.name)||null;if(nm)bName[b.id]=nm});
  const sName={};(D.ships||[]).forEach(s=>sName[s.id]=s.name);
  const ast={};(Y.asts||[]).forEach(a=>{});
  const ent=e=>{if(!e||typeof e!=='object'||e.label==null)return null;const id=e.id;
    switch(+e.label){case 1:return crewName[id]||('Crew #'+id);case 2:return 'Crewmate #'+id;case 3:return 'Asteroid #'+id;
      case 4:return 'Lot '+Math.floor(id/4294967296);case 5:return bName[id]||('Building #'+id);case 6:return sName[id]||('Ship #'+id);
      case 7:return 'Order';case 9:return 'Delivery #'+id;default:return '#'+id}};
  const prods=v=>(v.products||[]).map(x=>'<b>'+esc(pAmt(x.product,x.amount))+' '+esc(pName(x.product))+'</b>').join(', ');
  function describe(r){
    const v=r.v||{},n=r.n;
    const p=v.product!=null?'<b>'+esc(pAmt(v.product,v.amount||0))+' '+esc(pName(v.product))+'</b>':'';
    switch(n){
      case 'DeliverySent':return 'Sent '+prods(v)+' from '+esc(ent(v.origin))+' to '+esc(ent(v.dest));
      case 'DeliveryReceived':return 'Received '+prods(v)+' at '+esc(ent(v.dest))+' <span class="s">from '+esc(ent(v.origin))+'</span>';
      case 'ResourceExtractionStarted':return 'Started mining '+(p||esc(pName(v.resource))+(v.yield?' ('+esc(pAmt(v.resource,v.yield))+')':''))+(v.extractor?' at '+esc(ent(v.extractor)):'');
      case 'ResourceExtractionFinished':return 'Finished mining '+(v.resource?'<b>'+esc(pAmt(v.resource,v.yield||0))+' '+esc(pName(v.resource))+'</b>':p)+(v.destination?' → '+esc(ent(v.destination)):'');
      case 'MaterialProcessingStarted':case 'MaterialProcessingFinished':return (n.endsWith('Started')?'Started':'Finished')+' processing'+(v.process?' (process #'+esc(v.process)+')':'')+(v.processor?' at '+esc(ent(v.processor)):'');
      case 'SamplingDepositStarted':return 'Started a core sample'+(v.resource?' for '+esc(pName(v.resource)):'')+(v.lot?' on '+esc(ent(v.lot)):'');
      case 'SamplingDepositFinished':return 'Core sample finished'+(v.initialYield?' – <b>'+esc(pAmt(v.resource||0,v.initialYield))+'</b>':'');
      case 'SellOrderFilled':return 'Sold '+(p||'goods')+(v.price!=null?' <span class="s">at '+esc((v.price/1e6).toLocaleString())+' SWAY each</span>':'')+(v.buyerCrew?' to '+esc(ent(v.buyerCrew)):'');
      case 'BuyOrderFilled':return 'Bought '+(p||'goods')+(v.price!=null?' <span class="s">at '+esc((v.price/1e6).toLocaleString())+' SWAY each</span>':'');
      case 'SellOrderCreated':return 'Listed '+(p||'goods')+' for sale'+(v.price!=null?' <span class="s">at '+esc((v.price/1e6).toLocaleString())+' SWAY each</span>':'');
      case 'SellOrderCancelled':return 'Cancelled a sell order'+(p?' for '+p:'');
      case 'TransitStarted':return 'Set off from '+esc(ent(v.origin))+' to '+esc(ent(v.destination))+(v.ship?' <span class="s">('+esc(ent(v.ship))+')</span>':'');
      case 'TransitFinished':return 'Arrived at '+esc(ent(v.destination))+(v.ship?' <span class="s">('+esc(ent(v.ship))+')</span>':'');
      case 'ShipDocked':return esc(ent(v.ship)||'Ship')+' docked'+(v.dock?' at '+esc(ent(v.dock)):'');
      case 'ShipUndocked':return esc(ent(v.ship)||'Ship')+' undocked';
      case 'FoodSupplied':return 'Fed the crew'+(v.food?' <span class="s">('+esc(pAmt(129,v.food))+' food)</span>':'');
      case 'CrewStationed':return 'Crew moved to '+esc(ent(v.station));
      case 'CrewmatesExchanged':return 'Swapped crewmates between '+esc(ent(v.crew1))+' and '+esc(ent(v.crew2));
      case 'ConstructionPlanned':return 'Planned a '+esc(['','Warehouse','Extractor','Refinery','Bioreactor','Factory','Shipyard','Spaceport','Marketplace','Habitat','Tank Farm'][v.buildingType]||'building')+(v.lot?' on '+esc(ent(v.lot)):'');
      case 'ConstructionStarted':case 'ConstructionFinished':case 'ConstructionAbandoned':case 'ConstructionDeconstructed':return words(n)+' – '+esc(ent(v.building)||'building');
      case 'NameChanged':return 'Renamed '+esc(ent(v.entity))+(v.newName?' to <b>'+esc(v.newName)+'</b>':'');
      case 'Transfer':return 'NFT transfer'+(v.tokenId?' <span class="s">(#'+esc(v.tokenId)+')</span>':'');
    }
    const bits=Object.entries(v).map(([k,x])=>{const e=ent(x);if(e)return esc(k)+': '+esc(e);if(typeof x==='number'||typeof x==='string')return esc(k)+': '+esc(x);return null}).filter(Boolean).slice(0,4);
    return words(n)+(bits.length?' <span class="s">('+bits.join(' · ')+')</span>':'')}

  function draw(){
    m.innerHTML='';
    m.appendChild(el('h2','hl-title','Activity log'));
    if(!H){m.appendChild(el('div','note','Loading your crews\' history from the game… (this can take up to a minute the first time)'));return}
    if(H.error){m.appendChild(el('div','note','Could not load the history: '+esc(H.error)));return}
    m.appendChild(el('div','note','Everything your crews have done, newest first – the latest 100 actions for each crew, straight from the game\'s records. Times are in your local time.'));
    const bar=el('div','hl-bar'),cs=el('select'),cr=el('select'),q=el('input');
    const rows=H.rows||[];const cnt={};rows.forEach(r=>{const c=cat(r.n)[0];cnt[c]=(cnt[c]||0)+1});
    cs.innerHTML='<option value="">All actions ('+rows.length.toLocaleString()+')</option>'+CATS.filter(c=>cnt[c[0]]).map(c=>'<option value="'+c[0]+'"'+(S.cat===c[0]?' selected':'')+'>'+c[2]+' '+esc(c[1])+' ('+cnt[c[0]].toLocaleString()+')</option>').join('');
    const crews=[...new Set(rows.map(r=>r.c))].map(id=>[id,crewName[id]||('Crew #'+id)]).sort((a,b)=>a[1].localeCompare(b[1]));
    cr.innerHTML='<option value="">All crews</option>'+crews.map(([id,n])=>'<option value="'+id+'"'+(String(S.crew)===String(id)?' selected':'')+'>'+esc(n)+'</option>').join('');
    q.placeholder='Search the log';q.value=S.q;
    cs.addEventListener('change',()=>{S.cat=cs.value;S.show=300;draw()});cr.addEventListener('change',()=>{S.crew=cr.value;S.show=300;draw()});
    q.addEventListener('input',()=>{S.q=q.value;S.show=300;const p=q.selectionStart;draw();const n=m.querySelector('.hl-bar input');n.focus();n.setSelectionRange(p,p)});
    [cs,cr,q].forEach(x=>bar.appendChild(x));m.appendChild(bar);
    const qq=S.q.trim().toLowerCase();
    const list=[];for(const r of rows){if(S.cat&&cat(r.n)[0]!==S.cat)continue;if(S.crew&&String(r.c)!==String(S.crew))continue;
      const d=describe(r);if(qq&&!(d.replace(/<[^>]+>/g,'')+' '+(crewName[r.c]||'')+' '+r.n).toLowerCase().includes(qq))continue;list.push([r,d])}
    if(!list.length){m.appendChild(el('div','note','Nothing matches.'));return}
    let day='';const box=el('div');
    list.slice(0,S.show).forEach(([r,d])=>{const dt=new Date(r.t*1000),dy=dt.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'});
      if(dy!==day){day=dy;box.appendChild(el('div','hl-day',esc(dy)))}
      box.appendChild(el('div','hl-row','<span class="hl-tm">'+dt.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})+'</span><span class="hl-ic" title="'+esc(cat(r.n)[1])+'">'+cat(r.n)[2]+'</span><span class="hl-what">'+d+'</span><span class="hl-crew">'+esc(crewName[r.c]||('Crew #'+r.c))+'</span>'))});
    m.appendChild(box);
    if(list.length>S.show){const b=el('button','hl-more','Show more ('+(list.length-S.show).toLocaleString()+' left)');b.addEventListener('click',()=>{S.show+=500;draw()});m.appendChild(b)}
  }
  draw();
  if(!H&&!load)load=fetch('history.php?wallet='+encodeURIComponent(D.wallet||''),{cache:'no-store'}).then(r=>r.json()).then(j=>{H=j}).catch(e=>{H={error:String(e)}}).finally(()=>{load=null;const b=document.getElementById('vJ');if(b&&b.className==='on')drawHistory(document.getElementById('main'))});
}

/* Beta: adds "Activity log" to the bottom of the Logistics menu */
if(BETA){
  const hook=()=>{
    const r=document.getElementById('vR'),main=document.getElementById('main');
    if(!r||!main||document.getElementById('vJ'))return;
    const b=document.createElement('button');b.id='vJ';b.textContent='Activity log';r.after(b);
    b.addEventListener('click',()=>{document.querySelectorAll('button.on').forEach(x=>x.classList.remove('on'));b.className='on';drawHistory(main)});
  };
  document.addEventListener('click',e=>{const b=document.getElementById('vJ'),t=e.target.closest&&e.target.closest('button[id^="v"]');if(b&&t&&t!==b)b.className=''},true);
  setInterval(hook,700);
}
