/**
 * 📊 CHỢ NÔNG SÂN SỐ - PERFORMANCE MONITORING DASHBOARD
 * Real-time performance tracking, analytics & optimization alerts
 */

class PerformanceDashboard {
  constructor(options = {}) {
    this.options = {
      // Dashboard Settings
      enableRealTimeMonitoring: true,
      updateInterval: 1000,
      enableAlerts: true,
      enableAutoOptimization: true,
      
      // Performance Thresholds
      slowPageThreshold: 3000,  // 3s
      slowResourceThreshold: 1000,  // 1s
      highMemoryThreshold: 100 * 1024 * 1024, // 100MB
      
      // Chart Settings
      maxDataPoints: 50,
      chartColors: {
        primary: '#4CAF50',
        warning: '#FF9800',
        danger: '#F44336',
        info: '#2196F3'
      },
      
      ...options
    };
    
    this.metrics = {
      pageLoad: [],
      resourceLoad: [],
      memoryUsage: [],
      networkRequests: [],
      coreWebVitals: {
        lcp: null,
        fid: null,
        cls: null
      },
      optimizations: {
        lazyImages: 0,
        compressedImages: 0,
        minifiedAssets: 0,
        cacheHits: 0
      }
    };
    
    this.observers = [];
    this.dashboardElement = null;
    this.charts = {};
    
    this.init();
  }

  // ========================================
  // INITIALIZATION & SETUP
  // ========================================

  async init() {
    console.log('📊 Initializing Performance Dashboard...');
    
    // Create dashboard UI
    this.createDashboardUI();
    
    // Setup performance observers
    this.setupPerformanceObservers();
    
    // Setup real-time monitoring
    if (this.options.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
    
    // Setup automated alerts
    if (this.options.enableAlerts) {
      this.setupAlertSystem();
    }
    
    // Initialize charts
    this.initializeCharts();
    
    console.log('✅ Performance Dashboard ready!');
  }

  createDashboardUI() {
    // Create dashboard container
    this.dashboardElement = document.createElement('div');
    this.dashboardElement.id = 'performance-dashboard';
    this.dashboardElement.innerHTML = `
      <div class="dashboard-header">
        <h3>🚀 CHỢ NÔNG SÂN SỐ - Performance Dashboard</h3>
        <div class="dashboard-controls">
          <button class="btn-toggle" onclick="window.performanceDashboard.toggle()">Toggle</button>
          <button class="btn-export" onclick="window.performanceDashboard.exportReport()">Export</button>
        </div>
      </div>
      
      <div class="dashboard-content">
        <!-- Core Web Vitals -->
        <div class="metrics-section">
          <h4>🎯 Core Web Vitals</h4>
          <div class="vitals-grid">
            <div class="vital-card lcp">
              <div class="vital-label">LCP</div>
              <div class="vital-value" id="lcp-value">-</div>
              <div class="vital-status" id="lcp-status">Good</div>
            </div>
            <div class="vital-card fid">
              <div class="vital-label">FID</div>
              <div class="vital-value" id="fid-value">-</div>
              <div class="vital-status" id="fid-status">Good</div>
            </div>
            <div class="vital-card cls">
              <div class="vital-label">CLS</div>
              <div class="vital-value" id="cls-value">-</div>
              <div class="vital-status" id="cls-status">Good</div>
            </div>
          </div>
        </div>
        
        <!-- Performance Charts -->
        <div class="charts-section">
          <div class="chart-container">
            <h4>📈 Page Load Times</h4>
            <canvas id="page-load-chart" width="400" height="200"></canvas>
          </div>
          <div class="chart-container">
            <h4>🖼️ Resource Load Times</h4>
            <canvas id="resource-load-chart" width="400" height="200"></canvas>
          </div>
        </div>
        
        <!-- Optimization Metrics -->
        <div class="optimization-section">
          <h4>⚡ Optimization Stats</h4>
          <div class="optimization-grid">
            <div class="opt-card">
              <div class="opt-icon">🖼️</div>
              <div class="opt-label">Lazy Images</div>
              <div class="opt-value" id="lazy-images-count">0</div>
            </div>
            <div class="opt-card">
              <div class="opt-icon">🗜️</div>
              <div class="opt-label">Compressed Images</div>
              <div class="opt-value" id="compressed-images-count">0</div>
            </div>
            <div class="opt-card">
              <div class="opt-icon">📦</div>
              <div class="opt-label">Minified Assets</div>
              <div class="opt-value" id="minified-assets-count">0</div>
            </div>
            <div class="opt-card">
              <div class="opt-icon">💾</div>
              <div class="opt-label">Cache Hits</div>
              <div class="opt-value" id="cache-hits-count">0</div>
            </div>
          </div>
        </div>
        
        <!-- Real-time Metrics -->
        <div class="realtime-section">
          <h4>🔴 Real-time Metrics</h4>
          <div class="realtime-grid">
            <div class="metric-item">
              <span class="metric-label">Memory Usage:</span>
              <span class="metric-value" id="memory-usage">-</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Active Connections:</span>
              <span class="metric-value" id="active-connections">-</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Network Status:</span>
              <span class="metric-value" id="network-status">-</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Performance Score:</span>
              <span class="metric-value" id="performance-score">-</span>
            </div>
          </div>
        </div>
        
        <!-- Alerts Panel -->
        <div class="alerts-section">
          <h4>🚨 Performance Alerts</h4>
          <div id="alerts-container" class="alerts-container">
            <!-- Dynamic alerts will be inserted here -->
          </div>
        </div>
      </div>
    `;
    
    // Add dashboard styles
    this.addDashboardStyles();
    
    // Add to page
    document.body.appendChild(this.dashboardElement);
    
    // Initially hidden
    this.dashboardElement.style.display = 'none';
  }

  addDashboardStyles() {
    const styles = `
      <style id="performance-dashboard-styles">
        #performance-dashboard {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 450px;
          max-height: 80vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 14px;
          overflow: hidden;
          transition: all 300ms ease;
        }
        
        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .dashboard-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .dashboard-controls {
          display: flex;
          gap: 8px;
        }
        
        .dashboard-controls button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: background 200ms ease;
        }
        
        .dashboard-controls button:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .dashboard-content {
          max-height: 60vh;
          overflow-y: auto;
          padding: 16px;
        }
        
        .metrics-section, .charts-section, .optimization-section, 
        .realtime-section, .alerts-section {
          margin-bottom: 20px;
        }
        
        .metrics-section h4, .charts-section h4, .optimization-section h4,
        .realtime-section h4, .alerts-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .vitals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .vital-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          border-left: 4px solid #4CAF50;
        }
        
        .vital-card.warning {
          border-left-color: #FF9800;
        }
        
        .vital-card.danger {
          border-left-color: #F44336;
        }
        
        .vital-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .vital-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }
        
        .vital-status {
          font-size: 10px;
          color: #4CAF50;
          font-weight: 500;
        }
        
        .charts-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .chart-container {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
        }
        
        .chart-container h4 {
          margin-bottom: 8px;
        }
        
        .chart-container canvas {
          width: 100% !important;
          height: 120px !important;
        }
        
        .optimization-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .opt-card {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .opt-icon {
          font-size: 16px;
        }
        
        .opt-label {
          font-size: 11px;
          color: #666;
          flex: 1;
        }
        
        .opt-value {
          font-weight: bold;
          color: #333;
        }
        
        .realtime-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }
        
        .metric-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #eee;
        }
        
        .metric-label {
          font-size: 12px;
          color: #666;
        }
        
        .metric-value {
          font-size: 12px;
          font-weight: 500;
          color: #333;
        }
        
        .alerts-container {
          max-height: 120px;
          overflow-y: auto;
        }
        
        .alert-item {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 6px;
          font-size: 12px;
        }
        
        .alert-item.danger {
          background: #f8d7da;
          border-color: #f5c6cb;
        }
        
        .alert-item.success {
          background: #d4edda;
          border-color: #c3e6cb;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        #performance-dashboard.show {
          animation: slideIn 300ms ease-out;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // ========================================
  // PERFORMANCE OBSERVERS SETUP
  // ========================================

  setupPerformanceObservers() {
    // Core Web Vitals observers
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    
    // Resource loading observer
    this.observeResourceLoading();
    
    // Navigation timing observer
    this.observeNavigation();
  }

  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.coreWebVitals.lcp = lastEntry.startTime;
        this.updateVitalDisplay('lcp', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.coreWebVitals.fid = fid;
          this.updateVitalDisplay('fid', fid);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    }
  }

  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.metrics.coreWebVitals.cls = clsValue;
        this.updateVitalDisplay('cls', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    }
  }

  observeResourceLoading() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.trackResourcePerformance(entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  observeNavigation() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.trackPageLoad(entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  // ========================================
  // REAL-TIME MONITORING
  // ========================================

  startRealTimeMonitoring() {
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, this.options.updateInterval);
  }

  updateRealTimeMetrics() {
    // Update memory usage
    if ('memory' in performance) {
      const memory = performance.memory.usedJSHeapSize;
      this.updateMetricDisplay('memory-usage', this.formatBytes(memory));
      
      // Check memory threshold
      if (memory > this.options.highMemoryThreshold) {
        this.addAlert('High memory usage detected', 'danger');
      }
    }
    
    // Update network status
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.updateMetricDisplay('network-status', connection.effectiveType);
    }
    
    // Update performance score
    const score = this.calculatePerformanceScore();
    this.updateMetricDisplay('performance-score', score + '%');
    
    // Update optimization counters
    this.updateOptimizationCounters();
  }

  // ========================================
  // CHARTS & VISUALIZATION
  // ========================================

  initializeCharts() {
    this.charts.pageLoad = this.createChart('page-load-chart', 'Page Load Times');
    this.charts.resourceLoad = this.createChart('resource-load-chart', 'Resource Load Times');
  }

  createChart(canvasId, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    const chartObj = {
      canvas,
      ctx,
      data: [],
      title,
      draw: function() {
        // Use the data from this chart object, not from this.charts
        const data = this.data || [];
        return window.performanceDashboard.drawChart(ctx, data, title);
      }
    };
    return chartObj;
  }

  drawChart(ctx, data, title) {
    const { width, height } = ctx.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (!data || data.length === 0) return;
    
    // Setup
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find min/max values
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw data
    ctx.strokeStyle = this.options.chartColors.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = this.options.chartColors.primary;
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((value - minValue) / range) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // ========================================
  // PERFORMANCE TRACKING
  // ========================================

  trackResourcePerformance(entry) {
    const loadTime = entry.responseEnd - entry.requestStart;
    
    this.metrics.resourceLoad.push({
      name: entry.name,
      loadTime,
      size: entry.transferSize,
      timestamp: Date.now()
    });
    
    // Keep only recent data
    if (this.metrics.resourceLoad.length > this.options.maxDataPoints) {
      this.metrics.resourceLoad.shift();
    }
    
    // Update chart
    if (this.charts.resourceLoad) {
      this.charts.resourceLoad.data.push(loadTime);
      if (this.charts.resourceLoad.data.length > this.options.maxDataPoints) {
        this.charts.resourceLoad.data.shift();
      }
      this.charts.resourceLoad.draw();
    }
    
    // Check threshold
    if (loadTime > this.options.slowResourceThreshold) {
      this.addAlert(`Slow resource: ${entry.name} (${Math.round(loadTime)}ms)`, 'warning');
    }
  }

  trackPageLoad(entry) {
    const loadTime = entry.loadEventEnd - entry.fetchStart;
    
    this.metrics.pageLoad.push({
      loadTime,
      timestamp: Date.now()
    });
    
    // Keep only recent data
    if (this.metrics.pageLoad.length > this.options.maxDataPoints) {
      this.metrics.pageLoad.shift();
    }
    
    // Update chart
    if (this.charts.pageLoad) {
      this.charts.pageLoad.data.push(loadTime);
      if (this.charts.pageLoad.data.length > this.options.maxDataPoints) {
        this.charts.pageLoad.data.shift();
      }
      this.charts.pageLoad.draw();
    }
    
    // Check threshold
    if (loadTime > this.options.slowPageThreshold) {
      this.addAlert(`Slow page load: ${Math.round(loadTime)}ms`, 'danger');
    }
  }

  // ========================================
  // UI UPDATES
  // ========================================

  updateVitalDisplay(vital, value) {
    const valueElement = document.getElementById(`${vital}-value`);
    const statusElement = document.getElementById(`${vital}-status`);
    const cardElement = valueElement?.closest('.vital-card');
    
    if (!valueElement || !statusElement || !cardElement) return;
    
    let displayValue, status, cardClass;
    
    switch (vital) {
      case 'lcp':
        displayValue = Math.round(value) + 'ms';
        if (value <= 2500) {
          status = 'Good';
          cardClass = '';
        } else if (value <= 4000) {
          status = 'Needs Improvement';
          cardClass = 'warning';
        } else {
          status = 'Poor';
          cardClass = 'danger';
        }
        break;
        
      case 'fid':
        displayValue = Math.round(value) + 'ms';
        if (value <= 100) {
          status = 'Good';
          cardClass = '';
        } else if (value <= 300) {
          status = 'Needs Improvement';
          cardClass = 'warning';
        } else {
          status = 'Poor';
          cardClass = 'danger';
        }
        break;
        
      case 'cls':
        displayValue = value.toFixed(3);
        if (value <= 0.1) {
          status = 'Good';
          cardClass = '';
        } else if (value <= 0.25) {
          status = 'Needs Improvement';
          cardClass = 'warning';
        } else {
          status = 'Poor';
          cardClass = 'danger';
        }
        break;
    }
    
    valueElement.textContent = displayValue;
    statusElement.textContent = status;
    
    // Update card class
    cardElement.className = `vital-card ${vital} ${cardClass}`;
  }

  updateMetricDisplay(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  updateOptimizationCounters() {
    // Update from global optimizers if available
    if (window.lazyLoader) {
      const report = window.lazyLoader.getPerformanceReport();
      this.updateMetricDisplay('lazy-images-count', report.imagesLoaded);
    }
    
    if (window.imageOptimizer) {
      const report = window.imageOptimizer.getPerformanceReport();
      this.updateMetricDisplay('compressed-images-count', report.imagesProcessed);
    }
    
    if (window.assetOptimizer) {
      const report = window.assetOptimizer.getPerformanceReport();
      this.updateMetricDisplay('minified-assets-count', report.filesProcessed);
    }
  }

  // ========================================
  // ALERT SYSTEM
  // ========================================

  setupAlertSystem() {
    // Monitor for performance degradation
    setInterval(() => {
      this.checkPerformanceThresholds();
    }, 5000);
  }

  checkPerformanceThresholds() {
    // Check Core Web Vitals
    const { lcp, fid, cls } = this.metrics.coreWebVitals;
    
    if (lcp && lcp > this.options.slowPageThreshold) {
      this.addAlert(`LCP exceeds threshold: ${Math.round(lcp)}ms`, 'danger');
    }
    
    if (fid && fid > 300) {
      this.addAlert(`High FID detected: ${Math.round(fid)}ms`, 'warning');
    }
    
    if (cls && cls > 0.25) {
      this.addAlert(`High CLS detected: ${cls.toFixed(3)}`, 'warning');
    }
  }

  addAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert-item ${type}`;
    alert.innerHTML = `
      <strong>${new Date().toLocaleTimeString()}:</strong> ${message}
      <span style="float: right; cursor: pointer;" onclick="this.parentElement.remove()">×</span>
    `;
    
    alertsContainer.insertBefore(alert, alertsContainer.firstChild);
    
    // Remove old alerts (keep max 10)
    while (alertsContainer.children.length > 10) {
      alertsContainer.removeChild(alertsContainer.lastChild);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  calculatePerformanceScore() {
    const { lcp, fid, cls } = this.metrics.coreWebVitals;
    
    let score = 100;
    
    // LCP scoring (0-40 points)
    if (lcp) {
      if (lcp > 4000) score -= 40;
      else if (lcp > 2500) score -= 20;
    }
    
    // FID scoring (0-30 points)
    if (fid) {
      if (fid > 300) score -= 30;
      else if (fid > 100) score -= 15;
    }
    
    // CLS scoring (0-30 points)
    if (cls) {
      if (cls > 0.25) score -= 30;
      else if (cls > 0.1) score -= 15;
    }
    
    return Math.max(0, score);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ========================================
  // PUBLIC API
  // ========================================

  toggle() {
    if (this.dashboardElement.style.display === 'none') {
      this.dashboardElement.style.display = 'block';
      this.dashboardElement.classList.add('show');
    } else {
      this.dashboardElement.style.display = 'none';
      this.dashboardElement.classList.remove('show');
    }
  }

  show() {
    this.dashboardElement.style.display = 'block';
    this.dashboardElement.classList.add('show');
  }

  hide() {
    this.dashboardElement.style.display = 'none';
    this.dashboardElement.classList.remove('show');
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      coreWebVitals: this.metrics.coreWebVitals,
      pageLoad: this.metrics.pageLoad,
      resourceLoad: this.metrics.resourceLoad,
      optimizations: this.metrics.optimizations,
      performanceScore: this.calculatePerformanceScore()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getMetrics() {
    return this.metrics;
  }

  destroy() {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    
    // Remove dashboard
    if (this.dashboardElement) {
      this.dashboardElement.remove();
    }
    
    // Remove styles
    const styles = document.getElementById('performance-dashboard-styles');
    if (styles) styles.remove();
    
    console.log('🧹 Performance Dashboard destroyed');
  }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performanceDashboard = new PerformanceDashboard();
  });
} else {
  window.performanceDashboard = new PerformanceDashboard();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceDashboard;
} 