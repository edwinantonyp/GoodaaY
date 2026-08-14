// Central category store, backed by localStorage so admin edits reflect on customer pages.
const CATEGORIES_KEY = "goodaay_categories";

const DEFAULT_CATEGORIES = [
  { key: "home", label: "Home Decor" },
  { key: "candles", label: "Candles" },
  { key: "textiles", label: "Textiles" },
  { key: "jewelry", label: "Jewelry" },
];

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

function getCategoryLabel(key) {
  const found = getCategories().find((c) => c.key === key);
  return found ? found.label : key;
}

function addCategory(label) {
  const categories = getCategories();
  let key = slugify(label);
  let suffix = 2;
  while (categories.some((c) => c.key === key)) {
    key = `${slugify(label)}-${suffix++}`;
  }
  const newCategory = { key, label };
  categories.push(newCategory);
  saveCategories(categories);
  return newCategory;
}

function deleteCategory(key) {
  saveCategories(getCategories().filter((c) => c.key !== key));
}

function resetCategoriesToDefault() {
  saveCategories(DEFAULT_CATEGORIES.map((c) => ({ ...c })));
}
