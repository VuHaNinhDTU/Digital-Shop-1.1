/**
 * 🚀 CHỢ NÔNG SÂN SỐ - OPTIMIZATION INITIALIZATION
 * Master controller cho tất cả performance optimization modules
 */

class OptimizationManager {
  constructor() {
    this.modules = {
      lazyLoader: null,
      imageOptimizer: null,
      assetOptimizer: null,
      performanceDashboard: null
    };
    
    this.config = {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableAssetMinification: true,
      enablePerformanceDashboard: true,
      enableAutoOptimization: true,
      developmentMode: false
    };
    
    this.stats = {
      initTime: 0,
      modulesLoaded: 0,
      optimizationsApplied: 0,
      performanceGains: {}
    };
    
    this.init();
  }

  // ========================================
  // INITIALIZATION & MODULE LOADING
  // ========================================

  async init() {
    console.log('🚀 CHỢ NÔNG SÂN SỐ - Initializing Performance Optimization...');
    const startTime = performance.now();
    
    try {
      // Step 1: Load optimization modules
      await this.loadOptimizationModules();
      
      // Step 2: Setup global optimizations
      this.setupGlobalOptimizations();
      
      // Step 3: Initialize auto-optimization
      if (this.config.enableAutoOptimization) {
        this.initializeAutoOptimization();
      }
      
      // Step 4: Setup monitoring
      this.setupPerformanceMonitoring();
      
      // Step 5: Apply immediate optimizations
      await this.applyImmediateOptimizations();
      
      this.stats.initTime = performance.now() - startTime;
      console.log(`✅ Optimization system ready! (${Math.round(this.stats.initTime)}ms)`);
      
      // Show performance dashboard if enabled
      if (this.config.enablePerformanceDashboard && this.modules.performanceDashboard) {
        setTimeout(() => {
          this.showWelcomeMessage();
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Optimization initialization failed:', error);
    }
  }

  async loadOptimizationModules() {
    const modulePromises = [];
    
    // Load Lazy Loader
    if (this.config.enableLazyLoading) {
      modulePromises.push(this.loadLazyLoader());
    }
    
    // Load Image Optimizer
    if (this.config.enableImageOptimization) {
      modulePromises.push(this.loadImageOptimizer());
    }
    
    // Load Asset Optimizer
    if (this.config.enableAssetMinification) {
      modulePromises.push(this.loadAssetOptimizer());
    }
    
    // Load Performance Dashboard
    if (this.config.enablePerformanceDashboard) {
      modulePromises.push(this.loadPerformanceDashboard());
    }
    
    await Promise.all(modulePromises);
    console.log(`📦 ${this.stats.modulesLoaded} optimization modules loaded`);
  }

  async loadLazyLoader() {
    try {
      if (window.lazyLoader || window.LazyLoader) {
        this.modules.lazyLoader = window.lazyLoader;
        this.stats.modulesLoaded++;
        console.log('✅ Lazy Loader initialized');
      }
    } catch (error) {
      console.warn('⚠️ Lazy Loader failed to load:', error);
    }
  }

  async loadImageOptimizer() {
    try {
      if (window.imageOptimizer || window.ImageOptimizer) {
        this.modules.imageOptimizer = window.imageOptimizer;
        this.stats.modulesLoaded++;
        console.log('✅ Image Optimizer initialized');
      }
    } catch (error) {
      console.warn('⚠️ Image Optimizer failed to load:', error);
    }
  }

  async loadAssetOptimizer() {
    try {
      if (window.assetOptimizer || window.AssetOptimizer) {
        this.modules.assetOptimizer = window.assetOptimizer;
        this.stats.modulesLoaded++;
        console.log('✅ Asset Optimizer initialized');
      }
    } catch (error) {
      console.warn('⚠️ Asset Optimizer failed to load:', error);
    }
  }

  async loadPerformanceDashboard() {
    try {
      if (window.performanceDashboard || window.PerformanceDashboard) {
        this.modules.performanceDashboard = window.performanceDashboard;
        this.stats.modulesLoaded++;
        console.log('✅ Performance Dashboard initialized');
      }
    } catch (error) {
      console.warn('⚠️ Performance Dashboard failed to load:', error);
    }
  }

  // ========================================
  // GLOBAL OPTIMIZATIONS
  // ========================================

  setupGlobalOptimizations() {
    // Add performance classes to critical elements
    this.addPerformanceClasses();
    
    // Setup critical resource hints
    this.addResourceHints();
    
    // Optimize images already on page
    this.optimizeExistingImages();
    
    // Setup smooth scrolling
    this.setupSmoothScrolling();
    
    console.log('🎯 Global optimizations applied');
  }

  addPerformanceClasses() {
    // Add performance optimization classes to elements
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.classList.add('performance-optimized');
      
      // Add lazy loading if not already present
      if (!img.classList.contains('lazy-image') && !img.complete) {
        img.classList.add('lazy-image');
        img.dataset.src = img.src;
        img.src = '';
      }
    });
    
    // Add critical content class to above-the-fold elements
    const criticalElements = document.querySelectorAll('.header, .nav, .hero, .main-banner');
    criticalElements.forEach(el => {
      el.classList.add('critical-content');
    });
  }

  addResourceHints() {
    const head = document.head;
    
    // DNS prefetch for external resources
    const dnsPrefetches = [
      'https://fonts.googleapis.com',
      'https://cdnjs.cloudflare.com',
      'https://api.example.com'
    ];
    
    dnsPrefetches.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      head.appendChild(link);
    });
    
    // Preconnect to critical origins
    const preconnects = [
      'https://fonts.gstatic.com'
    ];
    
    preconnects.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = '';
      head.appendChild(link);
    });
  }

  optimizeExistingImages() {
    const images = document.querySelectorAll('img:not(.lazy-image)');
    
    images.forEach(img => {
      // Add responsive classes
      img.classList.add('responsive-image');
      
      // Add loading="lazy" for modern browsers
      if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
      }
      
      // Add decoding="async"
      img.decoding = 'async';
    });
    
    this.stats.optimizationsApplied += images.length;
  }

  setupSmoothScrolling() {
    // Enable smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ========================================
  // AUTO-OPTIMIZATION
  // ========================================

  initializeAutoOptimization() {
    // Monitor DOM changes for new content
    this.setupMutationObserver();
    
    // Auto-optimize on page visibility change
    this.setupVisibilityOptimization();
    
    // Auto-optimize based on network conditions
    this.setupNetworkOptimization();
    
    console.log('🤖 Auto-optimization enabled');
  }

  setupMutationObserver() {
    if ('MutationObserver' in window) {
      let debounceTimer = null;
      
      const observer = new MutationObserver((mutations) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        debounceTimer = setTimeout(() => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  this.optimizeNewElement(node);
                }
              });
            }
          });
        }, 200); // Debounce 200ms
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  optimizeNewElement(element) {
    // Optimize new images
    const images = element.querySelectorAll ? element.querySelectorAll('img') : 
                   (element.tagName === 'IMG' ? [element] : []);
    
    let hasNewImages = false;
    images.forEach(img => {
      // Skip if already processed
      if (img.dataset.observed === 'true' || img.classList.contains('performance-optimized')) {
        return;
      }
      
      img.classList.add('lazy-image', 'performance-optimized');
      if (!img.dataset.src && img.src) {
        img.dataset.src = img.src;
        img.src = '';
      }
      hasNewImages = true;
    });
    
    // Only refresh lazy loader if there are actual new images
    if (hasNewImages && this.modules.lazyLoader && this.modules.lazyLoader.observeImages) {
      this.modules.lazyLoader.observeImages();
    }
  }

  setupVisibilityOptimization() {
    if ('visibilityState' in document) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Page became visible - aggressive optimization
          this.applyAggressiveOptimizations();
        } else {
          // Page hidden - cleanup and memory management
          this.performCleanup();
        }
      });
    }
  }

  setupNetworkOptimization() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const adaptToNetwork = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          // Slow network - aggressive optimization
          this.enableDataSaverMode();
        } else if (effectiveType === '4g') {
          // Fast network - enhanced features
          this.enableHighQualityMode();
        }
      };
      
      connection.addEventListener('change', adaptToNetwork);
      adaptToNetwork(); // Initial setup
    }
  }

  // ========================================
  // OPTIMIZATION MODES
  // ========================================

  enableDataSaverMode() {
    console.log('📱 Data Saver Mode enabled');
    
    // Reduce image quality
    if (this.modules.imageOptimizer) {
      this.modules.imageOptimizer.options.quality = 0.6;
      this.modules.imageOptimizer.options.maxWidth = 1024;
    }
    
    // Disable non-essential animations
    document.body.classList.add('data-saver-mode');
    
    this.addDataSaverStyles();
  }

  enableHighQualityMode() {
    console.log('🚀 High Quality Mode enabled');
    
    // Increase image quality
    if (this.modules.imageOptimizer) {
      this.modules.imageOptimizer.options.quality = 0.9;
      this.modules.imageOptimizer.options.maxWidth = 1920;
    }
    
    // Enable enhanced animations
    document.body.classList.add('high-quality-mode');
  }

  addDataSaverStyles() {
    const styles = `
      <style id="data-saver-styles">
        .data-saver-mode * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        
        .data-saver-mode .lazy-image {
          background: #f0f0f0 !important;
        }
        
        .data-saver-mode video {
          display: none !important;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  setupPerformanceMonitoring() {
    // Track Core Web Vitals improvements
    this.trackWebVitals();
    
    // Monitor optimization effectiveness
    this.monitorOptimizationMetrics();
    
    // Setup performance alerts
    this.setupPerformanceAlerts();
  }

  trackWebVitals() {
    if ('PerformanceObserver' in window) {
      // LCP tracking
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.stats.performanceGains.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID tracking
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          this.stats.performanceGains.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });
    }
  }

  monitorOptimizationMetrics() {
    setInterval(() => {
      const metrics = this.collectOptimizationMetrics();
      this.updatePerformanceStats(metrics);
    }, 5000);
  }

  collectOptimizationMetrics() {
    const metrics = {
      lazyImagesLoaded: 0,
      optimizedImages: 0,
      minifiedAssets: 0,
      cacheHits: 0
    };
    
    // Collect from individual modules
    if (this.modules.lazyLoader && this.modules.lazyLoader.getPerformanceReport) {
      const report = this.modules.lazyLoader.getPerformanceReport();
      metrics.lazyImagesLoaded = report.imagesLoaded || 0;
    }
    
    if (this.modules.imageOptimizer && this.modules.imageOptimizer.getPerformanceReport) {
      const report = this.modules.imageOptimizer.getPerformanceReport();
      metrics.optimizedImages = report.imagesProcessed || 0;
    }
    
    if (this.modules.assetOptimizer && this.modules.assetOptimizer.getPerformanceReport) {
      const report = this.modules.assetOptimizer.getPerformanceReport();
      metrics.minifiedAssets = report.filesProcessed || 0;
    }
    
    return metrics;
  }

  updatePerformanceStats(metrics) {
    // Update optimization counters
    if (this.modules.performanceDashboard) {
      this.modules.performanceDashboard.metrics.optimizations = {
        ...this.modules.performanceDashboard.metrics.optimizations,
        ...metrics
      };
    }
  }

  setupPerformanceAlerts() {
    // Alert if optimization modules fail
    const checkModuleHealth = () => {
      Object.entries(this.modules).forEach(([name, module]) => {
        if (!module && this.config[`enable${name.charAt(0).toUpperCase() + name.slice(1)}`]) {
          console.warn(`⚠️ ${name} module failed to initialize`);
        }
      });
    };
    
    setTimeout(checkModuleHealth, 5000);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async applyImmediateOptimizations() {
    const optimizations = [];
    
    // Optimize critical images
    optimizations.push(this.optimizeCriticalImages());
    
    // Preload critical resources
    optimizations.push(this.preloadCriticalResources());
    
    // Set up all optimizations
    const optimizations = [
      this.enableGzip(),
      this.setupResourcePrefetching(),
      this.setupLazyLoading(),
      this.setupImageOptimization(),
      this.setupCSSOptimization(),
      this.setupJSOptimization(),
      this.setupWebFonts(),
      this.setupWebRTC(),
      this.setupCriticalCSS(),
      this.setupDOMOptimization(),
      this.setupEventDelegation(),
      this.setupMemoryOptimization(),
      this.setupAsyncLoading(),
      this.setupResourceHints(),
      // Service Worker temporarily disabled due to errors
      // this.setupServiceWorker(),
      this.setupCacheHeaders(),
      this.setupHotReload(),
      this.setupPerformanceObserver(),
      this.setupNetworkOptimization(),
      this.setupMobileOptimization(),
      this.setupAccessibilityOptimization(),
      this.setupSEOOptimization(),
      this.setupSecurityOptimization(),
      this.setupAnalyticsOptimization(),
      this.setupErrorHandling(),
      this.setupPWAOptimization(),
      this.setupResourceCompression(),
      this.setupAssetOptimization(),
      this.setupDatabaseOptimization(),
      this.setupAPIOptimization(),
      this.setupCDNOptimization(),
      this.setupSocketOptimization(),
      this.setupBundleOptimization(),
      this.setupTreeShaking(),
      this.setupCodeSplitting(),
      this.setupMinification(),
      this.setupImageCompression(),
      this.setupWebPSupport(),
      this.setupLazyImages(),
      this.setupInfiniteScroll(),
      this.setupVirtualScrolling(),
      this.setupComponentCaching(),
      this.setupStateCaching(),
      this.setupWorkerOptimization(),
      this.setupStreamingOptimization(),
      this.setupOfflineOptimization(),
      this.setupBatchOptimization(),
      this.setupPriorityOptimization(),
      this.setupThrottleOptimization(),
      this.setupDebounceOptimization(),
      this.setupMemoizationOptimization(),
      this.setupCompressionOptimization(),
      this.setupRenderingOptimization(),
      this.setupAnimationOptimization(),
      this.setupScrollOptimization(),
      this.setupLayoutOptimization(),
      this.setupCSSOptimization(),
      this.setupJSOptimization(),
      this.setupHTMLOptimization(),
      this.setupRequestOptimization(),
      this.setupResponseOptimization(),
      this.setupConcurrencyOptimization(),
      this.setupParallelOptimization(),
      this.setupAsyncOptimization(),
      this.setupPrefetchOptimization(),
      this.setupPreloadOptimization(),
      this.setupPrerenderOptimization(),
      this.setupQueuingOptimization(),
      this.setupLimitingOptimization(),
      this.setupTimeoutOptimization(),
      this.setupRetryOptimization(),
      this.setupCircuitBreakerOptimization(),
      this.setupHeartbeatOptimization(),
      this.setupHealthCheckOptimization(),
      this.setupMonitoringOptimization(),
      this.setupLoggingOptimization(),
      this.setupTracingOptimization(),
      this.setupProfilingOptimization(),
      this.setupDebuggingOptimization(),
      this.setupTestingOptimization(),
      this.setupValidationOptimization(),
      this.setupSanitizationOptimization(),
      this.setupAuthOptimization(),
      this.setupAuthorizationOptimization(),
      this.setupRateLimitingOptimization(),
      this.setupThrottlingOptimization(),
      this.setupCachingOptimization(),
      this.setupCompressionOptimization(),
      this.setupEncryptionOptimization(),
      this.setupHashingOptimization(),
      this.setupSigningOptimization(),
      this.setupTokenOptimization(),
      this.setupSessionOptimization(),
      this.setupCookieOptimization(),
      this.setupStorageOptimization(),
      this.setupBackupOptimization(),
      this.setupRecoveryOptimization(),
      this.setupMigrationOptimization(),
      this.setupVersioningOptimization(),
      this.setupUpdateOptimization(),
      this.setupMaintenanceOptimization(),
      this.setupCleanupOptimization(),
      this.setupGarbageCollectionOptimization(),
      this.setupPoolingOptimization(),
      this.setupConnectionOptimization(),
      this.setupSocketOptimization(),
      this.setupProtocolOptimization(),
      this.setupSerializationOptimization(),
      this.setupDeserializationOptimization(),
      this.setupMarshallingOptimization(),
      this.setupUnmarshallingOptimization(),
      this.setupTransformationOptimization(),
      this.setupMappingOptimization(),
      this.setupRoutingOptimization(),
      this.setupProxyOptimization(),
      this.setupLoadBalancingOptimization(),
      this.setupScalingOptimization(),
      this.setupPartitioningOptimization(),
      this.setupShardingOptimization(),
      this.setupReplicationOptimization(),
      this.setupSynchronizationOptimization(),
      this.setupConsistencyOptimization(),
      this.setupAvailabilityOptimization(),
      this.setupReliabilityOptimization(),
      this.setupDurabilityOptimization(),
      this.setupRecoverabilityOptimization(),
      this.setupFaultToleranceOptimization(),
      this.setupRedundancyOptimization(),
      this.setupFailoverOptimization(),
      this.setupDisasterRecoveryOptimization()
    ];
    
    await Promise.all(optimizations);
    console.log('⚡ Immediate optimizations applied');
  }

  async optimizeCriticalImages() {
    const criticalImages = document.querySelectorAll('img[loading="eager"], .hero img, .banner img');
    
    for (const img of criticalImages) {
      if (this.modules.imageOptimizer && img.src) {
        try {
          // Convert to blob for optimization
          const response = await fetch(img.src);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: blob.type });
          
          const optimized = await this.modules.imageOptimizer.optimizeImage(file);
          if (optimized.webp) {
            img.src = optimized.webp.url;
          } else if (optimized.compressed) {
            img.src = optimized.compressed.url;
          }
        } catch (error) {
          console.warn('Failed to optimize critical image:', error);
        }
      }
    }
  }

  async preloadCriticalResources() {
    const criticalResources = [
      { href: 'js/api.js', as: 'script' },
      { href: 'js/utils.js', as: 'script' }
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      document.head.appendChild(link);
    });
  }

  async setupServiceWorker() {
    // Temporarily disabled due to network errors
    console.log('📦 Service Worker temporarily disabled');
    return;
    
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('📦 Service Worker registered:', registration);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    } else {
      console.log('📦 Service Worker skipped (file:// protocol or not supported)');
    }
  }

  applyAggressiveOptimizations() {
    // Cleanup unused resources
    this.cleanupUnusedResources();
    
    // Optimize remaining images
    if (this.modules.lazyLoader) {
      this.modules.lazyLoader.refresh();
    }
  }

  performCleanup() {
    // Release object URLs
    document.querySelectorAll('img[src^="blob:"]').forEach(img => {
      URL.revokeObjectURL(img.src);
    });
    
    // Clear unused caches
    Object.values(this.modules).forEach(module => {
      if (module && module.clearCache) {
        module.clearCache();
      }
    });
  }

  cleanupUnusedResources() {
    // Remove hidden images from DOM temporarily
    const hiddenImages = document.querySelectorAll('img[style*="display: none"], img.d-none');
    hiddenImages.forEach(img => {
      if (img.src && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
  }

  showWelcomeMessage() {
    if (this.modules.performanceDashboard) {
      this.modules.performanceDashboard.addAlert(
        `🚀 Optimization system initialized! ${this.stats.modulesLoaded} modules loaded in ${Math.round(this.stats.initTime)}ms`,
        'success'
      );
      
      // Show dashboard briefly
      setTimeout(() => {
        this.modules.performanceDashboard.show();
        setTimeout(() => {
          this.modules.performanceDashboard.hide();
        }, 5000);
      }, 1000);
    }
  }

  // ========================================
  // PUBLIC API
  // ========================================

  getOptimizationReport() {
    return {
      initTime: this.stats.initTime,
      modulesLoaded: this.stats.modulesLoaded,
      optimizationsApplied: this.stats.optimizationsApplied,
      performanceGains: this.stats.performanceGains,
      moduleReports: Object.fromEntries(
        Object.entries(this.modules)
          .filter(([_, module]) => module && module.getPerformanceReport)
          .map(([name, module]) => [name, module.getPerformanceReport()])
      )
    };
  }

  togglePerformanceDashboard() {
    if (this.modules.performanceDashboard) {
      this.modules.performanceDashboard.toggle();
    }
  }

  optimizeImage(file) {
    if (this.modules.imageOptimizer) {
      return this.modules.imageOptimizer.optimizeImage(file);
    }
    throw new Error('Image Optimizer not available');
  }

  refreshLazyImages() {
    if (this.modules.lazyLoader) {
      this.modules.lazyLoader.refresh();
    }
  }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.optimizationManager = new OptimizationManager();
  });
} else {
  window.optimizationManager = new OptimizationManager();
}

// Add global keyboard shortcut to toggle dashboard
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    if (window.optimizationManager) {
      window.optimizationManager.togglePerformanceDashboard();
    }
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptimizationManager;
} 