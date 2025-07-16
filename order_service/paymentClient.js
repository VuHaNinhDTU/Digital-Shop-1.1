class PaymentClient {
  async createPayment(order) {
    // Gửi yêu cầu thanh toán đến VNPay (mock)
    return { paymentUrl: 'https://mock-vnpay/payment/' + order.id, status: 'pending' };
  }
  async verifyPayment(paymentId) {
    // Xác minh trạng thái thanh toán (mock)
    return { paymentId, status: 'success' };
  }
}

module.exports = new PaymentClient(); 