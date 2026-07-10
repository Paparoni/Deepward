// -- classes & skill trees ------------------------------------------------------------
// Each class has several branching lines across 3 tiers. Tier N requires a point
// already spent on that line's Tier N-1 skill. `kind:'active'` skills show up as
// combat buttons (see SKILL_ACTION_HANDLERS below). `kind:'passive'` skills apply
// automatically via computeDerived — either as a direct
// `effect:{type:'statBonus', stat, value}` (works for ANY stat id, including the
// elemental %-damage stats like 'fireDmg', 'poisonDmg', etc.) or by reusing an
// EFFECT_HANDLERS type (thorns, regenPerTurn, dodgeChance, lifesteal, ...) — the
// exact same system item traits use. To add a class: append an object here. To
// add a skill or branch: append to that class's skillTree array and, if it needs
// genuinely new combat behavior, add a case to SKILL_ACTION_HANDLERS instead of
// touching the engine.
const CLASSES = [
  {
    id:'warrior', name:'Warrior', icon:'⚔️',
    desc:'A frontline bruiser who trades finesse for raw ATK and grit.',
    statMods:{atk:4, def:3, hitRes:2},
    skillTree:[
      // --- Battlemaster branch (core offense) ---
      {id:'w_cleave',    tier:1, name:'Cleave',        kind:'active',  cost:1, requires:null,       manaCost:6,  action:'aoe',  power:0.7, desc:'Strike all enemies for 70% weapon damage.'},
      {id:'w_ironhide',  tier:1, name:'Iron Hide',      kind:'passive', cost:1, requires:null,       effect:{type:'statBonus', stat:'def', value:6}, desc:'+6 DEF, permanently.'},
      {id:'w_rally',     tier:2, name:'Battle Rally',   kind:'active',  cost:1, requires:'w_cleave', manaCost:10, action:'buff', buffStat:'atk', buffValue:20, desc:'+20% ATK for the rest of the battle.'},
      {id:'w_retaliate', tier:2, name:'Retaliation',    kind:'passive', cost:1, requires:'w_ironhide',effect:{type:'thorns', value:12}, desc:'Reflect 12% of damage taken back at attackers.'},
      {id:'w_finisher',  tier:3, name:'Finishing Blow', kind:'active',  cost:1, requires:'w_rally',  manaCost:16, action:'nuke', power:1.6, executeThreshold:20, desc:'160% weapon damage; instantly fells enemies below 20% HP.'},
      {id:'w_juggernaut',tier:3, name:'Juggernaut',     kind:'passive', cost:1, requires:'w_retaliate',effect:{type:'regenPerTurn', value:8}, desc:'Regenerate 8 HP at the start of every turn.'},
      // --- Guardian branch (control & mitigation) ---
      {id:'w_shieldbash',tier:1, name:'Shield Bash',    kind:'active',  cost:1, requires:null,        manaCost:5,  action:'debuff', debuffStat:'def', debuffValue:15, desc:"Crack the enemy's guard, reducing their DEF by 15% for the fight."},
      {id:'w_unbreakable',tier:2, name:'Unbreakable',   kind:'passive', cost:1, requires:'w_shieldbash', effect:{type:'damageCapPct', value:12}, desc:'Incoming hits can never deal more than 12% of your max HP at once.'},
      {id:'w_laststand', tier:3, name:'Last Stand',     kind:'active',  cost:1, requires:'w_unbreakable',manaCost:14, action:'heal', healPct:35, desc:'Dig in and recover 35% of your max HP.'},
      // --- Berserker branch (fire-fueled rage) ---
      {id:'wb_bloodlust',tier:1, name:'Bloodlust',      kind:'active',  cost:1, requires:null,        manaCost:8,  action:'nuke', power:1.0, forcedElement:'fire', desc:'A furious blow wreathed in flame, 100% weapon damage as fire.'},
      {id:'wb_scars',    tier:1, name:'Battle Scars',   kind:'passive', cost:1, requires:null,        effect:{type:'lowHpDamageBonus', value:12}, desc:'+12% damage dealt while below 50% HP.'},
      {id:'wb_warcry',   tier:2, name:'Warcry',         kind:'active',  cost:1, requires:'wb_bloodlust',manaCost:12, action:'aoe', power:0.75, forcedElement:'fire', desc:'A furious roar sears all enemies for 75% weapon damage as fire.'},
      {id:'wb_furyborn', tier:2, name:'Furyborn',       kind:'passive', cost:1, requires:'wb_scars',  effect:{type:'comboDamage', value:5}, desc:'Each consecutive hit this battle deals 5% more damage (stacking).'},
      {id:'wb_apex',     tier:3, name:'Apex Rage',      kind:'active',  cost:1, requires:'wb_warcry', manaCost:18, action:'nuke', power:1.8, forcedElement:'fire', executeThreshold:20, desc:'180% weapon damage as fire; instantly fells enemies below 20% HP.'},
      {id:'wb_undying',  tier:3, name:'Undying Rage',   kind:'passive', cost:1, requires:'wb_furyborn',effect:{type:'reviveOncePerFight', value:30}, desc:'Once per battle, survive a killing blow with 30% HP.'},
    ]
  },
  {
    id:'mage', name:'Mage', icon:'🔮',
    desc:'A glass-cannon spellcaster who bends fire and frost to burst enemies down.',
    statMods:{matk:5, mdef:2, spd:1},
    skillTree:[
      // --- Pyro/Frost branch (core offense) ---
      {id:'m_firebolt', tier:1, name:'Firebolt',        kind:'active',  cost:1, requires:null,        manaCost:8,  action:'nuke', power:1.1, magic:true, forcedElement:'fire', desc:'A bolt of fire for 110% magic damage.'},
      {id:'m_focus',    tier:1, name:'Arcane Focus',    kind:'passive', cost:1, requires:null,        effect:{type:'statBonus', stat:'matk', value:6}, desc:'+6 MATK, permanently.'},
      {id:'m_frostnova',tier:2, name:'Frost Nova',      kind:'active',  cost:1, requires:'m_firebolt',manaCost:12, action:'aoe',  power:0.6, magic:true, forcedElement:'ice', desc:'Ice bursts outward, hitting all enemies for 60% magic damage.'},
      {id:'m_shield',   tier:2, name:'Mana Shield',     kind:'passive', cost:1, requires:'m_focus',   effect:{type:'dodgeChance', value:8}, desc:'8% chance to fully absorb an incoming attack.'},
      {id:'m_meteor',   tier:3, name:'Meteor',          kind:'active',  cost:1, requires:'m_frostnova',manaCost:20, action:'aoe', power:1.4, magic:true, forcedElement:'fire', desc:'A falling meteor scorches all enemies for 140% magic damage.'},
      {id:'m_archmage', tier:3, name:"Archmage's Insight",kind:'passive',cost:1, requires:'m_shield',  effect:{type:'critDmgBonus', value:30}, desc:'+30% critical damage on all spells and strikes.'},
      // --- Chronomancy branch (self-buffs & control) ---
      {id:'m_manasurge',tier:1, name:'Mana Surge',      kind:'active',  cost:1, requires:null,        manaCost:8,  action:'buff', buffStat:'matk', buffValue:25, desc:'+25% MATK for the rest of the battle.'},
      {id:'m_attunement',tier:2, name:'Elemental Attunement',kind:'passive',cost:1, requires:'m_manasurge', effect:{type:'bonusDamagePct', value:10}, desc:'+10% damage on all spells and strikes.'},
      {id:'m_chronorift',tier:3, name:'Chrono Rift',    kind:'active',  cost:1, requires:'m_attunement', manaCost:14, action:'debuff', debuffStat:'spd', debuffValue:30, desc:"Fracture time around the target, cutting their SPD by 30% for the fight."},
      // --- Stormcaller branch (lightning burst) ---
      {id:'ms_shock',     tier:1, name:'Shock',          kind:'active',  cost:1, requires:null,          manaCost:8,  action:'nuke', power:1.1, magic:true, forcedElement:'lightning', desc:'A crackling bolt for 110% magic damage as lightning.'},
      {id:'ms_static',    tier:1, name:'Static Field',   kind:'passive', cost:1, requires:null,          effect:{type:'stunChance', value:6}, desc:'6% chance to stun on hit.'},
      {id:'ms_chainlightning',tier:2, name:'Chain Lightning', kind:'active', cost:1, requires:'ms_shock', manaCost:12, action:'aoe', power:0.65, magic:true, forcedElement:'lightning', desc:'Lightning arcs between all enemies for 65% magic damage.'},
      {id:'ms_overcharge',tier:2, name:'Overcharge',     kind:'passive', cost:1, requires:'ms_static',   effect:{type:'critChanceBonus', value:12}, desc:'+12% critical hit chance.'},
      {id:'ms_stormlord',  tier:3, name:'Stormlord',      kind:'active',  cost:1, requires:'ms_chainlightning', manaCost:20, action:'aoe', power:1.5, magic:true, forcedElement:'lightning', desc:'The storm answers — 150% magic damage as lightning to all enemies.'},
      {id:'ms_thunderguard',tier:3, name:'Thunderguard',  kind:'passive', cost:1, requires:'ms_overcharge', effect:{type:'damageCapPct', value:15}, desc:'Incoming hits can never deal more than 15% of your max HP at once.'},
    ]
  },
  {
    id:'rogue', name:'Rogue', icon:'🗡️',
    desc:'A fast, precise skirmisher who lives on crits, speed, and evasion.',
    statMods:{spd:5, hitEff:3},
    skillTree:[
      // --- Duelist branch (core offense) ---
      {id:'r_quickstrike',tier:1, name:'Quick Strike',  kind:'active',  cost:1, requires:null,          manaCost:5,  action:'nuke', power:0.9, desc:'A fast strike for 90% weapon damage.'},
      {id:'r_fleet',      tier:1, name:'Fleet Footed',  kind:'passive', cost:1, requires:null,          effect:{type:'statBonus', stat:'spd', value:6}, desc:'+6 SPD, permanently.'},
      {id:'r_backstab',   tier:2, name:'Backstab',      kind:'active',  cost:1, requires:'r_quickstrike',manaCost:9, action:'nuke', power:1.3, executeThreshold:15, desc:'130% weapon damage; instantly fells enemies below 15% HP.'},
      {id:'r_evasive',    tier:2, name:'Evasive Instinct',kind:'passive',cost:1, requires:'r_fleet',    effect:{type:'dodgeChance', value:10}, desc:'10% chance to fully evade an incoming attack.'},
      {id:'r_flurry',      tier:3, name:'Blade Flurry',  kind:'active',  cost:1, requires:'r_backstab', manaCost:14, action:'aoe', power:0.8, desc:'A flurry of strikes hits all enemies for 80% weapon damage.'},
      {id:'r_precision',   tier:3, name:'Deadly Precision',kind:'passive',cost:1, requires:'r_evasive', effect:{type:'critChanceBonus', value:15}, desc:'+15% critical hit chance.'},
      // --- Shadow branch (combo scaling) ---
      {id:'r_smokebomb',  tier:1, name:'Smoke Bomb',    kind:'active',  cost:1, requires:null,          manaCost:6,  action:'debuff', debuffStat:'hitEff', debuffValue:20, desc:"Blind the enemy, reducing their HIT EFF by 20% for the fight."},
      {id:'r_opportunist',tier:2, name:'Opportunist',   kind:'passive', cost:1, requires:'r_smokebomb', effect:{type:'comboDamage', value:3}, desc:'Each consecutive hit this battle deals 3% more damage (stacking).'},
      {id:'r_assassinate', tier:3, name:'Assassinate',  kind:'active',  cost:1, requires:'r_opportunist',manaCost:15, action:'nuke', power:1.5, executeThreshold:25, desc:'150% weapon damage; instantly fells enemies below 25% HP.'},
      // --- Venomcraft branch (poison damage-over-time flavor) ---
      {id:'rv_venomstrike',tier:1, name:'Venomstrike',   kind:'active',  cost:1, requires:null,          manaCost:6,  action:'nuke', power:0.95, forcedElement:'poison', desc:'A poisoned blade strikes for 95% weapon damage as poison.'},
      {id:'rv_toxicveins', tier:1, name:'Toxic Veins',   kind:'passive', cost:1, requires:null,          effect:{type:'statBonus', stat:'poisonDmg', value:8}, desc:'+8% Poison damage bonus, permanently.'},
      {id:'rv_epidemic',   tier:2, name:'Epidemic',      kind:'active',  cost:1, requires:'rv_venomstrike',manaCost:11, action:'aoe', power:0.7, forcedElement:'poison', desc:'Toxins spread to all enemies for 70% weapon damage as poison.'},
      {id:'rv_predator',   tier:2, name:'Predator Instinct',kind:'passive',cost:1, requires:'rv_toxicveins', effect:{type:'critDmgBonus', value:20}, desc:'+20% critical damage.'},
      {id:'rv_lethal',     tier:3, name:'Lethal Dose',   kind:'active',  cost:1, requires:'rv_epidemic', manaCost:15, action:'nuke', power:1.4, forcedElement:'poison', executeThreshold:18, desc:'140% weapon damage as poison; instantly fells enemies below 18% HP.'},
      {id:'rv_apexpredator',tier:3, name:'Apex Predator', kind:'passive', cost:1, requires:'rv_predator', effect:{type:'doubleHitChance', value:12}, desc:'12% chance to strike twice in one attack.'},
    ]
  },
  {
    id:'paladin', name:'Paladin', icon:'🛡️',
    desc:'A resilient holy warrior who mixes defense, healing, and smiting.',
    statMods:{def:4, mdef:2, hitRes:2},
    skillTree:[
      // --- Devotion branch (core kit) ---
      {id:'p_smite',    tier:1, name:'Smite',          kind:'active',  cost:1, requires:null,        manaCost:7,  action:'nuke', power:1.0, magic:true, forcedElement:'holy', desc:'A holy strike for 100% magic damage.'},
      {id:'p_devotion', tier:1, name:'Devotion',       kind:'passive', cost:1, requires:null,        effect:{type:'statBonus', stat:'hitRes', value:6}, desc:'+6 HIT RES, permanently.'},
      {id:'p_layhands', tier:2, name:'Lay on Hands',   kind:'active',  cost:1, requires:'p_smite',   manaCost:10, action:'heal', healPct:30, desc:'Restore 30% of your max HP.'},
      {id:'p_guardian', tier:2, name:"Guardian's Resolve",kind:'passive',cost:1, requires:'p_devotion',effect:{type:'thorns', value:8}, desc:'Reflect 8% of damage taken back at attackers.'},
      {id:'p_judgment', tier:3, name:'Judgment',       kind:'active',  cost:1, requires:'p_layhands',manaCost:18, action:'nuke', power:1.7, magic:true, forcedElement:'holy', executeThreshold:15, desc:'170% magic damage; instantly fells enemies below 15% HP.'},
      {id:'p_vigor',    tier:3, name:'Holy Vigor',     kind:'passive', cost:1, requires:'p_guardian',effect:{type:'regenPerTurn', value:10}, desc:'Regenerate 10 HP at the start of every turn.'},
      // --- Wrath branch (aggressive offense) ---
      {id:'p_fury',     tier:1, name:'Righteous Fury', kind:'active',  cost:1, requires:null,        manaCost:8,  action:'buff', buffStat:'atk', buffValue:20, desc:'+20% ATK for the rest of the battle.'},
      {id:'p_zealotry', tier:2, name:'Zealotry',       kind:'passive', cost:1, requires:'p_fury',    effect:{type:'bossDamageBonus', value:12}, desc:'+12% damage dealt to bosses.'},
      {id:'p_wrath',    tier:3, name:'Wrath of Heaven',kind:'active',  cost:1, requires:'p_zealotry',manaCost:18, action:'aoe', power:1.1, magic:true, forcedElement:'holy', desc:'Holy fire rains on all enemies for 110% magic damage.'},
      // --- Aegis branch (pure defense / party-scale sustain) ---
      {id:'pa_consecrate',tier:1, name:'Consecrate',    kind:'active',  cost:1, requires:null,        manaCost:7,  action:'nuke', power:0.9, magic:true, forcedElement:'holy', desc:'Hallowed ground burns the foe for 90% magic damage.'},
      {id:'pa_sanctuary', tier:1, name:'Sanctuary',     kind:'passive', cost:1, requires:null,        effect:{type:'damageImmuneChance', value:6}, desc:'6% chance to take zero damage from any hit.'},
      {id:'pa_radiance',  tier:2, name:'Radiance',      kind:'active',  cost:1, requires:'pa_consecrate',manaCost:12, action:'aoe', power:0.6, magic:true, forcedElement:'holy', desc:'A burst of light scours all enemies for 60% magic damage.'},
      {id:'pa_bulwark',   tier:2, name:'Bulwark',       kind:'passive', cost:1, requires:'pa_sanctuary', effect:{type:'thorns', value:10}, desc:'Reflect 10% of damage taken back at attackers.'},
      {id:'pa_divinestorm',tier:3, name:'Divine Storm',  kind:'active',  cost:1, requires:'pa_radiance', manaCost:18, action:'aoe', power:1.2, magic:true, forcedElement:'holy', desc:'A storm of judgment strikes all enemies for 120% magic damage.'},
      {id:'pa_martyrdom', tier:3, name:'Martyrdom',      kind:'passive', cost:1, requires:'pa_bulwark',  effect:{type:'revive', value:30}, desc:'Once per dungeon, revive with 30% HP instead of falling.'},
    ]
  },
  {
    id:'elementalist', name:'Elementalist', icon:'🌪️',
    desc:'A versatile spellcaster who channels every element, adapting damage type to the fight.',
    statMods:{matk:4, spd:2, hitEff:1},
    skillTree:[
      // --- Pyromancy branch (fire) ---
      {id:'ep_ignite',    tier:1, name:'Ignite',        kind:'active',  cost:1, requires:null,        manaCost:7,  action:'nuke', power:1.0, magic:true, forcedElement:'fire', desc:'A searing bolt for 100% magic damage as fire.'},
      {id:'ep_embercore', tier:1, name:'Ember Core',    kind:'passive', cost:1, requires:null,        effect:{type:'statBonus', stat:'fireDmg', value:10}, desc:'+10% Fire damage bonus, permanently.'},
      {id:'ep_wildfire',  tier:2, name:'Wildfire',      kind:'active',  cost:1, requires:'ep_ignite', manaCost:12, action:'aoe', power:0.7, magic:true, forcedElement:'fire', desc:'Flames spread to all enemies for 70% magic damage.'},
      {id:'ep_combustion',tier:2, name:'Combustion',    kind:'passive', cost:1, requires:'ep_embercore', effect:{type:'bonusDamagePct', value:10}, desc:'+10% damage dealt with all spells and strikes.'},
      {id:'ep_inferno',   tier:3, name:'Inferno',       kind:'active',  cost:1, requires:'ep_wildfire', manaCost:20, action:'aoe', power:1.5, magic:true, forcedElement:'fire', desc:'A raging inferno engulfs all enemies for 150% magic damage.'},
      {id:'ep_phoenixheart',tier:3, name:'Phoenix Heart',kind:'passive', cost:1, requires:'ep_combustion', effect:{type:'regenPerTurn', value:10}, desc:'Regenerate 10 HP at the start of every turn.'},
      // --- Cryomancy branch (ice) ---
      {id:'ec_frostbolt', tier:1, name:'Frostbolt',     kind:'active',  cost:1, requires:null,        manaCost:7,  action:'nuke', power:1.0, magic:true, forcedElement:'ice', desc:'A shard of ice for 100% magic damage.'},
      {id:'ec_permafrost',tier:1, name:'Permafrost',    kind:'passive', cost:1, requires:null,        effect:{type:'statBonus', stat:'iceDmg', value:10}, desc:'+10% Ice damage bonus, permanently.'},
      {id:'ec_blizzard',  tier:2, name:'Blizzard',      kind:'active',  cost:1, requires:'ec_frostbolt',manaCost:12, action:'aoe', power:0.7, magic:true, forcedElement:'ice', desc:'A howling blizzard hits all enemies for 70% magic damage.'},
      {id:'ec_glacialarmor',tier:2, name:'Glacial Armor', kind:'passive', cost:1, requires:'ec_permafrost', effect:{type:'damageCapPct', value:14}, desc:'Incoming hits can never deal more than 14% of your max HP at once.'},
      {id:'ec_absolutezero',tier:3, name:'Absolute Zero', kind:'active',  cost:1, requires:'ec_blizzard', manaCost:18, action:'nuke', power:1.6, magic:true, forcedElement:'ice', executeThreshold:15, desc:'160% magic damage as ice; instantly fells enemies below 15% HP.'},
      {id:'ec_wintersgrasp',tier:3, name:"Winter's Grasp",kind:'passive', cost:1, requires:'ec_glacialarmor', effect:{type:'dodgeChance', value:10}, desc:'10% chance to fully evade an incoming attack.'},
      // --- Geomancy branch (earth / physical) ---
      {id:'eg_stoneskin',  tier:1, name:'Stoneskin',     kind:'passive', cost:1, requires:null,        effect:{type:'statBonus', stat:'def', value:8}, desc:'+8 DEF, permanently.'},
      {id:'eg_tremor',     tier:1, name:'Tremor',        kind:'active',  cost:1, requires:null,        manaCost:6,  action:'nuke', power:0.9, magic:true, forcedElement:'physical', desc:'The ground erupts for 90% magic damage.'},
      {id:'eg_quake',      tier:2, name:'Quake',         kind:'active',  cost:1, requires:'eg_tremor', manaCost:11, action:'aoe', power:0.65, magic:true, forcedElement:'physical', desc:'A rolling quake hits all enemies for 65% magic damage.'},
      {id:'eg_bulwarkstone',tier:2, name:'Bulwark of Stone',kind:'passive',cost:1, requires:'eg_stoneskin', effect:{type:'thorns', value:10}, desc:'Reflect 10% of damage taken back at attackers.'},
      {id:'eg_earthenfury',tier:3, name:'Earthen Fury',  kind:'active',  cost:1, requires:'eg_quake',  manaCost:16, action:'nuke', power:1.5, magic:true, forcedElement:'physical', desc:'150% magic damage as the earth itself strikes.'},
      {id:'eg_mountainsoul',tier:3, name:'Mountain Soul', kind:'passive', cost:1, requires:'eg_bulwarkstone', effect:{type:'damageCapPct', value:18}, desc:'Incoming hits can never deal more than 18% of your max HP at once.'},
    ]
  },
  {
    id:'necromancer', name:'Necromancer', icon:'☠️',
    desc:'A dark caster who drains life, curses enemies, and profits from death itself.',
    statMods:{matk:3, mdef:3, hitRes:2},
    skillTree:[
      // --- Blight branch (dark/poison curses) ---
      {id:'nb_curse',     tier:1, name:'Curse',         kind:'active',  cost:1, requires:null,        manaCost:7,  action:'nuke', power:0.95, magic:true, forcedElement:'dark', desc:'A withering curse for 95% magic damage.'},
      {id:'nb_decay',     tier:1, name:'Decay',         kind:'passive', cost:1, requires:null,        effect:{type:'statBonus', stat:'darkDmg', value:10}, desc:'+10% Dark damage bonus, permanently.'},
      {id:'nb_plague',    tier:2, name:'Plague',        kind:'active',  cost:1, requires:'nb_curse',  manaCost:11, action:'aoe', power:0.65, magic:true, forcedElement:'poison', desc:'A sickness spreads to all enemies for 65% magic damage.'},
      {id:'nb_withering', tier:2, name:'Withering Mark', kind:'passive', cost:1, requires:'nb_decay',  effect:{type:'bossDamageBonus', value:14}, desc:'+14% damage dealt to bosses.'},
      {id:'nb_deathmark',  tier:3, name:'Death Mark',    kind:'active',  cost:1, requires:'nb_plague', manaCost:16, action:'nuke', power:1.4, magic:true, forcedElement:'dark', executeThreshold:20, desc:'140% magic damage as dark; instantly fells enemies below 20% HP.'},
      {id:'nb_pestilence',tier:3, name:'Pestilence',    kind:'passive', cost:1, requires:'nb_withering', effect:{type:'thorns', value:12}, desc:'Reflect 12% of damage taken back at attackers.'},
      // --- Soulbind branch (life drain) ---
      {id:'ns_drain',      tier:1, name:'Soul Drain',    kind:'active',  cost:1, requires:null,        manaCost:6,  action:'nuke', power:0.9, magic:true, forcedElement:'dark', desc:'Drain life for 90% magic damage.'},
      {id:'ns_leech',      tier:1, name:'Leeching Touch', kind:'passive', cost:1, requires:null,        effect:{type:'lifesteal', value:8}, desc:'Heals 8% of damage dealt as HP.'},
      {id:'ns_soulchain',  tier:2, name:'Soulchain',     kind:'active',  cost:1, requires:'ns_drain',  manaCost:12, action:'nuke', power:1.2, magic:true, forcedElement:'dark', desc:'120% magic damage, binding the essence of your foe.'},
      {id:'ns_darkpact',   tier:2, name:'Dark Pact',     kind:'passive', cost:1, requires:'ns_leech',  effect:{type:'manaCostReduction', value:15}, desc:'Skills cost 15% less MP.'},
      {id:'ns_soulharvest', tier:3, name:'Soul Harvest',  kind:'active',  cost:1, requires:'ns_soulchain', manaCost:18, action:'aoe', power:1.0, magic:true, forcedElement:'dark', desc:'Reap all enemies for 100% magic damage.'},
      {id:'ns_undyingbond', tier:3, name:'Undying Bond',  kind:'passive', cost:1, requires:'ns_darkpact', effect:{type:'reviveOncePerFight', value:25}, desc:'Once per battle, survive a killing blow with 25% HP.'},
      // --- Grim Harvest branch (execute / resource generation) ---
      {id:'ng_reap',        tier:1, name:'Reap',          kind:'active',  cost:1, requires:null,        manaCost:8,  action:'nuke', power:1.0, magic:true, forcedElement:'dark', executeThreshold:10, desc:'100% magic damage; instantly fells enemies below 10% HP.'},
      {id:'ng_graverobber',  tier:1, name:'Graverobber',   kind:'passive', cost:1, requires:null,        effect:{type:'goldFind', value:18}, desc:'+18% gold found.'},
      {id:'ng_soulsiphon',   tier:2, name:'Soul Siphon',    kind:'active',  cost:1, requires:'ng_reap',   manaCost:13, action:'nuke', power:1.3, magic:true, forcedElement:'dark', desc:'130% magic damage, siphoning power from the fallen.'},
      {id:'ng_forbiddenlore',tier:2, name:'Forbidden Lore', kind:'passive', cost:1, requires:'ng_graverobber', effect:{type:'xpBonus', value:15}, desc:'+15% experience earned.'},
      {id:'ng_deathsdomain', tier:3, name:"Death's Domain", kind:'active',  cost:1, requires:'ng_soulsiphon', manaCost:17, action:'aoe', power:1.1, magic:true, forcedElement:'dark', desc:'The dead rise to strike all enemies for 110% magic damage.'},
      {id:'ng_apotheosis',   tier:3, name:'Apotheosis',     kind:'passive', cost:1, requires:'ng_forbiddenlore', effect:{type:'critDmgBonus', value:28}, desc:'+28% critical damage.'},
    ]
  },
];
const CLASS_BY_ID = Object.fromEntries(CLASSES.map(c=>[c.id,c]));
