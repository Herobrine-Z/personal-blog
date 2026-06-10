const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lightbox = document.querySelector("#imageLightbox");
const lightboxImage = lightbox.querySelector("img");
const header = document.querySelector(".site-header");

window.addEventListener(
  "scroll",
  () => header.classList.toggle("scrolled", window.scrollY > 30),
  { passive: true },
);

document.querySelectorAll("[data-gallery-src]").forEach((button) => {
  button.addEventListener("click", () => {
    lightboxImage.src = button.dataset.gallerySrc;
    lightboxImage.alt = button.dataset.galleryAlt;
    lightbox.showModal();
  });
});

lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

if (window.gsap && !reducedMotion) {
  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .from(".kurumi-page-hero-copy .eyebrow", { x: -24, autoAlpha: 0, duration: 0.6 })
    .from(".kurumi-page-hero-copy h1", { y: 45, autoAlpha: 0, duration: 0.9 }, "-=0.25")
    .from(".kurumi-page-hero-copy > p:last-of-type", { y: 20, autoAlpha: 0, duration: 0.65 }, "-=0.45")
    .from(".kurumi-page-hero-copy .ink-button", { y: 15, autoAlpha: 0, duration: 0.5 }, "-=0.3");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        gsap.fromTo(entry.target, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}
