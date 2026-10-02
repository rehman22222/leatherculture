# Account email setup on Render

Create the actual `accounts@leatherculture.shop` mailbox with your email provider first. In Render, open the **leatherculture backend web service → Environment → Add environment variable**.

**Check the Render service's instance type first.** Free web services block SMTP ports 25, 465 and 587. This mailbox/password SMTP setup therefore needs a paid backend instance. Keeping a free backend would require implementing a transactional email provider's HTTPS API instead. See [Render's free service limits](https://render.com/docs/free). No plan changes are made by this code.

| Key | Value |
| --- | --- |
| `ACCOUNTS_SMTP_USER` | `accounts@leatherculture.shop` |
| `ACCOUNTS_SMTP_PASS` | The password of this mailbox, not your Render password |
| `ACCOUNTS_SMTP_HOST` | `smtp.hostinger.com` for Hostinger Email; otherwise use your provider's SMTP host |
| `ACCOUNTS_SMTP_PORT` | `465` for implicit TLS; `587` uses required STARTTLS |
| `ACCOUNTS_OTP_SECRET` | A random secret of at least 32 bytes, generated once and shared by all backend instances |

Generate the OTP secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep it in Render only. Do not paste mailbox passwords or secrets into chat, frontend code, Git, or Vercel public variables. OTP hashing falls back to `MAIL_SECRET` or `MONGODB_URI` if the dedicated secret is absent. Changing the secret invalidates pending OTPs.

Save and redeploy. Keep **Admin → Email → Send emails at all** enabled. The admin email screen reports whether account credentials are present; that indicator does not test SMTP authentication. The existing order mailbox settings remain separate. Verification and reset emails always use `accounts@leatherculture.shop`; replies go to `info@leatherculture.shop`.

Provider references: [Render environment variables](https://render.com/docs/configure-environment-variables), [Hostinger Email SMTP settings](https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/).

Test with your own customer account: sign up, enter the six-digit code, sign out, request a password reset, and use the link. Check Admin → Email → Log for delivery failures and your spam folder if needed. Confirm the provider's SPF/DKIM records in its domain setup screen. No real delivery can be verified until mailbox credentials are configured.

Codes expire after 10 minutes and allow five attempts. Resends have a one-minute cooldown plus account/IP limits. Reset links expire after one hour, work once, and revoke existing sessions. Account email secrets are encrypted in the outbox. Expired jobs are not sent.

# Orders and capacity

Customers see an order timeline, item summary, payment/address details, and courier tracking when available. Admin order status/history, courier, tracking number, tracking URL and delivery estimate drive this view. It does not invent courier scans or delivery dates. Cancelled orders use a separate message.

Order history is paginated in batches of 20 using a customer/date/id index. Quiet refreshes only run on the first page while the tab is visible and the user is not interacting with account controls; failures back off to five minutes. Requests time out after 30 seconds, and order refreshes cannot overlap. Password hashing has an eight-operation cap per Node process; Mongo uses a pool of up to 20 connections with bounded queue waits. Mongo-backed request limits and atomic email claims work across instances. Mail send budgets are per process: when scaling Render horizontally, divide the provider's allowed send rate across instances or introduce a shared provider budget before increasing traffic. This is bounded request handling, not a measured capacity guarantee; test with your actual Render plan and traffic before setting a concurrency target.

# Five jacket listings

The Blade, Heritage, Vibe, Nomad and Rune are published with the owner's confirmed price of PKR 15,000, size L and initial stock of 5 each. The October 2 replacement archive supplies 18 original PNG images: front, back/side and detail views for all five jackets, plus three Heritage lookbooks. Images use descriptive filenames, individual alt text and product gallery/schema references. `scripts/update-jacket-images.js --apply` updates media and SEO copy without resetting price, size or stock. It replaces the previous JPG design sheets.

Image metadata follows [Google's image SEO guidance](https://developers.google.com/search/docs/appearance/google-images): describe the pictured product and view, avoid repetitive location keywords in alt text, and provide Pakistan context in relevant product copy and metadata. This does not guarantee a particular Google ranking.

Future edits belong in **Admin → Products**. Keep each size/colour SKU distinct and confirm material or performance claims before adding them. Rebuild the Vercel frontend after publishing changes so static pages and the sitemap update. Normal backend restarts do not overwrite existing prices or stock. `scripts/publish-jackets.js --apply` is the explicit one-off launch migration: do not rerun it after sales, because it resets these five stocks to 5.
