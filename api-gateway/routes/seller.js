const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { createProxyMiddleware } = require('http-proxy-middleware');

// ========================================
// SELLER DASHBOARD ENDPOINTS
// ========================================

// Get seller dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const sellerId = req.user?.id; // From JWT middleware
    
    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Seller authentication required'
      });
    }

    // Mock data for demo - in production, aggregate from multiple services
    const dashboardData = {
      stats: {
        totalRevenue: 2450000,
        totalOrders: 156,
        totalProducts: 24,
        totalCustomers: 89,
        pendingOrders: 3,
        lowStockProducts: 5
      },
      recentOrders: [
        {
          id: 'ORD001',
          customer: 'Nguyễn Văn An',
          customerPhone: '0901234567',
          products: [{ name: 'Cà chua hữu cơ', quantity: 2, unit: 'kg', price: 25000 }],
          total: 50000,
          status: 'pending',
          orderDate: '2025-01-17',
          deliveryDate: '2025-01-19'
        },
        {
          id: 'ORD002',
          customer: 'Trần Thị Bình',
          customerPhone: '0987654321',
          products: [{ name: 'Xoài cát Hoà Lộc', quantity: 1, unit: 'kg', price: 45000 }],
          total: 45000,
          status: 'confirmed',
          orderDate: '2025-01-17',
          deliveryDate: '2025-01-18'
        }
      ],
      topProducts: [
        { name: 'Cà chua hữu cơ', sold: 23, revenue: 575000 },
        { name: 'Xoài cát Hoà Lộc', sold: 15, revenue: 675000 },
        { name: 'Thịt heo hữu cơ', sold: 7, revenue: 1260000 }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Seller dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get seller orders with filters
router.get('/orders', async (req, res) => {
  try {
    const sellerId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Mock seller orders data
    let orders = [
      {
        id: 'ORD001',
        customer: 'Nguyễn Văn An',
        customerPhone: '0901234567',
        customerAddress: '123 Đường ABC, Quận 1, TP.HCM',
        products: [{ name: 'Cà chua hữu cơ', quantity: 2, unit: 'kg', price: 25000 }],
        total: 50000,
        status: 'pending',
        orderDate: '2025-01-17T10:30:00Z',
        deliveryDate: '2025-01-19T00:00:00Z',
        commission: { rate: 10, amount: 5000, status: 'pending' }
      },
      {
        id: 'ORD002',
        customer: 'Trần Thị Bình',
        customerPhone: '0987654321',
        customerAddress: '456 Đường XYZ, Quận 3, TP.HCM',
        products: [{ name: 'Xoài cát Hoà Lộc', quantity: 1, unit: 'kg', price: 45000 }],
        total: 45000,
        status: 'confirmed',
        orderDate: '2025-01-17T09:15:00Z',
        deliveryDate: '2025-01-18T00:00:00Z',
        commission: { rate: 10, amount: 4500, status: 'pending' }
      },
      {
        id: 'ORD003',
        customer: 'Lê Văn Cường',
        customerPhone: '0912345678',
        customerAddress: '789 Đường DEF, Quận 7, TP.HCM',
        products: [{ name: 'Thịt heo hữu cơ', quantity: 0.5, unit: 'kg', price: 180000 }],
        total: 90000,
        status: 'delivered',
        orderDate: '2025-01-15T14:20:00Z',
        deliveryDate: '2025-01-16T16:30:00Z',
        commission: { rate: 10, amount: 9000, status: 'paid' }
      }
    ];

    // Filter by status if provided
    if (status && status !== 'all') {
      orders = orders.filter(order => order.status === status);
    }

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        orders: paginatedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: orders.length,
          totalPages: Math.ceil(orders.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update order status (seller action)
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const sellerId = req.user?.id;

    // Validate status
    const validStatuses = ['confirmed', 'preparing', 'shipped', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Mock update - in production, update database and notify customer
    logger.info(`Seller ${sellerId} updated order ${orderId} to ${status}`);

    res.json({
      success: true,
      message: `Order ${orderId} status updated to ${status}`,
      data: {
        orderId,
        status,
        notes,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get seller products
router.get('/products', async (req, res) => {
  try {
    const sellerId = req.user?.id;
    const { category, status } = req.query;

    // Mock seller products
    let products = [
      {
        id: 'PROD001',
        name: 'Cà chua hữu cơ',
        category: 'Rau củ quả',
        price: 25000,
        unit: 'kg',
        stock: 45,
        sold: 23,
        status: 'active',
        image: '/assets/images/ca-chua.jpg',
        views: 342,
        ratings: { average: 4.8, total: 15 }
      },
      {
        id: 'PROD002',
        name: 'Xoài cát Hoà Lộc',
        category: 'Trái cây',
        price: 45000,
        unit: 'kg',
        stock: 12,
        sold: 15,
        status: 'active',
        image: '/assets/images/xoai-cat-hoa-loc.jpg',
        views: 198,
        ratings: { average: 4.9, total: 8 }
      },
      {
        id: 'PROD003',
        name: 'Thịt heo hữu cơ',
        category: 'Thịt cá',
        price: 180000,
        unit: 'kg',
        stock: 8,
        sold: 7,
        status: 'active',
        image: '/assets/images/thit-heo-huu-co.jpg',
        views: 89,
        ratings: { average: 5.0, total: 4 }
      }
    ];

    // Apply filters
    if (category) {
      products = products.filter(product => product.category === category);
    }
    if (status) {
      products = products.filter(product => product.status === status);
    }

    res.json({
      success: true,
      data: { products }
    });

  } catch (error) {
    logger.error('Seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add new product
router.post('/products', async (req, res) => {
  try {
    const sellerId = req.user?.id;
    const { name, category, price, unit, stock, description, origin } = req.body;

    // Validation
    if (!name || !category || !price || !unit || !stock) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Mock product creation
    const newProduct = {
      id: 'PROD' + Date.now(),
      name,
      category,
      price: parseFloat(price),
      unit,
      stock: parseInt(stock),
      description: description || '',
      origin: origin || '',
      sellerId,
      status: 'active',
      sold: 0,
      views: 0,
      ratings: { average: 5.0, total: 0 },
      createdAt: new Date().toISOString()
    };

    logger.info(`Seller ${sellerId} created product: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: newProduct }
    });

  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get inventory status
router.get('/inventory', async (req, res) => {
  try {
    const sellerId = req.user?.id;

    // Mock inventory data
    const inventory = [
      {
        productId: 'PROD001',
        name: 'Cà chua hữu cơ',
        currentStock: 45,
        reserved: 8,
        available: 37,
        reorderLevel: 20,
        warning: false
      },
      {
        productId: 'PROD002',
        name: 'Xoài cát Hoà Lộc',
        currentStock: 12,
        reserved: 5,
        available: 7,
        reorderLevel: 15,
        warning: true
      },
      {
        productId: 'PROD003',
        name: 'Thịt heo hữu cơ',
        currentStock: 8,
        reserved: 2,
        available: 6,
        reorderLevel: 10,
        warning: true
      }
    ];

    const stats = {
      totalProducts: inventory.length,
      lowStockProducts: inventory.filter(item => item.warning).length,
      totalStock: inventory.reduce((sum, item) => sum + item.currentStock, 0),
      totalReserved: inventory.reduce((sum, item) => sum + item.reserved, 0)
    };

    res.json({
      success: true,
      data: {
        inventory,
        stats
      }
    });

  } catch (error) {
    logger.error('Seller inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update product stock
router.put('/products/:productId/stock', async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;
    const sellerId = req.user?.id;

    if (!stock || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stock number required'
      });
    }

    // Mock stock update
    logger.info(`Seller ${sellerId} updated stock for product ${productId} to ${stock}`);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId,
        newStock: parseInt(stock),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const sellerId = req.user?.id;
    const { timeRange = '30d' } = req.query;

    // Mock revenue data
    const revenueData = {
      current: {
        gross: 2450000,
        commission: 245000,
        net: 2205000
      },
      trends: {
        daily: [150000, 200000, 180000, 250000, 300000, 280000, 350000],
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      },
      topProducts: [
        { name: 'Cà chua hữu cơ', revenue: 575000, quantity: 23 },
        { name: 'Xoài cát Hoà Lộc', revenue: 675000, quantity: 15 },
        { name: 'Thịt heo hữu cơ', revenue: 1260000, quantity: 7 }
      ],
      paymentHistory: [
        {
          date: '2025-01-15',
          description: 'Doanh thu tuần 1/2025',
          gross: 500000,
          commission: 50000,
          net: 450000,
          status: 'paid'
        },
        {
          date: '2025-01-08',
          description: 'Doanh thu tuần 52/2024',
          gross: 750000,
          commission: 75000,
          net: 675000,
          status: 'paid'
        }
      ]
    };

    res.json({
      success: true,
      data: revenueData
    });

  } catch (error) {
    logger.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get customer analytics
router.get('/customers', async (req, res) => {
  try {
    const sellerId = req.user?.id;

    // Mock customer data
    const customers = [
      {
        id: 'CUST001',
        name: 'Nguyễn Văn An',
        email: 'an@example.com',
        phone: '0901234567',
        totalOrders: 5,
        totalSpent: 250000,
        lastOrder: '2025-01-17',
        avgOrderValue: 50000
      },
      {
        id: 'CUST002',
        name: 'Trần Thị Bình',
        email: 'binh@example.com',
        phone: '0987654321',
        totalOrders: 3,
        totalSpent: 135000,
        lastOrder: '2025-01-17',
        avgOrderValue: 45000
      },
      {
        id: 'CUST003',
        name: 'Lê Văn Cường',
        email: 'cuong@example.com',
        phone: '0912345678',
        totalOrders: 2,
        totalSpent: 180000,
        lastOrder: '2025-01-15',
        avgOrderValue: 90000
      }
    ];

    const stats = {
      totalCustomers: customers.length,
      repeatCustomers: customers.filter(c => c.totalOrders > 1).length,
      avgOrderValue: customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / customers.length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0)
    };

    res.json({
      success: true,
      data: {
        customers,
        stats
      }
    });

  } catch (error) {
    logger.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update seller profile/settings
router.put('/profile', async (req, res) => {
  try {
    const sellerId = req.user?.id;
    const { businessName, businessPhone, businessEmail, businessAddress, processingTime } = req.body;

    // Mock profile update
    logger.info(`Seller ${sellerId} updated profile`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        businessName,
        businessPhone,
        businessEmail,
        businessAddress,
        processingTime,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 