// Skippy's Command Deck – options. Saved in your browser (chrome.storage.sync) only.
const DEFAULTS = { sideButton: true, lotColours: true, hideUsedDeposits: true, autoSample: true, chainLink: true, deckStrip: true, statusDots: true, crewFood: true, shipProp: true, mapTags: true, mapMarkets: true, mapFlights: true, flightsFriendly: true, flightsNeutral: true, flightsHostile: true, flightsOther: true, tagCol_friendly: '#88e675', tagCol_neutral: '#ffd94f', tagCol_hostile: '#ff564d' };
const box = document.getElementById('opts');
chrome.storage.sync.get(DEFAULTS, o => {
  box.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.checked = !!o[cb.name];
    cb.addEventListener('change', () => {
      chrome.storage.sync.set({ [cb.name]: cb.checked }, () => {
        const s = document.getElementById('saved');
        s.textContent = 'Saved'; clearTimeout(s._t); s._t = setTimeout(() => { s.textContent = ''; }, 1500);
      });
    });
  });
  box.querySelectorAll('input[type=color]').forEach(c => {
    c.value = o[c.name];
    c.addEventListener('change', () => {
      chrome.storage.sync.set({ [c.name]: c.value }, () => {
        const s = document.getElementById('saved');
        s.textContent = 'Saved'; clearTimeout(s._t); s._t = setTimeout(() => { s.textContent = ''; }, 1500);
      });
    });
  });
});
