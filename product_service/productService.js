const repo = require('./productRepo');
const blockchainClient = require('./blockchainClient');

class ProductService {
  validateProductData(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      errors.push('No data provided');
      return errors;
    }
    if (!data.name || data.name.length < 2) errors.push('Name too short');
    if (!data.price || isNaN(data.price)) errors.push('Invalid price');
    if (!data.category) errors.push('Category required');
    return errors;
  }
  async createProduct(data) {
    const errors = this.validateProductData(data);
    if (errors.length) return { errors };
    
    // Tạo sản phẩm trong DB
    const product = await repo.create(data);
    
    // Ghi nhận truy xuất nguồn gốc lên blockchain
    try {
      const blockchainResult = await blockchainClient.writeProductTrace(product);
      if (blockchainResult.success) {
        // Cập nhật blockchainHash vào sản phẩm
        await repo.update(product._id, { blockchainHash: blockchainResult.txHash });
        console.log(`✅ Đã ghi truy xuất nguồn gốc sản phẩm ${product._id} lên blockchain: ${blockchainResult.txHash}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi ghi blockchain cho sản phẩm ${product._id}:`, error.message);
      // Vẫn trả về sản phẩm đã tạo dù blockchain lỗi
    }
    
    return { product };
  }
  async getProduct(id) {
    return repo.findById(id);
  }
  async getAllProducts(filters) {
    return repo.findAll(filters);
  }
  async updateProduct(id, data) {
    return repo.update(id, data);
  }
  async deleteProduct(id) {
    return repo.delete(id);
  }
  async getProductTrace(productId) {
    try {
      const trace = await blockchainClient.getProductTrace(productId);
      return trace;
    } catch (error) {
      console.error(`❌ Lỗi lấy truy xuất nguồn gốc sản phẩm ${productId}:`, error.message);
      return null;
    }
  }
}

module.exports = new ProductService(); 