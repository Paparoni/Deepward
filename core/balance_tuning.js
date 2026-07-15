const BALANCE = {
  xpToNext: lvl => Math.floor(50 * Math.pow(lvl, 1.5)),
  // critChance/critDamage/hp/mp are gear-only affixes — players get none of these
  // innately from leveling, so they stay at 0 base / 0 per-level.
  playerBaseStat: {atk:8, def:7, matk:8, mdef:7, spd:6, hitEff:7, hitRes:6, critChance:0, critDamage:0, hp:0, mp:0},
  playerStatPerLevel: {atk:1.6, def:1.3, matk:1.6, mdef:1.3, spd:0.9, hitEff:1.1, hitRes:0.9, critChance:0, critDamage:0, hp:0, mp:0},
  maxHp: (lvl,def)=> Math.floor(78 + lvl*14 + def*2.2),
  maxMp: (lvl,mdef)=> Math.floor(24 + lvl*5 + mdef*1.5),
  // reduced vs. earlier version — 9 equipped items compounding tier multipliers made gear
  // snowball much faster than monsters (linear), which is what caused "easy after a point".
  itemStatScalar: {
    atk:1.05, def:0.9, matk:1.05, mdef:0.9, spd:0.55, hitEff:0.7, hitRes:0.7, elementDmg:0.45,
    critChance:0.32, critDamage:0.85, hp:3.2, mp:1.4,
  },
  // monster scaling uses level^exponent (convex) instead of flat level scaling, so late
  // dungeons ramp up faster and keep pace with compounding player gear. Nudged down
  // slightly from 1.13: monster movepools (DoTs, debuffs, telegraphed charges, boss
  // phase triggers) add real effective damage on top of raw stats now, so the stat
  // curve itself doesn't need to carry quite as much of the late-game difficulty.
  monsterLevelExponent: 1.10,
  roomCount: lvl => U.clamp(5 + Math.floor(lvl/4), 5, 10),
  // floor-generation pacing: guarantees a dungeon can't be cleared without fighting.
  // minCombatFraction = minimum share of non-boss rooms that must be combat rooms.
  // maxNonCombatStreak = longest run of consecutive non-combat rooms allowed before
  // one gets forced into a battle.
  minCombatFraction: 0.32,
  maxNonCombatStreak: 2,
  difficulties: {
    normal:   {label:'Normal',   monsterMult:1.00, lootBonus:0.0},
    hard:     {label:'Hard',     monsterMult:1.32, lootBonus:0.6},
    nightmare:{label:'Nightmare',monsterMult:1.75, lootBonus:1.3},
  },

  // -- turn-based combat tuning -----------------------------------------
  // Initiative order each round is SPD-based with a little jitter so ties
  // (and near-ties) aren't perfectly deterministic.
  initiativeJitter: 3,
  // chance per round a non-boss monster starts a telegraphed charge instead
  // of attacking; it attacks for real the round after.
  monsterChargeChance: 0.17,
  // bosses charge on a fixed cadence instead of randomly, so their pattern
  // can be learned and played around.
  bossChargeCadence: 4,
  chargeDamageMult: 1.15,
  // charged hits partially ignore the target's relevant defense stat.
  chargeDefPiercePct: 0.5,
  // how often a monster reaches for its cooldown-gated utility move on a
  // turn it isn't charging or releasing.
  monsterUtilityChance: 0.32,
  monsterUtilityCooldown: 3,
  // Guard (the Defend action) mitigation, and a stronger version specifically
  // against a charged/telegraphed hit that the player had a full round of
  // warning about.
  guardMitigation: 0.45,
  guardMitigationVsCharge: 0.65,
  guardManaRestorePct: 0.10,
};
