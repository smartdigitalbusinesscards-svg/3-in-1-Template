// shared/shared.js
(function () {
  if (!window.BIZ) {
    console.warn("BIZ config not found");
    return;
  }

  document.querySelectorAll("[data-biz='fullName']").forEach(el => {
    el.textContent = window.BIZ.fullName;
  });
})();
