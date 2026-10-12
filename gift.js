// ARKE — Gift box builder
// Pick 3+ products (size + scent each), set 10+ boxes, request a quote.
// Quote requests go through sendSubmission() from script.js (Google Sheet backend).

(() => {
  const MIN_ITEMS = 3;
  const MIN_BOXES = 10;
  const MAX_OILS = 3;

  // poster = 4:5 card still, thumb = square close-up for the box and the list.
  // Both are frames from the product videos, cut above the watermark strip.
  const P = (id) => ({ poster: `images/posters/${id}.jpg`, thumb: `images/posters/${id}-t.jpg` });
  const PRODUCTS = [
    // scents: the only choices for that product (pick one). ingredients(scent): INCI names, in order, never amounts.
    { id: 'body-butter', name: 'Whipped Body Butter', sizes: ['20 g', '100 g'], video: 'images/body-butter.mp4', ...P('body-butter'),
      scents: ['Lavender', 'Neutral'],
      ingredients: (sc) => ['Butyrospermum Parkii (Shea) Butter', 'Prunus Amygdalus Dulcis (Sweet Almond) Oil', 'Cera Alba (Beeswax)', 'Kaolin',
        ...(sc === 'Lavender' ? ['Lavandula Angustifolia (Lavender) Oil'] : []), 'Tocopherol (Vitamin E)'] },
    { id: 'soap-bar', name: 'Soap Bar', sizes: ['20 g', '100 g'], video: 'images/soap-bar.mp4', ...P('soap-bar'),
      scents: ['Lavender', 'Coffee', 'Charcoal', 'Rose', 'Neutral'],
      // lavender and rose soaps use rice bran oil infused with the flowers; coffee = ground coffee beans; charcoal also has eucalyptus essential oil
      ingredients: (sc) => ['Sodium Palmate', 'Aqua (Water)', 'Sodium Cocoate', 'Sodium Shea Butterate', 'Sodium Olivate', 'Oryza Sativa (Rice) Bran Oil',
        ...({ Lavender: ['Lavandula Angustifolia (Lavender) Flower Extract'], Rose: ['Rosa Damascena (Rose) Flower Extract'],
          Coffee: ['Coffea Arabica (Coffee) Seed Powder'], Charcoal: ['Charcoal Powder', 'Eucalyptus Globulus (Eucalyptus) Leaf Oil'] }[sc] || []), 'Glycerin'] },
    { id: 'shampoo-bar', name: 'Shampoo Bar', sizes: ['20 g', '100 g'], video: 'images/shampoo-bars.mp4', ...P('shampoo-bar'),
      scents: ['Rosemary'],
      // rice bran oil carries two infusions (rosemary and calendula), plus rosemary essential oil
      ingredients: () => ['Sodium Cocoyl Isethionate', 'Cocamidopropyl Betaine', 'Behentrimonium Methosulfate', 'Cetyl Alcohol', 'Kaolin',
        'Rosmarinus Officinalis (Rosemary) Leaf Powder', 'Oryza Sativa (Rice) Bran Oil', 'Rosmarinus Officinalis (Rosemary) Leaf Extract',
        'Calendula Officinalis (Calendula) Flower Extract',
        'Rosmarinus Officinalis (Rosemary) Leaf Oil', 'Ricinus Communis (Castor) Seed Oil', 'Glycerin', 'Butylene Glycol', 'Phenoxyethanol'] },
    { id: 'hair-oil', name: 'Hair Oil', sizes: ['20 ml', '50 ml'], video: 'images/hair-oil.mp4', ...P('hair-oil'),
      scents: ['Rosemary'],
      ingredients: () => ['Oryza Sativa (Rice) Bran Oil', 'Rosmarinus Officinalis (Rosemary) Leaf Extract', 'Prunus Amygdalus Dulcis (Sweet Almond) Oil',
        'Glycerin', 'Tocopherol (Vitamin E)', 'Rosmarinus Officinalis (Rosemary) Leaf Oil'] },
    { id: 'body-oil', name: 'Body Oil', sizes: ['20 ml', '50 ml'], video: 'images/body-oil.mp4', ...P('body-oil'),
      scents: ['Lavender', 'Rose'],
      ingredients: (sc) => ['Oryza Sativa (Rice) Bran Oil',
        sc === 'Rose' ? 'Rosa Damascena (Rose) Flower Extract' : 'Lavandula Angustifolia (Lavender) Flower Extract',
        'Prunus Amygdalus Dulcis (Sweet Almond) Oil', 'Glycerin', 'Tocopherol (Vitamin E)',
        sc === 'Rose' ? 'Rosa Damascena (Rose) Flower Oil' : 'Lavandula Angustifolia (Lavender) Oil'] },
    { id: 'deodorant', name: 'Deodorant', sizes: ['20 g', '100 g'], video: 'images/deodorant.mp4', ...P('deodorant'),
      scents: ['Lavender', 'Lemongrass', 'Peppermint'],
      ingredients: (sc) => ['Cocos Nucifera (Coconut) Oil', 'Kaolin', 'Butyrospermum Parkii (Shea) Butter', 'Cera Alba (Beeswax)', 'Magnesium Hydroxide',
        { Lavender: 'Lavandula Angustifolia (Lavender) Oil', Lemongrass: 'Cymbopogon Citratus (Lemongrass) Leaf Oil', Peppermint: 'Mentha Piperita (Peppermint) Oil' }[sc]] },
    { id: 'lip-balm', name: 'Lip Balm', sizes: ['7 g'], video: 'images/lip-balm.mp4', ...P('lip-balm'),
      scents: ['Peppermint + Kaffir Lime', 'Lily'],
      ingredients: (sc) => ['Hydrogenated Coconut Oil (Coconut Wax)', 'Cera Alba (Beeswax)', 'Butyrospermum Parkii (Shea) Butter', 'Tocopherol (Vitamin E)', 'Glycerin',
        ...(sc === 'Lily' ? ['Lilium Candidum (Lily) Flower Extract'] : ['Mentha Piperita (Peppermint) Oil', 'Citrus Hystrix (Kaffir Lime) Peel Oil'])] },
    // the candle keeps the open choice: one oil or a blend of up to three, or unscented
    { id: 'candle', name: 'Wooden-Wick Candle', sizes: ['100 ml'], video: 'images/candle.mp4', ...P('candle'),
      ingredients: (sc, oils) => ['Soy wax', 'Coconut wax', 'Beeswax', 'Wooden wick', ...oils.map((o) => `${o} essential oil`)] },
  ];
  // ring colour for each fixed scent (Neutral has no ring)
  const SCENT_COLOR = { Lavender: '#b9a3d9', Lemongrass: '#c9d66b', Peppermint: '#7fc6a4', Rosemary: '#7fae6b', Coffee: '#7b5537',
    Charcoal: '#3a3f45', Rose: '#e0849f', Lily: '#f2c6d4', 'Peppermint + Kaffir Lime': '#9fd08a' };

  const OILS = {
    'Citrus': { color: '#f4b740', items: ['Grapefruit', 'Kaffir Lime', 'Lemon', 'Orange', 'Tangerine', 'Thai Bergamot'] },
    'Herbs & Leaves': { color: '#7fae6b', items: ['Cajeput', 'Citronella', 'Eucalyptus', 'Geranium', 'Lavender', 'Lemongrass', 'Marjoram', 'Patchouli', 'Peppermint', 'Pine', 'Rosemary', 'Spearmint', 'Tea Tree', 'Wild Mint'] },
    'Woods & Spices': { color: '#b07d4e', items: ['Cedarwood', 'Sandalwood', 'Turmeric'] },
    'Robust Florals': { color: '#c58fc7', items: ['Blue Chamomile', 'Neroli', 'Ylang Ylang'] },
    'Other Florals': { color: '#e0849f', items: ['Rose', 'Lily'] },
  };

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const oilColor = (n) => { if (SCENT_COLOR[n]) return SCENT_COLOR[n]; for (const f in OILS) if (OILS[f].items.includes(n)) return OILS[f].color; return ''; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  // scent colour for the ring around a thumbnail (blend of the chosen oils)
  const tintFor = (p, oils) => {
    const cols = oils.map(oilColor).filter(Boolean);
    if (!cols.length) return '';
    const avg = [0, 0, 0];
    cols.forEach((c) => hex(c).forEach((v, i) => { avg[i] += v / cols.length; }));
    return toHex(avg);
  };
  const byId = (id) => PRODUCTS.find((x) => x.id === id);
  // round product photo; products without a photo get their name in the accent italic
  const thumbFor = (p, tint) => `<span class="gb-th${tint ? ' is-scented' : ''}"${tint ? ` style="--tint:${tint}"` : ''}>${
    p.thumb ? `<img src="${p.thumb}" alt="" width="160" height="160">` : `<em>${p.id === 'candle' ? 'candle' : esc(p.name)}</em>`}</span>`;
  const wideScreen = matchMedia('(min-width: 768px) and (hover: hover)').matches;
  const motion = document.documentElement.classList.contains('motion');

  let current = null;          // product being configured
  let cfg = { size: '', oils: [] };
  const box = [];              // items added to the box
  let boxes = MIN_BOXES;

  // ---------- product cards ----------
  const grid = $('#gbGrid');
  PRODUCTS.forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gb-card';
    card.dataset.id = p.id;
    // desktop plays the product video, phones and tablets show a still from it
    const media = (p.poster ? `<img class="gb-poster" src="${p.poster}" alt="" loading="lazy" width="480" height="600">` : '<span class="gb-type"><em>wooden-wick</em>candle</span>') +
      (p.video && wideScreen ? `<video data-src="${p.video}" muted loop playsinline preload="none" aria-hidden="true"></video>` : '');
    card.innerHTML = `<span class="gb-media">${media}</span><span class="gb-name">${p.name}</span><span class="gb-sizes">${p.sizes.join(' or ')}</span>`;
    card.addEventListener('click', () => openConfig(p));
    grid.appendChild(card);
    const v = card.querySelector('video');
    if (v && window.ARKE && ARKE.watchVideo) ARKE.watchVideo(v);
  });

  // ---------- configure one product ----------
  const panel = $('#gbConfig');
  function openConfig(p) {
    current = p;
    cfg = { size: p.sizes[0], oils: p.scents ? [p.scents[0]] : [] };
    grid.querySelectorAll('.gb-card').forEach((c) => c.classList.toggle('sel', c.dataset.id === p.id));
    panel.hidden = false;
    renderConfig();
    panel.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'nearest' });
  }

  function renderConfig() {
    const p = current;
    const tint = tintFor(p, cfg.oils);
    let scents;
    if (p.scents && p.scents.length === 1) {
      scents = `<p class="gb-note">${p.name} is made with ${p.scents[0]} only, so there's nothing to choose here.</p><div class="gb-chips"><span class="gb-chip on">${p.scents[0]}</span></div>`;
    } else if (p.scents) {
      scents = `<p class="gb-note">Pick one.</p><div class="gb-chips">${p.scents.map((o) => `<button type="button" class="gb-chip${cfg.oils[0] === o ? ' on' : ''}" data-one="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    } else {
      scents = `<p class="gb-note">Pick one essential oil or blend up to three. Leave it empty for unscented.</p>` +
        Object.entries(OILS).map(([fam, f]) => `<div class="gb-fam"><h4><i style="background:${f.color}"></i>${esc(fam)}</h4><div class="gb-chips">${
          f.items.map((o) => { const on = cfg.oils.includes(o); const full = !on && cfg.oils.length >= MAX_OILS;
            return `<button type="button" class="gb-chip${on ? ' on' : ''}${full ? ' off' : ''}" data-oil="${o}"${full ? ' disabled' : ''}>${o}</button>`; }).join('')
        }</div></div>`).join('');
    }
    panel.innerHTML = `
      <div class="gb-config-head">
        ${thumbFor(p, tint).replace('gb-th', 'gb-th gb-preview')}
        <div><h3>${p.name}</h3><p class="gb-pick">${cfg.size}${cfg.oils.length ? ' · ' + esc(cfg.oils.join(', ')) : ' · Unscented'}</p></div>
      </div>
      <div class="gb-sub">Size</div>
      <div class="gb-chips">${p.sizes.map((s) => `<button type="button" class="gb-chip${cfg.size === s ? ' on' : ''}" data-size="${s}">${s}</button>`).join('')}</div>
      <div class="gb-sub">Scent</div>
      ${scents}
      <div class="gb-sub">Ingredients (INCI)</div>
      <p class="gb-ingr">${p.ingredients(cfg.oils[0], cfg.oils).map(esc).join('<i> · </i>')}</p>
      <button type="button" class="btn btn--solid gb-add" id="gbAdd">Add to box <span class="arrow">→</span></button>`;
    panel.querySelectorAll('[data-size]').forEach((b) => b.onclick = () => { cfg.size = b.dataset.size; renderConfig(); });
    panel.querySelectorAll('[data-one]').forEach((b) => b.onclick = () => { cfg.oils = [b.dataset.one]; renderConfig(); });
    panel.querySelectorAll('[data-oil]').forEach((b) => b.onclick = () => {
      const o = b.dataset.oil;
      cfg.oils = cfg.oils.includes(o) ? cfg.oils.filter((x) => x !== o) : cfg.oils.length < MAX_OILS ? [...cfg.oils, o] : cfg.oils;
      renderConfig();
    });
    $('#gbAdd').onclick = (e) => addToBox(e.currentTarget);
  }

  // ---------- add to box (with the flying product) ----------
  const boxEl = $('#gbox');
  const mobileBar = $('#gbBar');
  function addToBox(fromEl) {
    const p = current;
    const item = { id: p.id, name: p.name, size: cfg.size, oils: [...cfg.oils], tint: tintFor(p, cfg.oils) };
    box.push(item);
    fly(fromEl, item, () => { render(); bounce(); });
    if (!motion) { render(); }
    panel.hidden = true;
    grid.querySelectorAll('.gb-card').forEach((c) => c.classList.remove('sel'));
  }

  function inView(el) { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }

  function fly(fromEl, item, done) {
    if (!motion) return;
    const slot = $('.gbox-slot:not(.full)', boxEl) || $('.gbox-items', boxEl);
    const target = inView(boxEl) ? slot : mobileBar;
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'gb-ghost';
    ghost.innerHTML = thumbFor(byId(item.id), item.tint);
    document.body.appendChild(ghost);
    const sx = a.left + a.width / 2 - 32, sy = a.top + a.height / 2 - 32;
    const ex = b.left + b.width / 2 - 32, ey = b.top + Math.min(b.height / 2, 60) - 32;
    const mx = (sx + ex) / 2, my = Math.min(sy, ey) - 140;   // arc apex above both points
    const anim = ghost.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${mx}px, ${my}px) scale(1.15) rotate(-12deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${ex}px, ${ey}px) scale(0.55) rotate(8deg)`, opacity: 0.9 },
    ], { duration: 850, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' });
    // if the animation clock is paused (background tab), still land the product after a moment
    let landed = false;
    const land = () => { if (landed) return; landed = true; ghost.remove(); done(); };
    anim.onfinish = land;
    setTimeout(land, 1200);
  }

  function bounce() {
    const pop = (el, base) => el && el.animate && el.animate(
      [{ transform: `${base} scale(1)` }, { transform: `${base} scale(1.06)` }, { transform: `${base} scale(1)` }],
      { duration: 380, easing: 'ease-out' });
    pop(boxEl, '');
    pop(mobileBar, 'translateX(-50%)');   // the bar is centred with translateX, keep it
  }

  // ---------- render box, list, gates ----------
  const itemsEl = $('.gbox-items', boxEl);
  const listEl = $('#gbList');
  const form = $('#gbForm');
  const submit = $('#gbSubmit');
  function render() {
    // the minimum shows as numbered empty slots that fill up in order
    const slots = Math.max(MIN_ITEMS, box.length + 1);
    itemsEl.innerHTML = Array.from({ length: slots }, (_, i) => {
      const it = box[i];
      return it ? `<span class="gbox-slot full" title="${esc(it.name)}">${thumbFor(byId(it.id), it.tint)}</span>`
        : `<span class="gbox-slot${i >= MIN_ITEMS ? ' extra' : ''}">${i < MIN_ITEMS ? i + 1 : '+'}</span>`;
    }).join('');
    boxEl.classList.toggle('has-items', box.length > 0);
    const n = box.length;
    document.querySelectorAll('[data-gb-count]').forEach((el) => { el.textContent = `${n} product${n === 1 ? '' : 's'}`; });
    $('#gbProgress').style.transform = `scaleX(${Math.min(n / MIN_ITEMS, 1)})`;
    $('#gbProgressTxt').textContent = n >= MIN_ITEMS ? `${n} products in your box` : `${n} of ${MIN_ITEMS} products minimum`;
    listEl.innerHTML = n ? box.map((it, i) => `
      <li class="gb-line"><span class="gb-line-ic">${thumbFor(byId(it.id), it.tint)}</span>
        <span class="gb-line-txt"><strong>${esc(it.name)}</strong><span>${esc(it.size)} · ${it.oils.length ? esc(it.oils.join(', ')) : 'Unscented'}</span></span>
        <button type="button" class="gb-remove" data-rm="${i}" aria-label="Remove ${esc(it.name)}">Remove</button></li>`).join('')
      : '<li class="gb-empty">Your box is empty. Pick a product above to start.</li>';
    listEl.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { box.splice(+b.dataset.rm, 1); render(); });
    $('#gbBoxesOut').textContent = boxes;
    gate();
  }

  // ---------- number of boxes ----------
  const qty = $('#gbQty');
  const setBoxes = (v) => { boxes = Math.max(MIN_BOXES, Math.round(+v || MIN_BOXES)); qty.value = boxes; render(); };
  $('#gbMinus').onclick = () => setBoxes(boxes - 1);
  $('#gbPlus').onclick = () => setBoxes(boxes + 1);
  qty.addEventListener('change', () => setBoxes(qty.value));

  // ---------- quote form ----------
  const fields = ['gbName', 'gbEmail', 'gbPhone', 'gbAddress', 'gbCity', 'gbPostal'].map((id) => $('#' + id));
  const gateNote = $('#gbGate');
  function gate() {
    const needs = [];
    if (box.length < MIN_ITEMS) needs.push(`add ${MIN_ITEMS - box.length} more product${MIN_ITEMS - box.length > 1 ? 's' : ''} to your box`);
    if (boxes < MIN_BOXES) needs.push(`order at least ${MIN_BOXES} boxes`);
    const missing = fields.filter((f) => !f.value.trim() || !f.checkValidity());
    if (missing.length) needs.push('fill in your contact and delivery details');
    submit.disabled = needs.length > 0;
    gateNote.textContent = needs.length ? 'To request a quote, ' + needs.join(' and ') + '.' : 'All set. Send your request and I will reply with a quote.';
  }
  fields.forEach((f) => f.addEventListener('input', gate));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    gate();
    if (submit.disabled) return;
    submit.disabled = true;
    const [name, email, phone, address, city, postal] = fields.map((f) => f.value.trim());
    const payload = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'gb-' + Date.now(),
      type: 'gift-box', name, email, phone, address, city, postal,
      notes: $('#gbNotes').value.trim(),
      boxes, itemsPerBox: box.length,
      items: box.map((it) => ({ product: it.name, size: it.size, oils: it.oils })),
      page: 'gift-boxes.html',
    };
    if (typeof sendSubmission === 'function') await sendSubmission(payload);
    form.hidden = true;
    $('#gbDone').hidden = false;
    $('#gbDone').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' });
  });

  render();
})();
