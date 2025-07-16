const Order = require('./orderModel');

class OrderRepository {
  async create(orderData) {
    const order = new Order(orderData);
    await order.save();
    return order;
  }
  async findById(id) {
    return Order.findById(id);
  }
  async findAll() {
    return Order.find();
  }
  async update(id, updateData) {
    return Order.findByIdAndUpdate(id, updateData, { new: true });
  }
  async delete(id) {
    return Order.findByIdAndDelete(id);
  }
}

module.exports = new OrderRepository(); 