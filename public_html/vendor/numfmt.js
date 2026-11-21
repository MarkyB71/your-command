/* Number format (community idea, Mark 21 Nov 2026 – TEST ONLY, ?beta=1): a player asked for European numbers –
   "2,000 t" reads as 2 tonnes where a comma is the decimal point. Choice in Deck controls, saved in this browser
   ('yic-numfmt'): uk = 1,234.5 (as now) · eu = 1.234,5 · sp = 1 234,5. Works by giving every number's toLocaleString
   the chosen style, so the whole site follows (dates are not touched). Loaded before app.js. */
(function () {
  const NFM = /[?&]beta=1\b/.test(location.search);
  const K = 'yic-numfmt', LOC = { eu: 'de-DE', sp: 'fr-FR' };
  const get = () => { try { return localStorage.getItem(K) || 'uk'; } catch (e) { return 'uk'; } };
  const orig = Number.prototype.toLocaleString;
  if (NFM) Number.prototype.toLocaleString = function (loc, opt) {
    const f = get();
    return LOC[f] ? orig.call(this, LOC[f], opt) : orig.call(this, loc, opt);
  };
  window.YICnumfmt = { on: NFM, get, set: (v) => { try { localStorage.setItem(K, v); } catch (e) {} } };
})();
