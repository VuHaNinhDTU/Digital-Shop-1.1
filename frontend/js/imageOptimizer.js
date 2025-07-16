/**
 * 🖼️ CHỢ NÔNG SÂN SỐ - IMAGE OPTIMIZATION SYSTEM
 * Complete image compression, WebP conversion & progressive loading
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      // Compression Settings
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      enableWebP: true,
      enableProgressive: true,
      
      // Performance Settings
      enableClientSideResize: true,
      enableLazyLoading: true,
      compressionWorkers: 2,
      
      // Progressive Loading
      enableBlurPlaceholder: true,
      placeholderQuality: 0.1,
      placeholderSize: 64,
      
      // Cache Settings
      enableServiceWorkerCache: true,
      cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
      
      ...options
    };
    
    this.compressionQueue = [];
    this.workers = [];
    this.cache = new Map();
    this.performanceMetrics = {
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      processingTime: 0,
      imagesProcessed: 0
    };
    
    this.init();
  }

  // ========================================
  // INITIALIZATION & SETUP
  // ========================================

  async init() {
    console.log('🖼️ Initializing Image Optimization System...');
    
    // Check browser capabilities
    await this.checkBrowserSupport();
    
    // Setup Web Workers for compression
    this.setupCompressionWorkers();
    
    // Setup Service Worker for caching
    if (this.options.enableServiceWorkerCache) {
      this.setupServiceWorkerCache();
    }
    
    // Setup auto-optimization for uploaded images
    this.setupAutoOptimization();
    
    console.log('✅ Image Optimization System ready!');
  }

  async checkBrowserSupport() {
    // Check WebP support
    this.webpSupported = await this.detectWebPSupport();
    
    // Check Canvas support
    this.canvasSupported = !!document.createElement('canvas').getContext;
    
    // Check Worker support
    this.workerSupported = typeof Worker !== 'undefined';
    
    console.log('📊 Browser Support:', {
      webp: this.webpSupported,
      canvas: this.canvasSupported,
      workers: this.workerSupported
    });
  }

  detectWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // ========================================
  // WEB WORKERS SETUP
  // ========================================

  setupCompressionWorkers() {
    if (!this.workerSupported) return;
    
    for (let i = 0; i < this.options.compressionWorkers; i++) {
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = (e) => this.handleWorkerMessage(e, i);
      worker.onerror = (e) => console.error('Worker error:', e);
      
      this.workers.push(worker);
    }
    
    console.log(`👥 ${this.workers.length} compression workers ready`);
  }

  getWorkerCode() {
    return `
      // Image Compression Worker
      self.onmessage = function(e) {
        const { imageData, options, taskId } = e.data;
        
        try {
          // Create canvas in worker
          const canvas = new OffscreenCanvas(options.width, options.height);
          const ctx = canvas.getContext('2d');
          
          // Create ImageData
          const imgData = new ImageData(imageData.data, imageData.width, imageData.height);
          ctx.putImageData(imgData, 0, 0);
          
          // Compress to blob
          canvas.convertToBlob({
            type: options.outputFormat,
            quality: options.quality
          }).then(blob => {
            blob.arrayBuffer().then(buffer => {
              self.postMessage({
                taskId,
                success: true,
                data: buffer,
                originalSize: imageData.data.length,
                compressedSize: buffer.byteLength
              });
            });
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message
          });
        }
      };
    `;
  }

  // ========================================
  // IMAGE PROCESSING ALGORITHMS
  // ========================================

  async processImage(file, options = {}) {
    const startTime = performance.now();
    const config = { ...this.options, ...options };
    
    try {
      console.log('🔄 Processing image:', file.name, `(${this.formatFileSize(file.size)})`);
      
      // Load image
      const img = await this.loadImageFromFile(file);
      
      // Calculate optimal dimensions
      const dimensions = this.calculateOptimalDimensions(img, config);
      
      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Apply image enhancements
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      
      // Generate progressive versions
      const results = await this.generateProgressiveVersions(canvas, config);
      
      // Update performance metrics
      const processingTime = performance.now() - startTime;
      this.updateMetrics(file.size, results.compressed.size, processingTime);
      
      return {
        original: file,
        compressed: results.compressed,
        placeholder: results.placeholder,
        webp: results.webp,
        metadata: {
          originalSize: file.size,
          compressedSize: results.compressed.size,
          compressionRatio: ((1 - results.compressed.size / file.size) * 100).toFixed(1),
          processingTime: Math.round(processingTime),
          dimensions: dimensions
        }
      };
      
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }

  async generateProgressiveVersions(canvas, config) {
    const results = {};
    
    // Generate compressed version
    const compressedBlob = await this.canvasToBlob(canvas, 'image/jpeg', config.quality);
    results.compressed = {
      blob: compressedBlob,
      url: URL.createObjectURL(compressedBlob),
      size: compressedBlob.size
    };
    
    // Generate WebP version if supported
    if (this.webpSupported && config.enableWebP) {
      const webpBlob = await this.canvasToBlob(canvas, 'image/webp', config.quality);
      results.webp = {
        blob: webpBlob,
        url: URL.createObjectURL(webpBlob),
        size: webpBlob.size
      };
    }
    
    // Generate blur placeholder
    if (config.enableBlurPlaceholder) {
      const placeholderCanvas = this.createBlurPlaceholder(canvas, config.placeholderSize);
      const placeholderBlob = await this.canvasToBlob(placeholderCanvas, 'image/jpeg', config.placeholderQuality);
      results.placeholder = {
        blob: placeholderBlob,
        url: URL.createObjectURL(placeholderBlob),
        size: placeholderBlob.size
      };
    }
    
    return results;
  }

  createBlurPlaceholder(canvas, size) {
    const placeholderCanvas = document.createElement('canvas');
    const ctx = placeholderCanvas.getContext('2d');
    
    // Scale down for placeholder
    const aspectRatio = canvas.width / canvas.height;
    placeholderCanvas.width = size;
    placeholderCanvas.height = size / aspectRatio;
    
    // Apply blur effect
    ctx.filter = 'blur(4px)';
    ctx.drawImage(canvas, 0, 0, placeholderCanvas.width, placeholderCanvas.height);
    
    return placeholderCanvas;
  }

  // ========================================
  // SMART RESIZING ALGORITHMS
  // ========================================

  calculateOptimalDimensions(img, config) {
    let { width, height } = img;
    const { maxWidth, maxHeight } = config;
    
    // Maintain aspect ratio while respecting max dimensions
    const aspectRatio = width / height;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    // Optimize for display density
    const dpr = window.devicePixelRatio || 1;
    if (dpr > 1) {
      // Scale up for high-DPI displays but cap at original size
      width = Math.min(width * dpr, img.width);
      height = Math.min(height * dpr, img.height);
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height),
      aspectRatio,
      scaleFactor: width / img.width
    };
  }

  // ========================================
  // SERVICE WORKER CACHING
  // ========================================

  setupServiceWorkerCache() {
    // Skip blob service worker - use main service worker for image caching
    console.log('📦 Image caching delegated to main service worker');
  }

  // ========================================
  // AUTO-OPTIMIZATION SETUP
  // ========================================

  setupAutoOptimization() {
    // Monitor file inputs
    document.addEventListener('change', (e) => {
      if (e.target.type === 'file' && e.target.accept?.includes('image')) {
        this.handleFileInput(e.target);
      }
    });
    
    // Monitor drag & drop
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        this.processMultipleFiles(files);
      }
    });
    
    // Monitor existing images on page (placeholder)
    // this.optimizeExistingImages();
  }

  async handleFileInput(input) {
    const files = Array.from(input.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) return;
    
    console.log(`🔄 Auto-optimizing ${files.length} uploaded images...`);
    
    for (const file of files) {
      try {
        const result = await this.processImage(file);
        this.displayOptimizationResult(result);
      } catch (error) {
        console.error('Auto-optimization failed:', error);
      }
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });
  }

  updateMetrics(originalSize, compressedSize, processingTime) {
    this.performanceMetrics.originalSize += originalSize;
    this.performanceMetrics.compressedSize += compressedSize;
    this.performanceMetrics.processingTime += processingTime;
    this.performanceMetrics.imagesProcessed++;
    
    this.performanceMetrics.compressionRatio = 
      ((1 - this.performanceMetrics.compressedSize / this.performanceMetrics.originalSize) * 100);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  displayOptimizationResult(result) {
    const notification = document.createElement('div');
    notification.className = 'optimization-notification';
    notification.innerHTML = `
      <div class="optimization-success">
        ✅ Image optimized: ${result.metadata.compressionRatio}% smaller
        <br>📊 ${this.formatFileSize(result.metadata.originalSize)} → ${this.formatFileSize(result.metadata.compressedSize)}
        <br>⏱️ ${result.metadata.processingTime}ms
      </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInOptimization 300ms ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutOptimization 300ms ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ========================================
  // PUBLIC API
  // ========================================

  async optimizeImage(file, options = {}) {
    return await this.processImage(file, options);
  }

  async optimizeMultipleImages(files, options = {}) {
    const results = [];
    for (const file of files) {
      try {
        const result = await this.processImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to optimize ${file.name}:`, error);
        results.push({ error: error.message, file });
      }
    }
    return results;
  }

  getPerformanceReport() {
    return {
      ...this.performanceMetrics,
      averageProcessingTime: this.performanceMetrics.processingTime / this.performanceMetrics.imagesProcessed,
      totalSavings: this.performanceMetrics.originalSize - this.performanceMetrics.compressedSize
    };
  }

  clearCache() {
    this.cache.clear();
    if ('serviceWorker' in navigator) {
      caches.delete('cho-nong-san-images-v1');
    }
  }

  destroy() {
    this.workers.forEach(worker => worker.terminate());
    this.cache.clear();
    console.log('🧹 Image Optimizer destroyed');
  }
}

// ========================================
// CSS ANIMATIONS FOR NOTIFICATIONS
// ========================================

const optimizationStyles = `
  <style>
    @keyframes slideInOptimization {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutOptimization {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .optimization-notification {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }
  </style>
`;

document.head.insertAdjacentHTML('beforeend', optimizationStyles);

// ========================================
// AUTO-INITIALIZATION
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizer();
  });
} else {
  window.imageOptimizer = new ImageOptimizer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageOptimizer;
} 