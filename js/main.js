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

  /* ---------- Client logo grid ---------- */
  function initClientLogos() {
    var grid = document.getElementById("clientLogos");
    var toggle = document.getElementById("clientLogosToggle");
    if (!grid || !toggle) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".client-logo"));
    var expanded = false;
    if (!cards.length) return;

    var visibleCardCount = function () {
      var columns = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
      return Math.min(cards.length, columns * 3);
    };
    var updateVisibility = function () {
      var visibleCount = expanded ? cards.length : visibleCardCount();
      cards.forEach(function (card, index) { card.hidden = index >= visibleCount; });
      toggle.hidden = !expanded && visibleCount >= cards.length;
      toggle.textContent = expanded ? "Show fewer clients" : "Show all clients";
      toggle.setAttribute("aria-expanded", String(expanded));
    };
    var toggleCard = function (card) {
      var active = card.classList.toggle("is-active");
      card.setAttribute("aria-pressed", String(active));
    };

    cards.forEach(function (card) {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-pressed", "false");
      card.addEventListener("click", function () { toggleCard(card); });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleCard(card);
        }
      });
    });

    toggle.addEventListener("click", function () {
      expanded = !expanded;
      updateVisibility();
    });
    window.addEventListener("resize", updateVisibility);
    updateVisibility();
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

  function getDefaultProducts() {
    return [
      {
        id: "p-default-boiler-1",
        name: "Steam Boiler Feed Pump",
        style: "Boiler Parts",
        shortDesc: "High-efficiency pump built for continuous boiler feed service and steady pressure control.",
        fullDesc: "Engineered to support boiler feed systems with reliable flow, low maintenance needs, and consistent pressure under continuous industrial operation.",
        image: ""
      },
      {
        id: "p-default-auto-1",
        name: "PLC Control Module",
        style: "Automation Products",
        shortDesc: "Modular automation control unit for machine logic, fault handling, and process optimization.",
        fullDesc: "This PLC-based control solution helps streamline industrial automation with rapid diagnostics, stable communication, and easy integration into existing plant systems.",
        image: ""
      },
      {
        id: "p-default-pump-1",
        name: "Centrifugal Transfer Pump",
        style: "Pumps",
        shortDesc: "Durable transfer pump for fluids, wash-down systems, and plant circulation requirements.",
        fullDesc: "Designed for long service life in industrial environments, this centrifugal pump delivers dependable transfer performance with efficient energy use and easy maintenance access.",
        image: ""
      },
      {
        id: "p-default-elec-1",
        name: "Power Distribution Panel",
        style: "Electrical Items",
        shortDesc: "Safe and organized power distribution panel for factories, workshops, and industrial facilities.",
        fullDesc: "Built for reliable distribution of power across critical equipment with protection, labeling, and load balancing for cleaner operations.",
        image: ""
      },
      {
        id: "p-default-inst-1",
        name: "Digital Pressure Gauge",
        style: "Instruments",
        shortDesc: "High-accuracy gauge for pressure monitoring in process lines and mechanical systems.",
        fullDesc: "A digital measurement solution that improves process visibility, helps prevent overloads, and supports accurate monitoring across industrial applications.",
        image: ""
      },
      {
        id: "p-default-valve-1",
        name: "Industrial Gate Valve",
        style: "Valves",
        shortDesc: "Heavy-duty gate valve designed for shutoff control in demanding processing environments.",
        fullDesc: "This valve delivers dependable on/off performance with a rugged body and reliable seal design suited to flow control in industrial systems.",
        image: ""
      }
    ];
  }

  function getStoredProducts() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(PRODUCTS_KEY));
      if (Array.isArray(stored) && stored.length) {
        return stored;
      }
      window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(getDefaultProducts()));
      return getDefaultProducts();
    } catch (e) {
      return getDefaultProducts();
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

  /* ---------- Industrial product quote shortlist ---------- */
  function initBag() {
    var products = [];
    var badge = document.querySelector(".hp-bag__count");
    var bagBtn = document.querySelector(".hp-bag");
    var addButtons = document.querySelectorAll("[data-add-bag]");
    var modal = document.getElementById("quoteListModal");
    var closeBtn = document.getElementById("quoteListClose");
    var list = document.getElementById("quoteListItems");
    var empty = document.getElementById("quoteListEmpty");
    var actions = document.getElementById("quoteListActions");
    var whatsapp = document.getElementById("quoteListWhatsApp");
    var email = document.getElementById("quoteListEmail");
    var clearBtn = document.getElementById("quoteListClear");
    if (!bagBtn || !modal || !closeBtn || !list || !empty || !actions || !whatsapp || !email || !clearBtn) return;

    var render = function () {
      var count = products.length;
      if (badge) {
        badge.textContent = String(count);
        badge.classList.toggle("show", count > 0);
      }
      bagBtn.setAttribute("aria-label", "Quote list, " + count + " item" + (count === 1 ? "" : "s"));
      list.replaceChildren();
      products.forEach(function (product, index) {
        var item = document.createElement("li");
        var name = document.createElement("span");
        var remove = document.createElement("button");
        name.textContent = product;
        remove.type = "button";
        remove.className = "quote-list__remove";
        remove.textContent = "Remove";
        remove.setAttribute("aria-label", "Remove " + product + " from quote list");
        remove.setAttribute("data-remove-quote", String(index));
        item.appendChild(name);
        item.appendChild(remove);
        list.appendChild(item);
      });
      empty.hidden = count > 0;
      actions.hidden = count === 0;

      if (count > 0) {
        var message = "Hello, I would like a quotation for:\n" + products.map(function (product) {
          return "- " + product;
        }).join("\n");
        whatsapp.href = "https://wa.me/923092190828?text=" + encodeURIComponent(message);
        email.href = "https://mail.google.com/mail/?view=cm&fs=1&to=info.iibbs@gmail.com&su=" +
          encodeURIComponent("Industrial Product Quote Request") + "&body=" + encodeURIComponent(message);
      } else {
        whatsapp.removeAttribute("href");
        email.removeAttribute("href");
      }
      addButtons.forEach(function (btn) {
        var nameEl = btn.closest(".product-card").querySelector("h4");
        var selected = nameEl && products.indexOf(nameEl.textContent.trim()) !== -1;
        btn.setAttribute("aria-pressed", selected ? "true" : "false");
        btn.textContent = selected ? "Added to Quote" : "Add to Quote";
      });
    };

    addButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".product-card");
        var nameEl = card && card.querySelector("h4");
        if (!nameEl) return;
        var name = nameEl.textContent.trim();
        var index = products.indexOf(name);
        if (index === -1) products.push(name);
        else products.splice(index, 1);
        render();
      });
    });

    var lastFocus = null;
    var closeModal = function () {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    bagBtn.addEventListener("click", function () {
      lastFocus = document.activeElement;
      render();
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    });
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
    list.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-remove-quote]");
      if (!remove) return;
      var index = Number(remove.getAttribute("data-remove-quote"));
      if (index < 0 || index >= products.length) return;
      products.splice(index, 1);
      render();
    });
    clearBtn.addEventListener("click", function () {
      products = [];
      render();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
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

  /* ---------- Quote contact options ---------- */
  function initQuoteOptions() {
    var openBtn = document.getElementById("getQuoteBtn");
    var modal = document.getElementById("quoteOptionsModal");
    var closeBtn = document.getElementById("quoteOptionsClose");
    if (!openBtn || !modal || !closeBtn) return;

    var closeModal = function () {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      openBtn.focus();
    };

    openBtn.addEventListener("click", function () {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    });
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
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
    initClientLogos();
    initReveal();
    initCountUp();
    initBeerFilter();
    initAdminGate();
    initProductManager();
    initBag();
    initLightbox();
    initNewsletter();
    initQuoteOptions();
    initTodayHours();
  });
})();
