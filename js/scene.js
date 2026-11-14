// Animated cutaway scene: SVG structure + canvas particle effects.
// All geometry is expressed in the SVG viewBox (1200 × 680).

const W = 1200, H = 680, GROUND = 600;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function ramp(stops, v) {
  if (v <= stops[0][0]) return `rgb(${stops[0][1].join(',')})`;
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (v - a) / (b - a);
      return `rgb(${ca.map((c, k) => Math.round(lerp(c, cb[k], t))).join(',')})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`;
}
const WATER = [[8, [38, 92, 200]], [28, [52, 150, 200]], [45, [222, 178, 70]], [65, [236, 122, 44]], [92, [222, 52, 40]]];
const GAS = [[10, [52, 54, 60]], [120, [104, 70, 62]], [300, [176, 78, 44]], [700, [236, 132, 48]], [1100, [255, 206, 120]]];
export const waterColor = (T) => ramp(WATER, T);
const gasColor = (T) => ramp(GAS, T);

const WOOD_TINT = {
  beech: ['#c9a27a', '#8a6646'], oak: ['#b08958', '#6e5234'], hornbeam: ['#cfc0a2', '#857a66'],
  ash: ['#d8c49c', '#8c7a5a'], locust: ['#c2a85a', '#6b5a2c'], birch: ['#ead9b8', '#d9d4c8'],
  spruce: ['#e3c88e', '#9a7446'], poplar: ['#e2d6b4', '#9c9478'],
};

const PIPES = {
  flowA: 'M440,300 V270 H500', flowB: 'M500,270 H660 V320', bypass: 'M500,270 V575',
  ret: 'M610,575 H470',
  radS: 'M710,340 H850 V572 H1160', radR: 'M1160,590 H760 V560 H710',
  flS: 'M710,365 H800 V608 H1170', flR: 'M1170,618 H780 V580 H710',
  dhwS: 'M710,400 H735', dhwR: 'M735,460 H710',
};

const pump = (id, x, y) => `<g id="${id}" transform="translate(${x},${y})"><circle r="10" class="dev"/><path d="M-4,-5 L6,0 L-4,5Z" class="dev-ic"/></g>`;
const valve = (x, y, rot = 0) => `<g transform="translate(${x},${y}) rotate(${rot})"><path d="M-9,-6 L0,0 L-9,6Z M9,-6 L0,0 L9,6Z" class="dev"/><circle r="3" class="dev-ic"/></g>`;

function logsMarkup() {
  let out = '', n = 0;
  for (let row = 0; row < 5; row++) {
    const cnt = row % 2 ? 4 : 5;
    for (let i = 0; i < cnt; i++) {
      const x = (row % 2 ? 340 : 327) + i * 26.5, y = 438 - row * 23;
      out += `<g class="log" data-i="${n++}" transform="translate(${x},${y})"><circle r="12.5" class="log-bark"/><circle r="10.5" class="log-wood"/><circle r="6" class="log-ring"/><circle r="2.5" class="log-ring"/><circle r="12.5" class="log-char" opacity="0"/></g>`;
    }
  }
  return out;
}

function radiatorsMarkup() {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const x = 880 + i * 54;
    let fins = '';
    for (let k = 0; k < 6; k++) fins += `<rect x="${x + 3 + k * 6.6}" y="510" width="4.4" height="52" rx="2.2" class="rad-fin"/>`;
    out += `<g class="rad" data-i="${i}"><rect x="${x}" y="506" width="44" height="60" rx="5" class="rad-body"/>${fins}<path d="M${x + 6},566 V572 M${x + 38},566 V590" class="rad-leg"/></g>`;
  }
  return out;
}

export function buildScene(svg) {
  let pipes = '';
  for (const [k, d] of Object.entries(PIPES)) {
    const thin = k === 'bypass' || k.startsWith('dhw');
    pipes += `<g id="p-${k}"><path d="${d}" class="pipe-case" stroke-width="${thin ? 7 : 9}"/><path d="${d}" class="pipe" stroke-width="${thin ? 4 : 6}"/><path d="${d}" class="pipe-flow"/></g>`;
  }
  let layers = '';
  for (let i = 0; i < 10; i++) layers += `<rect class="tank-layer" x="610" y="${320 + i * 27}" width="100" height="27.5"/>`;
  let tubes = '';
  for (const x of [263, 277, 291]) tubes += `<rect x="${x - 5}" y="336" width="10" height="226" rx="2" class="gas-void hx-tube"/><path d="M${x - 3},350 ${Array.from({ length: 14 }, (_, i) => `l${i % 2 ? -6 : 6},14`).join(' ')}" class="turb"/>`;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
<defs>
  <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sky-a"/><stop offset="1" class="sky-b"/></linearGradient>
  <linearGradient id="g-ch" x1="0" y1="1" x2="0" y2="0"><stop id="ch-s0" offset="0" stop-color="#444"/><stop id="ch-s1" offset="1" stop-color="#333"/></linearGradient>
  <linearGradient id="g-floor" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8a3c" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a3c" stop-opacity="0"/></linearGradient>
  <radialGradient id="g-room" cx=".5" cy="1" r=".9"><stop offset="0" stop-color="#ffb060" stop-opacity=".55"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
  <clipPath id="c-tank"><rect x="610" y="320" width="100" height="270" rx="20"/></clipPath>
  <pattern id="p-brick" width="22" height="12" patternUnits="userSpaceOnUse"><rect width="22" height="12" class="brick-bg"/><path d="M0,0 H22 M0,6 H22 M11,0 V6 M0,6 V12 M22,6 V12" class="brick-ln"/></pattern>
</defs>
<rect width="${W}" height="${GROUND}" fill="url(#g-sky)"/>
<g class="stars"><circle cx="90" cy="70" r="26" class="moon"/><circle cx="240" cy="60" r="1.6"/><circle cx="420" cy="110" r="1.2"/><circle cx="560" cy="50" r="1.5"/><circle cx="700" cy="150" r="1.1"/><circle cx="330" cy="170" r="1.1"/><circle cx="640" cy="95" r="1.3"/></g>
<path d="M30,600 l26,-70 l26,70z M40,552 l16,-46 l16,46z" class="tree"/>
<rect y="${GROUND}" width="${W}" height="80" class="soil"/>
<rect id="snow-cover" y="${GROUND - 4}" width="178" height="8" rx="4" class="snow" opacity="0"/>

<!-- house -->
<path d="M796,252 L1000,118 L1204,252Z" class="roof"/>
<rect x="172" y="238" width="652" height="14" class="roof"/>
<rect x="180" y="250" width="640" height="350" class="cellar"/>
<rect x="820" y="250" width="360" height="350" class="room"/>
<rect id="room-tint" x="820" y="250" width="360" height="350" fill="url(#g-room)" opacity="0"/>
<rect id="floor-glow" x="826" y="556" width="348" height="44" fill="url(#g-floor)" opacity="0"/>
<rect x="820" y="596" width="360" height="30" class="slab"/>
<path d="M180,250 V600 M820,250 V600 M1180,250 V626" class="wall"/>
<rect x="1096" y="296" width="62" height="84" rx="3" class="window"/><path d="M1127,296 V380 M1096,338 H1158" class="window-bar"/>
<g transform="translate(980,300)"><rect width="76" height="50" rx="8" class="thermo"/><text id="t-room" x="38" y="27" class="tx tx-big" text-anchor="middle">21.0°</text><text x="38" y="42" class="tx tx-dim" text-anchor="middle" data-i18n="sc.room">room</text></g>

<!-- chimney -->
<rect id="ch-outer" x="128" y="250" width="44" height="350" fill="url(#p-brick)" class="ch-outer"/>
<rect id="ch-inner" x="140" y="250" width="20" height="92" fill="url(#g-ch)"/>
<rect id="ch-cap" x="122" y="244" width="56" height="8" rx="2" class="ch-cap"/>
<g id="regulator" transform="translate(172,372)"><rect x="0" y="-9" width="16" height="18" rx="2" class="dev"/><path id="reg-flap" d="M3,-6 L13,6" class="dev-ic2"/></g>
<rect x="160" y="318" width="92" height="24" class="steel"/>
<rect id="flue-in" x="160" y="322" width="92" height="16" fill="#444"/>
<g transform="translate(206,330)"><circle r="17" class="dev"/><g id="fan"><path d="M0,-2 C6,-14 14,-10 11,-3Z M2,1 C14,6 9,14 3,11Z M-2,1 C-9,14 -15,7 -11,2Z M-1,-2 C-13,-6 -9,-14 -3,-11Z" class="dev-ic"/></g><circle r="2.5" class="dev"/></g>

<!-- boiler -->
<rect x="236" y="588" width="16" height="12" class="steel"/><rect x="448" y="588" width="16" height="12" class="steel"/>
<rect x="230" y="296" width="240" height="296" rx="8" class="casing"/>
<rect class="jacket" x="238" y="304" width="224" height="280" rx="5"/>
<rect x="250" y="318" width="200" height="258" rx="3" class="gas-void"/>
<rect class="jacket" x="250" y="318" width="62" height="258"/>
<rect x="250" y="318" width="54" height="18" class="gas-void"/><rect x="250" y="560" width="62" height="16" class="gas-void"/>
${tubes}
<rect x="312" y="318" width="138" height="136" class="load-void"/>
<rect x="312" y="454" width="138" height="18" class="refractory"/><rect id="nozzle" x="371" y="454" width="16" height="18" class="gas-void"/>
<rect x="312" y="472" width="138" height="104" class="gas-void"/>
<path d="M318,472 V560 Q318,572 334,572 H428 Q444,572 444,560 V472" class="refr-line"/>
<g id="logs">${logsMarkup()}</g>
<rect id="door-top" x="450" y="322" width="13" height="128" rx="3" class="door"/><rect x="453" y="372" width="7" height="28" rx="2" class="door-handle"/>
<rect id="door-bot" x="450" y="476" width="13" height="98" rx="3" class="door"/><circle cx="456.5" cy="525" r="4" class="door-glass"/>
<rect x="238" y="592" width="224" height="0" />
<rect x="296" y="276" width="126" height="24" rx="4" class="panel"/>
<text id="t-boiler" x="304" y="293" class="tx tx-lcd">--°C</text><text id="t-stage" x="415" y="293" class="tx tx-lcd-s" text-anchor="end"></text>
<path d="M270,296 V282" class="pipe-thin"/><path d="M262,282 h16 l-8,-10z" class="dev"/><text x="270" y="266" class="tx tx-dim" text-anchor="middle" data-i18n="sc.safety">SV</text>
<text id="t-fire" x="440" y="566" class="tx tx-halo" text-anchor="end"></text>
<rect id="hit-top" x="312" y="318" width="155" height="136" class="hit"><title data-i18n="sc.hitTop">Add wood</title></rect>
<rect id="hit-bot" x="312" y="472" width="155" height="104" class="hit"><title data-i18n="sc.hitBot">Ignite</title></rect>
<g id="ignite-hint"><circle cx="379" cy="524" r="20" class="pulse"/><circle cx="379" cy="524" r="20" class="pulse p2"/><path d="M379,512 c7,8 9,13 4,19 c-1,-5 -4,-6 -4,-10 c-4,5 -7,9 -3,15 c-9,-4 -9,-14 3,-24z" class="pulse-ic"/></g>

<!-- hydraulics -->
${pipes}
${valve(500, 575)}${pump('pm-boiler', 548, 575)}
<path d="M580,575 V548" class="pipe-thin"/><ellipse cx="580" cy="526" rx="15" ry="22" class="vessel"/><text id="t-press" x="580" y="496" class="tx tx-dim" text-anchor="middle">1.2 bar</text>
<g clip-path="url(#c-tank)">${layers}</g>
<rect x="610" y="320" width="100" height="270" rx="20" class="tank-shell"/>
<text id="t-tank-top" x="660" y="352" class="tx tx-halo" text-anchor="middle"></text>
<text id="t-tank-name" x="660" y="460" class="tx tx-halo tx-b" text-anchor="middle"></text>
<text id="t-tank-bot" x="660" y="576" class="tx tx-halo" text-anchor="middle"></text>
<g id="g-dhw"><rect id="dhw-body" x="735" y="380" width="50" height="100" rx="14" class="tank-shell2"/><text x="760" y="425" class="tx tx-halo tx-b" text-anchor="middle" data-i18n="sc.dhw">DHW</text><text id="t-dhw" x="760" y="442" class="tx tx-halo" text-anchor="middle"></text></g>
<g id="g-rad">${valve(830, 340)}${pump('pm-rad', 850, 440)}<g id="rads">${radiatorsMarkup()}</g><text id="t-rad-n" x="1166" y="530" class="tx tx-b" text-anchor="end"></text><text id="t-rad" x="866" y="470" class="tx tx-dim"></text></g>
<g id="g-floor">${valve(800, 410, 90)}${pump('pm-floor', 800, 500)}<text id="t-floor" x="1000" y="646" class="tx tx-dim" text-anchor="middle"></text></g>

<!-- labels -->
<text id="t-out" x="62" y="640" class="tx tx-big" text-anchor="middle"></text><text x="62" y="658" class="tx tx-dim" text-anchor="middle" data-i18n="sc.outside">outside</text>
<text id="t-exit" x="118" y="262" class="tx tx-dim" text-anchor="end"></text>
<text id="t-draft" x="118" y="420" class="tx" text-anchor="end"></text><text x="118" y="436" class="tx tx-dim" text-anchor="end" data-i18n="sc.draft">draught</text>
<text id="t-flue" x="206" y="306" class="tx tx-dim" text-anchor="middle"></text>
<text x="380" y="640" class="tx tx-dim" text-anchor="middle" data-i18n="sc.boiler">boiler</text>
<text x="660" y="640" class="tx tx-dim" text-anchor="middle" data-i18n="sc.buffer">buffer tank</text>
`;
}

// ---------- particles ----------
function sprite(rgb) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.45, `rgba(${rgb},.45)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return c;
}

export class Scene {
  constructor(svg, canvas) {
    this.svg = svg; this.canvas = canvas; this.ctx = canvas.getContext('2d');
    buildScene(svg);
    this.$ = (id) => svg.querySelector('#' + id);
    this.el = {};
    for (const n of svg.querySelectorAll('[id]')) this.el[n.id] = n;
    this.layers = [...svg.querySelectorAll('.tank-layer')];
    this.jackets = [...svg.querySelectorAll('.jacket')];
    this.logs = [...svg.querySelectorAll('.log')];
    this.rads = [...svg.querySelectorAll('.rad')];
    this.pipeOff = {};
    this.parts = []; this.smoke = []; this.snow = [];
    for (let i = 0; i < 70; i++) this.snow.push({ x: Math.random() * W, y: Math.random() * GROUND, r: 1 + Math.random() * 1.8, s: 0.4 + Math.random() * 0.8, p: Math.random() * 6 });
    this.sp = {
      hot: sprite('255,244,200'), yel: sprite('255,196,80'), org: sprite('255,130,36'), red: sprite('214,58,24'),
      light: sprite('214,214,214'), dark: sprite('74,62,54'), steam: sprite('240,244,248'),
    };
    this.fanA = 0; this.acc = 0; this.chTop = 250; this.txtT = 0;
    this.resize();
  }

  resize() {
    const r = this.svg.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.k = this.canvas.width / W;
  }

  /** Static-ish things that depend on configuration. */
  applyConfig(cfg, t) {
    const e = this.el;
    this.chTop = GROUND - (250 + cfg.chimney.height * 19);
    const w = clamp(cfg.chimney.diameter / 9, 11, 34);
    e['ch-outer'].setAttribute('y', this.chTop); e['ch-outer'].setAttribute('height', GROUND - this.chTop);
    e['ch-outer'].setAttribute('x', 150 - w / 2 - 11); e['ch-outer'].setAttribute('width', w + 22);
    e['ch-outer'].dataset.type = cfg.chimney.type;
    e['ch-inner'].setAttribute('y', this.chTop); e['ch-inner'].setAttribute('height', 342 - this.chTop);
    e['ch-inner'].setAttribute('x', 150 - w / 2); e['ch-inner'].setAttribute('width', w);
    e['ch-cap'].setAttribute('y', this.chTop - 6); e['ch-cap'].setAttribute('x', 150 - w / 2 - 16); e['ch-cap'].setAttribute('width', w + 32);
    e['t-exit'].setAttribute('y', this.chTop + 14);
    e.regulator.style.display = cfg.chimney.regulator ? '' : 'none';
    e['g-dhw'].style.display = cfg.dhw ? '' : 'none';
    e['p-dhwS'].style.display = e['p-dhwR'].style.display = cfg.dhw ? '' : 'none';
    const hasR = cfg.radiators.count > 0, hasF = cfg.floor.area > 0;
    e['g-rad'].style.display = e['p-radS'].style.display = e['p-radR'].style.display = hasR ? '' : 'none';
    e['g-floor'].style.display = e['p-flS'].style.display = e['p-flR'].style.display = hasF ? '' : 'none';
    this.rads.forEach((r, i) => { r.style.display = i < Math.min(cfg.radiators.count, 5) ? '' : 'none'; });
    e['t-rad-n'].textContent = hasR ? `× ${cfg.radiators.count}` : '';
    e['t-tank-name'].textContent = `${cfg.tank.volume} L`;
    const tint = WOOD_TINT[cfg.wood];
    this.svg.style.setProperty('--log-wood', tint[0]); this.svg.style.setProperty('--log-bark', tint[1]);
    e['snow-cover'].setAttribute('opacity', cfg.outdoor <= 0 ? 0.9 : 0);
    this.cfg = cfg; this.t = t;
  }

  setPipe(key, T, flow, dt) {
    const g = this.el['p-' + key];
    g.children[1].setAttribute('stroke', waterColor(T));
    const f = g.children[2];
    if (flow > 0.002) {
      this.pipeOff[key] = ((this.pipeOff[key] || 0) - dt * (30 + 110 * Math.min(flow, 1))) % 32;
      f.setAttribute('stroke-dashoffset', this.pipeOff[key]);
      f.setAttribute('opacity', 0.75);
    } else f.setAttribute('opacity', 0);
  }

  /** dt: real seconds since last frame; running: simulation is advancing. */
  frame(sim, dt, running) {
    const s = sim.s, o = sim.o, c = sim.cfg, e = this.el, F = (x, d = 0) => this.t.num(x, d);
    const tk = s.tank, anim = running ? dt : 0;

    // water colours
    const jc = waterColor(s.Tb);
    for (const j of this.jackets) j.setAttribute('fill', jc);
    this.layers.forEach((l, i) => l.setAttribute('fill', waterColor(tk[i])));
    e['dhw-body'].setAttribute('fill', waterColor(s.Tdhw));
    const pumpOn = o.mbp > 0;
    this.setPipe('flowA', s.Tb, pumpOn ? 0.8 : 0, anim);
    this.setPipe('flowB', s.Tb, pumpOn ? o.x * 0.8 : 0, anim);
    this.setPipe('bypass', s.Tb, pumpOn ? (1 - o.x) * 0.8 : 0, anim);
    this.setPipe('ret', pumpOn ? o.Tret : tk[9], pumpOn ? 0.8 : 0, anim);
    this.setPipe('radS', o.rad.Ts, o.rad.m > 0 ? 0.3 + o.rad.m : 0, anim);
    this.setPipe('radR', o.rad.Tr, o.rad.m > 0 ? 0.3 + o.rad.m : 0, anim);
    this.setPipe('flS', o.floor.Ts, o.floor.m > 0 ? 0.3 + o.floor.m : 0, anim);
    this.setPipe('flR', o.floor.Tr, o.floor.m > 0 ? 0.3 + o.floor.m : 0, anim);
    this.setPipe('dhwS', tk[0], o.Qdhw > 0 ? 0.4 : 0, anim);
    this.setPipe('dhwR', Math.max(s.Tdhw, tk[2] - 15), o.Qdhw > 0 ? 0.4 : 0, anim);
    e['pm-boiler'].classList.toggle('on', pumpOn);
    e['pm-rad'].classList.toggle('on', o.rad.m > 0);
    e['pm-floor'].classList.toggle('on', o.floor.m > 0);
    const radT = (o.rad.Ts + o.rad.Tr) / 2, radC = o.rad.m > 0 ? waterColor(radT) : waterColor(s.Troom);
    for (const r of this.rads) r.style.setProperty('--rad', radC);
    e['floor-glow'].setAttribute('opacity', clamp((s.Tslab - s.Troom) / 9, 0, 1) * (c.floor.area > 0 ? 1 : 0));
    e['room-tint'].setAttribute('opacity', clamp((s.Troom - 14) / 9, 0, 1));

    // gas side
    e['ch-s0'].setAttribute('stop-color', gasColor(o.Tfg)); e['ch-s1'].setAttribute('stop-color', gasColor(o.Texit));
    e['flue-in'].setAttribute('fill', gasColor(o.Tfg));
    this.fanA = (this.fanA + anim * (s.u > 0.01 ? 200 + 900 * s.u : 0)) % 360;
    e.fan.setAttribute('transform', `rotate(${this.fanA})`);
    e['reg-flap'].setAttribute('transform', `rotate(${o.regOpen ? 50 : 0})`);
    e['door-top'].setAttribute('transform', o.doorOpen ? 'translate(16,0) rotate(-24 463 322)' : '');
    e['ignite-hint'].style.display = !s.lit && s.t === 0 ? '' : 'none';

    // logs: pile sinks as the charge is consumed (downdraught: the bottom burns)
    const total = this.logs.length, shown = Math.ceil(total * (c.fill / 100) * o.fuelLeft - 1e-6);
    const glow = clamp(o.Qfuel / 20000, 0, 1);
    this.logs.forEach((l, i) => {
      l.style.display = i < shown ? '' : 'none';
      if (i < shown) l.lastChild.setAttribute('opacity', s.lit ? clamp((i < 5 ? 0.75 : i < 9 ? 0.35 : 0.08) * (0.4 + glow), 0, 0.9) : (s.burnt ? 0.8 : 0));
    });

    // text (throttled)
    this.txtT -= dt;
    if (this.txtT <= 0) {
      this.txtT = 0.2;
      e['t-boiler'].textContent = `${F(s.Tb)}°C`;
      e['t-stage'].textContent = this.t('stageShort.' + o.stage);
      e['t-fire'].textContent = s.Tf > 60 ? `${F(s.Tf)}°C` : '';
      e['t-room'].textContent = `${F(s.Troom, 1)}°`;
      e['t-out'].textContent = `${F(c.outdoor)}°C`;
      e['t-tank-top'].textContent = `${F(tk[0])}°C`;
      e['t-tank-bot'].textContent = `${F(tk[9])}°C`;
      e['t-dhw'].textContent = `${F(s.Tdhw)}°C`;
      e['t-press'].textContent = `${F(o.pressure, 1)} bar`;
      e['t-flue'].textContent = o.mGas > 0.0005 ? `${F(o.Tfg)}°C` : '';
      e['t-exit'].textContent = s.lit ? `${F(o.Texit)}°C` : '';
      e['t-draft'].textContent = `${F(o.draft)} Pa`;
      e['t-draft'].setAttribute('class', 'tx ' + (s.lit && o.draft < 10 ? 'tx-bad' : ''));
      e['t-rad'].textContent = o.rad.m > 0 ? `${F(o.rad.Ts)}/${F(o.rad.Tr)}°C` : '';
      e['t-floor'].textContent = c.floor.area > 0 ? `${this.t('sc.floor')} ${c.floor.area} m² · ${o.floor.m > 0 ? `${F(o.floor.Ts)}/${F(o.floor.Tr)}°C` : '—'}` : '';
    }

    this.particles(sim, dt, running);
  }

  particles(sim, dt, running) {
    const s = sim.s, o = sim.o, c = sim.cfg, ctx = this.ctx, k = this.k, sp = this.sp;
    const f = clamp(dt * 60, 0, 3) * (running ? 1 : 0);
    const power = clamp(o.Qfuel / 27000, 0, 1.3);
    const top = this.chTop;

    if (running && s.lit) {
      this.acc += power * 3.2 * f + 0.05 * f;
      while (this.acc >= 1) {
        this.acc -= 1;
        const tx = [263, 277, 291][Math.floor(Math.random() * 3)];
        this.parts.push({
          x: 330 + Math.random() * 100, y: 430 + Math.random() * 18, i: 0, j: Math.random(),
          wp: [[379, 458], [379 + (Math.random() - 0.5) * 6, 500], [366 + Math.random() * 40, 546], [334, 558], [296, 568], [tx, 562], [tx, 334], [254, 329], [174, 330], [150, 326], [150, top - 4]],
        });
      }
      if (o.doorOpen) for (let n = 0; n < (o.draft < 6 ? 2 : 0.4) * f; n++) {
        if (Math.random() < 0.6) this.smoke.push({ x: 468, y: 340 + Math.random() * 90, vx: 0.5 + Math.random() * 0.6, vy: -0.6 - Math.random() * 0.5, a: 0.5, r: 8, in: true });
      }
    }
    const wind = 0.35 + 0.25 * Math.sin(performance.now() / 4000);
    const speedCh = clamp(o.vCh, 0.4, 2.5) * 1.6;
    for (const p of this.parts) {
      const w = p.wp[p.i];
      const dx = w[0] - p.x, dy = w[1] - p.y, d = Math.hypot(dx, dy) || 1;
      const v = (p.i < 5 ? 2.6 : p.i < 7 ? 1.9 : p.i < 10 ? 2.2 : speedCh) * f;
      p.x += dx / d * v + (Math.random() - 0.5) * (p.i < 5 ? 1.6 : 0.5) * f;
      p.y += dy / d * v + (Math.random() - 0.5) * (p.i < 5 ? 1.2 : 0.4) * f;
      if (d < v + 3) {
        p.i++;
        if (p.i >= p.wp.length) { p.dead = true; this.smoke.push({ x: p.x, y: p.y, vx: wind * (0.6 + Math.random()), vy: -speedCh * 0.7, a: 1, r: 7 }); }
      }
    }
    this.parts = this.parts.filter((p) => !p.dead);
    for (const m of this.smoke) {
      m.x += m.vx * f; m.y += m.vy * f; m.vy *= 1 - 0.006 * f; m.vx += wind * 0.008 * f;
      m.r += 0.16 * f; m.a -= (m.in ? 0.012 : 0.0052) * f;
    }
    this.smoke = this.smoke.filter((m) => m.a > 0 && m.y > -40);
    if (this.parts.length > 1500) this.parts.splice(0, this.parts.length - 1500);

    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const draw = (img, x, y, r, a) => { ctx.globalAlpha = a; ctx.drawImage(img, x - r, y - r, 2 * r, 2 * r); };

    // smoke look: steam-white when wet, brown-dark when combustion is incomplete
    const dirty = clamp(o.ub * 2.2, 0, 1), wet = clamp(o.wfrac * 2.5, 0, 1);
    const smokeImg = dirty > 0.35 ? sp.dark : wet > 0.4 ? sp.steam : sp.light;
    const smokeA = clamp(0.1 + dirty * 0.5 + wet * 0.22, 0.08, 0.7);

    ctx.globalCompositeOperation = 'source-over';
    for (const m of this.smoke) draw(m.in ? sp.dark : smokeImg, m.x, m.y, m.r, m.a * (m.in ? 0.5 : smokeA));
    for (const p of this.parts) {
      if (p.i >= 8) draw(smokeImg, p.x, p.y, p.i === 10 ? 6.5 : 7.5, smokeA * 0.8);
      else if (p.i >= 6) draw(dirty > 0.35 ? sp.dark : sp.light, p.x, p.y, 5, 0.16 + dirty * 0.3);
    }

    // snow
    if (c.outdoor <= 1) {
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#fff';
      for (const n of this.snow) {
        n.y += n.s * f; n.x += Math.sin(n.p + n.y / 30) * 0.3 * f + wind * 0.3 * f;
        if (n.y > GROUND) { n.y = -4; n.x = Math.random() * W; }
        if (n.x > W) n.x = 0;
        const roof = n.x < 122 ? GROUND : n.x < 180 ? this.chTop - 8 : n.x < 800 ? 238 : 252 - 134 * (1 - Math.abs(n.x - 1000) / 204);
        if (n.y < roof) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.3); ctx.fill(); }
      }
    }

    // fire
    ctx.globalCompositeOperation = 'lighter';
    const heat = clamp((s.Tf - 150) / 850, 0, 1);
    if (heat > 0.01) {
      const fl = 0.85 + 0.15 * Math.sin(performance.now() / 90) * Math.sin(performance.now() / 37);
      draw(sp.org, 379, 448, 70, 0.5 * heat * fl * clamp(o.fuelLeft * 6, 0.2, 1));
      draw(sp.red, 379, 520, 74, 0.55 * heat);
      draw(sp.yel, 379, 482, 26, 0.6 * heat * fl * clamp(power * 2, 0, 1));
    }
    for (const p of this.parts) {
      const j = p.j;
      if (p.i === 0) draw(sp.org, p.x, p.y, 6 + 5 * j, 0.35);
      else if (p.i <= 2) { draw(sp.yel, p.x, p.y, 11 + 6 * j, 0.5); draw(sp.hot, p.x, p.y, 5 + 3 * j, 0.55); }
      else if (p.i <= 4) draw(p.i === 3 ? sp.org : sp.red, p.x, p.y, 12 + 6 * j, 0.42);
      else if (p.i === 5) draw(sp.red, p.x, p.y, 8, 0.3);
      else if (p.i === 6) draw(sp.red, p.x, p.y, 5, 0.22 * clamp((p.y - 400) / 160, 0, 1));
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  clearParticles() { this.parts = []; this.smoke = []; }
}
