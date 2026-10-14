// Tab title "Test Site" when the page is opened with ?beta=1, so the test tab is easy to spot.
(function(){
  if(!/[?&]beta=1/.test(location.search)) return;
  var T='Test Site';
  function set(){ if(document.title!==T) document.title=T; }
  set();
  setInterval(set,500); // the site rebuilds <head> while loading
})();
