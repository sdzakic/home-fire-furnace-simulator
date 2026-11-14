import { DEFAULTS, simulateBurn, chimneySteady, fuelLoad, Sim } from '../js/physics.js';
const clone = (o) => JSON.parse(JSON.stringify(o));
const f = (x, d = 1) => (x == null ? '-' : x.toFixed(d));
console.log('load', fuelLoad(DEFAULTS));
for (const M of [10, 15, 20, 25, 30, 35, 40, 50]) {
  const c = clone(DEFAULTS); c.moisture = M;
  const r = simulateBurn(c);
  console.log(`M=${M}% h=${f(r.hours)} fuel=${f(r.fuel)} water=${f(r.water)} eta=${f(r.water / (r.fuel - r.latent) * 100)}% flue=${f(r.flue)} lat=${f(r.latent)} ub=${f(r.unburnt)} left=${f(r.left, 2)} avg=${f(r.avgKW)}kW fin=${r.finished}`, Object.entries(r.sim.stageT).map(([k, v]) => k[0] + ':' + f(v / 3600)).join(' '));
}
for (const H of [4, 6, 8, 12, 15]) for (const T of [-15, 10]) {
  const r = chimneySteady({ height: H, diameter: 160, type: 'insulated' }, T);
  console.log(`H=${H} Tout=${T} draft=${f(r.draft)}Pa Texit=${f(r.Texit)} v=${f(r.v, 2)}`);
}
for (const type of ['insulated', 'ceramic', 'brick']) { const r = chimneySteady({ height: 8, diameter: 200, type }, -5); console.log(type, f(r.draft), f(r.Texit), f(r.Tw)); }
// time trace
const sim = new Sim(clone(DEFAULTS)); sim.ignite();
for (let i = 0; i <= 40; i++) {
  const o = sim.o, s = sim.s;
  if (i % 2 === 0) console.log(`t=${f(s.t / 3600, 2)}h ${o.stage.padEnd(12)} Pf=${f(o.Qfuel / 1000)} Pw=${f(o.Qw / 1000)} eta=${f(o.eta * 100, 0)} Tf=${f(s.Tf, 0)} Tfg=${f(o.Tfg, 0)} Tex=${f(o.Texit, 0)} dr=${f(o.draft)} u=${f(s.u, 2)} lam=${f(o.lam, 2)} Tb=${f(s.Tb)} top=${f(s.tank[0])} bot=${f(s.tank[9])} room=${f(s.Troom)} rad=${f(o.rad.Q / 1000)} fl=${f(o.floor.Qroom / 1000)} house=${f(o.Qhouse / 1000)} p=${f(o.pressure, 2)} dew=${f(o.dew, 0)}`);
  sim.advance(900);
}
console.log(sim.events.map(e => f(e.t / 3600, 2) + ':' + e.key).join(' '));
const E = sim.E; const bal = E.fuel - E.unburnt - E.latent - E.flue - E.water;
console.log('gas-side balance residual kWh (firebox storage)', f(bal / 3.6e6, 2), 'of', f(E.fuel / 3.6e6));
