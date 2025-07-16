@echo off
echo ========================================
echo    CHỢ NÔNG SẢN SỐ - STARTUP SCRIPT
echo ========================================
echo.

echo [1/4] Kiểm tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chưa được cài đặt!
    echo Vui lòng tải và cài đặt Node.js từ: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js đã được cài đặt

echo.
echo [2/4] Kiểm tra dependencies...
if not exist "node_modules" (
    echo 📦 Cài đặt dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Lỗi cài đặt dependencies!
        pause
        exit /b 1
    )
)
echo ✅ Dependencies đã sẵn sàng

echo.
echo [3/4] Kiểm tra file cấu hình...
if not exist ".env" (
    echo 📝 Tạo file cấu hình từ mẫu...
    copy "env.example" ".env" >nul
    echo ⚠️  Vui lòng chỉnh sửa file .env với thông tin MongoDB của bạn
    echo.
)

echo.
echo [4/4] Khởi động các services...
echo.

echo 🚀 Khởi động API Gateway (Port 3000)...
start "API Gateway" cmd /k "cd api-gateway && node index.js"

echo ⏳ Chờ API Gateway khởi động...
timeout /t 3 /nobreak >nul

echo 🚀 Khởi động Product Service (Port 3001)...
start "Product Service" cmd /k "cd product_service && node index.js"

echo 🚀 Khởi động Order Service (Port 3004)...
start "Order Service" cmd /k "cd order_service && node index.js"

echo 🚀 Khởi động User Service (Port 3002)...
start "User Service" cmd /k "cd user_service && node index.js"

echo.
echo ========================================
echo ✅ Tất cả services đã được khởi động!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔗 API Gateway: http://localhost:3000
echo 📊 Product API: http://localhost:3001
echo 📦 Order API: http://localhost:3004
echo 👤 User API: http://localhost:3002
echo.
echo 💡 Để dừng tất cả services, đóng các cửa sổ terminal
echo.
pause 