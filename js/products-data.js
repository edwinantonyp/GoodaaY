// Central product data store, backed by Supabase when configured with a local cache fallback.
const PRODUCTS_KEY = "goodaay_products";

const DEFAULT_PRODUCTS = [
  {
    id: "soy-wax-candle-set",
    name: "Soy Wax Candle Set",
    category: "candles",
    price: 18.00,
    images: ["images/products/ph-1.svg", "images/products/ph-2.svg", "images/products/ph-3.svg"],
    shortDescription: "Hand-poured soy candles with natural scents. Set of 3.",
    description: [
      "A set of three hand-poured soy wax candles, each infused with natural essential oil blends. Made in small batches using 100% soy wax and cotton wicks, these candles burn cleanly and evenly, filling your space with warm, comforting scents.",
      "Perfect for gifting or treating yourself, each candle is hand-poured into a reusable glass jar and finished with a hand-labeled lid. Every batch is crafted with care, so subtle variations in color and texture are part of what makes each candle unique."
    ],
    meta: [
      { label: "Material", value: "100% soy wax, cotton wick, glass jar" },
      { label: "Set Includes", value: "3 candles, 4oz each" },
      { label: "Burn Time", value: "Approx. 25 hours per candle" },
      { label: "Shipping", value: "Ships in 2-4 business days" }
    ]
  },
  {
    id: "woven-wall-hanging",
    name: "Woven Wall Hanging",
    category: "textiles",
    price: 32.00,
    images: ["images/products/ph-2.svg", "images/products/ph-3.svg", "images/products/ph-4.svg"],
    shortDescription: "Handwoven macrame piece for a cozy accent wall.",
    description: [
      "This handwoven macrame wall hanging is knotted by hand using natural cotton cord, creating a soft, textured centerpiece for any wall. Its neutral tones and organic pattern bring warmth to living rooms, bedrooms, and reading nooks alike.",
      "Mounted on a smooth wooden dowel and finished with a hidden hanging cord, it's ready to display straight out of the box. Because every piece is hand-knotted, small variations in the weave add to its one-of-a-kind character."
    ],
    meta: [
      { label: "Material", value: "100% cotton cord, wooden dowel" },
      { label: "Dimensions", value: "18\" wide x 24\" long" },
      { label: "Care", value: "Spot clean, avoid direct sunlight" },
      { label: "Shipping", value: "Ships in 3-5 business days" }
    ]
  },
  {
    id: "hand-painted-ceramic-vase",
    name: "Hand-Painted Ceramic Vase",
    category: "home",
    price: 45.00,
    images: ["images/products/ph-3.svg", "images/products/ph-4.svg", "images/products/ph-5.svg"],
    shortDescription: "One-of-a-kind vase, glazed and painted by hand.",
    description: [
      "Thrown on the wheel and finished by hand, this ceramic vase features a hand-painted glaze pattern inspired by natural textures. Its curved silhouette and matte-glossy finish make it a striking centerpiece for fresh or dried arrangements.",
      "Each vase is fired twice for durability and hand-painted individually, meaning brushstrokes and glaze pooling will vary slightly from piece to piece — a signature of true handmade ceramics."
    ],
    meta: [
      { label: "Material", value: "Stoneware ceramic, food-safe glaze" },
      { label: "Dimensions", value: "9\" tall x 5\" diameter" },
      { label: "Care", value: "Hand wash only" },
      { label: "Shipping", value: "Ships in 3-5 business days, carefully packed" }
    ]
  },
  {
    id: "beaded-bracelet-trio",
    name: "Beaded Bracelet Trio",
    category: "jewelry",
    price: 14.00,
    images: ["images/products/ph-4.svg", "images/products/ph-5.svg", "images/products/ph-6.svg"],
    shortDescription: "Handmade beaded bracelets, set of 3, mix & match colors.",
    description: [
      "A set of three handmade beaded bracelets designed to be stacked, mixed, and matched. Strung on durable elastic cord with a mix of glass and natural stone beads, each bracelet is lightweight and comfortable for everyday wear.",
      "These bracelets make a lovely gift or a treat-yourself pick-me-up, and the stretch design means one size fits most wrists without any clasps to fuss with."
    ],
    meta: [
      { label: "Material", value: "Glass beads, natural stone, elastic cord" },
      { label: "Set Includes", value: "3 stackable bracelets" },
      { label: "Fit", value: "One size fits most (stretch)" },
      { label: "Shipping", value: "Ships in 2-3 business days" }
    ]
  },
  {
    id: "woven-storage-basket",
    name: "Woven Storage Basket",
    category: "home",
    price: 28.00,
    images: ["images/products/ph-5.svg", "images/products/ph-6.svg", "images/products/ph-1.svg"],
    shortDescription: "Durable, handwoven basket for stylish storage.",
    description: [
      "This sturdy, handwoven basket combines everyday function with rustic style. Woven from natural seagrass fibers, it's ideal for organizing blankets, magazines, toys, or plants while adding warm, textured decor to any room.",
      "Reinforced handles make it easy to carry from room to room, and the tightly woven base keeps its shape even when fully loaded."
    ],
    meta: [
      { label: "Material", value: "Natural seagrass, reinforced handles" },
      { label: "Dimensions", value: "14\" wide x 10\" tall" },
      { label: "Care", value: "Wipe clean with a dry cloth" },
      { label: "Shipping", value: "Ships in 3-5 business days" }
    ]
  },
  {
    id: "ceramic-oil-lamp",
    name: "Ceramic Oil Lamp",
    category: "candles",
    price: 22.00,
    images: ["images/products/ph-6.svg", "images/products/ph-1.svg", "images/products/ph-2.svg"],
    shortDescription: "Handcrafted ceramic oil lamp with rustic glaze finish.",
    description: [
      "This handcrafted ceramic oil lamp brings soft, flickering ambiance to any tabletop or shelf. Finished with a rustic reactive glaze, no two lamps have the exact same coloring, making each one a genuine one-of-a-kind piece.",
      "Simply fill with lamp oil and light the wick for a cozy glow that lasts for hours — a beautiful alternative to traditional candles for dinner tables, patios, and quiet evenings in."
    ],
    meta: [
      { label: "Material", value: "Glazed stoneware ceramic" },
      { label: "Dimensions", value: "5\" tall x 4\" diameter" },
      { label: "Includes", value: "Cotton wick (oil sold separately)" },
      { label: "Shipping", value: "Ships in 2-4 business days, carefully packed" }
    ]
  },
  {
    id: "wire-wrapped-ring",
    name: "Wire-Wrapped Ring",
    category: "jewelry",
    price: 16.00,
    images: ["images/products/ph-1.svg", "images/products/ph-3.svg", "images/products/ph-5.svg"],
    shortDescription: "Delicate handmade wire-wrapped ring with natural stone.",
    description: [
      "Each ring is hand-formed from tarnish-resistant wire, carefully wrapped around a genuine natural stone to create a delicate, organic setting. No two stones are exactly alike, so your ring will have its own unique color and pattern.",
      "Lightweight and comfortable for daily wear, this ring pairs beautifully with other pieces from our jewelry collection or stands alone as a simple, elegant accent."
    ],
    meta: [
      { label: "Material", value: "Tarnish-resistant wire, natural stone" },
      { label: "Sizing", value: "Adjustable, fits most ring sizes" },
      { label: "Care", value: "Avoid water and lotions" },
      { label: "Shipping", value: "Ships in 2-3 business days" }
    ]
  },
  {
    id: "embroidered-cushion-cover",
    name: "Embroidered Cushion Cover",
    category: "textiles",
    price: 24.00,
    images: ["images/products/ph-2.svg", "images/products/ph-4.svg", "images/products/ph-6.svg"],
    shortDescription: "Hand-embroidered cushion cover, cotton fabric.",
    description: [
      "This cushion cover features a hand-embroidered pattern stitched onto soft, durable cotton fabric. The detailed threadwork adds texture and warmth to sofas, armchairs, and beds, making it an easy way to refresh any room.",
      "Finished with a hidden zip closure, it fits standard 18\"x18\" inserts snugly and holds up well to everyday use."
    ],
    meta: [
      { label: "Material", value: "100% cotton, hand embroidery" },
      { label: "Dimensions", value: "18\" x 18\" (insert not included)" },
      { label: "Care", value: "Machine wash cold, gentle cycle" },
      { label: "Shipping", value: "Ships in 2-4 business days" }
    ]
  },
  {
    id: "hand-thrown-plant-pot",
    name: "Hand-Thrown Plant Pot",
    category: "home",
    price: 20.00,
    images: ["images/products/ph-3.svg", "images/products/ph-5.svg", "images/products/ph-1.svg"],
    shortDescription: "Small ceramic pot, perfect for succulents and herbs.",
    description: [
      "This small ceramic pot is thrown by hand on the pottery wheel, finished with a smooth glaze, and sized perfectly for succulents, herbs, and other small plants. Its simple, rounded shape suits any windowsill or shelf.",
      "A drainage hole in the base helps keep roots healthy, and the compact size makes it easy to fit in tight spaces without sacrificing style."
    ],
    meta: [
      { label: "Material", value: "Glazed stoneware ceramic" },
      { label: "Dimensions", value: "4\" tall x 4.5\" diameter" },
      { label: "Features", value: "Drainage hole included" },
      { label: "Shipping", value: "Ships in 2-4 business days, carefully packed" }
    ]
  }
];

const CATEGORY_LABELS = {
  home: "Home Decor",
  candles: "Candles",
  textiles: "Textiles",
  jewelry: "Jewelry"
};

// NOTE: category labels are now managed dynamically via js/categories-data.js.
// CATEGORY_LABELS above remains only as a fallback for the original demo categories.

function getProducts() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
  } catch {
    stored = null;
  }
  if (!Array.isArray(stored)) {
    stored = DEFAULT_PRODUCTS.map((p) => ({ ...p }));
    saveProducts(stored);
  }
  return stored;
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function parseProductValue(value, fallback) {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function fromSupabaseProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    shortDescription: product.short_description,
    images: parseProductValue(product.images, []),
    description: parseProductValue(product.description, []),
    meta: parseProductValue(product.meta, []),
  };
}

function toSupabaseProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    images: JSON.stringify(product.images),
    short_description: product.shortDescription,
    description: JSON.stringify(product.description),
    meta: JSON.stringify(product.meta),
  };
}

async function initializeProducts() {
  if (!hasSupabaseConfig()) return getProducts();
  const localProducts = getProducts();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=name`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!response.ok) throw new Error(`Products request failed (${response.status})`);
  let products = (await response.json()).map(fromSupabaseProduct);

  const knownIds = new Set(products.map((product) => product.id));
  const missingProducts = localProducts.filter((product) => !knownIds.has(product.id));
  if (missingProducts.length) {
    const seedResponse = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(missingProducts.map(toSupabaseProduct)),
    });
    if (seedResponse.ok) {
      products = [...products, ...missingProducts];
    } else {
      const retryResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=name`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!retryResponse.ok) throw new Error(`Products sync failed (${seedResponse.status})`);
      products = (await retryResponse.json()).map(fromSupabaseProduct);
    }
  }

  saveProducts(products);
  return products;
}

function getProductById(id) {
  return getProducts().find((p) => p.id === id) || null;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function addProduct(product) {
  const products = getProducts();
  let id = slugify(product.name);
  let suffix = 2;
  while (products.some((p) => p.id === id)) {
    id = `${slugify(product.name)}-${suffix++}`;
  }
  const newProduct = { ...product, id };
  if (hasSupabaseConfig()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(toSupabaseProduct(newProduct)),
    });
    if (!response.ok) throw new Error(`Product save failed (${response.status})`);
  }
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

async function updateProduct(id, updates) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates, id };
  if (hasSupabaseConfig()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toSupabaseProduct(products[index])),
    });
    if (!response.ok) throw new Error(`Product update failed (${response.status})`);
  }
  saveProducts(products);
  return products[index];
}

async function deleteProduct(id) {
  if (hasSupabaseConfig()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error(`Product delete failed (${response.status})`);
  }
  saveProducts(getProducts().filter((p) => p.id !== id));
}

async function resetProductsToDefault() {
  if (hasSupabaseConfig()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error(`Product reset failed (${response.status})`);
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(DEFAULT_PRODUCTS.map(toSupabaseProduct)),
    });
    if (!insertResponse.ok) throw new Error(`Default products save failed (${insertResponse.status})`);
  }
  saveProducts(DEFAULT_PRODUCTS.map((p) => ({ ...p })));
}
