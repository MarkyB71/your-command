// Skippy's Command Deck – options. Saved in your browser (chrome.storage.sync) only.
const DEFAULTS = { sideButton: true, lotColours: true, hideUsedDeposits: true, statusDots: false };
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
});
