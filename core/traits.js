// -- unique traits (Unique tier and up) -----------------------------------------
// effect 'type' is read by EFFECT_HANDLERS in the combat engine.
const UNIQUE_TRAITS = [
  {id:'lifesteal',     name:'Vampiric Edge',    type:'lifesteal',      base:6,  perLvl:0.15, desc:v=>`Heals ${v}% of damage dealt as HP.`},
  {id:'stun_chance',   name:'Concussive Force', type:'stunChance',     base:8,  perLvl:0.15, desc:v=>`${v}% chance to stun target for 1 turn on hit.`},
  {id:'crit_dmg',      name:'Killing Precision',type:'critDmgBonus',   base:25, perLvl:0.6,  desc:v=>`+${v}% critical damage.`},
  {id:'crit_chance',   name:'Eagle Eye',        type:'critChanceBonus',base:10, perLvl:0.3,  desc:v=>`+${v}% critical hit chance.`},
  {id:'thorns',        name:'Barkskin Ward',    type:'thorns',         base:8,  perLvl:0.3,  desc:v=>`Reflects ${v}% of damage taken back to attacker.`},
  {id:'regen',         name:'Sustaining Aura',  type:'regenPerTurn',   base:3,  perLvl:0.25, desc:v=>`Restores ${v} HP at the start of each turn.`},
  {id:'gold_find',     name:"Prospector's Luck", type:'goldFind',    base:15, perLvl:0.5,  desc:v=>`+${v}% gold found.`},
  {id:'xp_bonus',      name:"Scholar's Insight", type:'xpBonus',     base:12, perLvl:0.4,  desc:v=>`+${v}% experience earned.`},
  {id:'dodge',         name:'Phantom Step',     type:'dodgeChance',    base:6,  perLvl:0.2,  desc:v=>`${v}% chance to fully evade an incoming attack.`},
  {id:'double_hit',    name:'Twinned Strikes',  type:'doubleHitChance',base:10, perLvl:0.25, desc:v=>`${v}% chance to strike twice in one attack.`},
  {id:'piercing',      name:'Piercing Strikes', type:'bonusDamagePct', base:10, perLvl:0.3,  desc:v=>`+${v}% damage dealt.`},
  {id:'vengeful',      name:'Vengeful Spirit',  type:'lowHpDamageBonus',base:15, perLvl:0.4, desc:v=>`+${v}% damage dealt while below 50% HP.`},
  {id:'second_wind',   name:'Second Wind',      type:'reviveOncePerFight',base:30, perLvl:0.2, desc:v=>`Once per battle, survive a killing blow with ${v}% HP.`},
  {id:'mana_eff',      name:'Mana Efficiency',  type:'manaCostReduction',base:12, perLvl:0.3, desc:v=>`Skills cost ${v}% less MP.`},
  {id:'momentum',      name:'Momentum',         type:'comboDamage',    base:4,  perLvl:0.15, desc:v=>`Each consecutive hit this battle deals ${v}% more damage (stacking).`},
  {id:'giant_slayer',  name:'Giant Slayer',     type:'bossDamageBonus',base:15, perLvl:0.4,  desc:v=>`+${v}% damage dealt to bosses.`},
];

// -- mythic traits (Mythic Legendary only) --------------------------------------
const MYTHIC_TRAITS = [
  {id:'revive',       name:'Deathless Vow',     type:'revive',           base:35, perLvl:0.2, desc:v=>`Once per dungeon, revive with ${v}% HP instead of falling.`},
  {id:'first_strike', name:'Opening Requiem',   type:'doubleDamageFirstTurn', base:100, perLvl:0, desc:v=>`Your first attack in every battle deals double damage.`},
  {id:'execute',      name:"Reaper's Mercy",  type:'executeThreshold', base:12, perLvl:0.3, desc:v=>`Instantly finish enemies below ${v}% HP.`},
  {id:'immunity',     name:'Fatebreak',         type:'damageImmuneChance',base:15, perLvl:0.3, desc:v=>`${v}% chance to take zero damage from any hit.`},
  {id:'drain',        name:'Soul Siphon',       type:'statDrainOnHit',   base:4,  perLvl:0.2, desc:v=>`Steals ${v}% of the target's ATK/MATK permanently for the fight.`},
  {id:'echo',         name:'Echoing Strike',    type:'echoStrike',       base:40, perLvl:0.5, desc:v=>`${v}% chance every attack is followed by a weaker echo hit.`},
  {id:'timeloop',     name:'Time Loop',         type:'extraTurnChance',  base:12, perLvl:0.25, desc:v=>`${v}% chance to act again immediately after acting.`},
  {id:'annihilate',   name:'Annihilation',      type:'critInstantKillChance', base:5, perLvl:0.15, desc:v=>`Critical hits have a ${v}% chance to instantly destroy non-boss enemies.`},
  {id:'undying',      name:'Undying Will',      type:'damageCapPct',     base:35, perLvl:0.3, desc:v=>`Incoming hits can never deal more than ${v}% of your max HP at once.`},
  {id:'godslayer',    name:"Godslayer's Mark",  type:'bonusDamagePct',   base:20, perLvl:0.5, desc:v=>`+${v}% damage dealt to all enemies.`},
];
