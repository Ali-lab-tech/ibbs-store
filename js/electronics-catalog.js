(function () {
  "use strict";

  var pageSize = 24;
  var products = [];
  var filtered = [];
  var currentPage = 1;
  var grid = document.getElementById("electronicsGrid");
  var search = document.getElementById("electronicsSearch");
  var categorySelect = document.getElementById("electronicsCategory");
  var count = document.getElementById("electronicsCount");
  var pageInfo = document.getElementById("electronicsPageInfo");
  var status = document.getElementById("electronicsStatus");
  var pagination = document.getElementById("electronicsPagination");
  if (!grid || !search || !categorySelect || !count || !pageInfo || !status || !pagination) return;

  function cleanSearch(value) {
    return String(value || "").toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function makeCard(product) {
    var link = document.createElement("a");
    link.className = "electronics-card";
    link.href = "electronics/" + encodeURIComponent(product.pageSlug || product.handle) + ".html";
    link.setAttribute("aria-label", "View product details: " + product.name);

    if (product.image) {
      var imageWrap = document.createElement("div");
      imageWrap.className = "electronics-card__image";
      var image = document.createElement("img");
      image.src = product.image;
      image.alt = product.imageAlt || product.name + " product photo.";
      image.width = 480;
      image.height = 480;
      image.loading = "lazy";
      image.decoding = "async";
      imageWrap.appendChild(image);
      link.appendChild(imageWrap);
    } else {
      var placeholder = document.createElement("div");
      placeholder.className = "electronics-card__placeholder";
      placeholder.textContent = "Image unavailable";
      link.appendChild(placeholder);
    }

    var body = document.createElement("div");
    body.className = "electronics-card__body";
    var category = document.createElement("span");
    category.className = "electronics-card__category";
    category.textContent = product.style || "Electronics Parts";
    var heading = document.createElement("h3");
    heading.textContent = product.name;
    body.appendChild(category);
    body.appendChild(heading);
    if (product.sku) {
      var sku = document.createElement("p");
      sku.className = "electronics-card__sku";
      sku.textContent = "SKU: " + product.sku;
      body.appendChild(sku);
    }
    if (product.shortDesc) {
      var description = document.createElement("p");
      description.className = "electronics-card__description";
      description.textContent = product.shortDesc;
      body.appendChild(description);
    }
    var more = document.createElement("span");
    more.className = "electronics-card__link";
    more.textContent = "View product details →";
    body.appendChild(more);
    link.appendChild(body);
    return link;
  }

  function makePageButton(label, page, disabled, current) {
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = Boolean(disabled);
    button.setAttribute("data-page", String(page));
    if (current) button.setAttribute("aria-current", "page");
    if (label === "Previous") button.setAttribute("aria-label", "Previous page");
    if (label === "Next") button.setAttribute("aria-label", "Next page");
    return button;
  }

  function renderPagination(totalPages) {
    pagination.replaceChildren();
    if (totalPages < 2) return;
    pagination.appendChild(makePageButton("Previous", currentPage - 1, currentPage === 1, false));
    var start = Math.max(1, currentPage - 2);
    var end = Math.min(totalPages, currentPage + 2);
    if (start > 1) {
      pagination.appendChild(makePageButton("1", 1, false, currentPage === 1));
      if (start > 2) {
        var leftGap = document.createElement("span");
        leftGap.className = "electronics-page-gap";
        leftGap.textContent = "…";
        pagination.appendChild(leftGap);
      }
    }
    for (var page = start; page <= end; page++) {
      pagination.appendChild(makePageButton(String(page), page, false, page === currentPage));
    }
    if (end < totalPages) {
      if (end < totalPages - 1) {
        var rightGap = document.createElement("span");
        rightGap.className = "electronics-page-gap";
        rightGap.textContent = "…";
        pagination.appendChild(rightGap);
      }
      pagination.appendChild(makePageButton(String(totalPages), totalPages, false, currentPage === totalPages));
    }
    pagination.appendChild(makePageButton("Next", currentPage + 1, currentPage === totalPages, false));
  }

  function render() {
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    var startIndex = (currentPage - 1) * pageSize;
    var pageProducts = filtered.slice(startIndex, startIndex + pageSize);
    var fragment = document.createDocumentFragment();
    pageProducts.forEach(function (product) { fragment.appendChild(makeCard(product)); });
    grid.replaceChildren(fragment);
    grid.setAttribute("aria-busy", "false");
    var shownStart = filtered.length ? startIndex + 1 : 0;
    var shownEnd = Math.min(startIndex + pageSize, filtered.length);
    count.textContent = "Showing " + shownStart + "–" + shownEnd + " of " + filtered.length.toLocaleString() + " matching products (" + products.length.toLocaleString() + " total).";
    pageInfo.textContent = "Page " + currentPage.toLocaleString() + " of " + totalPages.toLocaleString();
    status.classList.toggle("is-visible", filtered.length === 0);
    status.textContent = filtered.length === 0 ? "No products match your search. Try a different keyword or category." : "";
    renderPagination(totalPages);
  }

  function applyFilters() {
    var query = cleanSearch(search.value);
    var category = categorySelect.value;
    filtered = products.filter(function (product) {
      var categoryMatches = category === "all" || product.style === category;
      if (!categoryMatches) return false;
      if (!query) return true;
      var tags = Array.isArray(product.tags) ? product.tags.join(" ") : "";
      var text = cleanSearch([product.name, product.style, product.sku, product.shortDesc, tags].join(" "));
      return text.indexOf(query) !== -1;
    });
    currentPage = 1;
    render();
  }

  search.addEventListener("input", applyFilters);
  categorySelect.addEventListener("change", applyFilters);
  pagination.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.getAttribute("data-page")) || 1;
    render();
    document.getElementById("electronicsCatalogHeading").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  fetch("data/digilog-products.json", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("Catalog data request failed (" + response.status + ").");
      return response.json();
    })
    .then(function (catalog) {
      products = Array.isArray(catalog.products) ? catalog.products : [];
      if (!products.length) throw new Error("No products were found in the catalog data.");
      var categories = Array.from(new Set(products.map(function (product) { return product.style; }).filter(Boolean))).sort();
      categories.forEach(function (name) {
        var option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        categorySelect.appendChild(option);
      });
      applyFilters();
    })
    .catch(function (error) {
      grid.setAttribute("aria-busy", "false");
      count.textContent = "Product catalog could not be loaded.";
      pageInfo.textContent = "";
      pagination.replaceChildren();
      status.textContent = error.message + " Please reload the page or contact IBBS for product information.";
      status.classList.add("is-visible");
      console.error("IBBS electronics catalog error:", error);
    });
})();
