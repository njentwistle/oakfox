/**
 * OakFox motion entrypoint.
 *
 * Bootstraps Lenis smooth scroll, registers GSAP ScrollTrigger, runs the
 * homepage choreography, respects prefers-reduced-motion, and tears down
 * cleanly across Astro view transitions (`astro:before-preparation` →
 * `astro:after-swap` → `astro:page-load`).
 *
 * Conventions:
 *   - Each scene init function bails early when its target selector is
 *     missing, so the same module is safe to import on every page.
 *   - All scene tweens live inside a single page-scoped `gsap.context` so
 *     `ctx.revert()` cleans them up between transitions.
 *   - Lenis is created once per full document load and torn down on
 *     `astro:before-preparation` so the next page boots a fresh instance.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let pageContext: gsap.Context | null = null;
let rafTickerCallback: ((time: number) => void) | null = null;
let bootBound = false;

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const desktop = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

/* ------------------------------------------------------------------ */
/* Lenis bootstrap                                                     */
/* ------------------------------------------------------------------ */

function startLenis(): void {
  if (lenis || prefersReduced()) return;

  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  lenis.on('scroll', ScrollTrigger.update);

  rafTickerCallback = (time: number) => {
    lenis?.raf(time * 1000);
  };
  gsap.ticker.add(rafTickerCallback);
  gsap.ticker.lagSmoothing(0);
}

function stopLenis(): void {
  if (rafTickerCallback) {
    gsap.ticker.remove(rafTickerCallback);
    rafTickerCallback = null;
  }
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Collect every inner <span> already present inside `.split-word` masks.
 * The hero markup ships pre-split (server-rendered) so we just query.
 */
function collectSplitWords(el: HTMLElement): HTMLSpanElement[] {
  return Array.from(el.querySelectorAll<HTMLSpanElement>('.split-word > span'));
}

/**
 * Build per-letter spans inside the given element, preserving its existing
 * text. Used for the CTA "lasts" italic flourish. Idempotent — re-running
 * over already-split markup re-derives the same letters from textContent.
 */
function splitLetters(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  const out: HTMLSpanElement[] = [];
  for (const char of Array.from(text)) {
    if (char === ' ') {
      el.appendChild(document.createTextNode(' '));
      continue;
    }
    const outer = document.createElement('span');
    outer.className = 'split-letter';
    const inner = document.createElement('span');
    inner.textContent = char;
    outer.appendChild(inner);
    el.appendChild(outer);
    out.push(inner);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */
/* All scene functions create tweens directly. They run inside a parent
 * `gsap.context()` callback (see runScenes below) so every animation is
 * automatically registered with the page context for clean revert. */

const magneticListeners: Array<() => void> = [];

function clearMagnetic(): void {
  while (magneticListeners.length) magneticListeners.pop()?.();
}

function heroScene(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="hero"]');
  if (!root) return;

  const headline = root.querySelector<HTMLElement>('.headline');
  const label = root.querySelector<HTMLElement>('.label');
  const paragraph = root.querySelector<HTMLElement>('[data-hero-paragraph]');
  const cta = root.querySelector<HTMLElement>('[data-magnetic]');
  const glow = root.querySelector<HTMLElement>('.hero-glow');
  const nudge = root.querySelector<HTMLElement>('.nudge');

  const words = headline ? collectSplitWords(headline) : [];

  if (prefersReduced()) {
    if (words.length) gsap.set(words, { yPercent: 0, opacity: 1 });
    [label, paragraph, cta].forEach((el) => {
      if (el) gsap.set(el, { autoAlpha: 1, y: 0 });
    });
    return;
  }

  if (words.length) {
    gsap.set(words, { yPercent: 128 });
    gsap.to(words, {
      yPercent: 0,
      duration: 0.9,
      ease: 'power4.out',
      stagger: 0.06,
      delay: 0.15,
    });
  }

  if (label) {
    gsap.fromTo(
      label,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.05 },
    );
  }
  if (paragraph) {
    gsap.fromTo(
      paragraph,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.55 },
    );
  }
  if (cta) {
    gsap.fromTo(
      cta,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 },
    );
  }

  if (glow) {
    gsap.to(glow, {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  if (nudge) {
    gsap.to(nudge, {
      autoAlpha: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: '20% top',
        scrub: true,
      },
    });
  }
}

function magneticScene(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  if (!targets.length || prefersReduced() || !desktop()) return;

  targets.forEach((cta) => {
    const icon = cta.querySelector<HTMLElement>('span.rounded-full');
    const xTo = gsap.quickTo(cta, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(cta, 'y', { duration: 0.45, ease: 'power3.out' });
    const iconRotate = icon
      ? gsap.quickTo(icon, 'rotate', { duration: 0.6, ease: 'power3.out' })
      : null;

    const onMove = (e: MouseEvent) => {
      const rect = cta.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.35;
      const max = 8;
      xTo(Math.max(-max, Math.min(max, dx)));
      yTo(Math.max(-max, Math.min(max, dy)));
    };
    const onEnter = () => {
      iconRotate?.(45);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
      iconRotate?.(0);
    };

    cta.addEventListener('mousemove', onMove);
    cta.addEventListener('mouseenter', onEnter);
    cta.addEventListener('mouseleave', onLeave);

    magneticListeners.push(() => {
      cta.removeEventListener('mousemove', onMove);
      cta.removeEventListener('mouseenter', onEnter);
      cta.removeEventListener('mouseleave', onLeave);
    });
  });
}

function workScene(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="work"]');
  if (!root) return;

  const headerRow = root.querySelector<HTMLElement>('.flex.items-baseline.justify-between');
  // The featured (large) item is a direct <a> child of `.reveal-stagger`;
  // grid items sit inside the nested `.grid` container.
  const featured = root.querySelector<HTMLElement>('.reveal-stagger > a');
  const featuredImg = featured?.querySelector<HTMLImageElement>('img');
  const gridItems = root.querySelectorAll<HTMLElement>('.reveal-stagger .grid > a');

  if (prefersReduced()) {
    if (featured) gsap.set(featured, { clipPath: 'none', opacity: 1 });
    gsap.set(gridItems, { clipPath: 'none', opacity: 1 });
    return;
  }

  if (headerRow) {
    const label = headerRow.querySelector<HTMLElement>('.label');
    const link = headerRow.querySelector<HTMLElement>('a');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: headerRow, start: 'top 85%' },
    });
    if (label) tl.from(label, { y: 22, autoAlpha: 0, duration: 0.7, ease: 'power3.out' }, 0);
    if (link)
      tl.from(
        link,
        { autoAlpha: 0, x: -12, duration: 0.7, ease: 'power3.out' },
        0.05,
      );
  }

  if (featured) {
    gsap.fromTo(
      featured,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)',
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: featured, start: 'top 80%' },
      },
    );
    if (featuredImg) {
      gsap.fromTo(
        featuredImg,
        { scale: 1.06 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: featured,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }
  }

  if (gridItems.length) {
    gridItems.forEach((item, i) => {
      gsap.fromTo(
        item,
        { clipPath: 'inset(0 0 100% 0)' },
        {
          clipPath: 'inset(0 0 0% 0)',
          duration: 1.0,
          ease: 'power3.out',
          delay: i * 0.15,
          scrollTrigger: { trigger: item, start: 'top 85%' },
        },
      );
    });
  }
}

function approachScene(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="approach"]');
  if (!root) return;

  const left = root.querySelector<HTMLElement>('.md\\:col-span-5');
  const services = root.querySelectorAll<HTMLElement>('ul li');
  const locations = root.querySelectorAll<HTMLElement>('[data-locations] a');

  if (prefersReduced()) return; // base CSS already shows everything

  if (left) {
    const children = left.querySelectorAll<HTMLElement>('p.label, h2, p:not(.label)');
    gsap.from(children, {
      autoAlpha: 0,
      y: 24,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: left, start: 'top 80%' },
    });
  }

  if (services.length && services[0].parentElement) {
    gsap.from(services, {
      autoAlpha: 0,
      x: 30,
      ease: 'power2.out',
      stagger: 0.08,
      duration: 0.6,
      scrollTrigger: {
        trigger: services[0].parentElement,
        start: 'top 85%',
        end: 'bottom 60%',
        scrub: 0.6,
      },
    });
  }

  if (locations.length && locations[0].parentElement) {
    gsap.from(locations, {
      autoAlpha: 0,
      x: 12,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.05,
      scrollTrigger: { trigger: locations[0].parentElement, start: 'top 90%' },
    });
  }
}

function statsScene(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="stats"]');
  if (!root) return;

  // Stats live as direct child <div>s inside [data-scene="stats"].
  const cells = root.querySelectorAll<HTMLElement>(':scope > div');
  if (!cells.length) return;

  if (prefersReduced()) return;

  gsap.from(cells, {
    autoAlpha: 0,
    y: 20,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: { trigger: root, start: 'top 85%' },
  });

  const counters = root.querySelectorAll<HTMLElement>('[data-count-to]');
  counters.forEach((el) => {
    const target = el.getAttribute('data-count-to');
    if (target == null) return;
    const suffix = el.getAttribute('data-count-suffix') ?? '';
    const final = parseFloat(target);
    if (!Number.isFinite(final)) return;

    const proxy = { v: 0 };
    gsap.to(proxy, {
      v: final,
      duration: 1.6,
      ease: 'power2.out',
      paused: true,
      onUpdate: () => {
        const v = Math.round(proxy.v);
        el.textContent = `${v}${suffix}`;
      },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: (self) => {
          self.animation?.play(0);
        },
      },
    });
  });
}

function journalScene(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="journal"]');
  if (!root) return;
  if (prefersReduced()) return;

  const label = root.querySelector<HTMLElement>('.label');
  const link = root.querySelector<HTMLElement>('a.group');
  const allLink = root.querySelector<HTMLElement>('a.link-line');

  if (label) {
    gsap.from(label, {
      autoAlpha: 0,
      x: -8,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: root, start: 'top 85%' },
    });
  }
  if (link) {
    gsap.from(link, {
      autoAlpha: 0,
      x: -20,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.1,
      scrollTrigger: { trigger: root, start: 'top 85%' },
    });
  }
  if (allLink) {
    gsap.from(allLink, {
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      delay: 0.2,
      scrollTrigger: { trigger: root, start: 'top 85%' },
    });
  }
}

/**
 * Horizontal work gallery (prototype / new design language).
 *
 * Pins `[data-scene="hwork"]` and converts vertical scroll into a horizontal
 * translate of `[data-h-track]`. Each `[data-h-card]` blurs, shrinks and dims
 * the further its centre sits from the viewport centre, so the focused card
 * snaps sharp while neighbours recede. Bails to a native horizontal scroll on
 * touch / reduced-motion. Runs inside the page gsap.context so it reverts on
 * navigation like every other scene.
 */
function hWorkScene(): void {
  const section = document.querySelector<HTMLElement>('[data-scene="hwork"]');
  if (!section) return;
  const track = section.querySelector<HTMLElement>('[data-h-track]');
  if (!track) return;
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-h-card]'));
  if (!cards.length) return;

  const setFocus = (): void => {
    const mid = window.innerWidth / 2;
    cards.forEach((card) => {
      const r = card.getBoundingClientRect();
      const centre = r.left + r.width / 2;
      const dist = Math.abs(centre - mid);
      const norm = Math.min(1, dist / (window.innerWidth * 0.42));
      card.style.setProperty('--b', (norm * 7).toFixed(2) + 'px');
      card.style.setProperty('--s', (1 - norm * 0.14).toFixed(3));
      card.style.setProperty('--o', (1 - norm * 0.52).toFixed(3));
    });
  };

  if (prefersReduced() || !desktop()) {
    section.classList.add('hwork--static');
    setFocus();
    return;
  }

  const amount = (): number => Math.max(0, track.scrollWidth - window.innerWidth);
  const tween = gsap.to(track, { x: () => -amount(), ease: 'none' });

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => '+=' + amount(),
    pin: true,
    scrub: 1,
    animation: tween,
    invalidateOnRefresh: true,
    onUpdate: setFocus,
    onRefresh: setFocus,
  });

  setFocus();
}

function ctaScene(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="cta"]');
  if (!root) return;

  const heading = root.querySelector<HTMLElement>('h2');
  const lasts = root.querySelector<HTMLElement>('em');
  const glow = root.querySelector<HTMLElement>('.hero-glow');
  const buttons = root.querySelectorAll<HTMLElement>('a');

  if (prefersReduced()) return;

  if (heading) {
    gsap.from(heading, {
      autoAlpha: 0,
      y: 24,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: root, start: 'top 75%' },
    });
  }

  if (lasts) {
    const letters = splitLetters(lasts);
    if (letters.length) {
      gsap.set(letters, { yPercent: 110 });
      gsap.to(letters, {
        yPercent: 0,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.05,
        scrollTrigger: { trigger: root, start: 'top 70%' },
      });
    }
  }

  if (buttons.length) {
    gsap.from(buttons, {
      autoAlpha: 0,
      y: 14,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: root, start: 'top 70%' },
    });
  }

  // CTA pin — desktop only.
  if (desktop()) {
    ScrollTrigger.create({
      trigger: root,
      start: 'top 20%',
      end: '+=50%',
      pin: true,
      pinSpacing: true,
    });
  }

  if (glow) {
    gsap.fromTo(
      glow,
      { xPercent: -10 },
      {
        xPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  }
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

function runScenes(): void {
  pageContext = gsap.context(() => {
    heroScene();
    magneticScene();
    workScene();
    approachScene();
    statsScene();
    journalScene();
    hWorkScene();
    ctaScene();
  });

  // Refresh after fonts/images settle so triggers measure correctly.
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function teardown(): void {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  clearMagnetic();
  pageContext?.revert();
  pageContext = null;
}

function onPageLoad(): void {
  startLenis();
  runScenes();
}

function onBeforePreparation(): void {
  teardown();
  stopLenis();
}

export function bootMotion(): void {
  if (bootBound) return;
  bootBound = true;

  // Astro's ClientRouter fires `astro:page-load` on the initial document
  // load AND after every soft navigation, so it is our single source of
  // truth. `astro:before-preparation` runs as the user navigates away —
  // tear ScrollTriggers + Lenis + magnetic listeners down there.
  document.addEventListener('astro:before-preparation', onBeforePreparation);
  document.addEventListener('astro:page-load', () => {
    teardown();
    onPageLoad();
  });

  // Defensive fallback: if for any reason ClientRouter is not active
  // (e.g. a subset of pages opt out of view transitions), kick off
  // scenes via DOMContentLoaded.
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        if (!pageContext) onPageLoad();
      },
      { once: true },
    );
  } else if (!pageContext) {
    onPageLoad();
  }
}
