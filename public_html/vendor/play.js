// Play Influence button – sits just before SkipCoin in the menu row.
// TEST: only shown with ?beta=1 in the address.
(function(){
  const BETA=/[?&]beta=1/.test(location.search);
  if(!BETA) return;
  const GAME='https://game.influenceth.io';
  // Always glowing (brighter than other buttons), gentle pulse; brightest on hover.
  const CSS='#play{color:#d8f7ff!important;font-weight:700;border-color:#8fe3ff!important;'+
    'box-shadow:0 0 8px rgba(143,227,255,.95),0 0 22px rgba(91,157,255,.75)!important;'+
    'text-shadow:0 0 8px rgba(143,227,255,.9);animation:playGlow 2.4s ease-in-out infinite}'+
    '@keyframes playGlow{0%,100%{box-shadow:0 0 8px rgba(143,227,255,.95),0 0 22px rgba(91,157,255,.75)}'+
    '50%{box-shadow:0 0 12px rgba(180,240,255,1),0 0 34px rgba(91,157,255,.95)}}'+
    '#play:hover,#play:focus-visible{color:#fff!important;animation:none;'+
    'box-shadow:0 0 14px rgba(200,245,255,1),0 0 40px rgba(91,157,255,1)!important;text-shadow:0 0 10px #fff}'+
    '@media (prefers-reduced-motion:reduce){#play{animation:none}}';
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
