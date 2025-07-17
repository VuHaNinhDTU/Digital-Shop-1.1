# 🚀 Hướng dẫn Triển khai Chợ Nông Sản Số

## 📦 Chuẩn bị đóng gói

### 1. Cấu trúc thư mục cần đóng gói
```
cho-nong-san-so/
├── frontend/                 # Giao diện người dùng
├── product_service/         # Microservice quản lý sản phẩm
├── order_service/           # Microservice quản lý đơn hàng  
├── user_service/            # Microservice quản lý người dùng
├── shared/                  # Thư viện dùng chung
├── contracts/              # Smart contracts blockchain
├── uploads/                # Thư mục lưu ảnh sản phẩm
├── package.json            # Dependencies chính
├── package-lock.json       # Lock file
├── README.md               # Hướng dẫn tổng quan
├── DEPLOYMENT_GUIDE.md     # File này
├── start-all.bat           # Script khởi động Windows
├── start-all.sh            # Script khởi động Linux/Mac
└── .env.example            # File cấu hình mẫu
```

## 🛠️ Cài đặt trên máy mới

### Bước 1: Cài đặt Node.js
- Tải và cài đặt Node.js từ: https://nodejs.org/
- Phiên bản khuyến nghị: Node.js 18.x hoặc cao hơn
- Kiểm tra cài đặt: `node --version` và `npm --version`

### Bước 2: Cài đặt MongoDB (Tùy chọn)
- **Cách 1: MongoDB Local**
  - Tải và cài đặt MongoDB từ: https://www.mongodb.com/try/download/community
  - Khởi động MongoDB service

- **Cách 2: MongoDB Atlas (Khuyến nghị cho demo)**
  - Tạo tài khoản tại: https://cloud.mongodb.com/
  - Tạo cluster miễn phí
  - Lấy connection string

### Bước 3: Giải nén và cài đặt dependencies
```bash
# Giải nén file zip
unzip cho-nong-san-so.zip

# Di chuyển vào thư mục dự án
cd cho-nong-san-so

# Cài đặt dependencies
npm install
```

### Bước 4: Cấu hình môi trường
```bash
# Copy file cấu hình mẫu
cp .env.example .env

# Chỉnh sửa file .env với thông tin MongoDB của bạn
```

## 🚀 Khởi động hệ thống

### Cách 1: Sử dụng script tự động (Khuyến nghị)

#### Windows:
```bash
# Chạy file start-all.bat
start-all.bat
```

#### Linux/Mac:
```bash
# Cấp quyền thực thi
chmod +x start-all.sh

# Chạy script
./start-all.sh
```

### Cách 2: Khởi động thủ công

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

### Cách 3: Sử dụng PM2 (Cho production)
```bash
# Cài đặt PM2
npm install -g pm2

# Khởi động tất cả services
pm2 start ecosystem.config.js

# Xem trạng thái
pm2 status

# Xem logs
pm2 logs
```

## 🌐 Truy cập ứng dụng

### Frontend
- Mở file: `frontend/index.html` trong trình duyệt
- Hoặc sử dụng Live Server extension trong VS Code

### API Endpoints
- **Product Service:** http://localhost:3001
- **Order Service:** http://localhost:3004  
- **User Service:** http://localhost:3002

### Test API
- Import file `postman_collection.json` vào Postman
- Hoặc sử dụng file `blockchain-test.postman_collection.json` để test blockchain

## 🔧 Xử lý sự cố

### Lỗi Port đã được sử dụng
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Lỗi MongoDB connection
- Kiểm tra MongoDB đã khởi động chưa
- Kiểm tra connection string trong file .env
- Thử kết nối MongoDB Atlas thay vì local

### Lỗi Dependencies
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
rm package-lock.json
npm install
```

## 📋 Checklist triển khai

- [ ] Cài đặt Node.js
- [ ] Cài đặt MongoDB (hoặc có connection string Atlas)
- [ ] Giải nén dự án
- [ ] Chạy `npm install`
- [ ] Cấu hình file .env
- [ ] Khởi động các services
- [ ] Kiểm tra frontend hoạt động
- [ ] Test API endpoints
- [ ] Demo tính năng blockchain

## 🎯 Demo Checklist

### Tính năng cơ bản
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập
- [ ] Xem danh sách sản phẩm
- [ ] Thêm sản phẩm vào giỏ hàng
- [ ] Đặt hàng

### Tính năng Blockchain ⭐
- [ ] Tạo sản phẩm mới → Ghi blockchain
- [ ] Đặt hàng → Ghi blockchain  
- [ ] Xem truy xuất nguồn gốc sản phẩm
- [ ] Xem truy xuất nguồn gốc đơn hàng
- [ ] Hiển thị transaction hash

### Tính năng nâng cao
- [ ] Upload ảnh sản phẩm
- [ ] Tìm kiếm và lọc sản phẩm
- [ ] Theo dõi trạng thái đơn hàng
- [ ] AI gợi ý sản phẩm

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Logs của từng service
2. Console của trình duyệt
3. Network tab trong Developer Tools
4. File README.md để biết thêm chi tiết

---

**Lưu ý:** Đây là phiên bản demo với mock blockchain. Trong môi trường production thực tế, cần tích hợp với blockchain network thật như Ethereum, BSC, hoặc Polygon. 