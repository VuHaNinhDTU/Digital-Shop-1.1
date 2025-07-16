// API Client for Cho Nong San So
// Centralized API management

class ApiClient {
  constructor() {
    this.baseUrls = {
      products: 'http://localhost:3001/api',
      orders: 'http://localhost:3004/api', 
      users: 'http://localhost:3003/api'
    };
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  async request(url, options = {}) {
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Product API methods
  async getProducts() {
    return this.request(`${this.baseUrls.products}/products`);
  }

  async getProduct(id) {
    return this.request(`${this.baseUrls.products}/products/${id}`);
  }

  async createProduct(productData) {
    const formData = new FormData();
    
    // Handle form fields
    Object.keys(productData).forEach(key => {
      if (key === 'images' && Array.isArray(productData[key])) {
        productData[key].forEach(file => formData.append('images', file));
      } else {
        formData.append(key, productData[key]);
      }
    });

    return this.request(`${this.baseUrls.products}/products`, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set content-type for FormData
    });
  }

  async traceProduct(id) {
    return this.request(`${this.baseUrls.products}/products/${id}/trace`);
  }

  // Order API methods
  async getOrders() {
    return this.request(`${this.baseUrls.orders}/orders`);
  }

  async createOrder(orderData) {
    return this.request(`${this.baseUrls.orders}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async traceOrder(id) {
    return this.request(`${this.baseUrls.orders}/orders/${id}/trace`);
  }

  // User API methods
  async getUser(id) {
    return this.request(`${this.baseUrls.users}/users/${id}`);
  }

  async createUser(userData) {
    return this.request(`${this.baseUrls.users}/users`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
}

// Create global API client instance
const apiClient = new ApiClient();

// Enhanced API wrapper with loading states and error handling
class ApiService {
  static async withLoading(apiCall, loadingMessage = 'Đang tải...') {
    try {
      loadingManager.show(loadingMessage);
      const result = await apiCall();
      loadingManager.hide();
      return result;
    } catch (error) {
      loadingManager.hide();
      toastManager.error(error.message || 'Có lỗi xảy ra khi kết nối server');
      throw error;
    }
  }

  static async withToast(apiCall, successMessage = 'Thành công!', loadingMessage = 'Đang xử lý...') {
    try {
      loadingManager.show(loadingMessage);
      const result = await apiCall();
      loadingManager.hide();
      
      if (result.success) {
        toastManager.success(successMessage);
      }
      
      return result;
    } catch (error) {
      loadingManager.hide();
      toastManager.error(error.message || 'Có lỗi xảy ra');
      throw error;
    }
  }

  // Product service methods
  static async getProducts() {
    return this.withLoading(() => apiClient.getProducts(), 'Đang tải sản phẩm...');
  }

  static async getProduct(id) {
    return this.withLoading(() => apiClient.getProduct(id), 'Đang tải thông tin sản phẩm...');
  }

  static async createProduct(productData) {
    return this.withToast(
      () => apiClient.createProduct(productData),
      'Đăng bán sản phẩm thành công!',
      'Đang đăng sản phẩm...'
    );
  }

  static async traceProduct(id) {
    return this.withLoading(() => apiClient.traceProduct(id), 'Đang truy xuất nguồn gốc...');
  }

  // Order service methods
  static async getOrders() {
    return this.withLoading(() => apiClient.getOrders(), 'Đang tải đơn hàng...');
  }

  static async createOrder(orderData) {
    return this.withToast(
      () => apiClient.createOrder(orderData),
      'Đặt hàng thành công!',
      'Đang xử lý đơn hàng...'
    );
  }

  static async traceOrder(id) {
    return this.withLoading(() => apiClient.traceOrder(id), 'Đang truy xuất thông tin đơn hàng...');
  }

  // User service methods
  static async getUser(id) {
    return this.withLoading(() => apiClient.getUser(id), 'Đang tải thông tin người dùng...');
  }

  static async createUser(userData) {
    return this.withToast(
      () => apiClient.createUser(userData),
      'Tạo tài khoản thành công!',
      'Đang tạo tài khoản...'
    );
  }
}

// Export for global use
window.apiClient = apiClient;
window.ApiService = ApiService; 