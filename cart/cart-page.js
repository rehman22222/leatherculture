(function () {
  const Cart = window.LeatherCultureCart;
  const root = document.getElementById("cart-root");
  const apiBase = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");

  function esc(value) {
    return String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }

  function render() {
    const items = Cart.read();
    const t = Cart.totals(items);
    if (!items.length) {
      root.innerHTML = `<div class="card empty"><h2>Your cart is empty</h2><p>Browse the collection and add something you love.</p><a class="btn" style="max-width:280px;margin:14px auto 0" href="/shop">Shop the collection</a></div>`;
      return;
    }
    root.innerHTML = `
      <div class="layout">
        <section class="card">
          ${items
            .map(
              (item) => `
            <div class="line" data-key="${esc(Cart.key(item))}">
              <img src="${esc(Cart.mediaUrl(item.image) || "/assets/brand/leather-culture-mark.png")}" alt="">
              <div>
                <div class="name">${esc(item.name)}</div>
                ${item.variantName ? `<div class="variant">Colour: ${esc(item.variantName)}</div>` : ""}
                <div class="qty"><button type="button" data-dec aria-label="Decrease">−</button><span>${item.qty}</span><button type="button" data-inc aria-label="Increase">+</button></div>
                <div><button type="button" class="remove" data-remove>Remove</button></div>
              </div>
              <div class="price">${Cart.money(item.unitPrice * item.qty)}<div class="muted" style="font-weight:400;font-size:12px">${Cart.money(item.unitPrice)} each</div></div>
            </div>`
            )
            .join("")}
        </section>
        <aside class="card summary">
          <h2>Order summary</h2>
          <div class="row"><span>Subtotal (${t.count} item${t.count === 1 ? "" : "s"})</span><span>${Cart.money(t.subtotal)}</span></div>
          <div class="row"><span>Delivery</span><span>${t.shipping ? Cart.money(t.shipping) : "Free"}</span></div>
          <div class="row total"><span>Total</span><span>${Cart.money(t.total)}</span></div>
          ${t.freeFrom && t.shipping ? `<div class="note">Free delivery on orders over ${Cart.money(t.freeFrom)}.</div>` : ""}
          <div class="note">Payment: Cash on Delivery.</div>
          <a class="btn" style="margin-top:16px" href="/checkout">Proceed to checkout</a>
          <a class="btn ghost" style="margin-top:10px" href="/shop">Continue shopping</a>
        </aside>
      </div>`;

    root.querySelectorAll(".line").forEach((line) => {
      const key = line.dataset.key;
      const item = items.find((entry) => Cart.key(entry) === key);
      line.querySelector("[data-inc]").addEventListener("click", () => Cart.update(key, item.qty + 1));
      line.querySelector("[data-dec]").addEventListener("click", () => Cart.update(key, item.qty - 1));
      line.querySelector("[data-remove]").addEventListener("click", () => Cart.remove(key));
    });
  }

  Cart.onChange(render);
  render();
  // shipping rules / currency come from the store settings
  fetch(`${apiBase}/api/storefront/settings`, { credentials: "include" })
    .then((response) => (response.ok ? response.json() : null))
    .then((settings) => {
      if (settings) {
        Cart.configure(settings);
        render();
      }
    })
    .catch(() => {});
})();
