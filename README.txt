IBBS Store Website
==================

Static HTML, CSS, and vanilla JavaScript site for Industrial Boiler & Burner Services.

Shared product catalog
----------------------
Published product listings are stored in js/products.js, so every visitor sees the
same catalog. Add entries to window.IBBS_PRODUCTS using this shape:

  window.IBBS_PRODUCTS = [
    {
      id: "unique-product-id",
      name: "Verified product name",
      style: "Boiler Parts",
      shortDesc: "Original, verified summary shown on the product card.",
      fullDesc: "Original description using confirmed product information.",
      image: "img/approved-product-photo.jpg",
      imageAlt: "Accurate descriptive text for the main product image.",
      images: ["img/approved-product-photo.jpg", "img/approved-product-view-2.jpg"],
      imageAlts: ["Front view of the product", "Side view of the product"]
    }
  ];

Supported categories are Boiler Parts, Automation Products, Pumps, Electrical Items,
Instruments, and Valves. The fullDesc, image, and images fields are optional. Use
images for a gallery of multiple product views. Use imageAlt and imageAlts for
accurate descriptive alt text. Product photos must be IBBS-owned or used with
permission.
Do not copy supplier descriptions or make unverified specifications or compatibility
claims.

The product editor is local-only and must not be uploaded to the live website.
Open product-admin.html from your local working copy to prepare catalog drafts.
It is intentionally excluded from Git, along with js/product-admin.js, so it will
not be deployed when you push or pull website changes. Download the publish files
from the local editor, move any downloaded images into the site's img folder, and
replace js/products.js with the downloaded catalog file.

To publish the downloaded files, commit and push them to the dev branch, then run
this in cPanel Terminal:

  cd ~/public_html
  git pull origin dev
