<img src="assets/icon.svg" width="64" height="64" alt="">

# Home fire furnace simulator

Interactive simulator of a 25 kW log-gasification boiler (modelled on the Centrometal BioTec-L 25) with chimney, buffer tank, radiators, underfloor heating and hot-water cylinder. Croatian / English, dark mode by default.

**Live:** https://sdzakic.github.io/home-fire-furnace-simulator/

## What it models

- Wood species, moisture and fill → dry mass, water, heating value
- Combustion stages (ignition, drying, gasification, char burnout) with energy released per stage
- Chimney draught from height, diameter, construction and outdoor temperature; wall warm-up, dew point and condensation
- Flue gas heat exchanger, efficiency, excess air, soot build-up
- Return-temperature protection, stratified buffer tank, expansion vessel pressure, thermal safety
- Weather-compensated radiator and underfloor circuits, slab and house thermal mass

Published boiler data (25 kW, 150 mm flue, logs to 55 cm, fuel moisture ≤ 25 %, mandatory buffer tank) is used where available; everything else is a calibrated estimate. It is an educational model, not a design tool, and is not affiliated with Centrometal.

## Run locally

No build step — static files with ES modules:

```sh
python3 -m http.server 8000
```

`node test/physics.test.mjs` prints a headless sanity run of the model. Append `?autostart&speed=300&warp=2` to the URL to start lit and skip ahead two hours.

Created in [T3 Code](https://t3.codes).
