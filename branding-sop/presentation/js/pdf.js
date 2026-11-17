/* ---------- canvas render (for PDF) — same rules as the DOM preview ---------- */
const imgCache = new Map();
function loadImg(src) {
  // opened as a local file: use inlined copies, otherwise the canvas is "tainted" and can't be exported
  const real = (window.__LOCAL_ASSETS && window.__LOCAL_ASSETS[src]) || src;
  if (!imgCache.has(real)) imgCache.set(real, new Promise((res, rej) => {
    const i = new Image(); i.decoding = 'async';
    i.onload = () => res(i); i.onerror = () => rej(new Error('image failed: ' + src.slice(0, 60)));
    i.src = real;
  }));
  return imgCache.get(real);
}
function ratioOf(img, src) {
  if (img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
  try {
    const txt = src.startsWith('data:image/svg+xml;base64,') ? atob(src.split(',')[1]) : decodeURIComponent(src.split(',')[1] || '');
    const vb = txt.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (vb) return parseFloat(vb[1]) / parseFloat(vb[2]);
  } catch {}
  return 1;
}
function tinted(img, w, h, color, px) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * px)); c.height = Math.max(1, Math.ceil(h * px));
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}
// Draws one panel (bg image + slots) into a box on the page canvas. px = device pixels per panel unit.
async function drawPanel(g, p, X, Y, W, radius, px) {
  const k = W / p.w, H = p.h * k;
  g.save();
  g.beginPath(); g.roundRect(X, Y, W, H, radius); g.clip();
  g.fillStyle = p.fill || '#FFFFFF'; g.fillRect(X, Y, W, H);
  g.translate(X, Y); g.scale(k, k);
  if (p.bg) g.drawImage(await loadImg(p.bg), 0, 0, p.w, p.h);
  const nm = brokerName();
  for (const slot of p.slots) {
    if (slot.k === 'tile') { g.fillStyle = iconBg.light; g.beginPath(); g.roundRect(slot.x, slot.y, slot.w, slot.h, slot.r); g.fill(); continue; }
    if (slot.k === 'name') {
      g.font = `${slot.f.weight} ${slot.size}px ${slot.f.family}`;
      g.fillStyle = slot.color; g.textBaseline = 'alphabetic';
      const m = g.measureText(nm);
      const asc = m.fontBoundingBoxAscent ?? slot.size * 0.93;
      const desc = m.fontBoundingBoxDescent ?? slot.size * 0.24;
      const base = slot.y + (slot.h - (asc + desc)) / 2 + asc;
      g.textAlign = slot.align === 'center' ? 'center' : 'left';
      g.fillText(nm, slot.align === 'center' ? slot.x + slot.w / 2 : slot.x, base);
      continue;
    }
    const pk = pick(slot);
    const img = await loadImg(pk.src);
    const r = ratioOf(img, pk.src);
    let bx = slot.x, by = slot.y, bw = slot.w, bh = slot.h;
    if (slot.k === 'wide') { by = slot.y + slot.h * 0.1975; bh = slot.h * 0.605; }
    let dw = bw, dh = bw / r;
    if (dh > bh) { dh = bh; dw = bh * r; }
    const pos = slot.pos || 'center';
    const dx = pos.startsWith('left') ? bx : pos.startsWith('right') ? bx + bw - dw : bx + (bw - dw) / 2;
    const dy = by + (bh - dh) / 2;
    const dpx = px * k;
    if (slot.k === 'mark' && pk.full) {
      const cw = r >= 1 ? slot.h * r : slot.w, ch = r >= 1 ? slot.h : slot.w / r;
      g.save(); g.beginPath(); g.roundRect(slot.x, slot.y, slot.w, slot.h, slot.w * 0.225); g.clip();
      g.drawImage(img, slot.x - (cw - slot.w) / 2, slot.y - (ch - slot.h) / 2, cw, ch); g.restore();
      continue;
    }
    if (slot.k === 'icon' && pk.full) {
      const T = tileOf(slot), t = T.w;
      const cw = r >= 1 ? t * r : t, ch = r >= 1 ? t : t / r;
      g.save(); g.beginPath(); g.roundRect(T.x, T.y, T.w, T.h, T.r); g.clip();
      g.drawImage(img, T.x - (cw - t) / 2, T.y - (ch - t) / 2, cw, ch); g.restore();
      continue;
    }
    if (slot.k === 'icon' && !pk.full && !p.slots.some((q) => q.k === 'tile') && !bgIsBlack(iconBg.dark)) {
      const T = tileOf(slot); g.fillStyle = iconBg.dark; g.beginPath(); g.roundRect(T.x, T.y, T.w, T.h, T.r); g.fill();
    }
    if (pk.sil) g.drawImage(tinted(img, dw, dh, '#fff', dpx), dx, dy, dw, dh);
    else if (pk.outline) {
      const wt = tinted(img, dw, dh, '#fff', dpx);
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.drawImage(wt, dx + ox / k, dy + oy / k, dw, dh);
      g.drawImage(img, dx, dy, dw, dh);
    } else g.drawImage(img, dx, dy, dw, dh);
  }
  g.restore();
  return H;
}
const PW = 1920, PH = 1080, M = 120;
function text(g, str, x, y, font, color) { g.font = font; g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(str, x, y); }
function fitFont(g, str, weight, size, maxW) {
  g.font = `${weight} ${size}px Geist`;
  const w = g.measureText(str).width;
  return w > maxW ? Math.floor(size * maxW / w) : size;
}
async function drawLogoImg(g, src, x, y, h) {
  const img = await loadImg(src); const w = h * ratioOf(img, src); g.drawImage(img, x, y, w, h);
}
// pages: cover · identity · one per shot · closing
function pages() {
  const list = [{ type: 'cover' }];
  SECTIONS.forEach((sec, i) => {
    const num = String(i + 1).padStart(2, '0');
    if (sec.ident) list.push({ type: 'ident', num, sec });
    else sec.shots.forEach((n, j) => list.push({ type: 'shot', num, sec, n, first: j === 0 }));
  });
  list.push({ type: 'close' });
  return list;
}
async function renderPage(pg, px = 2) {
  const c = document.createElement('canvas');
  c.width = PW * px; c.height = PH * px;
  const g = c.getContext('2d');
  g.scale(px, px); g.imageSmoothingQuality = 'high';
  g.fillStyle = '#000'; g.fillRect(0, 0, PW, PH);
  if (pg.type === 'cover') {
    const grd = g.createRadialGradient(1500, 430, 0, 1500, 430, 900);
    grd.addColorStop(0, 'rgba(255,255,255,.12)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, PW, PH);
    await drawLogoImg(g, 'assets/spotware-logo.svg', M, 96, 34);
    const nm = heroName();
    const fs = fitFont(g, nm, 600, 168, 1080);
    text(g, nm, M, 600 + 40 + fs * .85, `600 ${fs}px Geist`, '#F2F2F0');
    text(g, 'on cTrader', M, 600 + 40 + fs * .85 + 168 * .95, '600 168px Geist', '#75756E');
    await drawPanel(g, { w: 240, h: 240, fill: iconBg.dark, slots: [{ k: 'icon', x: 33.6, y: 33.6, w: 172.8, h: 172.8 }] }, 1380, 300, 400, 90, px);
  } else if (pg.type === 'close') {
    text(g, 'Let’s put your brand', M, 460, '600 120px Geist', '#F2F2F0');
    text(g, 'on cTrader.', M, 590, '600 120px Geist', '#F2F2F0');
    await drawLogoImg(g, 'assets/spotware-logo.svg', M, 860, 34);
    text(g, 'www.spotware.com    sales@spotware.com    +357 25 344 902    3rd Floor, Stratigou Gianni Timagia 19, Limassol 3107', M, 960, '400 24px Geist', '#A3A39C');
  } else {
    text(g, pg.num, M, 128, '500 28px Geist', '#75756E');
    text(g, pg.sec.title, M + 64, 128, '600 28px Geist', '#F2F2F0');
    const top = 200, box = { w: PW - 2 * M, h: PH - top - 150 };
    if (pg.type === 'ident') {
      text(g, pg.sec.lead, M, 200, '400 28px Geist', '#A3A39C');
      const gap = 32, w = (box.w - 2 * gap) / 3;
      for (let i = 0; i < IDENT.length; i++) {
        const x = M + i * (w + gap);
        const h = await drawPanel(g, IDENT[i], x, 320, w, 32, px);
        text(g, IDENT[i].cap, x, 300 + h + 48, '400 24px Geist', '#A3A39C');
      }
    } else {
      const s = S[pg.n];
      const k = Math.min(box.w / s.w, box.h / s.h);
      const w = s.w * k, h = s.h * k, x = M, y = top;
      await drawPanel(g, { w: s.w, h: s.h, bg: `shots/${pg.n}.webp`, slots: s.slots }, x, y, w, 32, px);
      text(g, s.caption.join('  ·  '), x, y + h + 56, '400 24px Geist', '#A3A39C');
    }
  }
  return c;
}

/* ---------- PDF ---------- */
const loaded = new Set();
function loadScript(src) {
  return new Promise((res, rej) => {
    if (loaded.has(src)) return res();
    const t = document.createElement('script'); t.src = src;
    t.onload = () => { loaded.add(src); res(); };
    t.onerror = () => rej(new Error('failed to load ' + src));
    document.head.appendChild(t);
  });
}
const pdfBtns = [document.getElementById('pdf-2'), document.getElementById('pdf-nav')];
let busy = false;
async function downloadPdf(btn) {
  if (busy) return; busy = true;
  const labels = pdfBtns.map((b) => b.textContent);
  pdfBtns.forEach((b) => (b.disabled = true));
  const say = (t) => { btn.textContent = t; };
  try {
    say('Preparing…');
    await loadScript('vendor/jspdf.umd.min.js');
    if (location.protocol === 'file:') await loadScript('vendor/local-assets.js');
    await document.fonts.ready;
    const specs = new Set(['500 28px Geist', '600 28px Geist', '400 24px Geist', '600 120px Geist']);
    for (const n in S) for (const sl of S[n].slots) if (sl.k === 'name') specs.add(`${sl.f.weight} ${sl.size}px ${sl.f.family}`);
    await Promise.all([...specs].map((f) => document.fonts.load(f, brokerName() + heroName()).catch(() => {})));
    const { jsPDF } = window.jspdf;
    const W = 1440, H = 810;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [W, H], compress: true });
    const list = pages();
    for (let i = 0; i < list.length; i++) {
      say(`Page ${i + 1} of ${list.length}…`);
      const c = await renderPage(list[i], 2);
      if (i > 0) doc.addPage([W, H], 'landscape');
      doc.addImage(c.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, W, H, `page-${i}`, 'FAST');
      c.width = c.height = 0;
      await new Promise((r) => setTimeout(r, 0));
    }
    const slug = brokerName().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ctrader';
    doc.save(`${slug}-ctrader-branding.pdf`);
  } catch (e) {
    console.error(e);
    alert('Could not build the PDF: ' + (e && e.message ? e.message : e));
  } finally {
    pdfBtns.forEach((b, i) => { b.textContent = labels[i]; b.disabled = false; });
    busy = false;
  }
}
pdfBtns.forEach((b) => b.addEventListener('click', () => downloadPdf(b)));

// hook for QA scripts
window.__brandingPreview = {
  state, render, pages, set: (k, v) => { state[k] = v; render(); },
  renderPage: async (i, px = 1) => (await renderPage(pages()[i], px)).toDataURL('image/png'),
};
