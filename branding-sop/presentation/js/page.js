/* ---------- build ---------- */
const refs = [];  // { el, img?, slot }
const extraIcons = [];  // plain <img> that show the icon logo (hero)
function buildPanel({ w, h, fill, bg, slots }, dark) {
  const panel = document.createElement('div');
  panel.className = 'panel' + (dark ? ' dark' : '');
  panel.style.aspectRatio = `${w} / ${h}`;
  if (fill) panel.style.background = fill;
  panel.dataset.w = w;
  const st = document.createElement('div'); st.className = 'stage';
  st.style.width = w + 'px'; st.style.height = h + 'px';
  if (bg) {
    const im = document.createElement('img');
    im.className = 'bgimg'; im.src = bg; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
    st.appendChild(im);
  }
  for (const slot of slots) {
    const el = document.createElement('div');
    el.className = 'slot';
    Object.assign(el.style, { left: slot.x + 'px', top: slot.y + 'px', width: slot.w + 'px', height: slot.h + 'px' });
    if (slot.k === 'tile') {
      el.classList.add('tile'); el.style.borderRadius = slot.r + 'px';
    } else if (slot.k === 'name') {
      el.classList.add('name');
      Object.assign(el.style, { fontFamily: slot.f.family, fontWeight: slot.f.weight, fontSize: slot.size + 'px', lineHeight: slot.h + 'px', color: slot.color, textAlign: slot.align });
      if (slot.align === 'center') { el.style.display = 'flex'; el.style.justifyContent = 'center'; }
      refs.push({ el, slot });
    } else {
      if (slot.k === 'wide') el.classList.add('wide');
      const img = document.createElement('img'); img.alt = ''; img.decoding = 'async';
      img.style.objectPosition = slot.pos || 'center';
      el.appendChild(img);
      let bgEl = null;
      if (slot.k === 'icon' && !slots.some((q) => q.k === 'tile')) {
        bgEl = document.createElement('div'); bgEl.className = 'slot tilebg'; bgEl.style.display = 'none'; st.appendChild(bgEl);
      }
      refs.push({ el, img, slot, bgEl });
    }
    st.appendChild(el);
  }
  panel.appendChild(st);
  return panel;
}
function figure(panel, caps) {
  const f = document.createElement('figure'); f.className = 'reveal';
  f.appendChild(panel);
  const c = document.createElement('figcaption');
  for (const t of caps) { const s = document.createElement('span'); s.textContent = t; c.appendChild(s); }
  f.appendChild(c);
  return f;
}

const navLinks = document.getElementById('lnav-links');
const root = document.getElementById('sections');
function zoomFig(panel, caps) {
  const f = figure(panel, caps);
  const z = document.createElement('div'); z.className = 'zoom';
  f.insertBefore(z, panel); z.appendChild(panel);
  return f;
}
SECTIONS.forEach((sec) => {
  navLinks.insertAdjacentHTML('beforeend', `<a href="#${sec.id}" data-sec="${sec.id}">${(sec.nav || sec.title).replace('&', '&amp;')}</a>`);
  // section
  const el = document.createElement('section');
  el.className = 'sec'; el.id = sec.id;
  el.innerHTML = `<div class="wrap"><div class="sec-head reveal"><h2><span class="l1"></span><span class="grey"></span></h2><p class="lead-p"></p></div><div class="body"></div></div>`;
  el.querySelector('.l1').textContent = sec.h[0];
  el.querySelector('h2 .grey').textContent = sec.h[1];
  el.querySelector('.lead-p').textContent = sec.lead;
  const body = el.querySelector('.body');
  if (sec.ident) {
    const g = document.createElement('div'); g.className = 'ident';
    for (const p of IDENT) {
      const c = document.createElement('figure'); c.className = 'tile-card reveal';
      c.appendChild(buildPanel(p));
      c.insertAdjacentHTML('beforeend', '<div class="tc"><b></b><span></span></div>');
      c.querySelector('b').textContent = p.cap; c.querySelector('.tc span').textContent = p.note;
      g.appendChild(c);
    }
    body.appendChild(g);
  } else {
    const list = document.createElement('div'); list.className = 'shots';
    for (const n of sec.shots) {
      const s = S[n];
      list.appendChild(zoomFig(buildPanel({ w: s.w, h: s.h, bg: `shots/${n}.webp`, slots: s.slots }), s.caption));
    }
    body.appendChild(list);
  }
  root.appendChild(el);
});
const heroIcon = document.getElementById('hero-icon');
if (heroIcon) extraIcons.push(heroIcon);

// scale every stage to its panel width
const ro = new ResizeObserver((entries) => {
  for (const e of entries) e.target.style.setProperty('--k', e.contentRect.width / +e.target.dataset.w);
});
document.querySelectorAll('.panel').forEach((n) => ro.observe(n));

// reveal on scroll
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' }) : null;
document.querySelectorAll('.reveal').forEach((n) => io ? io.observe(n) : n.classList.add('in'));

// scroll-driven motion: hero fades and the icon grows, screens zoom in as they enter
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.getElementById('hero');
  const zooms = [...document.querySelectorAll('.zoom')];
  let ticking = false;
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  function frame() {
    ticking = false;
    const vh = innerHeight;
    const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * .9)));
    hero.style.setProperty('--p', p.toFixed(3));
    for (const z of zooms) {
      const r = z.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const k = Math.min(1, Math.max(0, (vh - r.top) / (vh * .75)));
      z.style.transform = `scale(${(0.86 + 0.14 * ease(k)).toFixed(4)})`;
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); frame();
})();

// local nav: mark the section in view
(() => {
  if (!('IntersectionObserver' in window)) return;
  const links = [...navLinks.querySelectorAll('a')];
  const sio = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.dataset.sec === e.target.id));
  }, { rootMargin: '-45% 0px -50% 0px' });
  SECTIONS.forEach((s) => sio.observe(document.getElementById(s.id)));
})();

const hasDark = () => !!(state.dark || state.darkWide || state.darkSquare);
function render() {
  const nm = brokerName();
  { const cn = document.getElementById('clear-name'); if (cn) cn.hidden = !state.name; }
  { const hd = document.getElementById('hint-dark');
    if (hd && !hasDark()) { const a = state.light ? autoDark(state.light) : null; hd.textContent = a && a.low ? 'Optional · dark parts turn white automatically' : 'Optional'; } }
  for (const r of refs) {
    if (r.slot.k === 'name') { r.el.textContent = nm; continue; }
    const p = pick(r.slot);
    if (r.img.getAttribute('src') !== p.src) r.img.src = p.src;
    if (r.slot.k === 'icon') {
      const sl = r.slot, f = !!p.full, T = tileOf(sl);
      Object.assign(r.el.style, f
        ? { left: T.x + 'px', top: T.y + 'px', width: T.w + 'px', height: T.h + 'px', borderRadius: T.r + 'px', overflow: 'hidden' }
        : { left: sl.x + 'px', top: sl.y + 'px', width: sl.w + 'px', height: sl.h + 'px', borderRadius: '', overflow: '' });
      r.img.style.objectFit = f ? 'cover' : '';
      if (r.bgEl) {
        const show = !f && !bgIsBlack(iconBg.dark);
        r.bgEl.style.display = show ? '' : 'none';
        if (show) Object.assign(r.bgEl.style, { left: T.x + 'px', top: T.y + 'px', width: T.w + 'px', height: T.h + 'px', borderRadius: T.r + 'px', background: iconBg.dark });
      }
    }
    if (r.slot.k === 'mark') {                       // bare logo on a dark screen: a logo with its own background gets rounded corners
      const f = !!p.full;
      Object.assign(r.el.style, { borderRadius: f ? r.slot.w * 0.225 + 'px' : '', overflow: f ? 'hidden' : '' });
      r.img.style.objectFit = f ? 'cover' : '';
    }
    r.el.classList.toggle('sil', !!p.sil);
    r.el.classList.toggle('outline', !!p.outline);
  }
  document.querySelectorAll('.slot.tile').forEach((e) => { e.style.background = iconBg.light; });
  const ic = pick({ k: 'icon' });
  for (const im of extraIcons) { if (im.getAttribute('src') !== ic.src) im.src = ic.src; im.style.filter = ic.sil ? 'brightness(0) invert(1)' : ''; }
  const has = !!(state.light || state.dark);
  document.body.classList.toggle('has-logo', has);
  document.getElementById('reset').hidden = !has;
  document.getElementById('hero-name').textContent = heroName();
  document.title = (state.name.trim() ? state.name.trim() + ' on cTrader' : 'cTrader Branding Preview');
  setThumb('light', state.light, DEF.wideBlack, 'SVG or PNG, transparent');
  setThumb('dark', state.darkWide || state.darkSquare || state.dark, state.light ? null : DEF.wideWhite, 'Optional');
}
function setThumb(key, val, fallback, hint) {
  const t = document.getElementById('thumb-' + key);
  const src = val || fallback || state.light;
  if (src) { t.src = src; t.style.visibility = ''; } else t.style.visibility = 'hidden';
  t.parentElement.classList.toggle('full', !!src && opaqueOf(src) === true);   // a logo with its own background fills the tile, no frame around it
  document.getElementById('clear-' + key).hidden = !val;
  document.getElementById('drop-' + key).classList.toggle('filled', !!val);
  document.getElementById('edit-' + key).hidden = key === 'dark' ? !state.dark : !val;
  const ad = key === 'dark' && !val && state.light ? autoDark(state.light) : null;
  document.getElementById('hint-' + key).textContent = val ? 'Uploaded' : (ad && ad.low ? 'Optional · dark parts turn white automatically' : hint);
}

/* ---------- inputs ---------- */
async function setLogo(key, file, quiet) {
  if (!file || !/^image\//.test(file.type)) return;
  try { state[key] = await normalise(file); } catch { return; }
  for (const k of LOGO_KEYS(key).slice(1)) state[k] = null;
  if (key === 'light') { state.darkIconCrop = null; state.darkIconSrc = null; await dbSet('darkIconCrop', null); await dbSet('darkIconSrc', null); }
  for (const k of LOGO_KEYS(key)) await dbSet(k, state[k]);
  if (key === 'light') {
    try { const im = await loadImg(state.light); const q = ratioOf(im, state.light);
      // square logo, or a picture with its own background: there is no wide logo, so we use icon + broker name
      let opq = false; try { const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(im, 0, 0, 64, 64); opq = opaqueCanvas(c); } catch {}
      state.sq = (q >= 0.85 && q <= 1.18) || opq; lsSet('ctrader-preview-sq', state.sq ? '1' : ''); } catch {}
  }
  render();
  if (!quiet) openCrop(key);
}
