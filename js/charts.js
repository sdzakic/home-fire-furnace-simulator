// Small dependency-free SVG line chart with crosshair tooltip.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function niceTicks(min, max, n = 5) {
  if (!(max > min)) max = min + 1;
  const raw = (max - min) / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || raw;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(+v.toFixed(10));
  return out;
}

export class LineChart {
  /** opts: { xFmt, yFmt, yMin, yMax, band:{y0,y1,label}, height } */
  constructor(host, opts = {}) {
    this.host = host; this.o = opts;
    host.classList.add('chart');
    host.innerHTML = '<div class="legend"></div><div class="plot"><svg role="img"></svg><div class="tip" hidden></div></div>';
    this.svg = host.querySelector('svg'); this.tip = host.querySelector('.tip'); this.legend = host.querySelector('.legend');
    this.svg.addEventListener('pointermove', (e) => this.hover(e));
    this.svg.addEventListener('pointerleave', () => { this.tip.hidden = true; this.cross && this.cross.setAttribute('opacity', 0); });
  }

  /** series: [{label, color, pts:[[x,y],...], dash}]  marker: {x, label} */
  update(series, extra = {}) {
    this.series = series;
    const o = { ...this.o, ...extra };
    const Wd = Math.max(280, this.host.clientWidth || 600), Hd = o.height || 200;
    const m = { l: 44, r: 14, t: 10, b: 24 };
    let x0 = Infinity, x1 = -Infinity, y0 = o.yMin ?? Infinity, y1 = o.yMax ?? -Infinity;
    for (const s of series) for (const [x, y] of s.pts) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (!isFinite(x0)) { x0 = 0; x1 = 1; }
    if (o.xMin != null) x0 = o.xMin; if (o.xMax != null) x1 = Math.max(x1, o.xMax);
    if (!isFinite(y0)) y0 = 0; if (!isFinite(y1)) y1 = 1;
    if (o.band) { y0 = Math.min(y0, o.band.y0); y1 = Math.max(y1, o.band.y1); }
    if (o.zero) y0 = Math.min(0, y0);
    const yt = niceTicks(y0, y1 + (y1 - y0) * 0.06 || 1, 4);
    y0 = Math.min(y0, yt[0]); y1 = Math.max(y1, yt[yt.length - 1]);
    if (x1 <= x0) x1 = x0 + 1;
    const X = (x) => m.l + (x - x0) / (x1 - x0) * (Wd - m.l - m.r);
    const Y = (y) => Hd - m.b - (y - y0) / (y1 - y0) * (Hd - m.t - m.b);
    this.sc = { X, x0, x1, m, Wd, Hd, Y };
    const xf = o.xFmt || ((v) => v), yf = o.yFmt || ((v) => v);
    let g = '';
    for (const v of yt) g += `<line x1="${m.l}" x2="${Wd - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" class="ax">${esc(yf(v))}</text>`;
    for (const v of niceTicks(x0, x1, Math.max(3, Math.floor(Wd / 110)))) g += `<text x="${X(v)}" y="${Hd - 6}" text-anchor="middle" class="ax">${esc(xf(v))}</text>`;
    if (o.band) g += `<rect x="${m.l}" y="${Y(o.band.y1)}" width="${Wd - m.l - m.r}" height="${Y(o.band.y0) - Y(o.band.y1)}" class="band"/><text x="${Wd - m.r - 4}" y="${Y(o.band.y1) + 12}" text-anchor="end" class="ax">${esc(o.band.label)}</text>`;
    g += `<line x1="${m.l}" x2="${Wd - m.r}" y1="${Hd - m.b}" y2="${Hd - m.b}" class="axis"/>`;
    for (const s of series) {
      if (!s.pts.length) continue;
      const d = s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join('');
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    }
    if (o.marker && o.marker.x >= x0 && o.marker.x <= x1) g += `<line x1="${X(o.marker.x)}" x2="${X(o.marker.x)}" y1="${m.t}" y2="${Hd - m.b}" class="marker"/><text x="${X(o.marker.x) + (X(o.marker.x) > Wd - 90 ? -6 : 6)}" y="${m.t + 10}" text-anchor="${X(o.marker.x) > Wd - 90 ? 'end' : 'start'}" class="ax ax-strong">${esc(o.marker.label)}</text>`;
    g += `<line class="cross" y1="${m.t}" y2="${Hd - m.b}" opacity="0"/>`;
    this.svg.setAttribute('viewBox', `0 0 ${Wd} ${Hd}`);
    this.svg.style.height = Hd + 'px';
    this.svg.innerHTML = g;
    this.cross = this.svg.querySelector('.cross');
    this.fmt = { xf, yf };
    this.legend.innerHTML = series.length > 1 ? series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('') : '';
  }

  hover(e) {
    if (!this.sc || !this.series?.some((s) => s.pts.length)) return;
    const r = this.svg.getBoundingClientRect(), { X, x0, x1, m, Wd } = this.sc;
    const px = (e.clientX - r.left) / r.width * Wd;
    const xv = x0 + (px - m.l) / (Wd - m.l - m.r) * (x1 - x0);
    let rows = '', xs = null;
    for (const s of this.series) {
      if (!s.pts.length) continue;
      let best = s.pts[0];
      for (const p of s.pts) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p;
      xs = best[0];
      rows += `<div><i style="background:${s.color}"></i>${esc(s.label)}<b>${esc(this.fmt.yf(best[1], true))}</b></div>`;
    }
    if (xs == null) return;
    this.cross.setAttribute('x1', X(xs)); this.cross.setAttribute('x2', X(xs)); this.cross.setAttribute('opacity', 1);
    this.tip.innerHTML = `<div class="tip-h">${esc(this.fmt.xf(xs, true))}</div>${rows}`;
    this.tip.hidden = false;
    const left = X(xs) / Wd * r.width;
    this.tip.style.left = Math.min(Math.max(left + 12, 0), r.width - this.tip.offsetWidth - 4) + 'px';
    if (left + 12 + this.tip.offsetWidth > r.width) this.tip.style.left = Math.max(0, left - this.tip.offsetWidth - 12) + 'px';
  }
}
