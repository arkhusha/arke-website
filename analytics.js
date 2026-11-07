// ARKE — cookie choice + Google Analytics events
// The GA4 tag in each page's <head> starts with analytics cookies denied (consent mode).
// This file shows the cookie message until the visitor chooses, remembers the choice,
// and sends two events: begin_checkout (paid guide Buy now) and generate_lead (free guide form).

(() => {
  const KEY = 'arke-consent';
  const gtag = window.gtag || function () {};
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: ask again next visit */ } };

  const apply = (choice) => gtag('consent', 'update', { analytics_storage: choice === 'granted' ? 'granted' : 'denied' });

  // ---------- cookie message ----------
  const css = `
.ck{position:fixed;left:16px;bottom:16px;z-index:10001;max-width:380px;background:#fff;color:#16212e;
  border-radius:16px;box-shadow:0 18px 50px -12px rgba(22,33,46,.35);padding:20px 22px;font:400 14px/1.6 'Montserrat',sans-serif;
  transform:translateY(20px);opacity:0;transition:transform .5s ease,opacity .5s ease}
.ck.show{transform:none;opacity:1}
.ck p{margin:0 0 14px}
.ck a{color:#2b7fff}
.ck-btns{display:flex;gap:10px;flex-wrap:wrap}
.ck button{font:600 13px/1 'Montserrat',sans-serif;letter-spacing:.04em;border-radius:100px;padding:11px 20px;cursor:pointer;border:1px solid #426188}
.ck .ck-yes{background:#426188;color:#fff}
.ck .ck-no{background:#fff;color:#426188}
@media (max-width:560px){.ck{left:12px;right:12px;bottom:12px;max-width:none}}`;

  const addStyle = () => {
    if (document.getElementById('ck-style')) return;
    const style = document.createElement('style');
    style.id = 'ck-style';
    style.textContent = css;
    document.head.appendChild(style);
  };

  const showBanner = () => {
    if (document.querySelector('.ck')) return;
    addStyle();
    const box = document.createElement('div');
    box.className = 'ck';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML = '<p>I use cookies to see which pages and guides people find useful. Nothing is used for ads. Is that OK with you? '
      + '<a href="/privacy">Privacy Policy</a></p>'
      + '<div class="ck-btns"><button type="button" class="ck-yes">That\'s OK</button><button type="button" class="ck-no">No thanks</button></div>';
    document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add('show'));
    const choose = (v) => { save(v); apply(v); box.remove(); };
    box.querySelector('.ck-yes').addEventListener('click', () => choose('granted'));
    box.querySelector('.ck-no').addEventListener('click', () => choose('denied'));
  };

  // ---------- Yana's own devices ----------
  // ?notrack=1 on any page switches Google Analytics off for this browser (the <head> snippet sets
  // ga-disable from localStorage arke-notrack), ?notrack=0 switches it back on. No cookie message there.
  const notrack = (() => { try { return localStorage.getItem('arke-notrack') === '1'; } catch (e) { return false; } })();
  const flip = location.search.match(/[?&]notrack=([01])/);
  if (flip) {
    addStyle();
    const note = document.createElement('div');
    note.className = 'ck';
    note.setAttribute('role', 'status');
    note.innerHTML = '<p style="margin:0">' + (flip[1] === '1'
      ? 'Done. Visits from this browser are no longer counted in Google Analytics.'
      : 'Visits from this browser are counted in Google Analytics again.') + '</p>';
    document.body.appendChild(note);
    requestAnimationFrame(() => note.classList.add('show'));
    setTimeout(() => note.remove(), 6000);
  }

  if (!read() && !notrack) showBanner();

  // Privacy page button: forget the choice and ask again
  document.querySelectorAll('[data-cookie-settings]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      try { localStorage.removeItem(KEY); } catch (err) { /* nothing stored */ }
      apply('denied');
      showBanner();
    })
  );

  // ---------- events ----------
  // capture phase, so they fire before script.js navigates away or swaps the form for the thank-you text
  // guide pages use buttons with data-checkout, the welcome page uses plain checkout links
  const CHECKOUT_GUIDES = { 37617: 'Natural Deodorant Guide', 37618: 'Shampoo Bars Guide', 37619: 'Whipped Body Butter Guide', 37620: 'Oil Infusions for Hair & Body' };
  const CHECKOUT_PRICES = { 37617: 14.99, 37618: 15.99, 37619: 13.99, 37620: 12.99 };  // USD, same as seo_head.PRICES
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-guide-type="paid"][data-checkout], a[href*="checkout.mailerlite.com"]');
    if (!b) return;
    const id = ((b.dataset.checkout || b.getAttribute('href') || '').match(/checkout\/(\d+)/) || [])[1] || '';
    const value = CHECKOUT_PRICES[id] || 0;
    gtag('event', 'begin_checkout', { currency: 'USD', value,
      items: [{ item_id: b.dataset.guideId || 'checkout-' + id, item_name: b.dataset.guide || CHECKOUT_GUIDES[id] || id, price: value }] });
  }, true);

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.matches('form[data-guide-form]')) {
      const email = f.querySelector('input[type="email"]');
      if (email && email.value.trim() && email.checkValidity()) {
        gtag('event', 'generate_lead', { lead_source: 'free_guide', guide_id: f.dataset.guideId || '', page: location.pathname });
      }
    } else if (f.id === 'gbForm') {
      gtag('event', 'generate_lead', { lead_source: 'gift_box_quote', page: location.pathname });
    }
  }, true);
})();
