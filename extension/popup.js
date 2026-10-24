const s = document.getElementById('s');
document.getElementById('go').onclick = () => {
  const n = document.getElementById('n').value.replace(/[^0-9]/g, '');
  if (!n) { s.textContent = 'Type an ID number first.'; return; }
  const path = '/' + document.getElementById('k').value + '/' + n;
  chrome.runtime.sendMessage({ type: 'yic-open', path }, r => {
    s.textContent = r && r.ok
      ? (r.mode === 'same-tab' ? 'Sent to your game tab.' : 'No game tab open – opened a new one.')
      : 'Did not work: ' + ((r && r.error) || 'unknown');
  });
};
