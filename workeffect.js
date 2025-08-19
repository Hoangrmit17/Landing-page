
/**
 * Works Carousel (mobile)
 * - Horizontal scroll-snap
 * - Center card scales up; neighbors peek and scale down
 * - Pagination dots auto-update
 * - Pure JS + your existing markup (.works-content > .work-card)
 */
(function () {
  const MOBILE = window.matchMedia("(max-width: 600px)");
  const section = document.getElementById("works");
  if (!section) return;

  const track = section.querySelector(".works-content");
  if (!track) return;

  let cards = [];
  let dots = null;
  let enabled = false;
  let raf = 0;

  function qCards() {
    // Only direct children that are .work-card
    return Array.from(track.children).filter((el) =>
      el.classList && el.classList.contains("work-card")
    );
  }

  function buildDots() {
    if (dots) dots.remove();
    dots = document.createElement("div");
    dots.className = "carousel-dots";
    const frag = document.createDocumentFragment();
    cards.forEach((_, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "carousel-dot";
      d.setAttribute("aria-label", `Go to slide ${i + 1}`);
      d.addEventListener("click", () => scrollToIndex(i));
      frag.appendChild(d);
    });
    dots.appendChild(frag);
    // Place dots after the track
    section.appendChild(dots);
  }

  function enable() {
    if (enabled) return;
    enabled = true;

    cards = qCards();
    if (!cards.length) return;

    buildDots();

    // Ensure scroll-snap container styles via data attr (CSS targets it)
    track.setAttribute("data-carousel", "mobile");

    // Update once & bind listeners
    update(true);
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
  }

  function disable() {
    if (!enabled) return;
    enabled = false;

    cancelAnimationFrame(raf);
    raf = 0;

    // Clean up classes/styles
    track.removeAttribute("data-carousel");
    track.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);

    qCards().forEach((c) => {
      c.classList.remove("is-center");
      c.style.setProperty("--scale", "");
    });

    if (dots) {
      dots.remove();
      dots = null;
    }
  }

  function onResize() {
    if (MOBILE.matches) enable();
    else disable();
    // Recompute after reflow
    update(true);
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      update(false);
      raf = 0;
    });
  }

  // Find nearest card index to viewport center
  function nearestIndex() {
    const center = track.scrollLeft + track.clientWidth / 2;
    let minDist = Infinity;
    let idx = 0;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const d = Math.abs(cardCenter - center);
      if (d < minDist) {
        minDist = d;
        idx = i;
      }
    });
    return idx;
  }

  function update(force) {
    if (!enabled) return;
    cards = qCards();
    if (!cards.length) return;

    const centerX = track.scrollLeft + track.clientWidth / 2;
    const maxDist = track.clientWidth * 0.7; // distance where scale reaches min
    const minScale = 0.94;
    const maxScale = 1.0;

    cards.forEach((card) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const d = Math.abs(cardCenter - centerX);
      const t = Math.min(d / maxDist, 1);
      const s = minScale + (1 - t) * (maxScale - minScale);
      card.style.setProperty("--scale", s.toFixed(3));
    });

    // set is-center on the nearest card for shadow/intensity tweaks
    const idx = nearestIndex();
    cards.forEach((c, i) => c.classList.toggle("is-center", i === idx));

    // dots
    if (dots) {
      const ds = Array.from(dots.children);
      ds.forEach((d, i) => d.classList.toggle("is-active", i === idx));
    }

    // If it's the first render, snap to the first card's center
    if (force) {
      scrollToIndex(idx, true);
    }
  }

  function scrollToIndex(i, instant = false) {
    const card = cards[i];
    if (!card) return;
    const left =
      card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left, behavior: instant ? "auto" : "smooth" });
  }

  // Kickoff
  onResize();
})();
