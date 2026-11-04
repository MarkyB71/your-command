// Skippy's Command Deck – finds the game's 3D store as the game starts up (runs on game.influenceth.io, in the page).
// Shared by the status dots and the map tags, so it runs even if one of them is switched off.
// react-three-fiber puts a small "__r3f" record on every 3D object it makes, and that record points at
// the 3D store (camera, scene, canvas). For a moment we watch for the first one being set, keep its
// store in window.__yicR3f, then remove the watcher. It has to run at page start: the game makes its
// objects while loading. Reads only – changes nothing.
(() => {
  if (window.top !== window || window.__yicR3f) return;
  const KEY = '__r3f';
  function stopWatching() {
    const d = Object.getOwnPropertyDescriptor(Object.prototype, KEY);
    if (d && d.set === watcher) delete Object.prototype[KEY];
  }
  function watcher(v) {
    if (v && v.root && typeof v.root.getState === 'function' && !window.__yicR3f) {
      Object.defineProperty(window, '__yicR3f', { value: v.root, configurable: true });
      stopWatching();
    }
    Object.defineProperty(this, KEY, { value: v, writable: true, configurable: true, enumerable: true });
  }
  if (!Object.getOwnPropertyDescriptor(Object.prototype, KEY)) {
    Object.defineProperty(Object.prototype, KEY, { configurable: true, set: watcher });
    setTimeout(stopWatching, 120000); // never leave it on
  }
})();
