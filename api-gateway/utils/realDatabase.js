const fs = require('fs');
const path = require('path');
const axios = require('axios');

class RealDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, 'data');
    this.productsFile = path.join(this.dbPath, 'products.json');
    this.ordersFile = path.join(this.dbPath, 'orders.json');
    this.usersFile = path.join(this.dbPath, 'users.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
    
    this.initializeFiles();
  }

  initializeFiles() {
    // Initialize products file with sample data
    if (!fs.existsSync(this.productsFile)) {
      const sampleProducts = [
        {
          _id: 'prod_sample_1',
          name: 'Cà chua hữu cơ',
          price: 25000,
          category: 'Rau củ quả',
          description: 'Cà chua hữu cơ tươi ngon, không thuốc trừ sâu',
          unit: 'kg',
          imageUrls: ['/uploads/ca-chua.jpg'],
          blockchainHash: 'hash_ca_chua_123',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'prod_sample_2',
          name: 'Xoài cát Hoà Lộc',
          price: 45000,
          category: 'Trái cây',
          description: 'Xoài cát Hoà Lộc ngọt thơm, xuất xứ Đồng Tháp',
          unit: 'kg',
          imageUrls: ['/uploads/xoai-cat-hoa-loc.jpg'],
          blockchainHash: 'hash_xoai_456',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'prod_sample_3',
          name: 'Thịt heo hữu cơ',
          price: 180000,
          category: 'Thịt cá',
          description: 'Thịt heo hữu cơ sạch, chăn nuôi theo tiêu chuẩn VietGAP',
          unit: 'kg',
          imageUrls: ['/uploads/thit-heo-huu-co.jpg'],
          blockchainHash: 'hash_thit_heo_789',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(this.productsFile, JSON.stringify(sampleProducts, null, 2));
    }
    
    // Initialize orders file with sample data
    if (!fs.existsSync(this.ordersFile)) {
      const sampleOrders = [
        {
          _id: 'order_sample_1',
          customerName: 'Nguyễn Văn An',
          customerPhone: '0901234567',
          customerAddress: '123 Đường ABC, Quận 1, TP.HCM',
          items: [
            {
              productId: 'prod_sample_1',
              quantity: 2,
              price: 25000,
              unit: 'kg'
            }
          ],
          totalAmount: 50000,
          status: 'pending',
          orderDate: new Date().toISOString(),
          deliveryDate: null,
          blockchainHash: 'hash_order_123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'order_sample_2',
          customerName: 'Trần Thị Bình',
          customerPhone: '0987654321',
          customerAddress: '456 Đường XYZ, Quận 3, TP.HCM',
          items: [
            {
              productId: 'prod_sample_2',
              quantity: 1,
              price: 45000,
              unit: 'kg'
            }
          ],
          totalAmount: 45000,
          status: 'confirmed',
          orderDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          deliveryDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          blockchainHash: 'hash_order_456',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'order_sample_3',
          customerName: 'Lê Văn Cường',
          customerPhone: '0912345678',
          customerAddress: '789 Đường DEF, Quận 7, TP.HCM',
          items: [
            {
              productId: 'prod_sample_3',
              quantity: 0.5,
              price: 180000,
              unit: 'kg'
            }
          ],
          totalAmount: 90000,
          status: 'delivered',
          orderDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          deliveryDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          blockchainHash: 'hash_order_789',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      fs.writeFileSync(this.ordersFile, JSON.stringify(sampleOrders, null, 2));
    }
    
    // Initialize users file with sample data
    if (!fs.existsSync(this.usersFile)) {
      const sampleUsers = [
        {
          _id: 'user_admin_1',
          username: 'demo_admin',
          email: 'admin@cho-nong-san-so.com',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'user_seller_1',
          username: 'demo_seller',
          email: 'seller@example.com',
          password: 'seller123',
          role: 'seller',
          sellerProfile: {
            businessName: 'Nông Trại Xanh',
            businessType: 'Nông trại hữu cơ',
            businessAddress: '123 Đường Nông Nghiệp, Phường 1, Quận 12, TP.HCM',
            businessPhone: '0901234567',
            businessEmail: 'nongtrai@example.com',
            verification: 'verified',
            commissionRate: 10,
            bankInfo: {
              bankName: 'Vietcombank',
              accountNumber: '0123456789',
              accountHolder: 'Nông Trại Xanh'
            },
            ratings: {
              average: 4.8,
              total: 15
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'user_logistics_1',
          username: 'demo_logistics',
          email: 'logistics@example.com',
          password: 'logistics123',
          role: 'logistics',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'user_customer_1',
          username: 'demo_user',
          email: 'user@example.com',
          password: 'user123',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(this.usersFile, JSON.stringify(sampleUsers, null, 2));
    }
  }

  // Helper methods
  readFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      return false;
    }
  }

  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Products methods
  getAllProducts() {
    return this.readFile(this.productsFile);
  }

  getProductById(id) {
    const products = this.readFile(this.productsFile);
    return products.find(p => p._id === id);
  }

  createProduct(productData) {
    const products = this.readFile(this.productsFile);
    const newProduct = {
      _id: this.generateId('prod'),
      ...productData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    this.writeFile(this.productsFile, products);
    return newProduct;
  }

  updateProduct(id, updateData) {
    const products = this.readFile(this.productsFile);
    const index = products.findIndex(p => p._id === id);
    
    if (index === -1) return null;
    
    products[index] = {
      ...products[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.writeFile(this.productsFile, products);
    return products[index];
  }

  deleteProduct(id) {
    const products = this.readFile(this.productsFile);
    const index = products.findIndex(p => p._id === id);
    
    if (index === -1) return null;
    
    const deletedProduct = products[index];
    products.splice(index, 1);
    this.writeFile(this.productsFile, products);
    return deletedProduct;
  }

  // Orders methods
  getAllOrders() {
    return this.readFile(this.ordersFile);
  }

  getOrderById(id) {
    const orders = this.readFile(this.ordersFile);
    return orders.find(o => o._id === id);
  }

  createOrder(orderData) {
    const orders = this.readFile(this.ordersFile);
    const newOrder = {
      _id: this.generateId('ord'),
      ...orderData,
      status: orderData.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    this.writeFile(this.ordersFile, orders);
    return newOrder;
  }

  updateOrder(id, updateData) {
    const orders = this.readFile(this.ordersFile);
    const index = orders.findIndex(o => o._id === id);
    
    if (index === -1) return null;
    
    orders[index] = {
      ...orders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.writeFile(this.ordersFile, orders);
    return orders[index];
  }

  deleteOrder(id) {
    const orders = this.readFile(this.ordersFile);
    const index = orders.findIndex(o => o._id === id);
    
    if (index === -1) return null;
    
    const deletedOrder = orders[index];
    orders.splice(index, 1);
    this.writeFile(this.ordersFile, orders);
    return deletedOrder;
  }

  // Users methods
  getAllUsers() {
    return this.readFile(this.usersFile);
  }

  getUserById(id) {
    const users = this.readFile(this.usersFile);
    return users.find(u => u._id === id);
  }

  createUser(userData) {
    const users = this.readFile(this.usersFile);
    const newUser = {
      _id: this.generateId('user'),
      ...userData,
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    this.writeFile(this.usersFile, users);
    return newUser;
  }

  updateUser(id, updateData) {
    const users = this.readFile(this.usersFile);
    const index = users.findIndex(u => u._id === id);
    
    if (index === -1) return null;
    
    users[index] = {
      ...users[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.writeFile(this.usersFile, users);
    return users[index];
  }

  deleteUser(id) {
    const users = this.readFile(this.usersFile);
    const index = users.findIndex(u => u._id === id);
    
    if (index === -1) return null;
    
    const deletedUser = users[index];
    users.splice(index, 1);
    this.writeFile(this.usersFile, users);
    return deletedUser;
  }

  // Sync methods from microservices
  async syncProductsFromMicroservice() {
    try {
      const response = await axios.get('http://localhost:3001/api/products');
      const data = response.data;
      
      if (data.success && data.data) {
        const products = data.data.map(product => ({
          _id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          description: product.description,
          unit: product.unit,
          imageUrls: product.imageUrls,
          blockchainHash: product.blockchainHash,
          status: product.status || 'active',
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }));
        
        this.writeFile(this.productsFile, products);
        console.log(`✅ Synced ${products.length} products from microservice`);
        return products;
      }
    } catch (error) {
      console.error('❌ Error syncing products from microservice:', error);
    }
    return [];
  }

  async syncOrdersFromMicroservice() {
    try {
      const response = await axios.get('http://localhost:3004/api/orders');
      const data = response.data;
      
      if (data.success && data.data) {
        const orders = data.data.map(order => ({
          _id: order._id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          orderDate: order.orderDate,
          deliveryDate: order.deliveryDate,
          blockchainHash: order.blockchainHash,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }));
        
        this.writeFile(this.ordersFile, orders);
        console.log(`✅ Synced ${orders.length} orders from microservice`);
        return orders;
      }
    } catch (error) {
      console.error('❌ Error syncing orders from microservice:', error);
    }
    return [];
  }

  async syncUsersFromMicroservice() {
    try {
      const response = await axios.get('http://localhost:3002/api/users');
      const data = response.data;
      
      if (data.success && data.data) {
        const users = data.data.map(user => ({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
        
        this.writeFile(this.usersFile, users);
        console.log(`✅ Synced ${users.length} users from microservice`);
        return users;
      }
    } catch (error) {
      console.error('❌ Error syncing users from microservice:', error);
    }
    return [];
  }

  // Auto sync periodically
  startAutoSync(intervalMinutes = 5) {
    const interval = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      console.log('🔄 Auto syncing data from microservices...');
      await this.syncProductsFromMicroservice();
      await this.syncOrdersFromMicroservice();
      await this.syncUsersFromMicroservice();
    }, interval);
    
    console.log(`✅ Auto sync started - running every ${intervalMinutes} minutes`);
  }
}

module.exports = RealDatabase; 