// Physics model for a log-gasification boiler (Centrometal BioTec-L 25 class)
// with chimney, buffer tank, radiators, underfloor heating, DHW and a house.
// Pure module: no DOM. Units are SI unless noted (temperatures in °C).

export const CP_G = 1150;      // J/kgK  mean flue gas heat capacity
export const CW = 4186;        // J/kgK  water
export const LAT = 2.443e6;    // J/kg   latent heat of water at 25 °C
export const LHV_CHAR = 31e6;  // J/kg   charcoal
export const AFR_DRY = 6.0;    // kg air / kg dry wood (stoichiometric)
export const AFR_CHAR = 11.5;  // kg air / kg char
export const T_AIR = 15;       // °C boiler-room / combustion air

// Published data: 25 kW nominal, 150 mm flue, logs to 55 cm, fuel moisture < 25 %,
// buffer tank mandatory. The remaining values are model calibration assumptions.
export const BOILER = {
  nominalKW: 25,
  fireboxL: 100,       // loading chamber volume used by the model
  packing: 0.42,       // solid fraction of stacked split logs
  waterL: 100,
  steelKg: 420,
  mNom: 0.0155,        // kg/s flue gas at nominal load (λ≈1.4)
  fanMax: 25,          // Pa
  RB0: 156500,         // Pa s²/kg² gas-side resistance of the boiler
  UAf: 8.9,            // W/K firebox walls → water
  UAhx: 46.9,          // W/K tube heat exchanger at nominal flow
  Cfb: 15000,          // J/K refractory / firebox thermal mass
  jacketUA: 6,         // W/K casing loss
  flueMm: 150,
  bufferLPerKW: 50,
  reqDraft: [15, 25],  // Pa recommended working draught
  lambdaSet: 1.4,
  returnMin: 60,       // °C return-temperature protection
};

// rho: oven-dry density kg/m³, lhv: MJ/kg dry, vol: volatile fraction, kf: reactivity
export const WOODS = {
  beech:    { rho: 680, lhv: 18.4, vol: 0.84, kf: 1.0 },
  oak:      { rho: 670, lhv: 18.3, vol: 0.82, kf: 0.9 },
  hornbeam: { rho: 750, lhv: 18.2, vol: 0.83, kf: 0.9 },
  ash:      { rho: 670, lhv: 18.5, vol: 0.83, kf: 1.0 },
  locust:   { rho: 730, lhv: 18.6, vol: 0.81, kf: 0.9 },
  birch:    { rho: 610, lhv: 18.7, vol: 0.86, kf: 1.15 },
  spruce:   { rho: 430, lhv: 19.0, vol: 0.85, kf: 1.35 },
  poplar:   { rho: 410, lhv: 18.3, vol: 0.86, kf: 1.3 },
};

// lam: friction factor, Uo: W/m²K wall → surroundings, c: kJ/K per metre of wall
export const CHIMNEYS = {
  insulated: { lam: 0.03, Uo: 0.6, c: 5 },
  ceramic:   { lam: 0.04, Uo: 1.1, c: 55 },
  brick:     { lam: 0.07, Uo: 2.6, c: 130 },
};

// W/K per m² of floor area
export const INSULATION = { poor: 2.2, average: 1.4, good: 0.8, passive: 0.4 };

export const STAGES = ['idle', 'ignition', 'drying', 'gasification', 'char', 'out'];

export const DEFAULTS = {
  wood: 'beech', moisture: 20, fill: 100,
  chimney: { height: 8, diameter: 160, type: 'insulated', regulator: true },
  outdoor: -5,
  house: { area: 160, insulation: 'average', setpoint: 21 },
  radiators: { count: 8, power: 1500 },
  floor: { area: 40 },
  tank: { volume: 1500, startTemp: 30 },
  dhw: true,
  control: { auto: true, fan: 70, primary: 19, boilerSet: 85 },
};

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const rhoAir = (T) => 353.05 / (T + 273.15);
export const rhoWater = (T) => 1000.6 - 0.0128 * Math.pow(Math.max(T, 0), 1.76);

// ---------- fuel ----------
export function woodProps(key) {
  const w = WOODS[key];
  const fc = 1 - w.vol - 0.005;
  return {
    ...w, fc,
    lhvV: (w.lhv * 1e6 - fc * LHV_CHAR) / w.vol,
    afrV: (AFR_DRY - fc * AFR_CHAR) / w.vol,
    h2oV: 0.54 / w.vol,
  };
}

/** Lower heating value of wet wood, MJ/kg (wet basis moisture M in %). */
export function lhvWet(key, M) {
  const m = M / 100;
  return WOODS[key].lhv * (1 - m) - 2.443 * m;
}

export function fuelLoad(cfg) {
  const w = WOODS[cfg.wood];
  const m = cfg.moisture / 100;
  const dry = (BOILER.fireboxL / 1000) * BOILER.packing * w.rho * (cfg.fill / 100);
  const wet = dry / (1 - m);
  const lhv = lhvWet(cfg.wood, cfg.moisture);
  return {
    dry, wet, water: wet - dry, lhv,
    kWhPerKg: lhv / 3.6,
    kWh: (wet * lhv) / 3.6,
    kWhDry: (dry * w.lhv) / 3.6,
    evapKWh: ((wet - dry) * 2.443) / 3.6,
  };
}

// ---------- chimney ----------
function chimneyGeom(ch) {
  const D = ch.diameter / 1000, H = ch.height;
  const t = CHIMNEYS[ch.type];
  return {
    D, H, t, A: Math.PI * D * D / 4,
    zeta: t.lam * H / D + 3.0,
    Ao: Math.PI * (D + 0.1) * H,
    Cw: t.c * 1000 * H * (D / 0.15),
  };
}

function chimneyGas(g, Tw, Tin, m) {
  if (m < 1e-5) return { Texit: Tw, Tm: Tw, Qgw: 0, v: 0 };
  const rho = rhoAir((Tin + Tw) / 2);
  const v = m / (rho * g.A);
  const h = Math.max(4, 8 * Math.sqrt(v));
  const N = h * Math.PI * g.D * g.H / (m * CP_G);
  const e = Math.exp(-N);
  return {
    Texit: Tw + (Tin - Tw) * e,
    Tm: Tw + (Tin - Tw) * (1 - e) / N,
    Qgw: m * CP_G * (Tin - Tw) * (1 - e),
    v,
  };
}

const chimneyEnv = (Tout) => 0.6 * Tout + 0.4 * T_AIR;

/** Steady-state chimney behaviour for a given flue gas inlet temperature and flow. */
export function chimneySteady(ch, Tout, Tfg = 150, m = BOILER.mNom) {
  const g = chimneyGeom(ch);
  const Tenv = chimneyEnv(Tout);
  let lo = Math.min(Tenv, Tfg), hi = Math.max(Tenv, Tfg), Tw = Tenv, r = null;
  for (let i = 0; i < 40; i++) {
    Tw = (lo + hi) / 2;
    r = chimneyGas(g, Tw, Tfg, m);
    if (r.Qgw > g.t.Uo * g.Ao * (Tw - Tenv)) lo = Tw; else hi = Tw;
  }
  const rhoM = rhoAir(r.Tm);
  const pStatic = 9.81 * g.H * (rhoAir(Tout) - rhoM);
  const friction = g.zeta * m * m / (2 * rhoM * g.A * g.A);
  return { draft: pStatic - friction, pStatic, friction, Texit: r.Texit, Tm: r.Tm, Tw, v: r.v };
}

/** Dew point (°C) of flue gas from water-vapour and total mass flows. */
export function dewPoint(mH2O, mGas) {
  if (mGas < 1e-6 || mH2O <= 0) return 0;
  const nW = mH2O / 18, nD = Math.max(1e-9, (mGas - mH2O)) / 30;
  const p = (nW / (nW + nD)) * 101325;
  const a = Math.log(Math.max(p, 50) / 610.78);
  return (237.3 * a) / (17.27 - a);
}

/** Litres of water that E kWh can heat from T0 to T1. */
export function litresHeated(kWh, T0, T1) {
  if (T1 <= T0) return 0;
  return (kWh * 3.6e6) / (CW * (T1 - T0)) / (rhoWater((T0 + T1) / 2) / 1000);
}

export function houseDemandW(cfg, Tout = cfg.outdoor) {
  const H = cfg.house.area * INSULATION[cfg.house.insulation];
  return Math.max(0, H * (cfg.house.setpoint - Tout) - 400);
}

function emitter(Qn, m, Ts, Troom) {
  if (m < 1e-5 || Ts <= Troom + 0.5) return { Q: 0, Tr: Ts };
  let lo = Troom, hi = Ts, Tr = Ts;
  for (let i = 0; i < 22; i++) {
    Tr = (lo + hi) / 2;
    const Qe = Qn * Math.pow(Math.max(0, (Ts + Tr) / 2 - Troom) / 50, 1.3);
    if (Qe > m * CW * (Ts - Tr)) hi = Tr; else lo = Tr;
  }
  return { Q: m * CW * (Ts - Tr), Tr };
}

const N_LAYERS = 10;

export class Sim {
  constructor(cfg) {
    this.cfg = cfg;
    this.reset();
  }

  reset() {
    const c = this.cfg;
    const Tenv = chimneyEnv(c.outdoor);
    this.s = {
      t: 0, lit: false, ign: 0, standby: false, door: 0, pump: false, safety: false,
      mW: 0, mV: 0, mC: 0, mW0: 1, mV0: 1, mC0: 1, dry0: 1,
      Tf: T_AIR, Tb: Math.min(c.tank.startTemp, 35),
      tank: new Array(N_LAYERS).fill(c.tank.startTemp),
      Tw: Tenv, chTm: Tenv, u: 0, soot: 0, creosote: 0,
      Troom: c.house.setpoint - 1.5, Tslab: c.house.setpoint - 1, Tdhw: 45, dhwOn: false,
      stage: 'idle', burnt: false, qFuelPrev: 0,
    };
    this.E = {
      fuel: 0, unburnt: 0, latent: 0, flue: 0, jacket: 0, water: 0, rad: 0, floor: 0,
      dhw: 0, tankLoss: 0, safety: 0, houseLoss: 0,
    };
    this.stageE = { ignition: 0, drying: 0, gasification: 0, char: 0 };
    this.stageW = { ignition: 0, drying: 0, gasification: 0, char: 0 };
    this.stageT = { ignition: 0, drying: 0, gasification: 0, char: 0 };
    this.events = [];
    this.flags = {};
    this.hist = [];
    this.histStep = 60;
    this.histNext = 0;
    this.o = {};
    this.load();
    this.compute(0);
  }

  /** Put a charge of wood into the loading chamber (adds to whatever is there). */
  load(fillOverride) {
    const c = this.cfg, s = this.s, wp = woodProps(c.wood);
    const f = fuelLoad(fillOverride == null ? c : { ...c, fill: fillOverride });
    const cap = fuelLoad({ ...c, fill: 100 }).dry;
    const room = Math.max(0, cap - (s.mV + s.mC));
    const dry = Math.min(f.dry, room);
    if (dry <= 0.05) return 0;
    s.mW += dry * (c.moisture / 100) / (1 - c.moisture / 100);
    s.mV += dry * wp.vol;
    s.mC += dry * wp.fc;
    s.mW0 = Math.max(s.mW, 0.01); s.mV0 = s.mV; s.mC0 = s.mC; s.dry0 = s.mV + s.mC;
    s.burnt = false;
    return dry;
  }

  ignite() {
    const s = this.s;
    if (s.lit || s.mV + s.mC < 0.2) return false;
    s.lit = true; s.ign = 1; s.burnt = false; s.standby = false;
    this.event('ignite');
    return true;
  }

  openDoor(seconds = 90) { this.s.door = seconds; }

  cleanExchanger() { this.s.soot = 0; this.s.creosote = 0; this.event('cleaned'); }

  event(key, data) {
    this.events.push({ t: this.s.t, key, data });
    if (this.events.length > 60) this.events.shift();
  }

  edge(name, cond, key, data) {
    if (cond && !this.flags[name]) this.event(key, data);
    this.flags[name] = cond;
  }

  advance(seconds) {
    let left = seconds;
    while (left > 1e-6) {
      const dt = Math.min(5, left);
      this.compute(dt);
      left -= dt;
    }
  }

  compute(dt) {
    const c = this.cfg, s = this.s, B = BOILER, E = this.E;
    const wp = woodProps(c.wood);
    const Tout = c.outdoor;
    const doorOpen = s.door > 0;

    // ---------- fuel kinetics ----------
    s.ign = Math.max(0, s.ign - dt / 1200);
    const mDry = s.mV + s.mC, mTot = mDry + s.mW;
    const wfrac = mTot > 1e-6 ? s.mW / mTot : 0;
    const phi = s.lit ? Math.max(Math.pow(clamp((s.Tf - 100) / 450, 0, 1), 1.2), 0.2 * Math.sqrt(s.ign)) : 0;
    const dryF = Math.pow(clamp(1 - wfrac / 0.48, 0, 1), 2) * 0.94 + 0.06;
    let rV = s.mV * (wp.kf / 3000) * phi * dryF;
    const exposed = s.mV0 > 0 ? clamp(1 - s.mV / s.mV0, 0, 1) : 1;
    let rC = s.mC * (wp.kf / 2600) * phi * (0.04 + 0.96 * exposed * exposed);
    const qKind = s.lit ? 8000 * Math.sqrt(s.ign) : 0;
    const phiW = clamp((s.Tf - 60) / 300, 0, 1);
    let rW = s.lit ? Math.min(s.mW / 7200 * phiW, 0.22 * (s.qFuelPrev + qKind) / 2.8e6) : 0;
    if (dt > 0) {
      rV = Math.min(rV, s.mV / dt); rC = Math.min(rC, s.mC / dt); rW = Math.min(rW, s.mW / dt);
    }

    // ---------- controller ----------
    const lamSet = B.lambdaSet;
    const stoichKin = wp.afrV * rV + AFR_CHAR * rC;
    if (s.lit) {
      if (s.Tb > c.control.boilerSet + 5) s.standby = true;
      else if (s.Tb < c.control.boilerSet - 3) s.standby = false;
    } else s.standby = false;
    const fanOn = s.lit && !s.standby;

    // ---------- chimney + gas flow ----------
    const g = chimneyGeom(c.chimney);
    const rhoM = rhoAir(s.chTm);
    const pStatic = 9.81 * g.H * (rhoAir(Tout) - rhoM);
    const Rch = g.zeta / (2 * rhoM * g.A * g.A);
    const damper = doorOpen ? 2 : fanOn ? 1 : 0.25;
    const Rb = B.RB0 / (damper * damper);
    const flowFor = (u) => {
      const pF = fanOn ? B.fanMax * u * u : 0;
      let m = pStatic + pF > 0 ? Math.sqrt((pStatic + pF) / (Rb + Rch)) : 0;
      let draft = pStatic - Rch * m * m, reg = false;
      if (c.chimney.regulator && draft > 20) {
        m = Math.sqrt((20 + pF) / Rb); draft = 20; reg = true;
      }
      return { m, draft, reg };
    };
    let mTarget = 0;
    if (fanOn) {
      if (c.control.auto) {
        const mod = clamp((c.control.boilerSet + 2 - s.Tb) / 6, 0.3, 1);
        const need = lamSet * stoichKin + rV + rC + rW;
        mTarget = B.mNom * mod * clamp(need / B.mNom, 0.2, 1);
        const err = (mTarget - flowFor(s.u).m) / B.mNom;
        s.u = clamp(s.u + 0.05 * err * Math.max(dt, 0), 0, 1);
      } else s.u = c.control.fan / 100;
    } else s.u = 0;
    const fl = flowFor(s.u);
    // motorised air flaps can throttle below the natural-draught flow, but they leak:
    // a strong chimney still pulls air through a "closed" boiler
    if (fanOn && c.control.auto && !doorOpen && fl.m > mTarget) {
      const leak = Math.sqrt(Math.max(fl.draft, 0) / (B.RB0 / 0.09));
      fl.m = Math.max(mTarget, leak);
    }
    const mGas = fl.m;

    // ---------- combustion ----------
    const usable = mGas * (doorOpen ? 0.5 : 1);
    let scale = 1;
    if (rV + rC > 1e-9) {
      if (c.control.auto) scale = Math.min(1, Math.max(0, usable - rW) / (lamSet * stoichKin + rV + rC));
      else scale = Math.min(1, (c.control.primary / 100) * Math.max(0, usable - rW) / (1.6 * (rV + rC)));
    }
    rV *= scale; rC *= scale;
    if (s.mV > 1e-3) rW = Math.min(Math.max(rW, rV * s.mW / s.mV), dt > 0 ? s.mW / dt : rW);
    const stoich = wp.afrV * rV + AFR_CHAR * rC;
    const mAir = Math.max(0, mGas - rW - rV - rC);
    const lam = stoich > 1e-7 ? mAir / stoich : Infinity;
    const lamEff = doorOpen ? lam * 0.5 : lam;
    const Qv = rV * wp.lhvV, Qc = rC * LHV_CHAR;
    let ub = 0;
    if (Qv + Qc > 1) {
      if (lamEff < 1) ub += 1 - lamEff;
      ub += 0.03 * clamp((1.3 - lamEff) / 0.3, 0, 1);
      ub += (0.16 * clamp((650 - s.Tf) / 400, 0, 1) + 0.3 * clamp((wfrac - 0.15) / 0.2, 0, 1)) * Qv / (Qv + Qc);
      if (s.standby) ub += 0.15;
      ub = clamp(ub, 0, 0.9);
    }
    const Qfuel = Qv + Qc + qKind;
    const Qub = ub * (Qv + Qc);
    const Qlat = rW * LAT;
    const Qcomb = Qfuel - Qub - Qlat;

    // ---------- firebox + heat exchanger ----------
    if (dt > 0) {
      const k = B.Cfb / dt;
      s.Tf = (k * s.Tf + Qcomb + mGas * CP_G * T_AIR + B.UAf * s.Tb) / (k + mGas * CP_G + B.UAf);
      s.Tf = clamp(s.Tf, -30, 1500);
    }
    const UAhx = B.UAhx * Math.pow(mGas / B.mNom, 0.65) * (1 - 0.5 * s.soot);
    const Tfg = mGas > 1e-5 ? s.Tb + (s.Tf - s.Tb) * Math.exp(-UAhx / (mGas * CP_G)) : s.Tb;
    const Qw = B.UAf * (s.Tf - s.Tb) + mGas * CP_G * (s.Tf - Tfg);
    const Qflue = mGas * CP_G * (Tfg - T_AIR);
    const Qjacket = B.jacketUA * (s.Tb - T_AIR);

    // ---------- chimney thermal ----------
    const cg = chimneyGas(g, s.Tw, Tfg, mGas);
    const Tenv = chimneyEnv(Tout);
    if (dt > 0) {
      const loss = g.t.Uo * g.Ao;
      s.Tw = (g.Cw / dt * s.Tw + cg.Qgw + loss * Tenv) / (g.Cw / dt + loss);
      s.chTm = cg.Tm;
    }
    const mH2O = rW + rV * wp.h2oV;
    const dew = dewPoint(mH2O, mGas);
    const Tsurf = s.Tw + (cg.Texit - s.Tw) * 0.25;
    const condensing = s.lit && mH2O > 1e-5 && Tsurf < dew;
    if (dt > 0) {
      s.soot = clamp(s.soot + ub * rV * dt * 0.06, 0, 1);
      if (condensing) s.creosote = clamp(s.creosote + (0.2 + ub) * rV * dt * 0.05, 0, 1);
    }

    // ---------- boiler circuit ----------
    const tk = s.tank, Ttop = tk[0], Tbot = tk[N_LAYERS - 1];
    if (s.Tb >= 62 && s.Tb > Tbot + 2) s.pump = true;
    else if (s.Tb <= 57 || s.Tb <= Tbot + 0.5) s.pump = false;
    const mbp = s.pump ? 0.42 : 0;
    let x = 0;
    if (mbp > 0) x = Tbot >= B.returnMin ? 1 : clamp((s.Tb - B.returnMin) / (s.Tb - Tbot), 0, 1);
    const qc = x * mbp;
    const Tret = s.pump ? x * Tbot + (1 - x) * s.Tb : s.Tb;
    const Qcharge = qc * CW * (s.Tb - Tbot);
    if (s.Tb >= 95) s.safety = true; else if (s.Tb < 90) s.safety = false;
    const Qsafety = s.safety ? 10000 : 0;

    // ---------- heating circuits ----------
    const set = c.house.setpoint, Troom = s.Troom;
    const dem = clamp((set - Tout) / 35, 0, 1.2);
    const gate = clamp((set + 0.3 - Troom) / 0.8, 0, 1);
    // radiators
    const QnR = c.radiators.count * c.radiators.power;
    const TsRset = Math.min(80, set + 55 * Math.pow(dem, 1 / 1.3));
    const TsR = Math.min(TsRset, Ttop);
    const mR = QnR > 0 && Ttop > Troom + 4 ? QnR / (CW * 10) * gate : 0;
    const rad = emitter(QnR, mR, TsR, Troom);
    const qdR = mR > 0 ? (Ttop > rad.Tr + 1 ? mR * clamp((TsR - rad.Tr) / (Ttop - rad.Tr), 0, 1) : mR) : 0;
    // floor
    const Af = c.floor.area;
    const TsFset = Math.min(45, set + 20 * Math.pow(dem, 1 / 1.1));
    const TsF = Math.min(TsFset, Ttop);
    const mF = Af > 0 && Ttop > s.Tslab + 2 ? Af * 80 / (CW * 6) * gate : 0;
    let TrF = TsF, Qwf = 0;
    if (mF > 1e-5 && TsF > s.Tslab) {
      TrF = s.Tslab + (TsF - s.Tslab) * Math.exp(-9 * Af / (mF * CW));
      Qwf = mF * CW * (TsF - TrF);
    }
    const qdF = mF > 0 && Qwf > 0 ? (Ttop > TrF + 1 ? mF * clamp((TsF - TrF) / (Ttop - TrF), 0, 1) : mF) : 0;
    const Qfloor = Af > 0 ? 10 * Af * (s.Tslab - Troom) : 0;
    // DHW
    let Qdhw = 0;
    if (c.dhw) {
      if (s.Tdhw < 50) s.dhwOn = true; else if (s.Tdhw >= 55) s.dhwOn = false;
      if (s.dhwOn && Ttop > s.Tdhw + 5) Qdhw = Math.min(12000, 900 * (Ttop - s.Tdhw));
    }
    const Hloss = c.house.area * INSULATION[c.house.insulation];
    const Qhouse = Hloss * (Troom - Tout);

    // ---------- integrate ----------
    if (dt > 0) {
      const Cb = B.waterL * CW + B.steelKg * 490;
      s.Tb += (Qw - Qjacket - Qcharge - Qsafety) * dt / Cb;
      if (s.Tb > 100) s.Tb = 100;

      // stratified tank
      const mL = c.tank.volume / N_LAYERS;
      const qd = qdR + qdF, f = qc - qd;
      const fp = Math.max(f, 0), fn = Math.max(-f, 0);
      const TrMix = qd > 1e-9 ? (qdR * rad.Tr + qdF * TrF) / qd : Tbot;
      const UAl = 1.6 * Math.pow(c.tank.volume / 1000, 0.67) / N_LAYERS * 2;
      const nT = tk.slice();
      let loss = 0;
      for (let i = 0; i < N_LAYERS; i++) {
        let e = 0;
        if (i === 0) e += qc * s.Tb - qd * tk[0] - fp * tk[0] + fn * tk[1];
        else if (i === N_LAYERS - 1) e += qd * TrMix - qc * tk[i] + fp * tk[i - 1] - fn * tk[i];
        else e += fp * (tk[i - 1] - tk[i]) + fn * (tk[i + 1] - tk[i]);
        let q = e * CW;
        if (i > 0) q += 1.2 * (tk[i - 1] - tk[i]);
        if (i < N_LAYERS - 1) q += 1.2 * (tk[i + 1] - tk[i]);
        const l = UAl * (tk[i] - T_AIR);
        q -= l; loss += l;
        if (i < 3) q -= Qdhw / 3;
        nT[i] = tk[i] + q * dt / (mL * CW);
      }
      for (let pass = 0; pass < 2; pass++) {
        for (let i = N_LAYERS - 2; i >= 0; i--) {
          if (nT[i + 1] > nT[i]) { const a = (nT[i] + nT[i + 1]) / 2; nT[i] = a; nT[i + 1] = a; }
        }
      }
      s.tank = nT;

      if (Af > 0) s.Tslab += (Qwf - Qfloor * 1.08) * dt / (Af * 130000);
      else s.Tslab = Troom;
      s.Troom += (rad.Q + Math.max(Qfloor, 0) + 400 - Qhouse) * dt / (c.house.area * 120000);
      if (c.dhw) s.Tdhw += (Qdhw - 220 - 1.5 * (s.Tdhw - 20)) * dt / (200 * CW);

      s.mW -= rW * dt; s.mV -= rV * dt; s.mC -= rC * dt;
      if (s.door > 0) s.door = Math.max(0, s.door - dt);
      s.t += dt;
      s.qFuelPrev = Qv + Qc;

      E.fuel += Qfuel * dt; E.unburnt += Qub * dt; E.latent += Qlat * dt; E.flue += Qflue * dt;
      E.jacket += Qjacket * dt; E.water += Qw * dt; E.rad += rad.Q * dt; E.floor += Qwf * dt;
      E.dhw += Qdhw * dt; E.tankLoss += loss * dt; E.safety += Qsafety * dt; E.houseLoss += Qhouse * dt;
    }

    // ---------- stage ----------
    let stage;
    if (!s.lit) stage = s.burnt ? 'out' : 'idle';
    else if (s.ign > 0.3 && s.Tf < 450) stage = 'ignition';
    else if (s.mW / s.mW0 > 0.7 && wfrac > 0.08) stage = 'drying';
    else if (s.mV / s.mV0 > 0.06) stage = 'gasification';
    else stage = 'char';
    if (s.lit && dt > 0) {
      this.stageE[stage] += (Qfuel - Qub) * dt;
      this.stageW[stage] += Math.max(Qw, 0) * dt;
      this.stageT[stage] += dt;
    }
    if (s.lit && s.ign <= 0 && Qv + Qc < 300 && (s.Tf < 160 || mDry < 0.03 * s.dry0)) {
      s.lit = false; s.burnt = true; s.standby = false;
      this.event(mDry < 0.08 * s.dry0 ? 'burnout' : 'died');
      stage = 'out';
    }
    s.stage = stage;

    // ---------- events ----------
    if (dt > 0) {
      this.edge('pump', s.pump || !s.lit, 'pumpOn');
      this.edge('safety', s.safety, 'safety');
      this.edge('standby', s.standby, 'standby');
      this.edge('cond', condensing && s.t > 1200, 'condensation');
      this.edge('lowDraft', fanOn && s.t > 2400 && fl.draft < 6, 'lowDraft');
      this.edge('spill', doorOpen && s.lit && fl.draft < 6, 'smokeSpill');
      this.edge('charged', tk[N_LAYERS - 1] > 75, 'tankFull');
      this.edge('wet', s.lit && s.ign <= 0 && wfrac > 0.27, 'wetWood');
    }

    // ---------- outputs ----------
    const tankAvg = s.tank.reduce((a, b) => a + b, 0) / N_LAYERS;
    const Vsys = c.tank.volume + B.waterL + c.radiators.count * 8 + c.floor.area * 0.15 + 40;
    const Tsys = (c.tank.volume * tankAvg + B.waterL * s.Tb) / (c.tank.volume + B.waterL);
    const dV = Vsys * (rhoWater(20) / rhoWater(Math.max(Tsys, 20)) - 1);
    const dVmax = Vsys * (rhoWater(20) / rhoWater(90) - 1);
    const vessel = Math.ceil(dVmax * 3.2 / 1.2 / 10) * 10;
    const lhvFuel = Qfuel - Qlat;
    this.o = {
      stage, rV, rC, rW, mGas, mAir, lam, ub, wfrac,
      Qfuel, Qv, Qc, Qub, Qlat, Qcomb, Qw, Qflue, Qjacket, Qcharge, Qsafety,
      eta: lhvFuel > 800 ? clamp(Qw / lhvFuel, 0, 1) : null,
      Tfg, Texit: cg.Texit, vCh: cg.v, draft: fl.draft, regOpen: fl.reg, pStatic,
      dew, condensing, fanOn,
      o2: isFinite(lam) && lam > 1 ? 21 * (lam - 1) / lam : (isFinite(lam) ? 0 : 21),
      co2: isFinite(lam) && lam > 0 ? Math.min(20.3, 20.3 / Math.max(lam, 1)) : 0,
      qc, mbp, x, Tret, doorOpen,
      rad: { Q: rad.Q, Ts: TsR, Tr: rad.Tr, m: mR },
      floor: { Q: Qwf, Qroom: Qfloor, Ts: TsF, Tr: TrF, m: mF },
      Qdhw, Qhouse, Qemit: rad.Q + Math.max(Qfloor, 0),
      tankAvg, tankKWh: c.tank.volume * CW * (tankAvg - 30) / 3.6e6,
      charge: clamp((tankAvg - 30) / 55, 0, 1),
      fuelLeft: s.dry0 > 0 ? clamp((s.mV + s.mC) / s.dry0, 0, 1) : 0,
      massLeft: s.mV + s.mC + s.mW,
      Vsys, vessel, pressure: 2.0 * vessel / Math.max(vessel - dV, vessel * 0.2) - 1,
    };

    if (dt > 0 && s.t >= this.histNext) {
      const o = this.o;
      this.hist.push({
        t: s.t, stage, pf: Qfuel / 1000, pw: Math.max(Qw, 0) / 1000, ph: o.Qemit / 1000,
        tb: s.Tb, tt: s.tank[0], tbot: s.tank[N_LAYERS - 1], tr: s.Troom,
        tf: s.Tf, tfg: Tfg, tex: cg.Texit, dr: fl.draft,
      });
      this.histNext = s.t + this.histStep;
      if (this.hist.length > 720) {
        this.hist = this.hist.filter((_, i) => i % 2 === 0);
        this.histStep *= 2;
      }
    }
  }
}

/** Run one full charge headlessly and return the energy balance (kWh). */
export function simulateBurn(cfg, maxHours = 16) {
  const sim = new Sim(JSON.parse(JSON.stringify(cfg)));
  sim.ignite();
  const end = maxHours * 3600;
  while (sim.s.t < end && sim.s.lit) sim.advance(300);
  const k = 1 / 3.6e6, E = sim.E;
  const hours = Object.values(sim.stageT).reduce((a, b) => a + b, 0) / 3600;
  return {
    hours, finished: !sim.s.lit,
    fuel: E.fuel * k, water: E.water * k, flue: E.flue * k, latent: E.latent * k,
    unburnt: E.unburnt * k, jacket: E.jacket * k,
    left: sim.o.fuelLeft, soot: sim.s.soot,
    avgKW: hours > 0 ? E.water * k / hours : 0,
    sim,
  };
}
