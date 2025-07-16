class AuthClient {
  async verifyCredentials(username, password) {
    // Xác thực thông tin đăng nhập với hệ thống ngoài (mock)
    return { valid: true, userId: 1, role: 'user' };
  }
  async generateToken(user) {
    // Sinh JWT token (mock)
    return { token: 'mock-jwt-token', expiresIn: 3600 };
  }
}

module.exports = new AuthClient(); 