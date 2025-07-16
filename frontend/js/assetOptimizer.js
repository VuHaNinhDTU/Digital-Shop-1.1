/**
 * ⚡ CHỢ NÔNG SÂN SỐ - ASSET OPTIMIZATION SYSTEM
 * Complete CSS/JS minification, bundling & performance optimization
 */

class AssetOptimizer {
  constructor(options = {}) {
    this.options = {
      // Minification Settings
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      compressWhitespace: true,
      
      // Bundle Settings
      enableBundling: true,
      bundleThreshold: 50000, // 50KB
      enableTreeShaking: true,
      enableCodeSplitting: true,
      
      // Cache Settings
      enableCaching: true,
      cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
      enableVersioning: true,
      
      // Performance Settings
      enableGzipCompression: true,
      enableBrotliCompression: true,
      enablePreloading: true,
      enableCriticalCSS: true,
      
      ...options
    };
    
    this.cache = new Map();
    this.bundles = new Map();
    this.performanceMetrics = {
      originalSize: 0,
      minifiedSize: 0,
      compressionRatio: 0,
      loadTime: 0,
      filesProcessed: 0
    };
    
    this.init();
  }

  // ========================================
  // INITIALIZATION & SETUP
  // ========================================

  async init() {
    console.log('⚡ Initializing Asset Optimization System...');
    
    // Setup auto-optimization (placeholder)
    // this.setupAutoOptimizations();
    
    // Setup critical CSS extraction
    if (this.options.enableCriticalCSS) {
      this.setupCriticalCSSExtraction();
    }
    
    // Setup resource preloading
    if (this.options.enablePreloading) {
      this.setupResourcePreloading();
    }
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    console.log('✅ Asset Optimization System ready!');
  }

  // ========================================
  // CSS MINIFICATION ENGINE
  // ========================================

  minifyCSS(cssCode) {
    let minified = cssCode;
    
    if (this.options.removeComments) {
      // Remove comments
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    
    if (this.options.compressWhitespace) {
      // Remove unnecessary whitespace
      minified = minified
        .replace(/\s+/g, ' ')
        .replace(/;\s*}/g, '}')
        .replace(/{\s*/g, '{')
        .replace(/}\s*/g, '}')
        .replace(/;\s*/g, ';')
        .replace(/:\s*/g, ':')
        .replace(/,\s*/g, ',')
        .trim();
    }
    
    // Remove unnecessary semicolons
    minified = minified.replace(/;}/g, '}');
    
    // Compress colors
    minified = this.compressColors(minified);
    
    // Compress units
    minified = this.compressUnits(minified);
    
    return minified;
  }

  compressColors(css) {
    // Convert hex colors to shorter form
    css = css.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3');
    
    // Convert rgb to hex where possible
    css = css.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
      const hex = ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1);
      return '#' + hex;
    });
    
    return css;
  }

  compressUnits(css) {
    // Remove unnecessary units for zero values
    css = css.replace(/(\s|:)0(px|em|rem|%|in|cm|mm|pt|pc|ex|vh|vw|vmin|vmax)/g, '$10');
    
    // Compress decimal values
    css = css.replace(/0\.(\d+)/g, '.$1');
    
    return css;
  }

  // ========================================
  // JAVASCRIPT MINIFICATION ENGINE
  // ========================================

  minifyJS(jsCode) {
    let minified = jsCode;
    
    if (this.options.removeComments) {
      // Remove single-line comments
      minified = minified.replace(/\/\/.*$/gm, '');
      
      // Remove multi-line comments (preserving those in strings)
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    
    if (this.options.compressWhitespace) {
      // Remove unnecessary whitespace
      minified = minified
        .replace(/\s+/g, ' ')
        .replace(/;\s*}/g, ';}')
        .replace(/{\s*/g, '{')
        .replace(/}\s*/g, '}')
        .replace(/;\s*/g, ';')
        .replace(/,\s*/g, ',')
        .trim();
    }
    
    // Remove unnecessary semicolons
    minified = this.removeUnnecessarySemicolons(minified);
    
    // Compress variables (basic)
    if (this.options.enableTreeShaking) {
      minified = this.basicVariableCompression(minified);
    }
    
    return minified;
  }

  removeUnnecessarySemicolons(js) {
    // Remove semicolons before closing braces
    return js.replace(/;(\s*})/g, '$1');
  }

  basicVariableCompression(js) {
    // Replace common long variable names with shorter ones
    const compressionMap = {
      'document': 'd',
      'window': 'w',
      'console': 'c',
      'function': 'f'
    };
    
    // Note: This is a very basic implementation
    // A full implementation would need proper AST parsing
    let compressed = js;
    for (const [long, short] of Object.entries(compressionMap)) {
      const regex = new RegExp(`\\b${long}\\b(?=\\s*[.\\[])`, 'g');
      compressed = compressed.replace(regex, short);
    }
    
    return compressed;
  }

  // ========================================
  // BUNDLE OPTIMIZATION
  // ========================================

  async createBundle(files, type = 'js') {
    const bundleId = this.generateBundleId(files);
    
    if (this.bundles.has(bundleId)) {
      return this.bundles.get(bundleId);
    }
    
    console.log(`📦 Creating ${type.toUpperCase()} bundle with ${files.length} files...`);
    
    let combinedContent = '';
    let totalOriginalSize = 0;
    
    for (const file of files) {
      try {
        const content = await this.loadFileContent(file);
        totalOriginalSize += content.length;
        
        // Add file separator comment
        combinedContent += `\n/* === ${file} === */\n`;
        combinedContent += content;
        
      } catch (error) {
        console.error(`Failed to load ${file}:`, error);
      }
    }
    
    // Minify combined content
    const minifiedContent = type === 'css' 
      ? this.minifyCSS(combinedContent)
      : this.minifyJS(combinedContent);
    
    // Generate version hash
    const versionHash = this.generateHash(minifiedContent);
    const bundleName = `bundle-${type}-${versionHash}.${type}`;
    
    const bundle = {
      id: bundleId,
      type,
      content: minifiedContent,
      files,
      originalSize: totalOriginalSize,
      minifiedSize: minifiedContent.length,
      compressionRatio: ((1 - minifiedContent.length / totalOriginalSize) * 100).toFixed(1),
      hash: versionHash,
      filename: bundleName,
      url: this.createBundleBlob(minifiedContent, type)
    };
    
    this.bundles.set(bundleId, bundle);
    this.updateMetrics(totalOriginalSize, minifiedContent.length);
    
    console.log(`✅ Bundle created: ${bundle.compressionRatio}% compression`);
    return bundle;
  }

  createBundleBlob(content, type) {
    const mimeType = type === 'css' ? 'text/css' : 'application/javascript';
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  // ========================================
  // CRITICAL CSS EXTRACTION
  // ========================================

  setupCriticalCSSExtraction() {
    this.extractCriticalCSS().then(criticalCSS => {
      if (criticalCSS) {
        this.injectCriticalCSS(criticalCSS);
      }
    });
  }

  async extractCriticalCSS() {
    try {
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Find all visible elements
      const visibleElements = this.findVisibleElements(viewportHeight);
      
      // Extract CSS rules for visible elements
      const criticalRules = this.extractRulesForElements(visibleElements);
      
      // Minify critical CSS
      const criticalCSS = this.minifyCSS(criticalRules);
      
      console.log('🎯 Critical CSS extracted:', criticalCSS.length, 'bytes');
      return criticalCSS;
      
    } catch (error) {
      console.error('Critical CSS extraction failed:', error);
      return null;
    }
  }

  findVisibleElements(viewportHeight) {
    const elements = document.querySelectorAll('*');
    const visible = [];
    
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) {
        visible.push(element);
      }
    }
    
    return visible;
  }

  extractRulesForElements(elements) {
    const rules = new Set();
    const stylesheets = Array.from(document.styleSheets);
    
    for (const stylesheet of stylesheets) {
      try {
        const cssRules = Array.from(stylesheet.cssRules || []);
        
        for (const rule of cssRules) {
          if (rule.type === CSSRule.STYLE_RULE) {
            // Check if rule applies to any visible element
            if (this.ruleAppliesToElements(rule, elements)) {
              rules.add(rule.cssText);
            }
          }
        }
      } catch (error) {
        // Skip external stylesheets due to CORS
        continue;
      }
    }
    
    return Array.from(rules).join('\n');
  }

  ruleAppliesToElements(rule, elements) {
    try {
      const selector = rule.selectorText;
      return elements.some(element => element.matches(selector));
    } catch (error) {
      return false;
    }
  }

  injectCriticalCSS(criticalCSS) {
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    style.id = 'critical-css';
    document.head.insertBefore(style, document.head.firstChild);
    
    // Lazy load non-critical CSS
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(link => {
      link.rel = 'preload';
      link.as = 'style';
      link.onload = () => {
        link.rel = 'stylesheet';
      };
    });
  }

  // ========================================
  // RESOURCE PRELOADING
  // ========================================

  setupResourcePreloading() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Setup intelligent preloading based on user behavior
    this.setupIntelligentPreloading();
  }

  preloadCriticalResources() {
    const criticalResources = [
      { href: 'js/api.js', as: 'script' },
      { href: 'js/utils.js', as: 'script' },
      { href: 'style.css', as: 'style' },
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.as === 'style') {
        link.onload = () => {
          link.rel = 'stylesheet';
        };
      }
      document.head.appendChild(link);
    });
    
    console.log('🚀 Critical resources preloaded');
  }

  setupIntelligentPreloading() {
    // Monitor user interactions to predict next page
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        this.preloadPage(link.href);
      });
    });
  }

  preloadPage(url) {
    // Preload page resources
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  setupPerformanceMonitoring() {
    // Monitor asset loading performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.trackResourcePerformance(entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
    
    // Monitor Core Web Vitals
    this.setupCoreWebVitalsMonitoring();
  }

  trackResourcePerformance(entry) {
    if (entry.name.includes('.css') || entry.name.includes('.js')) {
      this.performanceMetrics.loadTime += entry.duration;
      this.performanceMetrics.filesProcessed++;
    }
  }

  setupCoreWebVitalsMonitoring() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('📊 LCP:', lastEntry.startTime + 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        console.log('📊 FID:', entry.processingStart - entry.startTime + 'ms');
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift (CLS)
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      entryList.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('📊 CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async loadFileContent(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  }

  generateBundleId(files) {
    return this.generateHash(files.join('|'));
  }

  generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  updateMetrics(originalSize, minifiedSize) {
    this.performanceMetrics.originalSize += originalSize;
    this.performanceMetrics.minifiedSize += minifiedSize;
    this.performanceMetrics.compressionRatio = 
      ((1 - this.performanceMetrics.minifiedSize / this.performanceMetrics.originalSize) * 100);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ========================================
  // PUBLIC API
  // ========================================

  async optimizeAssets(cssFiles = [], jsFiles = []) {
    const results = {};
    
    if (cssFiles.length > 0) {
      results.cssBundle = await this.createBundle(cssFiles, 'css');
    }
    
    if (jsFiles.length > 0) {
      results.jsBundle = await this.createBundle(jsFiles, 'js');
    }
    
    return results;
  }

  async minifySingleFile(content, type) {
    const minified = type === 'css' ? this.minifyCSS(content) : this.minifyJS(content);
    const originalSize = content.length;
    const minifiedSize = minified.length;
    
    return {
      original: content,
      minified,
      originalSize,
      minifiedSize,
      compressionRatio: ((1 - minifiedSize / originalSize) * 100).toFixed(1)
    };
  }

  getPerformanceReport() {
    return {
      ...this.performanceMetrics,
      totalSavings: this.performanceMetrics.originalSize - this.performanceMetrics.minifiedSize,
      averageLoadTime: this.performanceMetrics.loadTime / this.performanceMetrics.filesProcessed || 0
    };
  }

  clearCache() {
    this.cache.clear();
    this.bundles.clear();
  }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.assetOptimizer = new AssetOptimizer();
  });
} else {
  window.assetOptimizer = new AssetOptimizer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssetOptimizer;
} 