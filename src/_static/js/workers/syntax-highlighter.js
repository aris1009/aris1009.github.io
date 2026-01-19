// Syntax highlighting worker for background code highlighting
// Uses Prism.js for syntax highlighting to avoid blocking main thread

// Import Prism.js (will be available in worker context via importScripts)
let Prism = null;

// Load Prism.js in the worker
self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js');

self.addEventListener('message', (event) => {
  const { action, data } = event.data;

  try {
    switch (action) {
      case 'highlight':
        const highlightedCode = highlightCode(data.code, data.language);
        self.postMessage({ success: true, result: highlightedCode });
        break;

      case 'highlightAll':
        const highlightedBlocks = data.codeBlocks.map(block =>
          highlightCode(block.code, block.language)
        );
        self.postMessage({ success: true, result: highlightedBlocks });
        break;

      default:
        self.postMessage({ success: false, error: `Unknown action: ${action}` });
    }
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});

function highlightCode(code, language) {
  if (!self.Prism) {
    // Fallback if Prism loading failed
    return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  }

  try {
    const highlighted = self.Prism.highlight(code, self.Prism.languages[language] || self.Prism.languages.plain, language);
    return `<pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
  } catch (error) {
    // Fallback to plain text if highlighting fails
    return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}