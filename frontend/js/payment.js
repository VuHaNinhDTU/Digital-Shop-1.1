/**
 * 💳 PAYMENT INTEGRATION SYSTEM
 * Supports VNPay, MoMo, Banking, and COD payments
 */

class PaymentProcessor {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.paymentMethods = {
      vnpay: {
        name: 'VNPay',
        icon: '🏦',
        enabled: true,
        testMode: true
      },
      momo: {
        name: 'MoMo',
        icon: '📱',
        enabled: true,
        testMode: true
      },
      banking: {
        name: 'Banking',
        icon: '💳',
        enabled: true,
        testMode: true
      },
      cod: {
        name: 'COD',
        icon: '💰',
        enabled: true,
        testMode: false
      }
    };
    this.currentPayment = null;
    this.init();
  }

  init() {
    console.log('💳 Payment Processor initialized');
    this.setupEventListeners();
    this.loadPaymentMethods();
  }

  setupEventListeners() {
    // Listen for payment method changes
    document.addEventListener('change', (e) => {
      if (e.target.name === 'payment-method') {
        this.handlePaymentMethodChange(e.target.value);
      }
    });

    // Listen for payment submissions
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'checkout-form') {
        e.preventDefault();
        this.processPayment();
      }
    });
  }

  loadPaymentMethods() {
    const paymentMethodsContainer = document.getElementById('payment-methods');
    if (!paymentMethodsContainer) return;

    const methodsHtml = Object.entries(this.paymentMethods)
      .map(([key, method]) => `
        <div class="payment-method ${method.enabled ? '' : 'disabled'}" data-method="${key}">
          <label class="payment-method-label">
            <input type="radio" name="payment-method" value="${key}" ${method.enabled ? '' : 'disabled'}>
            <div class="payment-method-content">
              <div class="payment-method-icon">${method.icon}</div>
              <div class="payment-method-info">
                <h4>${method.name}</h4>
                <p>${method.testMode ? 'Test Mode' : 'Live Mode'}</p>
              </div>
            </div>
          </label>
        </div>
      `).join('');

    paymentMethodsContainer.innerHTML = methodsHtml;
  }

  handlePaymentMethodChange(method) {
    console.log(`💳 Payment method changed to: ${method}`);
    this.currentPayment = method;
    this.updatePaymentUI(method);
  }

  updatePaymentUI(method) {
    // Hide all payment forms
    document.querySelectorAll('.payment-form').forEach(form => {
      form.style.display = 'none';
    });

    // Show selected payment form
    const selectedForm = document.getElementById(`${method}-form`);
    if (selectedForm) {
      selectedForm.style.display = 'block';
    }
  }

  async processPayment() {
    if (!this.currentPayment) {
      this.showError('Vui lòng chọn phương thức thanh toán!');
      return;
    }

    const orderData = this.collectOrderData();
    
    try {
      this.showLoading('Đang xử lý thanh toán...');
      
      switch (this.currentPayment) {
        case 'vnpay':
          await this.processVNPayPayment(orderData);
          break;
        case 'momo':
          await this.processMoMoPayment(orderData);
          break;
        case 'banking':
          await this.processBankingPayment(orderData);
          break;
        case 'cod':
          await this.processCODPayment(orderData);
          break;
        default:
          throw new Error('Phương thức thanh toán không hợp lệ');
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showError(error.message || 'Có lỗi xảy ra trong quá trình thanh toán');
    } finally {
      this.hideLoading();
    }
  }

  collectOrderData() {
    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const orderData = {
      items: cart,
      total: this.calculateTotal(cart),
      customer: {
        name: formData.get('customer-name'),
        email: formData.get('customer-email'),
        phone: formData.get('customer-phone'),
        address: formData.get('customer-address')
      },
      paymentMethod: this.currentPayment,
      timestamp: new Date().toISOString()
    };

    return orderData;
  }

  calculateTotal(cart) {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // 🏦 VNPay Payment Processing
  async processVNPayPayment(orderData) {
    console.log('🏦 Processing VNPay payment...');
    
    // In real implementation, this would call VNPay API
    const vnpayData = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: 'VNPAY_TEST', // Test merchant code
      vnp_Amount: orderData.total * 100, // VNPay uses cents
      vnp_CurrCode: 'VND',
      vnp_TxnRef: `ORDER_${Date.now()}`,
      vnp_OrderInfo: `Thanh toán đơn hàng ${orderData.items.length} sản phẩm`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: `${window.location.origin}/payment-return`,
      vnp_IpAddr: '127.0.0.1'
    };

    // Simulate VNPay response
    await this.simulatePaymentDelay(2000);
    
    // For demo purposes, randomly succeed or fail
    if (Math.random() > 0.2) {
      this.handlePaymentSuccess(orderData, 'vnpay', vnpayData);
    } else {
      throw new Error('VNPay: Thanh toán bị từ chối');
    }
  }

  // 📱 MoMo Payment Processing
  async processMoMoPayment(orderData) {
    console.log('📱 Processing MoMo payment...');
    
    const momoData = {
      partnerCode: 'MOMO_TEST',
      requestId: `REQ_${Date.now()}`,
      amount: orderData.total,
      orderId: `ORDER_${Date.now()}`,
      orderInfo: `Thanh toán MoMo cho ${orderData.items.length} sản phẩm`,
      redirectUrl: `${window.location.origin}/payment-return`,
      ipnUrl: `${window.location.origin}/api/payment/momo/callback`,
      requestType: 'payWithATM',
      extraData: ''
    };

    // Simulate MoMo response
    await this.simulatePaymentDelay(1500);
    
    if (Math.random() > 0.15) {
      this.handlePaymentSuccess(orderData, 'momo', momoData);
    } else {
      throw new Error('MoMo: Giao dịch không thành công');
    }
  }

  // 💳 Banking Payment Processing
  async processBankingPayment(orderData) {
    console.log('💳 Processing Banking payment...');
    
    const bankingData = {
      accountNumber: '1234567890',
      accountName: 'CHO NONG SAN SO',
      bankName: 'Vietcombank',
      amount: orderData.total,
      content: `THANHTOAN ORDER${Date.now()}`,
      qrCode: await this.generateQRCode(orderData)
    };

    // Banking is always successful (manual verification)
    await this.simulatePaymentDelay(1000);
    this.handlePaymentSuccess(orderData, 'banking', bankingData);
  }

  // 💰 COD Payment Processing
  async processCODPayment(orderData) {
    console.log('💰 Processing COD payment...');
    
    const codData = {
      method: 'cod',
      amount: orderData.total,
      note: 'Thanh toán khi nhận hàng'
    };

    // COD is always successful
    await this.simulatePaymentDelay(500);
    this.handlePaymentSuccess(orderData, 'cod', codData);
  }

  async generateQRCode(orderData) {
    // In real implementation, this would generate actual QR code
    const qrContent = `BANK_TRANSFER|${orderData.total}|ORDER_${Date.now()}`;
    return `data:image/svg+xml;base64,${btoa(qrContent)}`;
  }

  async simulatePaymentDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handlePaymentSuccess(orderData, method, paymentData) {
    console.log(`✅ Payment successful via ${method}:`, paymentData);
    
    // Save order to localStorage
    const order = {
      id: `ORDER_${Date.now()}`,
      ...orderData,
      paymentData,
      status: 'paid',
      createdAt: new Date().toISOString()
    };

    this.saveOrder(order);
    this.clearCart();
    this.trackPaymentSuccess(method, orderData.total);
    
    // Redirect to success page
    window.location.href = `/order-success?id=${order.id}`;
  }

  saveOrder(order) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
  }

  clearCart() {
    localStorage.removeItem('cart');
    // Update cart badge
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) cartBadge.textContent = '0';
  }

  // 📊 Analytics Tracking
  trackPaymentSuccess(method, amount) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: `ORDER_${Date.now()}`,
        value: amount,
        currency: 'VND',
        payment_method: method
      });
    }
    
    // Send to analytics service
    this.sendAnalytics('payment_success', {
      method,
      amount,
      timestamp: new Date().toISOString()
    });
  }

  async sendAnalytics(event, data) {
    try {
      await fetch(`${this.apiBaseUrl}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  // 🎨 UI Helpers
  showLoading(message = 'Đang xử lý...') {
    const existingLoader = document.getElementById('payment-loader');
    if (existingLoader) existingLoader.remove();

    const loader = document.createElement('div');
    loader.id = 'payment-loader';
    loader.innerHTML = `
      <div class="payment-loader-overlay">
        <div class="payment-loader-content">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      </div>
    `;
    document.body.appendChild(loader);

    // Add CSS for loader
    if (!document.getElementById('payment-loader-styles')) {
      const styles = document.createElement('style');
      styles.id = 'payment-loader-styles';
      styles.textContent = `
        .payment-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
        .payment-loader-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4CAF50;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  hideLoading() {
    const loader = document.getElementById('payment-loader');
    if (loader) loader.remove();
  }

  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'payment-error';
    errorEl.innerHTML = `
      <div class="alert alert-danger">
        <i class="fa fa-exclamation-triangle"></i>
        ${message}
      </div>
    `;
    
    const form = document.getElementById('checkout-form');
    if (form) {
      form.insertBefore(errorEl, form.firstChild);
      setTimeout(() => errorEl.remove(), 5000);
    }
  }

  showSuccess(message) {
    const successEl = document.createElement('div');
    successEl.className = 'payment-success';
    successEl.innerHTML = `
      <div class="alert alert-success">
        <i class="fa fa-check-circle"></i>
        ${message}
      </div>
    `;
    
    const form = document.getElementById('checkout-form');
    if (form) {
      form.insertBefore(successEl, form.firstChild);
      setTimeout(() => successEl.remove(), 3000);
    }
  }
}

// 🚀 Initialize Payment System
const paymentProcessor = new PaymentProcessor();

// Export for use in other modules
window.PaymentProcessor = PaymentProcessor;
window.paymentProcessor = paymentProcessor; 