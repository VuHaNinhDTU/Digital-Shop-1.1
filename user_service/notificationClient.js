class NotificationClient {
  async sendAccountNotification(userId, type) {
    // Gửi thông báo tài khoản (mock)
    return { success: true, message: `Notified user ${userId} about ${type}` };
  }
}

module.exports = new NotificationClient(); 