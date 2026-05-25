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

if (reduced) {
  document.querySelectorAll<HTMLElement>("[data-counter]").forEach(setCounter);
}

if (!reduced) {
  gsap.registerPlugin(ScrollTrigger);

  // Fade-in elements
  const ioFade = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          ioFade.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );
  document.querySelectorAll<HTMLElement>(".fade-in").forEach((el) => {
    ioFade.observe(el);
  });

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

  // Cards stagger
  document
    .querySelectorAll<HTMLElement>("[data-stagger]")
    .forEach((container) => {
      const items = container.querySelectorAll<HTMLElement>("[data-stagger-item]");
      if (!items.length) return;
      gsap.from(items, {
        opacity: 0,
        y: 36,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
        },
      });
    });

  // Counters
  document
    .querySelectorAll<HTMLElement>("[data-counter]")
    .forEach((el) => {
      const target = Number(el.dataset.counter ?? 0);
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: target,
            duration: 1.8,
            ease: "expo.out",
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString("ru-RU");
            },
          });
        },
      });
    });

  // Process horizontal scroll on desktop
  const proc = document.querySelector<HTMLElement>("[data-process-track]");
  if (proc && window.matchMedia("(min-width: 1024px)").matches) {
    const inner = proc.querySelector<HTMLElement>("[data-process-inner]");
    if (inner) {
      const distance = () => inner.scrollWidth - proc.clientWidth;
      gsap.to(inner, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: proc,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }
  }

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
