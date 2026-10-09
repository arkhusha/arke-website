// ARKE — shared interactions

// Sticky header shrink
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Mobile nav
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navToggle.classList.remove('open');
      nav.classList.remove('open');
    })
  );
}

// Guides dropdown: the arrow opens it (touch screens, keyboard); hover handles desktop
document.querySelectorAll('.nav-dd').forEach((dd) => {
  const btn = dd.querySelector('.nav-dd-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dd.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
});
document.addEventListener('click', (e) => {
  document.querySelectorAll('.nav-dd.open').forEach((dd) => {
    if (!dd.contains(e.target)) { dd.classList.remove('open'); dd.querySelector('.nav-dd-btn').setAttribute('aria-expanded', 'false'); }
  });
});

// Scroll reveals
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// ============================================================
// Guide forms
// Every guide has its own tagged form (guide id, name, free/paid).
// Submissions go to the Google Sheet backend (ARKE Website/_tools/
// forms-backend/Code.gs). Paid guides then continue to Stripe.
// ============================================================

// Paste the Apps Script web-app URL (ends in /exec) after deploying Code.gs.
const FORMS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyIkWKz90lhLeYaDP4OTIAb6irUUeUxuPEYm29wYY1NXYiVSAccCItTHcZXO9O90Hoz/exec';

const sendSubmission = (payload) => {
  if (!FORMS_ENDPOINT) { console.info('[ARKE forms] endpoint not set, submission not stored', payload); return Promise.resolve(); }
  const body = new URLSearchParams({ data: JSON.stringify(payload) });
  // no-cors: Apps Script accepts the POST; we never need to read the reply
  const req = fetch(FORMS_ENDPOINT, { method: 'POST', mode: 'no-cors', body }).catch(() => {});
  return Promise.race([req, new Promise((r) => setTimeout(r, 2500))]);
};

const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));

// Handles any form tagged with data-guide-form; the tags can live on the form itself
// or be copied onto it from the button that opened the pop-up.
const handleGuideForm = (form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl = form.querySelector('input[name="name"]');
    const emailEl = form.querySelector('input[type="email"]');
    for (const el of [nameEl, emailEl]) {
      if (el && (!el.value.trim() || !el.checkValidity())) { el.focus(); return; }
    }
    const d = form.dataset;
    const payload = {
      id: newId(),
      name: nameEl ? nameEl.value.trim() : '',
      email: emailEl.value.trim(),
      guideId: d.guideId || '',
      guideName: d.guide || '',
      guideType: d.guideType || 'free',
      page: location.pathname.split('/').pop() || 'index.html',
    };
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    await sendSubmission(payload);
    const box = form.parentElement;
    const success = box.querySelector('.capture-success');

    if (payload.guideType === 'paid') {
      if (d.checkout) {
        // Stripe payment link: prefill the email and tie the payment back to this row
        const url = new URL(d.checkout);
        url.searchParams.set('prefilled_email', payload.email);
        url.searchParams.set('client_reference_id', payload.id);
        location.href = url.toString();
        return;
      }
      if (success) success.textContent = 'Thank you. Checkout opens very soon, and we will email you as soon as it does.';
    }
    form.style.display = 'none';
    if (success) success.style.display = 'block';
    if (btn) btn.disabled = false;
  });
};
document.querySelectorAll('form[data-guide-form]').forEach(handleGuideForm);

// Pop-up: one per page, configured by the button that opens it
const guideModal = document.getElementById('download-modal');
if (guideModal) {
  const q = (s) => guideModal.querySelector(s);
  const kind = q('[data-modal-kind]'), title = q('#download-modal-title'), desc = q('[data-modal-desc]');
  const form = q('form'), success = q('.capture-success'), fine = q('[data-modal-fine]'), submit = q('[type="submit"]');
  let lastFocused = null;

  const openModal = (trigger) => {
    lastFocused = trigger;
    const t = trigger.dataset;
    const paid = t.guideType === 'paid';
    // copy this guide's tags onto the pop-up form
    Object.assign(form.dataset, { guideId: t.guideId || '', guide: t.guide || '', guideType: t.guideType || 'free', checkout: t.checkout || '' });
    if (kind) kind.textContent = paid ? 'Paid Guide' : 'Free Guide';
    if (title) title.textContent = t.guide || 'Get the guide for free.';
    if (desc && t.desc) desc.textContent = t.desc;
    if (submit) submit.textContent = paid ? 'Continue to Payment →' : 'Send Me the Guide';
    if (fine) fine.textContent = paid ? 'Instant PDF · One-time payment · Secure checkout' : 'Free PDF · No spam, ever · Unsubscribe anytime';
    if (success) success.textContent = "It's on its way. Check your inbox ✦";
    form.style.display = '';
    form.reset();
    if (success) success.style.display = 'none';
    guideModal.classList.add('open');
    guideModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => { const f = form.querySelector('input'); if (f) f.focus(); }, 60);
  };

  const closeModal = () => {
    guideModal.classList.remove('open');
    guideModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused) lastFocused.focus();
  };

  document.querySelectorAll('[data-guide-modal]').forEach((el) =>
    el.addEventListener('click', (e) => { e.preventDefault(); openModal(el); })
  );
  guideModal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && guideModal.classList.contains('open')) closeModal();
  });
}
