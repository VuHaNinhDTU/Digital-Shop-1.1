// Utilities for Cho Nong San So
// Common functions and helpers

// Toast notification system
class ToastManager {
  constructor() {
    this.toasts = [];
    this.container = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createContainer());
    } else {
      this.createContainer();
    }
  }

  createContainer() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      if (document.body) {
        document.body.appendChild(this.container);
      }
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', title = '', duration = 4000) {
    // Ensure container is created
    if (!this.container) {
      this.createContainer();
    }
    
    // If still no container, skip
    if (!this.container) {
      console.warn('Toast container not available');
      return null;
    }

    const toast = document.createElement('div');
    const toastId = Date.now() + Math.random();
    
    const icons = {
      success: '<i class="fa fa-check-circle"></i>',
      error: '<i class="fa fa-exclamation-circle"></i>',
      warning: '<i class="fa fa-exclamation-triangle"></i>',
      info: '<i class="fa fa-info-circle"></i>'
    };

    toast.className = `toast ${type}`;
    toast.style.pointerEvents = 'auto';
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="toastManager.remove(${toastId})">&times;</button>
    `;

    toast.dataset.id = toastId;
    this.container.appendChild(toast);
    this.toasts.push({ id: toastId, element: toast });

    // Show animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(toastId), duration);
    }

    return toastId;
  }

  remove(toastId) {
    const toastData = this.toasts.find(t => t.id == toastId);
    if (toastData) {
      toastData.element.classList.remove('show');
      setTimeout(() => {
        if (toastData.element.parentNode) {
          toastData.element.parentNode.removeChild(toastData.element);
        }
        this.toasts = this.toasts.filter(t => t.id !== toastId);
      }, 300);
    }
  }

  success(message, title = 'Thành công!') {
    return this.show(message, 'success', title);
  }

  error(message, title = 'Lỗi!') {
    return this.show(message, 'error', title);
  }

  warning(message, title = 'Cảnh báo!') {
    return this.show(message, 'warning', title);
  }

  info(message, title = '') {
    return this.show(message, 'info', title);
  }
}

// Loading overlay
class LoadingManager {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
  }

  show(message = 'Đang tải...') {
    if (this.isVisible) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'loading-overlay';
    this.overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div>${message}</div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.isVisible = true;
  }

  hide() {
    if (this.overlay && this.isVisible) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        if (this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.isVisible = false;
      }, 300);
    }
  }
}

// Form validation utilities
class FormValidator {
  static rules = {
    required: (value) => value && value.trim() !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^[0-9]{10,11}$/.test(value.replace(/\s/g, '')),
    number: (value) => !isNaN(value) && value > 0,
    minLength: (value, min) => value && value.length >= min,
    maxLength: (value, max) => value && value.length <= max
  };

  static validate(input, rules) {
    const value = input.value;
    const errors = [];

    for (const rule of rules) {
      if (typeof rule === 'string') {
        if (!this.rules[rule](value)) {
          errors.push(this.getErrorMessage(rule));
        }
      } else if (typeof rule === 'object') {
        const [ruleName, param] = Object.entries(rule)[0];
        if (!this.rules[ruleName](value, param)) {
          errors.push(this.getErrorMessage(ruleName, param));
        }
      }
    }

    this.updateInputState(input, errors);
    return errors;
  }

  static getErrorMessage(rule, param) {
    const messages = {
      required: 'Trường này là bắt buộc',
      email: 'Email không hợp lệ',
      phone: 'Số điện thoại không hợp lệ',
      number: 'Phải là số hợp lệ',
      minLength: `Tối thiểu ${param} ký tự`,
      maxLength: `Tối đa ${param} ký tự`
    };
    return messages[rule] || 'Dữ liệu không hợp lệ';
  }

  static updateInputState(input, errors) {
    const group = input.closest('.form-group') || input.parentNode;
    
    // Remove old error/success states
    input.classList.remove('error', 'success');
    const oldFeedback = group.querySelector('.form-error, .form-success');
    if (oldFeedback) oldFeedback.remove();

    if (errors.length > 0) {
      input.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-error';
      errorDiv.innerHTML = `<i class="fa fa-exclamation-circle"></i> ${errors[0]}`;
      group.appendChild(errorDiv);
    } else if (input.value.trim()) {
      input.classList.add('success');
      const successDiv = document.createElement('div');
      successDiv.className = 'form-success';
      successDiv.innerHTML = '<i class="fa fa-check-circle"></i> Hợp lệ';
      group.appendChild(successDiv);
    }
  }
}

// Lazy image loading
class LazyImageLoader {
  constructor() {
    this.images = [];
    this.imageObserver = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
          }
        });
      });
    }
  }

  observe(img) {
    if (this.imageObserver) {
      img.classList.add('lazy-image', 'loading');
      this.imageObserver.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  loadImage(img) {
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = tempImg.src;
      img.classList.remove('loading');
      img.classList.add('loaded');
      if (this.imageObserver) {
        this.imageObserver.unobserve(img);
      }
    };
    tempImg.onerror = () => {
      img.classList.remove('loading');
      img.src = 'https://via.placeholder.com/120x120?text=Error';
    };
    tempImg.src = img.dataset.src || img.src;
  }
}

// Skeleton loading for product cards
function createProductSkeleton() {
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text long"></div>
      <div class="skeleton skeleton-text medium"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-button"></div>
    </div>
  `;
}

// Animation utilities
function animateElement(element, animationType = 'fade-in') {
  element.classList.add(animationType);
  element.addEventListener('animationend', () => {
    element.classList.remove(animationType);
  }, { once: true });
}

// Button loading state
function setButtonLoading(button, loading = true) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// Query parameter utilities
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function setQueryParam(name, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState({}, '', url);
}

// Global Cart Navigation Function
function goToCart() {
  // Force navigate to cart page
  window.location.href = '/cart.html';
}

// Global function to update all cart links on page load
function ensureCartLinksWork() {
  // Find all cart links and ensure they work
  const cartLinks = document.querySelectorAll('a[href*="cart"], a[href="#cart"], .cart-link, [data-cart-link]');
  
  cartLinks.forEach(link => {
    // Update href if it's not correct
    if (link.href && !link.href.includes('cart.html')) {
      link.href = '/cart.html';
    }
    
    // Add click handler as backup
    link.addEventListener('click', function(e) {
      if (this.href.includes('#') || this.href === '') {
        e.preventDefault();
        goToCart();
      }
    });
  });
  
  // Handle cart icons specifically
  const cartIcons = document.querySelectorAll('.fa-shopping-cart');
  cartIcons.forEach(icon => {
    const parentLink = icon.closest('a');
    
    // Skip if we're on seller dashboard or if parent link has data-section attribute
    if (window.location.pathname.includes('seller-dashboard.html') || 
        (parentLink && parentLink.hasAttribute('data-section'))) {
      return; // Skip this icon, don't override its behavior
    }
    
    if (parentLink && (!parentLink.href || parentLink.href.includes('#'))) {
      parentLink.href = '/cart.html';
      parentLink.addEventListener('click', function(e) {
        e.preventDefault();
        goToCart();
      });
    }
  });
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', function() {
  ensureCartLinksWork();
});

// Also run after a short delay to catch dynamically loaded content
setTimeout(ensureCartLinksWork, 1000);

// Initialize global instances after DOM ready
function initializeUtils() {
  const toastManager = new ToastManager();
  const loadingManager = new LoadingManager();
  const lazyImageLoader = new LazyImageLoader();

  // Export for use in other files
  window.toastManager = toastManager;
  window.loadingManager = loadingManager;
  window.lazyImageLoader = lazyImageLoader;
  window.FormValidator = FormValidator;
  window.createProductSkeleton = createProductSkeleton;
  window.animateElement = animateElement;
  window.setButtonLoading = setButtonLoading;
  window.getQueryParam = getQueryParam;
  window.setQueryParam = setQueryParam;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUtils);
} else {
  initializeUtils();
} 