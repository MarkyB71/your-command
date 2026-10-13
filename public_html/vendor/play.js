// Play Influence button – sits just before SkipCoin in the menu row.
// TEST: only shown with ?beta=1 in the address.
(function(){
  const BETA=/[?&]beta=1/.test(location.search);
  if(!BETA) return;
  const GAME='https://game.influenceth.io';
  const CSS='#play{color:#8fe3ff!important;font-weight:600;transition:box-shadow .2s,color .2s,border-color .2s}'+
    '#play:hover,#play:focus-visible{color:#c8f3ff!important;border-color:#8fe3ff!important;'+
    'box-shadow:0 0 6px rgba(143,227,255,.9),0 0 18px rgba(91,157,255,.55)!important;text-shadow:0 0 6px rgba(143,227,255,.7)}';
  function tick(){
    if(!document.getElementById('play-css')&&document.head){
      const st=document.createElement('style');st.id='play-css';st.textContent=CSS;document.head.appendChild(st);
    }
    const don=document.getElementById('don');
    if(don&&!document.getElementById('play')){
      const b=document.createElement('button');
      b.id='play';b.type='button';b.textContent='▶ Play Influence';b.title='Open the game (reuses one game tab)';
      b.addEventListener('click',()=>{const w=window.open(GAME,'influencegame');if(w)w.focus();});
      don.before(b);
    }
  }
  setInterval(tick,700);tick();
})();
