/* ---------- logo crop: app icon (square) and full logo (any shape) ---------- */
const dlg = document.getElementById('crop');
const area = document.getElementById('crop-area');
const cImg = document.getElementById('crop-img');
const frameEl = document.getElementById('crop-frame');
const range = document.getElementById('crop-range');
const rangeBox = document.getElementById('crop-size');
const prevBig = document.getElementById('crop-prev-big');
const prevSmall = document.getElementById('crop-prev-small');
const prevIcon = document.getElementById('prev-icon'), prevWide = document.getElementById('prev-wide'), prevDark = document.getElementById('prev-dark');
const dkWideImg = document.getElementById('dk-wide-img'), dkIconImg = document.getElementById('dk-icon-img'), blkWide = document.getElementById('blk-wide'), blkIcon = document.getElementById('blk-icon');
const wpLight = document.getElementById('wp-light'), wpDark = document.getElementById('wp-dark');
const ownFile = document.getElementById('crop-own-file');
function applyBg() {
  dlg.querySelectorAll('#prev-icon .tile, #prev-dark .tile').forEach((t) => { t.style.background = iconBg[t.closest('.wp').classList.contains('dark') ? 'dark' : 'light']; });
  dlg.querySelectorAll('.bgpick').forEach((el) => { el.value = iconBg[el.dataset.t]; });
}
dlg.querySelectorAll('.bgpick').forEach((el) => el.addEventListener('input', () => {
  iconBg[el.dataset.t] = el.value; lsSet('ctrader-preview-iconbg', JSON.stringify(iconBg)); applyBg(); render(); if (dlg.open) updatePreview();
}));
const ownView = document.getElementById('crop-own-view'), ownImg = document.getElementById('crop-own-img');
const tabIcon = document.getElementById('tab-icon'), tabWide = document.getElementById('tab-wide'), tabDark = document.getElementById('tab-dark');
const cSub = document.getElementById('crop-sub');
const TXT = {
  icon: ['', 'Move and resize the frame over the part of your logo that should appear in app icons, splash screens and notifications.'],
  dark: ['', 'Used on dark screens. We make the dark parts of your logo white. If you have a logo made for dark themes and you’re not happy with our version, feel free to upload it.'],
  wide: ['', 'Trim your full logo. Used in emails, installers and login screens. We cut the empty space around it; drag the corners if something is missing.'],
};

const ownDarkIcon = () => !!(state.darkSquare || state.dark);
const dkCrop = () => cs.tab === 'dark' && cs.dsub === 'icon' && !ownDarkIcon();   // frame + Size slider over the logo for the dark icon
function layout() {
  const A = area.getBoundingClientRect();
  const pad = 32, k = Math.min((A.width - 2 * pad) / cs.w, (A.height - 2 * pad) / cs.h);
  const ox = (A.width - cs.w * k) / 2, oy = (A.height - cs.h * k) / 2;
  cs.view = { k, ox, oy };
  Object.assign(cImg.style, { left: ox + 'px', top: oy + 'px', width: cs.w * k + 'px', height: cs.h * k + 'px' });
  drawFrame();
}
function drawFrame() {
  const wide = cs.tab === 'wide', dk = cs.tab === 'dark';
  // no Size row on this state → the logo area takes its place, so the dialog keeps the same height on every tab
  const noRange = dk ? !dkCrop() : (wide || !!cs.ownIcon);
  if (area.classList.contains('tall') !== noRange) { area.classList.toggle('tall', noRange); return layout(); }
  const { k, ox, oy } = cs.view;
  const dd = dk && !dkCrop() ? darkAuto(cs.dsub) : null;
  const own = dk ? (dd && dd.src) : wide ? cs.ownWide : cs.ownIcon;
  { const want = dk ? (() => { const ad = autoDark(cs.src); return ad && ad.low && ad.canvas ? ad.url() : cs.src; })() : cs.src; if (cImg.getAttribute('src') !== want) cImg.src = want; }
  ownView.hidden = !own; if (own) ownImg.src = own;
  ownImg.style.filter = dd ? dd.filter : '';
  area.classList.toggle('dark', dk || cs.key === 'dark');
  frameEl.hidden = !!own;
  frameEl.classList.toggle('rect', wide);
  rangeBox.hidden = noRange;
  if (wide) {
    const f = cs.fWide;
    Object.assign(frameEl.style, { left: ox + f.x * k + 'px', top: oy + f.y * k + 'px', width: f.w * k + 'px', height: f.h * k + 'px' });
  } else if (!dk || dkCrop()) {                                      // (a dark preview of your own file has no frame)
    const f = sqFrame();
    Object.assign(frameEl.style, { left: ox + f.x * k + 'px', top: oy + f.y * k + 'px', width: f.s * k + 'px', height: f.s * k + 'px' });
    const { min, max } = sizeLimits();
    range.value = Math.round(1000 * Math.log(f.s / min) / Math.log(max / min));
  }
  clearTimeout(cs.prevTimer); cs.prevTimer = setTimeout(updatePreview, 30);
}
function updatePreview() {
  if (cs.tab === 'icon') {
    let u, full;
    if (cs.ownIcon) { u = cs.ownIcon; full = opaqueOf(u) === true; setTimeout(() => { const f = opaqueOf(u) === true; prevBig.parentElement.classList.toggle('full', f); prevSmall.parentElement.classList.toggle('full', f); }, 120); }
    else { const c = iconCanvas(256); u = c.toDataURL(); full = opaqueCanvas(c); }
    const setTile = (el, bgHex) => {
      const ad = full ? null : autoDark(u, bgHex);
      el.style.filter = '';
      el.src = ad && ad.low && ad.canvas ? ad.url() : u;
    };
    setTile(prevBig, iconBg.light); setTile(prevSmall, iconBg.dark);
    prevBig.parentElement.classList.toggle('full', full); prevSmall.parentElement.classList.toggle('full', full);
    prevIcon.querySelectorAll('.bgpick').forEach((el) => { el.hidden = !!full; });
  } else if (cs.tab === 'dark') {
    const w = darkAuto('wide'), ic = darkAuto('icon');
    dkWideImg.src = w.src; dkWideImg.style.filter = w.filter;
    dkIconImg.src = ic.src; dkIconImg.style.filter = ic.filter;
    const setFull = () => { const f = opaqueOf(ic.src) === true; dkIconImg.parentElement.classList.toggle('full', f); blkIcon.querySelector('.bgpick').hidden = f; };
    setFull(); setTimeout(setFull, 120);
    if (!dkCrop()) { const dd = darkAuto(cs.dsub); if (ownImg.getAttribute('src') !== dd.src) ownImg.src = dd.src; ownImg.style.filter = dd.filter; }   // the big view follows when the auto version is ready
    blkWide.classList.toggle('sel', cs.dsub === 'wide'); blkIcon.classList.toggle('sel', cs.dsub === 'icon');
    blkWide.querySelector('.rm').hidden = !w.own; blkIcon.querySelector('.rm').hidden = !ic.own;
  } else {
    const u = cs.ownWide || wideCanvas(480).toDataURL();
    wpLight.src = u; wpDark.src = u;
    // dark plate: with enough contrast keep colours; otherwise white silhouette (flat) or dark parts made white (colourful)
    const ad = autoDark(u);
    const fl = flatness(u) !== false;
    wpDark.style.filter = ad ? '' : (fl ? 'brightness(0) invert(1)' : '');
    if (ad && ad.low && ad.canvas) wpDark.src = ad.url();
    if (cs.key === 'light') { const d = darkAuto('wide'); wpDark.src = d.src; wpDark.style.filter = d.filter; }   // the full logo on dark: your file or made from the logo
  }
  renderCards();
}
function setTab(t) {
  cs.tab = t;
  tabIcon.setAttribute('aria-selected', t === 'icon'); tabWide.setAttribute('aria-selected', t === 'wide'); tabDark.setAttribute('aria-selected', t === 'dark');
  let [, sub] = t === 'dark' ? TXT.dark : t === 'wide' ? TXT.wide : TXT.icon;
  if (t === 'wide' && cs.ownWide) sub = 'Using the full logo you uploaded. It is used in emails, installers and login screens.';
  if (t === 'icon' && cs.ownIcon) sub = 'Using the square icon you uploaded for app icons, splash screens and notifications.';
  cSub.textContent = sub;
  prevIcon.hidden = t !== 'icon'; prevWide.hidden = t !== 'wide'; prevDark.hidden = t !== 'dark';
  applyBg();
  if (cs.view) drawFrame();
}
// what goes on dark screens: your own file if there is one, otherwise made from the logo (dark parts white)
function darkAuto(kind) {
  const wide = kind === 'wide';
  const own = wide ? (state.darkWide || state.dark) : (state.darkSquare || state.dark);
  if (own) return { src: own, own: true, filter: '' };
  const base = wide ? ((cs.sq && !cs.ownWide) ? iconCanvas(512).toDataURL() : (cs.ownWide || wideCanvas(640).toDataURL())) : (cs.ownIcon || iconCanvas(256, cs.fSqD).toDataURL());
  const ad = autoDark(base, wide ? '#181818' : iconBg.dark);
  if (ad && ad.low && ad.canvas) return { src: ad.url(), own: false, filter: '' };
  return { src: base, own: false, filter: !ad && opaqueOf(base) !== true && flatness(base) !== false ? 'brightness(0) invert(1)' : '' };
}
const hasWide = () => !cs.sq || !!cs.ownWide;
const CARD_ICON = { trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>', up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V5M7 10l5-5 5 5M5 19h14"/></svg>' };
function paintCard(el, o) {
  const img = el.querySelector('img'), plus = el.querySelector('.plus'), up = el.querySelector('.sc-act.up'), rm = el.querySelector('.sc-act.rm');
  el.hidden = !!o.hidden; if (o.hidden) return;
  if (o.thumb) { if (img.getAttribute('src') !== o.thumb) img.src = o.thumb; img.hidden = false; } else { img.removeAttribute('src'); img.hidden = true; }
  img.style.filter = o.filter || '';
  plus.hidden = !o.empty; el.classList.toggle('empty', !!o.empty);
  el.querySelector('i').textContent = o.sub;
  const set = (b, on, t, ic) => { b.hidden = !on; if (on) { b.innerHTML = CARD_ICON[ic]; b.title = t; b.setAttribute('aria-label', t); } };
  set(up, o.up, o.upTitle, 'up'); set(rm, o.rm, o.rmTitle, 'trash'); rm.disabled = !!o.rmOff;
  el.querySelector('.th').style.borderRadius = o.round ? '22.5%' : '';
}
function renderCards() {
  if (!cs.src) return;
  paintCard(tabIcon, { thumb: cs.ownIcon || iconCanvas(96).toDataURL(), sub: cs.ownIcon ? 'Your file' : 'Cropped from your logo', up: true, upTitle: cs.ownIcon ? 'Replace icon' : 'Upload a square icon', rm: !!cs.ownIcon, rmTitle: 'Remove your icon', round: true });
  const hw = hasWide();
  paintCard(tabWide, { thumb: hw ? (cs.ownWide || wideCanvas(160).toDataURL()) : null, empty: !hw, sub: hw ? (cs.ownWide ? 'Your file' : 'Trimmed from your logo') : 'Optional', up: true, upTitle: cs.ownWide ? 'Replace logo' : 'Upload a full logo', rm: !!cs.ownWide, rmTitle: 'Remove your logo' });
  const di = darkAuto('icon'), n = (state.darkWide || state.dark ? 1 : 0) + (state.darkSquare || state.dark ? 1 : 0);
  paintCard(tabDark, { hidden: cs.key !== 'light', thumb: di.src, filter: di.filter, round: true, sub: n === 2 ? 'Your files' : n === 1 ? 'One file uploaded' : 'Made from your logo', up: true, upTitle: 'Upload a logo for dark theme', rm: !!(n > 0 || cs.fSqD || state.darkIconSrc), rmTitle: 'Reset to the version we made' });
}
let ownTarget = 'icon';

async function openCrop(key) {
  const src = state[key]; if (!src) return;
  cs.key = key; cs.src = src;
  cs.img = await loadImg(src);
  cs.w = cs.img.naturalWidth || 1000; cs.h = cs.img.naturalHeight || Math.round(1000 / ratioOf(cs.img, src));
  cImg.src = src;
  area.classList.toggle('dark', key === 'dark');
  cs.bbox = bboxOf(cs.img, cs.w, cs.h);
  try { const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(cs.img, 0, 0, 64, 64); cs.opq = opaqueCanvas(c); } catch { cs.opq = false; }
  cs.fSq = clampFrame(state[key + 'Crop'] ? { ...state[key + 'Crop'] } : defaultFrame());
  cs.fWide = clampRect(state[key + 'WideCrop'] ? { ...state[key + 'WideCrop'] } : { ...cs.bbox });
  cs.fSqD = key === 'light' && state.darkIconCrop ? clampFrame({ ...state.darkIconCrop }) : null;
  cs.ownIcon = state[key + 'OwnIcon'] || null; cs.ownWide = state[key + 'OwnWide'] || null;
  cs.view = null; cs.tab = 'icon'; cs.dsub = 'wide';
  cs.sq0 = !!state.sq && !cs.ownWide;
  cs.sq = cs.sq0; setTab(cs.tab);
  if (!dlg.open) dlg.showModal();
  layout();
}
async function closeCrop() {
  const key = cs.key;
  state[key + 'OwnIcon'] = cs.ownIcon; state[key + 'OwnWide'] = cs.ownWide;
  const sq = cs.sq && !cs.ownWide;
  state.sq = sq; lsSet('ctrader-preview-sq', sq ? '1' : '');
  // app icon
  if (cs.ownIcon) { state[key + 'Square'] = cs.ownIcon; state[key + 'Crop'] = null; }
  else { state[key + 'Square'] = iconCanvas(OUT).toDataURL(); state[key + 'Crop'] = { ...cs.fSq }; }
  // full logo
  if (cs.ownWide) { state[key + 'Wide'] = cs.ownWide; state[key + 'WideCrop'] = null; }
  else if (sq) { state[key + 'Wide'] = null; state[key + 'WideCrop'] = null; }
  else {
    const f = cs.fWide, full = f.x < 1 && f.y < 1 && Math.abs(f.w - cs.w) < 1 && Math.abs(f.h - cs.h) < 1;
    if (full) { state[key + 'Wide'] = null; state[key + 'WideCrop'] = null; }
    else { state[key + 'Wide'] = wideCanvas(1600).toDataURL(); state[key + 'WideCrop'] = { ...f }; }
  }
  if (key === 'light') {
    if (cs.fSqD && !ownDarkIcon()) { state.darkIconCrop = { ...cs.fSqD }; state.darkIconSrc = iconCanvas(OUT, cs.fSqD).toDataURL(); } else { state.darkIconCrop = null; state.darkIconSrc = null; }
    await dbSet('darkIconCrop', state.darkIconCrop); await dbSet('darkIconSrc', state.darkIconSrc);
  }
  dlg.close();
  for (const k of LOGO_KEYS(key).slice(1)) await dbSet(k, state[k]);
  render();
}
document.getElementById('crop-done').addEventListener('click', closeCrop);
dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeCrop(); });
// cards work as tabs; an empty card uploads, the button on a card uploads your own file or removes it
const pickFile = (target) => { ownTarget = target; ownFile.click(); };
const cards = { icon: tabIcon, wide: tabWide, dark: tabDark };
async function clearDark(which) {   // which: 'wide' | 'icon' | 'all'
  if (which === 'all') { for (const k of [...LOGO_KEYS('dark'), 'darkIconCrop', 'darkIconSrc']) { state[k] = null; await dbSet(k, null); } cs.fSqD = null; }
  else {
    if (state.dark) {   // the single dark file used to serve both places: keep it for the other one
      const other = which === 'wide' ? 'darkSquare' : 'darkWide';
      if (!state[other]) { state[other] = state.dark; await dbSet(other, state[other]); }
      state.dark = null; await dbSet('dark', null);
    }
    const k = which === 'wide' ? 'darkWide' : 'darkSquare'; state[k] = null; await dbSet(k, null);
  }
  render(); setTab('dark');
}
for (const [name, el] of Object.entries(cards)) {
  const up = el.querySelector('.sc-act.up'), rm = el.querySelector('.sc-act.rm');
  el.addEventListener('click', () => { if (name === 'wide' && !hasWide()) pickFile('wide'); else setTab(name); });
  el.addEventListener('keydown', (e) => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); } });
  up.addEventListener('click', (e) => { e.stopPropagation(); pickFile(name); });
  rm.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (name === 'icon') { cs.ownIcon = null; setTab('icon'); }
    else if (name === 'wide') { cs.ownWide = null; cs.sq = cs.sq0; setTab(hasWide() ? 'wide' : 'icon'); }
    else await clearDark('all');
  });
}
// dark tab: two blocks, each takes its own file; the big view shows the selected one
for (const [sub, el] of [['wide', blkWide], ['icon', blkIcon]]) {
  el.addEventListener('click', () => { cs.dsub = sub; drawFrame(); });
  el.addEventListener('keydown', (e) => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); } });
  el.querySelector('.up').addEventListener('click', (e) => { e.stopPropagation(); cs.dsub = sub; pickFile('dark-' + sub); });
  el.querySelector('.rm').addEventListener('click', (e) => { e.stopPropagation(); cs.dsub = sub; clearDark(sub); });
}
ownFile.addEventListener('change', async () => {
  const f = ownFile.files[0]; ownFile.value = ''; if (!f || !/^image\//.test(f.type)) return;
  let u; try { u = await normalise(f); } catch { return; }
  if (ownTarget === 'dark') { state.dark = u; await dbSet('dark', u); render(); setTab('dark'); return; }
  if (ownTarget.startsWith('dark-')) {
    const k = ownTarget === 'dark-wide' ? 'darkWide' : 'darkSquare';
    state[k] = u; await dbSet(k, u); render(); setTab('dark'); return;
  }
  if (ownTarget === 'wide') { cs.ownWide = u; cs.sq = false; } else cs.ownIcon = u;
  setTab(ownTarget);
});
window.addEventListener('resize', () => dlg.open && layout());

// drag to move, corner handles to resize (icon: square, opposite corner fixed; full logo: free shape)
let drag = null;
frameEl.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const h = e.target.classList.contains('h') ? [...e.target.classList].find((c) => c !== 'h') : null;
  drag = { id: e.pointerId, h, sx: e.clientX, sy: e.clientY, f: { ...(cs.tab === 'wide' ? cs.fWide : sqFrame()) } };
  frameEl.setPointerCapture(e.pointerId);
});
frameEl.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const k = cs.view.k, dx = (e.clientX - drag.sx) / k, dy = (e.clientY - drag.sy) / k, f0 = drag.f;
  if (cs.tab === 'wide') {
    if (!drag.h) cs.fWide = clampRect({ x: f0.x + dx, y: f0.y + dy, w: f0.w, h: f0.h });
    else {
      const m = minRect(); let x0 = f0.x, y0 = f0.y, x1 = f0.x + f0.w, y1 = f0.y + f0.h;
      if (drag.h.includes('w')) x0 = Math.min(x1 - m.w, Math.max(0, x0 + dx)); else x1 = Math.max(x0 + m.w, Math.min(cs.w, x1 + dx));
      if (drag.h.includes('n')) y0 = Math.min(y1 - m.h, Math.max(0, y0 + dy)); else y1 = Math.max(y0 + m.h, Math.min(cs.h, y1 + dy));
      cs.fWide = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    drawFrame(); return;
  }
  if (!drag.h) { setSqFrame(clampFrame({ x: f0.x + dx, y: f0.y + dy, s: f0.s })); drawFrame(); return; }
  const sx = drag.h.includes('e') ? 1 : -1, sy = drag.h.includes('s') ? 1 : -1;
  const d = (sx * dx + sy * dy) / 2;                                // grow along the diagonal
  const { min, max } = sizeLimits();
  const s = Math.min(max, Math.max(min, f0.s + d));
  const ax = sx > 0 ? f0.x : f0.x + f0.s, ay = sy > 0 ? f0.y : f0.y + f0.s;   // fixed corner
  setSqFrame(clampFrame({ x: sx > 0 ? ax : ax - s, y: sy > 0 ? ay : ay - s, s }));
  drawFrame();
});
const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
frameEl.addEventListener('pointerup', endDrag); frameEl.addEventListener('pointercancel', endDrag);
// size slider and mouse wheel zoom around the frame centre (icon frame only)
function resizeAround(sz) {
  if (!(cs.tab === 'icon' || dkCrop())) return;
  const F = sqFrame();
  const cx = F.x + F.s / 2, cy = F.y + F.s / 2;
  const { min, max } = sizeLimits(); sz = Math.min(max, Math.max(min, sz));
  const nf = clampFrame({ x: cx - sz / 2, y: cy - sz / 2, s: sz });
  setSqFrame(nf);
  drawFrame();
}
range.addEventListener('input', () => { const { min, max } = sizeLimits(); resizeAround(min * Math.pow(max / min, range.value / 1000)); });
area.addEventListener('wheel', (e) => { e.preventDefault(); resizeAround(sqFrame().s * Math.exp(e.deltaY * 0.0015)); }, { passive: false });
