// Central category store, backed by Supabase when configured with a local cache fallback.
const CATEGORIES_KEY = "goodaay_categories";

const DEFAULT_CATEGORIES = [
  { key: "home", label: "Home Decor" },
  { key: "candles", label: "Candles" },
  { key: "textiles", label: "Textiles" },
  { key: "jewelry", label: "Jewelry" },
];

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getCategories() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(CATEGORIES_KEY));
  } catch {
    stored = null;
  }
  if (!Array.isArray(stored)) {
    stored = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
    saveCategories(stored);
  }
  return stored;
}

function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

async function initializeCategories() {
  if (!hasSupabaseConfig()) return getCategories();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=key,label&order=label`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`Categories request failed (${response.status})`);
  const categories = await response.json();
  saveCategories(categories);
  return categories;
}

function getCategoryLabel(key) {
  const found = getCategories().find((c) => c.key === key);
  return found ? found.label : key;
}

async function addCategory(label) {
  const categories = getCategories();
  let key = slugify(label);
  let suffix = 2;
  while (categories.some((c) => c.key === key)) {
    key = `${slugify(label)}-${suffix++}`;
  }
  const newCategory = { key, label };
  if (hasSupabaseConfig()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(newCategory),
    });
    if (!response.ok) throw new Error(`Category save failed (${response.status})`);
  }
  categories.push(newCategory);
  saveCategories(categories);
  return newCategory;
}

async function deleteCategory(key) {
  if (hasSupabaseConfig()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?key=eq.${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error(`Category delete failed (${response.status})`);
  }
  saveCategories(getCategories().filter((c) => c.key !== key));
}

async function resetCategoriesToDefault() {
  if (hasSupabaseConfig()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error(`Category reset failed (${response.status})`);
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(DEFAULT_CATEGORIES),
    });
    if (!insertResponse.ok) throw new Error(`Default categories save failed (${insertResponse.status})`);
  }
  saveCategories(DEFAULT_CATEGORIES.map((c) => ({ ...c })));
}
