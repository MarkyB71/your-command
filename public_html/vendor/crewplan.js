/* Crew planner for Your Influence Command.
   A "what if" page: drag crewmates between crews and see how each crew's bonuses change.
   Nothing here changes the game. Bonuses use the site's own crewMult (same maths as Best crew). */
import {fillFaces} from './faces.js?v=1';
const CSS=`.cp-title{font-size:22px;margin:4px 0 6px;color:#8fe3ff}
.cp-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0 14px}
.cp-bar select,.cp-bar input,.cp-bar button{font-size:15px;padding:6px 10px}
.cp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}
.cp-crew{background:#121a26;border:1px solid #2a3648;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.cp-crew.drop{border-color:#8fe3ff;box-shadow:0 0 0 2px rgba(143,227,255,.35)}
.cp-crew.changed{border-color:#ffd24a}
.cp-h{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.cp-nm{font-weight:600;font-size:17px}
.cp-at{font-size:12px;color:#8b9ab0;text-align:right}
.cp-slots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.cp-slot{min-width:0;overflow:hidden;min-height:92px;border:1px dashed #2a3648;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#3c4a60;font-size:12px}
.cp-mate{width:100%;min-width:0;box-sizing:border-box;cursor:grab;user-select:none;border:1px solid #2a3648;border-radius:8px;background:#0b1018;padding:4px;text-align:center;font-size:11px;line-height:1.25;position:relative}
.cp-mate img{width:100%;aspect-ratio:3/4;object-fit:cover;object-position:50% 0;border-radius:6px;background:#000;display:block}
.cp-mate .n{color:#e6ebf2;font-weight:600;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-mate .c{color:#8fe3ff}
.cp-mate.moved{border-color:#ffd24a}
.cp-mate.sel{outline:2px solid #8fe3ff}
.cp-mate.dragging{opacity:.4}
.cp-bon{font-size:13px;line-height:1.55}
.cp-bon .r{display:flex;justify-content:space-between;gap:8px}
.cp-bon .up{color:#4cd04c}.cp-bon .dn{color:#ff7a7a}.cp-bon .was{color:#8b9ab0;font-size:12px}
.cp-none{font-size:13px;color:#8b9ab0}
.cp-warn{font-size:12px;color:#ffb547}
.cp-pool{background:#0f141c;border:1px dashed #2a3648;border-radius:10px;padding:10px;margin:0 0 12px}
.cp-job{border:1px solid #2a3648;border-radius:8px;margin:0 0 8px;padding:8px 12px;background:#0f141c}
.cp-job summary{cursor:pointer;font-size:15px}.cp-job table{width:100%;margin-top:8px;font-size:14px;border-collapse:collapse}.cp-job td{padding:4px 6px;border-top:1px solid #1a2230}.cp-job .num{text-align:right}
.cp-pool h3{margin:0 0 6px;font-size:15px;color:#8b9ab0;font-weight:600}
.cp-pool .cp-slots{grid-template-columns:repeat(auto-fill,minmax(70px,90px))}`;
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pc=v=>{const p=Math.round((v-1)*100);return p===0?'standard':(p>0?'+':'−')+Math.abs(p)+'%'};
const S={plan:null,orig:null,sel:null,job:'',q:'',best:false};
const POOL='pool';
const store=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

export function drawCrewPlan(m){
  if(!document.getElementById('cp-css')){const st=el('style');st.id='cp-css';st.textContent=CSS;document.head.appendChild(st)}
  const Y=window.YIC;let D;try{D=Y&&Y.D}catch(e){D=null}
  if(!D||!D.crewList){m.innerHTML='<div class="note">Crew data is still loading. Try again in a moment.</div>';return}
  const crewMult=Y.crewMult,CBJ=Y.CBJ,CBNF=Y.CBNF,habEff=Y.habEff,CMC=Y.CMC,cm=D.crewmates||{};
  const crews=D.crewList.filter(c=>(c.roster||[]).length);
  const byId={};crews.forEach(c=>byId[c.name+'|'+(c.roster||[]).join(',')]=c);
  const key='cp-plan-'+(D.wallet||'me');
  const names={};crews.forEach(c=>Object.assign(names,c.mn||{}));
  if(!S.orig){S.orig={};crews.forEach((c,i)=>S.orig[i]=(c.roster||[]).slice());
    const saved=store(key);S.plan=saved&&saved.n===crews.length?saved.p:JSON.parse(JSON.stringify(S.orig));if(!S.plan[POOL])S.plan[POOL]=[]}
  const home={};Object.entries(S.orig).forEach(([i,r])=>r.forEach(id=>home[id]=+i));
  const mult=(i,ids,a)=>{const ms=ids.map(id=>cm[id]).filter(Boolean);return crewMult(a,ms)*(CBNF[a]?1:habEff(crews[i]))};
  const ai=(document.getElementById('ast')||{}).value,an=ai===''||ai==null?null:(Y.asts[+ai]||{}).name;

  function move(id,to){
    for(const k in S.plan){const j=S.plan[k].indexOf(id);if(j>=0)S.plan[k].splice(j,1)}
    S.plan[to].push(id);save(key,{n:crews.length,p:S.plan});S.sel=null;draw()}
  function canTake(k){return k===POOL||S.plan[k].length<5}

  function mateEl(id,k){
    const x=cm[id]||{},e=el('div','cp-mate'+(home[id]!=+k?' moved':'')+(S.sel===id?' sel':''),
      '<img src="cimg.php?id='+id+'&s=1" data-face="'+id+'" alt="" loading="lazy"><div class="n" title="'+esc(names[id]||('#'+id))+'">'+esc(names[id]||('#'+id))+'</div><div class="c">'+esc(CMC[x.class]||'')+'</div>');
    e.draggable=true;e.title=(names[id]||'Crewmate #'+id)+(home[id]!=+k&&home[id]!=null?' · from '+crews[home[id]].name:'');
    e.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('text/plain',String(id));e.classList.add('dragging')});
    e.addEventListener('dragend',()=>e.classList.remove('dragging'));
    e.addEventListener('click',ev=>{ev.stopPropagation();S.sel=S.sel===id?null:id;draw()});
    return e}
  function dropZone(box,k){
    box.addEventListener('dragover',ev=>{if(canTake(k)){ev.preventDefault();box.classList.add('drop')}});
    box.addEventListener('dragleave',()=>box.classList.remove('drop'));
    box.addEventListener('drop',ev=>{ev.preventDefault();box.classList.remove('drop');const id=+ev.dataTransfer.getData('text/plain');if(id&&canTake(k))move(id,k)});
    box.addEventListener('click',()=>{if(S.sel!=null&&canTake(k)&&!S.plan[k].includes(S.sel))move(S.sel,k)})}

  function bonusHTML(i){
    const now=S.plan[i],was=S.orig[i];
    const jobs=S.job?CBJ.filter(j=>String(j[0])===S.job):CBJ;
    const rows=jobs.map(([a,n])=>{const v=mult(i,now,a),o=mult(i,was,a);return{n,v,o}}).filter(r=>S.job||Math.abs(r.v-1)>0.0001||Math.abs(r.o-1)>0.0001);
    if(!rows.length)return'<div class="cp-none">No bonuses – standard on every job.</div>';
    return'<div class="cp-bon">'+rows.map(r=>{const d=r.v-r.o,cl=d>0.0001?'up':d<-0.0001?'dn':'';
      return'<div class="r"><span>'+esc(r.n)+'</span><span class="'+cl+'">'+pc(r.v)+(Math.abs(d)>0.0001?' <span class="was">(was '+pc(r.o)+')</span>':'')+'</span></div>'}).join('')+'</div>'}

  function draw(){
    m.innerHTML='';
    m.appendChild(el('h2','cp-title','Crew planner'));
    m.appendChild(el('div','note','Drag a crewmate onto another crew (or click a crewmate, then click a crew) to see how the bonuses change. Gold border = changed. This is a planner only – nothing changes in the game. In Influence, crewmates can only swap between crews in the same place.'));
    const bar=el('div','cp-bar'),js=el('select'),qs=el('input'),rs=el('button',null,'Reset all');
    js.innerHTML='<option value="">All bonuses</option>'+CBJ.map(([a,n])=>'<option value="'+a+'"'+(String(a)===S.job?' selected':'')+'>'+esc(n)+'</option>').join('');
    js.addEventListener('change',()=>{S.job=js.value;draw()});
    qs.placeholder='Find a crew';qs.value=S.q;qs.addEventListener('input',()=>{S.q=qs.value;const p=qs.selectionStart;draw();const n=m.querySelector('.cp-bar input');n.focus();n.setSelectionRange(p,p)});
    rs.addEventListener('click',()=>{S.plan=JSON.parse(JSON.stringify(S.orig));S.plan[POOL]=[];S.sel=null;save(key,null);draw()});
    const l1=el('label',null,'Show ');l1.appendChild(js);[l1,qs,rs].forEach(x=>bar.appendChild(x));
    {const bb=el('button',null,S.best?'← Back to the planner':'Best crew for each job');bb.style.cssText='margin-left:auto;color:#ffd24a;border-color:#6b5a1c';
      bb.addEventListener('click',()=>{S.best=!S.best;draw()});bar.appendChild(bb)}
    m.appendChild(bar);
    if(S.best){drawBest();return}

    const pool=el('div','cp-pool','<h3>Spare bench – drop crewmates here to take them out of a crew</h3>'),ps=el('div','cp-slots');
    S.plan[POOL].forEach(id=>{const s=el('div','cp-slot');s.appendChild(mateEl(id,POOL));ps.appendChild(s)});
    if(!S.plan[POOL].length)ps.appendChild(el('div','cp-slot','Empty'));
    pool.appendChild(ps);dropZone(pool,POOL);m.appendChild(pool);

    const g=el('div','cp-grid'),q=S.q.trim().toLowerCase();
    crews.forEach((c,i)=>{
      if(an&&c.ast!==an)return;if(q&&!(c.name.toLowerCase().includes(q)||(c.place||'').toLowerCase().includes(q)))return;
      const now=S.plan[i],changed=now.join(',')!==S.orig[i].join(',');
      const box=el('div','cp-crew'+(changed?' changed':''));
      box.appendChild(el('div','cp-h','<span class="cp-nm">'+esc(c.name)+'</span><span class="cp-at">'+esc(c.ast||'')+(c.place?'<br>'+esc(c.place):'')+'</span>'));
      const sl=el('div','cp-slots');
      for(let s=0;s<5;s++){const z=el('div','cp-slot');if(now[s]!=null)z.appendChild(mateEl(now[s],i));else z.textContent='Empty';sl.appendChild(z)}
      box.appendChild(sl);
      const far=now.filter(id=>home[id]!=null&&home[id]!==i&&crews[home[id]].place!==c.place);
      if(far.length)box.appendChild(el('div','cp-warn','⚠ '+far.length+' crewmate'+(far.length>1?'s are':' is')+' from a crew somewhere else'));
      box.insertAdjacentHTML('beforeend',bonusHTML(i));
      dropZone(box,i);g.appendChild(box)});
    m.appendChild(g);fillFaces(m,cm);
  }
  function drawBest(){
    const col=v=>v>1.0001?'#4cd04c':v<0.9999?'#ff7a7a':'inherit',q=S.q.trim().toLowerCase();
    const changedAny=crews.some((c,i)=>S.plan[i].join(',')!==S.orig[i].join(','));
    m.appendChild(el('div','note','Each job lists your crews from best to worst'+(an?' on <b>'+esc(an)+'</b>':'')+(changedAny?', <b style="color:#ffd24a">using your planned crews</b>':'')+'. Same maths as the game: crewmate classes, titles and useful traits, plus the Habitat bonus (up to +20%) on speed jobs. Click a job to see every crew.'));
    const idx=crews.map((c,i)=>i).filter(i=>S.plan[i].length&&(!an||crews[i].ast===an)&&(!q||crews[i].name.toLowerCase().includes(q)));
    if(!idx.length){m.appendChild(el('div','note','No crews with crewmates here.'));return}
    const jobs=S.job?CBJ.filter(j=>String(j[0])===S.job):CBJ;
    jobs.forEach(([a,n])=>{const L=idx.map(i=>({i,v:mult(i,S.plan[i],a),o:mult(i,S.orig[i],a)})).sort((x,y)=>y.v-x.v||crews[x.i].name.localeCompare(crews[y.i].name)),b=L[0];
      const d=el('details','cp-job','<summary><b>'+esc(n)+'</b> · best: '+esc(crews[b.i].name)+(an?'':' <span style="color:#8b9ab0">('+esc(crews[b.i].ast||'?')+')</span>')+' <b style="color:'+col(b.v)+'">'+pc(b.v)+'</b></summary>'+
        '<table>'+L.map(x=>'<tr><td>'+esc(crews[x.i].name)+'</td><td style="color:#8b9ab0">'+esc(crews[x.i].ast||'–')+'</td><td class="num" style="color:'+col(x.v)+'">'+pc(x.v)+(Math.abs(x.v-x.o)>0.0001?' <span style="color:#8b9ab0">(was '+pc(x.o)+')</span>':'')+'</td></tr>').join('')+'</table>');
      m.appendChild(d)})
  }
  draw();
}

/* Adds "Crew planner" to the Planners menu, before Travel */
{
  const hook=()=>{
    const vr=document.getElementById('vR'),main=document.getElementById('main');
    if(!vr||!main||document.getElementById('vQ'))return;
    const b=document.createElement('button');b.id='vQ';b.textContent='Crew planner';vr.before(b);
    b.addEventListener('click',()=>{
      document.querySelectorAll('button.on').forEach(x=>x.classList.remove('on'));try{window.YIC.view='M'}catch(e){} /* tell the main page an add-on page is showing */
      b.className='on';drawCrewPlan(main)});
  };
  document.addEventListener('click',e=>{const b=document.getElementById('vQ'),t=e.target.closest&&e.target.closest('button[id^="v"]');if(b&&t&&t!==b)b.className=''},true);
  setInterval(hook,700);
  const as=()=>document.getElementById('ast');
  setInterval(()=>{const a=as();if(a&&!a.dataset.cp){a.dataset.cp=1;a.addEventListener('change',()=>{const b=document.getElementById('vQ');if(b&&b.className==='on')setTimeout(()=>drawCrewPlan(document.getElementById('main')),0)})}},1000);
}
