const service = require('./orderService');

class OrderController {
  async create(req, res) {
    const result = await service.createOrder(req.body);
    if (result.errors) return res.status(400).json({ success: false, errors: result.errors });
    res.status(201).json({ success: true, data: result.order });
  }
  async getById(req, res) {
    const order = await service.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  }
  async getAll(req, res) {
    const orders = await service.getAllOrders();
    res.json({ success: true, data: orders });
  }
  async update(req, res) {
    const order = await service.updateOrder(req.params.id, req.body);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  }
  async delete(req, res) {
    const order = await service.deleteOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  }
  async getTrace(req, res) {
    const trace = await service.getOrderTrace(req.params.id);
    if (!trace) return res.status(404).json({ success: false, message: 'Trace not found' });
    res.json({ success: true, data: trace });
  }
}

module.exports = new OrderController(); 