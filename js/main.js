/* ==========================================================================
   HOPS — main.js  (vanilla only, no jQuery)
   One function per feature, guard clauses, IntersectionObserver,
   honours prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky navbar shadow / solid on scroll ---------- */
  function initStickyNav() {
    var nav = document.querySelector(".hp-nav");
    if (!nav) return;
    var toggle = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 24);
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
  }

  /* ---------- Mobile nav: close on link click ---------- */
  function initMobileNav() {
    var collapse = document.getElementById("hpNavMenu");
    if (!collapse) return;
    collapse.querySelectorAll("a.nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 992 && collapse.classList.contains("show")) {
          var toggler = document.querySelector(".navbar-toggler");
          if (toggler && window.bootstrap) {
            var inst = window.bootstrap.Collapse.getOrCreateInstance(collapse);
            inst.hide();
          }
        }
      });
    });
  }

  /* ---------- Scrollspy: highlight active nav link ---------- */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.hp-nav .nav-link[href^="#"]'));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = l;
    });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          if (map[e.target.id]) map[e.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { obs.observe(document.getElementById(id)); });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  function initCountUp() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(function (n) { n.textContent = n.getAttribute("data-count"); });
      return;
    }
    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
      var start = null, dur = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(dec);
      };
      requestAnimationFrame(step);
    };
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); o.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  /* ---------- Beer filter by style ---------- */
  function initBeerFilter() {
    var bar = document.querySelector(".filter-bar");
    var grid = document.querySelector(".beer-grid");
    if (!bar || !grid) return;
    var empty = document.querySelector(".no-results");
    var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter-btn"));

    var apply = function (style) {
      var shown = 0;
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".beer-card"));
      cards.forEach(function (card) {
        var match = style === "all" || card.getAttribute("data-style") === style;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      if (empty) empty.classList.toggle("show", shown === 0);
    };

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      buttons.forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      apply(btn.getAttribute("data-filter"));
    });
  }

  /* ---------- Admin gate (client-side only, deters casual editing) ---------- */
  var ADMIN_PIN = "1234";
  var ADMIN_SESSION_KEY = "hops_admin_unlocked";

  function isAdmin() {
    try {
      return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function initAdminGate() {
    var toggleBtn = document.getElementById("adminToggleBtn");
    var modal = document.getElementById("adminModal");
    var closeBtn = document.getElementById("adminModalClose");
    var form = document.getElementById("adminForm");
    var pinInput = document.getElementById("adminPin");
    var errorMsg = document.getElementById("adminError");
    if (!toggleBtn || !modal || !form) return;

    var refreshUI = function () {
      var admin = isAdmin();
      document.body.classList.toggle("is-admin", admin);
      toggleBtn.textContent = admin ? "Exit Admin" : "Admin";
      toggleBtn.classList.toggle("is-active", admin);
    };

    var openModal = function () {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      errorMsg.hidden = true;
      form.reset();
      pinInput.focus();
    };
    var closeModal = function () {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      toggleBtn.focus();
    };

    toggleBtn.addEventListener("click", function () {
      if (isAdmin()) {
        try { window.sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) {}
        refreshUI();
      } else {
        openModal();
      }
    });
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (pinInput.value === ADMIN_PIN) {
        try { window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch (e) {}
        refreshUI();
        closeModal();
      } else {
        errorMsg.hidden = false;
        pinInput.value = "";
        pinInput.focus();
      }
    });

    refreshUI();
  }

  /* ---------- Add Product (localStorage) ---------- */
  var PRODUCTS_KEY = "hops_custom_products";

  function getStoredProducts() {
    try {
      return JSON.parse(window.localStorage.getItem(PRODUCTS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredProducts(products) {
    try {
      window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {}
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function readImageFile(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.readAsDataURL(file);
    });
  }

  function buildBeerCard(product) {
    var article = document.createElement("article");
    article.className = "beer-card beer-card--custom";
    article.setAttribute("data-style", product.style);
    article.setAttribute("data-id", product.id);
    article.setAttribute("tabindex", "0");
    article.setAttribute("role", "button");
    var thumb = product.image
      ? '<div class="beer-card__thumb"><img src="' + product.image + '" alt=""></div>'
      : '';
    article.innerHTML =
      thumb +
      '<div class="beer-card__body">' +
        '<div class="beer-card__top"><h3>' + escapeHtml(product.name) + '</h3><span class="style-chip" data-s="' + escapeHtml(product.style) + '">' + escapeHtml(product.style) + '</span></div>' +
        '<p class="beer-notes">' + escapeHtml(product.shortDesc) + '</p>' +
      '</div>';
    return article;
  }

  function initProductManager() {
    var grid = document.querySelector(".beer-grid");
    var modal = document.getElementById("productModal");
    var openBtn = document.getElementById("addProductBtn");
    var closeBtn = document.getElementById("productModalClose");
    var form = document.getElementById("productForm");
    if (!grid || !modal || !openBtn || !form) return;

    var openModal = function () {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var first = form.querySelector("input, select, textarea");
      if (first) first.focus();
    };
    var closeModal = function () {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      openBtn.focus();
    };

    openBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    var imageInput = document.getElementById("pImage");
    var imagePreview = document.getElementById("pImagePreview");
    if (imageInput && imagePreview) {
      imageInput.addEventListener("change", function () {
        var file = imageInput.files && imageInput.files[0];
        if (!file) { imagePreview.hidden = true; imagePreview.src = ""; return; }
        readImageFile(file).then(function (dataUrl) {
          imagePreview.src = dataUrl;
          imagePreview.hidden = false;
        });
      });
    }

    /* ---------- detail / edit modal ---------- */
    var detailModal = document.getElementById("productDetailModal");
    var detailClose = document.getElementById("productDetailClose");
    var detailForm = document.getElementById("productDetailForm");
    var detailEditBtn = document.getElementById("productDetailEdit");
    var detailDeleteBtn = document.getElementById("productDetailDelete");
    var dImagePreview = document.getElementById("dImagePreview");
    var dViewName = document.getElementById("productDetailTitle");
    var dViewStyle = document.getElementById("dViewStyle");
    var dViewFullDesc = document.getElementById("dViewFullDesc");
    var dImageInput = document.getElementById("dImage");
    var activeProductId = null;

    var setDetailViewMode = function (isEditing) {
      detailForm.hidden = isEditing ? false : true;
      dViewName.hidden = isEditing;
      dViewStyle.hidden = isEditing;
      dViewFullDesc.hidden = isEditing;
      detailEditBtn.hidden = isEditing;
    };

    var populateDetail = function (product) {
      activeProductId = product.id;
      if (product.image) {
        dImagePreview.src = product.image;
        dImagePreview.hidden = false;
      } else {
        dImagePreview.hidden = true;
        dImagePreview.src = "";
      }
      dViewName.textContent = product.name;
      dViewStyle.textContent = product.style;
      dViewStyle.setAttribute("data-s", product.style);
      dViewFullDesc.textContent = product.fullDesc || product.shortDesc;
      document.getElementById("dName").value = product.name;
      document.getElementById("dStyle").value = product.style;
      document.getElementById("dShortDesc").value = product.shortDesc;
      document.getElementById("dFullDesc").value = product.fullDesc || "";
      dImageInput.value = "";
      setDetailViewMode(false);
    };

    var openDetailModal = function (product) {
      populateDetail(product);
      detailModal.classList.add("open");
      detailModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    var closeDetailModal = function () {
      detailModal.classList.remove("open");
      detailModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      activeProductId = null;
    };

    detailClose.addEventListener("click", closeDetailModal);
    detailModal.addEventListener("click", function (e) { if (e.target === detailModal) closeDetailModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && detailModal.classList.contains("open")) closeDetailModal();
    });
    detailEditBtn.addEventListener("click", function () { setDetailViewMode(true); });

    detailDeleteBtn.addEventListener("click", function () {
      if (!activeProductId) return;
      var card = grid.querySelector('.beer-card[data-id="' + activeProductId + '"]');
      if (card) card.remove();
      var products = getStoredProducts().filter(function (p) { return p.id !== activeProductId; });
      saveStoredProducts(products);
      closeDetailModal();
    });

    detailForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!activeProductId) return;
      var products = getStoredProducts();
      var product = products.filter(function (p) { return p.id === activeProductId; })[0];
      if (!product) return;

      var applyEdits = function (imageDataUrl) {
        product.name = (document.getElementById("dName").value || "").trim();
        product.style = document.getElementById("dStyle").value;
        product.shortDesc = (document.getElementById("dShortDesc").value || "").trim();
        product.fullDesc = (document.getElementById("dFullDesc").value || "").trim();
        if (imageDataUrl) product.image = imageDataUrl;
        if (!product.name || !product.shortDesc) return;

        saveStoredProducts(products);
        var oldCard = grid.querySelector('.beer-card[data-id="' + activeProductId + '"]');
        var newCard = buildBeerCard(product);
        wireCard(newCard, product);
        if (oldCard) oldCard.replaceWith(newCard);
        populateDetail(product);
      };

      var file = dImageInput.files && dImageInput.files[0];
      if (file) {
        readImageFile(file).then(applyEdits);
      } else {
        applyEdits(null);
      }
    });

    var wireCard = function (card, product) {
      card.addEventListener("click", function () { openDetailModal(product); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetailModal(product); }
      });
    };

    var addCardToGrid = function (product) {
      var card = buildBeerCard(product);
      grid.appendChild(card);
      var emptyMsg = document.querySelector(".no-results");
      var activeFilter = document.querySelector(".filter-btn.is-active");
      var filterVal = activeFilter ? activeFilter.getAttribute("data-filter") : "all";
      if (filterVal !== "all" && product.style !== filterVal) {
        card.classList.add("is-hidden");
      } else if (emptyMsg) {
        emptyMsg.classList.remove("show");
      }
      wireCard(card, product);
    };

    getStoredProducts().forEach(addCardToGrid);

    var finishSubmit = function (product) {
      if (!product.name || !product.shortDesc) return;
      var products = getStoredProducts();
      products.push(product);
      saveStoredProducts(products);
      addCardToGrid(product);

      form.reset();
      if (imagePreview) { imagePreview.hidden = true; imagePreview.src = ""; }
      closeModal();
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var product = {
        id: "p" + Date.now() + Math.random().toString(16).slice(2),
        name: (document.getElementById("pName").value || "").trim(),
        style: document.getElementById("pStyle").value,
        shortDesc: (document.getElementById("pShortDesc").value || "").trim(),
        fullDesc: (document.getElementById("pFullDesc").value || "").trim(),
        image: ""
      };

      var file = imageInput && imageInput.files && imageInput.files[0];
      if (file) {
        readImageFile(file).then(function (dataUrl) {
          product.image = dataUrl;
          finishSubmit(product);
        });
      } else {
        finishSubmit(product);
      }
    });
  }

  /* ---------- Shopping bag (merch) ---------- */
  function initBag() {
    var count = 0;
    var badge = document.querySelector(".hp-bag__count");
    var bagBtn = document.querySelector(".hp-bag");
    var addButtons = document.querySelectorAll("[data-add-bag]");
    if (!addButtons.length) return;

    var render = function () {
      if (!badge) return;
      badge.textContent = String(count);
      badge.classList.toggle("show", count > 0);
      if (bagBtn) bagBtn.setAttribute("aria-label", "Shopping bag, " + count + " item" + (count === 1 ? "" : "s"));
    };

    addButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        count++;
        render();
        var original = btn.getAttribute("data-label") || btn.textContent;
        btn.setAttribute("data-label", original);
        btn.textContent = "Added ✓";
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = original;
          btn.disabled = false;
        }, 1100);
      });
    });

    if (bagBtn) {
      bagBtn.addEventListener("click", function () {
        if (count === 0) { flashBag("Your bag is empty — grab some merch!"); return; }
        flashBag(count + " item" + (count === 1 ? "" : "s") + " in your bag. Checkout is a demo in this template.");
      });
    }
    function flashBag(msg) {
      var note = document.getElementById("bagNote");
      if (!note) { window.alert(msg); return; }
      note.textContent = msg;
      note.hidden = false;
      clearTimeout(note._t);
      note._t = setTimeout(function () { note.hidden = true; }, 3200);
    }
    render();
  }

  /* ---------- Gallery lightbox ---------- */
  function initLightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    var box = document.querySelector(".lightbox");
    if (!items.length || !box) return;
    var img = box.querySelector(".lightbox__fig img");
    var cap = box.querySelector(".lightbox__cap");
    var btnClose = box.querySelector(".lightbox__close");
    var btnPrev = box.querySelector(".lightbox__prev");
    var btnNext = box.querySelector(".lightbox__next");
    var current = 0;
    var lastFocus = null;

    var show = function (i) {
      current = (i + items.length) % items.length;
      var src = items[current].getAttribute("data-full");
      var alt = items[current].getAttribute("data-caption") || "";
      img.setAttribute("src", src);
      img.setAttribute("alt", alt);
      cap.textContent = alt;
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      btnClose.focus();
    };
    var close = function () {
      box.classList.remove("open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    items.forEach(function (it, i) {
      it.addEventListener("click", function () { open(i); });
      it.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
      });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(current - 1); });
    btnNext.addEventListener("click", function () { show(current + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- Newsletter validation ---------- */
  function initNewsletter() {
    var form = document.querySelector(".news-form");
    if (!form) return;
    var input = form.querySelector('input[type="email"]');
    var note = form.parentElement.querySelector(".form-note");
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!note) return;
      var val = (input.value || "").trim();
      if (!re.test(val)) {
        note.textContent = "Please enter a valid email address.";
        note.className = "form-note error";
        input.focus();
        return;
      }
      note.textContent = "Cheers! You’re on the Mash List — watch for fresh-tap news.";
      note.className = "form-note ok";
      form.reset();
    });
  }

  /* ---------- Highlight today's row in hours ---------- */
  function initTodayHours() {
    var rows = document.querySelectorAll("[data-day]");
    if (!rows.length) return;
    var today = new Date().getDay(); // 0 Sun .. 6 Sat
    rows.forEach(function (row) {
      var days = row.getAttribute("data-day").split(",").map(Number);
      if (days.indexOf(today) !== -1) {
        row.classList.add("is-today");
        var flag = document.createElement("span");
        flag.className = "today-flag";
        flag.textContent = "Today";
        var dayCell = row.querySelector(".day");
        if (dayCell) dayCell.appendChild(flag);
      }
    });
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initStickyNav();
    initMobileNav();
    initScrollSpy();
    initReveal();
    initCountUp();
    initBeerFilter();
    initAdminGate();
    initProductManager();
    initBag();
    initLightbox();
    initNewsletter();
    initTodayHours();
  });
})();
