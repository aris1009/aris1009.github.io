// Back to Top Button Functionality
(function() {
  'use strict';

  const SCROLL_THRESHOLD = 300;

  // Only activate on article pages
  if (!document.querySelector('article[data-blog-post]')) {
    return;
  }

  const backToTopBtn = document.getElementById('back-to-top');

  if (!backToTopBtn) {
    console.warn('Back to top button not found');
    return;
  }

  // Function to update button visibility based on scroll position
  function updateButtonVisibility() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      backToTopBtn.classList.add('back-to-top--visible');
    } else {
      backToTopBtn.classList.remove('back-to-top--visible');
    }
  }

  // Function to scroll to top
  function scrollToTop() {
    window.scrollTo({
      top: 0
    });
  }

  // Add scroll listener with passive option for better performance
  window.addEventListener('scroll', updateButtonVisibility, { passive: true });

  // Add click listener to button
  backToTopBtn.addEventListener('click', scrollToTop);

  // Initial check in case page is loaded with scroll position
  updateButtonVisibility();
})();