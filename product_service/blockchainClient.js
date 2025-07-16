class BlockchainClient {
  async writeProductTrace(product) {
    // Ghi thông tin truy xuất sản phẩm lên blockchain (mock)
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
    
    console.log(`🔗 Ghi truy xuất sản phẩm lên blockchain:`, traceData);
    
    return { 
      success: true, 
      txHash: txHash,
      traceData: traceData
    };
  }
  
  async getProductTrace(productId) {
    // Lấy thông tin truy xuất sản phẩm từ blockchain (mock)
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
            description: 'Thu hoạch sản phẩm'
          },
          {
            step: 'Chế biến',
            location: 'Nhà máy XYZ',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            description: 'Đóng gói và kiểm định chất lượng'
          },
          {
            step: 'Phân phối',
            location: 'Kho trung chuyển',
            timestamp: new Date().toISOString(),
            description: 'Sẵn sàng giao hàng'
          }
        ]
      }
    };
    
    return traceData;
  }
}

module.exports = new BlockchainClient(); 