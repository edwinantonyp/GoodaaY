// Central order store. Supabase is used when configured; localStorage remains a local-dev fallback.
const ORDERS_KEY = "goodaay_orders";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAYMENT_STATUSES = ["Unpaid", "Paid", "Refunded"];

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorText}`);
  }
  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}

function getLocalOrders() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(ORDERS_KEY));
  } catch {
    stored = null;
  }
  return Array.isArray(stored) ? stored : [];
}

function saveLocalOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function fromSupabaseOrder(order) {
  return {
    id: order.id,
    date: order.date,
    status: order.status,
    paymentStatus: order.payment_status,
    customer: order.customer,
    payment: order.payment,
    items: order.items,
    total: Number(order.total),
  };
}

function toSupabaseOrder(order) {
  return {
    id: order.id,
    date: order.date,
    status: order.status,
    payment_status: order.paymentStatus,
    customer: order.customer,
    payment: order.payment,
    items: order.items,
    total: order.total,
  };
}

async function getOrders() {
  if (hasSupabaseConfig()) {
    const orders = await supabaseRequest("orders?select=*&order=date.desc");
    return orders.map(fromSupabaseOrder);
  }
  return getLocalOrders();
}

async function getOrderById(id) {
  if (hasSupabaseConfig()) {
    const orders = await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}&select=*`);
    return orders.length ? fromSupabaseOrder(orders[0]) : null;
  }
  return getLocalOrders().find((o) => o.id === id) || null;
}

async function addOrder(order) {
  const newOrder = {
    id: `order-${Date.now()}`,
    date: new Date().toISOString(),
    status: "Pending",
    // Cash on Delivery is paid later in person; card payments are simulated as paid immediately.
    paymentStatus: order.payment?.method === "cod" ? "Unpaid" : "Paid",
    ...order,
  };

  if (hasSupabaseConfig()) {
    await supabaseRequest("orders", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(toSupabaseOrder(newOrder)),
    });
  } else {
    const orders = getLocalOrders();
    orders.unshift(newOrder);
    saveLocalOrders(orders);
  }
  return newOrder;
}

async function updateOrderStatus(id, status) {
  if (hasSupabaseConfig()) {
    await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return getOrderById(id);
  }
  const orders = getLocalOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  saveLocalOrders(orders);
  return order;
}

async function updatePaymentStatus(id, paymentStatus) {
  if (hasSupabaseConfig()) {
    await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
    return getOrderById(id);
  }
  const orders = getLocalOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.paymentStatus = paymentStatus;
  saveLocalOrders(orders);
  return order;
}

async function deleteOrder(id) {
  if (hasSupabaseConfig()) {
    await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return;
  }
  saveLocalOrders(getLocalOrders().filter((o) => o.id !== id));
}
