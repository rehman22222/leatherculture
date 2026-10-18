(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LeatherCultureCommerce = factory();
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const schema = "https://schema.org/";
  function shippingFor(price, checkout = {}) {
    const fee = Math.max(0, Number(checkout.shippingFee) || 0), freeFrom = Math.max(0, Number(checkout.freeShippingFrom) || 0);
    return freeFrom && price >= freeFrom ? 0 : fee;
  }
  function dayRange(min, max) {
    if (min === "" || max === "" || min == null || max == null) return null;
    min = Number(min); max = Number(max);
    return Number.isInteger(min) && Number.isInteger(max) && min >= 0 && max >= min
      ? { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" } : null;
  }
  function shippingDetails(price, checkout = {}) {
    const details = { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: shippingFor(price, checkout), currency: "PKR" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" } };
    const handlingTime = dayRange(checkout.handlingDaysMin, checkout.handlingDaysMax);
    const transitTime = dayRange(checkout.transitDaysMin, checkout.transitDaysMax);
    if (handlingTime || transitTime) details.deliveryTime = { "@type": "ShippingDeliveryTime", ...(handlingTime ? { handlingTime } : {}), ...(transitTime ? { transitTime } : {}) };
    return details;
  }
  function deliveryTimingText(checkout = {}) {
    const timing = shippingDetails(0, checkout).deliveryTime;
    if (!timing) return "";
    const range = value => value.minValue === value.maxValue ? String(value.minValue) : `${value.minValue}–${value.maxValue}`;
    return [timing.handlingTime ? `Orders are usually dispatched within ${range(timing.handlingTime)} days.` : "", timing.transitTime ? `Courier transit after dispatch: ${range(timing.transitTime)} days.` : ""].filter(Boolean).join(" ");
  }
  function returnPolicy(checkout = {}, site = "https://www.leatherculture.shop") {
    const config = checkout.merchantReturns || {};
    // A free-text contact placeholder or unconfirmed values cannot become a return promise.
    if (config.confirmed !== true || !String(checkout.returnsPolicy || "").trim() || /current returns and exchange policy before ordering/i.test(checkout.returnsPolicy)) return null;
    const categories = { finite: "MerchantReturnFiniteReturnWindow", unlimited: "MerchantReturnUnlimitedWindow", none: "MerchantReturnNotPermitted" };
    if (!categories[config.category]) return null;
    const policy = { "@type": "MerchantReturnPolicy", "@id": `${site.replace(/\/$/, "")}/terms#returns`, applicableCountry: "PK", returnPolicyCategory: schema + categories[config.category], merchantReturnLink: `${site.replace(/\/$/, "")}/terms#returns` };
    if (config.category === "finite") {
      if (!dayRange(config.days, config.days)) return null;
      policy.merchantReturnDays = Number(config.days);
    }
    if (config.category !== "none") {
      const fees = { free: "FreeReturn", customer: "ReturnFeesCustomerResponsibility", fixed: "ReturnShippingFees" };
      if (fees[config.fees]) policy.returnFees = schema + fees[config.fees];
      if (config.fees === "fixed") {
        if (!(Number(config.feeAmount) > 0)) return null;
        policy.returnShippingFeesAmount = { "@type": "MonetaryAmount", value: Number(config.feeAmount), currency: "PKR" };
      }
      const methods = { mail: "ReturnByMail", store: "ReturnInStore" };
      if (methods[config.method]) policy.returnMethod = schema + methods[config.method];
    }
    return policy;
  }
  return { shippingFor, shippingDetails, deliveryTimingText, returnPolicy };
});
