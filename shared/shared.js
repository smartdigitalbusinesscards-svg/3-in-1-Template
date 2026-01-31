// shared/shared.js
(() => {
  const $ = (id) => document.getElementById(id);

  const safeText = (v) => (v == null ? "" : String(v));
  const normalizeWebsite = (url) => {
    const u = safeText(url).trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return "https://" + u;
  };

  const getTier = () => {
    const t = (window.BIZ && window.BIZ.tier) ? String(window.BIZ.tier).toLowerCase() : "starter";
    return (t === "elite" || t === "pro" || t === "starter") ? t : "starter";
  };

  const FEATURES = {
    starter: { booking:false, qr:false, qrDownload:false, saveContact:true, eliteCTA:false },
    pro:     { booking:true,  qr:true,  qrDownload:true,  saveContact:true, eliteCTA:false },
    elite:   { booking:true,  qr:true,  qrDownload:true,  saveContact:true, eliteCTA:true  }
  };

  const show = (el, on, displayValue = "") => {
    if (!el) return;
    el.style.display = on ? displayValue : "none";
  };

  // -----------------------------
  // Apply config to UI
  // -----------------------------
  const applyCardData = () => {
    const c = window.CARD || {};

    const fullName = safeText(c.fullName).trim() || "Your Name";
    const company = safeText(c.company).trim() || "Company";
    const tagline = safeText(c.tagline).trim() || "Tagline";
    const title = safeText(c.title).trim() || "Title";

    const phonePretty = safeText(c.phonePretty).trim() || "(000) 000-0000";
    const phoneTel = safeText(c.phoneTel).replace(/[^\d]/g, ""); // digits only
    const email = safeText(c.email).trim() || "example@email.com";
    const website = normalizeWebsite(c.website || "example.com");
    const bookingLink = safeText(c.bookingLink).trim() || "#";
    const textPrefill = safeText(c.textPrefill).trim();

    document.title = `${fullName} | ${company}`;

    if ($("fullName")) $("fullName").textContent = fullName;
    if ($("companyName")) $("companyName").textContent = company;
    if ($("companyTag")) $("companyTag").textContent = tagline;
    if ($("title")) $("title").textContent = title;
    if ($("phonePretty")) $("phonePretty").textContent = phonePretty;

    const emailLink = $("emailLink");
    if (emailLink) {
      emailLink.textContent = email;
      emailLink.href = `mailto:${email}`;
    }

    const siteLink = $("siteLink");
    if (siteLink) {
      siteLink.textContent = website.replace(/^https?:\/\//i, "");
      siteLink.href = website;
    }

    const bookBtn = $("bookBtn");
    if (bookBtn) bookBtn.href = bookingLink;

    const callBtn = $("callBtn");
    const textBtn = $("textBtn");
    const emailBtn = $("emailBtn");
    const siteBtn = $("siteBtn");

    if (callBtn && phoneTel) callBtn.href = `tel:${phoneTel}`;
    if (textBtn && phoneTel) textBtn.href = `sms:${phoneTel}${textPrefill ? `?&body=${encodeURIComponent(textPrefill)}` : ""}`;
    if (emailBtn) emailBtn.href = `mailto:${email}`;
    if (siteBtn) siteBtn.href = website;

    // Phone tile opens chooser sheet
    const phoneTile = $("phoneTile");
    if (phoneTile) {
      phoneTile.onclick = () => openPhoneSheet(phonePretty, phoneTel, textPrefill);
    }
  };

  // -----------------------------
  // Tier UI + elite CTA injection
  // -----------------------------
  const removeEliteBtnIfAny = () => {
    const existing = document.querySelector("[data-elite-cta='1']");
    if (existing) existing.remove();
  };

  const setTierBadges = (tier) => {
    const tierBadge = $("tierBadge");
    const chipMain = $("chipMain");
    const chipSub = $("chipSub");

    if (!tierBadge || !chipMain || !chipSub) return;

    chipMain.classList.remove("elite");

    if (tier === "elite") {
      tierBadge.textContent = "ELITE";
      chipMain.textContent = "Elite eCard";
      chipSub.textContent = "Premium share tools";
      chipMain.classList.add("elite");
    } else if (tier === "pro") {
      tierBadge.textContent = "PRO";
      chipMain.textContent = "Pro eCard";
      chipSub.textContent = "Scan-ready";
    } else {
      tierBadge.textContent = "STARTER";
      chipMain.textContent = "Starter eCard";
      chipSub.textContent = "Quick share";
    }
  };

  const injectEliteCTA = () => {
    const c = window.CARD || {};
    const label = safeText(c.eliteCtaLabel).trim();
    const url = safeText(c.eliteCtaUrl).trim();

    if (!label || !url) return;

    const actions = $("actions");
    const bookBtn = $("bookBtn");
    if (!actions || !bookBtn) return;

    const eliteBtn = document.createElement("a");
    eliteBtn.className = "btn elite";
    eliteBtn.href = url;
    eliteBtn.target = "_blank";
    eliteBtn.rel = "noopener";
    eliteBtn.setAttribute("aria-label", label);
    eliteBtn.setAttribute("data-elite-cta", "1");
    eliteBtn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 2l2.4 6.9L22 9l-6 4 2.2 7-6.2-4.2L5.8 20 8 13 2 9l7.6-.1L12 2z"/></svg>
      ${label}
    `;

    // Put it right after booking button
    const after = bookBtn.nextElementSibling;
    if (after) actions.insertBefore(eliteBtn, after);
    else actions.appendChild(eliteBtn);
  };

  const applyTierUI = () => {
    const tier = getTier();
    const f = FEATURES[tier];

    setTierBadges(tier);

    // Booking
    show($("bookBtn"), f.booking);

    // Pro/Elite: QR tools
    show($("utilityRow"), f.qr, "flex");
    show($("qrHint"), f.qr, "block");

    // Save Contact
    show($("saveContactBtn"), f.saveContact);

    // Elite CTA
    removeEliteBtnIfAny();
    if (f.eliteCTA) injectEliteCTA();
  };

  // -----------------------------
  // Save Contact (VCF)
  // -----------------------------
  const buildVCF = () => {
    const c = window.CARD || {};
    const full = safeText(c.fullName).trim();
    const company = safeText(c.company).trim();
    const title = safeText(c.title).trim();
    const phonePretty = safeText(c.phonePretty).trim();
    const email = safeText(c.email).trim();
    const website = normalizeWebsite(c.website || "");

    const parts = full.split(/\s+/).filter(Boolean);
    const first = parts[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1] : "";

    const digits = phonePretty.replace(/[^\d]/g, "").replace(/^1/, "");
    const tel = digits ? `+1-${digits}` : "";

    return `BEGIN:VCARD
VERSION:3.0
N:${last};${first};;;
FN:${full}
ORG:${company}
TITLE:${title}
TEL;TYPE=CELL:${tel}
EMAIL;TYPE=INTERNET:${email}
URL:${website}
END:VCARD`;
  };

  const wireSaveContact = () => {
    const btn = $("saveContactBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const vcf = buildVCF();
      const blob = new Blob([vcf], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);

      const c = window.CARD || {};
      const full = (safeText(c.fullName).trim() || "Contact").replace(/\s+/g, "_");
      const company = (safeText(c.company).trim() || "").replace(/\s+/g, "");

      const a = document.createElement("a");
      a.href = url;
      a.download = `${full}_${company}.vcf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    });
  };

  // -----------------------------
  // Sheet / Modal controller
  // -----------------------------
  const overlay = $("overlay");
  const sheet = $("sheet");
  const sheetTitle = $("sheetTitle");
  const sheetSub = $("sheetSub");
  const sheetBody = $("sheetBody");
  const closeSheetBtn = $("closeSheetBtn");

  const openSheet = () => {
    if (!overlay || !sheet) return;
    overlay.classList.add("open");
    sheet.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeSheet = () => {
    if (!overlay || !sheet) return;
    overlay.classList.remove("open");
    sheet.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const wireSheet = () => {
    if (overlay) overlay.addEventListener("click", closeSheet);
    if (closeSheetBtn) closeSheetBtn.addEventListener("click", closeSheet);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
  };

  const openPhoneSheet = (phonePretty, phoneTel, textPrefill) => {
    if (!sheetTitle || !sheetSub || !sheetBody) return;

    sheetTitle.textContent = "Reach Out";
    sheetSub.textContent = `${phonePretty} • Choose Call or Text`;

    const telHref = phoneTel ? `tel:${phoneTel}` : "#";
    const smsHref = phoneTel ? `sms:${phoneTel}${textPrefill ? `?&body=${encodeURIComponent(textPrefill)}` : ""}` : "#";

    sheetBody.innerHTML = `
      <a class="sheetBtn primary" href="${telHref}">
        <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.7 3.1 3.5 4.9 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.9.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.1 21 3 13.9 3 5c0-.6.4-1 1-1h3.3c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.9.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg>
        Call Now
      </a>
      <a class="sheetBtn" href="${smsHref}">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        Text Instead
      </a>
    `;

    openSheet();
  };

  // -----------------------------
  // Init
  // -----------------------------
  const init = () => {
    applyCardData();
    applyTierUI();
    wireSaveContact();
    wireSheet();
  };

  // ensure DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // If tier changes via hash change, re-apply
  window.addEventListener("hashchange", applyTierUI);
})();
