// Warenkorb-Initialisierung
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];

// Wishlist-Initialisierung
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// Produktdaten laden
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    const products = await response.json();
    // Füge eine Standardbeschreibung hinzu, falls nicht vorhanden
    return products.map(p => ({
      ...p,
      description: p.description || ''
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Produkte:', error);
    return [];
  }
}

// Wishlist-Logik (bereits initialisiert oben)

function isInWishlist(productId) {
  // Lade immer die aktuelle Wunschliste aus dem localStorage
  const currentWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  return currentWishlist.some(item => Number(item.id) === Number(productId));
}

function toggleWishlist(productId) {
  loadProducts().then(products => {
    const product = products.find(p => Number(p.id) === Number(productId));
    if (!product) {
      console.error('Produkt für die Wunschliste nicht gefunden! ID:', productId, products);
      alert('Produkt konnte nicht zur Wunschliste hinzugefügt werden.');
      return;
    }
    wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    if (isInWishlist(productId)) {
      wishlist = wishlist.filter(item => Number(item.id) !== Number(productId));
      showAlert('Produkt von der Wunschliste entfernt', 'wishlist.html');
    } else {
      // Nur vollständige Produktobjekte speichern
      const fullProduct = {
        id: product.id,
        name: product.name || 'Produkt',
        price: typeof product.price === 'number' ? product.price : 0,
        category: product.category || '',
        image: product.image || 'waren/ware.png',
        description: product.description || ''
      };
      wishlist.push(fullProduct);
      showAlert('Produkt zur Wunschliste hinzugefügt', 'wishlist.html');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    renderProducts(products); // Herz-Status aktualisieren
  });
}

// Produktgrid rendern (mit Herz oben rechts)
function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return; // Verhindert Fehler auf anderen Seiten
  
  grid.innerHTML = products.map(product => `
    <div class="col">
      <div class="card h-100 border-0 shadow-hover position-relative product-card" data-product-id="${product.id}">
        <button class="wishlist-btn" data-product-id="${product.id}" aria-label="Zur Wunschliste">
          <i class="bi ${isInWishlist(product.id) ? 'bi-heart-fill' : 'bi-heart'}"></i>
        </button>
        <div class="ratio ratio-4x3 product-image-container">
          <img src="${product.image}" class="card-img-top object-fit-cover" alt="${product.name}" 
               style="opacity: 0.8; transform: scale(0.98); transition: opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; filter: brightness(1.02) contrast(1.05) saturate(1.1);">
        </div>
        <div class="card-body">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text">${product.description || ''}</p>
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="h4 text-primary">€${product.price.toFixed(2)}</span>
              <small class="text-muted d-block">inkl. MwSt.</small>
            </div>
            <button class="btn btn-primary rounded-pill px-3 py-2 add-to-cart"
                    data-product-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}">
              <i class="bi bi-cart-plus me-2"></i><span class="btn-text">Hinzufügen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  initializeAddToCartButtons();
  initializeWishlistButtons();
  initializeProductCardClicks();
  observeProductCards();
  optimizeImages(); // Bilder nach dem Rendern optimieren
}

function observeProductCards() {
  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(card => observer.observe(card));
}

// Add-to-cart Buttons initialisieren
function initializeAddToCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Verhindert, dass das Klick-Event zur Karte weitergeht
      const productId = parseInt(button.dataset.productId);
      addToCart(productId);
    });
  });
}

// Produktkarten-Klicks initialisieren
function initializeProductCardClicks() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Verhindere Navigation bei Klicks auf Buttons oder deren Kinder
      if (e.target.closest('.wishlist-btn') || e.target.closest('.add-to-cart')) {
        return;
      }
      
      const productId = parseInt(card.dataset.productId);
      window.location.href = `produkte/produkt-${productId}.html`;
    });
    
    // Cursor-Pointer für bessere UX
    card.style.cursor = 'pointer';
  });
}

// Warenkorb-Funktionen
function addToCart(productId) {
  loadProducts().then(products => {
    const product = products.find(p => Number(p.id) === Number(productId));
    if (!product) return;
    const existingItem = cartItems.find(item => Number(item.id) === Number(productId));

    if (existingItem) {
      existingItem.quantity++;
    } else {
      cartItems.push({ ...product, quantity: 1 });
    }

    // Speichere den aktuellen Warenkorb immer im localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCounter();
    renderCartDropdown();
    showAlert('Produkt wurde zum Warenkorb hinzugefügt');

    // --- NEU: Wenn der User auf cart.html ist, direkt die Seite aktualisieren ---
    if (window.location.pathname.endsWith('cart.html')) {
      if (typeof updateCartPage === 'function') {
        updateCartPage();
      } else if (typeof window.location.reload === 'function') {
        window.location.reload();
      }
    }
  });
}

function updateCartCounter() {
  const counter = document.getElementById('cartCounter');
  if (counter) {
    counter.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
}

function showAlert(message, redirectTo = 'cart.html') {
  const alert = document.createElement('div');
  alert.className = 'alert alert-success position-fixed end-0 m-4 shadow-lg fade show';
  alert.style.zIndex = '20000';
  alert.style.fontSize = '1rem';
  alert.style.minWidth = '160px';
  alert.style.maxWidth = '320px';
  alert.style.padding = '0.75rem 2rem';
  alert.style.textAlign = 'center';
  alert.style.borderRadius = '2rem';
  alert.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
  alert.style.background = 'linear-gradient(90deg, #4f8cff 0%, #38c6ff 100%)';
  alert.style.color = '#fff';
  alert.style.fontWeight = '500';
  alert.style.letterSpacing = '0.02em';
  alert.style.pointerEvents = 'auto';
  alert.style.position = 'fixed';
  alert.style.right = '2.5rem';
  alert.style.top = 'calc(56px + 1.2rem)'; // noch etwas weiter nach unten
  alert.style.cursor = 'pointer';
  alert.textContent = message;
  alert.addEventListener('click', () => {
    window.location.href = redirectTo;
  });
  document.body.appendChild(alert);
  setTimeout(() => {
    if (document.body.contains(alert)) {
      alert.classList.remove('show');
      alert.classList.add('fade');
      setTimeout(() => alert.remove(), 400);
    }
  }, 1700);
}

function changeQuantity(productId, change) {
  productId = Number(productId);
  const item = cartItems.find(i => Number(i.id) === productId);
  if (!item) return;
  
  // Bei Bundles (Items mit bundleId) keine Mengenänderung erlauben
  if (item.bundleId) {
    return; // Keine Änderung bei Bundles
  }
  
  if (item.quantity + change < 1) {
    cartItems = cartItems.filter(i => Number(i.id) !== productId);
  } else {
    item.quantity += change;
  }
  localStorage.setItem('cart', JSON.stringify(cartItems));
  updateCartCounter();
  renderCartDropdown();
  // Dropdown nach 1 Sekunde ausblenden, wenn leer
  if (cartItems.length === 0) {
    setTimeout(() => {
      const cartDropdown = document.getElementById('cartDropdown');
      if (cartDropdown) cartDropdown.classList.remove('show');
    }, 1000);
  }
}

function removeFromCart(productId) {
  productId = Number(productId);
  cartItems = cartItems.filter(i => Number(i.id) !== productId);
  localStorage.setItem('cart', JSON.stringify(cartItems));
  updateCartCounter();
  renderCartDropdown();
  // Dropdown nach 1 Sekunde ausblenden, wenn leer
  if (cartItems.length === 0) {
    setTimeout(() => {
      const cartDropdown = document.getElementById('cartDropdown');
      if (cartDropdown) cartDropdown.classList.remove('show');
    }, 1000);
  }
}

function clearCart() {
  cartItems = [];
  localStorage.setItem('cart', JSON.stringify(cartItems));
  updateCartCounter();
  renderCartDropdown();
  // Dropdown nach 1 Sekunde ausblenden
  setTimeout(() => {
    const cartDropdown = document.getElementById('cartDropdown');
    if (cartDropdown) cartDropdown.classList.remove('show');
  }, 1000);
}

// Filter- und Sortierfunktionen
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function filterProducts(products, searchText, category) {
  return products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = category === 'Alle Kategorien' || product.category === category;
    return matchesSearch && matchesCategory;
  });
}

function sortProducts(products, sortOrder) {
  return [...products].sort((a, b) =>
    sortOrder === 'Aufsteigend' || sortOrder === 'Preis: Aufsteigend'
      ? a.price - b.price
      : b.price - a.price
  );
}

// Warenkorb Dropdown öffnen/schließen und rendern
function initializeCartDropdown() {
  const cartButton = document.getElementById('cartButton');
  const cartDropdown = document.getElementById('cartDropdown');
  const closeCartDropdown = document.getElementById('closeCartDropdown');

  if (cartButton && cartDropdown) {
    cartButton.addEventListener('click', (e) => {
      e.preventDefault();
      renderCartDropdown();
      cartDropdown.classList.toggle('show');
      // Sichtbarkeit für mobile Geräte absichern
      if (cartDropdown.classList.contains('show')) {
        cartDropdown.style.display = 'block';
      } else {
        cartDropdown.style.display = 'none';
      }
    });
  }
  if (closeCartDropdown && cartDropdown) {
    closeCartDropdown.addEventListener('click', (e) => {
      e.preventDefault();
      cartDropdown.classList.remove('show');
      cartDropdown.style.display = 'none'; // Overlay immer ausblenden
    });
  }
}

function renderCartDropdown() {
  cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const body = document.getElementById('cartDropdownBody');
  const footer = document.getElementById('cartDropdownFooter');
  const totalElement = document.getElementById('cartTotal');

  if (!body || !footer || !totalElement) return;

  if (cartItems.length === 0) {
    footer.style.display = 'none';
    
    // Bei leerem Warenkorb: 3 zufällige Produktvorschläge anzeigen
    loadProducts().then(products => {
      if (products.length === 0) {
        body.innerHTML = `
          <div class="empty-cart text-center py-4" id="emptyCartMessage">
            <i class="bi bi-cart-x fs-1 text-muted"></i>
            <p class="text-muted mt-2">Ihr Warenkorb ist leer</p>
          </div>
        `;
        return;
      }
      
      // 3 zufällige Produkte auswählen
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const randomProducts = shuffled.slice(0, 3);
      
      body.innerHTML = `
        <div class="empty-cart text-center py-3" id="emptyCartMessage">
          <i class="bi bi-cart-x fs-1 text-muted"></i>
          <p class="text-muted mt-2 mb-3">Ihr Warenkorb ist leer</p>
          
          <!-- Zufällige Produktvorschläge -->
          <div class="mt-3">
            <h6 class="mb-2" style="color: #6c757d; font-weight: 600;"><i class="bi bi-lightbulb" style="color: #ffc107;"></i> Das könnte Ihnen gefallen</h6>
            ${randomProducts.map(product => `
              <div class="cart-item" style="margin-bottom: 0.5rem;">
                <img src="${product.image}" class="cart-item-image" alt="${product.name}">
                <div class="cart-item-details">
                  <div class="cart-item-name">${product.name}</div>
                  <div class="cart-item-price">€${product.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                  <button class="quantity-btn" onclick="addToCart(${product.id})" style="background: #007AFF; color: white; border: none; font-weight: 700; box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);">
                    <i class="bi bi-cart-plus"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    return;
  }
  
  footer.style.display = 'block';
  body.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <img src="${item.image}" class="cart-item-image" alt="${item.name}">
      <div class="cart-item-details">
        <div class="product-info">
        <div class="cart-item-name">${item.name}</div>
        </div>
        <div class="price-info">
          <span>€${(typeof item.price === 'number' ? item.price.toFixed(2) : '0.00')}</span>
          <span>x</span>
          <span class="quantity-display">${item.quantity}</span>
          <span>=</span>
          <strong>€${(typeof item.price === 'number' ? (item.price * item.quantity).toFixed(2) : '0.00')}</strong>
        </div>
      </div>
      <div class="cart-item-controls">
        ${item.bundleId ? `
          <div class="quantity-controls disabled">
            <span class="quantity-display">1</span>
          </div>
        ` : `
          <div class="quantity-controls" style="display: flex; align-items: center; gap: 4px;">
            <button class="quantity-btn" onclick="changeQuantity(${Number(item.id)}, -1)">-</button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn" onclick="changeQuantity(${Number(item.id)}, 1)">+</button>
          </div>
        `}
        <button class="remove-item" onclick="removeFromCart(${Number(item.id)})">&times;</button>
      </div>
    </div>
  `).join('');
  totalElement.textContent = cartItems
    .reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price * item.quantity : 0), 0)
    .toFixed(2);
}

// Wishlist-Buttons initialisieren
function initializeWishlistButtons() {
  document.querySelectorAll('.wishlist-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Verhindert, dass das Klick-Event zur Karte weitergeht
      const productId = parseInt(button.dataset.productId);
      toggleWishlist(productId);
    });
  });
}

// Filter- und Sortier-Event-Listener
document.addEventListener('DOMContentLoaded', () => {
  updateCartCounter();
  initializeCartDropdown();
  
  // Mobile Suchleiste Toggle
  const searchForm = document.querySelector('.search-form');
  const searchBtn = document.querySelector('.search-form .btn');
  
  if (searchBtn && window.innerWidth <= 768) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Verhindert Form-Submit
      
      if (searchForm.classList.contains('expanded')) {
        // Wenn bereits geöffnet, dann suchen
        const searchInput = searchForm.querySelector('.form-control');
        if (searchInput && searchInput.value.trim()) {
          // Führe Suche aus
          updateFilters();
        }
      } else {
        // Öffne Suchfeld
        searchForm.classList.add('expanded');
        const searchInput = searchForm.querySelector('.form-control');
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
    
    // Schließe Suchleiste beim Klick außerhalb
    document.addEventListener('click', (e) => {
      if (!searchForm.contains(e.target) && searchForm.classList.contains('expanded')) {
        searchForm.classList.remove('expanded');
      }
    });
    
    // Enter-Taste im Suchfeld
    const searchInput = searchForm.querySelector('.form-control');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          updateFilters();
          searchForm.classList.remove('expanded');
        }
      });
    }
  }
  
  // Sofortige Platzhalter für fehlende Bilder anwenden
  applyPlaceholdersForMissingImages();

  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceSort = document.getElementById('priceSort');

  const updateFilters = debounce(() => {
    loadProducts().then(products => {
      const filtered = filterProducts(
        products,
        searchInput ? searchInput.value : '',
        categoryFilter ? categoryFilter.value : 'Alle Kategorien'
      );
      const sorted = sortProducts(
        filtered,
        priceSort ? priceSort.value : 'Aufsteigend'
      );
      renderProducts(sorted);
    });
  }, 300);

  if (searchInput) searchInput.addEventListener('input', updateFilters);
  if (categoryFilter) categoryFilter.addEventListener('change', (e) => {
    // Leere die Suche wenn eine Kategorie gewählt wird
    if (searchInput) {
      searchInput.value = '';
    }
    updateFilters();
  });
  if (priceSort) priceSort.addEventListener('change', updateFilters);

  // Kategorie-Klicks auf der Hauptseite
  document.querySelectorAll('.category-tile').forEach(tile => {
    tile.addEventListener('click', (e) => {
      e.preventDefault();
      const category = tile.getAttribute('data-category');
      
      // Setze die Kategorie im Dropdown
      if (categoryFilter) {
        categoryFilter.value = category;
      }
      
      // Leere die Suche
      if (searchInput) {
        searchInput.value = '';
      }
      
      // Aktualisiere die Filter
      updateFilters();
      
      // Scrolle zu den Produkten
      const productGrid = document.getElementById('productGrid');
      if (productGrid) {
        productGrid.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // "Alle Produkte entdecken" Button
  const allProductsBtn = document.querySelector('a[href="#productGrid"]');
  if (allProductsBtn) {
    allProductsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Setze "Alle Kategorien" im Dropdown
      if (categoryFilter) {
        categoryFilter.value = 'Alle Kategorien';
      }
      
      // Leere die Suche
      if (searchInput) {
        searchInput.value = '';
      }
      
      // Aktualisiere die Filter
      updateFilters();
      
      // Scrolle zu den Produkten
      const productGrid = document.getElementById('productGrid');
      if (productGrid) {
        productGrid.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Initiales Laden und Rendern
  loadProducts().then(products => {
    const filtered = filterProducts(
      products,
      searchInput ? searchInput.value : '',
      categoryFilter ? categoryFilter.value : 'Alle Kategorien'
    );
    const sorted = sortProducts(
      filtered,
      priceSort ? priceSort.value : 'Aufsteigend'
    );
    renderProducts(sorted);
    
    // Bilder optimieren und Platzhalter anwenden
    optimizeImages();
    setTimeout(applyPlaceholdersForMissingImages, 100); // Verzögerung für bessere Erkennung
  });

  const clearCartBtn = document.getElementById('clearCart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearCart();
    });
  }
});

// Warenkorb-Funktionalität
document.addEventListener('DOMContentLoaded', function() {
    const cartButton = document.getElementById('cartButton');
    const cartDropdown = document.querySelector('.cart-dropdown');
    
    if (cartButton && cartDropdown) {
        cartButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            cartDropdown.classList.toggle('show');
            document.body.classList.toggle('cart-open');
            
            // Schließen wenn außerhalb geklickt wird
            if (cartDropdown.classList.contains('show')) {
                document.addEventListener('click', closeCartOnClickOutside);
            } else {
                document.removeEventListener('click', closeCartOnClickOutside);
            }
        });
    }
    
    function closeCartOnClickOutside(e) {
        if (!cartDropdown.contains(e.target) && e.target !== cartButton) {
            cartDropdown.classList.remove('show');
            document.body.classList.remove('cart-open');
            document.removeEventListener('click', closeCartOnClickOutside);
        }
    }
    
    // Schließen mit Escape-Taste
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && cartDropdown.classList.contains('show')) {
            cartDropdown.classList.remove('show');
            document.body.classList.remove('cart-open');
            document.removeEventListener('click', closeCartOnClickOutside);
        }
    });
});

// Bilder optimieren
function optimizeImages() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    // Fallback für fehlende Bilder mit verbessertem Design
    img.addEventListener('error', function() {
      // Prüfe ob das Bild wirklich fehlt (nicht nur noch lädt)
      if (this.src && !this.src.includes('data:') && !this.src.includes('blob:')) {
        // Entferne das alte src-Attribut
        this.removeAttribute('src');
        
        // Setze den Platzhalter-Hintergrund - Einheitlich wie auf PC
        this.style.background = '#f8fafc';
        this.style.display = 'flex';
        this.style.alignItems = 'center';
        this.style.justifyContent = 'center';
        this.style.color = '#2c3e50';
        this.style.fontSize = '4rem';
        this.style.fontWeight = '700';
        this.style.borderRadius = '16px 16px 0 0';
        this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.style.objectFit = 'contain';
        this.style.padding = '20px';
        
        // Füge das große Fragezeichen-Symbol hinzu (wie auf PC)
        this.innerHTML = '?';
        
        // Mobile Anpassungen für Platzhalter - aber einheitlich
        if (window.innerWidth <= 768) {
          this.style.fontSize = '3rem';
        }
        if (window.innerWidth <= 600) {
          this.style.fontSize = '2.5rem';
        }
        if (window.innerWidth <= 414) {
          this.style.fontSize = '2rem';
        }
        if (window.innerWidth <= 375) {
          this.style.fontSize = '1.8rem';
        }
      }
    });
    
    // Lade-Animation mit verbesserter Performance
    img.addEventListener('load', function() {
      this.style.opacity = '1';
      this.style.transform = 'scale(1)';
      this.style.filter = 'brightness(1.02) contrast(1.05) saturate(1.08)';
      
      // Entferne Platzhalter-Styles wenn Bild geladen ist
      this.style.background = '';
      this.style.display = '';
      this.style.alignItems = '';
      this.style.justifyContent = '';
      this.style.color = '';
      this.style.fontSize = '';
      this.style.fontWeight = '';
      this.style.borderRadius = '';
      this.style.boxShadow = '';
      this.style.position = '';
      this.style.overflow = '';
      this.style.objectFit = '';
      this.style.padding = '';
      this.innerHTML = '';
    });
    
    // Initiale Lade-Animation
    img.style.opacity = '0.8';
    img.style.transform = 'scale(0.98)';
    img.style.transition = 'opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease';
    
    // Bildqualität für mobile Geräte optimieren
    if (window.innerWidth <= 600) {
      img.style.imageRendering = '-webkit-optimize-contrast';
      img.style.imageRendering = 'crisp-edges';
    }
    
    // Prüfe ob das Bild bereits fehlerhaft ist (nur bei wirklich fehlenden Bildern)
    if (img.complete && img.naturalWidth === 0 && img.src && !img.src.includes('data:') && !img.src.includes('blob:')) {
      // Warte kurz und prüfe nochmal
      setTimeout(() => {
        if (img.naturalWidth === 0) {
          img.dispatchEvent(new Event('error'));
        }
      }, 100);
    }
  });
}

// Funktion zum sofortigen Anwenden von Platzhaltern für fehlende Bilder
function applyPlaceholdersForMissingImages() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    // Prüfe ob das Bild bereits fehlerhaft ist (nur bei wirklich fehlenden Bildern)
    if (img.complete && img.naturalWidth === 0 && img.src && !img.src.includes('data:') && !img.src.includes('blob:')) {
      // Warte kurz und prüfe nochmal, um sicherzustellen, dass das Bild wirklich fehlt
      setTimeout(() => {
        if (img.naturalWidth === 0) {
          // Entferne das alte src-Attribut
          img.removeAttribute('src');
          
          // Setze den Platzhalter-Hintergrund - Einheitlich wie auf PC
          img.style.background = '#f8fafc';
          img.style.display = 'flex';
          img.style.alignItems = 'center';
          img.style.justifyContent = 'center';
          img.style.color = '#2c3e50';
          img.style.fontSize = '4rem';
          img.style.fontWeight = '700';
          img.style.borderRadius = '16px 16px 0 0';
          img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          img.style.position = 'relative';
          img.style.overflow = 'hidden';
          img.style.objectFit = 'contain';
          img.style.padding = '20px';
          
          // Füge das große Fragezeichen-Symbol hinzu (wie auf PC)
          img.innerHTML = '?';
          
          // Mobile Anpassungen für Platzhalter - aber einheitlich
          if (window.innerWidth <= 768) {
            img.style.fontSize = '3rem';
          }
          if (window.innerWidth <= 600) {
            img.style.fontSize = '2.5rem';
          }
          if (window.innerWidth <= 414) {
            img.style.fontSize = '2rem';
          }
          if (window.innerWidth <= 375) {
            img.style.fontSize = '1.8rem';
          }
        }
      }, 200);
    }
  });
}

// Stelle sicher, dass changeQuantity, removeFromCart und clearCart global verfügbar sind:
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.category-tile').forEach(tile => {
    tile.addEventListener('click', function(e) {
      e.preventDefault();
      const category = this.dataset.category;
      const filter = document.getElementById('categoryFilter');
      if (filter) {
        filter.value = category;
        filter.dispatchEvent(new Event('change'));
      }
      const grid = document.getElementById('productGrid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  // NEU: 'Alle Produkte entdecken' Button zeigt wieder alle Produkte
  const allBtn = document.querySelector('a.btn.btn-outline-dark');
  if (allBtn) {
    allBtn.addEventListener('click', function(e) {
      const filter = document.getElementById('categoryFilter');
      if (filter) {
        filter.value = 'Alle Kategorien';
        filter.dispatchEvent(new Event('change'));
      }
    });
  }
});