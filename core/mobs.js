// -- monster move pools -----------------------------------------------------------
// Every template gets a small kit instead of a plain attack: a telegraphed
// "signature" move (what they release after winding up — see combat_engine.js's
// charge system) plus a cooldown-gated "utility" move they can reach for on any
// untelegraphed turn. Bosses additionally get a one-time "phase" move that
// triggers once their HP drops below a threshold, so each boss fight has its
// own shape instead of just bigger numbers.
// kind: 'strike' (damage roll via resolveAttack, extras optional),
//       'buff' (self stat boost, permanent for the fight),
//       'heal' (self HP restore, % of max HP),
//       'debuff' (weakens the player's stat, no damage).
// strike extras: forcedElement, debuffStat/debuffValue, lifestealPct, dotPct/dotTurns, stunChance.
const Strike = (name, power, extra={}) => ({name, kind:'strike', power, ...extra});
const Buff   = (name, stat, value)     => ({name, kind:'buff', buffStat:stat, buffValue:value});
const Heal   = (name, healPct)         => ({name, kind:'heal', healPct});
const Debuff = (name, stat, value)     => ({name, kind:'debuff', debuffStat:stat, debuffValue:value});

// -- monster templates -----------------------------------------------------------
// baseline values are PER DUNGEON LEVEL multipliers; combat scales them up.
const MONSTER_TEMPLATES = [
  {id:'rat_swarm',    name:'Ravenous Rat Swarm',   element:'poison',    icon:'🐀', atk:0.9, def:0.6, matk:0.2, mdef:0.4, spd:1.2, flavor:'a chittering tide of teeth and fur',
    moves:[Strike('Ravenous Swarm',1.6,{dotPct:18,dotTurns:2}), Buff('Skittering Frenzy','spd',22)]},
  {id:'crypt_wraith', name:'Crypt Wraith',         element:'dark',      icon:'👻', atk:0.6, def:0.5, matk:1.1, mdef:0.9, spd:1.0, flavor:'a cold shape that drinks the torchlight',
    moves:[Strike('Torchlight Drain',1.55,{lifestealPct:35}), Debuff('Chilling Grasp','hitRes',18)]},
  {id:'goblin_raider',name:'Goblin Raider',        element:'physical',  icon:'🗡️', atk:1.1, def:0.8, matk:0.2, mdef:0.4, spd:1.0, flavor:'snarling, rusted blade in hand',
    moves:[Strike('Reckless Slash',1.75), Buff('Battle Snarl','atk',20)]},
  {id:'frost_stalker',name:'Frost Stalker',        element:'ice',       icon:'🧊', atk:0.9, def:0.9, matk:0.7, mdef:0.9, spd:1.1, flavor:'breath fogging in air gone suddenly cold',
    moves:[Strike('Frozen Fang',1.6,{debuffStat:'spd',debuffValue:22}), Strike('Icy Swipe',0.9,{debuffStat:'hitEff',debuffValue:10})]},
  {id:'ember_imp',    name:'Ember Imp',            element:'fire',      icon:'👹', atk:0.8, def:0.5, matk:1.2, mdef:0.6, spd:1.3, flavor:'giggling, wreathed in guttering flame',
    moves:[Strike('Guttering Blast',1.65), Buff('Impish Cackle','matk',22)]},
  {id:'storm_harpy',  name:'Storm Harpy',          element:'lightning', icon:'🦅', atk:1.0, def:0.6, matk:0.9, mdef:0.6, spd:1.4, flavor:'shrieking on wings that crackle with static',
    moves:[Strike('Static Dive',1.6,{stunChance:16}), Buff('Wing Surge','spd',28)]},
  {id:'stone_golem',  name:'Stone Golem',          element:'physical',  icon:'🗿', atk:1.2, def:1.6, matk:0.1, mdef:1.0, spd:0.5, flavor:'grinding forward, slow and immense',
    moves:[Strike('Grinding Slam',1.9,{debuffStat:'def',debuffValue:16}), Buff('Harden',  'def',26)]},
  {id:'shade_priest',name:'Shade Priest',          element:'dark',     icon:'🕯️', atk:0.5, def:0.7, matk:1.3, mdef:1.1, spd:0.8, flavor:'chanting something better left unheard',
    moves:[Strike('Unspoken Rite',1.6), Heal('Whispered Ward',18)]},
  {id:'venom_spider', name:'Venom Spider',         element:'poison',    icon:'🕷️', atk:1.0, def:0.7, matk:0.3, mdef:0.5, spd:1.2, flavor:'eight eyes catching the last of the light',
    moves:[Strike('Eightfold Bite',1.5,{dotPct:20,dotTurns:3}), Debuff('Web Snare','spd',24)]},
  {id:'holy_construct',name:'Broken Sentinel',     element:'holy',      icon:'⚜️', atk:1.1, def:1.2, matk:0.8, mdef:1.2, spd:0.7, flavor:'a temple guardian, still faithful, still armed',
    moves:[Strike("Sentinel's Judgment",1.7), Buff('Temple Ward','def',22)]},
  {id:'plague_rat',   name:'Plague-Bearer',        element:'poison',    icon:'🦠', atk:0.7, def:0.5, matk:0.6, mdef:0.5, spd:0.9, flavor:'sores weeping something that used to be blood',
    moves:[Strike('Weeping Sores',1.5,{dotPct:22,dotTurns:3}), Debuff('Fetid Cloud','hitEff',18)]},
  {id:'bog_witch',    name:'Bog Witch',            element:'poison',    icon:'🧙', atk:0.6, def:0.6, matk:1.3, mdef:0.9, spd:0.9, flavor:'muttering curses into the reeking mist',
    moves:[Strike('Reeking Curse',1.55,{debuffStat:'matk',debuffValue:18}), Heal("Mire's Blessing",20)]},
  {id:'iron_wraith',  name:'Iron Wraith',          element:'dark',      icon:'⚙️', atk:1.2, def:1.1, matk:0.5, mdef:0.8, spd:0.9, flavor:'a suit of armor that walks alone now',
    moves:[Strike('Hollow Onslaught',1.7), Buff('Rust and Resolve','def',20)]},
  {id:'sand_reaper',  name:'Sand Reaper',          element:'physical',  icon:'🏜️', atk:1.3, def:0.7, matk:0.2, mdef:0.5, spd:1.3, flavor:'a scythe-limbed thing that swims through dust',
    moves:[Strike('Scything Dust',1.75,{debuffStat:'hitRes',debuffValue:16}), Buff('Dust Veil','spd',24)]},
  {id:'gravemoth_swarm',name:'Gravemoth Swarm',     element:'dark',      icon:'🦋', atk:0.8, def:0.5, matk:0.9, mdef:0.6, spd:1.3, flavor:'wings of ash-dust that smother torchlight as they pass',
    moves:[Strike('Ashwing Storm',1.55,{dotPct:16,dotTurns:2}), Debuff('Smothering Cloud','hitEff',16)]},
  {id:'rust_automaton',name:'Rusted Automaton',     element:'lightning', icon:'🤖', atk:1.1, def:1.3, matk:0.6, mdef:0.9, spd:0.6, flavor:'clockwork limbs sparking where the plating has split',
    moves:[Strike('Overcharged Piston',1.8,{stunChance:14}), Buff('Spark Coils','atk',18)]},
  {id:'coal_wretch',  name:'Coal Wretch',           element:'fire',      icon:'🔥', atk:1.0, def:0.6, matk:0.9, mdef:0.5, spd:0.9, flavor:'a huddled shape wreathed in embers that never quite go out',
    moves:[Strike('Ember Collapse',1.6,{dotPct:15,dotTurns:2}), Heal('Smoldering Recovery',16)]},
  {id:'chill_revenant',name:'Chill Revenant',       element:'ice',       icon:'🥶', atk:0.9, def:0.8, matk:1.0, mdef:1.0, spd:0.8, flavor:'a drowned soul who remembers only the cold',
    moves:[Strike('Drowned Memory',1.6,{debuffStat:'atk',debuffValue:18}), Debuff('Cold Grip','spd',20)]},
  {id:'thornback_boar',name:'Thornback Boar',       element:'physical',  icon:'🐗', atk:1.4, def:1.0, matk:0.1, mdef:0.5, spd:1.0, flavor:'a tusked bulk crashing through the dark on instinct alone',
    moves:[Strike('Tusked Charge',1.85), Buff('Bristling Rage','atk',24)]},
  {id:'cave_leech',   name:'Cave Leech',            element:'poison',    icon:'🪱', atk:0.7, def:0.6, matk:0.4, mdef:0.5, spd:0.7, flavor:'segmented and patient, latching before it is ever seen',
    moves:[Strike('Latching Bite',1.5,{lifestealPct:40}), Debuff('Numbing Venom','hitRes',18)]},
  {id:'ashen_monk',   name:'Ashen Monk',            element:'holy',      icon:'🙏', atk:0.9, def:0.9, matk:1.0, mdef:1.1, spd:0.9, flavor:'a robed figure chanting a vow it can no longer remember taking',
    moves:[Strike('Forgotten Vow',1.6), Heal('Ashen Meditation',22)]},
  {id:'static_wisp',  name:'Static Wisp',           element:'lightning', icon:'🔵', atk:0.6, def:0.4, matk:1.2, mdef:0.6, spd:1.5, flavor:'a crackling mote that hums louder the closer it drifts',
    moves:[Strike('Humming Discharge',1.55,{stunChance:18}), Buff('Charged Drift','spd',30)]},
  {id:'gloom_hound',  name:'Gloom Hound',           element:'dark',      icon:'🐺', atk:1.1, def:0.7, matk:0.4, mdef:0.6, spd:1.3, flavor:'eyes like dying coals, footsteps that make no sound',
    moves:[Strike('Silent Pounce',1.7,{lifestealPct:20}), Buff("Coal-Eyed Focus",'atk',18)]},
  {id:'root_horror',  name:'Root Horror',           element:'poison',    icon:'🌿', atk:0.8, def:1.1, matk:0.7, mdef:0.8, spd:0.5, flavor:'a tangle of bark and limb that was a tree, once, a long time ago',
    moves:[Strike('Choking Roots',1.55,{debuffStat:'spd',debuffValue:26}), Heal('Deep Bark Regrowth',18)]},
  {id:'glass_serpent',name:'Glass Serpent',         element:'ice',       icon:'🐍', atk:1.2, def:0.6, matk:0.6, mdef:0.6, spd:1.2, flavor:'scales like broken windowpane, hissing cracks with every coil',
    moves:[Strike('Shattering Coil',1.65,{debuffStat:'def',debuffValue:16}), Buff('Refracted Scales','spd',22)]},
  {id:'brimstone_imp',name:'Brimstone Imp',         element:'fire',      icon:'😈', atk:0.9, def:0.6, matk:1.1, mdef:0.6, spd:1.2, flavor:'small, gleeful, and entirely too pleased to see you',
    moves:[Strike('Gleeful Immolation',1.6,{dotPct:16,dotTurns:2}), Buff('Impish Delight','matk',20)]},
  {id:'hollow_knight',name:'Hollow Knight',         element:'physical',  icon:'🪖', atk:1.3, def:1.4, matk:0.2, mdef:0.9, spd:0.7, flavor:'armor standing at attention long after the man inside was lost',
    moves:[Strike('At Attention, No Longer',1.8,{debuffStat:'hitRes',debuffValue:16}), Buff('Standing Vigil','def',26)]},
];

const BOSS_TEMPLATES = [
  {id:'bone_tyrant',    name:'The Bone Tyrant',      title:'Warden of the Lower Crypts', element:'dark',      icon:'💀', atk:1.6, def:1.3, matk:1.0, mdef:1.1, spd:0.9, flavor:'a crowned skeleton, patient as the grave',
    moves:[Strike('Crown of Bone',2.0,{debuffStat:'def',debuffValue:20}), Debuff('Grave Patience','atk',16), Heal('Ossuary Reknit',25)]},
  {id:'inferno_hound',  name:'Cinderjaw',            title:'the Inferno Hound',          element:'fire',      icon:'🐕‍🦺', atk:1.7, def:1.0, matk:1.3, mdef:0.9, spd:1.3, flavor:'three heads, none of them merciful',
    moves:[Strike('Threefold Bite',2.1,{dotPct:20,dotTurns:2}), Buff('Triple Snarl','atk',22), Buff('Second Head Awakens','spd',35)]},
  {id:'glacier_queen',  name:'The Glacier Queen',     title:'Bride of the White Hollow',  element:'ice',       icon:'❄️', atk:1.2, def:1.5, matk:1.6, mdef:1.4, spd:0.8, flavor:'frost creeping outward with every breath',
    moves:[Strike('Absolute Frost',2.0,{debuffStat:'spd',debuffValue:30}), Strike('Frostbite Caress',1.1,{debuffStat:'hitRes',debuffValue:14}), Heal("Winter's Embrace",22)]},
  {id:'storm_titan',    name:'Kael the Stormbound',   title:'Titan of the Riven Sky',     element:'lightning', icon:'⚡', atk:1.6, def:1.1, matk:1.4, mdef:1.0, spd:1.4, flavor:'lightning arcing between his broken chains',
    moves:[Strike('Riven Sky Cataclysm',2.15,{stunChance:22}), Buff('Chainbound Fury','atk',20), Buff('Broken Chains','spd',40)]},
  {id:'venom_matriarch',name:'The Venom Matriarch',   title:'Mother of the Deep Web',     element:'poison',    icon:'🕸️', atk:1.4, def:1.2, matk:1.2, mdef:1.1, spd:1.1, flavor:'a thousand young stirring beneath her',
    moves:[Strike('Brood Eruption',2.0,{dotPct:25,dotTurns:3}), Debuff('Webbed Terrain','spd',22), Heal("Matriarch's Bounty",24)]},
  {id:'fallen_seraph',  name:'Ashariel',              title:'the Fallen Seraph',          element:'holy',      icon:'😇', atk:1.5, def:1.4, matk:1.5, mdef:1.3, spd:1.0, flavor:'wings burned black, halo still burning',
    moves:[Strike('Judgment of Ash',2.15,{debuffStat:'mdef',debuffValue:20}), Buff("Halo's Radiance",'matk',22), Heal('Seraphic Renewal',26)]},
  {id:'void_sovereign', name:'The Void Sovereign',    title:'That Which Waits Below',     element:'dark',      icon:'🌑', atk:1.8, def:1.6, matk:1.8, mdef:1.6, spd:1.2, flavor:'a silence with a shape and a hunger',
    moves:[Strike('Hunger of the Void',2.25,{lifestealPct:40}), Debuff('Consuming Silence','hitEff',20), Buff('The Void Stirs','atk',30)]},
  {id:'abyssal_leviathan',name:'The Abyssal Leviathan',title:'Drowner of the Deep Roads', element:'ice',       icon:'🐋', atk:1.5, def:1.7, matk:1.3, mdef:1.4, spd:0.7, flavor:'a vast shape surfacing where no water should be',
    moves:[Strike('Drowning Tide',2.1,{debuffStat:'def',debuffValue:24}), Strike('Crushing Wake',1.2,{stunChance:16}), Heal('Deep Regeneration',22)]},
  {id:'frozen_monarch', name:'The Frozen Monarch',   title:'Last King of the White Court',element:'lightning', icon:'👑', atk:1.7, def:1.3, matk:1.6, mdef:1.2, spd:1.1, flavor:'a crown of ice sparking with trapped lightning',
    moves:[Strike('Sparking Crown',2.15,{debuffStat:'mdef',debuffValue:20}), Buff('Regal Command','matk',24), Buff("Last King's Fury",'atk',30)]},
  {id:'rust_colossus', name:'The Rust Colossus',     title:'Last Engine of the Foundry', element:'lightning', icon:'⚙️', atk:1.8, def:1.7, matk:0.9, mdef:1.1, spd:0.6, flavor:'a shuddering giant of gears, still following its final order',
    moves:[Strike('Final Order',2.2,{debuffStat:'def',debuffValue:26}), Buff('Grinding Gears','def',24), Buff('Overdrive','atk',32)]},
  {id:'plague_mother',name:'The Plague Mother',      title:'Broodmatron of the Cave Deep',element:'poison',   icon:'🕷️', atk:1.4, def:1.2, matk:1.5, mdef:1.2, spd:1.0, flavor:'countless young stirring beneath a bloated, patient shell',
    moves:[Strike("Broodmatron's Wrath",2.0,{dotPct:26,dotTurns:3}), Heal('Spawning Renewal',18), Debuff('Suffocating Spores','hitEff',24)]},
  {id:'ash_patriarch',name:'The Ash Patriarch',      title:'Last Ember of the Foundry Line',element:'fire',   icon:'🔥', atk:1.7, def:1.2, matk:1.5, mdef:1.0, spd:1.1, flavor:'a burning silhouette that remembers being a man',
    moves:[Strike("Last Ember's Wrath",2.15,{dotPct:18,dotTurns:2}), Buff('Smoldering Resolve','atk',22), Heal("Ember's Rekindling",24)]},
  {id:'drowned_king', name:'The Drowned King',       title:'Regent of the Sunken Halls', element:'ice',       icon:'🌊', atk:1.5, def:1.5, matk:1.4, mdef:1.4, spd:0.9, flavor:'a crowned corpse who never quite finished dying',
    moves:[Strike("Regent's Drowning Grasp",2.1,{debuffStat:'spd',debuffValue:26}), Debuff('Sunken Dread','atk',18), Heal('Undying Regency',22)]},
  {id:'nightloom_weaver',name:'The Nightloom Weaver',title:'Spinner of the Final Dark',  element:'dark',      icon:'🕸️', atk:1.5, def:1.1, matk:1.7, mdef:1.2, spd:1.2, flavor:'threads of true night trailing from too many hands',
    moves:[Strike('Final Dark Thread',2.2,{debuffStat:'hitRes',debuffValue:22}), Debuff('Woven Shadow','spd',24), Buff('Unraveling Focus','matk',30)]},
  {id:'grand_reliquary',name:'The Grand Reliquary',  title:'Vessel of the Nameless Faith',element:'holy',     icon:'⛩️', atk:1.6, def:1.6, matk:1.6, mdef:1.5, spd:0.8, flavor:'a shattered idol animated by devotion nobody living still holds',
    moves:[Strike('Nameless Devotion',2.2,{debuffStat:'mdef',debuffValue:22}), Heal('Faithful Mending',20), Buff('Vessel Awakens','def',30)]},
];
