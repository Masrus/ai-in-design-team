/* ---------- crop geometry: dialog state, frames, limits, canvases (no DOM) ---------- */
const cs = { ownIcon: null, ownWide: null, key: null, src: null, img: null, w: 0, h: 0, tab: 'icon', dsub: 'wide', sq: false, sq0: false, fSq: null, fWide: null, bbox: null, view: null, prevTimer: 0 };
const OUT = 1024;
// the icon frame the current tab edits: on the Dark tab it is the dark icon's own frame (falls back to the light icon's)
const sqFrame = () => (cs.tab === 'dark' ? (cs.fSqD || cs.fSq) : cs.fSq);
const setSqFrame = (v) => { if (cs.tab === 'dark') cs.fSqD = v; else cs.fSq = v; };

function sizeLimits() { const m = Math.max(cs.w, cs.h); return { min: Math.max(8, Math.min(cs.w, cs.h) * 0.15), max: m * 1.6 }; }
function clampFrame(f) {
  const { min, max } = sizeLimits();
  f.s = Math.min(max, Math.max(min, f.s));
  // frame may not leave the logo: if it is bigger than the logo, it may only slide over the logo
  const lo = (len) => Math.min(0, len - f.s), hi = (len) => Math.max(0, len - f.s);
  f.x = Math.min(hi(cs.w), Math.max(lo(cs.w), f.x));
  f.y = Math.min(hi(cs.h), Math.max(lo(cs.h), f.y));
  return f;
}
const minRect = () => ({ w: Math.max(8, cs.w * 0.05), h: Math.max(8, cs.h * 0.05) });
function clampRect(f) {
  const m = minRect();
  f.w = Math.min(cs.w, Math.max(m.w, f.w)); f.h = Math.min(cs.h, Math.max(m.h, f.h));
  f.x = Math.min(cs.w - f.w, Math.max(0, f.x)); f.y = Math.min(cs.h - f.h, Math.max(0, f.y));
  return f;
}
function defaultFrame() {
  const r = cs.w / cs.h;
  if (r > 1.5) return { x: 0, y: 0, s: cs.h };                       // wide logo: the mark is usually on the left
  if (r < 1 / 1.5) return { x: 0, y: 0, s: cs.w };                   // tall logo: the mark is usually on top
  const s = cs.opq ? Math.min(cs.w, cs.h) : Math.max(cs.w, cs.h);     // a picture with its own background: fill the icon, don't leave transparent bars
  return { x: (cs.w - s) / 2, y: (cs.h - s) / 2, s };
}
// box around the visible (non-transparent) pixels
function bboxOf(img, w, h) {
  try {
    const k = Math.min(1, 1000 / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, cw, ch);
    const d = g.getImageData(0, 0, cw, ch).data;
    let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { x: 0, y: 0, w, h };
    return { x: x0 / k, y: y0 / k, w: Math.min(w, (x1 + 1 - x0) / k), h: Math.min(h, (y1 + 1 - y0) / k) };
  } catch { return { x: 0, y: 0, w, h }; }
}
function iconCanvas(size, fr) {
  const F = fr || cs.fSq;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  const k = size / F.s;
  g.drawImage(cs.img, -F.x * k, -F.y * k, cs.w * k, cs.h * k);
  return c;
}
function wideCanvas(maxSide) {
  const f = cs.fWide, k = maxSide / Math.max(f.w, f.h);
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(f.w * k)); c.height = Math.max(1, Math.round(f.h * k));
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(cs.img, -f.x * k, -f.y * k, cs.w * k, cs.h * k);
  return c;
}
