// Site voice (Mark, 14 Nov 2026) – the Logistics Hub airlock and welcome are spoken with speechSynthesis.
// Left alone, Brave/Chrome often give a robotic default (newer Mac Siri voices aren't offered to browsers, and
// Brave's fingerprint protection can change the list). So the site picks the best-sounding voice the browser
// offers, and the player can choose another (or none) in Deck controls. Choice saved in this browser only.
// TEST ONLY (?beta=1) – window.YICvoice.on is false on the live site, and nothing changes there.
(function () {
  const ON = /[?&]beta=1\b/.test(location.search);
  const KEY = 'yic-voice'; // '' = pick for me, '-' = no voice, else a voice name
  // Novelty / old voices that sound robotic – never picked automatically (can still be chosen by hand).
  const ODD = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Rocko|Shelley|Sandy|Flo|Eddy|Reed)\b/i;
  // Natural-sounding voices, best first.
  const GOOD = [/Daniel/i, /Google UK English Male/i, /Microsoft (Ryan|Thomas|George)/i, /Arthur/i, /Oliver/i, /Google UK English Female/i, /Microsoft (Sonia|Libby|Hazel)/i, /Serena/i, /Kate/i, /Google US English/i, /Microsoft (Guy|Aria|Jenny|David|Mark)/i, /Alex/i, /Samantha/i];

  const get = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  const set = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };
  const list = () => { try { return speechSynthesis.getVoices() || []; } catch (e) { return []; } };

  function best() {
    const en = list().filter((v) => /^en/i.test(v.lang) && !ODD.test(v.name));
    if (!en.length) return null;
    const score = (v) => {
      let s = 0;
      const g = GOOD.findIndex((r) => r.test(v.name));
      if (g >= 0) s += 100 - g * 5;
      if (/premium|enhanced|natural|neural/i.test(v.name)) s += 30;
      if (/^en[-_]GB/i.test(v.lang)) s += 10;
      return s;
    };
    return en.slice().sort((a, b) => score(b) - score(a))[0];
  }

  // The voice to use now: null = browser default; false = stay silent.
  function pick() {
    const c = get();
    if (c === '-') return false;
    if (c) { const v = list().find((x) => x.name === c); if (v) return v; }
    return best();
  }

  // Put the chosen voice on an utterance. Returns false if the player chose no voice.
  function apply(u) {
    if (!ON) return true;
    const v = pick();
    if (v === false) return false;
    if (v) { u.voice = v; u.lang = v.lang; }
    return true;
  }

  try { speechSynthesis.getVoices(); } catch (e) {} // Chrome fills the list a moment after the first ask
  window.YICvoice = { on: ON, get, set, list, best, pick, apply };
})();
