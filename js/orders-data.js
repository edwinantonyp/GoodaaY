// Central order store, backed by localStorage. Populated at checkout, viewed/managed on the admin Dashboard.
const ORDERS_KEY = "goodaay_orders";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAYMENT_STATUSES = ["Unpaid", "Paid", "Refunded"];

function getOrders() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(ORDERS_KEY));
  } catch {
    stored = null;
  }
  return Array.isArray(stored) ? stored : [];
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getOrderById(id) {
  return getOrders().find((o) => o.id === id) || null;
}

function addOrder(order) {
  const orders = getOrders();
  const newOrder = {
    id: `order-${Date.now()}`,
    date: new Date().toISOString(),
    status: "Pending",
    // Cash on Delivery is paid later in person; card payments are simulated as paid immediately.
    paymentStatus: order.payment?.method === "cod" ? "Unpaid" : "Paid",
    ...order,
  };
  orders.unshift(newOrder);
  saveOrders(orders);
  return newOrder;
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  saveOrders(orders);
  return order;
}

function updatePaymentStatus(id, paymentStatus) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.paymentStatus = paymentStatus;
  saveOrders(orders);
  return order;
}

function deleteOrder(id) {
  saveOrders(getOrders().filter((o) => o.id !== id));
}
