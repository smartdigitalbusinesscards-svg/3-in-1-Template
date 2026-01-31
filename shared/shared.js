// shared/shared.js
(() => {
  const $ = (id) => document.getElementById(id);

  // ---------- helpers ----------
  const isPlaceholder = (v) =>
    !v || String(v).trim() === "" || /^REPLACE_/i.test(String(v).trim());

  const normUrl = (u) => {
    if (isPlaceholder(u)) return "";
    const s = String(u).trim();
    if (/^https?:\/\//i.test(s)) return s;
    // allow people to paste "example.com"
    return "https://" + s.replace(/^\/+/, "");
  };

  const setText = (id, value) => {
    const el = $(id);
    if (el && !isPlaceholder(value)) el.textContent = value;
  };

  const setHref = (id, href) => {
    const el = $(id);
    if (!el) return;
    if (!href) {
      // disable safely
      el.setAttribute("aria-disabled", "true");
      el.style.opacity = "0.45";
      el.style.pointerEvents = "none";
      return;
    }
    el.setAttribute("aria-disabled", "false");
    el.style.opacity = "";
    el.style.pointerEvents = "";
    el.setAttribute("href", href);
  };

  const buildSmsLink = (digitsOnly, body) => {
    const num = String(digitsOnly || "").replace(/[^\d]/g, "");
    if (!num) return "";
    const msg = isPlaceholder(body) ? "" : String(body || "");
    if (!msg) return `sms:${num}`;

    // iOS prefers &body=, Android prefers ?body=
    const ua = navigator.userAgent || "";
    const isiOS = /iPhone|iPad|iPod/i.test(ua);
    const sep = isiOS ? "&" : "?";
    return `sms:${num}${sep}body=${encodeURIComponent(msg)}`;
  };

  // ---------- tier features ----------
  const FEATURES = {
    starter: { booking: true, qr: false, qrDownload: false, eliteCTA: false },
    pro:     { booking: true, qr: true,  qrDownload: true,  eliteCTA: false },
    elite:   { booking: true, qr: true,  qrDownload: true,  eliteCTA: true  },
  };

  const getTier = () => {
    const t = (window.BIZ?.tier || "starter").toString().toLowerCase();
    return t === "pro" || t === "elite" ? t : "starter";
  };

  // ---------- UI apply ----------
  const applyTierUI = () => {
    const tier = getTier();
    const f = FEATURES[tier];

    // chips/badge
    const chipMain = $("chipMain");
    const tierBadge = $("tierBadge");
    if (chipMain) chipMain.textContent = tier === "elite" ? "Elite eCard" : tier === "pro" ? "Pro eCard" : "eCard";
    if (tierBadge) tierBadge.textContent = tier.toUpperCase();

    // QR row visibility (Pro+)
    const hint = $("qrHint");
    const row = $("utilityRow");
    if (hint) hint.style.display = f.qr ? "block" : "none";
    if (row) row.style.display = f.qr ? "flex" : "none";

    // Elite CTA button
    const eliteBtn = $("eliteCtaBtn");
    if (eliteBtn) eliteBtn.style.display = f.eliteCTA ? "" : "none";
  };

  const applyCardData = () => {
    const B = window.BIZ || {};
    // text
    setText("fullName", B.fullName);
    setText("companyName", B.company);
    setText("companyTag", B.tagline);
    setText("title", B.title);
    setText("phonePretty", B.phonePretty);

    // links
    const digits = String(B.phoneTel || "").replace(/[^\d]/g, "");
    const telHref = digits ? `tel:${digits}` : "";
    const smsHref = buildSmsLink(digits, B.textPrefill);

    setHref("callBtn", telHref);
    setHref("textBtn", smsHref);

    const email = isPlaceholder(B.email) ? "" : String(B.email).trim();
    setHref("emailBtn", email ? `mailto:${email}` : "");
    const emailLink = $("emailLink");
    if (emailLink && email) {
      emailLink.textContent = email;
      emailLink.setAttribute("href", `mailto:${email}`);
    }
    
      // --- Elite CTA wiring ---
const eliteBtn = document.getElementById("eliteCtaBtn");
const eliteLabelEl = document.getElementById("eliteCtaLabel");

if (eliteLabelEl) {
  eliteLabelEl.textContent =
    (window.BIZ.eliteCtaLabel || "").trim() || "Elite Bonus";
}

if (eliteBtn) {
  const raw = (window.BIZ.eliteCtaUrl || "").trim();

  const missing =
    !raw ||
    raw.includes("REPLACE_") ||
    raw.toLowerCase() === "undefined" ||
    raw.toLowerCase() === "null";

  if (missing) {
    eliteBtn.style.display = "none";
    eliteBtn.setAttribute("href", "#");
  } else {
    const url =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : `https://${raw}`;

    eliteBtn.style.display = "";
    eliteBtn.setAttribute("href", url);
    eliteBtn.setAttribute("target", "_blank");
    eliteBtn.setAttribute("rel", "noopener");
  }
}
    }

    const website = normUrl(B.website);
    setHref("siteBtn", website);
    const siteLink = $("siteLink");
    if (siteLink && website) {
      siteLink.textContent = website.replace(/^https?:\/\//i, "");
      siteLink.setAttribute("href", website);
    }

    const booking = normUrl(B.bookingLink);
    setHref("bookBtn", booking);

    // Elite CTA
    const eliteLabel = isPlaceholder(B.eliteCtaLabel) ? "" : String(B.eliteCtaLabel).trim();
    const eliteUrl = normUrl(B.eliteCtaUrl);
    const eliteBtn = $("eliteCtaBtn");
    if (eliteBtn) {
      eliteBtn.textContent = eliteLabel || "Elite Offer";
      setHref("eliteCtaBtn", eliteUrl);
    }

    // Phone tile click should open sheet (optional), but at least not break:
    const phoneTile = $("phoneTile");
    if (phoneTile && digits) {
      phoneTile.addEventListener("click", () => {
        // default behavior: open dialer
        window.location.href = telHref;
      });
    }
  };

  // ---------- sheet ----------
  const overlay = () => $("overlay");
  const sheet = () => $("sheet");
  const sheetBody = () => $("sheetBody");

  const openSheet = () => {
    overlay()?.classList.add("open");
    sheet()?.classList.add("open");
  };
  const closeSheet = () => {
    overlay()?.classList.remove("open");
    sheet()?.classList.remove("open");
    if (sheetBody()) sheetBody().innerHTML = "";
  };

  const wireSheet = () => {
    $("closeSheetBtn")?.addEventListener("click", closeSheet);
    overlay()?.addEventListener("click", closeSheet);
  };

  // ---------- QR (failsafe: qrserver image) ----------
  const qrImageUrl = () => {
    const url = window.location.href.split("#")[0]; // clean-ish
    const data = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`;
  };

  const showQR = () => {
    const body = sheetBody();
    if (!body) return;

    const imgUrl = qrImageUrl();

    body.innerHTML = `
      <div class="qrFrame elite">
        <div class="qrCaption">Scan to open this card</div>
        <img id="qrImg" src="${imgUrl}" alt="QR code" style="width:260px;height:260px;border-radius:14px;background:#fff;padding:10px;">
        <div class="qrUrl">${window.location.href}</div>
      </div>

      <a class="sheetBtn primary" id="qrDownloadLink" href="${imgUrl}" download="qr-code.png">
        Download QR
      </a>
    `;

    openSheet();
  };

  const wireQR = () => {
    $("qrBtn")?.addEventListener("click", showQR);

    $("qrDownloadBtn")?.addEventListener("click", () => {
      // If sheet already open, the in-sheet download button exists.
      // If not, open sheet and provide download.
      showQR();

      // Auto-click download once sheet is built (small delay so DOM exists)
      setTimeout(() => {
        const a = $("qrDownloadLink");
        if (a) a.click();
      }, 50);
    });
  };

  // ---------- init ----------
  const init = () => {
    applyCardData();
    applyTierUI();
    wireSheet();
    wireQR();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // if tier changes via hash/search updates
  window.addEventListener("hashchange", () => {
    applyTierUI();
  });
})();
