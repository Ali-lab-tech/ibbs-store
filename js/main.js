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

  /* ---------- Published product catalog ---------- */
  function buildBeerCard(product) {
    var article = document.createElement("article");
    article.className = "beer-card beer-card--custom";
    article.setAttribute("data-style", product.style);
    article.setAttribute("data-id", product.id);
    article.setAttribute("tabindex", "0");
    article.setAttribute("role", "button");

    if (product.image) {
      var thumb = document.createElement("div");
      var image = document.createElement("img");
      thumb.className = "beer-card__thumb";
      image.src = product.image;
      image.alt = product.imageAlt || product.name;
      image.width = 896;
      image.height = 1200;
      image.loading = "lazy";
      image.decoding = "async";
      thumb.appendChild(image);
      article.appendChild(thumb);
    }

    var body = document.createElement("div");
    var top = document.createElement("div");
    var name = document.createElement("h3");
    var category = document.createElement("span");
    var description = document.createElement("p");
    body.className = "beer-card__body";
    top.className = "beer-card__top";
    name.textContent = product.name;
    category.className = "style-chip";
    category.setAttribute("data-s", product.style);
    category.textContent = product.style;
    description.className = "beer-notes";
    description.textContent = product.shortDesc;
    top.appendChild(name);
    top.appendChild(category);
    body.appendChild(top);
    body.appendChild(description);
    article.appendChild(body);
    return article;
  }

  function initProductCatalog() {
    var grid = document.querySelector(".beer-grid");
    var empty = document.querySelector(".no-results");
    var modal = document.getElementById("productDetailModal");
    var closeBtn = document.getElementById("productDetailClose");
    var gallery = document.getElementById("productDetailGallery");
    var title = document.getElementById("productDetailTitle");
    var category = document.getElementById("dViewStyle");
    var description = document.getElementById("dViewFullDesc");
    if (!grid || !empty || !modal || !closeBtn || !gallery || !title || !category || !description) return;

    var products = window.IBBS_PRODUCTS;
    if (!Array.isArray(products)) {
      console.error("IBBS product catalog is missing or invalid.");
      empty.textContent = "Product listings could not be loaded. Please contact IBBS.";
      empty.classList.add("show");
      return;
    }

    var lastFocus = null;
    var closeModal = function () {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    var openDetail = function (product, card) {
      lastFocus = card;
      gallery.replaceChildren();
      var productImages = Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []);
      productImages.forEach(function (src, index) {
        if (typeof src !== "string" || !src) return;
        var image = document.createElement("img");
        image.src = src;
        image.alt = Array.isArray(product.imageAlts) && product.imageAlts[index]
          ? product.imageAlts[index]
          : product.name + (productImages.length > 1 ? " - view " + (index + 1) : "");
        image.width = 896;
        image.height = 1200;
        image.loading = "eager";
        image.decoding = "async";
        gallery.appendChild(image);
      });
      title.textContent = product.name;
      category.textContent = product.style;
      category.setAttribute("data-s", product.style);
      description.textContent = product.fullDesc || product.shortDesc;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };
    var visibleCount = function () {
      return grid.querySelectorAll(".beer-card:not(.is-hidden)").length;
    };

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    products.forEach(function (product, index) {
      if (!product || typeof product.id !== "string" || !product.id ||
          typeof product.name !== "string" || !product.name ||
          typeof product.style !== "string" || !product.style ||
          typeof product.shortDesc !== "string" || !product.shortDesc ||
          (product.image !== undefined && typeof product.image !== "string") ||
          (product.imageAlt !== undefined && typeof product.imageAlt !== "string") ||
          (product.imageAlts !== undefined && (!Array.isArray(product.imageAlts) ||
            !product.imageAlts.every(function (alt) { return typeof alt === "string"; }))) ||
          (product.images !== undefined && (!Array.isArray(product.images) ||
            !product.images.every(function (src) { return typeof src === "string"; })))) {
        console.error("Invalid IBBS product catalog entry at index " + index + ".");
        return;
      }
      var card = buildBeerCard(product);
      var openCard = function () { openDetail(product, card); };
      card.addEventListener("click", openCard);
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCard();
        }
      });
      grid.appendChild(card);
    });

    if (visibleCount() === 0) empty.classList.add("show");
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
    initProductCatalog();
    initBag();
    initLightbox();
    initNewsletter();
    initQuoteOptions();
    initTodayHours();
  });
})();
