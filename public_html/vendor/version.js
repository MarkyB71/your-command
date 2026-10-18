// Site version in the footer, from version.json (written automatically on every deploy by deploy/stamp.sh).
(function(){
  fetch('version.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(v){
    if(!v||!v.n) return;
    var txt='Version '+v.n+(v.date?' · '+v.date:'');
    var tries=0, t=setInterval(function(){
      var f=[].find.call(document.querySelectorAll('body > div'),function(d){return /^A community tool from Adalia Academy/.test(d.textContent)});
      if(f){ f.textContent=f.textContent.replace(/ · Version .*$/,'')+' · '+txt; f.title='Commit '+(v.commit||''); clearInterval(t); }
      else if(++tries>120) clearInterval(t);
    },500);
  }).catch(function(){});
})();
