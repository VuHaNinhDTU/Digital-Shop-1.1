/**
 * 📊 ANALYTICS & MONITORING SYSTEM
 * Tracks user behavior, performance metrics, and business insights
 */

class AnalyticsManager {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.events = [];
    this.performanceMetrics = {};
    this.errorLogs = [];
    this.pageViews = [];
    this.userFlow = [];
    this.conversionFunnel = {};
    this.isEnabled = true;
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds
    
    this.init();
  }

  init() {
    console.log('📊 Analytics Manager initialized');
    this.setupEventTracking();
    this.setupPerformanceTracking();
    this.setupErrorTracking();
    this.setupUserFlowTracking();
    this.setupConversionTracking();
    this.startAutoFlush();
    this.trackPageView();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUserId() {
    // Try to get user ID from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData).id || 'anonymous';
      } catch (e) {
        return 'anonymous';
      }
    }
    return 'anonymous';
  }

  // 📈 Event Tracking
  trackEvent(eventName, eventData = {}) {
    if (!this.isEnabled) return;

    const event = {
      id: this.generateEventId(),
      name: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    this.events.push(event);
    console.log('📊 Event tracked:', event);

    // Flush immediately for critical events
    if (this.isCriticalEvent(eventName)) {
      this.flush();
    }
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isCriticalEvent(eventName) {
    const criticalEvents = ['payment_success', 'payment_failure', 'purchase', 'error'];
    return criticalEvents.includes(eventName);
  }

  // 🎯 User Flow Tracking
  trackUserFlow(action, details = {}) {
    const flowEvent = {
      action,
      details,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      sessionId: this.sessionId
    };

    this.userFlow.push(flowEvent);
    
    // Track as regular event too
    this.trackEvent('user_flow', flowEvent);
  }

  // 📊 Page View Tracking
  trackPageView() {
    const pageView = {
      page: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      referrer: document.referrer,
      loadTime: performance.now()
    };

    this.pageViews.push(pageView);
    this.trackEvent('page_view', pageView);
  }

  // 💰 Conversion Tracking
  trackConversion(funnelStage, conversionData = {}) {
    const conversion = {
      stage: funnelStage,
      data: conversionData,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    if (!this.conversionFunnel[funnelStage]) {
      this.conversionFunnel[funnelStage] = [];
    }
    this.conversionFunnel[funnelStage].push(conversion);

    this.trackEvent('conversion', conversion);
  }

  // 🏪 E-commerce Tracking
  trackEcommerceEvent(eventType, eventData) {
    const ecommerceEvents = {
      view_item: (data) => this.trackEvent('view_item', {
        item_id: data.productId,
        item_name: data.productName,
        item_category: data.category,
        price: data.price,
        currency: 'VND'
      }),
      
      add_to_cart: (data) => this.trackEvent('add_to_cart', {
        item_id: data.productId,
        item_name: data.productName,
        quantity: data.quantity,
        price: data.price,
        currency: 'VND'
      }),
      
      remove_from_cart: (data) => this.trackEvent('remove_from_cart', {
        item_id: data.productId,
        item_name: data.productName,
        quantity: data.quantity,
        price: data.price,
        currency: 'VND'
      }),
      
      view_cart: (data) => this.trackEvent('view_cart', {
        items: data.items,
        total_value: data.totalValue,
        currency: 'VND'
      }),
      
      begin_checkout: (data) => this.trackEvent('begin_checkout', {
        items: data.items,
        total_value: data.totalValue,
        currency: 'VND'
      }),
      
      purchase: (data) => this.trackEvent('purchase', {
        transaction_id: data.orderId,
        items: data.items,
        total_value: data.totalValue,
        currency: 'VND',
        payment_method: data.paymentMethod
      })
    };

    if (ecommerceEvents[eventType]) {
      ecommerceEvents[eventType](eventData);
    }
  }

  // ⚡ Performance Tracking
  setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          this.performanceMetrics.pageLoad = {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            ttfb: perfData.responseStart - perfData.requestStart,
            timestamp: new Date().toISOString()
          };
          
          this.trackEvent('performance_page_load', this.performanceMetrics.pageLoad);
        }
      }, 0);
    });

    // Track Core Web Vitals
    this.trackCoreWebVitals();
  }

  trackCoreWebVitals() {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.performanceMetrics.lcp = lastEntry.startTime;
        this.trackEvent('core_web_vitals', {
          metric: 'lcp',
          value: lastEntry.startTime
        });
      });
      
      lcpObserver.observe({entryTypes: ['largest-contentful-paint']});

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.performanceMetrics.fid = entry.processingStart - entry.startTime;
          this.trackEvent('core_web_vitals', {
            metric: 'fid',
            value: entry.processingStart - entry.startTime
          });
        });
      });
      
      fidObserver.observe({entryTypes: ['first-input']});

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.performanceMetrics.cls = clsValue;
        this.trackEvent('core_web_vitals', {
          metric: 'cls',
          value: clsValue
        });
      });
      
      clsObserver.observe({entryTypes: ['layout-shift']});
    }
  }

  // 🚨 Error Tracking
  setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.trackError('resource_error', {
          type: event.target.tagName,
          source: event.target.src || event.target.href,
          message: 'Resource failed to load'
        });
      }
    }, true);
  }

  trackError(errorType, errorData) {
    const error = {
      type: errorType,
      data: errorData,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errorLogs.push(error);
    this.trackEvent('error', error);
    
    console.error('🚨 Error tracked:', error);
  }

  // 🔄 User Flow Tracking
  setupUserFlowTracking() {
    // Track user journey through the site
    const userFlow = {
      sessionStart: Date.now(),
      pages: [],
      actions: []
    };

    // Track page navigation
    const trackPageNavigation = (page) => {
      userFlow.pages.push({
        page: page,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      this.trackEvent('page_navigation', {
        page: page,
        user_flow: userFlow.pages.length
      });
    };

    // Track user actions
    const trackUserAction = (action, details = {}) => {
      userFlow.actions.push({
        action: action,
        timestamp: Date.now(),
        details: details
      });
      
      this.trackEvent('user_action', {
        action: action,
        details: details
      });
    };

    // Expose globally for use in other scripts
    window.trackUserFlow = {
      navigation: trackPageNavigation,
      action: trackUserAction
    };

    // Auto-track initial page
    trackPageNavigation(document.title);
  }

  // 🎯 Conversion Tracking
  setupConversionTracking() {
    // Track key conversion events
    const conversions = {
      product_view: (productData) => this.trackEvent('conversion_product_view', productData),
      add_to_cart: (productData) => this.trackEvent('conversion_add_to_cart', productData),
      checkout_start: (checkoutData) => this.trackEvent('conversion_checkout_start', checkoutData),
      purchase: (purchaseData) => this.trackEvent('conversion_purchase', purchaseData)
    };

    // Expose globally for use in other scripts
    window.trackConversion = conversions;

    // Auto-setup conversion tracking on common elements
    document.addEventListener('DOMContentLoaded', () => {
      // Track "Add to Cart" buttons
      document.querySelectorAll('[data-action="add-to-cart"]').forEach(button => {
        button.addEventListener('click', (e) => {
          const productId = button.dataset.productId;
          const productName = button.dataset.productName;
          const price = button.dataset.price;
          
          if (productId) {
            conversions.add_to_cart({
              product_id: productId,
              product_name: productName,
              price: price
            });
          }
        });
      });

      // Track "Buy Now" buttons
      document.querySelectorAll('[data-action="buy-now"]').forEach(button => {
        button.addEventListener('click', (e) => {
          const productId = button.dataset.productId;
          const productName = button.dataset.productName;
          const price = button.dataset.price;
          
          if (productId) {
            conversions.checkout_start({
              product_id: productId,
              product_name: productName,
              price: price
            });
          }
        });
      });
    });
  }

  // 🎪 Event Listeners Setup
  setupEventTracking() {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      
      if (tagName === 'a' || tagName === 'button' || target.onclick) {
        this.trackEvent('click', {
          element: tagName,
          text: target.textContent?.trim() || '',
          href: target.href || '',
          class: target.className || '',
          id: target.id || ''
        });
      }
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      this.trackEvent('form_submit', {
        formId: form.id || '',
        formClass: form.className || '',
        action: form.action || '',
        method: form.method || 'GET'
      });
    });

    // Scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > 0 && scrollPercent % 25 === 0) {
          this.trackEvent('scroll', {
            percent: scrollPercent
          });
        }
      }, 100);
    });

    // Time spent on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Date.now() - startTime;
      this.trackEvent('time_on_page', {
        duration: timeSpent,
        page: window.location.pathname
      });
    });
  }

  // 🔄 Data Flushing
  startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = this.events.splice(0, this.batchSize);
    
    try {
      await this.sendAnalytics(eventsToSend);
      console.log(`📊 Flushed ${eventsToSend.length} events`);
    } catch (error) {
      console.error('📊 Failed to flush analytics:', error);
      // Put events back for retry
      this.events = [...eventsToSend, ...this.events];
    }
  }

  async sendAnalytics(events) {
    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      events: events,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Send to analytics API
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Fallback to localStorage for offline support
      this.saveToLocalStorage(payload);
      throw error;
    }
  }

  saveToLocalStorage(payload) {
    const storageKey = 'analytics_offline';
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingData.push(payload);
    
    // Keep only last 100 payloads
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existingData));
  }

  // 📊 Analytics Helpers
  getSessionData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events,
      performanceMetrics: this.performanceMetrics,
      errorLogs: this.errorLogs,
      pageViews: this.pageViews,
      userFlow: this.userFlow,
      conversionFunnel: this.conversionFunnel
    };
  }

  // 🎛️ Controls
  enable() {
    this.isEnabled = true;
    console.log('📊 Analytics enabled');
  }

  disable() {
    this.isEnabled = false;
    console.log('📊 Analytics disabled');
  }

  reset() {
    this.events = [];
    this.performanceMetrics = {};
    this.errorLogs = [];
    this.pageViews = [];
    this.userFlow = [];
    this.conversionFunnel = {};
    this.sessionId = this.generateSessionId();
    console.log('📊 Analytics reset');
  }
}

// 🚀 Initialize Analytics
const analyticsManager = new AnalyticsManager();

// 🌐 Global Analytics Interface
window.analytics = {
  track: (event, data) => analyticsManager.trackEvent(event, data),
  trackFlow: (action, details) => analyticsManager.trackUserFlow(action, details),
  trackConversion: (stage, data) => analyticsManager.trackConversion(stage, data),
  trackEcommerce: (type, data) => analyticsManager.trackEcommerceEvent(type, data),
  trackError: (type, data) => analyticsManager.trackError(type, data),
  enable: () => analyticsManager.enable(),
  disable: () => analyticsManager.disable(),
  flush: () => analyticsManager.flush(),
  getSession: () => analyticsManager.getSessionData()
};

// Export for modules
window.AnalyticsManager = AnalyticsManager;
window.analyticsManager = analyticsManager; 