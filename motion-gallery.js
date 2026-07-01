(function () {
  "use strict";

  const gallery = document.querySelector(".kurumi-gallery-grid, .kurumi-art-grid");
  if (!gallery) return;

  gallery.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-gallery-src]");
    if (!trigger) return;
    document.documentElement.classList.add("gallery-lightbox-opening");
    window.setTimeout(() => document.documentElement.classList.remove("gallery-lightbox-opening"), 420);
  });
}());
