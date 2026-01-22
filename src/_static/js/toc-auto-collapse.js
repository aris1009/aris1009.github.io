// Auto-collapse TOC after clicking a link
document.addEventListener('DOMContentLoaded', () => {
  const tocDetails = document.querySelector('sl-details.toc-details');

  if (tocDetails) {
    // Listen for clicks on TOC links
    tocDetails.addEventListener('click', (e) => {
      // Check if clicked element is a link inside .toc-nav
      const link = e.target.closest('.toc-nav a');
      if (link) {
        // Disable smooth scroll temporarily for instant navigation
        const originalBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';

        // Collapse TOC
        tocDetails.hide();

        // Restore smooth scroll after navigation completes
        setTimeout(() => {
          document.documentElement.style.scrollBehavior = originalBehavior;
        }, 50);
      }
    });
  }
});
