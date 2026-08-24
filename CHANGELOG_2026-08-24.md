# ARKE Website — Change Log · 24 Aug 2026

All edits made in today's session, in order.

## 1. Copy update + grammar pass (from `ARKE_Website_Copy_by_Page.docx`)
Applied the updated copy deck across all 5 pages and fixed grammar/typos.

**Grammar/spelling fixes**
- Home intro: "sometimes can be overwhelming or missleading" → "can sometimes be overwhelming or misleading"; "human tested" → "human-tested"; "the full comfidence the product" → "full confidence in the product".
- Home intro link: "More about is ARK Experience" → "More about ARK Experience".
- Home maker bio: "at international company… in front the screen… I and my friends and family" → "at an international company… in front of a screen… that I, my friends, and my family".
- How it works: "or science degree" → "or a science degree".
- Lip balm hero: "the understanding how to customize for yourself" → "the understanding of how to customize it for yourself".
- Lip balm formula: "1 tubes to 1000+" → "1 tube to 1000+".
- Standardised British "customise/customisation" → American "customize/customization".

**Copy changes applied site-wide**
- Hero tagline → "Made for Curious."; footer tagline → "Your skin. Your ritual. Your recipe."
- Trust marquee → new 7-item version.
- Phuket → Thailand everywhere (footer brand line, copyright, "year-round heat", maker kitchen, about hero).
- Home pull quote → "the kind you made"; Step 02 → "Science explained in simple words"; guides sub-headline; "Browse All Guides".
- About "Today" timeline sentence polished.

**Two author notes addressed**
- Email-capture fine-print spacing adjusted.
- About timeline sentence flagged "might need polish" — rewritten.

## 2. "Download the guide" pop-up
- Added a second CTA — **Download the guide →** — to both guide cards on the Home page and both cards on the Guides page.
- Built an accessible modal pop-up (email capture) with per-guide contextual title/description.
- Opens instantly over a dimmed backdrop; closes via ×, backdrop click, or Esc; locks background scroll; resets the form on each open.
- Files: `index.html`, `guides.html` (markup), `styles.css` (modal styles), `script.js` (open/close logic).

## 3. Fine-print sizing
- The `Free PDF · No spam, ever · Unsubscribe anytime` line was rendering at 15px (overridden by a more specific rule). Added a properly-specific rule: font-size 7.5px (half) with 10px space above. Applies on all capture panels and in the modal.

## 4. Named image placeholders → real photos
- Labelled the three empty photo slots, then replaced them with optimised photos:
  - Guides page "What's inside every guide" → `assets/inside-every-guide.jpg`
  - Beginner's Guide "Knowledge first" → `assets/why-beginners.jpg`
  - Lip Balm Guide "Easier than you think" → `assets/why-lip-balm.jpg`

## 5. About page — 4-image gallery
- Added a responsive gallery right after "The maker" block: 4-across on desktop/tablet, 2×2 on mobile.
- Photos optimised to `assets/about-1.jpg` … `assets/about-4.jpg`.

## Notes / still open (for later)
- **Bulk Order** page (nav + footer link) — not built yet, intentionally deferred.
- Paid guides (Deodorant, Body Butter, Shampoo Bar) + Bulk Order calculator — deferred.
- Email-capture forms are still **front-end demo only** — wire the submit handler to your email provider (MailerLite / Kit / Make.com) before going live (see note in `script.js`).
- Original full-resolution photos remain untouched in `..\AI YANA`; the site uses the optimised copies in `assets/`.
