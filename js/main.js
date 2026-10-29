/* ==========================================================================
   IBBS — main.js  (vanilla only, no jQuery)
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

  /* ---------- Product catalog filters ---------- */
  function initProductFilter() {
    var bar = document.querySelector(".filter-bar");
    var grid = document.getElementById("industrialProductGrid");
    if (!bar || !grid) return;
    var empty = document.getElementById("industrialNoResults");
    var search = document.getElementById("productSearch");
    var count = document.getElementById("productCount");
    var tools = document.querySelector(".catalog-tools");
    var electronics = document.getElementById("inlineElectronics");
    var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter-btn"));

    var apply = function () {
      var active = bar.querySelector(".filter-btn.is-active");
      var style = active ? active.getAttribute("data-filter") : "all";
      var isElectronics = style === "electronics";
      grid.hidden = isElectronics;
      if (empty) empty.hidden = isElectronics;
      if (electronics) electronics.hidden = !isElectronics;
      if (tools) tools.hidden = isElectronics;
      if (isElectronics) {
        bar.dispatchEvent(new Event("electronicsviewchange"));
        return;
      }
      var query = search ? search.value.trim().toLocaleLowerCase() : "";
      var shown = 0;
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".catalog-card"));
      cards.forEach(function (card) {
        var categoryMatch = style === "all" || card.getAttribute("data-style") === style;
        var searchMatch = !query || (card.textContent || "").toLocaleLowerCase().indexOf(query) !== -1;
        var match = categoryMatch && searchMatch;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      if (count) count.textContent = shown + " product" + (shown === 1 ? "" : "s");
      if (empty) {
        empty.textContent = cards.length === 0
          ? "Our product catalog is being updated. Contact IBBS to ask about a specific part or specification."
          : "No products match your search. Try another name or category.";
        empty.classList.toggle("show", shown === 0);
      }
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
      apply();
      if (btn.getAttribute("data-filter") === "electronics") {
        history.replaceState(null, "", "#products-electronics");
      } else if (location.hash === "#products-electronics") {
        history.replaceState(null, "", "#products");
      }
    });
    if (search) search.addEventListener("input", apply);
    bar.addEventListener("catalogchange", apply);
    apply();
  }

  /* ---------- Electronics displayed inside the main product catalog ---------- */
  function initInlineElectronicsCatalog() {
    var panel = document.getElementById("inlineElectronics");
    var grid = document.getElementById("inlineElectronicsGrid");
    var search = document.getElementById("inlineElectronicsSearch");
    var category = document.getElementById("inlineElectronicsCategory");
    var count = document.getElementById("inlineElectronicsCount");
    var status = document.getElementById("inlineElectronicsStatus");
    var pagination = document.getElementById("inlineElectronicsPagination");
    var filterBar = document.querySelector(".filter-bar");
    if (!panel || !grid || !search || !category || !count || !status || !pagination || !filterBar) return;

    var products = [];
    var filtered = [];
    var page = 1;
    var pageSize = 24;
    var loaded = false;
    var loading = false;

    function cleanProductText(value) {
      return String(value || "").replace(/\bDigiLog(?:\.pk)?\b/gi, "").replace(/Why\s+Buy\s+from\s+\?/gi, "").replace(/\s+([,.;:!?])/g, "$1").replace(/\s*[|–—-]+\s*$/g, "").replace(/\s+/g, " ").trim();
    }

    function renderCard(product) {
      var card = document.createElement("article");
      card.className = "catalog-card catalog-card--custom";
      card.tabIndex = 0;
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", "View " + cleanProductText(product.name) + " details");
      if (product.image) {
        var thumb = document.createElement("div");
        var image = document.createElement("img");
        thumb.className = "catalog-card__thumb";
        image.src = product.image;
        image.alt = cleanProductText(product.imageAlt || product.name + " product photo");
        image.width = 480;
        image.height = 480;
        image.loading = "lazy";
        image.decoding = "async";
        thumb.appendChild(image);
        card.appendChild(thumb);
      }
      var body = document.createElement("div");
      var top = document.createElement("div");
      var name = document.createElement("h3");
      var chip = document.createElement("span");
      var description = document.createElement("p");
      body.className = "catalog-card__body";
      top.className = "catalog-card__top";
      name.textContent = cleanProductText(product.name);
      chip.className = "style-chip";
      chip.textContent = product.style || "Electronics Parts";
      description.className = "catalog-notes";
      description.textContent = cleanProductText(product.shortDesc || "Contact IBBS to confirm product details and availability.");
      top.appendChild(name);
      top.appendChild(chip);
      body.appendChild(top);
      body.appendChild(description);
      card.appendChild(body);
      var openDetails = function () {
        window.location.href = "electronics/" + encodeURIComponent(product.pageSlug || product.handle) + ".html";
      };
      card.addEventListener("click", openDetails);
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetails(); }
      });
      return card;
    }

    function render() {
      var pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = Math.min(page, pages);
      var start = (page - 1) * pageSize;
      var fragment = document.createDocumentFragment();
      filtered.slice(start, start + pageSize).forEach(function (product) { fragment.appendChild(renderCard(product)); });
      grid.replaceChildren(fragment);
      grid.setAttribute("aria-busy", "false");
      count.textContent = "Showing " + (filtered.length ? start + 1 : 0) + "–" + Math.min(start + pageSize, filtered.length) + " of " + filtered.length.toLocaleString() + " matching products (" + products.length.toLocaleString() + " total)";
      status.textContent = filtered.length ? "" : "No electronics parts match your search. Try another keyword or category.";
      status.classList.toggle("show", !filtered.length);
      pagination.replaceChildren();
      if (pages > 1) {
        var first = Math.max(1, page - 2);
        var last = Math.min(pages, page + 2);
        var addButton = function (label, value, disabled, current) {
          var button = document.createElement("button");
          button.type = "button";
          button.textContent = label;
          button.disabled = disabled;
          if (current) button.setAttribute("aria-current", "page");
          button.addEventListener("click", function () { page = value; render(); panel.scrollIntoView({ behavior: "smooth", block: "start" }); });
          pagination.appendChild(button);
        };
        addButton("Previous", page - 1, page === 1, false);
        for (var number = first; number <= last; number++) addButton(String(number), number, false, number === page);
        addButton("Next", page + 1, page === pages, false);
      }
    }

    function applyFilters() {
      var query = search.value.trim().toLocaleLowerCase();
      var selected = category.value;
      filtered = products.filter(function (product) {
        if (selected !== "all" && product.style !== selected) return false;
        return !query || [product.name, product.style, product.sku, product.shortDesc, (product.tags || []).join(" ")].join(" ").toLocaleLowerCase().indexOf(query) !== -1;
      });
      page = 1;
      render();
    }

    function loadCatalog() {
      if (loaded || loading) return;
      loading = true;
      status.textContent = "Loading electronics products…";
      status.classList.add("show");
      grid.setAttribute("aria-busy", "true");
      fetch("data/digilog-products.json", { credentials: "same-origin" })
        .then(function (response) { if (!response.ok) throw new Error("Catalog request failed (" + response.status + ")"); return response.json(); })
        .then(function (catalog) {
          products = Array.isArray(catalog.products) ? catalog.products : [];
          if (!products.length) throw new Error("No electronics products found.");
          Array.from(new Set(products.map(function (product) { return product.style; }).filter(Boolean))).sort().forEach(function (name) {
            var option = document.createElement("option"); option.value = name; option.textContent = name; category.appendChild(option);
          });
          loaded = true;
          applyFilters();
        })
        .catch(function (error) {
          grid.setAttribute("aria-busy", "false");
          status.textContent = "Electronics products could not be loaded. Please reload and try again.";
          status.classList.add("show");
          count.textContent = "";
          console.error("IBBS inline electronics catalog error:", error);
        })
        .finally(function () { loading = false; });
    }

    filterBar.addEventListener("electronicsviewchange", loadCatalog);
    document.querySelectorAll('a[href$="#products-electronics"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        history.replaceState(null, "", "#products-electronics");
        var button = filterBar.querySelector('[data-filter="electronics"]');
        if (button && !button.classList.contains("is-active")) button.click();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    search.addEventListener("input", applyFilters);
    category.addEventListener("change", applyFilters);
    if (location.hash === "#products-electronics") {
      var button = filterBar.querySelector('[data-filter="electronics"]');
      if (button) button.click();
    }
  }

  /* ---------- Published product catalog ---------- */
  function buildProductCard(product) {
    var article = document.createElement("article");
    article.className = "catalog-card catalog-card--custom";
    article.setAttribute("data-style", product.style);
    article.setAttribute("data-id", product.id);
    article.setAttribute("tabindex", "0");
    article.setAttribute("role", "button");

    if (product.image) {
      var thumb = document.createElement("div");
      var image = document.createElement("img");
      thumb.className = "catalog-card__thumb";
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
    body.className = "catalog-card__body";
    top.className = "catalog-card__top";
    name.textContent = product.name;
    category.className = "style-chip";
    category.setAttribute("data-s", product.style);
    category.textContent = product.style;
    description.className = "catalog-notes";
    description.textContent = product.shortDesc;
    top.appendChild(name);
    top.appendChild(category);
    body.appendChild(top);
    body.appendChild(description);
    article.appendChild(body);
    return article;
  }

  function initProductCatalog() {
    var grid = document.getElementById("industrialProductGrid");
    var empty = document.getElementById("industrialNoResults");
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
      return grid.querySelectorAll(".catalog-card:not(.is-hidden)").length;
    };

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    var appendProductCard = function (product) {
      var card = buildProductCard(product);
      var activeFilter = document.querySelector(".filter-btn.is-active");
      var filterValue = activeFilter ? activeFilter.getAttribute("data-filter") : "all";
      card.classList.toggle("is-hidden", filterValue !== "all" && product.style !== filterValue);
      card.addEventListener("click", function () { openDetail(product, card); });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail(product, card);
        }
      });
      grid.appendChild(card);
      empty.classList.toggle("show", visibleCount() === 0);
    };

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
      appendProductCard(product);
    });

    if (visibleCount() === 0) empty.classList.add("show");
    var filterBar = document.querySelector(".filter-bar");
    if (filterBar) filterBar.dispatchEvent(new Event("catalogchange"));

  }

  /* ---------- Scroll progress indicator ---------- */
  function initScrollProgress() {
    var progress = document.getElementById("scrollProgressBar");
    if (!progress) return;
    var scheduled = false;
    var update = function () {
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      var percent = maxScroll > 0 ? Math.min(100, Math.max(0, window.scrollY / maxScroll * 100)) : 0;
      progress.style.width = percent + "%";
      scheduled = false;
    };
    var schedule = function () {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
  }

  /* ---------- Subtle pointer depth on the hero card ---------- */
  function initHeroDepth() {
    var hero = document.querySelector(".hp-hero");
    var card = document.querySelector(".hp-hero__feature");
    if (!hero || !card || reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    hero.addEventListener("pointermove", function (event) {
      var bounds = hero.getBoundingClientRect();
      var x = (event.clientX - bounds.left) / bounds.width - .5;
      var y = (event.clientY - bounds.top) / bounds.height - .5;
      card.style.setProperty("--depth-x", (x * 3).toFixed(2) + "deg");
      card.style.setProperty("--depth-y", (y * -3).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", function () {
      card.style.setProperty("--depth-x", "0deg");
      card.style.setProperty("--depth-y", "0deg");
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
        badge.hidden = count === 0;
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
    initScrollProgress();
    initHeroDepth();
    initMobileNav();
    initScrollSpy();
    initClientLogos();
    initReveal();
    initCountUp();
    initProductFilter();
    initProductCatalog();
    initInlineElectronicsCatalog();
    initBag();
    initLightbox();
    initNewsletter();
    initQuoteOptions();
    initTodayHours();
  });
})();
