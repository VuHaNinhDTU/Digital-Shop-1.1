const repo = require('./orderRepo');
const blockchainClient = require('./blockchainClient');

class OrderService {
  validateOrderData(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      errors.push('No data provided');
      return errors;
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) errors.push('Order must have items');
    if (!data.customerName) errors.push('Customer name required');
    if (!data.customerPhone) errors.push('Customer phone required');
    if (!data.customerAddress) errors.push('Customer address required');
    if (!data.totalAmount || isNaN(data.totalAmount)) errors.push('Invalid total amount');
    return errors;
  }
  async createOrder(data) {
    console.log('📝 Creating order with data:', data);
    const errors = this.validateOrderData(data);
    if (errors.length) return { errors };
    
    // Tạo đơn hàng trong DB
    console.log('💾 Saving order to database...');
    const order = await repo.create(data);
    console.log('✅ Order saved to database:', order._id);
    
    // Ghi nhận truy xuất đơn hàng lên blockchain
    try {
      const blockchainResult = await blockchainClient.writeOrderTrace(order);
      if (blockchainResult.success) {
        // Cập nhật blockchainHash vào đơn hàng
        await repo.update(order._id, { blockchainHash: blockchainResult.txHash });
        console.log(`✅ Đã ghi truy xuất đơn hàng ${order._id} lên blockchain: ${blockchainResult.txHash}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi ghi blockchain cho đơn hàng ${order._id}:`, error.message);
      // Vẫn trả về đơn hàng đã tạo dù blockchain lỗi
    }
    
    return { order };
  }
  async getOrder(id) {
    return repo.findById(id);
  }
  async getAllOrders() {
    return repo.findAll();
  }
  async updateOrder(id, data) {
    console.log(`📝 Updating order ${id} with data:`, data);
    const result = await repo.update(id, data);
    console.log('✅ Order updated:', result?._id);
    return result;
  }
  async deleteOrder(id) {
    console.log(`🗑️ Deleting order ${id}`);
    const result = await repo.delete(id);
    console.log('✅ Order deleted:', result?._id);
    return result;
  }
  async getOrderTrace(orderId) {
    try {
      const trace = await blockchainClient.getOrderTrace(orderId);
      return trace;
    } catch (error) {
      console.error(`❌ Lỗi lấy truy xuất đơn hàng ${orderId}:`, error.message);
      return null;
    }
  }
}

module.exports = new OrderService(); 