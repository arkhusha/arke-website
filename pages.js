// ARKE — interior page scenes (Guides, About, guide detail pages)
// Each block only runs if its section exists on the page. Shared engine: site-motion.js.

(() => {
  const { motion } = window.ARKE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- Page titles: lines never wrap, so shrink the title until the widest line fits ----------
  const pTitle = $('.p-title');
  const fitTitle = () => {
    if (!pTitle) return;
    pTitle.style.fontSize = '';
    // lines are nowrap flex rows, so measure their children, and compare with the screen, not the title box
    const room = Math.min(pTitle.parentElement.clientWidth, document.documentElement.clientWidth) - 32;
    const lineWidth = (l) => [...l.children].reduce((a, c) => a + c.getBoundingClientRect().width, 0)
      + (parseFloat(getComputedStyle(l).columnGap) || 0) * (l.children.length - 1);
    const widest = Math.max(...$$('.p-ln', pTitle).map(lineWidth));
    if (widest > room) pTitle.style.fontSize = (parseFloat(getComputedStyle(pTitle).fontSize) * room / widest) + 'px';
  };
  fitTitle();
  if (document.fonts) document.fonts.ready.then(fitTitle);
  addEventListener('resize', fitTitle);

  // ---------- Guides index: preview image follows the cursor (desktop pointer only) ----------
  const preview = $('.idx-preview');
  if (preview && matchMedia('(hover: hover) and (min-width: 900px)').matches) {
    const items = $$('[data-key]', preview);
    let shown = null;
    const show = (key) => {
      items.forEach((m) => {
        const on = m.dataset.key === key;
        m.classList.toggle('on', on);
        if (m.tagName === 'VIDEO') {
          if (on) { if (!m.src) m.src = m.dataset.lazy; m.play().catch(() => {}); } else m.pause();
        }
      });
    };
    const move = window.gsap
      ? { x: gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' }), y: gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' }) }
      : { x: (v) => { preview.style.left = v + 'px'; }, y: (v) => { preview.style.top = v + 'px'; } };
    const toggle = (on) => {
      if (window.gsap) gsap.to(preview, { opacity: on ? 1 : 0, scale: on ? 1 : 0.6, duration: 0.45, ease: 'power3.out' });
      else preview.style.opacity = on ? 1 : 0;
    };
    $$('.idx-row[data-preview]').forEach((row) => {
      row.addEventListener('mouseenter', () => { show(row.dataset.preview); shown = row; toggle(true); });
      row.addEventListener('mouseleave', () => { if (shown === row) toggle(false); });
    });
    window.addEventListener('pointermove', (e) => { move.x(e.clientX + 150); move.y(e.clientY); }, { passive: true });
  }

  // ---------- Sticky feature list: counter + active item (works without motion too) ----------
  const std = $('.std');
  const count = std && $('.std-count', std);
  const stdItems = std ? $$('.std-item', std) : [];

  if (!motion) {
    stdItems.forEach((i) => i.classList.add('active'));
    return;
  }

  // ---------- Page hero intro + scroll drift ----------
  const hero = $('.p-hero, .gx-hero');
  if (hero) {
    gsap.from($$('.in, .eyebrow, .hero-sub, .hero-actions, .gx-badge, .gx-lead, .hero-chips', hero), {
      yPercent: 30, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07, delay: 0.1,
    });
  }
  if ($('.p-hero')) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.p-hero', start: 'top top', end: 'bottom top', scrub: true } });
    tl.fromTo('.p-hero .p-ln:first-child', { xPercent: 0 }, { xPercent: -12, ease: 'none' }, 0)
      .fromTo('.p-hero .p-ln:last-child', { xPercent: 0 }, { xPercent: 12, ease: 'none' }, 0)
      .fromTo('.p-hero .arch', { scale: 1 }, { scale: 1.35, ease: 'none' }, 0)
      .fromTo('.p-hero .arch img', { yPercent: 0 }, { yPercent: 8, ease: 'none' }, 0);
  }
  if ($('.gx-hero')) {
    gsap.fromTo('.gx-photo > *', { yPercent: -4 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.gx-hero', start: 'top top', end: 'bottom top', scrub: true } });
    $$('.gx-float').forEach((f, i) => {
      gsap.from(f, { opacity: 0, y: 30, scale: 0.85, duration: 1, ease: 'back.out(1.6)', delay: 0.6 + i * 0.15 });
      gsap.to(f, { y: -40 - i * 30, ease: 'none', scrollTrigger: { trigger: '.gx-hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
  }

  // ---------- Guides index rows: rise in ----------
  $$('.idx-row').forEach((row) => gsap.from(row.children, {
    y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: row, start: 'top 88%' },
  }));

  // ---------- Sticky feature list ----------
  stdItems.forEach((item, i) => {
    ScrollTrigger.create({
      trigger: item, start: 'top 60%', end: 'bottom 60%',
      onToggle: (self) => {
        if (!self.isActive) return;
        stdItems.forEach((x) => x.classList.toggle('active', x === item));
        if (count) count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(stdItems.length).padStart(2, '0');
      },
    });
  });
  if (stdItems[0]) stdItems[0].classList.add('active');
  if (std) gsap.fromTo('.std-media > :not(.std-count)', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: std, start: 'top bottom', end: 'bottom top', scrub: true } });

  // ---------- Stats: tiles rise in together, then count up ----------
  if ($('.stats-grid')) gsap.from('.stat', { y: 36, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.stats-grid', start: 'top 88%' } });
  // ---------- Stats: count up ----------
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.8, ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
    el.textContent = '0';
  });

  // ---------- Chapters: outline numbers fill as each row passes ----------
  $$('.chap-row').forEach((row) => {
    gsap.to($('.chap-n', row), { color: '#16212e', ease: 'none', scrollTrigger: { trigger: row, start: 'top 80%', end: 'top 50%', scrub: true } });
    gsap.from($$('h3, p', row), { y: 20, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: row, start: 'top 82%' } });
  });

  // ---------- Values: cards fan in ----------
  if ($('.vals')) {
    gsap.from('.val', {
      y: 80, rotation: (i) => [-8, 5, -4, 7][i % 4], opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.vals-grid', start: 'top 80%' },
    });
  }

  // ---------- Next-guide card ----------
  if ($('.nextg')) gsap.from('.nextg-card', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.nextg', start: 'top 80%' } });

  // ---------- About timeline: pinned horizontal travel on desktop ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const tlSec = $('.tl');
    if (!tlSec) return;
    const track = $('.tl-track', tlSec);
    const bar = $('.tl-progress span', tlSec);
    tlSec.classList.add('tl--pinned');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: tlSec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });
    return () => tlSec.classList.remove('tl--pinned');
  });
})();
