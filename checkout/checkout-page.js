(function () {
  const Cart = window.LeatherCultureCart;
  const root = document.getElementById("checkout-root");
  const apiBase = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");
  const DRAFT_KEY = "lc_checkout_draft";
  let settings = null;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }

  function draft() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function whatsappLink(order) {
    const number = String((settings && settings.checkout && settings.checkout.whatsapp) || "").replace(/[^\d]/g, "");
    if (!number) return "";
    const lines = order.items.map((item) => `- ${item.name}${item.variantName ? ` (${item.variantName})` : ""} x${item.qty}`);
    const text = `Hi LeatherCulture, I just placed order ${order.id}.\n${lines.join("\n")}\nTotal: ${Cart.money(order.total)} (Cash on Delivery)\nName: ${order.customer.name}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}, ${order.customer.city}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }

  function renderSuccess(order) {
    const wa = whatsappLink(order);
    root.innerHTML = `
      <div class="card success">
        <div class="check">✓</div>
        <h2>Thank you, ${esc(order.customer.name.split(" ")[0])}! Your order is placed.</h2>
        <div class="id">Order ${esc(order.id)}</div>
        <p class="muted">We'll call ${esc(order.customer.phone)} to confirm before dispatch. Pay ${Cart.money(order.total)} in cash on delivery.</p>
        <div class="card" style="text-align:left;max-width:520px;margin:22px auto 0">
          ${order.items.map((item) => `<div class="line"><img src="${esc(Cart.mediaUrl(item.image) || "/assets/brand/leather-culture-mark.png")}" alt=""><div><div class="name">${esc(item.name)}</div>${item.variantName ? `<div class="variant">Colour: ${esc(item.variantName)}</div>` : ""}<div class="muted">Qty ${item.qty}</div></div><div class="price">${Cart.money(item.lineTotal)}</div></div>`).join("")}
          <div class="summary"><div class="row"><span>Delivery</span><span>${order.shipping ? Cart.money(order.shipping) : "Free"}</span></div><div class="row total"><span>Total</span><span>${Cart.money(order.total)}</span></div></div>
        </div>
        <div class="actions">
          ${wa ? `<a class="btn wa" href="${esc(wa)}" target="_blank" rel="noopener">Send order on WhatsApp</a>` : ""}
          <a class="btn ghost" href="/shop">Continue shopping</a>
        </div>
      </div>`;
    window.scrollTo(0, 0);
  }

  function render() {
    const items = Cart.read();
    const t = Cart.totals(items);
    const d = draft();
    if (!items.length) {
      root.innerHTML = `<div class="card empty"><h2>Your cart is empty</h2><p>Add a product before checking out.</p><a class="btn" style="max-width:280px;margin:14px auto 0" href="/shop">Shop the collection</a></div>`;
      return;
    }
    const cod = settings && settings.checkout ? settings.checkout : {};
    root.innerHTML = `
      <form id="checkout" class="layout" novalidate>
        <section>
          <div class="card">
            <h2>Delivery details</h2>
            <div class="grid2">
              <label>Full name<input name="name" required autocomplete="name" value="${esc(d.name)}"></label>
              <label>Phone (WhatsApp preferred)<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="03XX XXXXXXX" value="${esc(d.phone)}"></label>
            </div>
            <label>Email (optional)<input name="email" type="email" autocomplete="email" value="${esc(d.email)}"></label>
            <label>Delivery address<textarea name="address" required autocomplete="street-address" placeholder="House, street, area">${esc(d.address)}</textarea></label>
            <div class="grid2">
              <label>City<input name="city" required autocomplete="address-level2" value="${esc(d.city)}"></label>
              <label>Order notes (optional)<input name="notes" placeholder="Size, delivery time, etc." value="${esc(d.notes)}"></label>
            </div>
          </div>
          <div class="card" style="margin-top:18px">
            <h2>Payment</h2>
            <div class="pay">
              <input type="radio" checked readonly style="width:auto;margin-top:4px">
              <div><b>Cash on Delivery</b><small>${esc(cod.codNote || "Pay in cash when your order arrives.")}</small></div>
            </div>
          </div>
        </section>
        <aside class="card summary">
          <h2>Your order</h2>
          ${items.map((item) => `<div class="row"><span>${esc(item.name)}${item.variantName ? ` <span class="muted">(${esc(item.variantName)})</span>` : ""} × ${item.qty}</span><span>${Cart.money(item.unitPrice * item.qty)}</span></div>`).join("")}
          <div class="row" style="border-top:1px solid var(--line);margin-top:8px;padding-top:12px"><span>Subtotal</span><span>${Cart.money(t.subtotal)}</span></div>
          <div class="row"><span>Delivery</span><span>${t.shipping ? Cart.money(t.shipping) : "Free"}</span></div>
          <div class="row total"><span>Total</span><span>${Cart.money(t.total)}</span></div>
          <div class="error" id="error"></div>
          <button class="btn" type="submit" id="place">Place order · ${Cart.money(t.total)}</button>
          <a class="btn ghost" style="margin-top:10px" href="/cart">Edit cart</a>
          <div class="note">By placing the order you agree to pay in cash on delivery.</div>
        </aside>
      </form>`;

    const form = root.querySelector("#checkout");
    form.addEventListener("input", () => {
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch (error) {
        /* ignore */
      }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = root.querySelector("#error");
      const button = root.querySelector("#place");
      const customer = Object.fromEntries(new FormData(form).entries());
      const missing = ["name", "phone", "address", "city"].find((field) => !String(customer[field] || "").trim());
      if (missing) {
        error.textContent = "Please fill in your name, phone, address and city.";
        form.querySelector(`[name="${missing}"]`).focus();
        return;
      }
      error.textContent = "";
      button.disabled = true;
      button.textContent = "Placing order…";
      try {
        const response = await fetch(`${apiBase}/api/orders`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ customer, items: Cart.read().map((item) => ({ slug: item.slug, variantId: item.variantId, qty: item.qty })) })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Could not place the order. Please try again.");
        Cart.clear();
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (e) {
          /* ignore */
        }
        renderSuccess(payload.order);
      } catch (err) {
        error.textContent = err.message;
        button.disabled = false;
        button.textContent = `Place order · ${Cart.money(t.total)}`;
      }
    });
  }

  render();
  fetch(`${apiBase}/api/storefront/settings`, { credentials: "include" })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data) {
        settings = data;
        Cart.configure(data);
        render();
      }
    })
    .catch(() => {});
})();
