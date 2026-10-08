// ARKE — home scroll scenes (GSAP + ScrollTrigger)
// Shared smoothing, anchors, videos, dock and word-fill live in site-motion.js.
// Degrades: no JS → poster + static layout; reduced motion / CDN failure → no pins or scrubs.

(() => {
  const { motion } = window.ARKE;

  // ---------- Hero: clip the full-bleed video to the arch slot ----------
  const hero = document.querySelector('.h-hero');
  const slot = hero.querySelector('.h-slot');
  const stage = hero.querySelector('.h-stage');
  const slotInset = () => {
    const h = hero.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    return `inset(${s.top - h.top}px ${h.right - s.right}px ${h.bottom - s.bottom}px ${s.left - h.left}px round ${s.height / 2}px)`;
  };
  const clipToSlot = () => { stage.style.clipPath = slotInset(); };

  if (!motion) {
    clipToSlot();
    window.addEventListener('resize', clipToSlot);
    document.fonts && document.fonts.ready.then(clipToSlot);
    return;
  }

  // ---------- Hero intro (inner wrappers, so it never fights the scroll timeline) ----------
  gsap.from('.h-hero .in', { yPercent: 35, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08, delay: 0.1 });
  gsap.from(stage, { opacity: 0, duration: 1.4, ease: 'power2.out', delay: 0.35 });

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
    const { desktop } = ctx.conditions;

    // ---------- 01 · Hero: arch window grows into a full-screen scene ----------
    gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=140%', pin: true, scrub: 1, invalidateOnRefresh: true },
    })
      .fromTo(stage, { clipPath: () => slotInset() }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      // fromTo everywhere: invalidateOnRefresh must never re-read a mid-scroll state as the start/end
      .fromTo('.h-stage video', { scale: 1.18 }, { scale: 1, ease: 'power1.out', duration: 1 }, 0)
      .fromTo(['.h-tagline', '.h-meta'], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.3 }, 0)
      .fromTo('.ln-1', { xPercent: 0, autoAlpha: 1 }, { xPercent: -60, autoAlpha: 0, duration: 0.8 }, 0)
      .fromTo('.ln-3', { xPercent: 0, autoAlpha: 1 }, { xPercent: 60, autoAlpha: 0, duration: 0.8 }, 0)
      .fromTo('.ln-2 .w-l', { x: 0, autoAlpha: 1 }, { x: () => -window.innerWidth * 0.5, autoAlpha: 0, duration: 0.8 }, 0)
      .fromTo('.ln-2 .w-r', { x: 0, autoAlpha: 1 }, { x: () => window.innerWidth * 0.5, autoAlpha: 0, duration: 0.8 }, 0)
      .fromTo('.h-stage-shade', { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.6)
      .fromTo('.h-reveal', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.68)
      .to({}, { duration: 0.15 }); // short hold on the final frame

    // ---------- 03 · Why: scattered cards assemble over rising clouds ----------
    const cards = gsap.utils.toArray('.pcard');
    if (desktop) {
      const r = gsap.utils.random;
      gsap.timeline({
        scrollTrigger: { trigger: '.why', start: 'top top', end: '+=160%', pin: true, scrub: 1, invalidateOnRefresh: true },
      })
        .fromTo(cards, {
          x: () => r(-700, 700), y: () => r(380, 820), rotation: () => r(-28, 28), autoAlpha: 0,
        }, {
          x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 1, stagger: 0.22, ease: 'power3.out',
        }, 0)
        .fromTo('.why-clouds', { yPercent: 45 }, { yPercent: 0, duration: 1.9, ease: 'none' }, 0)
        .to({}, { duration: 0.25 });
    } else {
      cards.forEach((c) => gsap.from(c, {
        y: 50, autoAlpha: 0, rotation: gsap.utils.random(-6, 6), duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: c, start: 'top 88%' },
      }));
    }

    // ---------- 04 · Statement: lines slide in from alternating sides ----------
    gsap.utils.toArray('.stmt-line').forEach((line, i) => {
      gsap.fromTo(line, { xPercent: i % 2 ? 18 : -18, opacity: 0.12 }, {
        xPercent: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: line, start: 'top bottom', end: 'top 45%', scrub: true },
      });
    });

    // ---------- 05 · Guides: earlier cards recede as the next one stacks on top ----------
    if (desktop) {
      const gcards = gsap.utils.toArray('.gcard');
      gcards.forEach((card, i) => {
        const next = gcards[i + 1];
        if (!next) return;
        gsap.to(card, {
          scale: 0.93, opacity: 0.5, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 140px', scrub: true },
        });
      });
    }

    // ---------- 06 · Steps: line draws, outline numbers fill ----------
    gsap.fromTo('.steps2-line span', { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.steps2-grid', start: 'top 85%', end: 'bottom 60%', scrub: true },
    });
    gsap.utils.toArray('.s2').forEach((s) => {
      gsap.to(s.querySelector('.s2-num'), {
        color: '#16212e', ease: 'none',
        scrollTrigger: { trigger: s, start: 'top 80%', end: 'top 45%', scrub: true },
      });
      gsap.from(s.querySelectorAll('h3, p'), {
        y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: s, start: 'top 75%' },
      });
    });

    // ---------- 07 · Lab: pinned horizontal shelf ----------
    if (desktop) {
      const lab = document.querySelector('.lab');
      const track = lab.querySelector('.lab-track');
      const bar = lab.querySelector('.lab-progress span');
      lab.classList.add('lab--pinned');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: lab, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
        },
      });
      return () => lab.classList.remove('lab--pinned');
    }
  });

  // ---------- 08 · Maker: words part around the portrait, image parallax ----------
  gsap.timeline({ scrollTrigger: { trigger: '.maker-title', start: 'top 90%', end: 'center 45%', scrub: true } })
    .from('.mk-l', { xPercent: -30, opacity: 0.1 }, 0)
    .from('.mk-r', { xPercent: 30, opacity: 0.1 }, 0)
    .from('.maker-arch', { scale: 0.5, ease: 'power2.out' }, 0);
  gsap.fromTo('.maker-arch img', { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.maker', start: 'top bottom', end: 'bottom top', scrub: true },
  });
})();
