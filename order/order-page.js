/* Order status page, opened from the link in the confirmation email. */
(function () {
  "use strict";

  const root = document.getElementById("order-root");
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "";
  const token = params.get("t") || "";

  const STEPS = [
    { key: "new", label: "Order received" },
    { key: "confirmed", label: "Being prepared" },
    { key: "shipped", label: "On its way" },
    { key: "delivered", label: "Delivered" },
  ];

  function api(path) {
    const base = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");
    return base + path;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function money(amount, currency) {
    return `${currency || "Rs"} ${Math.round(Number(amount) || 0).toLocaleString("en-PK")}`;
  }

  function timeline(order) {
    if (order.status === "cancelled") {
      return `<div class="card"><h2>This order was cancelled</h2><p class="muted">Nothing is due. If that was not what you wanted, <a href="/contact">message us</a> and we will place it again.</p></div>`;
    }
    const reached = STEPS.findIndex((step) => step.key === order.status);
    return `<div class="card"><h2>Progress</h2><ol class="track">${STEPS.map(
      (step, index) =>
        `<li class="${index <= reached ? "done" : ""}"><span></span>${escapeHtml(step.label)}</li>`
    ).join("")}</ol>${
      order.courier || order.trackingNumber
        ? `<p class="summary note">${escapeHtml([order.courier, order.trackingNumber].filter(Boolean).join(" · "))}${
            order.trackingUrl ? ` — <a href="${escapeHtml(order.trackingUrl)}" target="_blank" rel="noopener">track parcel</a>` : ""
          }</p>`
        : ""
    }</div>`;
  }

  function show(order) {
    const c = order.customer || {};
    root.innerHTML = `
      <h1>Order ${escapeHtml(order.id)}</h1>
      <p class="muted">Placed ${escapeHtml(new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }))} · cash on delivery</p>
      <div class="layout" style="margin-top:22px">
        <div>
          ${timeline(order)}
          <div class="card" style="margin-top:20px">
            <h2>Your items</h2>
            ${order.items
              .map(
                (item) => `<div class="line">
                  <img src="${escapeHtml(item.image || "/assets/brand/leather-culture-mark.png")}" alt="">
                  <div><div class="name">${escapeHtml(item.name)}</div>
                  <div class="variant">${escapeHtml(item.variantName || "")}${item.qty > 1 ? ` · ${item.qty} pieces` : ""}</div></div>
                  <div class="price">${money(item.lineTotal, order.currency)}</div>
                </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="card summary">
          <h2>Summary</h2>
          <div class="row"><span>Subtotal</span><span>${money(order.subtotal, order.currency)}</span></div>
          <div class="row"><span>Delivery</span><span>${order.shipping ? money(order.shipping, order.currency) : "Free"}</span></div>
          <div class="row total"><span>To pay on delivery</span><span>${money(order.total, order.currency)}</span></div>
          <p class="note">Delivering to ${escapeHtml(c.name || "")}, ${escapeHtml(c.address || "")}, ${escapeHtml(c.city || "")}.</p>
          <p class="note">You can check the parcel before paying the courier.</p>
          <a class="btn ghost" href="/contact" style="margin-top:14px">Need help with this order</a>
        </div>
      </div>`;
  }

  async function load() {
    if (!id || !token) {
      root.innerHTML = `<div class="empty"><h1>We need your order link</h1><p class="muted">Please open the link from your confirmation email.</p><p><a class="btn ghost" href="/contact" style="max-width:260px;margin:18px auto 0">Contact us</a></p></div>`;
      return;
    }
    try {
      const response = await fetch(api(`/api/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load this order.");
      show(data);
    } catch (error) {
      root.innerHTML = `<div class="empty"><h1>We could not open that order</h1><p class="muted">${escapeHtml(error.message)}</p><p><a class="btn ghost" href="/contact" style="max-width:260px;margin:18px auto 0">Contact us</a></p></div>`;
    }
  }

  load();
  // a customer may keep this tab open while we dispatch, so refresh when they come back to it
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
})();
