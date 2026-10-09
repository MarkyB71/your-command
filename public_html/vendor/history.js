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
  const aName={1:'Adalia Prime'};(D.owned||[]).forEach(a=>{if(a.Name&&a.Name.name)aName[a.id]=a.Name.name});
  const mine=new Set((D.crewList||[]).map(c=>c.id));
  const sway=(price,amount)=>{const s=price*(amount||1)/1e6;return (s>=100?Math.round(s):+s.toFixed(2)).toLocaleString()+' SWAY'};
  const ent=e=>{if(!e||typeof e!=='object'||e.label==null)return null;const id=e.id;
    switch(+e.label){case 1:return crewName[id]||('Crew #'+id);case 2:return 'Crewmate #'+id;case 3:return aName[id]||('Asteroid #'+id);
      case 4:{const a=id%4294967296;return 'Lot '+Math.floor(id/4294967296)+(aName[a]?' on '+aName[a]:'')}case 5:return bName[id]||('Building #'+id);case 6:return sName[id]||('Ship #'+id);
      case 7:return 'Deposit #'+id;case 9:return 'Delivery #'+id;default:return '#'+id}};
  const prods=v=>(v.products||[]).map(x=>'<b>'+esc(pAmt(x.product,x.amount))+' '+esc(pName(x.product))+'</b>').join(', ');
  function describe(r){
    const v=r.v||{},n=r.n;
    const p=v.product!=null?'<b>'+esc(pAmt(v.product,v.amount||0))+' '+esc(pName(v.product))+'</b>':'';
    switch(n){
      case 'DeliverySent':return 'Sent '+prods(v)+' from '+esc(ent(v.origin))+' to '+esc(ent(v.dest));
      case 'DeliveryReceived':return 'Received '+prods(v)+' at '+esc(ent(v.dest))+' <span class="s">from '+esc(ent(v.origin))+'</span>';
      case 'ResourceExtractionStarted':return 'Started mining '+(p||esc(pName(v.resource))+(v.yield?' ('+esc(pAmt(v.resource,v.yield))+')':''))+(v.extractor?' at '+esc(ent(v.extractor)):'');
      case 'ResourceExtractionFinished':return 'Finished mining '+(v.resource?'<b>'+esc(pAmt(v.resource,v.yield||0))+' '+esc(pName(v.resource))+'</b>':p)+(v.destination?' → '+esc(ent(v.destination)):'');
      case 'MaterialProcessingStarted':{const io=a=>(a||[]).map(x=>'<b>'+esc(pAmt(x.product,x.amount))+' '+esc(pName(x.product))+'</b>').join(', ');
        return 'Started making '+(io(v.outputs)||'something')+(v.inputs&&v.inputs.length?' <span class="s">from '+io(v.inputs).replace(/<\/?b>/g,'')+'</span>':'')+(v.processor?' at '+esc(ent(v.processor)):'')}
      case 'MaterialProcessingFinished':return 'Finished processing'+(v.processor?' at '+esc(ent(v.processor)):'');
      case 'SamplingDepositStarted':return 'Started a core sample'+(v.resource?' for '+esc(pName(v.resource)):'')+(v.lot?' on '+esc(ent(v.lot)):'');
      case 'SamplingDepositFinished':return 'Core sample finished'+(v.initialYield?' – <b>'+esc(pAmt(1,v.initialYield))+'</b> found':'');
      case 'SellOrderFilled':{const sold=mine.has(v.sellerCrew&&v.sellerCrew.id)&&!mine.has(v.callerCrew&&v.callerCrew.id);
        return (sold?'Sold ':'Bought ')+(p||'goods')+(v.price!=null?' for <b>'+esc(sway(v.price,v.amount))+'</b>':'')+' <span class="s">'+(sold?'to '+esc(ent(v.callerCrew)):'from '+esc(ent(v.sellerCrew)))+(v.exchange?' at '+esc(ent(v.exchange)):'')+'</span>'}
      case 'BuyOrderFilled':return 'Bought '+(p||'goods')+(v.price!=null?' <span class="s">at '+esc((v.price/1e6).toLocaleString())+' SWAY each</span>':'');
      case 'SellOrderCreated':return 'Listed '+(p||'goods')+' for sale'+(v.price!=null?' – <b>'+esc(sway(v.price,v.amount))+'</b> in total':'')+(v.exchange?' <span class="s">at '+esc(ent(v.exchange))+'</span>':'');
      case 'DepositPurchased':return 'Bought a core sample'+(v.price!=null?' for <b>'+esc(sway(v.price))+'</b>':'')+(v.sellerCrew?' <span class="s">from '+esc(ent(v.sellerCrew))+'</span>':'');
      case 'SellOrderCancelled':return 'Cancelled a sell order'+(p?' for '+p:'');
      case 'TransitStarted':return esc(ent(v.ship)||'Ship')+' set off from '+esc(ent(v.origin))+' to <b>'+esc(ent(v.destination))+'</b>'+(v.finishTime?' <span class="s">arrives '+esc(new Date(v.finishTime*1000).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))+'</span>':'');
      case 'TransitFinished':return esc(ent(v.ship)||'Ship')+' arrived at <b>'+esc(ent(v.destination))+'</b> <span class="s">from '+esc(ent(v.origin))+'</span>';
      case 'ShipDocked':return esc(ent(v.ship)||'Ship')+' docked'+(v.dock?' at '+esc(ent(v.dock)):'');
      case 'ShipUndocked':return esc(ent(v.ship)||'Ship')+' undocked';
      case 'FoodSupplied':return 'Fed the crew <b>'+esc(pAmt(129,v.food||0))+' food</b>'+(v.origin?' <span class="s">from '+esc(ent(v.origin))+'</span>':'');
      case 'CrewStationed':return 'Crew moved to <b>'+esc(ent(v.destinationStation||v.station))+'</b>'+(v.originStation?' <span class="s">from '+esc(ent(v.originStation))+'</span>':'');
      case 'CrewEjected':return esc(ent(v.ejectedCrew)||'Crew')+' left '+esc(ent(v.station));
      case 'EmergencyPropellantCollected':return 'Collected emergency propellant <b>'+esc(pAmt(170,v.amount||0))+'</b>';
      case 'ShipCommandeered':return 'Took command of '+esc(ent(v.ship));
      case 'RandomEventResolved':return 'Dealt with a random event'+(v.actionTarget?' at '+esc(ent(v.actionTarget)):'');
      case 'PrepaidAgreementAccepted':case 'PrepaidAgreementExtended':return (n.endsWith('Extended')?'Extended':'Took')+' a lease on <b>'+esc(ent(v.target))+'</b>'+(v.term?' <span class="s">for '+Math.round(v.term/86400)+' days</span>':'');
      case 'PrepaidAgreementTransferred':return 'Lease on <b>'+esc(ent(v.target))+'</b> passed to '+esc(ent(v.permitted))+(v.oldPermitted?' <span class="s">from '+esc(ent(v.oldPermitted))+'</span>':'');
      case 'CrewmatesExchanged':return 'Swapped crewmates between '+esc(ent(v.crew1))+' and '+esc(ent(v.crew2));
      case 'ConstructionPlanned':return 'Planned '+esc(['a building','a Warehouse','an Extractor','a Refinery','a Bioreactor','a Factory','a Shipyard','a Spaceport','a Marketplace','a Habitat','a Tank Farm'][v.buildingType]||'a building')+(v.lot?' on '+esc(ent(v.lot)):'');
      case 'ConstructionStarted':case 'ConstructionFinished':case 'ConstructionAbandoned':case 'ConstructionDeconstructed':return words(n)+' – '+esc(ent(v.building)||'building');
      case 'NameChanged':return 'Named '+esc((v.entity&&v.entity.label==5?'building':v.entity&&v.entity.label==6?'ship':v.entity&&v.entity.label==1?'crew':'something'))+' <b>'+esc(v.name||v.newName||'')+'</b>';
      case 'CrewmateRecruited':return 'Recruited <b>'+esc(v.name||('Crewmate #'+(v.crewmate&&v.crewmate.id)))+'</b>';
      case 'BuildingRepossessed':return 'Repossessed '+esc(ent(v.building));
      case 'Transfer':return (/^0x0+$/.test(v.from||'')?'New crew created':'Crew NFT transferred')+(v.tokenId?' <span class="s">(Crew #'+esc(v.tokenId)+')</span>':'');
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
    const crews=[...new Set(rows.map(r=>r.c))].map(id=>[id,crewName[id]||('Crew #'+id)]).sort((a,b)=>{const ua=/^Crew #\d+$/.test(a[1]),ub=/^Crew #\d+$/.test(b[1]);return ua!==ub?(ua?1:-1):ua?a[0]-b[0]:a[1].localeCompare(b[1])}); /* named crews first, unnamed ones at the bottom */
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
