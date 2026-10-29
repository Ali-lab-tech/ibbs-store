(function () {
  "use strict";

  function splitParagraphs(text) {
    var sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
    var blocks = [];
    for (var i = 0; i < sentences.length; i += 2) {
      blocks.push(sentences.slice(i, i + 2).join(" ").trim());
    }
    return blocks.filter(Boolean);
  }

  function addSection(copy, heading, text) {
    text = text.replace(/\s+/g, " ").trim();
    if (!text) return;
    if (heading) {
      var title = document.createElement("h3");
      title.className = "electronics-description-section__heading";
      title.textContent = heading;
      copy.appendChild(title);
    }
    splitParagraphs(text).forEach(function (block) {
      var paragraph = document.createElement("p");
      paragraph.textContent = block;
      copy.appendChild(paragraph);
    });
  }

  function formatProductDescription() {
    var copy = document.querySelector(".electronics-product-copy");
    if (!copy) return;
    var original = copy.querySelector("p:not(.electronics-product-copy__note)");
    if (!original) return;

    var description = original.textContent.replace(/\s+/g, " ").trim();
    var headings = "Product Description|Key Features|Features|Product Specifications|Technical Specifications|Specification Details|Specifications|Applications|Compatibility|Package Includes|Package Contents|What's Included|Product Details";
    var marker = new RegExp("\\b(" + headings + ")\\s*:?\\s*", "gi");
    var sections = [];
    var lastIndex = 0;
    var match;
    while ((match = marker.exec(description)) !== null) {
      var before = description.slice(lastIndex, match.index).trim();
      if (before) sections.push({ heading: "", text: before });
      sections.push({ heading: match[1], text: "" });
      lastIndex = marker.lastIndex;
    }
    var tail = description.slice(lastIndex).trim();
    if (tail && sections.length) sections[sections.length - 1].text = tail;
    else if (tail) sections.push({ heading: "", text: tail });

    var note = copy.querySelector(".electronics-product-copy__note");
    original.remove();
    sections.forEach(function (section) { addSection(copy, section.heading, section.text); });
    if (note) copy.appendChild(note);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", formatProductDescription);
  } else {
    formatProductDescription();
  }
})();
