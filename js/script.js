// Shared behavior across all pages
const CART_KEY = "goodaay_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find((p) => p.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter((p) => p.id !== id));
}

function setCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find((p) => p.id === id);
  if (!item) return;
  if (qty < 1) {
    saveCart(cart.filter((p) => p.id !== id));
  } else {
    item.qty = qty;
    saveCart(cart);
  }
}

function updateCartBadge() {
  const count = getCart().reduce((sum, p) => sum + p.qty, 0);
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  updateCartBadge();
  initProductInteractions(document);

  // Cart page: render items
  const cartList = document.getElementById("cart-list");
  if (cartList) renderCartPage(cartList);

  // Checkout page: render summary and handle order submission
  const checkoutList = document.getElementById("checkout-summary-list");
  if (checkoutList) initCheckoutPage(checkoutList);

  // Contact page: fake form submit
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = document.getElementById("form-status");
      status.textContent = "Thank you! Your message has been received. We'll reply within 1-2 business days.";
      form.reset();
    });
  }
});

// Live-refresh product/category grids if admin makes changes in another tab
window.addEventListener("storage", (e) => {
  if (e.key !== PRODUCTS_KEY && e.key !== CATEGORIES_KEY) return;

  const shopGrid = document.getElementById("product-grid");
  if (shopGrid) renderShopGrid(shopGrid, document.getElementById("tag-filters"), document.getElementById("shop-search-input"));

  const featuredGrid = document.getElementById("featured-grid");
  if (featuredGrid) renderFeaturedGrid(featuredGrid, 3);
});

// Builds the HTML markup for one product card (used on shop/home pages)
function renderProductCard(product) {
  const images = product.images
    .map((src, i) => `<img src="${src}" alt="${product.name} photo ${i + 1}" class="${i === 0 ? "active" : ""}">`)
    .join("");
  const dots = product.images
    .map((_, i) => `<button class="${i === 0 ? "active" : ""}" aria-label="Image ${i + 1}"></button>`)
    .join("");
  const firstImage = product.images[0] || "";

  return `
    <div class="product-card" data-category="${product.category}" data-href="product.html?id=${encodeURIComponent(product.id)}">
      <div class="product-gallery">
        ${images}
        <button class="gallery-nav gallery-prev" aria-label="Previous image">&#10094;</button>
        <button class="gallery-nav gallery-next" aria-label="Next image">&#10095;</button>
        <div class="gallery-dots">${dots}</div>
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.shortDescription || ""}</p>
        <p class="price">$${product.price.toFixed(2)}</p>
        <div class="product-actions">
          <button class="btn btn-outline btn-add-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-img="${firstImage}">Add to Cart</button>
          <button class="btn btn-primary btn-buy-now" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-img="${firstImage}">Buy Now</button>
        </div>
      </div>
    </div>
  `;
}

// Renders the shop grid and its category filter tabs (tabs rebuild from the live category list)
function renderShopGrid(gridEl, filterContainerEl, searchInputEl) {
  let currentCategory = "all";

  const draw = () => {
    const query = (searchInputEl?.value || "").trim().toLowerCase();
    const categoryKeys = new Set(getCategories().map((category) => category.key));
    const products = getProducts().filter((p) => categoryKeys.has(p.category)).filter((p) => {
      const matchesCategory = currentCategory === "all" || p.category === currentCategory;
      const matchesSearch = !query || p.name.toLowerCase().includes(query) || (p.shortDescription || "").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    gridEl.innerHTML = products.length
      ? products.map(renderProductCard).join("")
      : `<p class="admin-empty">No products match your search.</p>`;
    initProductInteractions(gridEl);
  };

  if (filterContainerEl) {
    const categories = getCategories();
    filterContainerEl.innerHTML =
      `<button data-filter="all" class="active">All</button>` +
      categories.map((c) => `<button data-filter="${c.key}">${c.label}</button>`).join("");

    filterContainerEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        filterContainerEl.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.filter;
        draw();
      });
    });
  }

  searchInputEl?.addEventListener("input", draw);

  draw();
}

// Renders a limited set of featured products (e.g. on the home page)
function renderFeaturedGrid(gridEl, count) {
  const categoryKeys = new Set(getCategories().map((category) => category.key));
  const products = getProducts().filter((product) => categoryKeys.has(product.category)).slice(0, count);
  gridEl.innerHTML = products.map(renderProductCard).join("");
  initProductInteractions(gridEl);
}

// Wires up gallery controls, card navigation, and cart buttons within a root element
function initProductInteractions(root) {
  initGalleries(root);
  initCardLinks(root);
  initCartButtons(root);
}

function initGalleries(root) {
  root.querySelectorAll(".product-gallery").forEach((gallery) => {
    const images = gallery.querySelectorAll("img");
    const dots = gallery.querySelectorAll(".gallery-dots button");
    let current = 0;

    const show = (index) => {
      current = (index + images.length) % images.length;
      images.forEach((img, i) => img.classList.toggle("active", i === current));
      dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
    };

    gallery.querySelector(".gallery-prev")?.addEventListener("click", () => show(current - 1));
    gallery.querySelector(".gallery-next")?.addEventListener("click", () => show(current + 1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));

    show(0);
  });
}

function initCardLinks(root) {
  root.querySelectorAll(".product-card[data-href]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;
      window.location.href = card.dataset.href;
    });
  });
}

function initCartButtons(root) {
  root.querySelectorAll(".btn-add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.img,
      });
      showToast(`${btn.dataset.name} added to cart`);
    });
  });

  root.querySelectorAll(".btn-buy-now").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.img,
      });
      window.location.href = btn.dataset.cartUrl || "cart.html";
    });
  });
}

function renderCartPage(cartList) {
  const emptyEl = document.getElementById("cart-empty");
  const summaryEl = document.getElementById("cart-summary");
  const totalEl = document.getElementById("cart-total");

  const draw = () => {
    const cart = getCart();
    cartList.innerHTML = "";

    if (!cart.length) {
      if (emptyEl) emptyEl.style.display = "block";
      if (summaryEl) summaryEl.style.display = "none";
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";
    if (summaryEl) summaryEl.style.display = "flex";

    let total = 0;
    cart.forEach((item) => {
      total += item.price * item.qty;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <h3 style="margin:0 0 0.3rem;">${item.name}</h3>
          <div class="qty-stepper">
            <button class="qty-decrease" data-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-increase" data-id="${item.id}" aria-label="Increase quantity">&plus;</button>
          </div>
        </div>
        <p class="price" style="margin:0;">$${(item.price * item.qty).toFixed(2)}</p>
        <button class="remove-item" data-id="${item.id}">Remove</button>
      `;
      cartList.appendChild(row);
    });

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    cartList.querySelectorAll(".qty-decrease").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = getCart().find((p) => p.id === btn.dataset.id);
        if (item) setCartQty(item.id, item.qty - 1);
        draw();
      });
    });

    cartList.querySelectorAll(".qty-increase").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = getCart().find((p) => p.id === btn.dataset.id);
        if (item) setCartQty(item.id, item.qty + 1);
        draw();
      });
    });

    cartList.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeFromCart(btn.dataset.id);
        draw();
      });
    });
  };

  draw();
}

// Checkout page: shows a read-only order summary and handles the details form
function initCheckoutPage(listEl) {
  const emptyEl = document.getElementById("checkout-empty");
  const contentEl = document.getElementById("checkout-content");
  const totalEl = document.getElementById("checkout-total");
  const cart = getCart();

  if (!cart.length) {
    if (emptyEl) emptyEl.style.display = "block";
    if (contentEl) contentEl.style.display = "none";
    return;
  }

  let total = 0;
  listEl.innerHTML = cart
    .map((item) => {
      total += item.price * item.qty;
      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" />
          <div>
            <h3 style="margin:0 0 0.3rem;">${item.name}</h3>
            <p style="margin:0; color:var(--text-muted);">Qty: ${item.qty}</p>
          </div>
          <p class="price" style="margin:0;">$${(item.price * item.qty).toFixed(2)}</p>
        </div>
      `;
    })
    .join("");
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

  const cardFields = document.getElementById("card-payment-fields");
  const paymentLabels = { card: "Credit / Debit Card", cod: "Cash on Delivery" };

  const toggleCardFields = () => {
    const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
    if (!selectedPayment) return;
    if (cardFields) cardFields.style.display = selectedPayment.value === "card" ? "block" : "none";
  };
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
    radio.addEventListener("change", toggleCardFields);
  });
  toggleCardFields();

  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("co-name").value.trim();
    const email = document.getElementById("co-email").value.trim();
    const phone = document.getElementById("co-phone").value.trim();
    const address = document.getElementById("co-address").value.trim();
    const city = document.getElementById("co-city").value.trim();
    const zip = document.getElementById("co-zip").value.trim();
    const notes = document.getElementById("co-notes").value.trim();
    const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
    if (!selectedPayment) {
      document.getElementById("checkout-status").textContent = "Please select a payment method.";
      return;
    }
    const paymentMethod = selectedPayment.value;

    let paymentDetails = { method: paymentMethod };
    if (paymentMethod === "card") {
      const cardNumber = document.getElementById("co-card-number").value.replace(/\s+/g, "");
      const cardName = document.getElementById("co-card-name").value.trim();
      const cardExpiry = document.getElementById("co-card-expiry").value.trim();
      const cardCvv = document.getElementById("co-card-cvv").value.trim();

      if (!cardName || cardNumber.length < 12 || !/^\d{2}\/\d{2}$/.test(cardExpiry) || cardCvv.length < 3) {
        document.getElementById("checkout-status").textContent = "Please enter valid card details.";
        return;
      }
      // Only the last 4 digits are kept — never store full card numbers, even in a demo.
      paymentDetails.cardName = cardName;
      paymentDetails.cardLast4 = cardNumber.slice(-4);
      paymentDetails.cardExpiry = cardExpiry;
    }

    try {
      await addOrder({
        customer: { name, email, phone, address, city, zip, notes },
        payment: paymentDetails,
        // Images aren't shown on the orders dashboard; drop them so large uploaded
        // photos don't get duplicated into every order and exhaust localStorage.
        items: cart.map(({ image, ...item }) => item),
        total,
      });
    } catch (err) {
      console.error("Place order failed:", err);
      const status = document.getElementById("checkout-status");
      if (status) {
        const databaseBlocked = err.message?.includes("row-level security policy");
        status.textContent = databaseBlocked
          ? "Orders are temporarily unavailable. Please contact the store owner."
          : "We couldn't place your order yet. Please try again or contact us for help.";
        status.style.color = "#c62828";
      }
      return;
    }

    document.getElementById("checkout-confirm-name").textContent = name;
    document.getElementById("checkout-confirm-email").textContent = email;
    document.getElementById("checkout-confirm-address").textContent = `${address}, ${city} ${zip}`;
    document.getElementById("checkout-confirm-payment").textContent =
      paymentMethod === "card" ? `${paymentLabels.card} ending in ${paymentDetails.cardLast4}` : paymentLabels[paymentMethod];

    saveCart([]);
    contentEl.style.display = "none";
    document.getElementById("checkout-confirmation").style.display = "block";
  });
}
