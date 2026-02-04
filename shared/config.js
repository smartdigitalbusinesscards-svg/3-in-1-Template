(() => {
  window.BIZ = window.BIZ || {};

  // ✅ TEMP TEST: force one real link so buttons should activate
  window.BIZ.bookingLink = "https://example.com";

  if (!window.BIZ.tier) window.BIZ.tier = "starter";

  const normalizeTier = (t) => {
    t = (t || "").toString().trim().toLowerCase();
    return (t === "starter" || t === "pro" || t === "elite") ? t : null;
  };

  const pickTierFromUrl = () => {
    const qsTier = normalizeTier(new URLSearchParams(window.location.search).get("tier"));
    const rawHash = (window.location.hash || "").replace(/^#/, "");
    const hashQuery = rawHash.startsWith("?") ? rawHash.slice(1) : rawHash;
    const hashTier = normalizeTier(new URLSearchParams(hashQuery).get("tier"));
    const tier = qsTier || hashTier;
    if (tier) window.BIZ.tier = tier;
  };

  pickTierFromUrl();
  window.addEventListener("hashchange", pickTierFromUrl);
})();
