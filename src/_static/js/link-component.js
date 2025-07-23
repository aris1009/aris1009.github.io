/**
 * Link Component JavaScript
 * Handles dictionary tooltip functionality
 */

class LinkComponent {
  constructor() {
    this.activeTooltip = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // Handle dictionary link clicks
    document.addEventListener('click', (e) => {
      const dictionaryLink = e.target.closest('.dictionary-link');
      
      if (dictionaryLink) {
        e.preventDefault();
        this.toggleTooltip(dictionaryLink);
      } else if (!e.target.closest('.dictionary-tooltip')) {
        // Click outside tooltip - close it
        this.closeActiveTooltip();
      }
    });

    // Handle tooltip close button clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tooltip-close')) {
        e.preventDefault();
        this.closeActiveTooltip();
      }
    });

    // Handle keyboard events for accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActiveTooltip();
      }
    });

    // Handle window resize to reposition tooltips
    window.addEventListener('resize', () => {
      if (this.activeTooltip) {
        this.positionTooltip(this.activeTooltip.link, this.activeTooltip.tooltip);
      }
    });
  }

  toggleTooltip(dictionaryLink) {
    const term = dictionaryLink.getAttribute('data-dictionary-term');
    const tooltipId = `tooltip-${term}`;
    const tooltip = document.getElementById(tooltipId);

    if (!tooltip) {
      console.warn(`Tooltip not found for term: ${term}`);
      return;
    }

    // Close any existing tooltip
    if (this.activeTooltip && this.activeTooltip.tooltip !== tooltip) {
      this.closeActiveTooltip();
    }

    // Toggle current tooltip
    const isVisible = tooltip.classList.contains('show');
    
    if (isVisible) {
      this.closeTooltip(dictionaryLink, tooltip);
    } else {
      this.showTooltip(dictionaryLink, tooltip);
    }
  }

  showTooltip(dictionaryLink, tooltip) {
    // Set ARIA attributes
    dictionaryLink.setAttribute('aria-expanded', 'true');
    
    // Show tooltip
    tooltip.classList.remove('hidden');
    tooltip.classList.add('show');
    
    // Position tooltip
    this.positionTooltip(dictionaryLink, tooltip);
    
    // Track active tooltip
    this.activeTooltip = { link: dictionaryLink, tooltip };

    // Focus management for accessibility
    const closeButton = tooltip.querySelector('.tooltip-close');
    if (closeButton) {
      closeButton.focus();
    }
  }

  closeTooltip(dictionaryLink, tooltip) {
    // Set ARIA attributes
    dictionaryLink.setAttribute('aria-expanded', 'false');
    
    // Hide tooltip
    tooltip.classList.remove('show');
    tooltip.classList.add('hidden');
    
    // Clear active tooltip if this was it
    if (this.activeTooltip && this.activeTooltip.tooltip === tooltip) {
      this.activeTooltip = null;
    }

    // Return focus to the link
    dictionaryLink.focus();
  }

  closeActiveTooltip() {
    if (this.activeTooltip) {
      this.closeTooltip(this.activeTooltip.link, this.activeTooltip.tooltip);
    }
  }

  positionTooltip(dictionaryLink, tooltip) {
    const linkRect = dictionaryLink.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate ideal position (above the link, centered)
    let left = linkRect.left + (linkRect.width / 2);
    let top = linkRect.top - 10; // 10px gap above the link
    
    // Adjust horizontal position to keep tooltip in viewport
    const tooltipHalfWidth = tooltipRect.width / 2;
    
    if (left - tooltipHalfWidth < 10) {
      // Too far left
      left = tooltipHalfWidth + 10;
    } else if (left + tooltipHalfWidth > viewportWidth - 10) {
      // Too far right
      left = viewportWidth - tooltipHalfWidth - 10;
    }
    
    // Adjust vertical position if tooltip would go above viewport
    if (top - tooltipRect.height < 10) {
      // Show below the link instead
      top = linkRect.bottom + 10;
      tooltip.style.transform = 'translate(-50%, 0)';
    } else {
      // Show above the link (default)
      tooltip.style.transform = 'translate(-50%, -100%)';
    }
    
    // Apply positioning
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
}

// Initialize the component
new LinkComponent();