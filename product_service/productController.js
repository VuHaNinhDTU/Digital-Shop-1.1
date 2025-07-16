const service = require('./productService');

class ProductController {
  async create(req, res) {
    const result = await service.createProduct(req.body);
    if (result.errors) return res.status(400).json({ success: false, errors: result.errors });
    res.status(201).json({ success: true, data: result.product });
  }
  async getById(req, res) {
    const product = await service.getProduct(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: product });
  }
  async getAll(req, res) {
    const products = await service.getAllProducts(req.query);
    res.json({ success: true, data: products });
  }
  async update(req, res) {
    const product = await service.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: product });
  }
  async delete(req, res) {
    const product = await service.deleteProduct(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: product });
  }
  async getTrace(req, res) {
    const trace = await service.getProductTrace(req.params.id);
    if (!trace) return res.status(404).json({ success: false, message: 'Trace not found' });
    res.json({ success: true, data: trace });
  }
}

module.exports = new ProductController(); 