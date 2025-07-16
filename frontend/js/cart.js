// Shopping Cart Management System
// CHỢ NÔNG SẢN SỐ - Cart Functionality

class ShoppingCart {
  constructor() {
    this.items = this.loadCart();
    this.updateCartUI();
  }

  // Load cart from localStorage
  loadCart() {
    try {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  // Save cart to localStorage
  saveCart() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.items));
      this.updateCartUI();
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  // Add item to cart
  addItem(product, quantity = 1) {
    console.log('🛒 DEBUG: Adding item to cart:', product);
    
    const existingIndex = this.items.findIndex(item => item.id === product._id);
    
    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
      console.log('🛒 DEBUG: Updated existing item quantity:', this.items[existingIndex]);
    } else {
      const newItem = {
        id: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit || '',
        image: product.imageUrls && product.imageUrls.length > 0 ? 
          ('http://localhost:3001' + product.imageUrls[0]) : 
          'https://via.placeholder.com/120x120?text=No+Image',
        quantity: quantity,
        addedAt: new Date().toISOString()
      };
      this.items.push(newItem);
      console.log('🛒 DEBUG: Added new item:', newItem);
    }
    
    console.log('🛒 DEBUG: Total items in cart:', this.items.length);
    console.log('🛒 DEBUG: Cart contents:', this.items);
    
    this.saveCart();
    this.showCartNotification(`Đã thêm "${product.name}" vào giỏ hàng`);
    return true;
  }

  // Remove item from cart
  removeItem(productId) {
    const index = this.items.findIndex(item => item.id === productId);
    if (index > -1) {
      const removedItem = this.items.splice(index, 1)[0];
      this.saveCart();
      this.showCartNotification(`Đã xóa "${removedItem.name}" khỏi giỏ hàng`);
      return true;
    }
    return false;
  }

  // Update item quantity
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(productId);
      }
      item.quantity = parseInt(quantity);
      this.saveCart();
      return true;
    }
    return false;
  }

  // Get cart total
  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get total items count
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Clear cart
  clearCart() {
    this.items = [];
    this.saveCart();
    this.showCartNotification('Đã xóa tất cả sản phẩm khỏi giỏ hàng');
  }

  // Update cart UI elements
  updateCartUI() {
    const cartCount = this.getTotalItems();
    
    // Update cart badge
    const cartBadges = document.querySelectorAll('.cart-badge');
    cartBadges.forEach(badge => {
      badge.textContent = cartCount;
      badge.style.display = cartCount > 0 ? 'flex' : 'none';
    });

    // Update cart links and ensure they work
    const cartLinks = document.querySelectorAll('.cart-link, a[href*="cart"]');
    cartLinks.forEach(link => {
      const icon = link.querySelector('i');
      if (icon && icon.classList.contains('fa-shopping-cart')) {
        // Ensure cart badge exists for this link
        if (!link.querySelector('.cart-badge')) {
          const badge = document.createElement('span');
          badge.className = 'cart-badge';
          badge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: #dc3545;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            z-index: 10;
          `;
          link.style.position = 'relative';
          link.appendChild(badge);
        }
        
        // Update badge
        const badge = link.querySelector('.cart-badge');
        if (badge) {
          badge.textContent = cartCount;
          badge.style.display = cartCount > 0 ? 'flex' : 'none';
        }
      }
    });

    // Debug logging
    console.log('🛒 Cart updated:', cartCount, 'items');
  }

  // Show cart notification
  showCartNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--main-green);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
      ">
        <i class="fa fa-check-circle" style="margin-right: 8px;"></i>
        ${message}
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      const notifDiv = notification.querySelector('div');
      notifDiv.style.opacity = '1';
      notifDiv.style.transform = 'translateY(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      const notifDiv = notification.querySelector('div');
      notifDiv.style.opacity = '0';
      notifDiv.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Render cart page
  renderCartPage() {
    const cartContent = document.getElementById('cart-content');
    if (!cartContent) return;

    if (this.items.length === 0) {
      cartContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <i class="fa fa-shopping-cart" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
          <h3 style="color: #666; margin-bottom: 10px;">Giỏ hàng của bạn đang trống</h3>
          <p style="color: #999; margin-bottom: 30px;">Hãy thêm một số sản phẩm để bắt đầu mua sắm!</p>
          <a href="/home" class="btn" style="background: var(--main-green); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            <i class="fa fa-arrow-left"></i> Tiếp tục mua sắm
          </a>
        </div>
      `;
      return;
    }

    let cartHTML = `
      <div style="background: white; border-radius: 12px; overflow: hidden;">
        <div style="padding: 20px; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0; color: var(--main-green);">
            <i class="fa fa-shopping-cart"></i> Giỏ hàng của bạn (${this.getTotalItems()} sản phẩm)
          </h3>
        </div>
        <div class="cart-items">
    `;

    this.items.forEach(item => {
      cartHTML += `
        <div class="cart-item" data-product-id="${item.id}" style="
          display: flex;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
          gap: 15px;
        ">
          <img src="${item.image}" 
               alt="${item.name}" 
               style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
          
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${item.name}</h4>
            <p style="margin: 0; color: #666; font-size: 14px;">Đơn giá: ${item.price.toLocaleString('vi-VN')}₫${item.unit ? ' / ' + item.unit : ''}</p>
          </div>
          
          <div style="display: flex; align-items: center; gap: 10px;">
            <button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})" 
                    style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">-</button>
            <input type="number" 
                   value="${item.quantity}" 
                   min="1" 
                   max="99"
                   onchange="cart.updateQuantity('${item.id}', this.value)"
                   style="width: 60px; height: 30px; text-align: center; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})" 
                    style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">+</button>
          </div>
          
          <div style="text-align: right; min-width: 120px;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: var(--main-green); font-size: 16px;">
              ${(item.price * item.quantity).toLocaleString('vi-VN')}₫
            </p>
            <button onclick="cart.removeItem('${item.id}')" 
                    style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              <i class="fa fa-trash"></i> Xóa
            </button>
          </div>
        </div>
      `;
    });

    cartHTML += `
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Tổng cộng: <span style="color: var(--main-green);">${this.getTotal().toLocaleString('vi-VN')}₫</span></h3>
            <button onclick="cart.clearCart()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              <i class="fa fa-trash"></i> Xóa tất cả
            </button>
          </div>
          <div style="display: flex; gap: 15px;">
            <a href="/home" style="flex: 1; background: #6c757d; color: white; padding: 12px; text-align: center; text-decoration: none; border-radius: 6px;">
              <i class="fa fa-arrow-left"></i> Tiếp tục mua sắm
            </a>
            <button onclick="proceedToCheckout()" style="flex: 1; background: var(--main-green); color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-size: 16px;">
              <i class="fa fa-credit-card"></i> Thanh toán
            </button>
          </div>
        </div>
      </div>
    `;

    cartContent.innerHTML = cartHTML;
  }
}

// Initialize cart
let cart;
document.addEventListener('DOMContentLoaded', () => {
  cart = new ShoppingCart();
  
  // Add cart badges to navigation
  addCartBadges();
  
  // If on cart page, render cart
  if (window.location.pathname.includes('cart') || document.getElementById('cart-content')) {
    cart.renderCartPage();
  }
});

// Add cart badges to navigation
function addCartBadges() {
  const cartLinks = document.querySelectorAll('a[href*="cart"], a[href="#"]');
  cartLinks.forEach(link => {
    if (link.querySelector('.fa-shopping-cart')) {
      link.style.position = 'relative';
      link.classList.add('cart-link');
      
      // Add badge
      const badge = document.createElement('span');
      badge.className = 'cart-badge';
      badge.style.cssText = `
        position: absolute;
        top: -5px;
        right: -5px;
        background: #dc3545;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        display: none;
      `;
      
      link.appendChild(badge);
      
      // Make cart links functional
      link.href = 'cart.html';
    }
  });
}

// Proceed to checkout
function proceedToCheckout() {
  if (cart.items.length === 0) {
    alert('Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi thanh toán.');
    return;
  }
  
  // Store cart for checkout
  localStorage.setItem('checkout_cart', JSON.stringify(cart.items));
  
  // Redirect to checkout page
  window.location.href = 'checkout.html';
}

// Global helper functions
function addToCart(productData) {
  console.log('🛒 DEBUG: Global addToCart called with:', productData);
  if (!cart) {
    console.log('🛒 DEBUG: Creating new ShoppingCart instance');
    cart = new ShoppingCart();
  }
  console.log('🛒 DEBUG: Cart instance exists:', !!cart);
  const result = cart.addItem(productData);
  console.log('🛒 DEBUG: AddItem result:', result);
  return result;
}

function getCartTotal() {
  return cart ? cart.getTotal() : 0;
}

function getCartItems() {
  return cart ? cart.items : [];
} 