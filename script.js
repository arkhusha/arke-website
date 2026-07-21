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

// Email capture forms — front-end demo only.
// Wire the submit handler to your email provider (e.g. MailerLite,
// Kit, or a Make.com webhook) before going live.
document.querySelectorAll('.capture-form').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input.value || !input.checkValidity()) {
      input.focus();
      return;
    }
    form.style.display = 'none';
    const success = form.parentElement.querySelector('.capture-success');
    if (success) success.style.display = 'block';
  });
});
