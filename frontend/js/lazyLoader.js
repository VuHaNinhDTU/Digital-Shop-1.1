/**
 * 🚀 CHỢ NÔNG SÂN SỐ - INTELLIGENT LAZY LOADING SYSTEM
 * Complete lazy loading với smooth animations và performance monitoring
 */

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      // Performance Settings
      rootMargin: '50px 0px',
      threshold: 0.1,
      enableWebP: true,
      enableBlurUpload: true,
      enableSmoothAnimation: true,
      
      // Animation Settings
      fadeInDuration: 300,
      blurTransition: 200,
      scaleTransition: 150,
      
      // Retry Settings
      maxRetries: 3,
      retryDelay: 1000,
      
      // Performance Monitoring
      enablePerformanceTracking: true,
      ...options
    };
    
    this.observer = null;
    this.performanceData = {
      imagesLoaded: 0,
      loadTimes: [],
      errors: 0,
      webpSupported: false,
      totalSaved: 0
    };
    
    this.init();
  }

  // ========================================
  // INITIALIZATION & SETUP
  // ========================================

  async init() {
    console.log('🖼️ Initializing Lazy Loading System...');
    
    // Check WebP support
    this.performanceData.webpSupported = await this.checkWebPSupport();
    
    // Setup Intersection Observer
    this.setupIntersectionObserver();
    
    // Add CSS animations
    this.injectLazyStyles();
    
    // Start observing
    this.observeImages();
    
    // Setup performance monitoring
    if (this.options.enablePerformanceTracking) {
      this.setupPerformanceMonitoring();
    }
    
    console.log('✅ Lazy Loading System ready!');
  }

  checkWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    });
  }

  // ========================================
  // CSS ANIMATIONS & STYLING
  // ========================================

  injectLazyStyles() {
    const styles = `
      <style id="lazy-loader-styles">
        .lazy-image {
          opacity: 0;
          transition: all ${this.options.fadeInDuration}ms ease-in-out;
          transform: scale(1.05);
          filter: blur(5px);
        }
        
        .lazy-image.loading {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        .lazy-image.loaded {
          opacity: 1;
          transform: scale(1);
          filter: blur(0px);
        }
        
        .lazy-image.error {
          opacity: 0.7;
          background: #f5f5f5;
          border: 2px dashed #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 14px;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .lazy-container {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }
        
        .lazy-blur-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          filter: blur(20px);
          transform: scale(1.1);
          transition: opacity ${this.options.blurTransition}ms ease;
        }
        
        .lazy-blur-placeholder.hidden {
          opacity: 0;
        }
        
        .performance-indicator {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 9999;
          display: none;
        }
        
        .performance-indicator.show {
          display: block;
          animation: slideIn 300ms ease-out;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // ========================================
  // IMAGE LOADING & OPTIMIZATION
  // ========================================

  async loadImage(img, retries = 0) {
    const startTime = performance.now();
    
    try {
      // Add loading class
      img.classList.add('loading');
      
      // Get optimized image source
      const optimizedSrc = this.getOptimizedImageSrc(img);
      
      // Create new image for preloading
      const imageLoader = new Image();
      
      imageLoader.onload = () => {
        // Calculate load time
        const loadTime = performance.now() - startTime;
        this.trackPerformance(loadTime, true);
        
        // Apply smooth transition
        this.applyImageTransition(img, imageLoader.src, loadTime);
      };
      
      imageLoader.onerror = () => {
        this.handleImageError(img, retries);
      };
      
      // Start loading
      imageLoader.src = optimizedSrc;
      
    } catch (error) {
      console.error('Lazy loading error:', error);
      this.handleImageError(img, retries);
    }
  }

  getOptimizedImageSrc(img) {
    let src = img.dataset.src || img.src;
    
    // WebP conversion for supported browsers
    if (this.performanceData.webpSupported && this.options.enableWebP) {
      // Convert to WebP if not already
      if (!src.includes('.webp')) {
        src = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }
    }
    
    // Add responsive sizing
    const rect = img.getBoundingClientRect();
    if (rect.width > 0) {
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.ceil(rect.width * dpr);
      
      // Add width parameter if URL supports it
      if (src.includes('?')) {
        src += `&w=${targetWidth}`;
      } else {
        src += `?w=${targetWidth}`;
      }
    }
    
    return src;
  }

  applyImageTransition(img, src, loadTime) {
    // Remove loading class
    img.classList.remove('loading');
    
    // Mark as loaded and stop observing
    img.dataset.loaded = 'true';
    this.observer.unobserve(img);
    
    // Create blur placeholder effect
    if (this.options.enableBlurUpload && img.dataset.placeholder) {
      this.createBlurPlaceholder(img);
    }
    
    // Set final image source
    img.src = src;
    
    // Add loaded class with delay for smooth animation
    setTimeout(() => {
      img.classList.add('loaded');
      
      // Show performance indicator
      if (this.options.enablePerformanceTracking) {
        this.showPerformanceIndicator(loadTime);
      }
    }, 50);
  }

  createBlurPlaceholder(img) {
    const container = img.parentElement;
    if (!container.classList.contains('lazy-container')) {
      // Wrap image in container
      const wrapper = document.createElement('div');
      wrapper.className = 'lazy-container';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }
    
    // Create blur placeholder
    const placeholder = document.createElement('img');
    placeholder.className = 'lazy-blur-placeholder';
    placeholder.src = img.dataset.placeholder;
    container.insertBefore(placeholder, img);
    
    // Hide placeholder after main image loads
    img.addEventListener('load', () => {
      setTimeout(() => {
        placeholder.classList.add('hidden');
        setTimeout(() => placeholder.remove(), this.options.blurTransition);
      }, 100);
    });
  }

  // ========================================
  // ERROR HANDLING & RETRY LOGIC
  // ========================================

  handleImageError(img, retries) {
    // Prevent infinite retries - mark as processing
    if (img.dataset.retryProcessing === 'true') {
      return;
    }
    img.dataset.retryProcessing = 'true';
    
    console.warn(`Image load failed: ${img.dataset.src}, retries: ${retries}`);
    
    if (retries < this.options.maxRetries) {
      // Retry with exponential backoff
      const delay = this.options.retryDelay * Math.pow(2, retries);
      setTimeout(() => {
        img.dataset.retryProcessing = 'false';
        this.loadImage(img, retries + 1);
      }, delay);
    } else {
      // Final failure - use fallback or error state
      img.classList.remove('loading');
      img.classList.add('error');
      img.style.cssText = `
        min-height: 200px;
        background: #f5f5f5;
        border: 2px dashed #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 14px;
      `;
      img.innerHTML = '⚠️ Không thể tải ảnh';
      img.dataset.retryProcessing = 'false';
      img.dataset.failed = 'true';
      
      // Stop observing failed image
      this.observer.unobserve(img);
      
      this.trackPerformance(0, false);
    }
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  trackPerformance(loadTime, success) {
    if (success) {
      this.performanceData.imagesLoaded++;
      this.performanceData.loadTimes.push(loadTime);
    } else {
      this.performanceData.errors++;
    }
    
    // Calculate savings (assuming 30% WebP savings)
    if (this.performanceData.webpSupported) {
      this.performanceData.totalSaved += loadTime * 0.3;
    }
  }

  showPerformanceIndicator(loadTime) {
    let indicator = document.querySelector('.performance-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'performance-indicator';
      document.body.appendChild(indicator);
    }
    
    const avgTime = this.getAverageLoadTime();
    indicator.innerHTML = `
      📊 Load: ${Math.round(loadTime)}ms | Avg: ${Math.round(avgTime)}ms
      <br>✅ ${this.performanceData.imagesLoaded} images | ❌ ${this.performanceData.errors} errors
    `;
    
    indicator.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      indicator.classList.remove('show');
    }, 3000);
  }

  setupPerformanceMonitoring() {
    // Monitor scroll performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.checkViewportImages();
      }, 100);
    });
    
    // Monitor network conditions
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.adjustForNetworkConditions();
      });
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  observeImages() {
    const images = document.querySelectorAll('img[data-src], img.lazy');
    let newImages = 0;
    
    images.forEach(img => {
      // Skip if already processed or being processed
      if (img.dataset.observed === 'true' || 
          img.dataset.failed === 'true' || 
          img.dataset.loaded === 'true' ||
          img.classList.contains('loaded') ||
          img.src && !img.dataset.src) {
        return;
      }
      
      // Add lazy class if not present
      img.classList.add('lazy-image');
      
      // Mark as observed
      img.dataset.observed = 'true';
      
      // Start observing
      this.observer.observe(img);
      newImages++;
    });
    
    if (newImages > 0) {
      console.log(`🔍 Observing ${newImages} new images for lazy loading`);
    }
  }

  checkViewportImages() {
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    
    const images = document.querySelectorAll('.lazy-image:not(.loaded)');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) {
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  adjustForNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        // Reduce image quality for slow connections
        this.options.enableWebP = true;
        this.options.rootMargin = '100px 0px'; // Load images earlier
      } else if (connection.effectiveType === '4g') {
        // Higher quality for fast connections
        this.options.rootMargin = '20px 0px';
      }
    }
  }

  getAverageLoadTime() {
    const times = this.performanceData.loadTimes;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getPerformanceReport() {
    return {
      ...this.performanceData,
      averageLoadTime: this.getAverageLoadTime(),
      successRate: this.performanceData.imagesLoaded / 
                  (this.performanceData.imagesLoaded + this.performanceData.errors) * 100
    };
  }

  // ========================================
  // PUBLIC API
  // ========================================

  refresh() {
    this.observeImages();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove injected styles
    const styles = document.getElementById('lazy-loader-styles');
    if (styles) styles.remove();
    
    console.log('🧹 Lazy Loader destroyed');
  }
}

// ========================================
// AUTO-INITIALIZATION & GLOBAL API
// ========================================

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new LazyLoader();
  });
} else {
  window.lazyLoader = new LazyLoader();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
} 