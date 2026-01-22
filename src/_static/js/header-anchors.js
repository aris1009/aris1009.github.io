// Add click handlers to headers for URL fragment updates
document.addEventListener('DOMContentLoaded', () => {
  const headers = document.querySelectorAll('article h2[id], article h3[id]');

  headers.forEach(header => {
    header.style.cursor = 'pointer';

    header.addEventListener('click', () => {
      const id = header.getAttribute('id');
      if (id) {
        // Update URL without scrolling
        history.pushState(null, '', `#${id}`);
      }
    });
  });
});
