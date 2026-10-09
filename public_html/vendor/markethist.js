/* Market history: trades on every marketplace in the belt, newest first, with a price-over-time chart per product.
   Read-only, from each marketplace's own activity records (markethist.php, shared cache for everyone). */
const CSS=`.mh-title{font-size:22px;margin:4px 0 6px;color:#8fe3ff}
.mh-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0 12px}
.mh-bar select,.mh-bar input{font-size:15px;padding:6px 10px}
.mh-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:0 0 14px}
.mh-tile{background:#121a26;border:1px solid #2a3648;border-radius:10px;padding:10px 14px}
.mh-tile .k{font-size:13px;color:#8b9ab0}.mh-tile .v{font-size:20px;font-weight:600;color:#e6ebf2;margin-top:2px}
.mh-chart{background:#0f141c;border:1px solid #2a3648;border-radius:10px;padding:10px 12px 6px;margin:0 0 14px}
.mh-chart h3{margin:0 0 4px;font-size:15px;color:#8fe3ff;font-weight:600}
.mh-chart svg{width:100%;height:220px;display:block}
.mh-tbl{width:100%;border-collapse:collapse;font-size:14px}
.mh-tbl th{text-align:left;color:#8b9ab0;font-weight:600;padding:6px;border-bottom:1px solid #2a3648;position:sticky;top:0;background:#0b0e13}
.mh-tbl td{padding:6px;border-bottom:1px solid #151d29;vertical-align:top}
.mh-tbl tr:hover td{background:#0f141c}
.mh-tbl .num{text-align:right;font-variant-numeric:tabular-nums}
.mh-me{color:#ffd24a}
.mh-p{display:flex;gap:8px;align-items:center}.mh-p img{width:26px;height:26px;object-fit:contain}
.mh-more{margin:14px 0}`;
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RANGES=[['100','Latest 100 trades'],['7','Last 7 days'],['30','Last 30 days'],['90','Last 90 days'],['all','Everything']];
const HC={},LD={};const S={range:'100',prod:'',mk:'',mine:false,q:'',show:200};
const swayN=(price,amount)=>price*(amount||1)/1e6;
const fmtS=s=>(s>=100?Math.round(s):+s.toFixed(s<1?4:2)).toLocaleString()+' SWAY';

export function drawMarketHistory(m){
  if(!document.getElementById('mh-css')){const st=el('style');st.id='mh-css';st.textContent=CSS;document.head.appendChild(st)}
  const Y=window.YIC;let D=null,pf=null,pn=null;try{D=Y.D;pf=Y.pfmt;pn=Y.pn}catch(e){}
  const pName=p=>pn?pn(p):'Product '+p,pAmt=(p,a)=>{try{return pf?pf(p,a)||'0':String(a)}catch(e){return String(a)}};
  const mine=new Set(((D&&D.crewList)||[]).map(c=>c.id)),crewName={};((D&&D.crewList)||[]).forEach(c=>crewName[c.id]=c.name);
  const who=id=>crewName[id]?'<span class="mh-me">'+esc(crewName[id])+'</span>':'Crew #'+id;

  function chart(rows){ /* price per unit over time for one product */
    const pts=rows.map(r=>[r[0],r[4]/1e6]).sort((a,b)=>a[0]-b[0]);if(pts.length<2)return'';
    const W=900,H=220,L=62,R=12,T=12,B=28,x0=pts[0][0],x1=pts[pts.length-1][0]||x0+1,ys=pts.map(p=>p[1]),y0=Math.min(...ys),y1=Math.max(...ys);
    const pad=(y1-y0)*0.1||y1*0.1||1,lo=Math.max(0,y0-pad),hi=y1+pad;
    const X=t=>L+(W-L-R)*(x1===x0?0.5:(t-x0)/(x1-x0)),Yp=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
    const ticks=[lo,(lo+hi)/2,hi].map(v=>'<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Yp(v)+'" y2="'+Yp(v)+'" stroke="#1d2735"/><text x="'+(L-6)+'" y="'+(Yp(v)+4)+'" fill="#8b9ab0" font-size="12" text-anchor="end">'+(+v.toPrecision(3)).toLocaleString()+'</text>').join('');
    const dt=t=>new Date(t*1000).toLocaleDateString(undefined,{day:'numeric',month:'short'});
    const line=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Yp(p[1]).toFixed(1)).join(' ');
    const dots=pts.map(p=>'<circle cx="'+X(p[0]).toFixed(1)+'" cy="'+Yp(p[1]).toFixed(1)+'" r="3" fill="#8fe3ff"><title>'+esc(dt(p[0]))+': '+(+p[1].toPrecision(4)).toLocaleString()+' SWAY</title></circle>').join('');
    return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'+ticks+'<path d="'+line+'" fill="none" stroke="#8fe3ff" stroke-width="1.5" opacity=".6"/>'+dots+
      '<text x="'+L+'" y="'+(H-8)+'" fill="#8b9ab0" font-size="12">'+esc(dt(x0))+'</text><text x="'+(W-R)+'" y="'+(H-8)+'" fill="#8b9ab0" font-size="12" text-anchor="end">'+esc(dt(x1))+'</text></svg>'}

  function draw(){
    m.innerHTML='';m.appendChild(el('h2','mh-title','Market history'));
    const H=HC[S.range];
    const rs=el('select');rs.innerHTML=RANGES.map(([k,n])=>'<option value="'+k+'"'+(k===S.range?' selected':'')+'>'+n+'</option>').join('');
    rs.addEventListener('change',()=>{S.range=rs.value;S.show=200;fetchRange();draw()});
    if(!H||H.error){const b=el('div','mh-bar');b.appendChild(rs);m.appendChild(b);
      m.appendChild(el('div','note',H?'Could not load the market history: '+esc(H.error):'Reading the trade logs of every marketplace in the belt… '+(S.range==='100'?'this takes about half a minute the first time.':'this can take a couple of minutes the first time.')));return}
    const T=H.trades||[],MK=H.markets||{};
    m.appendChild(el('div','note','Every trade on every marketplace in the belt, newest first – '+esc(RANGES.find(r=>r[0]===S.range)[1].toLowerCase())+'. Prices are per unit (per kg for bulk goods). Your crews are shown in gold.'+(H.partial?' <b style="color:#ffb547">Very long history – showing as much as could be read in one go.</b>':'')));
    const bar=el('div','mh-bar'),ps=el('select'),ms=el('select'),me=el('label'),q=el('input');
    const prods=[...new Set(T.map(r=>r[2]))].sort((a,b)=>pName(a).localeCompare(pName(b)));
    ps.innerHTML='<option value="">All products</option>'+prods.map(p=>'<option value="'+p+'"'+(String(p)===S.prod?' selected':'')+'>'+esc(pName(p))+'</option>').join('');
    const mks=[...new Set(T.map(r=>r[5]))].map(id=>[id,(MK[id]&&MK[id].name)||('Marketplace #'+id)]).sort((a,b)=>a[1].localeCompare(b[1]));
    ms.innerHTML='<option value="">All marketplaces</option>'+mks.map(([id,n])=>'<option value="'+id+'"'+(String(id)===S.mk?' selected':'')+'>'+esc(n)+'</option>').join('');
    me.innerHTML='<input type="checkbox"'+(S.mine?' checked':'')+' style="width:16px;height:16px;vertical-align:-2px;margin-right:6px">Only my trades';me.style.cursor='pointer';
    q.placeholder='Search';q.value=S.q;
    ps.addEventListener('change',()=>{S.prod=ps.value;S.show=200;draw()});ms.addEventListener('change',()=>{S.mk=ms.value;S.show=200;draw()});
    me.querySelector('input').addEventListener('change',e=>{S.mine=e.target.checked;S.show=200;draw()});
    q.addEventListener('input',()=>{S.q=q.value;S.show=200;const p=q.selectionStart;draw();const n=m.querySelector('.mh-bar input[placeholder]');n.focus();n.setSelectionRange(p,p)});
    [rs,ps,ms,me,q].forEach(x=>bar.appendChild(x));m.appendChild(bar);
    const qq=S.q.trim().toLowerCase();
    const L=T.filter(r=>(!S.prod||String(r[2])===S.prod)&&(!S.mk||String(r[5])===S.mk)&&(!S.mine||mine.has(r[6])||mine.has(r[7]))&&
      (!qq||(pName(r[2])+' '+((MK[r[5]]||{}).name||'')+' '+((MK[r[5]]||{}).ast||'')+' '+(crewName[r[6]]||'')+' '+(crewName[r[7]]||'')).toLowerCase().includes(qq)));
    if(!L.length){m.appendChild(el('div','note','No trades match.'));return}
    const tot=L.reduce((s,r)=>s+swayN(r[4],r[3]),0);
    const sum=el('div','mh-sum');
    const tiles=[['Trades',L.length.toLocaleString()],['Value traded',fmtS(tot)],['Products',new Set(L.map(r=>r[2])).size.toLocaleString()],['Marketplaces',new Set(L.map(r=>r[5])).size.toLocaleString()]];
    if(S.prod){const pr=L.map(r=>r[4]/1e6),avg=L.reduce((s,r)=>s+r[4]/1e6*r[3],0)/L.reduce((s,r)=>s+r[3],0);
      tiles.push(['Average price',(+avg.toPrecision(4)).toLocaleString()+' SWAY'],['Lowest – highest',(+Math.min(...pr).toPrecision(3)).toLocaleString()+' – '+(+Math.max(...pr).toPrecision(3)).toLocaleString()])}
    sum.innerHTML=tiles.map(([k,v])=>'<div class="mh-tile"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>').join('');m.appendChild(sum);
    if(S.prod){const c=chart(L);if(c)m.appendChild(el('div','mh-chart','<h3>'+esc(pName(+S.prod))+' – price per unit over time</h3>'+c))}
    else m.appendChild(el('div','note','Pick a product to see its price over time.'));
    const tb=el('table','mh-tbl');
    tb.innerHTML='<thead><tr><th>When</th><th>Product</th><th class="num">Amount</th><th class="num">Price each</th><th class="num">Total</th><th>Marketplace</th><th>Buyer</th><th>Seller</th></tr></thead><tbody>'+
      L.slice(0,S.show).map(r=>{const d=new Date(r[0]*1000),mk=MK[r[5]]||{};
        return '<tr><td>'+esc(d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'2-digit'}))+' <span style="color:#8b9ab0">'+esc(d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}))+'</span></td>'+
          '<td><span class="mh-p"><img src="rimg.php?p='+r[2]+'" alt="" loading="lazy">'+esc(pName(r[2]))+'</span></td><td class="num">'+esc(pAmt(r[2],r[3]))+'</td><td class="num">'+(+(r[4]/1e6).toPrecision(4)).toLocaleString()+'</td><td class="num">'+esc(fmtS(swayN(r[4],r[3])))+'</td>'+
          '<td>'+esc(mk.name||('#'+r[5]))+(mk.ast?'<br><span style="color:#8b9ab0;font-size:12px">'+esc(mk.ast)+'</span>':'')+'</td><td>'+who(r[6])+'</td><td>'+who(r[7])+'</td></tr>'}).join('')+'</tbody>';
    m.appendChild(tb);
    if(L.length>S.show){const b=el('button','mh-more','Show more ('+(L.length-S.show).toLocaleString()+' left)');b.addEventListener('click',()=>{S.show+=500;draw()});m.appendChild(b)}
  }
  function fetchRange(){const k=S.range;if(HC[k]||LD[k])return;
    LD[k]=fetch('markethist.php?range='+k,{cache:'no-store'}).then(r=>r.json()).then(j=>{HC[k]=j.error?{error:j.error}:j}).catch(e=>{HC[k]={error:String(e)}})
      .finally(()=>{delete LD[k];if(S.range!==k)return;const b=document.getElementById('vM');if(b&&b.className==='on')drawMarketHistory(document.getElementById('main'))})}
  draw();fetchRange();
}

/* Beta: adds "Market history" to the Trading menu, after Trade finder */
if(/[?&]beta=1(&|$)/.test(location.search)){
  const hook=()=>{
    const y=document.getElementById('vY'),main=document.getElementById('main');
    if(!y||!main||document.getElementById('vM'))return;
    const b=document.createElement('button');b.id='vM';b.textContent='Market history';y.after(b);
    b.addEventListener('click',()=>{document.querySelectorAll('button.on').forEach(x=>x.classList.remove('on'));try{window.YIC.view='M'}catch(e){}b.className='on';drawMarketHistory(main)});
  };
  document.addEventListener('click',e=>{const b=document.getElementById('vM'),t=e.target.closest&&e.target.closest('button[id^="v"]');if(b&&t&&t!==b)b.className=''},true);
  setInterval(hook,700);
}
