const BALANCE = {
  // Faster early/mid progression, while still leaving room to live with each build.
  xpToNext: lvl => Math.floor(44 * Math.pow(lvl, 1.42)),
  // critChance/critDamage/hp/mp are gear-only affixes — players get none of these
  // innately from leveling, so they stay at 0 base / 0 per-level.
  playerBaseStat: {atk:8, def:7, matk:8, mdef:7, spd:6, hitEff:7, hitRes:6, critChance:0, critDamage:0, hp:0, mp:0},
  playerStatPerLevel: {atk:1.6, def:1.3, matk:1.6, mdef:1.3, spd:0.9, hitEff:1.1, hitRes:0.9, critChance:0, critDamage:0, hp:0, mp:0},
  maxHp: (lvl,def)=> Math.floor(78 + lvl*14 + def*2.2),
  maxMp: (lvl,mdef)=> Math.floor(24 + lvl*5 + mdef*1.5),
  // reduced vs. earlier version — 9 equipped items compounding tier multipliers made gear
  // snowball much faster than monsters (linear), which is what caused "easy after a point".
  itemStatScalar: {
    atk:1.32, def:1.12, matk:1.32, mdef:1.12, spd:0.68, hitEff:0.86, hitRes:0.86, elementDmg:0.58,
    critChance:0.40, critDamage:1.08, hp:4.0, mp:1.8,
  },
  // monster scaling uses level^exponent (convex) instead of flat level scaling, so late
  // dungeons ramp up faster and keep pace with compounding player gear. Nudged down
  // slightly from 1.13: monster movepools (DoTs, debuffs, telegraphed charges, boss
  // phase triggers) add real effective damage on top of raw stats now, so the stat
  // curve itself doesn't need to carry quite as much of the late-game difficulty.
  monsterLevelExponent: 1.14,
  // Early dungeon levels intentionally hit softer than the raw stat curve implies —
  // this is about giving new runs room to learn the systems (targeting, guard timing,
  // reading telegraphs) before the game asks much of them. Only trims monster ATK/MATK
  // (how hard they hit), not HP/DEF, so early fights aren't shorter, just less punishing.
  // Fully fades out by dungeon level 12, at which point stats scale at full strength.
  monsterEarlyMercy: dlvl => 1 - 0.08*U.clamp(1-(dlvl-1)/9, 0, 1),
  roomCount: lvl => U.clamp(8 + Math.floor(lvl/3), 8, 16),
  // floor-generation pacing: guarantees a dungeon can't be cleared without fighting.
  // minCombatFraction = minimum share of non-boss rooms that must be combat rooms.
  // maxNonCombatStreak = longest run of consecutive non-combat rooms allowed before
  // one gets forced into a battle.
  minCombatFraction: 0.32,
  maxNonCombatStreak: 2,
  difficulties: {
    normal:   {label:'Normal',   monsterMult:1.08, lootBonus:0.0, boonRarityBonus:0},
    hard:     {label:'Hard',     monsterMult:1.32, lootBonus:0.6, boonRarityBonus:.65},
    nightmare:{label:'Nightmare',monsterMult:1.75, lootBonus:1.3, boonRarityBonus:1.4},
  },

  // -- turn-based combat tuning -----------------------------------------
  // Initiative order each round is SPD-based with a little jitter so ties
  // (and near-ties) aren't perfectly deterministic.
  initiativeJitter: 3,
  combatActionDelayMs: 430,
  elementalStrongMult: 1.25,
  elementalResistMult: 0.82,
  // Each element preys on one other element. The reverse matchup is resisted.
  elementalPreysOn: {fire:'ice', ice:'lightning', lightning:'poison', poison:'holy', holy:'dark', dark:'fire'},
  // 0 at dungeon level 1 → 1 by dungeon level 20. Drives how much tactical
  // pressure a fight applies: early dungeons see monsters attack plainly most
  // of the time, so a new run can learn targeting/guard/cooldowns without being
  // punished for it; by the time this ramp maxes out, telegraphs, utility moves,
  // and boss patterns are all firing near their full designed frequency and a
  // build that just mashes Attack will lose.
  strategyRamp: dlvl => U.clamp(((dlvl||1)-1)/19, 0, 1),
  // chance per round a non-boss monster starts a telegraphed charge instead of
  // attacking (attacks for real the round after) — ramps 0.06 → 0.19.
  monsterChargeChance: dlvl => 0.06 + BALANCE.strategyRamp(dlvl)*0.13,
  // bosses charge on a fixed cadence instead of randomly, so their pattern can
  // be learned and played around — starts generous (every 6th round) and
  // tightens to every 3rd as the ramp maxes out.
  bossChargeCadence: dlvl => Math.round(6 - BALANCE.strategyRamp(dlvl)*3),
  chargeDamageMult: 1.15,
  // charged hits partially ignore the target's relevant defense stat.
  chargeDefPiercePct: 0.5,
  // how often a monster reaches for its cooldown-gated utility move on a turn
  // it isn't charging or releasing — ramps 0.12 → 0.34, so early fights are
  // mostly plain attacks and late fights layer buffs/debuffs/heals on top.
  monsterUtilityChance: dlvl => 0.12 + BALANCE.strategyRamp(dlvl)*0.22,
  monsterUtilityCooldown: 3,
  // Guard (the Defend action) mitigation, and a stronger version specifically
  // against a charged/telegraphed hit that the player had a full round of
  // warning about.
  guardMitigation: 0.45,
  guardMitigationVsCharge: 0.65,
  guardManaRestorePct: 0.10,
};
