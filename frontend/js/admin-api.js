// Admin API Service
class AdminAPI {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('token');
  }

  // Helper method for authenticated requests
  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Unauthorized access');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  handleUnauthorized() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // User Management APIs
  async getUsers() {
    return await this.request('/api/users');
  }

  async getUserById(id) {
    return await this.request(`/api/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id) {
    return await this.request(`/api/users/${id}`, {
      method: 'DELETE'
    });
  }

  async createUser(userData) {
    return await this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Product Management APIs
  async getProducts() {
    return await this.request('/api/products');
  }

  async getProductById(productId) {
    return await this.request(`/api/products/${productId}`);
  }

  async updateProduct(productId, productData) {
    return await this.request(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(productId) {
    return await this.request(`/api/products/${productId}`, {
      method: 'DELETE'
    });
  }

  async createProduct(productData) {
    return await this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  // Order Management APIs
  async getOrders() {
    return await this.request('/api/orders');
  }

  async getOrderById(orderId) {
    return await this.request(`/api/orders/${orderId}`);
  }

  async updateOrder(orderId, orderData) {
    return await this.request(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData)
    });
  }

  async deleteOrder(orderId) {
    return await this.request(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  // Legacy method for backward compatibility
  async updateOrderStatus(orderId, status) {
    return await this.updateOrder(orderId, { status });
  }

  // Analytics APIs
  async getAnalytics() {
    return await this.request('/api/analytics/admin/summary');
  }

  async getAnalyticsEvents() {
    return await this.request('/api/analytics/admin/events');
  }

  async getConversionFunnel() {
    return await this.request('/api/analytics/admin/conversion-funnel');
  }

  // Health Check APIs
  async getSystemHealth() {
    return await this.request('/health');
  }

  async getServiceStatus() {
    return await this.request('/health/services');
  }

  // Blockchain APIs
  async getBlockchainTransactions() {
    return await this.request('/api/blockchain/transactions');
  }

  async getBlockchainStatus() {
    return await this.request('/api/blockchain/status');
  }

  // Dashboard Stats
  async getDashboardStats() {
    try {
      const [users, products, orders, analytics] = await Promise.all([
        this.getUsers(),
        this.getProducts(), 
        this.getOrders(),
        this.getAnalytics()
      ]);

      return {
        totalUsers: users.users?.length || 0,
        totalProducts: products.products?.length || 0,
        totalOrders: orders.orders?.length || 0,
        totalRevenue: orders.orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
        analytics: analytics
      };
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      return {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        analytics: {}
      };
    }
  }
}

// Initialize API instance
const adminAPI = new AdminAPI();

// Export for use in admin panel
window.adminAPI = adminAPI; 