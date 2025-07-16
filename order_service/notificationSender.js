class NotificationSender {
  async sendOrderStatus(userId, orderId, status) {
    // Gửi thông báo trạng thái đơn hàng (mock)
    return { success: true, message: `Notified user ${userId} about order ${orderId} status: ${status}` };
  }
}

module.exports = new NotificationSender(); 