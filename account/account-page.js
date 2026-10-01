(function () {
  const root = document.getElementById("account-root");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (value, currency = "Rs") => `${esc(currency)} ${Number(value || 0).toLocaleString("en-PK")}`;
  let customer = null, tab = "orders", authMode = "login", orders = [], message = "";
  async function api(action, method = "GET", body) {
    const response = await fetch(`/api/account/${action}`, { method, credentials: "same-origin", headers: { "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
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
        message = data.verificationSent ? "Check your email for your verification link." : "";
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
  async function loadOrders() { orders = (await api("orders")).orders; }
  function dashboard() {
    root.innerHTML = `<div class="account-heading"><p>Welcome, <b>${esc(customer.name)}</b></p><button class="account-link" id="logout">Sign out</button></div>
      ${!customer.emailVerified ? '<div class="account-notice">Verify your email to see previous guest orders. <button class="account-link" id="resend">Send verification email</button></div>' : ""}
      <p class="account-message" role="status" id="account-message">${esc(message)}</p>
      <div class="account-tabs"><button data-tab="orders" class="${tab === "orders" ? "active" : ""}">My orders</button><button data-tab="profile" class="${tab === "profile" ? "active" : ""}">Profile &amp; delivery</button><button data-tab="password" class="${tab === "password" ? "active" : ""}">Password</button></div>
      ${tab === "orders" ? orderList() : tab === "profile" ? profile() : password()}`;
    root.querySelectorAll("[data-tab]").forEach(button => button.onclick = () => { tab = button.dataset.tab; message = ""; dashboard(); });
    document.getElementById("logout").onclick = async () => { try { await api("logout", "POST", {}); customer = null; message = ""; auth(); } catch (e) { document.getElementById("account-message").textContent = e.message; } };
    const resend = document.getElementById("resend");
    if (resend) resend.onclick = async () => { resend.disabled = true; try { document.getElementById("account-message").textContent = (await api("resend-verification", "POST", {})).message; } catch(e) { document.getElementById("account-message").textContent = e.message; } finally { resend.disabled = false; } };
    if (tab === "profile") bindForm("profile", async body => { customer = (await api("profile", "PUT", body)).customer; message = "Profile saved."; dashboard(); });
    if (tab === "password") bindForm("password", async body => { await api("password", "PUT", body); message = "Password updated. Other sessions have been signed out."; dashboard(); });
    root.querySelectorAll("[data-order]").forEach(button => button.onclick = async () => {
      try {
        const order = (await api(`orders/${encodeURIComponent(button.dataset.order)}`)).order;
        const slot = root.querySelector(`[data-detail="${button.dataset.order}"]`);
        slot.innerHTML = order.items.map(item => `<div class="line"><img src="${esc(item.image)}" alt="${esc(item.name)}"><div>${esc(item.name)}<br><small>${esc(item.variantName)} · Qty ${item.qty}</small></div><span class="price">${money(item.lineTotal, order.currency)}</span></div>`).join("") + `<p>Delivery: ${money(order.shipping, order.currency)}</p><p>${esc(order.customer.address)}, ${esc(order.customer.city)}</p>${order.courier ? `<p>Courier: ${esc(order.courier)} · Tracking: ${esc(order.trackingNumber)}</p>` : ""}`;
      } catch (e) { document.getElementById("account-message").textContent = e.message; }
    });
    const refresh = document.getElementById("refresh-orders");
    if (refresh) refresh.onclick = async () => { try { await loadOrders(); dashboard(); } catch(e) { document.getElementById("account-message").textContent = e.message; } };
  }
  function orderList() {
    return `<button class="account-link" id="refresh-orders">Refresh orders</button><div class="account-orders">${orders.length ? orders.map(order => `<section class="card"><div class="account-order-top"><b>${esc(order.id)}</b><span class="account-status">${esc(order.status)}</span></div><p class="muted">${esc(new Date(order.createdAt).toLocaleDateString("en-GB"))} · ${money(order.total, order.currency)}</p><button class="account-link" data-order="${esc(order.id)}">View order</button><div data-detail="${esc(order.id)}"></div></section>`).join("") : '<section class="card"><h2>No orders yet</h2><p>Your signed-in orders appear here. Verify your email to include earlier guest orders.</p><a class="btn" href="/shop">Explore the collection</a></section>'}</div>`;
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
    } catch (error) { message = verify ? error.message : ""; auth(); }
  }
  // Refresh while viewing orders and when returning to the tab.
  async function refreshVisibleOrders() {
    if (customer && tab === "orders" && document.visibilityState === "visible") {
      try {
        await loadOrders();
        if (!root.querySelector("[data-detail]")?.textContent) dashboard();
        else orders.forEach(order => {
          const badge = root.querySelector(`[data-order="${order.id}"]`)?.closest("section")?.querySelector(".account-status");
          if (badge) badge.textContent = order.status;
        });
      } catch (_) { /* retry on next refresh */ }
    }
  }
  setInterval(refreshVisibleOrders, 30000);
  document.addEventListener("visibilitychange", refreshVisibleOrders);
  start();
})();
