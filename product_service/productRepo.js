const Product = require('./productModel');

class ProductRepository {
  async create(productData) {
    const product = new Product(productData);
    await product.save();
    return product;
  }
  async findById(id) {
    return Product.findById(id);
  }
  async findAll(filters = {}) {
    const query = {};
    if (filters.category) query.category = filters.category;
    return Product.find(query);
  }
  async update(id, updateData) {
    return Product.findByIdAndUpdate(id, updateData, { new: true });
  }
  async delete(id) {
    return Product.findByIdAndDelete(id);
  }
}

module.exports = new ProductRepository(); 