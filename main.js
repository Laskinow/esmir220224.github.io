/**
 * Joystix Zone - Ana JavaScript Dosyası
 * Tüm sayfalarda ortak kullanılan işlevler
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const cartIcon = document.getElementById('cart-icon');
  const cartPopup = document.getElementById('cart-popup');
  const closeCart = document.getElementById('close-cart');
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartShipping = document.getElementById('cart-shipping');
  const cartDiscount = document.getElementById('cart-discount');
  const clearCartBtn = document.getElementById('clear-cart');
  const viewCartBtn = document.getElementById('view-cart');
  const couponInput = document.getElementById('coupon-code');
  const applyCouponBtn = document.getElementById('apply-coupon');
  const searchInput = document.getElementById('search-input');
  const productCards = document.querySelectorAll('.product-card');
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const categoryToggles = document.querySelectorAll('.main-category');
  
  // Sepet verilerini saklamak için
  let cart = [];
  let couponApplied = false;
  let discountAmount = 0;
  
  // =====================
  // SEPET İŞLEVLERİ
  // =====================
  
  /**
   * LocalStorage'dan sepet verilerini yükler
   */
  function loadCart() {
    try {
      const savedCart = localStorage.getItem('joystixCart');
      if (savedCart) {
        cart = JSON.parse(savedCart);
        
        // Kupon durumunu yükle
        const savedCoupon = localStorage.getItem('joystixCoupon');
        if (savedCoupon) {
          couponApplied = JSON.parse(savedCoupon).applied;
        }
        
        updateCartDisplay();
      }
    } catch (e) {
      console.error('Sepet verisi yüklenirken hata oluştu:', e);
      cart = [];
      updateCartDisplay();
    }
  }
  
  /**
   * Sepet verilerini LocalStorage'a kaydeder
   */
  function saveCart() {
    localStorage.setItem('joystixCart', JSON.stringify(cart));
    localStorage.setItem('joystixCoupon', JSON.stringify({ applied: couponApplied }));
  }
  
  /**
   * Sepet görüntüsünü günceller
   */
  function updateCartDisplay() {
    // Sepet sayısını güncelle
    if (cartCount) {
      cartCount.textContent = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    }
    
    // Sepet boşsa
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    let subtotal = 0;
    
    if (cart.length === 0) {
      cartItems.innerHTML = '<p style="padding: 15px; text-align: center;">Sepetiniz boş</p>';
      
      // Toplam, ara toplam, kargo ve indirim alanlarını güncelle
      if (cartTotal) cartTotal.textContent = formatPrice(0);
      if (cartSubtotal) cartSubtotal.textContent = formatPrice(0);
      if (cartShipping) cartShipping.textContent = formatPrice(0);
      if (cartDiscount) cartDiscount.textContent = formatPrice(0);
      
      return;
    }
    
    // Sepet öğelerini oluştur
    cart.forEach((item, index) => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      
      // Gelişmiş sepet görünümü (miktar kontrolü ile)
      if (document.querySelector('.cart-summary')) {
        cartItem.innerHTML = `
          <img src="${item.image}" alt="${item.title}" class="cart-item-image">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
            <div class="cart-item-quantity">
              <button class="quantity-btn minus" data-index="${index}">-</button>
              <span class="quantity">${item.quantity || 1}</span>
              <button class="quantity-btn plus" data-index="${index}">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-index="${index}">✕</button>
        `;
      } else {
        // Basit sepet görünümü
        cartItem.innerHTML = `
          <img src="${item.image}" alt="${item.title}" class="cart-item-image">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
          </div>
          <button class="cart-item-remove" data-index="${index}">✕</button>
        `;
      }
      
      cartItems.appendChild(cartItem);
      
      // Ürün fiyatını toplama ekle (miktar ile çarparak)
      subtotal += item.price * (item.quantity || 1);
    });
    
    // Sepet öğesi silme butonları için olay dinleyicileri
    document.querySelectorAll('.cart-item-remove').forEach(button => {
      button.addEventListener('click', function() {
        removeFromCart(parseInt(this.getAttribute('data-index')));
      });
    });
    
    // Miktar butonları için olay dinleyicileri
    document.querySelectorAll('.quantity-btn.minus').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (cart[index].quantity > 1) {
          cart[index].quantity--;
          saveCart();
          updateCartDisplay();
        }
      });
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        cart[index].quantity = (cart[index].quantity || 1) + 1;
        saveCart();
        updateCartDisplay();
      });
    });
    
    // Kargo ücreti hesaplama
    let shippingCost = subtotal > 5000 ? 0 : 49.90;
    
    // İndirim hesaplama
    if (couponApplied) {
      discountAmount = subtotal * 0.1; // %10 indirim
    } else {
      discountAmount = 0;
    }
    
    // Toplam hesaplama
    const total = subtotal + shippingCost - discountAmount;
    
    // Toplam alanını güncelle (basit sepet görünümü için)
    if (cartTotal) {
      cartTotal.textContent = formatPrice(total);
    }
    
    // Gelişmiş sepet görünümü için diğer alanları güncelle
    if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
    if (cartShipping) cartShipping.textContent = shippingCost === 0 ? 'Ücretsiz' : formatPrice(shippingCost);
    if (cartDiscount) cartDiscount.textContent = formatPrice(discountAmount);
  }
  
  /**
   * Fiyatı formatlar
   * @param {number} price - Formatlanacak fiyat
   * @returns {string} Formatlanmış fiyat
   */
  function formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);
  }
  
  /**
   * Sepete ürün ekler
   * @param {Object} product - Eklenecek ürün
   */
  function addToCart(product) {
    // Ürün zaten sepette mi kontrol et
    const existingItemIndex = cart.findIndex(item => 
      item.title === product.title && item.price === product.price
    );
    
    if (existingItemIndex !== -1) {
      // Ürün zaten sepette, miktarını artır
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
      // Yeni ürün, sepete ekle
      product.quantity = 1;
      cart.push(product);
    }
    
    saveCart();
    updateCartDisplay();
    
    // Bildirim göster
    showNotification(`${product.title} sepete eklendi!`, 'success');
  }
  
  /**
   * Sepetten ürün çıkarır
   * @param {number} index - Çıkarılacak ürünün indeksi
   */
  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
  }
  
  /**
   * Sepeti temizler
   */
  function clearCart() {
    cart = [];
    couponApplied = false;
    saveCart();
    updateCartDisplay();
    showNotification('Sepet temizlendi!', 'success');
  }
  
  /**
   * Sepeti açar/kapatır
   */
  function toggleCart() {
    if (cartPopup) {
      if (cartPopup.style.display === 'block') {
        cartPopup.style.display = 'none';
      } else {
        cartPopup.style.display = 'block';
      }
    }
  }
  
  // =====================
  // BİLDİRİM SİSTEMİ
  // =====================
  
  /**
   * Bildirim gösterir
   * @param {string} message - Bildirim mesajı
   * @param {string} type - Bildirim türü (success, error)
   */
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // =====================
  // ÜRÜN RESİM GALERİSİ
  // =====================
  
  /**
   * Ürün resim galerisi işlevlerini başlatır
   */
  function initProductGallery() {
    productCards.forEach(card => {
      const productImage = card.querySelector('.product-image');
      const leftArrow = card.querySelector('.nav-arrow.left');
      const rightArrow = card.querySelector('.nav-arrow.right');
      
      if (!productImage) return;
      
      let images = [];
      try {
        const imagesAttr = card.getAttribute('data-images');
        if (imagesAttr) {
          images = JSON.parse(imagesAttr);
        }
      } catch (e) {
        console.error('Resim verisi ayrıştırılamadı:', e);
        images = [];
      }
      
      if (!images.length) return;
      
      let currentImageIndex = 0;
      
      function updateImage() {
        productImage.src = images[currentImageIndex];
      }
      
      if (leftArrow) {
        leftArrow.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          currentImageIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
          updateImage();
        });
      }
      
      if (rightArrow) {
        rightArrow.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          currentImageIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
          updateImage();
        });
      }
      
      updateImage();
    });
  }
  
  // =====================
  // ARAMA İŞLEVİ
  // =====================
  
  /**
   * Ürünleri arar
   * @param {string} query - Arama sorgusu
   */
  function searchProducts(query) {
    if (!productCards.length) return;
    
    query = query.toLowerCase().trim();
    
    productCards.forEach(card => {
      const productName = card.getAttribute('data-name') || card.querySelector('.product-title')?.textContent || '';
      if (query === '' || productName.toLowerCase().includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }
  
  // =====================
  // KATEGORİ AÇMA/KAPAMA
  // =====================
  
  /**
   * Kategori açma/kapama işlevini başlatır
   */
  function initCategoryToggles() {
    categoryToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const subcategories = this.nextElementSibling;
        if (subcategories && subcategories.classList.contains('subcategories')) {
          subcategories.classList.toggle('show');
        }
      });
    });
  }
  
  // =====================
  // OLAY DİNLEYİCİLERİ
  // =====================
  
  // Sepet simgesi tıklama
  if (cartIcon) {
    cartIcon.addEventListener('click', function(e) {
      e.preventDefault();
      toggleCart();
    });
  }
  
  // Sepeti kapat butonu
  if (closeCart) {
    closeCart.addEventListener('click', function() {
      if (cartPopup) cartPopup.style.display = 'none';
    });
  }
  
  // Sepeti temizle butonu
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }
  
  // Sepeti görüntüle butonu
  if (viewCartBtn) {
    viewCartBtn.addEventListener('click', function() {
      window.location.href = 'sepet.html';
    });
  }
  
  // Kupon kodu uygulama
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', function() {
      const couponCode = couponInput.value.trim().toUpperCase();
      if (couponCode === 'JOYSTIX10') {
        couponApplied = true;
        updateCartDisplay();
        showNotification('İndirim kodu başarıyla uygulandı!', 'success');
      } else {
        showNotification('Geçersiz indirim kodu!', 'error');
      }
    });
  }
  
  // Sepete ekle butonları
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const card = this.closest('.product-card');
      if (!card) return;
      
      const title = card.querySelector('.product-title')?.textContent || 'Ürün';
      const priceStr = card.getAttribute('data-price') || '0';
      const price = parseInt(priceStr);
      const image = card.querySelector('.product-image')?.src || '';
      
      addToCart({ title, price, image });
      
      this.classList.add('add-to-cart-animation');
      setTimeout(() => {
        this.classList.remove('add-to-cart-animation');
      }, 500);
      
      if (cartPopup) cartPopup.style.display = 'block';
    });
  });
  
  // Arama kutusu
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchProducts(this.value);
    });
  }
  
  // Sepet dışına tıklama
  document.addEventListener('click', function(e) {
    if (cartPopup && !cartPopup.contains(e.target) && e.target !== cartIcon) {
      cartPopup.style.display = 'none';
    }
  });
  
  // =====================
  // BAŞLATMA
  // =====================
  
  // Sepeti yükle
  loadCart();
  
  // Ürün resim galerisini başlat
  initProductGallery();
  
  // Kategori açma/kapama işlevini başlat
  initCategoryToggles();
  
  console.log('Joystix Zone JavaScript başarıyla yüklendi!');
});