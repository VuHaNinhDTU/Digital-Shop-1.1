class BlockchainClient {
  async writeOrderTrace(order) {
    // Ghi thông tin đơn hàng lên blockchain (mock)
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
    
    console.log(`🔗 Ghi truy xuất đơn hàng lên blockchain:`, traceData);
    
    return { 
      success: true, 
      txHash: txHash,
      traceData: traceData
    };
  }
  
  async getOrderTrace(orderId) {
    // Lấy thông tin truy xuất đơn hàng từ blockchain (mock)
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
            description: 'Khách hàng đã đặt hàng thành công'
          },
          {
            status: 'Xác nhận',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            description: 'Hệ thống đã xác nhận đơn hàng'
          },
          {
            status: 'Chuẩn bị',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            description: 'Đang chuẩn bị hàng để giao'
          },
          {
            status: 'Giao hàng',
            timestamp: new Date().toISOString(),
            description: 'Đơn hàng đang được giao'
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
}

module.exports = new BlockchainClient(); 