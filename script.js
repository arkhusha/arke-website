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

// Download modal — instant email-capture pop-up
const downloadModal = document.getElementById('download-modal');
if (downloadModal) {
  const modalTitle = downloadModal.querySelector('#download-modal-title');
  const modalDesc = downloadModal.querySelector('[data-modal-desc]');
  const modalForm = downloadModal.querySelector('.capture-form');
  const modalSuccess = downloadModal.querySelector('.capture-success');
  const modalInput = downloadModal.querySelector('input[type="email"]');
  let lastFocused = null;

  const openModal = (trigger) => {
    lastFocused = trigger;
    const guide = trigger.getAttribute('data-guide');
    const desc = trigger.getAttribute('data-desc');
    if (guide && modalTitle) modalTitle.textContent = 'Download: ' + guide;
    if (desc && modalDesc) modalDesc.textContent = desc;
    // Reset form state in case it was submitted on a previous open
    if (modalForm) modalForm.style.display = '';
    if (modalSuccess) modalSuccess.style.display = 'none';
    if (modalInput) modalInput.value = '';
    downloadModal.classList.add('open');
    downloadModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (modalInput) setTimeout(() => modalInput.focus(), 60);
  };

  const closeModal = () => {
    downloadModal.classList.remove('open');
    downloadModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused) lastFocused.focus();
  };

  document.querySelectorAll('[data-download-modal]').forEach((btn) =>
    btn.addEventListener('click', () => openModal(btn))
  );
  downloadModal.querySelectorAll('[data-modal-close]').forEach((el) =>
    el.addEventListener('click', closeModal)
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && downloadModal.classList.contains('open')) closeModal();
  });
}

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
