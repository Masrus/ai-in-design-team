const DEFAULT_NAME = 'cTrader';          // name inside app screens before the broker types theirs
const DEFAULT_HERO = 'Your brand';       // headline before the broker types their name
const DEF = {
  markWhite: 'assets/ctrader-mark-white.svg',
  wideWhite: 'assets/ctrader-wide-white.svg',
  wideBlack: 'assets/ctrader-wide-black.svg',
};
const state = { light: null, dark: null, lightSquare: null, darkSquare: null, lightCrop: null, darkCrop: null, lightWide: null, darkWide: null, lightWideCrop: null, darkWideCrop: null, lightOwnIcon: null, darkOwnIcon: null, lightOwnWide: null, darkOwnWide: null, darkIconCrop: null, darkIconSrc: null, sq: false, name: '' };
const IMG_KEYS = ['light', 'dark', 'lightSquare', 'darkSquare', 'lightCrop', 'darkCrop', 'lightWide', 'darkWide', 'lightWideCrop', 'darkWideCrop', 'lightOwnIcon', 'darkOwnIcon', 'lightOwnWide', 'darkOwnWide', 'darkIconCrop', 'darkIconSrc'];
const LOGO_KEYS = (k) => [k, k + 'Square', k + 'Crop', k + 'Wide', k + 'WideCrop', k + 'OwnIcon', k + 'OwnWide'];

/* ---------- page content ---------- */
// Identity panels are drawn from slots too, so the PDF renders them with the same code.
const IDENT = [
  { cap: 'App icon', note: 'Cropped from your logo.', w: 640, h: 480, fill: '#FFFFFF', slots: [
    { k: 'tile', x: 200, y: 120, w: 240, h: 240, r: 54 },
    { k: 'icon', bgKey: 'light', x: 233.6, y: 153.6, w: 172.8, h: 172.8 },
  ]},
  { cap: 'Logo on light', note: 'Emails and light themes.', w: 640, h: 480, fill: '#FFFFFF', slots: [
    { k: 'wide', bg: 'light', x: 120, y: 165, w: 400, h: 150 },
  ]},
  { cap: 'Logo on dark', note: 'Installers, splash and login.', w: 640, h: 480, fill: '#181818', slots: [
    { k: 'wide', bg: 'dark', sil: true, x: 120, y: 165, w: 400, h: 150 },
  ]},
];
const S = window.SHOTS;
const SECTIONS = [
  { id: 'identity', title: 'Identity', h: ['Your icon.', 'On every screen.'], card: ['Your icon.', 'Cropped from your logo, used everywhere.'], lead: 'One logo, every surface. Your logo replaces cTrader on app icons, splash screens, installers, notifications and emails.', ident: true },
  { id: 'desktop', title: 'cTrader Web & Desktop', nav: 'Desktop', h: ['Web & Desktop.', 'Your brand from the first click.'], card: ['Web & Desktop.', 'From the browser tab to the dock.'], lead: 'From the browser tab and the dock to the installer, notifications and login screen, traders see your brand first.', shots: ['05', '06', '07'] },
  { id: 'mobile', title: 'cTrader Mobile', nav: 'Mobile', h: ['iOS and Android.', 'In your traders’ pockets.'], card: ['iOS and Android.', 'Icon, splash, login and menu.'], lead: 'Android and iOS apps with your icon, splash screen, login and in-app menu.', shots: ['10', '09'] },
  { id: 'stores', title: 'App Store & Google Play', nav: 'Stores', h: ['Listed under', 'your name.'], card: ['App Store and Google Play.', 'Listed under your name.'], lead: 'Your listing in both stores, with your name and your icon.', shots: ['11'] },
  { id: 'admin', title: 'cTrader Admin', nav: 'Admin', h: ['Your back office.', 'Your brand.'], card: ['cTrader Admin.', 'Your back office, your brand.'], lead: 'Your back office carries your brand in the splash screen, notifications, dialogs and app header.', shots: ['13', '14'] },
  { id: 'email', title: 'Email', h: ['Every email.', 'Signed by you.'], card: ['Email.', 'Light and dark themes, signed by you.'], lead: 'Transactional emails in light and dark themes, signed with your logo.', shots: ['15'] },
];

/* ---------- local storage (IndexedDB for images, localStorage for name) ---------- */
const DB = 'ctrader-branding-preview', STORE = 'logos';
function idb() {
  return new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
}
async function dbGet(key) {
  try { const db = await idb();
    return await new Promise((res) => { const q = db.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); });
  } catch { return null; }
}
async function dbSet(key, val) {
  try { const db = await idb();
    await new Promise((res) => { const tx = db.transaction(STORE, 'readwrite'); val == null ? tx.objectStore(STORE).delete(key) : tx.objectStore(STORE).put(val, key); tx.oncomplete = res; tx.onerror = res; });
  } catch {}
}
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} };
// colour behind a transparent app icon: on light (identity card, light themes) and on dark (app screens)
const iconBg = { light: '#000000', dark: '#000000' };
try { Object.assign(iconBg, JSON.parse(lsGet('ctrader-preview-iconbg') || '{}')); } catch {}
const bgIsBlack = (c) => !c || c.toLowerCase() === '#000000';

/* ---------- reading uploads ---------- */
function readFile(file) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(file); });
}
// Raster logos are trimmed of transparent margins and capped at 1600px; SVG is kept as is.
async function normalise(file) {
  const url = await readFile(file);
  if (file.type === 'image/svg+xml') return url;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  let box = { x0: 0, y0: 0, x1: w, y1: h };
  try {
    const d = g.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 >= 0) box = { x0, y0, x1: x1 + 1, y1: y1 + 1 };
  } catch {}
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
  const s = Math.min(1, 1600 / Math.max(bw, bh));
  const o = document.createElement('canvas'); o.width = Math.round(bw * s); o.height = Math.round(bh * s);
  const og = o.getContext('2d'); og.imageSmoothingQuality = 'high';
  og.drawImage(c, box.x0, box.y0, bw, bh, 0, 0, o.width, o.height);
  return o.toDataURL('image/png');
}

/* ---------- which image goes into which slot ---------- */
function pick(slot) {
  const square = slot.k === 'icon' || slot.k === 'mark';
  const wide = slot.k === 'wide';
  if (wide && slot.bg === 'dark' && state.darkWide) return { src: state.darkWide };   // your own full logo for dark
  if (wide && state.sq && (state.light || state.dark)) {
    const c = composeSync(slot.bg === 'dark' ? 'dark' : 'light');
    if (c) return { src: c };
  }
  const light = square ? (state.lightSquare || state.light) : wide ? (state.lightWide || state.light) : state.light;
  const dark = square ? (state.darkSquare || state.dark) : wide ? (state.darkWide || state.dark) : state.dark;
  const dk = slot.k !== 'wide' || slot.bg === 'dark';
  const dsrc = (square && state.darkIconSrc) ? state.darkIconSrc : light;   // dark-theme icon with its own crop
  // a logo that comes with its own background fills the whole app tile
  const out = (o) => (square && opaqueOf(o.src) === true) ? { src: o.src, full: true } : o;
  if (!light && !dark) {
    if (square) return { src: DEF.markWhite };
    return { src: dk ? DEF.wideWhite : DEF.wideBlack };
  }
  if (dk) {
    if (dark) return out({ src: dark });
    if (square && opaqueOf(dsrc) === true) return out({ src: dsrc });
    // no dark version: check the contrast against the dark plate and lighten the logo only if it is needed
    const ad = autoDark(dsrc, slot.k === 'icon' ? iconBg[slot.bgKey || 'dark'] : '#181818');
    if (ad && !ad.low) return out({ src: dsrc });
    const fl = flatness(dsrc);
    if (ad && ad.low && ad.canvas) return { src: ad.url() };   // dark parts → white, other colours stay
    if (fl === false) return out({ src: dsrc });
    return { src: dsrc, sil: ad && ad.low ? true : !!slot.sil, outline: !!slot.outline };
  }
  return out({ src: light || dark });
}

// where the app tile of an icon slot really is (measured on the screenshot), with a hair of bleed to hide the old edge
function tileOf(sl) {
  const B = 0.4;
  if (sl.tile) { const t = sl.tile; return { x: t.x - B, y: t.y - B, w: t.w + 2 * B, h: t.h + 2 * B, r: t.r + B }; }
  const t = sl.w / 0.72, h = t * sl.h / sl.w;
  return { x: sl.x - (t - sl.w) / 2, y: sl.y - (t - sl.h) / 2, w: t, h, r: t * 0.225 };
}
// Logo with its own background (no transparency) → it should fill the whole app tile.
const opqCache = new Map();
function opaqueCanvas(c) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] >= 245) n++;
  return n / (c.width * c.height) >= 0.98;
}
function opaqueOf(src) {
  if (!src) return null;
  if (opqCache.has(src)) return opqCache.get(src);
  opqCache.set(src, null);
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      c.getContext('2d').drawImage(img, 0, 0, 64, 64);
      const v = opaqueCanvas(c); opqCache.set(src, v); if (v) render();
    } catch { opqCache.set(src, false); }
  };
  img.onerror = () => opqCache.set(src, false);
  img.src = src;
  return null;
}

// Square logo only: where a wide logo is needed we show the icon and the broker name next to it.
const compCache = new Map(), imgReady = new Map(), pendingAsset = new Set();
function ensureAssets(src) {
  if (pendingAsset.has(src)) return; pendingAsset.add(src);
  Promise.all([loadImg(src), document.fonts.load("600 100px Geist")])
    .then(([im]) => { imgReady.set(src, im); render(); })
    .catch(() => {}).finally(() => pendingAsset.delete(src));
}
function composeSync(theme) {
  const dk = theme === 'dark';
  const own = state.darkSquare || state.dark;
  const icon = dk ? (own || state.darkIconSrc || state.lightSquare || state.light) : (state.lightSquare || state.light || own);
  if (!icon) return null;
  const ad = dk && !own ? autoDark(icon) : null;
  const fl = flatness(icon) !== false;
  const recol = dk && !own && ad && ad.low && ad.canvas;
  const tint = !recol && dk && !own && opaqueOf(icon) !== true && (ad ? false : fl);
  const nm = brokerName();
  const key = [theme, nm, icon.length, icon.slice(-48), tint, !!recol].join('|');
  if (compCache.has(key)) return compCache.get(key);
  const img = imgReady.get(icon);
  if (!img || !document.fonts.check('600 100px Geist')) { ensureAssets(icon); return null; }
  const H = 200, fs = 104, gap = 30, r = ratioOf(img, icon);
  const iw = opaqueOf(icon) === true ? H : H * Math.min(1, r) , ih = opaqueOf(icon) === true ? H : H / Math.max(1, r);
  const m = document.createElement('canvas').getContext('2d'); m.font = `600 ${fs}px Geist`;
  const tw = Math.ceil(m.measureText(nm).width);
  const c = document.createElement('canvas'); c.width = H + gap + tw; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  const full = opaqueOf(icon) === true;
  if (full) { g.save(); g.beginPath(); g.roundRect(0, 0, H, H, H * 0.225); g.clip(); }
  const dw = full ? (r >= 1 ? H * r : H) : (r >= 1 ? H : H * r), dh = full ? (r >= 1 ? H : H / r) : (r >= 1 ? H / r : H);
  const dx = (H - dw) / 2, dy = (H - dh) / 2;
  if (tint) g.drawImage(tinted(img, dw, dh, '#fff', 1), dx, dy, dw, dh); else g.drawImage(recol || img, dx, dy, dw, dh);
  if (full) g.restore();
  g.font = `600 ${fs}px Geist`; g.fillStyle = dk ? '#fff' : '#111'; g.textBaseline = 'alphabetic';
  g.fillText(nm, H + gap, H / 2 + fs * 0.35);
  const url = c.toDataURL('image/png'); compCache.set(key, url); return url;
}

// Contrast of a logo against the dark plate (#181818): below 3:1 for a noticeable part of it → "low".
// Colourful logos get their dark pixels repainted white (canvas); flat ones are painted as a white silhouette elsewhere.
const darkCache = new Map();
const lumOf = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const lumHex = (h) => { const n = parseInt(String(h).replace('#', ''), 16) || 0; return lumOf(n >> 16 & 255, n >> 8 & 255, n & 255); };
// bgHex = the plate the logo sits on (dark app plate by default, or the app-tile colour for icons)
function autoDark(src, bgHex = '#181818') {
  if (!src) return null;
  const Lb = lumHex(bgHex);
  if (Lb >= 0.18) return { low: false, canvas: null, url: () => src };   // light plate: nothing to lighten
  const thr = 3 * (Lb + 0.05) - 0.05;                                       // pixels below this are under 3:1 against the plate
  const key = src + '|' + Lb.toFixed(3);
  if (darkCache.size > 40) darkCache.clear();
  if (darkCache.has(key)) { const v = darkCache.get(key); return v === 'wait' ? undefined : v; }
  darkCache.set(key, 'wait');
  loadImg(src).then((img) => {
    let res = { low: false, canvas: null, url: () => src };
    try {
      const w0 = img.naturalWidth || 64, h0 = img.naturalHeight || 64, s = Math.min(1, 1200 / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * s)), h = Math.max(1, Math.round(h0 * s));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
      const im = g.getImageData(0, 0, w, h), d = im.data;
      let total = 0, low = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= 200) { total++; if (lumOf(d[i], d[i + 1], d[i + 2]) < thr) low++; }
      const isLow = total > 0 && low / total >= 0.15 && total / (w * h) < 0.9;   // a picture with its own background is left alone
      if (isLow) {
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && lumOf(d[i], d[i + 1], d[i + 2]) < thr) { d[i] = d[i + 1] = d[i + 2] = 255; }
        g.putImageData(im, 0, 0);
      }
      let url = null;
      res = { low: isLow, canvas: isLow ? c : null, url: () => url || (url = c.toDataURL('image/png')) };
    } catch {}
    darkCache.set(key, res);
    render();
    const dlg = document.getElementById('crop'); if (dlg && dlg.open && typeof updatePreview === 'function') updatePreview();
  }).catch(() => darkCache.set(key, { low: false, canvas: null, url: () => src }));
  return undefined;
}

// Flat logo (few solid colours) → OK to paint as a white silhouette on dark slots.
// Colourful logos (gradients, filled plates) stay as they are. Unknown yet → true (old behaviour).
const flatCache = new Map();
function flatness(src) {
  if (!src) return true;
  if (flatCache.has(src)) { const v = flatCache.get(src); return v === null ? true : v; }
  flatCache.set(src, null);
  try {
    const img = new Image();
    img.onload = () => {
      try {
        const w0 = img.naturalWidth || 64, h0 = img.naturalHeight || 64;
        const s = Math.min(1, 64 / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * s)), h = Math.max(1, Math.round(h0 * s));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h).data;
        const bins = new Map(); let total = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 200) continue;
          const key = (d[i] >> 5) << 6 | (d[i + 1] >> 5) << 3 | (d[i + 2] >> 5);
          bins.set(key, (bins.get(key) || 0) + 1); total++;
        }
        let main = 0;
        for (const n of bins.values()) if (n > total * 0.015) main++;
        // colour boundaries inside the logo (shape on a plate, letter in a badge) would vanish in a silhouette
        let edges = 0; const dist = (i, j) => Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]);
        for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
          const i = (y * w + x) * 4; if (d[i + 3] < 200) continue;
          const r = i + 4, bt = i + w * 4;
          if (d[r + 3] >= 200 && dist(i, r) > 90) edges++;
          if (d[bt + 3] >= 200 && dist(i, bt) > 90) edges++;
        }
        const flat = main <= 4 && edges <= total * 0.015;
        flatCache.set(src, flat);
        render();
        const dlg = document.getElementById('crop'); if (dlg && dlg.open && typeof updatePreview === 'function') updatePreview();
      } catch { flatCache.set(src, true); }
    };
    img.onerror = () => flatCache.set(src, true);
    img.src = src;
  } catch { flatCache.set(src, true); }
  return true;
}
const brokerName = () => (state.name || '').trim() || DEFAULT_NAME;
const heroName = () => (state.name || '').trim() || DEFAULT_HERO;
