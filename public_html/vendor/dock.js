/* Loading Dock (TEST, ?beta=1 only, 8 Nov 2026) – the one page that will send game actions from the wallet.
   MOCK-UP: example numbers only, nothing is sent yet. Airlock (warning + consent) → Loading Dock. */
(function(){
  var beta=/[?&]beta=1\b/.test(location.search);
  if(!beta){ document.getElementById('wrap').style.display='none'; document.getElementById('betagate').style.display='block'; return; }

(function(){
  // ---- dock mock data ----
  var PER={Iron:50,Graphite:3,Calcium:2};
  var DEST={w1:{name:'Skippys Steel',cap:1500000,now:410000,have:{Iron:120}},
            w2:{name:'Skippys Supplies',cap:1500000,now:1290000,have:{Iron:0}},
            t1:{name:'Skippys Moonshine',cap:75000,now:30000,have:{},tank:true}};
  var SRC={Iron:[['Skippys Troilite',300],['Skippys Supplies',200]],Graphite:[['Skippys Taenite',470]],Calcium:[]};
  var WHERE={Calcium:'in stock on Jiayuguan'};
  function t(n){return n.toLocaleString('en-GB')+' t';}
  function draw(){
    var runs=Math.max(1,parseInt(document.getElementById('runs').value,10)||1);
    var d=DEST[document.getElementById('dest').value];
    var ib='',fb='',mb='',add=0,nmv=0;
    Object.keys(PER).forEach(function(k){
      var need=PER[k]*runs, have=(d.have[k]||0), want=Math.max(0,need-have), left=want, from=[];
      SRC[k].forEach(function(s){ if(left<=0||s[0]===d.name) return; var q=Math.min(left,s[1]); left-=q; from.push([s[0],q]); });
      var moved=want-left; add+=moved;
      ib+='<tr><td>'+k+'</td><td class="num">'+t(need)+'</td><td class="num">'+t(have)+'</td><td class="num">'+t(moved)+'</td><td class="src">'+
        (from.length?from.map(function(f){return f[0]+' ('+t(f[1])+')';}).join('<br>'):'')+
        (left>0?(from.length?'<br>':'')+'<span class="short">'+t(left)+' short – fly in</span>':'')+
        (want===0?'<span class="ok">✓ already there</span>':'')+'</td></tr>';
      if(left>0) fb+='<tr><td>'+k+'</td><td class="num short">'+t(left)+'</td><td class="src">'+(WHERE[k]||'not found on your other rocks – try the market')+'</td></tr>';
      from.forEach(function(f){ nmv++; mb+='<tr><td><input type="checkbox" checked></td><td>'+k+'</td><td class="num">'+t(f[1])+'</td><td class="src">'+f[0]+'</td><td class="src">'+d.name+'</td></tr>'; });
    });
    document.getElementById('inputs').innerHTML=ib;
    document.getElementById('fly').innerHTML=fb;
    document.getElementById('flycard').style.display=fb?'':'none';
    document.getElementById('moves').innerHTML=mb||'<tr><td></td><td colspan="4" class="src">Nothing to move.</td></tr>';
    var pn=d.now/d.cap*100, pa=add/d.cap*100;
    document.getElementById('capnow').style.width=pn+'%';
    var b=document.getElementById('capadd'); b.style.left=pn+'%'; b.style.width=Math.max(pa,.6)+'%';
    document.getElementById('capt').textContent=d.name+': '+pn.toFixed(0)+'% full now';
    var after=(d.now+add)/d.cap*100;
    document.getElementById('room').innerHTML=after>95?'<span style="color:var(--red)">✗ Not enough room – '+d.name+' would be '+after.toFixed(0)+'% full.</span>':'<span class="ok">✓ Room OK – '+d.name+' will be '+after.toFixed(0)+'% full.</span>';
    document.getElementById('desthint').innerHTML=d.tank?'<span style="color:var(--amber)">Tank farms only take fluids – Iron, Graphite and Calcium can\'t go here.</span>':'Blue = in there now · amber = what this will add.';
    document.getElementById('appr').textContent='APPROVE IN WALLET ('+nmv+' move'+(nmv===1?'':'s')+')';
  }
  ['runs','dest'].forEach(function(id){document.getElementById(id).addEventListener('input',draw);});
  document.getElementById('appr').addEventListener('click',function(){document.getElementById('toast').style.display='block';});
  document.getElementById('back2').addEventListener('click',function(e){e.preventDefault();document.getElementById('reset').click();});
  draw();
})();
(function(){
  var ok=document.getElementById('ok'), skip=document.getElementById('skip'), go=document.getElementById('go'),
      sign=document.getElementById('sign'), done=document.getElementById('done'), wrap=document.getElementById('wrap'),
      chamber=document.getElementById('chamber'), KEY='sk_airlock_skip';
  function store(v){try{ if(v) localStorage.setItem(KEY,'1'); else localStorage.removeItem(KEY);}catch(e){}}
  function remembered(){try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}}
  function setSign(t,c){sign.textContent=t;sign.className='sign'+(c?' '+c:'');}
  ok.addEventListener('change',function(){go.disabled=!ok.checked; setSign(ok.checked?'● READY TO CYCLE':'● INNER DOOR LOCKED', ok.checked?'amber':'');});
  function enterDock(){ wrap.style.display='none'; document.body.classList.add('indock'); window.scrollTo(0,0); }
  function openNow(fast){
    setSign('● DOOR OPEN','green'); chamber.classList.add('open'); go.disabled=true;
    if(fast){ enterDock(); return; }
    setTimeout(function(){ wrap.classList.add('gone'); },2300);
    setTimeout(enterDock,2900);
  }
  go.addEventListener('click',function(){
    store(skip.checked);
    go.disabled=true; ok.disabled=true; skip.disabled=true;
    wrap.classList.add('cycling'); chamber.classList.add('cycling');
    setSign('● CYCLING…','amber');
    setTimeout(function(){wrap.classList.remove('cycling');chamber.classList.remove('cycling');openNow();},2800);
  });
  document.getElementById('reset').addEventListener('click',function(){
    store(false); chamber.classList.remove('open','cycling'); wrap.classList.remove('cycling','gone');
    wrap.style.display=''; document.body.classList.remove('indock');
    ok.checked=false; skip.checked=false; ok.disabled=false; skip.disabled=false; go.disabled=true;
    done.style.display='none'; setSign('● INNER DOOR LOCKED');
  });
  if(remembered()){ ok.checked=true; skip.checked=true; openNow(true); }
})();

})();
