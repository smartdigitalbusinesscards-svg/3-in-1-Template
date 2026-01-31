// shared/config.js
// Purpose: set a default tier & allow quick override via URL parameter.
// Example overrides:
//   ?tier=starter
//   ?tier=pro
//   ?tier=elite

(function () {
  window.BIZ = window.BIZ || {};

  // Default tier if nothing else sets it:
  if (!window.BIZ.tier) window.BIZ.tier = "starter";

  // URL override:
  try {
    const sp = new URLSearchParams(window.location.search);
    const t = (sp.get("tier") || "").toLowerCase().trim();
    if (t === "starter" || t === "pro" || t === "elite") {
      window.BIZ.tier = t;
    }
  } catch (e) {
    // ignore
  }
})();
