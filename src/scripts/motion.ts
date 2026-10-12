import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { initContact } from "./contact";
import { initThemeToggle } from "./theme";

/**
 * Motion layer. Everything here is progressive enhancement: the head script in
 * Base.astro only adds `html.motion` when JS runs and the visitor has not asked
 * for reduced motion, and the CSS that hides elements before their entrance is
 * keyed on that class. Without it the page is a plain, fully visible document.
 *
 * Two lifetimes:
 *  - once per document: Lenis smooth scroll, progress bar, nav hiding
 *  - once per page view (astro:page-load): every scroll/entrance animation,
 *    wrapped in a gsap.context so it can be reverted before the next swap.
 */
declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

gsap.registerPlugin(ScrollTrigger, SplitText);

const html = document.documentElement;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const motionOn = () => html.classList.contains("motion");
/** Thai / Burmese clusters must not be cut per character. */
const latin = () => html.lang === "en";

initThemeToggle();
initContact();

let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;
let cleanups: Array<() => void> = [];
let globalReady = false;

/* -------------------------------------------------------------------------- */
/* Once per document                                                          */
/* -------------------------------------------------------------------------- */
function setupGlobal() {
  globalReady = true;

  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener("scroll-lock", (e) => {
    const locked = (e as CustomEvent<boolean>).detail;
    if (locked) lenis?.stop();
    else lenis?.start();
  });

  // Same-page "#section" links. Astro's router and the browser both jump there
  // instantly, which leaves Lenis out of sync: later clicks land short or barely
  // move. Capture phase, so this runs before the router and it stands aside.
  // The offset comes from `scroll-padding-top` on <html>, which Lenis honours.
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const id = link?.getAttribute("href")!.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    history.replaceState(null, "", `#${id}`);
    // `force`: the mobile menu stops Lenis while open; it closes on this same click.
    requestAnimationFrame(() => lenis?.scrollTo(target, { duration: 1.2, force: true }));
  }, true);

  const setProgress = gsap.quickSetter($("[data-progress]")[0], "scaleX");
  lenis.on("scroll", (l: Lenis) => {
    setProgress(l.progress);
    // Floating nav steps aside while reading down, returns on any upward scroll.
    $("[data-nav]")[0]?.setAttribute("data-hidden", String(l.direction === 1 && l.scroll > 260));
  });
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
/** "98%" / "$4.2M" / "12+" -> a tween that counts the number and keeps the affixes. */
function countTween(el: HTMLElement, vars: gsap.TweenVars = {}) {
  const raw = (el.textContent ?? "").trim();
  const m = raw.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/s);
  if (!m) return null;
  const [, pre, num, suf] = m;
  const target = parseFloat(num);
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  const state = { v: 0 };
  const write = () => (el.textContent = `${pre}${state.v.toFixed(decimals)}${suf}`);
  write();
  return gsap.to(state, {
    v: target,
    duration: 2,
    ease: "power3.out",
    onUpdate: write,
    onComplete: () => (el.textContent = raw),
    ...vars,
  });
}

function typeInto(el: HTMLElement) {
  const chars = Array.from(el.textContent ?? "");
  const state = { n: 0 };
  el.textContent = "";
  return gsap.to(state, {
    n: chars.length,
    duration: Math.min(0.6, 0.15 + chars.length * 0.025),
    ease: "none",
    onUpdate: () => (el.textContent = chars.slice(0, Math.round(state.n)).join("")),
  });
}

/* -------------------------------------------------------------------------- */
/* Per page view                                                              */
/* -------------------------------------------------------------------------- */
function initPage() {
  ctx = gsap.context(() => {
    hero();
    headings();
    reveals();
    details();
    marquee();
    footerMark();
  });
}

function hero() {
  const section = $("[data-hero-section]")[0];
  if (!section) return;

  const h1 = $("[data-split='hero']")[0];
  const items = $("[data-hero]:not([data-hero='card'])");
  const card = $("[data-hero='card']")[0];
  const terms = $("[data-term]");

  // Split now (so layout is final), then play.
  const wordsOnly = !latin();
  const split = SplitText.create(h1, {
    type: wordsOnly ? "words" : "words,chars",
    mask: wordsOnly ? "words" : "chars",
    maskClass: "split-mask",
    wordsClass: "hero-word",
  });
  const parts = wordsOnly ? split.words : split.chars;
  gsap.set(parts, { yPercent: 125 });
  gsap.set(items, { autoAlpha: 0, y: 44 });
  gsap.set(card, { autoAlpha: 0, y: 90, scale: 0.9 });
  [h1, ...items, card].forEach((el) => el.classList.add("is-in"));

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(parts, { yPercent: 0, duration: 1.0, stagger: { each: wordsOnly ? 0.08 : 0.025 } }, 0)
    .to(items, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07 }, 0.2)
    .to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 1.0 }, 0.15);

  // Terminal "boots": each command types out, outputs fade in, stats count up.
  const term = gsap.timeline({ delay: 0.3 });
  terms.forEach((t) => {
    const typed = t.querySelector<HTMLElement>("[data-type]");
    const num = t.querySelector<HTMLElement>("[data-count]");
    term.call(() => t.classList.add("is-in"));
    if (typed) term.add(typeInto(typed));
    else term.from(t, { y: 12, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, ">-0.3");
    if (num) {
      const c = countTween(num, { duration: 1.1 });
      if (c) term.add(c, "<");
    }
  });
}

/** Section titles: each line rises out of its own mask. */
function headings() {
  $("[data-split='lines']").forEach((h) => {
    SplitText.create(h, {
      type: "lines",
      mask: "lines",
      maskClass: "split-mask",
      autoSplit: true,
      onSplit(self) {
        h.classList.add("is-in");
        return gsap.from(self.lines, {
          yPercent: 118,
          rotate: 2.5,
          transformOrigin: "0% 100%",
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.11,
          scrollTrigger: { trigger: h, start: "top 88%", once: true },
        });
      },
    });
  });
}

/** Body copy lights up word by word at reading pace as it crosses the viewport. */
/** Everything tagged [data-reveal], batched so siblings entering together cascade. */
function reveals() {
  const variants: Record<string, [gsap.TweenVars, gsap.TweenVars]> = {
    "": [{ y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out" }],
    fade: [{ autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out" }],
    left: [{ x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out" }],
    card: [
      { y: 120, rotationX: -16, scale: 0.92, autoAlpha: 0, transformPerspective: 900, transformOrigin: "50% 100%" },
      { y: 0, rotationX: 0, scale: 1, autoAlpha: 1, duration: 1.5, ease: "expo.out" },
    ],
  };

  for (const [name, [from, to]] of Object.entries(variants)) {
    const els = $(`[data-reveal="${name}"]`);
    if (!els.length) continue;
    gsap.set(els, from);
    els.forEach((el) => el.classList.add("is-in"));
    ScrollTrigger.batch(els, {
      start: "top 90%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { ...to, stagger: 0.14, overwrite: true, clearProps: "transform,filter" }),
    });
  }
}

/** Smaller moments: counters, tag pops, bullet dashes, drawn rules. */
function details() {
  $("[data-count]")
    .filter((el) => !el.closest("[data-hero-card]"))
    .forEach((el) => countTween(el, { scrollTrigger: { trigger: el, start: "top 92%", once: true } }));

  $("[data-tags]").forEach((ul) =>
    gsap.from(ul.children, {
      scale: 0.55,
      y: 12,
      autoAlpha: 0,
      duration: 0.9,
      ease: "back.out(2.2)",
      stagger: 0.045,
      scrollTrigger: { trigger: ul, start: "top 94%", once: true },
    }),
  );

  $("[data-stagger-list]").forEach((ul) => {
    const st = { trigger: ul, start: "top 86%", once: true };
    gsap.from(ul.children, { x: -26, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: st });
    gsap.from($("[data-bullet-dash]", ul), { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.1, scrollTrigger: st });
  });

  $("[data-rule]").forEach((r) =>
    gsap.from(r, { scaleX: 0, duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: r, start: "top 94%", once: true } }),
  );
}

/** Ad-style ticker: the CSS animation runs by itself; here we only steer its speed. */
function marquee() {
  const box = $("[data-marquee]")[0];
  const tracks = $("[data-marquee-track]");
  if (!box || !tracks.length) return;

  const anims = tracks.flatMap((t) => t.getAnimations());
  let target = 1; // scroll boost; sign follows scroll direction
  let current = 1;
  let hovered = false;
  box.addEventListener("pointerenter", () => (hovered = true));
  box.addEventListener("pointerleave", () => (hovered = false));

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      target = self.direction * (1 + Math.min(Math.abs(self.getVelocity()) / 220, 9));
    },
  });
  const tick = () => {
    target += (Math.sign(target) - target) * 0.04; // relax back to cruising speed
    current += ((hovered ? target * 0.2 : target) - current) * 0.08;
    anims.forEach((a) => (a.playbackRate = current || 0.001));
  };
  gsap.ticker.add(tick);
  cleanups.push(() => gsap.ticker.remove(tick));
}

function footerMark() {
  const el = $("[data-split='footer']")[0];
  if (!el) return;
  const wordsOnly = !latin();
  SplitText.create(el, {
    type: wordsOnly ? "words" : "words,chars",
    mask: wordsOnly ? "words" : "chars",
    maskClass: "split-mask",
    autoSplit: true,
    onSplit(self) {
      el.classList.add("is-in");
      return gsap.from(wordsOnly ? self.words : self.chars, {
        yPercent: 118,
        duration: 1.6,
        ease: "expo.out",
        stagger: 0.035,
        scrollTrigger: { trigger: el, start: "top 98%", once: true },
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */
document.addEventListener("astro:before-swap", () => {
  ctx?.revert();
  ctx = null;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  ScrollTrigger.getAll().forEach((t) => t.kill());
});

document.addEventListener("astro:after-swap", () => lenis?.scrollTo(0, { immediate: true, force: true }));

document.addEventListener("astro:page-load", () => {
  if (!motionOn()) return;
  try {
    if (!globalReady) setupGlobal();
    initPage();
    window.__motionReady = true;
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  } catch (err) {
    // Never leave content hidden because an animation failed to set up.
    console.error("[motion]", err);
    html.classList.remove("motion");
    window.__motionReady = true;
  }
});
