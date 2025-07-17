# ⚡ KHỞI ĐỘNG NHANH - CHỢ NÔNG SẢN SỐ

## 🎯 Demo Checklist

### ✅ Tính năng cơ bản
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập
- [ ] Xem danh sách sản phẩm
- [ ] Thêm sản phẩm vào giỏ hàng
- [ ] Đặt hàng

### ⭐ Tính năng Blockchain (Điểm nhấn demo)
- [ ] Tạo sản phẩm mới → Ghi blockchain
- [ ] Đặt hàng → Ghi blockchain  
- [ ] Xem truy xuất nguồn gốc sản phẩm
- [ ] Xem truy xuất nguồn gốc đơn hàng
- [ ] Hiển thị transaction hash

### 🚀 Tính năng nâng cao
- [ ] Upload ảnh sản phẩm
- [ ] Tìm kiếm và lọc sản phẩm
- [ ] Theo dõi trạng thái đơn hàng
- [ ] AI gợi ý sản phẩm

## 🚀 Khởi động nhanh (3 bước)

### Bước 1: Cài đặt
```bash
# Cài đặt Node.js (nếu chưa có)
# Tải từ: https://nodejs.org/

# Giải nén và cài dependencies
npm install
```

### Bước 2: Cấu hình MongoDB
```bash
# Copy file cấu hình
cp env.example .env

# Chỉnh sửa MONGODB_URI trong file .env
# Có thể dùng MongoDB Atlas (miễn phí) hoặc local
```

### Bước 3: Khởi động
```bash
# Windows
start-all.bat

# Linux/Mac
chmod +x start-all.sh
./start-all.sh
```

## 🌐 Truy cập ứng dụng

1. **Frontend:** Mở `frontend/index.html` trong trình duyệt
2. **API Test:** Import `postman_collection.json` vào Postman
3. **Blockchain Test:** Import `blockchain-test.postman_collection.json`

## 📱 Demo Flow

### 1. Đăng ký & Đăng nhập
- Mở frontend → Đăng ký tài khoản mới
- Đăng nhập với tài khoản vừa tạo

### 2. Quản lý sản phẩm
- Tạo sản phẩm mới với ảnh
- Xem danh sách sản phẩm
- **Demo blockchain:** Xem transaction hash khi tạo sản phẩm

### 3. Đặt hàng
- Thêm sản phẩm vào giỏ hàng
- Đặt hàng với thông tin giao hàng
- **Demo blockchain:** Xem transaction hash khi đặt hàng

### 4. Truy xuất nguồn gốc ⭐
- Click "Truy xuất nguồn gốc" trên sản phẩm
- Xem chuỗi cung ứng chi tiết
- Click "Truy xuất nguồn gốc" trên đơn hàng
- Xem trạng thái đơn hàng theo thời gian

## 🔧 Xử lý sự cố nhanh

### Lỗi Port đã sử dụng
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Lỗi MongoDB
- Kiểm tra MongoDB đã khởi động
- Thử dùng MongoDB Atlas thay vì local
- Kiểm tra connection string trong .env

### Lỗi Dependencies
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## 📞 Hỗ trợ khẩn cấp

1. **Logs:** Kiểm tra terminal của từng service
2. **Console:** F12 → Console trong trình duyệt
3. **Network:** F12 → Network tab
4. **File cấu hình:** Kiểm tra .env file

---

**💡 Tip:** Để demo mượt mà, hãy chuẩn bị sẵn:
- Ảnh sản phẩm để upload
- Thông tin địa chỉ giao hàng
- MongoDB connection string

**🎯 Điểm nhấn demo:** Tính năng blockchain truy xuất nguồn gốc là điểm khác biệt chính của hệ thống! 