"use strict";

// Render appends the address it received the connection from to X-Forwarded-For and passes through
// whatever the caller sent before it, so only the last entry cannot be forged. Requests that Vercel
// proxies (/api/account/*, /api/orders) arrive as "<shopper>, <vercel edge>": Vercel replaces the
// header with the real client, so the entry before the last is the shopper. A caller that goes to
// Render directly can forge that entry, which is why limits keyed on clientIp are paired with a
// looser limit keyed on peerIp.
// Without a proxy in front (local runs), the header is whatever the caller typed.
const behindProxy = Boolean(process.env.RENDER) || process.env.TRUST_PROXY === "true";

function forwardedChain(req) {
  if (!behindProxy) return [];
  return String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function socketAddress(req) {
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

/** The address that connected to Render (or to this process when nothing is in front of it). */
function peerIp(req) {
  const chain = forwardedChain(req);
  return chain[chain.length - 1] || socketAddress(req);
}

/** The shopper behind the Vercel proxy; equal to peerIp when there is only one hop. */
function clientIp(req) {
  const chain = forwardedChain(req);
  return chain[chain.length - 2] || chain[0] || socketAddress(req);
}

module.exports = { clientIp, peerIp };
