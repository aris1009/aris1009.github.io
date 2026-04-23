import { loadWordlist } from './wordlist-loader.js';
import { pickWords, wordlistMapToArray } from './picker.js';
import {
  BITS_PER_WORD,
  entropyBits,
  crackTimes
} from './crack-time.js';
import { pickAnchorForLog2Seconds } from './anchors.js';

const root = document.getElementById('diceware-app');
if (root) init(root).catch((err) => setStatus(String(err.message || err), 'error'));

function setStatus(message, kind = 'info') {
  const el = document.getElementById('diceware-status');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('text-red-600', kind === 'error');
  el.classList.toggle('dark:text-red-400', kind === 'error');
}

async function init(root) {
  const url = root.dataset.wordlistUrl;
  const expectedSha256 = root.dataset.wordlistSha256;
  if (!url || !expectedSha256) {
    setStatus('Page misconfigured: wordlist metadata missing.', 'error');
    return;
  }

  const countEl = document.getElementById('dw-count');
  const sepEl = document.getElementById('dw-separator');
  const capEl = document.getElementById('dw-capitalize');
  const genBtn = document.getElementById('dw-generate');
  const copyBtn = document.getElementById('dw-copy');
  const outEl = document.getElementById('dw-output');
  const entropyEl = document.getElementById('dw-entropy-value');
  const ctEl = document.getElementById('dw-crack-times');
  const anchorEl = document.getElementById('dw-anchor');

  let words = null;

  try {
    const map = await loadWordlist({ url, expectedSha256 });
    words = wordlistMapToArray(map);
    setStatus(`Wordlist loaded (${words.length} words, integrity verified).`);
    genBtn.disabled = false;
  } catch (err) {
    setStatus(
      err.name === 'WordlistIntegrityError'
        ? 'Wordlist integrity check failed — refusing to generate.'
        : `Failed to load wordlist: ${err.message}`,
      'error'
    );
    return;
  }

  function currentCount() {
    const raw = Number(countEl.value);
    if (!Number.isInteger(raw)) return 6;
    return Math.min(12, Math.max(4, raw));
  }

  function generate() {
    const n = currentCount();
    countEl.value = String(n);
    const drawn = pickWords(n, words);
    const cap = capEl.checked;
    const sep = sepEl.value;
    const phrase = drawn
      .map((w) => (cap ? w[0].toUpperCase() + w.slice(1) : w))
      .join(sep);
    outEl.textContent = phrase;
    copyBtn.disabled = false;
    renderEntropy(n);
  }

  function renderEntropy(n) {
    const bits = entropyBits(n);
    entropyEl.textContent = `${n} words × ${BITS_PER_WORD.toFixed(4)} bits = ${bits.toFixed(2)} bits`;
    const rows = crackTimes(bits);
    ctEl.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'w-full text-sm border-collapse';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th class="text-left py-1 pr-4">Attacker</th><th class="text-left py-1">Average time to crack</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const row of rows) {
      const tr = document.createElement('tr');
      tr.className = row.highlight
        ? 'font-semibold text-amber-700 dark:text-amber-400'
        : '';
      const td1 = document.createElement('td');
      td1.className = 'py-1 pr-4';
      td1.textContent = row.label;
      const td2 = document.createElement('td');
      td2.className = 'py-1 font-mono';
      td2.textContent = row.formatted;
      tr.append(td1, td2);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    ctEl.appendChild(table);

    const offlineFast = rows.find((r) => r.id === 'offline_fast');
    const anchor = pickAnchorForLog2Seconds(offlineFast.log2Seconds);
    anchorEl.textContent = `For scale (offline fast attacker): ${anchor.phrase}.`;
  }

  genBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', async () => {
    if (!outEl.textContent.trim()) return;
    try {
      await navigator.clipboard.writeText(outEl.textContent);
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    } catch {
      setStatus('Clipboard unavailable — select the passphrase manually.', 'error');
    }
  });

  generate();
}
