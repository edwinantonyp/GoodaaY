// Orders dashboard: lists placed orders; clicking one opens its full details in a new window.
document.addEventListener("DOMContentLoaded", () => {
  setupAdminLoginGate(renderOrdersList);

  document.getElementById("orders-select-all").addEventListener("change", (e) => {
    document.querySelectorAll(".order-select").forEach((cb) => (cb.checked = e.target.checked));
  });

  document.getElementById("orders-export-selected").addEventListener("click", async () => {
    const ids = Array.from(document.querySelectorAll(".order-select:checked")).map((cb) => cb.dataset.id);
    if (!ids.length) {
      alert("Select at least one order to export.");
      return;
    }
    const orders = (await getOrders()).filter((o) => ids.includes(o.id));
    downloadOrdersCsv(orders, orders.length === 1 ? `order-${orders[0].id.slice(-6)}.csv` : "orders-export.csv");
  });

  document.getElementById("orders-delete-selected").addEventListener("click", async () => {
    const ids = Array.from(document.querySelectorAll(".order-select:checked")).map((cb) => cb.dataset.id);
    if (!ids.length) {
      alert("Select at least one order to delete.");
      return;
    }
    const message = ids.length === 1 ? "Delete the selected order? This cannot be undone." : `Delete these ${ids.length} selected orders? This cannot be undone.`;
    if (!confirm(message)) return;

    try {
      for (const id of ids) {
        await deleteOrder(id);
      }
      document.getElementById("orders-select-all").checked = false;
      await renderOrdersList();
      showToast(`${ids.length} order${ids.length === 1 ? "" : "s"} deleted`);
    } catch (error) {
      console.error("Delete selected orders failed:", error);
      alert(`Couldn't delete selected orders (${error.name}: ${error.message}).`);
    }
  });
});

async function renderOrdersList() {
  const listEl = document.getElementById("orders-list");
  const emptyEl = document.getElementById("orders-empty");
  let orders;
  try {
    orders = await getOrders();
  } catch (error) {
    console.error("Load orders failed:", error);
    emptyEl.style.display = "block";
    emptyEl.textContent = `Unable to load orders. ${error.message}`;
    listEl.innerHTML = "";
    return;
  }

  if (!orders.length) {
    emptyEl.style.display = "block";
    listEl.innerHTML = "";
    return;
  }
  emptyEl.style.display = "none";

  listEl.innerHTML = orders
    .map((order) => {
      const placedOn = new Date(order.date).toLocaleString();
      const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
      const paymentLabel = formatPaymentLabel(order.payment);

      return `
        <div class="order-card order-row" data-id="${order.id}" role="button" tabindex="0">
          <div class="order-card-header" style="margin-bottom:0; padding-bottom:0; border-bottom:none;">
            <div style="display:flex; align-items:flex-start; gap:0.8rem;">
              <input type="checkbox" class="order-select" data-id="${order.id}" style="margin-top:0.3rem;">
              <div>
                <strong>Order ID: ${order.id}</strong>
                <div style="color:var(--text-muted); font-size:0.85rem;">
                  ${order.customer.name} &middot; ${itemCount} item${itemCount === 1 ? "" : "s"} &middot; ${paymentLabel} &middot; Placed ${placedOn}
                </div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.7rem;">
              <span class="price" style="margin:0;">$${order.total.toFixed(2)}</span>
              <div style="display:flex; align-items:center; gap:0.7rem;">
                <select class="payment-status-select" data-id="${order.id}">
                  ${PAYMENT_STATUSES.map((s) => `<option value="${s}" ${s === (order.paymentStatus || "Unpaid") ? "selected" : ""}>${s}</option>`).join("")}
                </select>
                <select class="order-status-select" data-id="${order.id}">
                  ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`).join("")}
                </select>
              </div>
              <div style="display:flex; gap:0.7rem;">
                <button class="btn btn-outline order-export-btn" data-id="${order.id}">Export</button>
                <button class="btn btn-outline order-delete-btn" data-id="${order.id}">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll(".order-status-select").forEach((select) => {
    select.addEventListener("click", (e) => e.stopPropagation());
    select.addEventListener("change", async () => {
      await updateOrderStatus(select.dataset.id, select.value);
      showToast("Order status updated");
    });
  });

  listEl.querySelectorAll(".payment-status-select").forEach((select) => {
    select.addEventListener("click", (e) => e.stopPropagation());
    select.addEventListener("change", async () => {
      await updatePaymentStatus(select.dataset.id, select.value);
      showToast("Payment status updated");
    });
  });

  listEl.querySelectorAll(".order-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const order = await getOrderById(btn.dataset.id);
      if (confirm(`Delete order ${order.id} from ${order.customer.name}? This cannot be undone.`)) {
        await deleteOrder(btn.dataset.id);
        renderOrdersList();
        showToast("Order deleted");
      }
    });
  });

  listEl.querySelectorAll(".order-export-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const order = await getOrderById(btn.dataset.id);
      downloadOrdersCsv([order], `order-${order.id.slice(-6)}.csv`);
    });
  });

  listEl.querySelectorAll(".order-select").forEach((cb) => {
    cb.addEventListener("click", (e) => e.stopPropagation());
  });

  listEl.querySelectorAll(".order-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("select, button, input")) return;
      window.open(`order-detail.html?id=${encodeURIComponent(row.dataset.id)}`, "_blank");
    });
    row.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !e.target.closest("select, button, input")) {
        e.preventDefault();
        window.open(`order-detail.html?id=${encodeURIComponent(row.dataset.id)}`, "_blank");
      }
    });
  });
}

// Turns a stored payment object into a short display string, e.g. "Card ending in 1234"
function formatPaymentLabel(payment) {
  if (!payment) return "Payment: N/A";
  if (payment.method === "card") return `Card ending in ${payment.cardLast4}`;
  if (payment.method === "cod") return "Cash on Delivery";
  return payment.method;
}

// Escapes a value for safe inclusion in a CSV cell
function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// Builds CSV text (one row per order) and triggers a browser download
function downloadOrdersCsv(orders, filename) {
  const headers = ["Order ID", "Date", "Status", "Payment Method", "Payment Status", "Customer Name", "Email", "Phone", "Address", "City", "ZIP", "Notes", "Items", "Total"];
  const rows = orders.map((order) => {
    const itemsSummary = order.items.map((item) => `${item.qty} x ${item.name} @ $${item.price.toFixed(2)}`).join("; ");
    return [
      order.id,
      new Date(order.date).toLocaleString(),
      order.status,
      formatPaymentLabel(order.payment),
      order.paymentStatus || "Unpaid",
      order.customer.name,
      order.customer.email,
      order.customer.phone,
      order.customer.address,
      order.customer.city,
      order.customer.zip,
      order.customer.notes || "",
      itemsSummary,
      order.total.toFixed(2),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

