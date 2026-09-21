/* LeatherCulture cart: localStorage-backed, shared by the storefront pages, /cart and /checkout. */
(function () {
  const STORAGE_KEY = "lc_cart_v1";
  const apiBase = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");
  let checkout = { currency: "Rs", shippingFee: 0, freeShippingFrom: 0, cartButton: "Add to cart", addedButton: "Added - view cart" };
  const listeners = new Set();

  function read() {
    try {
      const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(items) ? items.filter((item) => item && item.slug) : [];
    } catch (error) {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      /* private mode: cart lives for this page only */
    }
    listeners.forEach((fn) => fn(items));
    renderPill();
  }

  function parsePrice(value) {
    const match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function money(amount) {
    const number = Math.round(Number(amount) || 0);
    return `${checkout.currency || "Rs"} ${number.toLocaleString("en-PK")}`;
  }

  function mediaUrl(value) {
    if (!value) return value;
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    if (apiBase && value.startsWith("/assets/uploads/")) return `${apiBase}${value}`;
    return value;
  }

  function key(item) {
    return `${item.slug}::${item.variantId || ""}`;
  }

  function add(product, variant, qty = 1) {
    const items = read();
    const line = {
      slug: product.slug || product.id,
      name: product.name,
      price: product.price,
      unitPrice: parsePrice(product.price),
      variantId: variant ? variant.id || variant.name : "",
      variantName: variant ? variant.name : "",
      image: (variant && variant.image) || product.image || "",
      qty: Math.max(1, Math.round(qty))
    };
    const existing = items.find((item) => key(item) === key(line));
    if (existing) existing.qty = Math.min(20, existing.qty + line.qty);
    else items.push(line);
    write(items);
    return items;
  }

  function update(itemKey, qty) {
    const items = read().map((item) => (key(item) === itemKey ? { ...item, qty: Math.min(20, Math.max(0, Math.round(qty))) } : item)).filter((item) => item.qty > 0);
    write(items);
    return items;
  }

  function remove(itemKey) {
    write(read().filter((item) => key(item) !== itemKey));
  }

  function clear() {
    write([]);
  }

  function totals(items = read()) {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const freeFrom = Number(checkout.freeShippingFrom) || 0;
    const shipping = !items.length ? 0 : freeFrom && subtotal >= freeFrom ? 0 : Number(checkout.shippingFee) || 0;
    return { subtotal, shipping, total: subtotal + shipping, count: items.reduce((sum, item) => sum + item.qty, 0), freeFrom };
  }

  function configure(settings) {
    if (settings && settings.checkout) checkout = { ...checkout, ...settings.checkout };
    renderPill();
  }

  /* floating cart pill (hidden on the cart/checkout pages themselves) */
  let pill = null;
  function renderPill() {
    if (/^\/(cart|checkout)\/?$/.test(location.pathname) || !document.body) return;
    const { count } = totals();
    if (!pill) {
      pill = document.createElement("a");
      pill.className = "lc-cart-pill";
      pill.href = "/cart";
      pill.setAttribute("aria-label", "Cart");
      document.body.appendChild(pill);
    }
    pill.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg><span>Cart</span><b>${count}</b>`;
    pill.classList.toggle("is-empty", count === 0);
  }

  /* product page: turn the template's "Order Now" link into add-to-cart */
  function bindProductButton(button, product, getVariant) {
    if (!button || button.dataset.lcCartBound) return;
    button.dataset.lcCartBound = "true";
    button.setAttribute("href", "/cart");
    const labels = button.querySelectorAll("p").length ? Array.from(button.querySelectorAll("p")) : [button];
    const setLabel = (text) => labels.forEach((node) => { node.textContent = text; });
    setLabel(checkout.cartButton || "Add to cart");
    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.dataset.lcAdded === "true") {
          location.href = "/cart";
          return;
        }
        add(product, typeof getVariant === "function" ? getVariant() : null, 1);
        button.dataset.lcAdded = "true";
        setLabel(checkout.addedButton || "Added - view cart");
        if (pill) {
          pill.classList.add("is-bump");
          setTimeout(() => pill.classList.remove("is-bump"), 500);
        }
      },
      true
    );
  }

  const style = document.createElement("style");
  style.textContent = `
    .lc-cart-pill{position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:999px;background:#0b0b0b;color:#fff;font:600 14px/1 Inter,Arial,sans-serif;text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.28);transition:transform .2s,opacity .2s}
    .lc-cart-pill b{min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#fff;color:#000;display:grid;place-items:center;font-size:12px}
    .lc-cart-pill.is-empty{opacity:0;pointer-events:none;transform:translateY(12px)}
    .lc-cart-pill.is-bump{transform:scale(1.08)}
    @media (max-width:809px){.lc-cart-pill{right:14px;bottom:14px;padding:11px 14px}}
  `;
  document.head.appendChild(style);

  window.LeatherCultureCart = { read, add, update, remove, clear, totals, money, parsePrice, mediaUrl, key, configure, bindProductButton, onChange: (fn) => listeners.add(fn), settings: () => checkout };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderPill);
  else renderPill();
})();
