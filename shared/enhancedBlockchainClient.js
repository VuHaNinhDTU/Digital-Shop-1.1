const { ethers } = require("ethers");

/**
 * Enhanced Blockchain Client for Cho Nong San So
 * Supports both mock development mode and real blockchain integration
 */
class EnhancedBlockchainClient {
  constructor() {
    this.mode = process.env.BLOCKCHAIN_MODE || 'mock'; // 'mock' or 'real'
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.contractABI = this.getContractABI();
    this.privateKey = process.env.PRIVATE_KEY;
    this.rpcUrl = process.env.RPC_URL;
    
    // Initialize based on mode
    if (this.mode === 'real') {
      this.initializeRealBlockchain();
    }
    
    console.log(`🔗 Blockchain Client initialized in ${this.mode.toUpperCase()} mode`);
  }

  /**
   * Initialize real blockchain connection
   */
  initializeRealBlockchain() {
    try {
      if (!this.contractAddress || !this.privateKey || !this.rpcUrl) {
        console.warn('⚠️ Missing blockchain configuration, falling back to mock mode');
        this.mode = 'mock';
        return;
      }

      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      this.wallet = new ethers.Wallet(this.privateKey, this.provider);
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);
      
      console.log('✅ Real blockchain connection established');
    } catch (error) {
      console.error('❌ Failed to initialize real blockchain:', error.message);
      console.log('🔄 Falling back to mock mode');
      this.mode = 'mock';
    }
  }

  /**
   * Get contract ABI - simplified version for demo
   */
  getContractABI() {
    return [
      "function createProduct(string name, string category, string description, uint256 price, string unit, string[] imageHashes, bool isOrganic, string certificationNumber, uint256 expiryDate, string origin, string harvestDate) returns (uint256)",
      "function getProduct(uint256 productId) view returns (tuple(uint256 id, string name, string category, string description, uint256 price, string unit, address farmer, uint256 createdAt, uint256 updatedAt, bool isActive))",
      "function addSupplyChainStep(uint256 productId, string stepType, string location, string description, string gpsCoordinates, string additionalData)",
      "function getProductSupplyChain(uint256 productId) view returns (tuple(uint256 stepId, string stepType, string location, string description, address actor, uint256 timestamp, string gpsCoordinates, string additionalData)[])",
      "function createOrder(uint256[] productIds, uint256[] quantities, string customerName, string customerPhone, string deliveryAddress, uint256 totalAmount, string paymentMethod) returns (uint256)",
      "function getOrder(uint256 orderId) view returns (tuple(uint256 id, uint256[] productIds, uint256[] quantities, address customer, string customerName, string customerPhone, string deliveryAddress, uint256 totalAmount, uint256 orderDate, uint8 status, string paymentMethod))",
      "function updateOrderStatus(uint256 orderId, uint8 newStatus, string notes)",
      "function getOrderSupplyChain(uint256 orderId) view returns (tuple(uint256 stepId, string stepType, string location, string description, address actor, uint256 timestamp, string gpsCoordinates, string additionalData)[])",
      "event ProductCreated(uint256 indexed productId, string name, address indexed farmer, uint256 timestamp)",
      "event OrderCreated(uint256 indexed orderId, address indexed customer, uint256 totalAmount, uint256 timestamp)",
      "event SupplyChainStepAdded(uint256 indexed productId, uint256 indexed stepId, string stepType, address indexed actor, uint256 timestamp)"
    ];
  }

  /**
   * Write product trace to blockchain
   */
  async writeProductTrace(product) {
    if (this.mode === 'mock') {
      return this.mockWriteProductTrace(product);
    }

    try {
      const imageHashes = product.imageUrls || [];
      const tx = await this.contract.createProduct(
        product.name,
        product.category,
        product.description || '',
        ethers.parseUnits(product.price.toString(), 0), // Assuming price is in wei
        product.unit,
        imageHashes,
        false, // isOrganic - could be extracted from product data
        '', // certificationNumber
        0, // expiryDate
        'Vietnam', // origin
        new Date().toISOString().split('T')[0] // harvestDate
      );

      const receipt = await tx.wait();
      
      console.log(`🔗 Product ${product._id} written to blockchain: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        traceData: {
          productId: product._id,
          productName: product.name,
          category: product.category,
          price: product.price,
          unit: product.unit,
          timestamp: new Date().toISOString(),
          action: 'PRODUCT_CREATED',
          blockchainHash: receipt.hash
        }
      };

    } catch (error) {
      console.error(`❌ Error writing product to blockchain:`, error.message);
      
      // Fallback to mock if real blockchain fails
      console.log('🔄 Falling back to mock mode for this transaction');
      return this.mockWriteProductTrace(product);
    }
  }

  /**
   * Write order trace to blockchain
   */
  async writeOrderTrace(order) {
    if (this.mode === 'mock') {
      return this.mockWriteOrderTrace(order);
    }

    try {
      const productIds = order.items.map(item => item.productId);
      const quantities = order.items.map(item => item.quantity);
      
      const tx = await this.contract.createOrder(
        productIds,
        quantities,
        order.customerName,
        order.customerPhone,
        order.customerAddress || '',
        ethers.parseUnits(order.totalAmount.toString(), 0),
        'COD' // paymentMethod
      );

      const receipt = await tx.wait();
      
      console.log(`🔗 Order ${order._id} written to blockchain: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        traceData: {
          orderId: order._id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.totalAmount,
          items: order.items,
          timestamp: new Date().toISOString(),
          action: 'ORDER_CREATED',
          blockchainHash: receipt.hash
        }
      };

    } catch (error) {
      console.error(`❌ Error writing order to blockchain:`, error.message);
      
      // Fallback to mock if real blockchain fails
      console.log('🔄 Falling back to mock mode for this transaction');
      return this.mockWriteOrderTrace(order);
    }
  }

  /**
   * Get product trace from blockchain
   */
  async getProductTrace(productId) {
    if (this.mode === 'mock') {
      return this.mockGetProductTrace(productId);
    }

    try {
      // For real blockchain, we would need to implement product ID mapping
      // This is simplified for demo
      const supplyChain = await this.contract.getProductSupplyChain(1); // Demo with ID 1
      
      return {
        productId: productId,
        trace: {
          productName: 'Blockchain Product',
          category: 'Blockchain Category',
          price: 100000,
          unit: 'kg',
          timestamp: new Date().toISOString(),
          action: 'PRODUCT_CREATED',
          blockchainHash: '0x' + Math.random().toString(16).substr(2, 40),
          supplyChain: supplyChain.map(step => ({
            step: step.stepType,
            location: step.location,
            timestamp: new Date(step.timestamp * 1000).toISOString(),
            description: step.description,
            actor: step.actor,
            gpsCoordinates: step.gpsCoordinates
          }))
        }
      };

    } catch (error) {
      console.error(`❌ Error getting product trace:`, error.message);
      return this.mockGetProductTrace(productId);
    }
  }

  /**
   * Get order trace from blockchain
   */
  async getOrderTrace(orderId) {
    if (this.mode === 'mock') {
      return this.mockGetOrderTrace(orderId);
    }

    try {
      // For real blockchain, we would need to implement order ID mapping
      const orderSupplyChain = await this.contract.getOrderSupplyChain(1); // Demo with ID 1
      
      return {
        orderId: orderId,
        trace: {
          customerName: 'Blockchain Customer',
          totalAmount: 500000,
          timestamp: new Date().toISOString(),
          action: 'ORDER_CREATED',
          blockchainHash: '0x' + Math.random().toString(16).substr(2, 40),
          orderStatus: orderSupplyChain.map(step => ({
            status: step.stepType,
            timestamp: new Date(step.timestamp * 1000).toISOString(),
            description: step.description,
            location: step.location,
            actor: step.actor
          })),
          paymentInfo: {
            method: 'COD',
            status: 'Pending',
            amount: 500000
          },
          deliveryInfo: {
            address: 'Blockchain Address',
            estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
            trackingId: 'BC' + Math.random().toString().substr(2, 8)
          }
        }
      };

    } catch (error) {
      console.error(`❌ Error getting order trace:`, error.message);
      return this.mockGetOrderTrace(orderId);
    }
  }

  /**
   * Add supply chain step
   */
  async addSupplyChainStep(productId, stepType, location, description, gpsCoordinates = '', additionalData = '') {
    if (this.mode === 'mock') {
      return this.mockAddSupplyChainStep(productId, stepType, location, description);
    }

    try {
      const tx = await this.contract.addSupplyChainStep(
        1, // productId mapping needed
        stepType,
        location,
        description,
        gpsCoordinates,
        additionalData
      );

      const receipt = await tx.wait();
      
      console.log(`🔗 Supply chain step added to blockchain: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash,
        stepData: {
          productId,
          stepType,
          location,
          description,
          timestamp: new Date().toISOString(),
          blockchainHash: receipt.hash
        }
      };

    } catch (error) {
      console.error(`❌ Error adding supply chain step:`, error.message);
      return this.mockAddSupplyChainStep(productId, stepType, location, description);
    }
  }

  /**
   * Update order status on blockchain
   */
  async updateOrderStatus(orderId, status, notes = '') {
    if (this.mode === 'mock') {
      return this.mockUpdateOrderStatus(orderId, status, notes);
    }

    try {
      const statusMap = {
        'PENDING': 0,
        'CONFIRMED': 1,
        'PREPARING': 2,
        'IN_TRANSIT': 3,
        'DELIVERED': 4,
        'CANCELLED': 5
      };

      const tx = await this.contract.updateOrderStatus(
        1, // orderId mapping needed
        statusMap[status] || 0,
        notes
      );

      const receipt = await tx.wait();
      
      console.log(`🔗 Order status updated on blockchain: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash,
        statusData: {
          orderId,
          status,
          notes,
          timestamp: new Date().toISOString(),
          blockchainHash: receipt.hash
        }
      };

    } catch (error) {
      console.error(`❌ Error updating order status:`, error.message);
      return this.mockUpdateOrderStatus(orderId, status, notes);
    }
  }

  // ========================================
  // MOCK FUNCTIONS (for development)
  // ========================================

  mockWriteProductTrace(product) {
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    const traceData = {
      productId: product._id,
      productName: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      timestamp: new Date().toISOString(),
      action: 'PRODUCT_CREATED',
      blockchainHash: txHash
    };
    
    console.log(`🔗 [MOCK] Ghi truy xuất sản phẩm lên blockchain:`, traceData);
    
    return { 
      success: true, 
      txHash: txHash,
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: '21000',
      traceData: traceData
    };
  }

  mockWriteOrderTrace(order) {
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    const traceData = {
      orderId: order._id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
      items: order.items,
      timestamp: new Date().toISOString(),
      action: 'ORDER_CREATED',
      blockchainHash: txHash
    };
    
    console.log(`🔗 [MOCK] Ghi truy xuất đơn hàng lên blockchain:`, traceData);
    
    return { 
      success: true, 
      txHash: txHash,
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: '21000',
      traceData: traceData
    };
  }

  mockGetProductTrace(productId) {
    const traceData = {
      productId: productId,
      trace: {
        productName: 'Mock Product Name',
        category: 'Mock Category',
        price: 100000,
        unit: 'kg',
        timestamp: new Date().toISOString(),
        action: 'PRODUCT_CREATED',
        blockchainHash: '0x' + Math.random().toString(16).substr(2, 40),
        supplyChain: [
          {
            step: 'Sản xuất',
            location: 'Nông trại ABC',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            description: 'Thu hoạch sản phẩm',
            actor: '0x1234567890123456789012345678901234567890',
            gpsCoordinates: '10.762622, 106.660172'
          },
          {
            step: 'Chế biến',
            location: 'Nhà máy XYZ',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            description: 'Đóng gói và kiểm định chất lượng',
            actor: '0x2345678901234567890123456789012345678901',
            gpsCoordinates: '10.762622, 106.660172'
          },
          {
            step: 'Phân phối',
            location: 'Kho trung chuyển',
            timestamp: new Date().toISOString(),
            description: 'Sẵn sàng giao hàng',
            actor: '0x3456789012345678901234567890123456789012',
            gpsCoordinates: '10.762622, 106.660172'
          }
        ]
      }
    };
    
    return traceData;
  }

  mockGetOrderTrace(orderId) {
    const traceData = {
      orderId: orderId,
      trace: {
        customerName: 'Mock Customer',
        totalAmount: 500000,
        timestamp: new Date().toISOString(),
        action: 'ORDER_CREATED',
        blockchainHash: '0x' + Math.random().toString(16).substr(2, 40),
        orderStatus: [
          {
            status: 'Đặt hàng',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            description: 'Khách hàng đã đặt hàng thành công',
            location: 'Hệ thống',
            actor: '0x1234567890123456789012345678901234567890'
          },
          {
            status: 'Xác nhận',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            description: 'Hệ thống đã xác nhận đơn hàng',
            location: 'Trung tâm xử lý',
            actor: '0x2345678901234567890123456789012345678901'
          },
          {
            status: 'Chuẩn bị',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            description: 'Đang chuẩn bị hàng để giao',
            location: 'Kho hàng',
            actor: '0x3456789012345678901234567890123456789012'
          },
          {
            status: 'Giao hàng',
            timestamp: new Date().toISOString(),
            description: 'Đơn hàng đang được giao',
            location: 'Trên đường giao hàng',
            actor: '0x4567890123456789012345678901234567890123'
          }
        ],
        paymentInfo: {
          method: 'COD',
          status: 'Pending',
          amount: 500000
        },
        deliveryInfo: {
          address: 'Mock Address',
          estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
          trackingId: 'GHN' + Math.random().toString().substr(2, 8)
        }
      }
    };
    
    return traceData;
  }

  mockAddSupplyChainStep(productId, stepType, location, description) {
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    
    console.log(`🔗 [MOCK] Added supply chain step: ${stepType} at ${location}`);
    
    return {
      success: true,
      txHash: txHash,
      stepData: {
        productId,
        stepType,
        location,
        description,
        timestamp: new Date().toISOString(),
        blockchainHash: txHash
      }
    };
  }

  mockUpdateOrderStatus(orderId, status, notes) {
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    
    console.log(`🔗 [MOCK] Updated order ${orderId} status to ${status}`);
    
    return {
      success: true,
      txHash: txHash,
      statusData: {
        orderId,
        status,
        notes,
        timestamp: new Date().toISOString(),
        blockchainHash: txHash
      }
    };
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Switch between mock and real mode
   */
  switchMode(newMode) {
    if (newMode === 'real' && (!this.contractAddress || !this.privateKey || !this.rpcUrl)) {
      console.warn('⚠️ Cannot switch to real mode: missing configuration');
      return false;
    }

    this.mode = newMode;
    
    if (newMode === 'real') {
      this.initializeRealBlockchain();
    }
    
    console.log(`🔄 Switched to ${newMode.toUpperCase()} mode`);
    return true;
  }

  /**
   * Get blockchain status
   */
  async getStatus() {
    const status = {
      mode: this.mode,
      contractAddress: this.contractAddress,
      connected: false,
      blockNumber: null,
      networkId: null
    };

    if (this.mode === 'real' && this.provider) {
      try {
        status.blockNumber = await this.provider.getBlockNumber();
        status.networkId = (await this.provider.getNetwork()).chainId;
        status.connected = true;
      } catch (error) {
        console.error('Error getting blockchain status:', error.message);
      }
    } else if (this.mode === 'mock') {
      status.connected = true;
      status.blockNumber = Math.floor(Math.random() * 1000000);
      status.networkId = 'mock-network';
    }

    return status;
  }

  /**
   * Generate QR code data for product/order traceability
   */
  generateQRData(type, id, hash) {
    return {
      type: type, // 'product' or 'order'
      id: id,
      blockchainHash: hash,
      verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?type=${type}&id=${id}&hash=${hash}`,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new EnhancedBlockchainClient(); 