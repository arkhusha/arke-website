// ARKE — shared motion engine (every redesigned page)
// Smooth scroll, in-page anchors, lazy videos, the floating CTA dock and
// word-fill text. Page scenes live in home.js / pages.js and read window.ARKE.
// Degrades: no GSAP or reduced motion → no smoothing, no scrubs, all content visible.

window.ARKE = (() => {
  const root = document.documentElement;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (!hasGsap) root.classList.remove('motion');
  const motion = root.classList.contains('motion');

  // ---------- Videos: attach src near viewport, play only while visible ----------
  const loader = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const v = e.target;
      v.src = v.dataset.src + (v.poster ? '' : '#t=0.1');
      v.preload = 'metadata';
      loader.unobserve(v);
    });
  }, { rootMargin: '600px 600px' });
  // play() can be refused if it runs before the clip has data, so remember
  // visibility and try again as soon as the video can play
  const tryPlay = (v) => { if (v._inView && motion) v.play().catch(() => {}); };
  const player = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      v._inView = e.isIntersecting;
      if (e.isIntersecting) tryPlay(v); else v.pause();
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('video').forEach((v) => {
    v.addEventListener('loadeddata', () => tryPlay(v));
    v.addEventListener('canplay', () => tryPlay(v));
  });
  document.querySelectorAll('video[data-src]').forEach((v) => loader.observe(v));
  document.querySelectorAll('video[data-src], video[autoplay], video[data-eager]').forEach((v) => player.observe(v));
  // for videos a page script adds later (the gift box cards)
  const watchVideo = (v) => {
    v.addEventListener('loadeddata', () => tryPlay(v));
    v.addEventListener('canplay', () => tryPlay(v));
    if (v.dataset.src) loader.observe(v);
    player.observe(v);
  };

  // ---------- Floating CTA dock: after the hero, hidden over the signup + footer ----------
  const dock = document.querySelector('.dock');
  const heroEl = document.querySelector('[data-hero]');
  if (dock && heroEl) {
    const state = { hero: true, capture: false, footer: false };
    const sync = () => dock.classList.toggle('show', !state.hero && !state.capture && !state.footer);
    const watch = (el, key) => el && new IntersectionObserver(([e]) => { state[key] = e.isIntersecting; sync(); }).observe(el);
    watch(heroEl, 'hero');
    watch(document.getElementById('free-guide'), 'capture');
    watch(document.querySelector('.site-footer'), 'footer');
  }

  // ---------- Split text into word spans (keeps .pimg images + accent words whole) ----------
  const splitWords = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('pimg')) {
          if (n.classList.contains('accent-italic')) n.classList.add('w');
          else walk(n);
        }
      });
    };
    walk(el);
    return el.querySelectorAll('.w');
  };

  if (!motion) return { motion, lenis: null, splitWords, watchVideo };

  // =====================================================================
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // ---------- Lenis smooth scroll (wheel only; touch stays native) ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // Pause page scroll while the download modal is open
    new MutationObserver(() => {
      document.body.classList.contains('modal-open') ? lenis.stop() : lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // In-page anchors: route through Lenis so pinned scenes stay in sync
  document.querySelectorAll('a[href^="#"]:not([href="#"]):not([data-guide-modal])').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -40, duration: 1.6 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ---------- Word-fill text: [data-paint] ----------
  document.querySelectorAll('[data-paint]').forEach((el) => {
    const words = splitWords(el);
    const onDark = !!el.closest('.section--dark, [data-dark]');
    gsap.fromTo(words, { opacity: onDark ? 0.22 : 0.14 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
    });
    const imgs = el.querySelectorAll('.pimg');
    if (imgs.length) gsap.from(imgs, {
      scale: 0.4, opacity: 0, ease: 'back.out(1.6)', duration: 0.9, stagger: 0.2,
      scrollTrigger: { trigger: el, start: 'top 70%' },
    });
  });

  // ---------- Closing line: masked line reveal ----------
  document.querySelectorAll('.closer-big').forEach((el) => {
    gsap.from(el.querySelectorAll('.in'), {
      yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 80%' },
    });
  });

  // Recalculate once fonts and images settle (they change line heights)
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());

  return { motion, lenis, splitWords, watchVideo };
})();
