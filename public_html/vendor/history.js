/* Activity log: everything your crews have done, newest first. Read-only, from the game's own activity records (history.php). */
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
.hl-more{margin:14px 0}
.hl-tabs{display:flex;gap:6px;margin:4px 0 8px}
.hl-tabs button{padding:6px 14px;border-radius:6px;border:1px solid #5fc3e4;background:#14202c;color:#8fe3ff;cursor:pointer;font-weight:bold;font-size:14px}
.hl-tabs button.on{background:#5fc3e4;color:#05070a}
.hl-me td{background:rgba(95,195,228,.08)}`;
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Adalia stardate (Mark, 10 Nov 2026 – Captain's log): the game's own clock in Adalian days, as the game client works it out
   (@influenceth/sdk Time: zero at 1618668000, 24× time, so 1 Adalian day = 1 real hour). */
const SD=(t,dp)=>((t-1618668000)/3600).toLocaleString(undefined,{minimumFractionDigits:dp,maximumFractionDigits:dp});
window.YICstardate=SD;
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
const HC={},LD={};let HT=0;const S={cat:'',q:'',crew:'',show:300,range:'100',belt:false,bq:''};
/* Whole belt – ships in flight now (community idea, Mark 15 Nov 2026 – TEST ONLY, ?beta=1). From flights.php: every ship in
   flight across the belt (Escape Modules too), shared by all visitors and rebuilt at most every 5 minutes. */
const BELT=true; /* LIVE 15 Nov 2026 (tested on ?beta=1 – Mark) */let FL=null,FLL=null;
document.addEventListener('yic-refresh',()=>{FL=null;FP=null});
/* DAA (community idea, Mark 21 Nov 2026 – LIVE): a "Departures and Arrivals" tab – who left and who landed across the
   whole belt in the last 7 days, newest first. Landed ships come from flights.php?past=1 (the game keeps a ship's last trip until it flies again). */
const DAA=true; /* LIVE 21 Nov 2026 (tested on ?beta=1 – Mark) */let FP=null,FPL=null; /* RFX (LIVE 20 Nov): ⟳ Refresh Game Data fetches belt flights again */
/* CNB (Fristy, community request – Mark 24 Nov 2026, TEST ONLY ?beta=1): other players' crew names in Belt flights (flights.php 'crews') */
const CNB=/[?&]beta=1\b/.test(location.search);
const STYPE={1:'Escape Module',2:'Light Transport',3:'Heavy Transport',4:'Shuttle'};
const RANGES=[['100','Latest 100 per crew'],['7','Last 7 days'],['30','Last 30 days'],['90','Last 90 days'],['all','Everything']];

export function drawHistory(m,opt){opt=opt||{}; /* opt.into: drawn somewhere else (Captain's log on the Bridge, Mark 10 Nov – beta); opt.noTitle: no heading */
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
  // Name + game link (needs the extension, via vendor/gamelinks.js)
  const GP={1:'/crew/',2:'/crewmate/',3:'/asteroids/',4:'/lot/',5:'/building/',6:'/ship/'};
  const E=(e,d)=>{const n=esc(ent(e)||d||'');const g=e&&typeof e==='object'&&GP[+e.label];return n+(g&&window.GL?window.GL(g+e.id,'Open in the game'):'')};
  const prods=v=>(v.products||[]).map(x=>'<b>'+esc(pAmt(x.product,x.amount))+' '+esc(pName(x.product))+'</b>').join(', ');
  function describe(r){
    const v=r.v||{},n=r.n;
    const p=v.product!=null?'<b>'+esc(pAmt(v.product,v.amount||0))+' '+esc(pName(v.product))+'</b>':'';
    switch(n){
      case 'DeliverySent':return 'Sent '+prods(v)+' from '+E(v.origin)+' to '+E(v.dest);
      case 'DeliveryReceived':return 'Received '+prods(v)+' at '+E(v.dest)+' <span class="s">from '+E(v.origin)+'</span>';
      case 'ResourceExtractionStarted':return 'Started mining '+(p||esc(pName(v.resource))+(v.yield?' ('+esc(pAmt(v.resource,v.yield))+')':''))+(v.extractor?' at '+E(v.extractor):'');
      case 'ResourceExtractionFinished':return 'Finished mining '+(v.resource?'<b>'+esc(pAmt(v.resource,v.yield||0))+' '+esc(pName(v.resource))+'</b>':p)+(v.destination?' → '+E(v.destination):'');
      case 'MaterialProcessingStarted':{const io=a=>(a||[]).map(x=>'<b>'+esc(pAmt(x.product,x.amount))+' '+esc(pName(x.product))+'</b>').join(', ');
        return 'Started making '+(io(v.outputs)||'something')+(v.inputs&&v.inputs.length?' <span class="s">from '+io(v.inputs).replace(/<\/?b>/g,'')+'</span>':'')+(v.processor?' at '+E(v.processor):'')}
      case 'MaterialProcessingFinished':return 'Finished processing'+(v.processor?' at '+E(v.processor):'');
      case 'SamplingDepositStarted':return 'Started a core sample'+(v.resource?' for '+esc(pName(v.resource)):'')+(v.lot?' on '+E(v.lot):'');
      case 'SamplingDepositFinished':return 'Core sample finished'+(v.initialYield?' – <b>'+esc(pAmt(1,v.initialYield))+'</b> found':'');
      case 'SellOrderFilled':{const sold=mine.has(v.sellerCrew&&v.sellerCrew.id)&&!mine.has(v.callerCrew&&v.callerCrew.id);
        return (sold?'Sold ':'Bought ')+(p||'goods')+(v.price!=null?' for <b>'+esc(sway(v.price,v.amount))+'</b>':'')+' <span class="s">'+(sold?'to '+E(v.callerCrew):'from '+E(v.sellerCrew))+(v.exchange?' at '+E(v.exchange):'')+'</span>'}
      case 'BuyOrderFilled':return 'Bought '+(p||'goods')+(v.price!=null?' <span class="s">at '+esc((v.price/1e6).toLocaleString())+' SWAY each</span>':'');
      case 'SellOrderCreated':return 'Listed '+(p||'goods')+' for sale'+(v.price!=null?' – <b>'+esc(sway(v.price,v.amount))+'</b> in total':'')+(v.exchange?' <span class="s">at '+E(v.exchange)+'</span>':'');
      case 'DepositPurchased':return 'Bought a core sample'+(v.price!=null?' for <b>'+esc(sway(v.price))+'</b>':'')+(v.sellerCrew?' <span class="s">from '+E(v.sellerCrew)+'</span>':'');
      case 'SellOrderCancelled':return 'Cancelled a sell order'+(p?' for '+p:'');
      case 'TransitStarted':return E(v.ship,'Ship')+' set off from '+E(v.origin)+' to <b>'+E(v.destination)+'</b>'+(v.finishTime?' <span class="s">arrives '+esc(new Date(v.finishTime*1000).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))+'</span>':'');
      case 'TransitFinished':return E(v.ship,'Ship')+' arrived at <b>'+E(v.destination)+'</b> <span class="s">from '+E(v.origin)+'</span>';
      case 'ShipDocked':return E(v.ship,'Ship')+' docked'+(v.dock?' at '+E(v.dock):'');
      case 'ShipUndocked':return E(v.ship,'Ship')+' undocked';
      case 'FoodSupplied':return 'Fed the crew <b>'+esc(pAmt(129,v.food||0))+' food</b>'+(v.origin?' <span class="s">from '+E(v.origin)+'</span>':'');
      case 'CrewStationed':return 'Crew moved to <b>'+E(v.destinationStation||v.station)+'</b>'+(v.originStation?' <span class="s">from '+E(v.originStation)+'</span>':'');
      case 'CrewEjected':return E(v.ejectedCrew,'Crew')+' left '+E(v.station);
      case 'EmergencyPropellantCollected':return 'Collected emergency propellant <b>'+esc(pAmt(170,v.amount||0))+'</b>';
      case 'ShipCommandeered':return 'Took command of '+E(v.ship);
      case 'RandomEventResolved':return 'Dealt with a random event'+(v.actionTarget?' at '+E(v.actionTarget):'');
      case 'PrepaidAgreementAccepted':case 'PrepaidAgreementExtended':return (n.endsWith('Extended')?'Extended':'Took')+' a lease on <b>'+E(v.target)+'</b>'+(v.term?' <span class="s">for '+Math.round(v.term/86400)+' days</span>':'');
      case 'PrepaidAgreementTransferred':return 'Lease on <b>'+E(v.target)+'</b> passed to '+E(v.permitted)+(v.oldPermitted?' <span class="s">from '+E(v.oldPermitted)+'</span>':'');
      case 'CrewmatesExchanged':return 'Swapped crewmates between '+E(v.crew1)+' and '+E(v.crew2);
      case 'ConstructionPlanned':return 'Planned '+esc(['a building','a Warehouse','an Extractor','a Refinery','a Bioreactor','a Factory','a Shipyard','a Spaceport','a Marketplace','a Habitat','a Tank Farm'][v.buildingType]||'a building')+(v.lot?' on '+E(v.lot):'');
      case 'ConstructionStarted':case 'ConstructionFinished':case 'ConstructionAbandoned':case 'ConstructionDeconstructed':return words(n)+' – '+E(v.building,'building');
      case 'NameChanged':return 'Named '+esc((v.entity&&v.entity.label==5?'building':v.entity&&v.entity.label==6?'ship':v.entity&&v.entity.label==1?'crew':'something'))+' <b>'+esc(v.name||v.newName||'')+'</b>';
      case 'CrewmateRecruited':return 'Recruited <b>'+esc(v.name||('Crewmate #'+(v.crewmate&&v.crewmate.id)))+'</b>';
      case 'BuildingRepossessed':return 'Repossessed '+E(v.building);
      case 'Transfer':return (/^0x0+$/.test(v.from||'')?'New crew created':'Crew NFT transferred')+(v.tokenId?' <span class="s">(Crew #'+esc(v.tokenId)+')</span>':'');
    }
    const bits=Object.entries(v).map(([k,x])=>{const e=ent(x);if(e)return esc(k)+': '+esc(e);if(typeof x==='number'||typeof x==='string')return esc(k)+': '+esc(x);return null}).filter(Boolean).slice(0,4);
    return words(n)+(bits.length?' <span class="s">('+bits.join(' · ')+')</span>':'')}

  function draw(){
    m.innerHTML='';
    /* Mark 15 Nov (test): on the Flight Deck this page is just the whole belt's flights; your crews' log lives in the Captain's log */
    if(BELT&&!opt.noTitle){m.appendChild(el('h2','hl-title',DAA&&S.bv==='da'?'Belt flights – departures and arrivals':'Belt flights – in flight now'));
      if(DAA){const tb=el('div','hl-bar');tb.innerHTML='<button type="button" data-bv="now"'+(S.bv!=='da'?' class="on" aria-pressed="true"':' aria-pressed="false"')+'>In flight now</button><button type="button" data-bv="da"'+(S.bv==='da'?' class="on" aria-pressed="true"':' aria-pressed="false"')+'>Departures and Arrivals</button>';
        tb.querySelectorAll('button').forEach(b=>{b.style.cssText='padding:5px 12px;border-radius:6px;border:1px solid #5fc3e4;cursor:pointer;font-weight:bold;'+(b.classList.contains('on')?'background:#1d3346;color:#fff':'background:#14202c;color:#8fe3ff');b.onclick=()=>{S.bv=b.dataset.bv;draw()}});m.appendChild(tb)}
      if(DAA&&S.bv==='da')drawDA();else drawBelt();return}
    if(!opt.noTitle)m.appendChild(el('h2','hl-title','Activity log'));
    const H=HC[S.range];
    const rs=el('select');rs.innerHTML=RANGES.map(([k,n])=>'<option value="'+k+'"'+(k===S.range?' selected':'')+'>'+n+'</option>').join('');
    rs.addEventListener('change',()=>{S.range=rs.value;S.show=300;S.crew='';fetchRange();draw()});
    if(HT){clearInterval(HT);HT=0}
    if(H&&H.until){const b=el('div','hl-bar');b.appendChild(rs);m.appendChild(b);
      const n=el('div','note hl-cool','');m.appendChild(n);
      const tick=()=>{if(!n.isConnected){clearInterval(HT);HT=0;return}const s=Math.max(0,Math.ceil((H.until-Date.now())/1000));
        if(!s){clearInterval(HT);HT=0;delete HC[S.range];fetchRange();draw();return}
        n.innerHTML='<b style="color:#ffb547">⏳ Cool-down</b> – "Everything" reads a lot from the game\'s server, so it can be run '+H.max+' times an hour.<br>You can try again in <b class="hl-cd" style="font-size:20px;color:#8fe3ff">'+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')+'</b> – or pick a shorter timeframe above, those work straight away.'};
      tick();HT=setInterval(tick,1000);return}
    if(!H||H.error){const b=el('div','hl-bar');b.appendChild(rs);m.appendChild(b);
      m.appendChild(el('div','note',H?'Could not load the history: '+esc(H.error):'Loading '+(S.range==='100'?'your crews\' latest actions':RANGES.find(r=>r[0]===S.range)[1].toLowerCase())+' from the game… '+(S.range==='all'||S.range==='90'?'This one can take a couple of minutes the first time.':'This can take up to a minute the first time.')));return}
    m.appendChild(el('div','note','Everything your crews have done, newest first, straight from the game\'s records – '+(S.range==='100'?'the latest 100 actions for each crew':RANGES.find(r=>r[0]===S.range)[1].toLowerCase())+'. Times are in your local time.'+(H.partial?' <b style="color:#ffb547">Very long history – showing as much as could be fetched in one go.</b>':'')));
    const bar=el('div','hl-bar'),cs=el('select'),cr=el('select'),q=el('input');bar.appendChild(rs);
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
      const tm=dt.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
      if(dy!==day){day=dy;box.appendChild(el('div','hl-day',opt.stardate?'Adalia Stardate '+esc(SD(r.t,0))+' <span class="hl-real">· '+esc(dy)+'</span>':esc(dy)))}
      box.appendChild(el('div','hl-row','<span class="hl-tm">'+(opt.stardate?'<b class="hl-sd">'+esc(SD(r.t,2))+'</b><span class="hl-real">'+tm+'</span>':tm)+'</span><span class="hl-ic" title="'+esc(cat(r.n)[1])+'">'+cat(r.n)[2]+'</span><span class="hl-what">'+d+'</span><span class="hl-crew">'+esc(crewName[r.c]||('Crew #'+r.c))+'</span>'))});
    m.appendChild(box);
    if(list.length>S.show){const b=el('button','hl-more','Show more ('+(list.length-S.show).toLocaleString()+' left)');b.addEventListener('click',()=>{S.show+=500;draw()});m.appendChild(b)}
  }
  function drawDA(){
    if(!FL||!FP){m.appendChild(el('div','note','Loading departures and arrivals across the belt…'));
      if(!FL&&!FLL)FLL=fetch('flights.php').then(r=>r.json()).then(j=>{FL=j.error?{error:j.error}:j}).catch(e=>{FL={error:String(e&&e.message||e)}}).finally(()=>{FLL=null;if(m.isConnected)draw()});
      if(!FP&&!FPL)FPL=fetch('flights.php?past=1').then(r=>r.json()).then(j=>{FP=j.error?{error:j.error}:j}).catch(e=>{FP={error:String(e&&e.message||e)}}).finally(()=>{FPL=null;if(m.isConnected)draw()});return}
    if(FL.error||FP.error){m.appendChild(el('div','note','Could not load the flights: '+esc(FL.error||FP.error)));return}
    const now=Date.now()/1000,since=now-7*86400,nm=Object.assign({},FP.names||{},FL.names||{}),an=id=>esc(aName[id]||nm[id]||('Asteroid #'+id));
    const when=t=>new Date(t*1000).toLocaleString(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    const ago=s=>{const h=s/3600;return h<1?Math.max(1,Math.round(h*60))+' m ago':h<48?Math.round(h)+' h ago':(h/24).toFixed(1)+' d ago'};
    const ev=[],seen=new Set();
    (FL.ships||[]).concat(FP.ships||[]).forEach(x=>{
      if(x[7]>since&&x[7]<=now&&!seen.has('d'+x[0]+'_'+x[7])){seen.add('d'+x[0]+'_'+x[7]);ev.push({t:x[7],a:0,x})}
      if(x[8]>since&&x[8]<=now&&!seen.has('a'+x[0]+'_'+x[8])){seen.add('a'+x[0]+'_'+x[8]);ev.push({t:x[8],a:1,x})}});
    ev.sort((a,b)=>b.t-a.t);
    m.appendChild(el('div','note','Who left and who landed across the whole belt in the last 7 days, newest first – '+ev.length.toLocaleString()+' event'+(ev.length===1?'':'s')+
      '. Your own ships are highlighted. A ship that has flown again since only shows its latest trip (the game keeps one trip per ship). Updated every 5 minutes at most. Times are in your local time.'));
    const bar=el('div','hl-bar'),q=el('input');q.placeholder='Search ship, type, crew or asteroid';q.value=S.bq;bar.appendChild(q);m.appendChild(bar);
    const box=el('div');m.appendChild(box);
    const fill=()=>{const qq=S.bq.trim().toLowerCase();
      const tr=ev.map(({t,a,x})=>{const me=mine.has(x[4]),cn=crewName[x[4]]||(CNB&&((FL.crews||{})[x[4]]||(FP.crews||{})[x[4]]))||('Crew #'+x[4]);
        const txt=[x[1]||'',STYPE[x[2]]||'',cn,aName[x[5]]||nm[x[5]]||'',aName[x[6]]||nm[x[6]]||'',a?'arrived':'departed'].join(' ').toLowerCase();
        if(qq&&!txt.includes(qq))return '';
        return '<tr'+(me?' class="hl-me"':'')+'><td data-sort="'+t+'">'+esc(when(t))+' <span class="s">('+ago(now-t)+')</span></td><td>'+(a?'🛬 Arrived':'🛫 Departed')+'</td><td><b>'+esc(x[1]||('Ship #'+x[0]))+'</b>'+(window.GL?window.GL('/ship/'+x[0],'Open this ship in the game'):'')+'</td><td>'+esc(STYPE[x[2]]||'Ship')+'</td><td>'+esc(cn)+(me?' <span class="s">(yours)</span>':'')+'</td>'+
          '<td>'+an(x[5])+'</td><td>'+an(x[6])+'</td></tr>'}).join('');
      box.innerHTML=tr?'<div class="wrap"><table><thead><tr><th>When</th><th>Event</th><th>Ship</th><th>Type</th><th>Crew</th><th>From</th><th>To</th></tr></thead><tbody>'+tr+'</tbody></table></div>':'<div class="note">Nothing matches.</div>'};
    q.addEventListener('input',()=>{S.bq=q.value;fill()});fill();
  }
  function drawBelt(){
    if(!FL){m.appendChild(el('div','note','Loading every ship in flight across the belt…'));
      if(!FLL)FLL=fetch('flights.php').then(r=>r.json()).then(j=>{FL=j.error?{error:j.error}:j}).catch(e=>{FL={error:String(e&&e.message||e)}}).finally(()=>{FLL=null;if(m.isConnected)draw()});return}
    if(FL.error){m.appendChild(el('div','note','Could not load the flights: '+esc(FL.error)));return}
    const now=Date.now()/1000,nm=FL.names||{},an=id=>esc(aName[id]||nm[id]||('Asteroid #'+id));
    const left=s=>{const h=s/3600;return h<1?Math.max(1,Math.round(h*60))+' m':h<48?Math.round(h)+' h':(h/24).toFixed(1)+' d'};
    const when=t=>new Date(t*1000).toLocaleString(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    const rows=(FL.ships||[]).filter(x=>x[8]>now).sort((a,b)=>a[8]-b[8]);
    m.appendChild(el('div','note','Every ship flying right now across the whole belt, landing soonest first – '+rows.length.toLocaleString()+' ship'+(rows.length===1?'':'s')+
      '. Your own ships are highlighted. Your crews\' own history is in the Captain\'s log on the Bridge. Updated '+esc(new Date((FL.fetched||now)*1000).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}))+' (the site checks at most every 5 minutes). Times are in your local time.'));
    const bar=el('div','hl-bar'),q=el('input');q.placeholder='Search ship, type, crew or asteroid';q.value=S.bq;bar.appendChild(q);m.appendChild(bar);
    const box=el('div');m.appendChild(box);
    const fill=()=>{const qq=S.bq.trim().toLowerCase();
      const tr=rows.map(x=>{const me=mine.has(x[4]),cn=crewName[x[4]]||(CNB&&(FL.crews||{})[x[4]])||('Crew #'+x[4]);
        const txt=[x[1]||'',STYPE[x[2]]||'',cn,aName[x[5]]||nm[x[5]]||'',aName[x[6]]||nm[x[6]]||''].join(' ').toLowerCase();
        if(qq&&!txt.includes(qq))return '';
        return '<tr'+(me?' class="hl-me"':'')+'><td><b>'+esc(x[1]||('Ship #'+x[0]))+'</b>'+(window.GL?window.GL('/ship/'+x[0],'Open this ship in the game'):'')+'</td><td>'+esc(STYPE[x[2]]||'Ship')+'</td><td>'+esc(cn)+(me?' <span class="s">(yours)</span>':'')+'</td>'+
          '<td>'+an(x[5])+'</td><td>'+an(x[6])+'</td><td data-sort="'+x[7]+'">'+esc(when(x[7]))+'</td><td data-sort="'+x[8]+'">'+esc(when(x[8]))+' <span class="s">(in '+left(x[8]-now)+')</span></td></tr>'}).join('');
      box.innerHTML=tr?'<div class="wrap"><table><thead><tr><th>Ship</th><th>Type</th><th>Crew</th><th>From</th><th>To</th><th>Left</th><th>Lands</th></tr></thead><tbody>'+tr+'</tbody></table></div>':'<div class="note">Nothing matches.</div>'};
    q.addEventListener('input',()=>{S.bq=q.value;fill()});fill();
  }
  draw();
  function fetchRange(){const k=S.range;if(HC[k]||LD[k])return;
    LD[k]=fetch('history.php?range='+k+'&wallet='+encodeURIComponent(D.wallet||''),{cache:'no-store'}).then(r=>r.json()).then(j=>{HC[k]=j.wait?{error:'cooldown',until:Date.now()+j.wait*1000,max:j.max||3}:j.error?{error:j.error}:j}).catch(e=>{HC[k]={error:String(e)}}).finally(()=>{delete LD[k];if(S.range!==k)return;if(opt.into){if(m.isConnected)drawHistory(m,opt);return}const b=document.getElementById('vJ');if(b&&b.className==='on')drawHistory(document.getElementById('main'))})}
  fetchRange();
}

window.YICdrawHistory=drawHistory; // used by the Captain's log on the Bridge (vendor/captainslog.js)

/* Adds "Activity log" to the Logistics menu, after Deliveries */
{
  const hook=()=>{
    const r=document.getElementById('vV'),main=document.getElementById('main');
    if(!r||!main||document.getElementById('vJ'))return;
    const b=document.createElement('button');b.id='vJ';b.textContent=BELT?'Belt flights':'Activity log';r.after(b);
    b.addEventListener('click',()=>{document.querySelectorAll('button.on').forEach(x=>x.classList.remove('on'));try{window.YIC.view='M'}catch(e){} /* tell the main page an add-on page is showing */b.className='on';drawHistory(main)});
  };
  document.addEventListener('click',e=>{const b=document.getElementById('vJ'),t=e.target.closest&&e.target.closest('button[id^="v"]');if(b&&t&&t!==b)b.className=''},true);
  setInterval(hook,700);
}
