(function () {
  "use strict";

  const grid = document.querySelector("#articleList");
  const filters = document.querySelector(".article-filters");
  if (!grid || !filters) return;

  let timer = 0;
  function markRearranging() {
    grid.classList.add("is-rearranging");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => grid.classList.remove("is-rearranging"), 320);
  }

  filters.addEventListener("input", markRearranging);
  filters.addEventListener("change", markRearranging);
  filters.addEventListener("click", (event) => {
    if (event.target.closest("button")) markRearranging();
  });
}());
