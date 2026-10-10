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

To publish catalog changes, commit and push them to the dev branch, then run this in
cPanel Terminal:

  cd ~/public_html
  git pull origin dev
