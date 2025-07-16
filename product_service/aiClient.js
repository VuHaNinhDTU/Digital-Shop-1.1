class AIClient {
  async forecastDemand(productMeta) {
    // Gửi metadata sản phẩm đến AI Engine và nhận dự báo (mock)
    return { demand: Math.floor(Math.random() * 1000), confidence: 0.9 };
  }
  async recommendProducts(userId) {
    // Gợi ý sản phẩm cho user dựa trên lịch sử (mock)
    return [
      { productId: 1, score: 0.95 },
      { productId: 2, score: 0.91 }
    ];
  }
}

module.exports = new AIClient(); 