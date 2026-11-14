import {
  Sim, DEFAULTS, WOODS, CHIMNEYS, INSULATION, BOILER,
  fuelLoad, chimneySteady, simulateBurn, litresHeated, houseDemandW,
} from './physics.js';
import { Scene } from './scene.js';
import { PhotoView } from './photo.js';
import { LineChart } from './charts.js';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);
const clone = (o) => JSON.parse(JSON.stringify(o));
const cssVar = (n) => `var(--${n})`;

const cfg = clone(DEFAULTS);
const sim = new Sim(cfg);
const scene = new Scene($('scene'), $('fx'));
const ui = { running: true, speed: 300, view: 'schema' };
const photo = new PhotoView($('photo'), 'assets/boiler-cutaway.png', (a) => (a === 'ignite' ? ignite() : addWood()));

// ---------- helpers ----------
const getPath = (p) => p.split('.').reduce((o, k) => o[k], cfg);
function setPath(p, v) {
  const ks = p.split('.'); let o = cfg;
  while (ks.length > 1) o = o[ks.shift()];
  o[ks[0]] = v;
}
function clock(sec) {
  const m = Math.floor(sec / 60), h = Math.floor(m / 60);
  return h ? `${h} ${t('u.h')} ${String(m % 60).padStart(2, '0')} ${t('u.min')}` : `${m} ${t('u.min')}`;
}
const hoursFmt = (h) => (h >= 48 ? `${t.num(h / 24, 1)} d` : `${t.num(h, 1)} ${t('u.h')}`);

// ---------- controls ----------
const GROUPS = [
  { key: 'fuel', open: true, items: [
    { type: 'chips', path: 'wood', label: 'c.wood', options: Object.keys(WOODS).map((k) => [k, 'wood.' + k]) },
    { type: 'range', path: 'moisture', label: 'c.moisture', min: 8, max: 55, step: 1, unit: '%' },
    { type: 'note', id: 'n-moisture' },
    { type: 'range', path: 'fill', label: 'c.fill', min: 20, max: 100, step: 5, unit: '%' },
    { type: 'note', id: 'n-fuel' },
  ] },
  { key: 'chimney', open: true, items: [
    { type: 'range', path: 'chimney.height', label: 'c.chHeight', min: 3, max: 16, step: 0.5, unit: 'm', d: 1 },
    { type: 'range', path: 'chimney.diameter', label: 'c.chDiameter', min: 100, max: 300, step: 10, unit: 'mm' },
    { type: 'chips', path: 'chimney.type', label: 'c.chType', options: Object.keys(CHIMNEYS).map((k) => [k, 'chType.' + k]) },
    { type: 'toggle', path: 'chimney.regulator', label: 'c.regulator' },
    { type: 'note', id: 'n-chimney' },
  ] },
  { key: 'weather', open: true, items: [
    { type: 'range', path: 'outdoor', label: 'c.outdoor', min: -25, max: 18, step: 1, unit: '°C' },
    { type: 'range', path: 'house.area', label: 'c.area', min: 60, max: 350, step: 10, unit: 'm²' },
    { type: 'chips', path: 'house.insulation', label: 'c.insulation', options: Object.keys(INSULATION).map((k) => [k, 'ins.' + k]) },
    { type: 'range', path: 'house.setpoint', label: 'c.setpoint', min: 17, max: 25, step: 0.5, unit: '°C', d: 1 },
  ] },
  { key: 'heating', open: true, items: [
    { type: 'range', path: 'tank.volume', label: 'c.tankVol', min: 500, max: 4000, step: 100, unit: 'L' },
    { type: 'note', id: 'n-buffer' },
    { type: 'range', path: 'tank.startTemp', label: 'c.tankStart', min: 15, max: 70, step: 1, unit: '°C' },
    { type: 'range', path: 'radiators.count', label: 'c.radCount', min: 0, max: 20, step: 1, unit: '' },
    { type: 'range', path: 'radiators.power', label: 'c.radPower', min: 600, max: 2500, step: 100, unit: 'W' },
    { type: 'range', path: 'floor.area', label: 'c.floorArea', min: 0, max: 200, step: 5, unit: 'm²', zero: 'c.none' },
    { type: 'note', id: 'n-rad' },
    { type: 'toggle', path: 'dhw', label: 'c.dhw' },
  ] },
  { key: 'control', open: false, items: [
    { type: 'toggle', path: 'control.auto', label: 'c.auto' },
    { type: 'range', path: 'control.fan', label: 'c.fan', min: 0, max: 100, step: 5, unit: '%', manual: true },
    { type: 'range', path: 'control.primary', label: 'c.primary', min: 8, max: 40, step: 1, unit: '%', manual: true },
    { type: 'note', id: 'n-manual', text: 'h.manual' },
    { type: 'range', path: 'control.boilerSet', label: 'c.boilerSet', min: 70, max: 90, step: 1, unit: '°C' },
    { type: 'button', id: 'b-clean', label: 'btn.clean' },
  ] },
];

const refreshers = [];
function buildControls() {
  const host = $('controls');
  host.innerHTML = '';
  for (const g of GROUPS) {
    const det = document.createElement('details');
    det.className = 'ctl-group'; det.open = g.open;
    det.innerHTML = `<summary data-i18n="g.${g.key}"></summary><div class="ctl-body"></div>`;
    const body = det.lastChild;
    for (const it of g.items) {
      const div = document.createElement('div');
      div.className = 'ctl';
      if (it.type === 'range') {
        const id = 'c-' + it.path.replace('.', '-');
        div.innerHTML = `<label for="${id}"><span data-i18n="${it.label}"></span><output></output></label><input type="range" id="${id}" min="${it.min}" max="${it.max}" step="${it.step}">`;
        const inp = div.querySelector('input'), out = div.querySelector('output');
        const show = () => {
          const v = getPath(it.path);
          inp.value = v;
          out.textContent = it.zero && v === 0 ? t(it.zero) : `${t.num(v, it.d || 0)}${it.unit ? ' ' + it.unit : ''}`;
          if (it.manual) { inp.disabled = cfg.control.auto; div.classList.toggle('disabled', cfg.control.auto); }
        };
        inp.addEventListener('input', () => { setPath(it.path, +inp.value); onConfig(it.path); });
        refreshers.push(show);
      } else if (it.type === 'chips') {
        div.innerHTML = `<div class="lbl"><span data-i18n="${it.label}"></span></div><div class="chips" role="group">${it.options.map(([k, l]) => `<button type="button" data-v="${k}" data-i18n="${l}"></button>`).join('')}</div>`;
        const btns = [...div.querySelectorAll('button')];
        for (const b of btns) b.addEventListener('click', () => { setPath(it.path, b.dataset.v); onConfig(it.path); });
        refreshers.push(() => btns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === getPath(it.path))));
      } else if (it.type === 'toggle') {
        div.innerHTML = `<label class="switch"><span data-i18n="${it.label}"></span><input type="checkbox" role="switch"></label>`;
        const inp = div.querySelector('input');
        inp.addEventListener('change', () => { setPath(it.path, inp.checked); onConfig(it.path); });
        refreshers.push(() => { inp.checked = getPath(it.path); });
      } else if (it.type === 'note') {
        div.className = 'note'; div.id = it.id;
        if (it.text) div.dataset.i18n = it.text;
      } else if (it.type === 'button') {
        div.innerHTML = `<button type="button" class="btn small" id="${it.id}" data-i18n="${it.label}"></button>`;
      }
      body.appendChild(div);
    }
    host.appendChild(det);
  }
  $('b-clean').addEventListener('click', () => sim.cleanExchanger());
}

function refreshNotes() {
  const M = cfg.moisture;
  const mk = M <= 12 ? ['m.kiln', 'good'] : M <= 20 ? ['m.seasoned', 'good'] : M <= 25 ? ['m.ok', 'warn'] : M <= 35 ? ['m.damp', 'bad'] : ['m.green', 'bad'];
  $('n-moisture').textContent = t(mk[0]); $('n-moisture').className = 'note ' + mk[1];
  const f = fuelLoad(cfg);
  $('n-fuel').textContent = t('h.fuel', { wet: t.num(f.wet, 1), dry: t.num(f.dry, 1), water: t.num(f.water, 1), kwh: t.num(f.kWh), kwhkg: t.num(f.kWhPerKg, 2) })
    + (sim.s.lit ? ' ' + t('h.fuelNext') : '');
  const minV = BOILER.nominalKW * BOILER.bufferLPerKW;
  $('n-buffer').textContent = t('h.buffer', { v: t.num(minV) }) + (sim.s.t > 0 ? '' : '');
  $('n-buffer').className = 'note ' + (cfg.tank.volume < minV ? 'warn' : '');
  const ch = chimneySteady(cfg.chimney, cfg.outdoor);
  $('n-chimney').textContent = t('h.chimney', { d: t.num(ch.draft), te: t.num(ch.Texit), v: t.num(ch.v, 1) });
  $('n-chimney').className = 'note ' + (ch.draft < BOILER.reqDraft[0] ? 'bad' : ch.draft > 30 && !cfg.chimney.regulator ? 'warn' : '');
  const need = houseDemandW(cfg) / 1000;
  $('n-rad').textContent = t('h.rad', { kw: t.num(cfg.radiators.count * cfg.radiators.power / 1000, 1), t: t.num(cfg.outdoor), need: t.num(need, 1) });
}

function refreshControls() {
  for (const r of refreshers) r();
  refreshNotes();
}

let analysisTimer = 0;
function onConfig(path) {
  if (sim.s.t === 0 && !sim.s.lit) { sim.reset(); resetLive(); }
  refreshControls();
  scene.applyConfig(cfg, t);
  clearTimeout(analysisTimer);
  analysisTimer = setTimeout(runAnalysis, path ? 350 : 0);
}

// ---------- KPIs ----------
const KPIS = ['fuelPower', 'toWater', 'eta', 'firebox', 'flue', 'draft', 'lambda', 'boiler', 'tank', 'room', 'house', 'wood', 'dew', 'fan'];
const kEl = {};
function buildKpis() {
  $('kpis').innerHTML = KPIS.map((k) => `<div class="kpi" id="k-${k}"><div class="l" data-i18n="kpi.${k}"></div><div class="v"><span></span><small></small></div><div class="s"></div></div>`).join('');
  for (const k of KPIS) {
    const n = $('k-' + k);
    kEl[k] = { n, v: n.querySelector('.v span'), u: n.querySelector('.v small'), s: n.querySelector('.s') };
  }
}
function kpi(k, v, u, sub = '', cls = '') {
  const e = kEl[k];
  e.v.textContent = v; e.u.textContent = u; e.s.textContent = sub;
  e.n.className = 'kpi ' + cls;
}

function updateUI() {
  const s = sim.s, o = sim.o, n = t.num;
  kpi('fuelPower', n(o.Qfuel / 1000, 1), 'kW', `${n((o.rV + o.rC) * 3600 / (1 - cfg.moisture / 100), 1)} kg/h`);
  kpi('toWater', n(Math.max(o.Qw, 0) / 1000, 1), 'kW', `${t('kpi.avg')} ${n(avgKW(), 1)} kW`);
  kpi('eta', o.eta == null || o.Qfuel < 3000 ? '–' : n(Math.min(o.eta, 0.99) * 100), '%', `${t('bal.unburnt')} ${n(o.ub * 100)} %`, o.ub > 0.12 ? 'warn' : '');
  kpi('firebox', n(s.Tf), '°C', '');
  kpi('flue', n(o.Tfg), '°C', s.lit ? `${t('ser.exit')} ${n(o.Texit)} °C` : '');
  const dCls = !s.lit ? '' : o.draft < 10 ? 'bad' : o.draft > 30 ? 'warn' : 'good';
  kpi('draft', n(o.draft), 'Pa', !s.lit ? '' : t(o.draft < 10 ? 'kpi.low' : o.draft > 30 ? 'kpi.high' : 'kpi.ok'), dCls);
  const lamOk = isFinite(o.lam) && s.lit;
  kpi('lambda', lamOk ? n(Math.min(o.lam, 9.9), 2) : '–', '', lamOk ? `${t('kpi.o2')} ${n(o.o2, 1)} %` : '', lamOk && o.lam < 1.05 ? 'bad' : '');
  kpi('boiler', n(s.Tb), '°C', s.safety ? '⚠ 95 °C' : s.standby ? t('kpi.standby') : o.mbp > 0 ? `↩ ${n(o.Tret)} °C` : '', s.safety ? 'bad' : s.standby ? 'warn' : '');
  kpi('tank', n(o.charge * 100), '%', `${n(o.tankAvg)} °C · ${n(Math.max(o.tankKWh, 0))} kWh`);
  kpi('room', n(s.Troom, 1), '°C', `→ ${n(cfg.house.setpoint, 1)} °C`, s.Troom < cfg.house.setpoint - 1.5 ? 'warn' : '');
  kpi('house', n(o.Qemit / 1000, 1), 'kW', `− ${n(o.Qhouse / 1000, 1)} kW`);
  kpi('wood', n(o.fuelLeft * 100), '%', `${n(o.massLeft, 1)} kg`);
  kpi('dew', s.lit && o.dew > 0 ? n(o.dew) : '–', '°C', o.condensing ? t('kpi.cond') : '', o.condensing ? 'warn' : '');
  kpi('fan', n(s.u * 100), '%', `${n(o.mGas * 3600)} kg/h`);

  // stage
  $('stage-name').textContent = t('stage.' + o.stage);
  $('stage-desc').textContent = t('stageDesc.' + o.stage);
  $('stage-dot').className = 'dot' + (s.lit ? ' live' : '');
  for (const st of ['ignition', 'drying', 'gasification', 'char']) {
    const c = chipEl[st];
    c.n.classList.toggle('active', s.lit && o.stage === st);
    c.v.textContent = n(sim.stageE[st] / 3.6e6, 1);
    c.d.textContent = `${n(sim.stageW[st] / 3.6e6, 1)} kWh ${t('stage.toWater')} · ${clock(sim.stageT[st])}`;
  }

  // transport
  const canLight = !s.lit && s.mV + s.mC > 0.2;
  $('b-ignite').disabled = !canLight;
  $('b-ignite').textContent = t(s.lit ? 'btn.burning' : 'btn.ignite');
  $('b-pause').textContent = t(ui.running ? 'btn.pause' : 'btn.resume');
  $('clock').textContent = clock(s.t);

  updateBalance();
  updateLog();
}

function avgKW() {
  const h = Object.values(sim.stageT).reduce((a, b) => a + b, 0) / 3600;
  return h > 0.02 ? sim.E.water / 3.6e6 / h : 0;
}

const chipEl = {};
function buildChips() {
  $('stage-chips').innerHTML = ['ignition', 'drying', 'gasification', 'char'].map((st) => `<div class="chip" id="chip-${st}"><div class="n" data-i18n="stage.${st}"></div><div class="v"><span>0</span> <small>kWh</small></div><div class="d"></div></div>`).join('');
  for (const st of ['ignition', 'drying', 'gasification', 'char']) {
    const n = $('chip-' + st);
    chipEl[st] = { n, v: n.querySelector('.v span'), d: n.querySelector('.d') };
  }
}

// ---------- balance + log ----------
const BAL = [['useful', 's3'], ['flue', 's2'], ['latent', 's1'], ['unburnt', 's5'], ['jacket', 's4']];
function updateBalance() {
  const E = sim.E, k = 1 / 3.6e6;
  const v = { useful: Math.max(0, E.water - E.jacket) * k, flue: Math.max(0, E.flue) * k, latent: E.latent * k, unburnt: E.unburnt * k, jacket: Math.max(0, E.jacket) * k };
  const sum = Object.values(v).reduce((a, b) => a + b, 0);
  const host = $('balance');
  if (sum < 0.05) { host.innerHTML = `<p class="note">${t('bal.empty')}</p>`; return; }
  host.innerHTML = `<div class="bal-bar">${BAL.map(([key, c]) => `<span style="flex-grow:${Math.max(v[key], 0.0001)};background:${cssVar(c)}" title="${t('bal.' + key)}"></span>`).join('')}</div>
    <div class="bal-legend">${BAL.map(([key, c]) => `<div><span><i style="background:${cssVar(c)}"></i>${t('bal.' + key)}</span><b>${t.num(v[key], 1)} kWh · ${t.num(v[key] / sum * 100)} %</b></div>`).join('')}</div>
    <div class="meters"><div><div class="row"><span>${t('soot')}</span><b>${t.num(sim.s.soot * 100)} %</b></div><div class="meter"><i style="width:${sim.s.soot * 100}%"></i></div></div>
    <div><div class="row"><span>${t('creosote')}</span><b>${t.num(sim.s.creosote * 100)} %</b></div><div class="meter"><i style="width:${sim.s.creosote * 100}%"></i></div></div></div>`;
}

let logSig = '';
function updateLog() {
  const ev = sim.events, sig = ev.length + ':' + (ev[ev.length - 1]?.t ?? '') + t.lang();
  if (sig === logSig) return;
  logSig = sig;
  $('log').innerHTML = ev.slice(-12).reverse().map((e) => `<li><time>${clock(e.t)}</time><span>${t('ev.' + e.key, e.data)}</span></li>`).join('');
}

// ---------- live charts ----------
const hx = (v) => `${t.num(v, 1)} ${t('u.h')}`;
const charts = {
  power: new LineChart($('ch-power'), { xFmt: hx, yFmt: (v, full) => t.num(v, full ? 1 : 0) + (full ? ' kW' : ''), zero: true, yMax: 30, xMax: 1, xMin: 0 }),
  water: new LineChart($('ch-water'), { xFmt: hx, yFmt: (v, full) => t.num(v, full ? 1 : 0) + (full ? ' °C' : '°'), yMin: 10, yMax: 90, xMax: 1, xMin: 0 }),
  gas: new LineChart($('ch-gas'), { xFmt: hx, yFmt: (v, full) => t.num(v) + (full ? ' °C' : '°'), zero: true, yMax: 1200, xMax: 1, xMin: 0 }),
  moisture: new LineChart($('ch-moisture'), { xFmt: (v) => t.num(v, v % 1 ? 1 : 0) + ' %', yFmt: (v, full) => t.num(v) + (full ? ' kWh' : ''), zero: true, height: 230 }),
  chimney: new LineChart($('ch-chimney'), { xFmt: (v) => t.num(v, v % 1 ? 1 : 0) + ' m', yFmt: (v, full) => t.num(v) + (full ? ' Pa' : ''), zero: true, height: 230 }),
};
function updateCharts() {
  const h = sim.hist, col = (k) => h.map((p) => [p.t / 3600, p[k]]);
  charts.power.update([
    { label: t('ser.fuel'), color: cssVar('s2'), pts: col('pf') },
    { label: t('ser.water'), color: cssVar('s1'), pts: col('pw') },
    { label: t('ser.house'), color: cssVar('s3'), pts: col('ph') },
  ]);
  charts.water.update([
    { label: t('ser.boiler'), color: cssVar('s2'), pts: col('tb') },
    { label: t('ser.top'), color: cssVar('s4'), pts: col('tt') },
    { label: t('ser.bottom'), color: cssVar('s1'), pts: col('tbot') },
    { label: t('ser.room'), color: cssVar('s3'), pts: col('tr') },
  ]);
  charts.gas.update([
    { label: t('ser.firebox'), color: cssVar('s2'), pts: col('tf') },
    { label: t('ser.flue'), color: cssVar('s4'), pts: col('tfg') },
    { label: t('ser.exit'), color: cssVar('s1'), pts: col('tex') },
  ]);
}
function resetLive() {
  scene.clearParticles(); photo.clearParticles();
  logSig = '';
  updateCharts();
}

// ---------- analysis ----------
let analysis = null;
function runAnalysis() {
  const sweep = [];
  for (let M = 10; M <= 45; M += 2.5) {
    const c = clone(cfg); c.moisture = M;
    const r = simulateBurn(c);
    sweep.push({ M, useful: Math.max(0, r.water - r.jacket), inWood: fuelLoad(c).kWh, burnt: r.left < 0.3 });
  }
  const r0 = simulateBurn(clone(cfg));
  const heights = [];
  for (let H = 3; H <= 16; H += 0.5) heights.push(H);
  const draft = [-15, 0, 15].map((T) => ({ T, pts: heights.map((H) => [H, chimneySteady({ ...cfg.chimney, height: H }, T).draft]) }));
  analysis = { sweep, r0, useful: Math.max(0, r0.water - r0.jacket), burnt: r0.left < 0.3, draft, load: fuelLoad(cfg) };
  renderAnalysis();
}

function renderAnalysis() {
  if (!analysis) return;
  const a = analysis, n = t.num;
  $('a-moisture-sub').textContent = t('a.moistureSub', { wood: t('wood.' + cfg.wood).toLowerCase() });
  charts.moisture.update([
    { label: t('a.useful'), color: cssVar('s2'), pts: a.sweep.map((p) => [p.M, p.useful]) },
    { label: t('a.inWood'), color: cssVar('s1'), pts: a.sweep.map((p) => [p.M, p.inWood]), dash: true },
  ], { marker: { x: cfg.moisture, label: `${t('a.now')}: ${n(cfg.moisture)} %` } });

  $('a-chimney-sub').textContent = t('a.chimneySub', { d: n(cfg.chimney.diameter), type: t('chType.' + cfg.chimney.type).toLowerCase() });
  const cols = ['s1', 's3', 's2'];
  charts.chimney.update(a.draft.map((d, i) => ({ label: `${n(d.T)} °C ${t('a.outside')}`, color: cssVar(cols[i]), pts: d.pts })), {
    band: { y0: BOILER.reqDraft[0], y1: BOILER.reqDraft[1], label: t('a.band') },
    marker: { x: cfg.chimney.height, label: `${n(cfg.chimney.height, 1)} m` },
  });

  const dT = a.useful * 3.6e6 / (cfg.tank.volume * 4186);
  $('a-water-sub').textContent = a.burnt ? t('a.waterSub', { kwh: n(a.useful), v: n(cfg.tank.volume), dt: n(dT) }) : t('ev.died');
  $('tb-water').innerHTML = `<table><thead><tr><th>${t('a.startT')}</th><th>${t('a.litres')}</th><th>${t('a.tanks')}</th></tr></thead><tbody>${
    [10, 20, 30, 40, 50, 60].map((T0) => {
      const L = litresHeated(a.useful, T0, 80);
      const near = Math.abs(T0 - cfg.tank.startTemp) <= 5 && T0 === Math.round(cfg.tank.startTemp / 10) * 10;
      return `<tr class="${near ? 'now' : ''}"><td>${T0} °C</td><td>${n(Math.round(L / 10) * 10)} L</td><td>${n(L / cfg.tank.volume, 1)} ×</td></tr>`;
    }).join('')}</tbody></table>`;

  $('a-outdoor-sub').textContent = t('a.outdoorSub', { area: n(cfg.house.area), ins: t('ins.' + cfg.house.insulation).toLowerCase(), set: n(cfg.house.setpoint, 1) });
  const temps = [-20, -15, -10, -5, 0, 5, 10];
  const nearest = temps.reduce((b, T) => (Math.abs(T - cfg.outdoor) < Math.abs(b - cfg.outdoor) ? T : b), temps[0]);
  const rows = temps.map((T) => {
    const kw = houseDemandW(cfg, T) / 1000;
    const h = kw > 0.05 && a.useful > 1 ? a.useful / kw : null;
    return { T, kw, h };
  });
  const hMax = Math.max(...rows.map((r) => r.h || 0), 1);
  $('tb-outdoor').innerHTML = `<table><thead><tr><th>${t('a.tout')}</th><th>${t('a.demand')}</th><th>${t('a.hours')}</th><th>${t('a.loads')}</th><th>${t('a.kgday')}</th></tr></thead><tbody>${
    rows.map((r) => `<tr class="${r.T === nearest ? 'now' : ''}"><td>${n(r.T)} °C</td><td>${n(r.kw, 1)} kW</td><td>${r.h ? `<span class="bar" style="width:${Math.max(3, r.h / hMax * 70)}px"></span>${hoursFmt(r.h)}` : '–'}</td><td>${r.h ? n(24 / r.h, 1) : '–'}</td><td>${r.h ? n(24 / r.h * a.load.wet) + ' kg' : '–'}</td></tr>`).join('')}</tbody></table>`;
}

// ---------- components ----------
const COMPS = ['boiler', 'lambda', 'chimney', 'regulator', 'return', 'buffer', 'vessel', 'safety', 'mixing', 'rad', 'floor', 'dhw'];
function renderComponents() {
  $('components').innerHTML = COMPS.map((k, i) => `<div class="comp"><b><span class="num">${i + 1}</span>${t('comp.' + k)}</b><p>${t('comp.' + k + 'D', { v: t.num(sim.o.vessel) })}</p></div>`).join('');
}

// ---------- actions ----------
function ignite() { if (sim.ignite()) { ui.running = true; refreshNotes(); } }
function addWood() {
  sim.openDoor(120);
  const kg = sim.load();
  sim.event(kg > 0 ? 'added' : 'full', { kg: t.num(kg / (1 - cfg.moisture / 100), 1) });
}
function reset() { sim.reset(); resetLive(); refreshControls(); scene.applyConfig(cfg, t); }

function setView(v) {
  ui.view = v === 'photo' ? 'photo' : 'schema';
  $('view-schema').hidden = ui.view !== 'schema';
  $('view-photo').hidden = ui.view !== 'photo';
  for (const b of $('view').children) b.setAttribute('aria-pressed', b.dataset.view === ui.view);
  try { localStorage.setItem('view', ui.view); } catch { /* storage unavailable */ }
  scene.resize(); photo.resize();
}

function setLang(l) {
  t.setLang(l); photo.setT(t);
  document.title = t('app.title');
  for (const b of $('lang').children) b.setAttribute('aria-pressed', b.dataset.lang === l);
  refreshControls(); scene.applyConfig(cfg, t); scene.txtT = 0;
  renderComponents(); renderAnalysis(); updateCharts(); logSig = ''; updateUI();
}

function init() {
  buildControls(); buildKpis(); buildChips();
  $('b-ignite').addEventListener('click', ignite);
  $('b-add').addEventListener('click', addWood);
  $('b-pause').addEventListener('click', () => { ui.running = !ui.running; });
  $('b-reset').addEventListener('click', reset);
  $('scene').querySelector('#hit-bot').addEventListener('click', ignite);
  $('scene').querySelector('#hit-top').addEventListener('click', addWood);
  for (const b of $('speed').children) {
    b.addEventListener('click', () => { ui.speed = +b.dataset.speed; for (const x of $('speed').children) x.setAttribute('aria-pressed', x === b); });
    b.setAttribute('aria-pressed', +b.dataset.speed === ui.speed);
  }
  for (const b of $('lang').children) b.addEventListener('click', () => setLang(b.dataset.lang));
  for (const b of $('view').children) b.addEventListener('click', () => setView(b.dataset.view));
  new ResizeObserver(() => photo.resize()).observe($('photo'));
  $('theme').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
  });
  new ResizeObserver(() => { scene.resize(); updateCharts(); renderAnalysis(); }).observe($('scene'));

  setLang(t.lang());
  onConfig();
  const q = new URLSearchParams(location.search);
  let v0 = q.get('view');
  if (!v0) { try { v0 = localStorage.getItem('view'); } catch { /* storage unavailable */ } }
  setView(v0);
  if (q.has('autostart')) {
    ui.speed = +q.get('speed') || ui.speed;
    for (const x of $('speed').children) x.setAttribute('aria-pressed', +x.dataset.speed === ui.speed);
    ignite();
    if (q.has('warp')) sim.advance(Math.min(48, +q.get('warp') || 0) * 3600);
    // test aid: pre-run animation frames so a still screenshot shows particles mid-flight
    for (let i = Math.min(2000, +q.get('frames') || 0); i > 0; i--) (ui.view === 'photo' ? photo : scene).frame(sim, 1 / 60, true);
  }

  let last = performance.now(), uiAcc = 1, chAcc = 1;
  const tick = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const started = sim.s.lit || sim.s.t > 0;
    if (ui.running && started) sim.advance(dt * ui.speed);
    if (ui.view === 'photo') photo.frame(sim, dt, ui.running); else scene.frame(sim, dt, ui.running);
    uiAcc += dt; chAcc += dt;
    if (uiAcc > 0.2) { uiAcc = 0; updateUI(); }
    if (chAcc > 0.6) { chAcc = 0; if (ui.running && started) updateCharts(); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

init();
