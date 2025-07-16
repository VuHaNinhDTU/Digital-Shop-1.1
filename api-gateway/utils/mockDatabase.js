// Mock Database for Cho Nong San So
// In-memory database để đồng bộ dữ liệu giữa admin panel và user interface

class MockDatabase {
  constructor() {
    this.users = [
      {
        _id: 'user1',
        username: 'demo_user',
        email: 'user@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-01-15').toISOString()
      },
      {
        _id: 'user2',
        username: 'demo_admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date('2024-01-10').toISOString(),
        updatedAt: new Date('2024-01-10').toISOString()
      },
      {
        _id: 'user3',
        username: 'demo_logistics',
        email: 'logistics@example.com',
        role: 'logistics',
        status: 'active',
        createdAt: new Date('2024-01-12').toISOString(),
        updatedAt: new Date('2024-01-12').toISOString()
      }
    ];

    this.products = [
      {
        _id: 'prod1',
        name: 'Cà chua hữu cơ',
        price: 25000,
        category: 'Rau củ quả',
        description: 'Cà chua hữu cơ tươi ngon, trồng theo quy trình GAP',
        stock: 100,
        status: 'active',
        images: ['ca-chua.jpg'],
        farmerId: 'user1',
        location: 'Đà Lạt, Lâm Đồng',
        blockchainHash: 'hash_prod1_blockchain',
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date('2024-01-20').toISOString()
      },
      {
        _id: 'prod2',
        name: 'Xoài cát Hoà Lộc',
        price: 45000,
        category: 'Trái cây',
        description: 'Xoài cát Hoà Lộc đặc sản Tiền Giang, ngọt thanh',
        stock: 50,
        status: 'active',
        images: ['xoai-cat-hoa-loc.jpg'],
        farmerId: 'user2',
        location: 'Tiền Giang',
        blockchainHash: 'hash_prod2_blockchain',
        createdAt: new Date('2024-01-18').toISOString(),
        updatedAt: new Date('2024-01-18').toISOString()
      },
      {
        _id: 'prod3',
        name: 'Thịt heo hữu cơ',
        price: 180000,
        category: 'Thịt cá',
        description: 'Thịt heo hữu cơ nuôi tự nhiên, đảm bảo an toàn thực phẩm',
        stock: 25,
        status: 'active',
        images: ['thit-heo-huu-co.jpg'],
        farmerId: 'user3',
        location: 'An Giang',
        blockchainHash: 'hash_prod3_blockchain',
        createdAt: new Date('2024-01-16').toISOString(),
        updatedAt: new Date('2024-01-16').toISOString()
      }
    ];

    this.orders = [
      {
        _id: 'order1',
        userId: 'user1',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'nguyenvana@example.com',
        customerPhone: '0123456789',
        customerAddress: '123 Đường ABC, Q1, TP.HCM',
        items: [
          {
            productId: 'prod1',
            productName: 'Cà chua hữu cơ',
            quantity: 2,
            price: 25000,
            total: 50000
          },
          {
            productId: 'prod2',
            productName: 'Xoài cát Hoà Lộc',
            quantity: 1,
            price: 45000,
            total: 45000
          }
        ],
        totalAmount: 95000,
        status: 'completed',
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        notes: 'Giao hàng buổi sáng',
        blockchainHash: 'hash_order1_blockchain',
        orderDate: new Date('2024-01-21').toISOString(),
        deliveredDate: new Date('2024-01-22').toISOString(),
        createdAt: new Date('2024-01-21').toISOString(),
        updatedAt: new Date('2024-01-22').toISOString()
      },
      {
        _id: 'order2',
        userId: 'user2',
        customerName: 'Trần Thị B',
        customerEmail: 'tranthib@example.com',
        customerPhone: '0987654321',
        customerAddress: '456 Đường XYZ, Q3, TP.HCM',
        items: [
          {
            productId: 'prod3',
            productName: 'Thịt heo hữu cơ',
            quantity: 1,
            price: 180000,
            total: 180000
          }
        ],
        totalAmount: 180000,
        status: 'processing',
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        notes: '',
        blockchainHash: 'hash_order2_blockchain',
        orderDate: new Date('2024-01-22').toISOString(),
        createdAt: new Date('2024-01-22').toISOString(),
        updatedAt: new Date('2024-01-22').toISOString()
      },
      {
        _id: 'order3',
        userId: 'user1',
        customerName: 'Lê Văn C',
        customerEmail: 'levanc@example.com',
        customerPhone: '0345678912',
        customerAddress: '789 Đường DEF, Q7, TP.HCM',
        items: [
          {
            productId: 'prod1',
            productName: 'Cà chua hữu cơ',
            quantity: 3,
            price: 25000,
            total: 75000
          },
          {
            productId: 'prod2',
            productName: 'Xoài cát Hoà Lộc',
            quantity: 2,
            price: 45000,
            total: 90000
          }
        ],
        totalAmount: 165000,
        status: 'pending',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        notes: 'Gọi trước khi giao',
        blockchainHash: 'hash_order3_blockchain',
        orderDate: new Date('2024-01-23').toISOString(),
        createdAt: new Date('2024-01-23').toISOString(),
        updatedAt: new Date('2024-01-23').toISOString()
      }
    ];

    this.nextId = {
      users: 4,
      products: 4,
      orders: 4
    };
  }

  // Helper methods
  generateId(type) {
    const id = `${type}${this.nextId[type]}`;
    this.nextId[type]++;
    return id;
  }

  // USER CRUD Operations
  getUsers() {
    return { success: true, users: this.users };
  }

  getUserById(id) {
    const user = this.users.find(u => u._id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return { success: true, user };
  }

  createUser(userData) {
    const newUser = {
      _id: this.generateId('user'),
      ...userData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return { success: true, user: newUser };
  }

  updateUser(id, userData) {
    const userIndex = this.users.findIndex(u => u._id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    return { success: true, user: this.users[userIndex] };
  }

  deleteUser(id) {
    const userIndex = this.users.findIndex(u => u._id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    this.users.splice(userIndex, 1);
    return { success: true, message: 'User deleted successfully' };
  }

  // PRODUCT CRUD Operations
  getProducts() {
    return { success: true, products: this.products };
  }

  getProductById(id) {
    const product = this.products.find(p => p._id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return { success: true, product };
  }

  createProduct(productData) {
    const newProduct = {
      _id: this.generateId('prod'),
      ...productData,
      status: 'active',
      stock: productData.stock || 0,
      blockchainHash: `hash_${this.generateId('prod')}_blockchain`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.products.push(newProduct);
    return { success: true, product: newProduct };
  }

  updateProduct(id, productData) {
    const productIndex = this.products.findIndex(p => p._id === id);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    this.products[productIndex] = {
      ...this.products[productIndex],
      ...productData,
      updatedAt: new Date().toISOString()
    };
    return { success: true, product: this.products[productIndex] };
  }

  deleteProduct(id) {
    const productIndex = this.products.findIndex(p => p._id === id);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    this.products.splice(productIndex, 1);
    return { success: true, message: 'Product deleted successfully' };
  }

  // ORDER CRUD Operations
  getOrders() {
    return { success: true, orders: this.orders };
  }

  getOrderById(id) {
    const order = this.orders.find(o => o._id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    return { success: true, order };
  }

  createOrder(orderData) {
    const newOrder = {
      _id: this.generateId('order'),
      ...orderData,
      status: orderData.status || 'pending',
      paymentStatus: orderData.paymentStatus || 'pending',
      blockchainHash: `hash_${this.generateId('order')}_blockchain`,
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.orders.push(newOrder);
    return { success: true, order: newOrder };
  }

  updateOrder(id, orderData) {
    const orderIndex = this.orders.findIndex(o => o._id === id);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }
    
    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      ...orderData,
      updatedAt: new Date().toISOString()
    };
    return { success: true, order: this.orders[orderIndex] };
  }

  updateOrderStatus(id, status) {
    const orderIndex = this.orders.findIndex(o => o._id === id);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }
    
    this.orders[orderIndex].status = status;
    this.orders[orderIndex].updatedAt = new Date().toISOString();
    
    // Cập nhật deliveredDate nếu status là completed
    if (status === 'completed') {
      this.orders[orderIndex].deliveredDate = new Date().toISOString();
    }
    
    return { success: true, order: this.orders[orderIndex] };
  }

  deleteOrder(id) {
    const orderIndex = this.orders.findIndex(o => o._id === id);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }
    
    this.orders.splice(orderIndex, 1);
    return { success: true, message: 'Order deleted successfully' };
  }

  // STATISTICS
  getStats() {
    return {
      totalUsers: this.users.length,
      totalProducts: this.products.length,
      totalOrders: this.orders.length,
      totalRevenue: this.orders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + order.totalAmount, 0),
      activeUsers: this.users.filter(u => u.status === 'active').length,
      activeProducts: this.products.filter(p => p.status === 'active').length,
      pendingOrders: this.orders.filter(o => o.status === 'pending').length,
      completedOrders: this.orders.filter(o => o.status === 'completed').length
    };
  }
}

// Singleton instance
const mockDB = new MockDatabase();

module.exports = mockDB; 