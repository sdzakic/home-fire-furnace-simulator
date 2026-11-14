// Photo view: the boiler cutaway picture with the simulation drawn on top of it.
// All coordinates are in the picture's own pixel space (660 × 500).
import { sprite } from './scene.js';

const W = 660, H = 500;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Click zones (x, y, w, h)
const ZONE_ADD = [108, 100, 115, 150];     // upper loading door
const ZONE_FIRE = [296, 250, 160, 170];    // logs, nozzle and combustion chamber

/** Makes the white studio background transparent so the picture sits on any theme. */
function knockOutBackground(img) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, W, H);
  let data;
  try { data = g.getImageData(0, 0, W, H); } catch { return c; }
  const d = data.data, seen = new Uint8Array(W * H), stack = [];
  const white = (i) => d[i * 4] > 238 && d[i * 4 + 1] > 238 && d[i * 4 + 2] > 238;
  const push = (i) => { if (!seen[i] && white(i)) { seen[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop(), x = i % W;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (i >= W) push(i - W);
    if (i < W * (H - 1)) push(i + W);
  }
  for (let i = 0; i < W * H; i++) {
    if (seen[i]) { d[i * 4 + 3] = 0; continue; }
    const x = i % W;
    const edge = (x > 0 && seen[i - 1]) || (x < W - 1 && seen[i + 1]) || (i >= W && seen[i - W]) || (i < W * (H - 1) && seen[i + W]);
    if (edge) {
      const m = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      d[i * 4 + 3] = Math.round(255 * clamp((255 - m) / 70, 0.15, 1));
    }
  }
  g.putImageData(data, 0, 0);
  return c;
}

export class PhotoView {
  /** onAction('ignite' | 'add') is called when the picture is clicked. */
  constructor(canvas, src, onAction) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.parts = []; this.smoke = []; this.air = [];
    this.acc = 0; this.accAir = 0; this.base = null; this.k = 1;
    this.t = (k) => k;
    this.sp = {
      hot: sprite('255,244,200'), yel: sprite('255,196,80'), org: sprite('255,130,36'), red: sprite('214,58,24'),
      light: sprite('200,200,200'), dark: sprite('70,60,54'), steam: sprite('236,240,246'),
      shade: sprite('14,11,10'), air: sprite('90,190,255'),
    };
    const img = new Image();
    img.onload = () => { this.base = knockOutBackground(img); };
    img.src = src;

    const zone = (ev) => {
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
      const inside = (z) => x >= z[0] && x <= z[0] + z[2] && y >= z[1] && y <= z[1] + z[3];
      return inside(ZONE_FIRE) ? 'ignite' : inside(ZONE_ADD) ? 'add' : null;
    };
    canvas.addEventListener('click', (ev) => { const z = zone(ev); if (z) onAction(z); });
    canvas.addEventListener('mousemove', (ev) => { canvas.style.cursor = zone(ev) ? 'pointer' : ''; });
    this.resize();
  }

  setT(t) { this.t = t; }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.width * dpr * H / W);
    this.k = this.canvas.width / W;
    this.fs = Math.min(1.7, Math.max(1, 520 / r.width));   // keep labels readable on phones
  }

  clearParticles() { this.parts = []; this.smoke = []; this.air = []; }

  frame(sim, dt, running) {
    const s = sim.s, o = sim.o, ctx = this.ctx, sp = this.sp, now = performance.now();
    if (this.canvas.width < 4) this.resize();
    const f = clamp(dt * 60, 0, 3) * (running ? 1 : 0);
    const power = clamp(o.Qfuel / 27000, 0, 1.3);
    const heat = clamp((s.Tf - 150) / 850, 0, 1);

    // ---- spawn ----
    if (running && s.lit) {
      this.acc += power * 1.5 * f + 0.03 * f;
      while (this.acc >= 1) {
        this.acc -= 1;
        const tx = Math.random() < 0.5 ? 519 : 547;
        this.parts.push({
          x: 322 + Math.random() * 118, y: 331 + Math.random() * 9, i: 0, j: Math.random(),
          wp: [[384, 346], [385 + (Math.random() - 0.5) * 8, 368], [372 + Math.random() * 26, 390], [338, 401], [296, 407],
            [300, 430], [356, 438], [428, 431], [470, 402], [tx, 372], [tx, 190], [531, 158], [584, 177], [628, 174]],
        });
      }
      // combustion air: primary through the door flaps onto the charge, secondary into the nozzle
      this.accAir += (0.25 + 0.9 * clamp(s.u ?? power, 0, 1)) * f * 0.5;
      while (this.accAir >= 1) {
        this.accAir -= 1;
        this.air.push(Math.random() < 0.6
          ? { x: 232, y: 262 + Math.random() * 30, i: 0, wp: [[300, 300], [352 + Math.random() * 60, 318], [384, 338]] }
          : { x: 250, y: 395, i: 0, wp: [[300, 388], [352, 372], [380, 362]] });
      }
      if (o.doorOpen && Math.random() < 0.5 * f) {
        this.smoke.push({ x: 232, y: 150 + Math.random() * 70, vx: -0.3 - Math.random() * 0.4, vy: -0.5 - Math.random() * 0.4, a: 0.6, r: 7, door: true });
      }
    }

    // ---- move ----
    const vTube = 1.1 + 1.2 * clamp(o.vCh / 2, 0, 1);
    for (const p of this.parts) {
      const w = p.wp[p.i], dx = w[0] - p.x, dy = w[1] - p.y, d = Math.hypot(dx, dy) || 1;
      const v = (p.i < 3 ? 2.0 : p.i < 9 ? 1.7 : vTube) * f, jit = p.i < 5 ? 1.2 : 0.35;
      p.x += dx / d * v + (Math.random() - 0.5) * jit * f;
      p.y += dy / d * v + (Math.random() - 0.5) * jit * f;
      if (d < v + 3 && ++p.i >= p.wp.length) {
        p.dead = true;
        this.smoke.push({ x: p.x, y: p.y, vx: 0.12 + Math.random() * 0.2, vy: -0.45 - Math.random() * 0.3, a: 1, r: 6 });
      }
    }
    this.parts = this.parts.filter((p) => !p.dead);
    if (this.parts.length > 1200) this.parts.splice(0, this.parts.length - 1200);
    for (const p of this.air) {
      const w = p.wp[p.i], dx = w[0] - p.x, dy = w[1] - p.y, d = Math.hypot(dx, dy) || 1, v = 1.5 * f;
      p.x += dx / d * v; p.y += dy / d * v + (Math.random() - 0.5) * 0.3 * f;
      if (d < v + 2 && ++p.i >= p.wp.length) p.dead = true;
    }
    this.air = this.air.filter((p) => !p.dead);
    for (const m of this.smoke) {
      m.x += m.vx * f; m.y += m.vy * f; m.vy -= 0.004 * f; m.r += 0.12 * f; m.a -= (m.door ? 0.014 : 0.013) * f;
    }
    this.smoke = this.smoke.filter((m) => m.a > 0);

    // ---- draw ----
    ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (this.base) ctx.drawImage(this.base, 0, 0, W, H);
    const draw = (img, x, y, rx, a, ry = rx) => { ctx.globalAlpha = clamp(a, 0, 1); ctx.drawImage(img, x - rx, y - ry, 2 * rx, 2 * ry); };

    // The picture has a fire painted in; shade it while the boiler is cold.
    const cold = 1 - clamp(heat * 1.6, 0, 1);
    if (cold > 0.01) {
      draw(sp.shade, 386, 386, 44, 0.9 * cold, 30); draw(sp.shade, 386, 386, 30, 0.8 * cold, 20);
      draw(sp.shade, 303, 405, 26, 0.9 * cold, 20); draw(sp.shade, 303, 405, 16, 0.7 * cold);
      draw(sp.shade, 380, 338, 78, 0.85 * cold, 13);
    }

    const dirty = clamp(o.ub * 2.2, 0, 1), wet = clamp(o.wfrac * 2.5, 0, 1);
    const smokeImg = dirty > 0.35 ? sp.dark : wet > 0.4 ? sp.steam : sp.light;
    const smokeA = clamp(0.22 + dirty * 0.5 + wet * 0.25, 0.2, 0.8);
    for (const m of this.smoke) draw(m.door ? sp.dark : smokeImg, m.x, m.y, m.r, m.a * (m.door ? 0.55 : smokeA));
    for (const p of this.parts) if (p.i >= 10) draw(smokeImg, p.x, p.y, 5.5, smokeA * 0.75);

    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.air) draw(sp.air, p.x, p.y, 3.2, 0.55);
    if (heat > 0.01) {
      const fl = 0.85 + 0.15 * Math.sin(now / 90) * Math.sin(now / 37);
      const left = clamp(o.fuelLeft * 6, 0.25, 1);
      draw(sp.org, 380, 336, 80, 0.55 * heat * fl * left, 16);         // ember bed
      draw(sp.red, 378, 300, 70, 0.22 * heat * left, 40);              // glow on the charge
      draw(sp.yel, 385, 384, 34, 0.5 * heat * fl * clamp(power * 2, 0.15, 1), 22);
      draw(sp.red, 360, 420, 120, 0.3 * heat, 26);                     // hot refractory below
      draw(sp.org, 303, 405, 20, 0.45 * heat * fl * clamp(power * 2, 0, 1));
    }
    for (const p of this.parts) {
      const j = p.j;
      if (p.i === 0) draw(sp.org, p.x, p.y, 4 + 4 * j, 0.4);
      else if (p.i <= 2) { draw(sp.yel, p.x, p.y, 8 + 5 * j, 0.34); draw(sp.hot, p.x, p.y, 3 + 2 * j, 0.3); }
      else if (p.i <= 4) draw(sp.org, p.x, p.y, 8 + 5 * j, 0.32);
      else if (p.i <= 8) draw(p.i <= 6 ? sp.org : sp.red, p.x, p.y, 7 + 3 * j, 0.24);
      else if (p.i === 9) draw(sp.red, p.x, p.y, 5, 0.25);
      else if (p.i === 10) draw(sp.red, p.x, p.y, 4, 0.2 * clamp((p.y - 230) / 140, 0, 1));
    }
    ctx.globalCompositeOperation = 'source-over';

    // "click to light" hint
    if (!s.lit && s.t === 0) {
      const ph = (now / 1800) % 1;
      ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2;
      for (const q of [ph, (ph + 0.5) % 1]) {
        ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(385, 384, 8 + q * 26, 0, 6.3); ctx.stroke();
      }
      this.tag(385, 384 + 48, this.t('sc.hitBot'), '#ffb347');
    }

    // live readings
    const n = (x, d = 0) => this.t.num(x, d);
    this.tag(378, 232, `${this.t('ser.firebox')}  ${n(s.Tf)} °C`, s.Tf > 300 ? '#ffb347' : null);
    this.tag(330, 40, `${this.t('ser.boiler')}  ${n(s.Tb)} °C`);
    this.tag(588, 222, `${this.t('ser.flue')}  ${o.mGas > 0.0005 ? n(o.Tfg) + ' °C' : '–'}`, null, 'end', 652);
    this.tag(120, 470, `${this.t('stageShort.' + o.stage)} · ${n(o.Qfuel / 1000, 1)} kW`, s.lit ? '#ffb347' : null, 'start');
    ctx.globalAlpha = 1;
  }

  /** Small pill label; x is the centre unless align is 'start'/'end' (then x/edge is that side). */
  tag(x, y, text, color, align = 'center', edge) {
    const ctx = this.ctx;
    const fs = this.fs || 1;
    ctx.font = `600 ${11.5 * fs}px system-ui, -apple-system, sans-serif`;
    const w = ctx.measureText(text).width + 14, h = 20 * fs;
    let x0 = align === 'center' ? x - w / 2 : align === 'start' ? x : (edge ?? x) - w;
    x0 = clamp(x0, 4, W - w - 4);
    ctx.globalAlpha = 0.86; ctx.fillStyle = '#101214';
    ctx.beginPath(); ctx.roundRect(x0, y - h / 2, w, h, 6); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = color || '#f2f3f5';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x0 + 7, y + 0.5);
  }
}
