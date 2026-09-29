/* The page a customer lands on from the "how did we do?" email. */
(function () {
  "use strict";

  const root = document.getElementById("review-root");
  const params = new URLSearchParams(location.search);
  const orderId = params.get("order") || "";
  const token = params.get("t") || "";

  function api(path) {
    const base = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");
    return base + path;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  if (!orderId || !token) {
    root.innerHTML = `<div class="empty">
      <h1>We need your review link</h1>
      <p class="muted">Please open the link from the email we sent after your delivery, so we can match the review to your order.</p>
      <p><a class="btn ghost" href="/contact" style="max-width:260px;margin:18px auto 0">Contact us instead</a></p>
    </div>`;
    return;
  }

  let rating = 0;

  function stars() {
    return [1, 2, 3, 4, 5]
      .map((n) => `<button type="button" class="star ${n <= rating ? "on" : ""}" data-star="${n}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`)
      .join("");
  }

  function form() {
    root.innerHTML = `
      <h1>How was your order?</h1>
      <p class="muted">Order ${escapeHtml(orderId)} · your review is published with your first name and city only.</p>
      <div class="card" style="max-width:620px;margin-top:22px">
        <label>Your rating
          <div class="stars" id="stars">${stars()}</div>
        </label>
        <label>Your review
          <textarea id="text" maxlength="1200" placeholder="What did you order, how does it fit, how was the delivery? Honest detail helps other customers the most."></textarea>
        </label>
        <div class="grid2">
          <label>Name shown<input id="name" maxlength="60" placeholder="e.g. Ahmed R."></label>
          <label>City<input id="city" maxlength="60" placeholder="e.g. Lahore"></label>
        </div>
        <p class="error" id="error"></p>
        <button type="button" class="btn" id="submit">Send review</button>
        <p class="summary note">We read every review. It appears on the site once our team has checked it.</p>
      </div>`;

    document.getElementById("stars").addEventListener("click", (event) => {
      const button = event.target.closest("[data-star]");
      if (!button) return;
      rating = Number(button.dataset.star);
      document.getElementById("stars").innerHTML = stars();
    });

    document.getElementById("submit").addEventListener("click", send);
  }

  async function send() {
    const button = document.getElementById("submit");
    const error = document.getElementById("error");
    error.textContent = "";
    button.disabled = true;
    button.textContent = "Sending…";
    try {
      const response = await fetch(api("/api/reviews"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order: orderId,
          token,
          rating,
          text: document.getElementById("text").value,
          name: document.getElementById("name").value,
          city: document.getElementById("city").value,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not save your review.");
      thanks();
    } catch (failure) {
      error.textContent = failure.message;
      button.disabled = false;
      button.textContent = "Send review";
    }
  }

  function thanks() {
    root.innerHTML = `<div class="success">
      <div class="check">★</div>
      <h1>Thank you</h1>
      <p class="muted">Your review has reached us. We check each one before it goes on the site.</p>
      <div class="actions">
        <a class="btn" href="/shop">Back to the shop</a>
        <a class="btn ghost" href="/blog">Read the journal</a>
      </div>
    </div>`;
  }

  form();
})();
