import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduced) {
  document.documentElement.classList.add("reduced-motion");
}

// Counters: работают всегда, чтобы цифры были видны даже при reduced-motion.
// При reduced-motion просто выставляем финальное значение без твина.
const setCounter = (el: HTMLElement) => {
  const target = Number(el.dataset.counter ?? 0);
  el.textContent = target.toLocaleString("ru-RU");
};

// Safety net: reveal every animated element and finalize counters. Used both
// when motion is reduced and if anything in the animation setup throws, so the
// page never gets stuck showing hidden content over an empty background.
const revealAll = () => {
  document
    .querySelectorAll<HTMLElement>(".fade-in, [data-stagger-item]")
    .forEach((el) => el.classList.add("visible"));
  document.querySelectorAll<HTMLElement>("[data-counter]").forEach(setCounter);
};

// Reveal-on-scroll for headings and card grids. Pure IntersectionObserver +
// CSS transitions — deliberately NOT GSAP ScrollTrigger, whose cached scroll
// positions can go stale after async web fonts/layout shifts and leave whole
// sections stuck at opacity:0 (data present in the DOM but invisible).
const setupReveals = () => {
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        if (el.hasAttribute("data-stagger")) {
          el
            .querySelectorAll<HTMLElement>("[data-stagger-item]")
            .forEach((item, i) => {
              item.style.transitionDelay = `${Math.min(i * 80, 480)}ms`;
              item.classList.add("visible");
            });
        } else {
          el.classList.add("visible");
        }
        obs.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );
  document
    .querySelectorAll<HTMLElement>(".fade-in, [data-stagger]")
    .forEach((el) => io.observe(el));
};

// Counters count up when scrolled into view (IntersectionObserver-driven).
const setupCounters = () => {
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const target = Number(el.dataset.counter ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: "expo.out",
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("ru-RU");
          },
        });
        obs.unobserve(el);
      }
    },
    { threshold: 0.3 },
  );
  document
    .querySelectorAll<HTMLElement>("[data-counter]")
    .forEach((el) => io.observe(el));
};

if (reduced) {
  revealAll();
} else {
  setupReveals();
}

// Signal to the inline fallback that the module loaded and is handling reveals.
document.documentElement.classList.add("anim-ready");

if (!reduced) {
  try {
    gsap.registerPlugin(ScrollTrigger);
    setupCounters();

    // Hero subtle parallax
    const heroBg = document.querySelector<HTMLElement>("[data-hero-bg]");
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: heroBg,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // Hero text reveal
    gsap.from("[data-hero-title] > span", {
      yPercent: 110,
      opacity: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.08,
      delay: 0.15,
    });
    gsap.from("[data-hero-sub]", {
      y: 24,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      delay: 0.5,
    });
    gsap.from("[data-hero-cta]", {
      y: 16,
      opacity: 0,
      duration: 0.8,
      ease: "expo.out",
      stagger: 0.1,
      delay: 0.7,
    });

    // Header solid on scroll
    const header = document.querySelector<HTMLElement>("[data-header]");
    if (header) {
      ScrollTrigger.create({
        start: 40,
        end: 99999,
        onUpdate: (self) => {
          if (self.scroll() > 40) header.classList.add("is-scrolled");
          else header.classList.remove("is-scrolled");
        },
      });
    }
  } catch {
    // If GSAP/ScrollTrigger fails for any reason, never leave the page blank.
    revealAll();
  }
}

// Lightbox (works regardless of motion preference)
const lightbox = document.querySelector<HTMLDialogElement>("[data-lightbox]");
const lightboxImg = lightbox?.querySelector<HTMLImageElement>("img");
const lightboxCaption =
  lightbox?.querySelector<HTMLElement>("[data-lightbox-caption]");

document.querySelectorAll<HTMLElement>("[data-lightbox-trigger]").forEach((trig) => {
  trig.addEventListener("click", (e) => {
    e.preventDefault();
    if (!lightbox || !lightboxImg) return;
    const src = trig.dataset.src ?? "";
    const cap = trig.dataset.caption ?? "";
    lightboxImg.src = src;
    lightboxImg.alt = cap;
    if (lightboxCaption) lightboxCaption.textContent = cap;
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else lightbox.setAttribute("open", "");
  });
});

lightbox
  ?.querySelector<HTMLElement>("[data-lightbox-close]")
  ?.addEventListener("click", () => lightbox.close());
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});

// Before/After slider
document.querySelectorAll<HTMLElement>("[data-ba]").forEach((wrap) => {
  const slider = wrap.querySelector<HTMLInputElement>("[data-ba-slider]");
  const top = wrap.querySelector<HTMLElement>("[data-ba-top]");
  const handle = wrap.querySelector<HTMLElement>("[data-ba-handle]");
  if (!slider || !top || !handle) return;
  const update = () => {
    const v = Number(slider.value);
    top.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    handle.style.left = `${v}%`;
  };
  slider.addEventListener("input", update);
  update();
});

// Gallery filter
document.querySelectorAll<HTMLElement>("[data-gallery]").forEach((gallery) => {
  const buttons = gallery.querySelectorAll<HTMLButtonElement>("[data-filter]");
  const items = gallery.querySelectorAll<HTMLElement>("[data-cat]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter ?? "all";
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      items.forEach((it) => {
        const match = filter === "all" || it.dataset.cat === filter;
        it.style.display = match ? "" : "none";
      });
    });
  });
});
