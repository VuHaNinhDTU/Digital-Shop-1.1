# Chợ Nông Sản Số - E-commerce Blockchain Platform

## 📋 Tổng quan

Hệ thống e-commerce nông sản với tính năng truy xuất nguồn gốc blockchain, được xây dựng theo kiến trúc microservice với frontend hiện đại và backend RESTful API.

## 🏗️ Kiến trúc hệ thống

```
cho-nong-san-so/
├── frontend/                 # Giao diện người dùng
├── product_service/         # Microservice quản lý sản phẩm
├── order_service/           # Microservice quản lý đơn hàng  
├── user_service/            # Microservice quản lý người dùng
├── shared/                  # Thư viện dùng chung
├── contracts/              # Smart contracts blockchain
└── uploads/                # Thư mục lưu ảnh sản phẩm
```

## 🚀 Tính năng chính

### 1. **Quản lý người dùng**
- ✅ Đăng ký tài khoản
- ✅ Đăng nhập/Đăng xuất
- ✅ Cập nhật thông tin cá nhân
- ✅ Quản lý danh sách người dùng

### 2. **Quản lý sản phẩm**
- ✅ Đăng bán sản phẩm mới
- ✅ Upload nhiều ảnh sản phẩm (tối đa 5 ảnh)
- ✅ Chỉnh sửa/Xóa sản phẩm
- ✅ Tìm kiếm và lọc theo danh mục
- ✅ Hiển thị sản phẩm dạng grid responsive

### 3. **Đặt hàng & Thanh toán**
- ✅ Đặt hàng sản phẩm
- ✅ Chọn ngày giao hàng
- ✅ Tính tổng tiền động
- ✅ Theo dõi trạng thái đơn hàng
- ✅ Mock thanh toán (VNPay, COD)

### 4. **🔗 Truy xuất nguồn gốc Blockchain** ⭐
- ✅ **Ghi nhận sản phẩm lên blockchain** khi tạo sản phẩm mới
- ✅ **Ghi nhận đơn hàng lên blockchain** khi đặt hàng
- ✅ **Xem thông tin truy xuất nguồn gốc** chi tiết
- ✅ **Chuỗi cung ứng** từ sản xuất đến phân phối
- ✅ **Trạng thái đơn hàng** theo thời gian thực
- ✅ **Transaction hash** để verify trên blockchain

### 5. **AI & Analytics**
- ✅ AI gợi ý sản phẩm
- ✅ Dự báo nhu cầu
- ✅ Thống kê bán hàng

### 6. **Tích hợp & Thông báo**
- ✅ Mock logistics (Giao hàng nhanh)
- ✅ Mock cloud storage
- ✅ Hệ thống thông báo

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js**
- **MongoDB** (Mongoose ODM)
- **Multer** (Upload file)
- **CORS** (Cross-origin)

### Frontend  
- **HTML5** + **CSS3** + **JavaScript**
- **Font Awesome** (Icons)
- **Responsive Design**

### Blockchain
- **Smart Contract** (Solidity)
- **Mock Blockchain Client** (Local)
- **Transaction Hash** generation

## 📦 Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình MongoDB
```bash
# Tạo file .env trong mỗi service
MONGODB_URI=mongodb://localhost:27017/cho-nong-san-so
```

### 3. Chạy các services

#### Terminal 1 - Product Service (Port 3001)
```bash
cd product_service
npm start
```

#### Terminal 2 - Order Service (Port 3004)  
```bash
cd order_service
npm start
```

#### Terminal 3 - User Service (Port 3002)
```bash
cd user_service
npm start
```

### 4. Mở frontend
```bash
# Mở file frontend/index.html trong browser
# Hoặc dùng live server
```

## 🔗 API Endpoints

### Product Service (Port 3001)
```
POST   /api/products          # Tạo sản phẩm + ghi blockchain
GET    /api/products          # Lấy danh sách sản phẩm
GET    /api/products/:id      # Lấy chi tiết sản phẩm
GET    /api/products/:id/trace # Truy xuất nguồn gốc sản phẩm
PUT    /api/products/:id      # Cập nhật sản phẩm
DELETE /api/products/:id      # Xóa sản phẩm
```

### Order Service (Port 3004)
```
POST   /api/orders            # Tạo đơn hàng + ghi blockchain
GET    /api/orders            # Lấy danh sách đơn hàng
GET    /api/orders/:id        # Lấy chi tiết đơn hàng
GET    /api/orders/:id/trace  # Truy xuất nguồn gốc đơn hàng
PUT    /api/orders/:id        # Cập nhật đơn hàng
DELETE /api/orders/:id        # Xóa đơn hàng
```

### User Service (Port 3002)
```
POST   /api/users/register    # Đăng ký
POST   /api/users/login       # Đăng nhập
GET    /api/users             # Lấy danh sách user
GET    /api/users/:id         # Lấy chi tiết user
PUT    /api/users/:id         # Cập nhật user
DELETE /api/users/:id         # Xóa user
```

## 🔗 Tính năng Blockchain

### 1. **Ghi nhận sản phẩm lên blockchain**
```javascript
// Khi tạo sản phẩm mới
const blockchainResult = await blockchainClient.writeProductTrace(product);
if (blockchainResult.success) {
  await repo.update(product._id, { blockchainHash: blockchainResult.txHash });
}
```

### 2. **Ghi nhận đơn hàng lên blockchain**
```javascript
// Khi tạo đơn hàng mới
const blockchainResult = await blockchainClient.writeOrderTrace(order);
if (blockchainResult.success) {
  await repo.update(order._id, { blockchainHash: blockchainResult.txHash });
}
```

### 3. **Truy xuất nguồn gốc**
- **Sản phẩm:** Chuỗi cung ứng từ sản xuất → chế biến → phân phối
- **Đơn hàng:** Trạng thái từ đặt hàng → xác nhận → chuẩn bị → giao hàng

## 📱 Giao diện người dùng

### Trang chủ
- Hiển thị sản phẩm dạng grid
- Sidebar danh mục sản phẩm
- Tìm kiếm và lọc

### Trang sản phẩm
- Nút "Đặt hàng" và "Truy xuất nguồn gốc"
- Modal hiển thị thông tin blockchain
- Chuỗi cung ứng chi tiết

### Trang đơn hàng
- Form đặt hàng với validation
- Bảng danh sách đơn hàng
- Nút truy xuất nguồn gốc cho từng đơn

## 🔒 Bảo mật & Validation

- **Input validation** cho tất cả form
- **File upload validation** (chỉ ảnh, max 5MB)
- **Error handling** toàn diện
- **CORS** configuration

## 📊 Database Schema

### Product
```javascript
{
  name: String,
  price: Number,
  category: String,
  description: String,
  unit: String,
  imageUrls: [String],
  blockchainHash: String,  // Transaction hash
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  orderDate: Date,
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  items: [{
    productId: ObjectId,
    quantity: Number,
    price: Number,
    unit: String
  }],
  totalAmount: Number,
  status: String,
  deliveryDate: Date,
  blockchainHash: String,  // Transaction hash
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Local Development
```bash
# Chạy MongoDB
mongod

# Chạy các services
npm run dev:product
npm run dev:order  
npm run dev:user
```

### Production
```bash
# Build và deploy
npm run build
npm start
```

## 📝 Changelog

### v1.0.0
- ✅ Hoàn thiện hệ thống e-commerce cơ bản
- ✅ Tích hợp blockchain truy xuất nguồn gốc
- ✅ Upload ảnh sản phẩm
- ✅ Đặt hàng và theo dõi đơn hàng
- ✅ Giao diện responsive

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Email:** contact@cho-nong-san-so.com
- **Website:** https://cho-nong-san-so.com
- **GitHub:** https://github.com/cho-nong-san-so

---

**⭐ Tính năng blockchain là điểm nhấn quan trọng nhất của hệ thống, đảm bảo tính minh bạch và truy xuất nguồn gốc cho toàn bộ chuỗi cung ứng nông sản.**
