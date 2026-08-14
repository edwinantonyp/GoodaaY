// Admin page logic: product/category CRUD. Login gate lives in js/auth.js.
let activeCategory = null;

document.addEventListener("DOMContentLoaded", () => {
  setupAdminLoginGate(() => Promise.all([initializeCategories(), initializeProducts()]).then(renderAdminUI).catch(handleCategoryError));

  document.getElementById("admin-reset")?.addEventListener("click", async () => {
    if (confirm("Reset the store back to the original demo categories and products? This removes any categories or products you added or edited.")) {
      await resetProductsToDefault();
      await resetCategoriesToDefault();
      activeCategory = null;
      renderAdminUI();
      showToast("Store reset to defaults");
    }
  });

  document.getElementById("admin-new-category-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("admin-new-category-name");
    const label = input.value.trim();
    if (!label) return;
    try {
      const category = await addCategory(label);
      activeCategory = category.key;
      input.value = "";
      renderAdminUI();
      showToast(`"${category.label}" category added`);
    } catch (err) {
      console.error("Add category failed:", err);
      alert(`Couldn't add category (${err.name}: ${err.message}).`);
    }
  });

  document.getElementById("admin-add-product-btn").addEventListener("click", () => {
    if (activeCategory) openProductModal(null, activeCategory);
  });

  const dropdownToggle = document.getElementById("admin-delete-dropdown-toggle");
  const dropdownMenu = document.getElementById("admin-delete-dropdown-menu");
  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#admin-delete-category-dropdown")) {
      dropdownMenu.classList.remove("open");
    }
  });

  document.getElementById("admin-delete-category-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const keys = Array.from(dropdownMenu.querySelectorAll("input:checked")).map((cb) => cb.value);
    const categories = getCategories();

    if (!keys.length) {
      alert("Select at least one category to delete.");
      return;
    }
    if (keys.length >= categories.length) {
      alert("You must keep at least one category.");
      return;
    }

    const toDelete = categories.filter((c) => keys.includes(c.key));
    const productCount = getProducts().filter((p) => keys.includes(p.category)).length;
    const names = toDelete.map((c) => `"${c.label}"`).join(", ");
    const message = productCount
      ? `Delete ${names}? This will also delete ${productCount} product(s) in these categories. This cannot be undone.`
      : `Delete ${names}? This cannot be undone.`;
    if (!confirm(message)) return;

    try {
      const productsToDelete = getProducts().filter((p) => keys.includes(p.category));
      for (const product of productsToDelete) {
        await deleteProduct(product.id);
      }
      for (const category of toDelete) {
        await deleteCategory(category.key);
      }
      if (keys.includes(activeCategory)) activeCategory = null;
      dropdownMenu.classList.remove("open");
      renderAdminUI();
      showToast(`${toDelete.length} categor${toDelete.length === 1 ? "y" : "ies"} deleted`);
    } catch (err) {
      console.error("Delete category failed:", err);
      alert(`Couldn't delete categories (${err.name}: ${err.message}).`);
    }
  });
});

// Rebuilds the category tab bar and the active category's product list
function renderAdminUI() {
  const categories = getCategories();
  if (!activeCategory || !categories.some((c) => c.key === activeCategory)) {
    activeCategory = categories[0]?.key || null;
  }
  renderCategoryTabs(categories);
  renderDeleteCategorySelect(categories);
  renderActiveCategorySection();
  renderStorageUsage();
}

function handleCategoryError(error) {
  console.error("Category sync failed:", error);
  alert(`Couldn't sync categories (${error.name}: ${error.message}).`);
  renderAdminUI();
}

// Keeps the "Delete Category" checkbox dropdown in sync with the current category list
function renderDeleteCategorySelect(categories) {
  const menu = document.getElementById("admin-delete-dropdown-menu");
  const toggle = document.getElementById("admin-delete-dropdown-toggle");
  const previouslyChecked = Array.from(menu.querySelectorAll("input:checked")).map((cb) => cb.value);

  menu.innerHTML = categories
    .map(
      (c) => `
      <label>
        <input type="checkbox" value="${c.key}" ${previouslyChecked.includes(c.key) ? "checked" : ""}>
        ${c.label}
      </label>
    `
    )
    .join("");

  const updateToggleLabel = () => {
    const count = menu.querySelectorAll("input:checked").length;
    toggle.textContent = count ? `${count} categor${count === 1 ? "y" : "ies"} selected \u25be` : "Select categories to delete \u25be";
  };
  menu.querySelectorAll("input").forEach((cb) => cb.addEventListener("change", updateToggleLabel));
  updateToggleLabel();
}

// Shows roughly how much of the browser's localStorage quota this site is using
function renderStorageUsage() {
  const usageEl = document.getElementById("admin-storage-usage");
  if (!usageEl) return;
  let bytes = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      bytes += (localStorage[key]?.length || 0) + key.length;
    }
  }
  const kb = (bytes / 1024).toFixed(0);
  usageEl.textContent = `Local storage in use: ~${kb} KB (typical browser limit is 5,000-10,000 KB)`;
}

function renderCategoryTabs(categories) {
  const tabsEl = document.getElementById("admin-category-tabs");
  tabsEl.innerHTML = categories
    .map((c) => `<button data-key="${c.key}" class="${c.key === activeCategory ? "active" : ""}">${c.label}</button>`)
    .join("");

  tabsEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      activeCategory = btn.dataset.key;
      renderAdminUI();
    });
  });
}

function renderActiveCategorySection() {
  const titleEl = document.getElementById("admin-active-title");
  const listEl = document.getElementById("admin-active-list");
  const category = getCategories().find((c) => c.key === activeCategory);

  if (!category) {
    titleEl.textContent = "No categories yet";
    listEl.innerHTML = `<p class="admin-empty">Create a category above to start adding products.</p>`;
    return;
  }

  titleEl.textContent = category.label;
  const items = getProducts().filter((p) => p.category === category.key);

  if (!items.length) {
    listEl.innerHTML = `<p class="admin-empty">No products in this category yet.</p>`;
    return;
  }

  listEl.innerHTML = items
    .map(
      (p) => `
      <div class="admin-product-row">
        <img src="${p.images[0] || ""}" alt="${p.name}">
        <div>
          <strong>${p.name}</strong>
          <div style="color:var(--text-muted); font-size:0.85rem;">$${p.price.toFixed(2)}</div>
        </div>
        <button class="btn btn-outline admin-edit-btn" data-id="${p.id}">Edit</button>
        <button class="btn btn-outline admin-delete-btn" data-id="${p.id}">Delete</button>
      </div>
    `
    )
    .join("");

  listEl.querySelectorAll(".admin-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openProductModal(getProductById(btn.dataset.id)));
  });
  listEl.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const product = getProductById(btn.dataset.id);
      if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
        await deleteProduct(btn.dataset.id);
        renderActiveCategorySection();
        showToast(`${product.name} deleted`);
      }
    });
  });
}

// Reads a File as a base64 data URL so it can be stored and displayed without a server
// Reads a File and shrinks it to a reasonable size/quality so it fits in localStorage
function readFileAsDataUrl(file, maxDimension = 700, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image"));
    };
    img.src = objectUrl;
  });
}

// Opens the add/edit modal. Pass null to add a new product for the given category.
function openProductModal(product, defaultCategory) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const isEdit = !!product;
  let currentImages = isEdit ? [...product.images] : [];

  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h2>${isEdit ? "Edit Product" : "Add Product"}</h2>
      <form id="product-form">
        <div class="form-group">
          <label for="p-name">Product Name</label>
          <input type="text" id="p-name" required value="${isEdit ? product.name : ""}">
        </div>
        <div class="form-group">
          <label for="p-category">Category</label>
          <select id="p-category" required>
            ${getCategories().map(
              (c) =>
                `<option value="${c.key}" ${((isEdit ? product.category : defaultCategory) === c.key) ? "selected" : ""}>${c.label}</option>`
            ).join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="p-price">Price ($)</label>
          <input type="number" id="p-price" min="0" step="0.01" required value="${isEdit ? product.price : ""}">
        </div>
        <div class="form-group">
          <label for="p-image-file">Product Images</label>
          <input type="file" id="p-image-file" accept="image/*" multiple>
          <p class="field-hint">Browse and upload one or more photos from your computer, or add an image URL below. The first image is used as the main photo.</p>
          <div class="image-url-row">
            <input type="text" id="p-image-url" placeholder="Or paste an image URL">
            <button type="button" class="btn btn-outline" id="p-image-url-add">Add URL</button>
          </div>
          <div class="image-preview-list" id="p-image-previews"></div>
        </div>
        <div class="form-group">
          <label for="p-short">Short Description (shown on product cards)</label>
          <input type="text" id="p-short" required value="${isEdit ? product.shortDescription : ""}">
        </div>
        <div class="form-group">
          <label for="p-description">Full Description (one paragraph per line)</label>
          <textarea id="p-description" rows="4" required>${isEdit ? product.description.join("\n") : ""}</textarea>
        </div>
        <div class="form-group">
          <label for="p-meta">Details (one "Label: Value" pair per line, optional)</label>
          <textarea id="p-meta" rows="3">${isEdit ? product.meta.map((m) => `${m.label}: ${m.value}`).join("\n") : ""}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">${isEdit ? "Save Changes" : "Add Product"}</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const previewsEl = overlay.querySelector("#p-image-previews");
  const renderPreviews = () => {
    previewsEl.innerHTML = currentImages
      .map(
        (src, i) => `
        <div class="thumb">
          <img src="${src}" alt="Image ${i + 1}">
          <button type="button" class="remove-image" data-index="${i}" aria-label="Remove image">&times;</button>
        </div>
      `
      )
      .join("");
    previewsEl.querySelectorAll(".remove-image").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentImages.splice(Number(btn.dataset.index), 1);
        renderPreviews();
      });
    });
  };
  renderPreviews();

  overlay.querySelector("#p-image-file").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        currentImages.push(await readFileAsDataUrl(file));
      } catch {
        showToast(`Could not read "${file.name}"`);
      }
    }
    renderPreviews();
    e.target.value = "";
  });

  overlay.querySelector("#p-image-url-add").addEventListener("click", () => {
    const urlInput = overlay.querySelector("#p-image-url");
    const url = urlInput.value.trim();
    if (!url) return;
    currentImages.push(url);
    urlInput.value = "";
    renderPreviews();
  });

  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector("#product-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentImages.length) {
      showToast("Add at least one product image");
      return;
    }

    const description = document.getElementById("p-description").value.split("\n").map((s) => s.trim()).filter(Boolean);
    const meta = document
      .getElementById("p-meta")
      .value.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split(":");
        return { label: label.trim(), value: rest.join(":").trim() };
      });

    const data = {
      name: document.getElementById("p-name").value.trim(),
      category: document.getElementById("p-category").value,
      price: parseFloat(document.getElementById("p-price").value),
      images: currentImages,
      shortDescription: document.getElementById("p-short").value.trim(),
      description,
      meta,
    };

    try {
      if (isEdit) {
        await updateProduct(product.id, data);
        showToast(`${data.name} updated`);
      } else {
        await addProduct(data);
        activeCategory = data.category;
        showToast(`${data.name} added`);
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert(
        `Couldn't save this product (${err.name}: ${err.message}).\n\n` +
          "This usually means your browser's local storage is full from large images — " +
          "try removing an image, using fewer/smaller photos, or resetting demo data."
      );
      return;
    }

    close();
    renderAdminUI();
  });
}
