/**
 * Astro ClientRouter page-transition handler.
 *
 * Brand-quiet cross-fade with a subtle scale (0.985 → 1). Hooks into
 * `astro:before-preparation` and `astro:after-swap`. A thin forest-coloured
 * progress sliver appears at the top of the viewport when fetches take
 * longer than ~120ms — hidden again as soon as the new DOM is committed.
 */

const FADE_OUT_MS = 240;
const FADE_IN_MS = 280;
const PROGRESS_DELAY_MS = 120;

let progressBar: HTMLDivElement | null = null;
let progressTimer: number | null = null;
let bound = false;

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureProgressBar(): HTMLDivElement {
  if (progressBar && document.body.contains(progressBar)) return progressBar;
  const bar = document.createElement('div');
  bar.setAttribute('data-route-progress', '');
  bar.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'height:2px',
    'width:0%',
    'background-color:var(--color-forest, #1A5C12)',
    'z-index:9999',
    'pointer-events:none',
    'transition:width 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease',
    'opacity:0',
  ].join(';');
  document.body.appendChild(bar);
  progressBar = bar;
  return bar;
}

function startProgress(): void {
  if (progressTimer != null) window.clearTimeout(progressTimer);
  progressTimer = window.setTimeout(() => {
    const bar = ensureProgressBar();
    bar.style.opacity = '1';
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      bar.style.width = '85%';
    });
  }, PROGRESS_DELAY_MS);
}

function endProgress(): void {
  if (progressTimer != null) {
    window.clearTimeout(progressTimer);
    progressTimer = null;
  }
  if (!progressBar) return;
  const bar = progressBar;
  bar.style.width = '100%';
  window.setTimeout(() => {
    bar.style.opacity = '0';
    window.setTimeout(() => {
      bar.style.width = '0%';
    }, 200);
  }, 120);
}

function fadeOut(): Promise<void> {
  if (prefersReduced()) return Promise.resolve();
  return new Promise((resolve) => {
    const body = document.body;
    body.classList.add('is-loading');
    body.style.transition = `opacity ${FADE_OUT_MS}ms ease, transform ${FADE_OUT_MS}ms ease`;
    body.style.transformOrigin = '50% 50%';
    body.style.opacity = '0.35';
    body.style.transform = 'scale(0.985)';
    window.setTimeout(resolve, FADE_OUT_MS);
  });
}

function fadeIn(): void {
  const body = document.body;
  if (prefersReduced()) {
    body.classList.remove('is-loading');
    body.style.opacity = '';
    body.style.transform = '';
    body.style.transition = '';
    return;
  }
  body.style.transition = `opacity ${FADE_IN_MS}ms ease, transform ${FADE_IN_MS}ms ease`;
  body.style.opacity = '1';
  body.style.transform = 'scale(1)';
  window.setTimeout(() => {
    body.classList.remove('is-loading');
    body.style.transition = '';
    body.style.transform = '';
  }, FADE_IN_MS);
}

export function bootTransitions(): void {
  if (bound) return;
  bound = true;

  document.addEventListener('astro:before-preparation', (event) => {
    startProgress();
    const evt = event as Event & { loader?: () => Promise<void> };
    if (typeof evt.loader === 'function') {
      const original = evt.loader.bind(evt);
      evt.loader = async () => {
        await Promise.all([fadeOut(), original()]);
      };
    } else {
      void fadeOut();
    }
  });

  document.addEventListener('astro:after-swap', () => {
    endProgress();
    fadeIn();
  });

  document.addEventListener('astro:page-load', () => {
    // Safety net — make sure we never leave the page faded.
    const body = document.body;
    if (body.classList.contains('is-loading')) {
      fadeIn();
    }
  });
}
