(function () {
  "use strict";

  // This client-side password prompt is a casual gate, not server authentication.
  var allowedFromProductButton = false;
  try {
    allowedFromProductButton = window.sessionStorage.getItem("ibbsProductEditorAccess") === "granted";
    window.sessionStorage.removeItem("ibbsProductEditorAccess");
  } catch (storageError) { /* Some local file origins restrict session storage. */ }
  if (!allowedFromProductButton && window.prompt("Enter password to open the product editor:") !== "1998") {
    window.location.replace("index.html#ontap");
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("adminProductForm");
    var catalogCount = document.getElementById("adminCatalogCount");
    var error = document.getElementById("adminProductError");
    var status = document.getElementById("productPublishStatus");
    var downloadButton = document.getElementById("downloadProductsBtn");
    var draftsWrap = document.getElementById("adminDraftsWrap");
    var draftList = document.getElementById("adminDraftList");
    var products = window.IBBS_PRODUCTS;

    if (!form || !catalogCount || !error || !status || !downloadButton || !draftsWrap || !draftList) return;
    if (!Array.isArray(products)) {
      console.error("IBBS product catalog is missing or invalid.");
      catalogCount.textContent = "The published product catalog could not be loaded.";
      form.querySelectorAll("button, input, select, textarea").forEach(function (field) {
        field.disabled = true;
      });
      return;
    }

    products = products.slice();
    var stagedAssets = [];
    var stagedCount = 0;
    catalogCount.textContent = "Published products loaded: " + products.length + ".";

    var setStatus = function (message) {
      status.textContent = message;
      status.hidden = !message;
    };
    var readImage = function (file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          if (typeof reader.result !== "string") {
            reject(new Error("Could not read " + file.name + "."));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = function () { reject(new Error("Could not read " + file.name + ".")); };
        reader.readAsDataURL(file);
      });
    };
    var downloadBlob = function (filename, blob) {
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    };
    var dataUrlToBlob = function (dataUrl) {
      var parts = dataUrl.split(",");
      var mime = (parts[0].match(/data:(.*?);base64/) || [])[1] || "application/octet-stream";
      var binary = window.atob(parts[1]);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    };
    var renderDraft = function (product) {
      var item = document.createElement("li");
      item.textContent = product.name + " — " + product.style;
      draftList.appendChild(item);
      draftsWrap.hidden = false;
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      error.hidden = true;
      error.textContent = "";

      var name = document.getElementById("newProductName").value.trim();
      var imageInput = document.getElementById("newProductImages");
      var files = Array.prototype.slice.call(imageInput.files || []);
      var supportedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (files.some(function (file) { return supportedTypes.indexOf(file.type) === -1; })) {
        error.textContent = "Use JPG, PNG, or WebP product photos.";
        error.hidden = false;
        return;
      }

      Promise.all(files.map(readImage)).then(function (dataUrls) {
        var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "industrial-product";
        var uniqueId = slug + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
        var imagePaths = files.map(function (file, index) {
          var extension = file.type === "image/png" ? ".png" : (file.type === "image/webp" ? ".webp" : ".jpg");
          return "img/" + uniqueId + "-" + String(index + 1).padStart(2, "0") + extension;
        });
        var imageAlt = document.getElementById("newProductImageAlt").value.trim();
        var product = {
          id: uniqueId,
          name: name,
          style: document.getElementById("newProductCategory").value,
          shortDesc: document.getElementById("newProductShortDesc").value.trim(),
          fullDesc: document.getElementById("newProductFullDesc").value.trim()
        };

        if (imagePaths.length) {
          product.image = imagePaths[0];
          product.imageAlt = imageAlt || name + " product photo";
          product.images = imagePaths;
          product.imageAlts = imagePaths.map(function (path, index) {
            return index === 0 ? product.imageAlt : name + " - view " + (index + 1);
          });
          files.forEach(function (file, index) {
            stagedAssets.push({ filename: imagePaths[index].slice(4), dataUrl: dataUrls[index] });
          });
        }

        products.push(product);
        stagedCount++;
        renderDraft(product);
        downloadButton.hidden = false;
        downloadButton.textContent = "Download Publish Files (" + stagedCount + ")";
        setStatus(stagedCount + " product draft" + (stagedCount === 1 ? "" : "s") + " ready.");
        form.reset();
      }).catch(function (readError) {
        console.error("Could not prepare product images.", readError);
        error.textContent = "Could not read a selected image. Please choose the files again.";
        error.hidden = false;
      });
    });

    downloadButton.addEventListener("click", function () {
      stagedAssets.forEach(function (asset) {
        downloadBlob(asset.filename, dataUrlToBlob(asset.dataUrl));
      });
      var source = "// Published product catalog. Deploy this file with the website.\nwindow.IBBS_PRODUCTS = " +
        JSON.stringify(products, null, 2) + ";\n";
      downloadBlob("products.js", new Blob([source], { type: "text/javascript;charset=utf-8" }));
      setStatus("Files downloaded. Move any product photos into img, replace js/products.js, then commit, push, and pull on cPanel to publish.");
    });
  });
})();
