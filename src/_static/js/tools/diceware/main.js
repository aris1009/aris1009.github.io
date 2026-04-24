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

  // crypto.subtle (used to verify the wordlist hash) is a secure-context
  // feature. On plain HTTP the API is undefined by design, in every browser,
  // so we refuse to run rather than silently skipping integrity verification.
  // crypto.getRandomValues itself works outside secure contexts; the blocker
  // is the hash check, which is non-negotiable.
  if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) {
    setStatus(
      'This generator requires a secure context (HTTPS, or localhost). The ' +
        'browser disables crypto.subtle on plain HTTP, so the wordlist ' +
        'integrity check cannot run. Visit the site over HTTPS.',
      'error'
    );
    return;
  }

  const countEl = document.getElementById('dw-count');
  const countValueEl = document.getElementById('dw-count-value');
  const sepEl = document.getElementById('dw-separator');
  const capEl = document.getElementById('dw-capitalize');
  const genBtn = document.getElementById('dw-generate');
  const copyBtn = document.getElementById('dw-copy');
  const outEl = document.getElementById('dw-output');
  const entropyEl = document.getElementById('dw-entropy-value');
  const ctEl = document.getElementById('dw-crack-times');
  const anchorEl = document.getElementById('dw-anchor');

  let words = null;

  // Wait for Shoelace to upgrade our custom elements so property access
  // (sepEl.value, capEl.checked, countEl.value) returns the real values
  // rather than the pre-upgrade defaults.
  if (window.customElements) {
    await Promise.all([
      customElements.whenDefined('sl-range'),
      customElements.whenDefined('sl-radio-group'),
      customElements.whenDefined('sl-radio-button'),
      customElements.whenDefined('sl-switch'),
      customElements.whenDefined('sl-icon-button'),
      customElements.whenDefined('sl-copy-button'),
      customElements.whenDefined('sl-tooltip')
    ]);
  }

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
    if (!Number.isFinite(raw)) return 6;
    return Math.min(12, Math.max(4, Math.round(raw)));
  }

  function generate() {
    if (!words) return;
    const n = currentCount();
    countValueEl.textContent = String(n);
    const drawn = pickWords(n, words);
    const cap = capEl.checked === true;
    const sep = sepEl.value != null ? sepEl.value : (sepEl.getAttribute('value') || '-');
    const phrase = drawn
      .map((w) => (cap ? w[0].toUpperCase() + w.slice(1) : w))
      .join(sep);
    outEl.textContent = phrase;
    copyBtn.value = phrase;
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

  // Manual regenerate.
  genBtn.addEventListener('click', generate);

  // Auto-regenerate on any form change. sl-range and sl-switch fire sl-change
  // (rather than the native change event) when the user commits a value;
  // sl-radio-group fires sl-change when the selected radio flips.
  countEl.addEventListener('sl-change', generate);
  countEl.addEventListener('sl-input', () => {
    countValueEl.textContent = String(currentCount());
  });
  sepEl.addEventListener('sl-change', generate);
  capEl.addEventListener('sl-change', generate);

  // Initial draw.
  generate();
}
