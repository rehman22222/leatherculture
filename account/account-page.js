(function () {
  const root = document.getElementById("account-root");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (value, currency = "Rs") => `${esc(currency)} ${Number(value || 0).toLocaleString("en-PK")}`;
  let customer = null, tab = "orders", authMode = "login", orders = [], message = "";
  let page = 0, hasMore = false, loadingOrders = null, refreshDelay = 60000;
  const expanded = new Set();
  const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  const statusLabels = { new: "Order placed", confirmed: "Preparing your order", shipped: "On the way", delivered: "Delivered", cancelled: "Cancelled" };
  const safeUrl = value => { try { const u = new URL(value, location.origin); return ["https:", "http:"].includes(u.protocol) ? u.href : ""; } catch (_) { return ""; } };
  async function api(action, method = "GET", body) {
    const response = await fetch(`/api/account/${action}`, { method, credentials: "same-origin", signal: AbortSignal.timeout(30000), headers: { "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Please try again.");
    return data;
  }
  function auth() {
    const reset = new URLSearchParams(location.search).get("reset");
    root.innerHTML = `<section class="card auth-card">
      <div class="auth-tabs"><button data-auth="login" class="${authMode === "login" ? "active" : ""}">Sign in</button><button data-auth="register" class="${authMode === "register" ? "active" : ""}">Create account</button></div>
      <h2>${reset ? "Choose a new password" : authMode === "register" ? "Join LeatherCulture" : authMode === "forgot" ? "Reset your password" : "Welcome back"}</h2>
      <p class="muted">${reset ? "Use at least 10 characters." : "Save your delivery details and keep your orders in one place."}</p>
      <form id="auth-form">
        ${authMode === "register" && !reset ? '<label>Full name<input name="name" autocomplete="name" required maxlength="80"></label>' : ""}
        ${!reset ? '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="120"></label>' : ""}
        ${authMode !== "forgot" || reset ? `<label>Password<input name="password" type="password" autocomplete="${authMode === "register" || reset ? "new-password" : "current-password"}" required minlength="${authMode === "login" && !reset ? 1 : 10}" maxlength="128"></label>` : ""}
        <p id="form-message" role="status">${esc(message)}</p>
        <button class="btn" type="submit">${reset ? "Save new password" : authMode === "register" ? "Create account" : authMode === "forgot" ? "Send reset link" : "Sign in"}</button>
      </form>
      ${!reset ? '<button class="account-link" data-auth="forgot">Forgot password?</button>' : ""}
    </section>`;
    root.querySelectorAll("[data-auth]").forEach(button => button.onclick = () => { authMode = button.dataset.auth; message = ""; history.replaceState(null, "", "/account"); auth(); });
    bindForm("auth-form", async body => {
      const action = reset ? "reset-password" : authMode === "forgot" ? "forgot-password" : authMode;
      const data = await api(action, "POST", reset ? { ...body, token: reset } : body);
      if (data.customer) {
        customer = data.customer; history.replaceState(null, "", "/account");
        message = data.verificationSent ? "Check your email for your 6-digit verification code." : "";
        await loadOrders(); dashboard();
      } else { document.getElementById("form-message").textContent = data.message; }
    });
  }
  function bindForm(id, submit) {
    const form = document.getElementById(id);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']"), status = form.querySelector("[role='status']");
      button.disabled = true; status.textContent = "Saving…";
      try { await submit(Object.fromEntries(new FormData(form))); }
      catch (error) { status.textContent = error.message; }
      finally { button.disabled = false; }
    });
  }
  async function loadOrders(more = false) {
    if (loadingOrders) return loadingOrders;
    const next = more ? page + 1 : 0;
    loadingOrders = api(`orders?page=${next}`).then(data => {
      orders = more ? [...orders, ...data.orders.filter(order => !orders.some(existing => existing.id === order.id))] : data.orders;
      page = next; hasMore = data.hasMore; refreshDelay = 60000;
    }).finally(() => { loadingOrders = null; });
    return loadingOrders;
  }
  function dashboard() {
    root.innerHTML = `<div class="account-heading"><p>Welcome, <b>${esc(customer.name)}</b></p><button class="account-link" id="logout">Sign out</button></div>
      ${!customer.emailVerified ? `<div class="account-notice"><div><strong>Confirm your email</strong><p>Enter the code sent to ${esc(customer.email)} to include previous guest orders.</p></div><form id="verify-code" class="account-otp"><label>6-digit code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="000000"></label><button class="btn" type="submit">Verify email</button><p role="status"></p></form><button class="account-link" id="resend">Send a new code</button></div>` : ""}
      <p class="account-message" role="status" id="account-message">${esc(message)}</p>
      <div class="account-tabs"><button data-tab="orders" class="${tab === "orders" ? "active" : ""}">My orders</button><button data-tab="profile" class="${tab === "profile" ? "active" : ""}">Profile &amp; delivery</button><button data-tab="password" class="${tab === "password" ? "active" : ""}">Password</button></div>
      ${tab === "orders" ? orderList() : tab === "profile" ? profile() : password()}`;
    root.querySelectorAll("[data-tab]").forEach(button => button.onclick = () => { tab = button.dataset.tab; message = ""; dashboard(); });
    document.getElementById("logout").onclick = async () => { try { await api("logout", "POST", {}); customer = null; message = ""; auth(); } catch (e) { document.getElementById("account-message").textContent = e.message; } };
    const resend = document.getElementById("resend");
    if (!customer.emailVerified) bindForm("verify-code", async body => { customer = (await api("verify-code", "POST", body)).customer; message = "Email verified. Your previous orders are now linked."; await loadOrders(); dashboard(); });
    if (resend) resend.onclick = async () => { resend.disabled = true; try { document.getElementById("account-message").textContent = (await api("resend-verification", "POST", {})).message; } catch(e) { document.getElementById("account-message").textContent = e.message; } finally { resend.disabled = false; } };
    if (tab === "profile") bindForm("profile", async body => { customer = (await api("profile", "PUT", body)).customer; message = "Profile saved."; dashboard(); });
    if (tab === "password") bindForm("password", async body => { await api("password", "PUT", body); message = "Password updated. Other sessions have been signed out."; dashboard(); });
    root.querySelectorAll("[data-order]").forEach(button => button.onclick = () => {
      const id = button.dataset.order;
      expanded.has(id) ? expanded.delete(id) : expanded.add(id);
      const slot = document.getElementById(button.getAttribute("aria-controls"));
      slot.hidden = !expanded.has(id); button.setAttribute("aria-expanded", String(expanded.has(id)));
      button.textContent = expanded.has(id) ? "Hide order details" : "View order details";
    });
    const more = document.getElementById("more-orders");
    if (more) more.onclick = async () => { more.disabled = true; try { await loadOrders(true); if (tab === "orders" && customer) dashboard(); } catch(e) { document.getElementById("account-message").textContent = e.message; } finally { more.disabled = false; } };
    const refresh = document.getElementById("refresh-orders");
    if (refresh) refresh.onclick = async () => { try { await loadOrders(); dashboard(); } catch(e) { document.getElementById("account-message").textContent = e.message; } };
  }
  function orderList() {
    return `<div class="orders-intro"><div><span class="account-eyebrow">YOUR COLLECTION, ON ITS WAY</span><h2>Orders &amp; tracking</h2><p class="muted">Follow every order, from confirmation to your doorstep.</p></div><button class="account-link" id="refresh-orders">Refresh status</button></div><div class="account-orders">${orders.length ? orders.map(orderCard).join("") : '<section class="card account-empty"><span class="account-empty-icon" aria-hidden="true">&#9633;</span><h3>Your next favourite starts here</h3><p>Your orders and delivery updates will appear here.<br>Verify your email to include earlier guest orders.</p><a class="btn" href="/shop">Explore the collection</a></section>'}</div>${hasMore ? '<button class="btn account-more" id="more-orders">Load more orders</button>' : ""}`;
  }
  function orderCard(order, index) {
    const stages = ["new", "confirmed", "shipped", "delivered"], current = stages.indexOf(order.status);
    const items = Array.isArray(order.items) ? order.items : [], cancelled = order.status === "cancelled";
    const history = Array.isArray(order.history) ? order.history : [];
    const tracking = safeUrl(order.trackingUrl), open = expanded.has(order.id), detailId = `order-detail-${index}`;
    return `<article class="card account-order"><header class="account-order-top"><div><span class="account-eyebrow">ORDER ${esc(order.id)}</span><p>Placed ${esc(date(order.createdAt))}</p></div><span class="account-status status-${stages.includes(order.status) || cancelled ? esc(order.status) : "new"}">${esc(statusLabels[order.status] || "Status pending")}</span></header>
      ${cancelled ? '<p class="order-cancelled">This order has been cancelled. Contact us if you need help.</p>' : `<ol class="order-timeline" aria-label="Order progress">${stages.map((stage, i) => { const event = history.filter(entry => entry.status === stage).at(-1); return `<li class="${i <= current ? "complete" : ""} ${i === current ? "current" : ""}" ${i === current ? 'aria-current="step"' : ""}><span class="timeline-dot" aria-hidden="true">${i < current ? "&#10003;" : i + 1}</span><strong>${["Placed", "Confirmed", "Shipped", "Delivered"][i]}</strong><small>${esc(date(stage === "new" ? order.createdAt : event?.at)) || (i > current ? "Pending" : "")}</small></li>`; }).join("")}</ol>`}
      <div class="order-preview">${items.slice(0, 3).map(item => `<img src="${esc(safeUrl(item.image))}" alt="${esc(item.name)}" loading="lazy" width="64" height="80">`).join("")}<div><strong>${esc(items[0]?.name || "Your order")}</strong><p class="muted">${items.reduce((sum, item) => sum + Number(item.qty || 0), 0)} item(s)${items.length > 1 ? ` &middot; ${items.length} styles` : ""}</p></div><div class="order-total"><small>Total</small><strong>${money(order.total, order.currency)}</strong></div></div>
      ${!cancelled && (order.courier || order.trackingNumber || order.deliveryEstimate) ? `<div class="order-shipping"><div><strong>${esc(order.courier || "Delivery update")}</strong><p>${order.trackingNumber ? `Tracking: ${esc(order.trackingNumber)}` : "Tracking number will appear once assigned."}${order.deliveryEstimate ? `<br>Estimated delivery: ${esc(order.deliveryEstimate)}` : ""}</p></div>${tracking ? `<a class="btn" href="${esc(tracking)}" target="_blank" rel="noopener noreferrer">Track shipment &nearr;</a>` : ""}</div>` : ""}
      <footer class="order-actions"><button class="account-link" data-order="${esc(order.id)}" aria-expanded="${open}" aria-controls="${detailId}">${open ? "Hide order details" : "View order details"}</button><a href="mailto:orders@leatherculture.shop?subject=${encodeURIComponent(`Help with order ${order.id}`)}">Need help?</a></footer>
      <div id="${detailId}" class="order-details" ${open ? "" : "hidden"}>${items.map(item => `<div class="line"><div><strong>${esc(item.name)}</strong><br><small>${esc(item.variantName || "")} &middot; Qty ${esc(item.qty)}</small></div><span class="price">${money(item.lineTotal, order.currency)}</span></div>`).join("")}<div class="order-detail-grid"><div><h4>Delivery address</h4><p>${esc(order.customer?.name)}<br>${esc(order.customer?.address)}<br>${esc(order.customer?.city)}</p></div><div><h4>Payment summary</h4><p>Subtotal <b>${money(order.subtotal, order.currency)}</b><br>Delivery <b>${money(order.shipping, order.currency)}</b><br>Total <b>${money(order.total, order.currency)}</b></p><small>${order.payment === "cod" ? "Cash on delivery" : esc(order.payment || "")}</small></div></div></div></article>`;
  }
  function profile() {
    return `<form id="profile" class="card account-profile"><h2>Profile &amp; delivery</h2><label>Full name<input name="name" value="${esc(customer.name)}" required maxlength="80" autocomplete="name"></label><label>Email<input value="${esc(customer.email)}" type="email" readonly></label><label>Phone<input name="phone" value="${esc(customer.phone)}" autocomplete="tel" maxlength="30"></label><label>Address<textarea name="address" autocomplete="street-address" maxlength="300">${esc(customer.address)}</textarea></label><label>City<input name="city" value="${esc(customer.city)}" autocomplete="address-level2" maxlength="60"></label><p role="status"></p><button class="btn" type="submit">Save details</button></form>`;
  }
  function password() {
    return '<form id="password" class="card auth-card"><h2>Change password</h2><label>Current password<input name="currentPassword" type="password" required autocomplete="current-password" maxlength="128"></label><label>New password<input name="password" type="password" required minlength="10" maxlength="128" autocomplete="new-password"></label><p role="status"></p><button class="btn" type="submit">Update password</button></form>';
  }
  async function start() {
    const params = new URLSearchParams(location.search), verify = params.get("verify");
    if (params.get("reset")) { auth(); return; }
    try {
      if (verify) { customer = (await api("verify", "POST", { token: verify })).customer; message = "Email verified. Your previous guest orders are now linked."; history.replaceState(null, "", "/account"); }
      else customer = (await api("me")).customer;
      await loadOrders(); dashboard();
    } catch (error) { if (customer) { message = "Your orders could not be loaded. Please use Refresh status to try again."; dashboard(); } else { message = verify ? error.message : ""; auth(); } }
  }
  // Refresh while viewing orders and when returning to the tab.
  async function refreshVisibleOrders() {
    if (customer && page === 0 && tab === "orders" && document.visibilityState === "visible" && !root.contains(document.activeElement)) {
      try {
        await loadOrders();
        if (customer && tab === "orders" && !root.contains(document.activeElement)) dashboard();
      } catch (_) { refreshDelay = Math.min(refreshDelay * 2, 300000); }
    }
  }
  async function scheduleRefresh() { await refreshVisibleOrders(); setTimeout(scheduleRefresh, refreshDelay + Math.random() * 5000); }
  setTimeout(scheduleRefresh, refreshDelay);
  document.addEventListener("visibilitychange", refreshVisibleOrders);
  start();
})();
