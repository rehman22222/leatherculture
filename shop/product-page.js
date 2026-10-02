(function () {
  const data = JSON.parse(document.getElementById("lc-product-data").textContent);
  document.querySelectorAll("[data-gallery-target]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-gallery-panel]").forEach(panel => { panel.hidden = panel.id !== button.dataset.galleryTarget; });
    document.querySelectorAll("[data-gallery-target]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  }));
  const cart = window.LeatherCultureCart;
  const select = document.getElementById("product-variant"), add = document.getElementById("product-add"), status = document.getElementById("product-message");
  const variants = data.product.variants.filter(v => v.enabled !== false);
  cart.configure({ checkout: data.checkout });
  const first = variants.find(v => Number(v.stock) > 0);
  if (first) select.value = first.id;
  function update() {
    const variant = variants.find(v => v.id === select.value);
    const stock = Number(variant?.stock) || 0;
    document.getElementById("product-stock").textContent = stock > 0 ? `${stock} available in this option` : "Currently sold out";
    add.disabled = stock < 1;
  }
  select.addEventListener("change", update);
  add.addEventListener("click", () => {
    const variant = variants.find(v => v.id === select.value);
    if (!variant || Number(variant.stock) < 1) return;
    const count = cart.read().find(item => item.slug === data.product.slug && item.variantId === variant.id)?.qty || 0;
    if (count >= Number(variant.stock)) { status.textContent = "Your cart already contains the available quantity for this option."; return; }
    cart.add(data.product, variant, 1);
    status.textContent = "Added to your cart.";
  });
  update();
})();
