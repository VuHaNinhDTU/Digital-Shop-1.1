class LogisticsClient {
  async createShipment(order) {
    // Tạo vận đơn giao hàng (mock)
    return { trackingId: 'GHN' + order.id, carrier: 'GHN', status: 'in_transit' };
  }
  async getShipmentStatus(trackingId) {
    // Lấy trạng thái vận chuyển (mock)
    return { trackingId, status: 'delivered' };
  }
}

module.exports = new LogisticsClient(); 