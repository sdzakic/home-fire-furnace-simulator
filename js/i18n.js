const hr = {
  'app.title': 'Simulator loženja drvima',
  'app.sub': 'Pirolitički kotao 25 kW · dimnjak · spremnik · radijatori · podno grijanje',
  'app.theme': 'Svijetla / tamna tema',
  'app.lang': 'Jezik',

  'btn.ignite': 'Zapali vatru', 'btn.burning': 'Gori…', 'btn.addWood': 'Dodaj drva', 'btn.pause': 'Pauza', 'btn.resume': 'Nastavi',
  'btn.reset': 'Ispočetka', 'btn.clean': 'Očisti izmjenjivač', 'btn.speed': 'Brzina', 'btn.time': 'Vrijeme',

  'stage.idle': 'Spremno za potpalu', 'stage.ignition': 'Potpala', 'stage.drying': 'Sušenje', 'stage.gasification': 'Rasplinjavanje',
  'stage.char': 'Dogorijevanje žara', 'stage.out': 'Ugašeno',
  'stageShort.idle': 'spremno', 'stageShort.ignition': 'potpala', 'stageShort.drying': 'sušenje', 'stageShort.gasification': 'piroliza',
  'stageShort.char': 'žar', 'stageShort.out': 'ugašeno',
  'stageDesc.idle': 'Ložište je napunjeno. Klikni na donja vrata kotla ili na „Zapali vatru”.',
  'stageDesc.ignition': 'Potpala zagrijava ložište. Ventilator kreće, dimnjak je još hladan pa je propuh slab.',
  'stageDesc.drying': 'Voda iz drva isparava i troši toplinu vatre (2,44 MJ po litri). Što su drva vlažnija, ova faza traje dulje i daje manje snage.',
  'stageDesc.gasification': 'Drvo se raspada na drvni plin koji kroz sapnicu ulazi u donju komoru i izgara na preko 1000 °C. Ovdje nastaje najveći dio energije.',
  'stageDesc.char': 'Hlapljive tvari su izgorjele; ostaje drveni ugljen koji mirno dogorijeva sa sve manjom snagom.',
  'stageDesc.out': 'Vatra je ugašena. Kuću sada grije toplina spremljena u akumulacijskom spremniku.',
  'stage.released': 'oslobođeno', 'stage.toWater': 'u vodu', 'stage.duration': 'trajanje',

  'kpi.fuelPower': 'Snaga goriva', 'kpi.toWater': 'Toplina u vodu', 'kpi.eta': 'Stupanj djelovanja', 'kpi.firebox': 'Ložište',
  'kpi.flue': 'Dimni plinovi', 'kpi.draft': 'Propuh dimnjaka', 'kpi.lambda': 'Pretičak zraka λ', 'kpi.boiler': 'Voda u kotlu',
  'kpi.tank': 'Spremnik', 'kpi.room': 'Soba', 'kpi.wood': 'Preostalo drva', 'kpi.house': 'Grijanje / gubici kuće',
  'kpi.dew': 'Rosište dimnih plinova', 'kpi.fan': 'Ventilator', 'kpi.o2': 'O₂', 'kpi.charged': 'napunjen', 'kpi.cond': 'kondenzacija!',
  'kpi.ok': 'u redu', 'kpi.low': 'preslab', 'kpi.high': 'prejak', 'kpi.avg': 'prosjek', 'kpi.standby': 'mirovanje',

  'g.fuel': 'Drva', 'g.chimney': 'Dimnjak', 'g.weather': 'Vrijeme i kuća', 'g.heating': 'Sustav grijanja', 'g.control': 'Regulacija kotla',
  'c.wood': 'Vrsta drva', 'c.moisture': 'Vlažnost drva', 'c.fill': 'Napunjenost ložišta',
  'c.chHeight': 'Visina dimnjaka', 'c.chDiameter': 'Promjer dimnjaka', 'c.chType': 'Izvedba dimnjaka', 'c.regulator': 'Regulator propuha (20 Pa)',
  'c.outdoor': 'Vanjska temperatura', 'c.area': 'Površina kuće', 'c.insulation': 'Izolacija kuće', 'c.setpoint': 'Željena temperatura',
  'c.tankVol': 'Akumulacijski spremnik', 'c.tankStart': 'Početna temperatura spremnika', 'c.radCount': 'Broj radijatora',
  'c.radPower': 'Snaga radijatora (75/65/20 °C)', 'c.floorArea': 'Podno grijanje', 'c.dhw': 'Spremnik tople vode (PTV 200 L)',
  'c.auto': 'Automatika (lambda sonda)', 'c.fan': 'Ventilator', 'c.primary': 'Udio primarnog zraka', 'c.boilerSet': 'Zadana temperatura kotla',
  'c.none': 'nema',

  'wood.beech': 'Bukva', 'wood.oak': 'Hrast', 'wood.hornbeam': 'Grab', 'wood.ash': 'Jasen', 'wood.locust': 'Bagrem',
  'wood.birch': 'Breza', 'wood.spruce': 'Smreka', 'wood.poplar': 'Topola',
  'chType.insulated': 'Izolirani inox', 'chType.ceramic': 'Keramički (šamot)', 'chType.brick': 'Zidani, neizoliran',
  'ins.poor': 'Slaba (stara kuća)', 'ins.average': 'Prosječna', 'ins.good': 'Dobra (fasada 10+ cm)', 'ins.passive': 'Niskoenergetska',

  'm.kiln': 'Vrlo suha drva — idealno.', 'm.seasoned': 'Suha drva, sušena 2 godine — preporučeno.',
  'm.ok': 'Na granici: proizvođač dopušta najviše 25 %.', 'm.damp': 'Prevlažno: manje snage, više katrana i čađe.',
  'm.green': 'Sirova drva: vatra se vjerojatno neće održati.',
  'h.fuel': 'Punjenje: {wet} kg drva = {dry} kg suhe tvari + {water} L vode · {kwh} kWh ({kwhkg} kWh/kg)',
  'h.fuelNext': 'Promjene vrijede za sljedeće punjenje.',
  'h.buffer': 'Preporuka za 25 kW: najmanje {v} L (50 L/kW).',
  'h.tankStart': 'Primjenjuje se nakon „Ispočetka”.',
  'h.manual': 'Ručno: previše primarnog zraka → λ < 1, dim i čađa.',
  'h.rad': 'Instalirano {kw} kW radijatora · potrebno pri {t} °C: {need} kW',
  'h.chimney': 'Ustaljeno stanje: propuh {d} Pa · izlaz {te} °C · brzina {v} m/s',

  'ev.ignite': 'Vatra je zapaljena.', 'ev.pumpOn': 'Kotao je dosegao 62 °C — kreće pumpa i punjenje spremnika.',
  'ev.safety': 'Pregrijavanje! Termički osigurač hladi kotao (≥ 95 °C).', 'ev.standby': 'Spremnik je pun — kotao gasi ventilator i tinja (loše izgaranje).',
  'ev.condensation': 'Dimnjak je hladniji od rosišta — kondenzacija i katran u dimnjaku.', 'ev.lowDraft': 'Preslab propuh: kotao ne može postići punu snagu.',
  'ev.smokeSpill': 'Dim izlazi kroz vrata — propuh je preslab za otvaranje.', 'ev.tankFull': 'Spremnik je progrijan do dna.',
  'ev.wetWood': 'Drva su prevlažna: plamen je hladan, raste udio neizgorenih plinova.', 'ev.burnout': 'Punjenje je izgorjelo.',
  'ev.died': 'Vatra se ugasila prije nego što je drvo izgorjelo.', 'ev.cleaned': 'Izmjenjivač i dimnjak su očišćeni.', 'ev.added': 'Dodano {kg} kg drva.',
  'ev.full': 'Ložište je već puno.',

  's.live': 'Uživo', 's.power': 'Snaga', 's.temps': 'Temperature vode', 's.gas': 'Temperature plinova',
  's.balance': 'Kamo odlazi energija drva', 's.stages': 'Energija po fazama gorenja', 's.log': 'Dnevnik',
  'ser.fuel': 'Gorivo', 'ser.water': 'U vodu', 'ser.house': 'U kuću', 'ser.boiler': 'Kotao', 'ser.top': 'Spremnik vrh',
  'ser.bottom': 'Spremnik dno', 'ser.room': 'Soba', 'ser.firebox': 'Ložište', 'ser.flue': 'Dimni plinovi', 'ser.exit': 'Vrh dimnjaka',
  'bal.useful': 'Korisna toplina', 'bal.flue': 'Dimnjak (osjetna)', 'bal.latent': 'Isparavanje vode', 'bal.unburnt': 'Neizgoreno', 'bal.jacket': 'Oplata kotla',
  'bal.empty': 'Zapali vatru i ovdje će se pojaviti bilanca energije.',
  'soot': 'Čađa na izmjenjivaču', 'creosote': 'Katran u dimnjaku',

  's.analysis': 'Proračuni', 's.analysisSub': 'Izračunato istim modelom za tvoje trenutne postavke — mijenjaj klizače i gledaj kako se krivulje pomiču.',
  'a.moisture': 'Koliko topline daje isto punjenje, ovisno o vlažnosti', 'a.moistureSub': 'Cijelo izgaranje jednog punjenja ({wood}). Isti volumen drva, sve više vode u njemu.',
  'a.useful': 'Korisna toplina', 'a.inWood': 'Energija u drvu (donja ogrjevna)', 'a.now': 'sada',
  'a.chimney': 'Propuh dimnjaka ovisno o visini', 'a.chimneySub': 'Ustaljeno stanje pri nazivnoj snazi, promjer {d} mm, {type}. Kotao traži približno 15–25 Pa.',
  'a.band': 'radno područje', 'a.outside': 'vani',
  'a.water': 'Koliko vode jedno punjenje zagrije na 80 °C', 'a.waterSub': 'Korisna toplina ovog punjenja: {kwh} kWh. Tvoj spremnik od {v} L time se zagrije za {dt} °C.',
  'a.startT': 'Početna temperatura vode', 'a.litres': 'Litara do 80 °C', 'a.tanks': 'Tvojih spremnika',
  'a.outdoor': 'Koliko dugo jedno punjenje grije kuću', 'a.outdoorSub': 'Kuća {area} m², {ins}, {set} °C u sobi.',
  'a.tout': 'Vani', 'a.demand': 'Potreba kuće', 'a.hours': 'Jedno punjenje pokriva', 'a.loads': 'Punjenja na dan', 'a.kgday': 'Drva na dan',
  'a.computing': 'Računam…', 'a.wontBurn': 'ne gori',

  's.components': 'Dijelovi sustava',
  'comp.boiler': 'Pirolitički kotao 25 kW', 'comp.boilerD': 'Drva se u gornjoj komori suše i rasplinjavaju; plin kroz sapnicu ulazi u donju komoru gdje izgara s sekundarnim zrakom. Vatra gori prema dolje.',
  'comp.lambda': 'Lambda sonda i ventilator', 'comp.lambdaD': 'Sonda mjeri kisik u dimnim plinovima, a regulacija podešava zrak da pretičak ostane oko λ = 1,4.',
  'comp.chimney': 'Dimnjak', 'comp.chimneyD': 'Topli plinovi su lakši od vanjskog zraka i stvaraju propuh: Δp = g·H·(ρvani − ρdim). Viši i topliji dimnjak vuče jače, hladan zidani kondenzira.',
  'comp.regulator': 'Regulator propuha', 'comp.regulatorD': 'Klapna koja pušta zrak iz kotlovnice u dimnjak kad je propuh prejak, da kotao ne „pobjegne”.',
  'comp.return': 'Zaštita povrata (60 °C)', 'comp.returnD': 'Miješajući ventil vraća dio vruće vode natrag u kotao dok povrat ne prijeđe 60 °C. Bez toga kotao kondenzira i hrđa.',
  'comp.buffer': 'Akumulacijski spremnik', 'comp.bufferD': 'Kotao radi punom snagom i najčišće, a višak topline sprema se u slojeve vode. Obavezan za ovaj tip kotla.',
  'comp.vessel': 'Ekspanzijska posuda', 'comp.vesselD': 'Voda se grijanjem širi (oko 3,5 % od 20 do 90 °C). Posuda preuzima taj volumen; za ovaj sustav treba oko {v} L.',
  'comp.safety': 'Sigurnosni ventil i termički osigurač', 'comp.safetyD': 'Ventil otvara na 2,5 bar. Termički osigurač na 95 °C pušta hladnu vodu kroz izmjenjivač u kotlu.',
  'comp.mixing': 'Miješajući ventili i pumpe', 'comp.mixingD': 'Svaki krug miješa vodu iz spremnika s povratom na temperaturu koju traži vanjska temperatura (krivulja grijanja).',
  'comp.rad': 'Radijatori', 'comp.radD': 'Snaga pada s temperaturom vode: Q = Qn·(ΔT/50)^1,3. Pri 50 °C radijator daje tek polovicu nazivne snage.',
  'comp.floor': 'Podno grijanje', 'comp.floorD': 'Radi s 30–40 °C i sporo reagira jer grije betonsku ploču. Iz istog spremnika izvlači toplinu puno dulje od radijatora.',
  'comp.dhw': 'Spremnik PTV', 'comp.dhwD': 'Potrošna topla voda grije se spiralom iz vrha akumulacijskog spremnika.',

  'sc.room': 'soba', 'sc.safety': 'SV', 'sc.dhw': 'PTV', 'sc.outside': 'vani', 'sc.draft': 'propuh', 'sc.boiler': 'kotao',
  'sc.buffer': 'akumulacijski spremnik', 'sc.floor': 'podno', 'sc.hitTop': 'Otvori vrata i dodaj drva', 'sc.hitBot': 'Zapali vatru',

  'foot': 'Edukativni model, nije projektantski alat. Polazi od javnih podataka za Centrometal BioTec-L 25 (25 kW, dimnjača 150 mm, cjepanice do 55 cm, vlažnost drva do 25 %, obavezan akumulacijski spremnik); ostale veličine su procjene modela. Stranica nije povezana s tvrtkom Centrometal.',
  'u.h': 'h', 'u.min': 'min',
};

const en = {
  'app.title': 'Wood Boiler Simulator',
  'app.sub': '25 kW log-gasification boiler · chimney · buffer tank · radiators · underfloor heating',
  'app.theme': 'Light / dark theme',
  'app.lang': 'Language',

  'btn.ignite': 'Light the fire', 'btn.burning': 'Burning…', 'btn.addWood': 'Add wood', 'btn.pause': 'Pause', 'btn.resume': 'Resume',
  'btn.reset': 'Start over', 'btn.clean': 'Clean heat exchanger', 'btn.speed': 'Speed', 'btn.time': 'Time',

  'stage.idle': 'Ready to light', 'stage.ignition': 'Ignition', 'stage.drying': 'Drying', 'stage.gasification': 'Gasification',
  'stage.char': 'Char burnout', 'stage.out': 'Fire out',
  'stageShort.idle': 'ready', 'stageShort.ignition': 'ignition', 'stageShort.drying': 'drying', 'stageShort.gasification': 'gasification',
  'stageShort.char': 'embers', 'stageShort.out': 'out',
  'stageDesc.idle': 'The firebox is loaded. Click the lower boiler door or “Light the fire”.',
  'stageDesc.ignition': 'Kindling heats the firebox. The fan starts; the chimney is still cold, so the draught is weak.',
  'stageDesc.drying': 'Water in the wood evaporates and takes heat from the fire (2.44 MJ per litre). The wetter the wood, the longer this lasts and the less power you get.',
  'stageDesc.gasification': 'Wood breaks down into wood gas, which passes through the nozzle into the lower chamber and burns above 1000 °C. Most of the energy is released here.',
  'stageDesc.char': 'The volatiles are gone; the remaining charcoal burns quietly with falling power.',
  'stageDesc.out': 'The fire is out. The house is now heated from the buffer tank.',
  'stage.released': 'released', 'stage.toWater': 'to water', 'stage.duration': 'duration',

  'kpi.fuelPower': 'Fuel power', 'kpi.toWater': 'Heat to water', 'kpi.eta': 'Efficiency', 'kpi.firebox': 'Firebox',
  'kpi.flue': 'Flue gas', 'kpi.draft': 'Chimney draught', 'kpi.lambda': 'Excess air λ', 'kpi.boiler': 'Boiler water',
  'kpi.tank': 'Buffer tank', 'kpi.room': 'Room', 'kpi.wood': 'Wood left', 'kpi.house': 'Heating / house loss',
  'kpi.dew': 'Flue gas dew point', 'kpi.fan': 'Fan', 'kpi.o2': 'O₂', 'kpi.charged': 'charged', 'kpi.cond': 'condensing!',
  'kpi.ok': 'ok', 'kpi.low': 'too weak', 'kpi.high': 'too strong', 'kpi.avg': 'average', 'kpi.standby': 'standby',

  'g.fuel': 'Wood', 'g.chimney': 'Chimney', 'g.weather': 'Weather and house', 'g.heating': 'Heating system', 'g.control': 'Boiler control',
  'c.wood': 'Wood species', 'c.moisture': 'Wood moisture', 'c.fill': 'Firebox fill',
  'c.chHeight': 'Chimney height', 'c.chDiameter': 'Chimney diameter', 'c.chType': 'Chimney construction', 'c.regulator': 'Draught regulator (20 Pa)',
  'c.outdoor': 'Outdoor temperature', 'c.area': 'House floor area', 'c.insulation': 'House insulation', 'c.setpoint': 'Room setpoint',
  'c.tankVol': 'Buffer tank', 'c.tankStart': 'Tank starting temperature', 'c.radCount': 'Number of radiators',
  'c.radPower': 'Radiator output (75/65/20 °C)', 'c.floorArea': 'Underfloor heating', 'c.dhw': 'Hot water cylinder (DHW 200 L)',
  'c.auto': 'Automatic (lambda probe)', 'c.fan': 'Fan', 'c.primary': 'Primary air share', 'c.boilerSet': 'Boiler setpoint',
  'c.none': 'none',

  'wood.beech': 'Beech', 'wood.oak': 'Oak', 'wood.hornbeam': 'Hornbeam', 'wood.ash': 'Ash', 'wood.locust': 'Black locust',
  'wood.birch': 'Birch', 'wood.spruce': 'Spruce', 'wood.poplar': 'Poplar',
  'chType.insulated': 'Insulated stainless', 'chType.ceramic': 'Ceramic liner', 'chType.brick': 'Brick, uninsulated',
  'ins.poor': 'Poor (old house)', 'ins.average': 'Average', 'ins.good': 'Good (10+ cm façade)', 'ins.passive': 'Low-energy',

  'm.kiln': 'Very dry wood — ideal.', 'm.seasoned': 'Dry wood, seasoned two years — recommended.',
  'm.ok': 'Borderline: the manufacturer allows 25 % at most.', 'm.damp': 'Too wet: less power, more tar and soot.',
  'm.green': 'Green wood: the fire will probably not sustain itself.',
  'h.fuel': 'Load: {wet} kg of wood = {dry} kg dry matter + {water} L water · {kwh} kWh ({kwhkg} kWh/kg)',
  'h.fuelNext': 'Changes apply to the next load.',
  'h.buffer': 'Recommended for 25 kW: at least {v} L (50 L/kW).',
  'h.tankStart': 'Applies after “Start over”.',
  'h.manual': 'Manual: too much primary air → λ < 1, smoke and soot.',
  'h.rad': '{kw} kW of radiators installed · needed at {t} °C: {need} kW',
  'h.chimney': 'Steady state: draught {d} Pa · exit {te} °C · velocity {v} m/s',

  'ev.ignite': 'Fire lit.', 'ev.pumpOn': 'Boiler reached 62 °C — the pump starts charging the tank.',
  'ev.safety': 'Overheating! The thermal safety valve is cooling the boiler (≥ 95 °C).', 'ev.standby': 'Tank is full — the boiler stops the fan and smoulders (poor combustion).',
  'ev.condensation': 'Chimney is colder than the dew point — condensation and tar in the flue.', 'ev.lowDraft': 'Draught too weak: the boiler cannot reach full power.',
  'ev.smokeSpill': 'Smoke spills from the door — draught is too weak to open it.', 'ev.tankFull': 'Tank is heated through to the bottom.',
  'ev.wetWood': 'Wood is too wet: the flame is cold and unburnt gases rise.', 'ev.burnout': 'The load has burnt out.',
  'ev.died': 'The fire went out before the wood was consumed.', 'ev.cleaned': 'Heat exchanger and chimney cleaned.', 'ev.added': 'Added {kg} kg of wood.',
  'ev.full': 'The firebox is already full.',

  's.live': 'Live', 's.power': 'Power', 's.temps': 'Water temperatures', 's.gas': 'Gas temperatures',
  's.balance': 'Where the wood’s energy goes', 's.stages': 'Energy by combustion stage', 's.log': 'Log',
  'ser.fuel': 'Fuel', 'ser.water': 'To water', 'ser.house': 'To house', 'ser.boiler': 'Boiler', 'ser.top': 'Tank top',
  'ser.bottom': 'Tank bottom', 'ser.room': 'Room', 'ser.firebox': 'Firebox', 'ser.flue': 'Flue gas', 'ser.exit': 'Chimney top',
  'bal.useful': 'Useful heat', 'bal.flue': 'Chimney (sensible)', 'bal.latent': 'Evaporating water', 'bal.unburnt': 'Unburnt', 'bal.jacket': 'Boiler casing',
  'bal.empty': 'Light the fire and the energy balance appears here.',
  'soot': 'Soot on heat exchanger', 'creosote': 'Tar in chimney',

  's.analysis': 'Calculations', 's.analysisSub': 'Computed with the same model for your current settings — move the sliders and watch the curves shift.',
  'a.moisture': 'Heat from the same load, depending on moisture', 'a.moistureSub': 'Complete burn of one load ({wood}). Same volume of wood, more and more water in it.',
  'a.useful': 'Useful heat', 'a.inWood': 'Energy in the wood (lower heating value)', 'a.now': 'now',
  'a.chimney': 'Chimney draught by height', 'a.chimneySub': 'Steady state at nominal output, diameter {d} mm, {type}. The boiler wants roughly 15–25 Pa.',
  'a.band': 'working range', 'a.outside': 'outside',
  'a.water': 'How much water one load heats to 80 °C', 'a.waterSub': 'Useful heat of this load: {kwh} kWh. That raises your {v} L tank by {dt} °C.',
  'a.startT': 'Starting water temperature', 'a.litres': 'Litres to 80 °C', 'a.tanks': 'Of your tanks',
  'a.outdoor': 'How long one load heats the house', 'a.outdoorSub': 'House {area} m², {ins}, {set} °C indoors.',
  'a.tout': 'Outside', 'a.demand': 'House demand', 'a.hours': 'One load covers', 'a.loads': 'Loads per day', 'a.kgday': 'Wood per day',
  'a.computing': 'Computing…', 'a.wontBurn': 'will not burn',

  's.components': 'System components',
  'comp.boiler': '25 kW gasification boiler', 'comp.boilerD': 'Logs dry and gasify in the upper chamber; the gas passes through a nozzle into the lower chamber, where it burns with secondary air. The fire burns downwards.',
  'comp.lambda': 'Lambda probe and fan', 'comp.lambdaD': 'The probe measures oxygen in the flue gas and the controller trims the air to hold excess air near λ = 1.4.',
  'comp.chimney': 'Chimney', 'comp.chimneyD': 'Hot gas is lighter than outdoor air and creates draught: Δp = g·H·(ρout − ρflue). A taller, warmer chimney pulls harder; a cold brick one condenses.',
  'comp.regulator': 'Draught regulator', 'comp.regulatorD': 'A flap that lets boiler-room air into the chimney when the draught is too strong, so the boiler does not run away.',
  'comp.return': 'Return protection (60 °C)', 'comp.returnD': 'A mixing valve sends some hot water back to the boiler until the return exceeds 60 °C. Without it the boiler condenses and corrodes.',
  'comp.buffer': 'Buffer tank', 'comp.bufferD': 'The boiler runs at full, clean output and surplus heat is stored in layers of water. Mandatory for this type of boiler.',
  'comp.vessel': 'Expansion vessel', 'comp.vesselD': 'Water expands when heated (about 3.5 % from 20 to 90 °C). The vessel absorbs that volume; this system needs about {v} L.',
  'comp.safety': 'Safety valve and thermal protection', 'comp.safetyD': 'The valve opens at 2.5 bar. At 95 °C the thermal valve runs cold water through a coil in the boiler.',
  'comp.mixing': 'Mixing valves and pumps', 'comp.mixingD': 'Each circuit blends tank water with its return to the temperature the outdoor temperature calls for (heating curve).',
  'comp.rad': 'Radiators', 'comp.radD': 'Output falls with water temperature: Q = Qn·(ΔT/50)^1.3. At 50 °C a radiator gives only half its rated output.',
  'comp.floor': 'Underfloor heating', 'comp.floorD': 'Runs at 30–40 °C and responds slowly because it heats a concrete slab. It can draw heat from the same tank far longer than radiators.',
  'comp.dhw': 'Hot water cylinder', 'comp.dhwD': 'Domestic hot water is heated by a coil fed from the top of the buffer tank.',

  'sc.room': 'room', 'sc.safety': 'SV', 'sc.dhw': 'DHW', 'sc.outside': 'outside', 'sc.draft': 'draught', 'sc.boiler': 'boiler',
  'sc.buffer': 'buffer tank', 'sc.floor': 'floor', 'sc.hitTop': 'Open the door and add wood', 'sc.hitBot': 'Light the fire',

  'foot': 'An educational model, not a design tool. It starts from published data for the Centrometal BioTec-L 25 (25 kW, 150 mm flue, logs up to 55 cm, wood moisture up to 25 %, buffer tank mandatory); all other quantities are model estimates. This site is not affiliated with Centrometal.',
  'u.h': 'h', 'u.min': 'min',
};

const DICT = { hr, en };
let lang = 'hr';
try { const s = localStorage.getItem('lang'); if (s === 'en' || s === 'hr') lang = s; } catch { /* storage unavailable */ }
const nf = {};

export function t(key, vars) {
  let s = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
t.num = (x, d = 0) => {
  if (x == null || !isFinite(x)) return '–';
  const k = lang + d;
  nf[k] ??= new Intl.NumberFormat(lang === 'hr' ? 'hr-HR' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  const v = Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x;
  return nf[k].format(v).replace('-', '−');
};
t.lang = () => lang;
t.setLang = (l) => {
  lang = l;
  try { localStorage.setItem('lang', l); } catch { /* storage unavailable */ }
  document.documentElement.lang = l;
  applyStatic();
};
export function applyStatic(root = document) {
  for (const n of root.querySelectorAll('[data-i18n]')) n.textContent = t(n.dataset.i18n);
  for (const n of root.querySelectorAll('[data-i18n-title]')) n.setAttribute('title', t(n.dataset.i18nTitle));
  for (const n of root.querySelectorAll('[data-i18n-label]')) n.setAttribute('aria-label', t(n.dataset.i18nLabel));
}
