const BALANCE = {
  xpToNext: lvl => Math.floor(50 * Math.pow(lvl, 1.5)),
  playerBaseStat: {atk:8, def:7, matk:8, mdef:7, spd:6, hitEff:7, hitRes:6},
  playerStatPerLevel: {atk:1.6, def:1.3, matk:1.6, mdef:1.3, spd:0.9, hitEff:1.1, hitRes:0.9},
  maxHp: (lvl,def)=> Math.floor(70 + lvl*13 + def*2),
  maxMp: (lvl,mdef)=> Math.floor(24 + lvl*5 + mdef*1.5),
  // reduced vs. earlier version — 9 equipped items compounding tier multipliers made gear
  // snowball much faster than monsters (linear), which is what caused "easy after a point".
  itemStatScalar: {atk:1.05, def:0.9, matk:1.05, mdef:0.9, spd:0.55, hitEff:0.7, hitRes:0.7, elementDmg:0.45},
  // monster scaling uses level^exponent (convex) instead of flat level scaling, so late
  // dungeons ramp up faster and keep pace with compounding player gear.
  monsterLevelExponent: 1.13,
  roomCount: lvl => U.clamp(5 + Math.floor(lvl/4), 5, 10),
  difficulties: {
    normal:   {label:'Normal',   monsterMult:1.00, lootBonus:0.0},
    hard:     {label:'Hard',     monsterMult:1.35, lootBonus:0.6},
    nightmare:{label:'Nightmare',monsterMult:1.85, lootBonus:1.3},
  }
};
