/* ============================================================
   GENERATORS: items, monsters, dungeons
   ============================================================ */
const Generators = {

  rollTier(lootBonus=0){
    const adjusted = TIERS.map(t=>{
      const rarityRank = TIERS.indexOf(t);
      const boost = 1 + lootBonus*(rarityRank/ (TIERS.length-1)) * 2;
      return {t, w: t.weight*boost};
    });
    return U.weightedPick(adjusted, x=>x.w).t;
  },

  pickSlot(){
    const weights = SLOTS.map(s=> s.rareSlot ? 6 : 20);
    return U.weightedPick(SLOTS, (s,i)=>weights[SLOTS.indexOf(s)]);
  },

  rollStatsForSlot(slot, tier, dungeonLevel){
    const pool = [...ALL_STATS];
    const primary = slot.primary || [];
    const chosen = [];
    const available = [...pool];
    for(let i=0;i<tier.statCount && available.length;i++){
      const weighted = available.map(s=>({s, w: primary.includes(s.id) ? 3 : 1}));
      const pickObj = U.weightedPick(weighted, x=>x.w);
      chosen.push(pickObj.s);
      available.splice(available.indexOf(pickObj.s),1);
    }
    const stats = {};
    for(const s of chosen){
      const scalar = s.kind==='pct' ? BALANCE.itemStatScalar.elementDmg : (BALANCE.itemStatScalar[s.id] ?? 1);
      const raw = scalar * dungeonLevel * tier.mult * U.rand(0.85,1.15);
      stats[s.id] = s.kind==='pct' ? Math.max(1, Math.round(raw)) : Math.max(1, Math.round(raw));
    }
    return stats;
  },

  rollTraits(tier, dungeonLevel, pool){
    const count = tier.uniqueTraits ?? 0;
    const picked = [];
    const avail = [...pool];
    for(let i=0;i<count && avail.length;i++){
      const t = U.pick(avail);
      avail.splice(avail.indexOf(t),1);
      const value = Math.round((t.base + t.perLvl*dungeonLevel)*10)/10;
      picked.push({id:t.id, name:t.name, type:t.type, value, desc:t.desc(value)});
    }
    return picked;
  },

  rollMythicTrait(tier, dungeonLevel){
    if(!tier.mythicTraits) return null;
    const t = U.pick(MYTHIC_TRAITS);
    const value = Math.round((t.base + t.perLvl*dungeonLevel)*10)/10;
    return {id:t.id, name:t.name, type:t.type, value, desc:t.desc(value)};
  },

  nameItem(slot, tier){
    const prefix = U.pick(NAME_PARTS.prefixByTier[tier.id]);
    const noun = U.pick(NAME_PARTS.nounBySlot[slot.id]);
    let name = `${prefix} ${noun}`;
    if(tier.uniqueTraits>0) name += ` ${U.pick(NAME_PARTS.suffixes)}`;
    return name;
  },

  generateItem(dungeonLevel, opts={}){
    const tier = opts.forcedTier
      ? TIER_BY_ID[opts.forcedTier]
      : opts.forcedMinTier
        ? TIERS[Math.max(TIERS.findIndex(t=>t.id===opts.forcedMinTier), TIERS.indexOf(this.rollTier(opts.lootBonus||0)))]
        : this.rollTier(opts.lootBonus||0);
    const slot = opts.forcedSlot ? SLOTS.find(s=>s.id===opts.forcedSlot) : this.pickSlot();
    const stats = this.rollStatsForSlot(slot, tier, dungeonLevel);
    const uniqueTraits = this.rollTraits(tier, dungeonLevel, UNIQUE_TRAITS);
    const mythicTrait = this.rollMythicTrait(tier, dungeonLevel);
    // weapon element flavor = strongest elemental stat rolled, else physical
    let element = 'physical';
    if(slot.id==='weapon'){
      const elemEntries = Object.entries(stats).filter(([k])=>k.endsWith('Dmg'));
      if(elemEntries.length){
        elemEntries.sort((a,b)=>b[1]-a[1]);
        element = elemEntries[0][0].replace('Dmg','');
      }
    }
    return {
      uid: U.uid(),
      name: this.nameItem(slot, tier),
      slot: slot.id,
      slotLabel: slot.label,
      tier: tier.id,
      ilvl: dungeonLevel,
      stats, uniqueTraits, mythicTrait, element,
    };
  },

  monsterFromTemplate(tpl, dungeonLevel, mult=1, isBoss=false){
    // convex (level^exponent) growth keeps late dungeons scaling up faster than early
    // ones, so late game doesn't trivialize once players stack compounding gear tiers.
    const scale = Math.pow(dungeonLevel, BALANCE.monsterLevelExponent) * mult * (isBoss?1.2:1);
    const hp = Math.floor((isBoss?75:28) + scale*(isBoss?12.5:7.2));
    return {
      uid:U.uid(), tplId:tpl.id, name: isBoss ? `${tpl.name}, ${tpl.title}` : tpl.name,
      icon:tpl.icon, element:tpl.element, flavor:tpl.flavor, isBoss,
      atk: Math.round(3 + scale*tpl.atk*1.75),
      def: Math.round(2 + scale*tpl.def*1.3),
      matk: Math.round(2.5 + scale*tpl.matk*1.75),
      mdef: Math.round(2 + scale*tpl.mdef*1.3),
      spd: Math.round(3 + scale*tpl.spd*1.1),
      hitEff: Math.round(6 + scale*0.9),
      hitRes: Math.round(5 + scale*0.8),
      hp, maxHp:hp,
      goldDrop: Math.floor((isBoss?40:8) + scale*(isBoss?7:1.6)),
      xpDrop: Math.floor((isBoss?60:14) + scale*(isBoss?9:2.2)),
    };
  },

  generateBattleGroup(dungeonLevel, difficulty){
    const packSize = Math.random()<0.35 ? U.randInt(2,3) : 1;
    const group=[];
    for(let i=0;i<packSize;i++){
      const tpl = U.pick(MONSTER_TEMPLATES);
      group.push(this.monsterFromTemplate(tpl, dungeonLevel, difficulty.monsterMult, false));
    }
    return group;
  },

  generateBoss(dungeonLevel, difficulty){
    const tpl = U.pick(BOSS_TEMPLATES);
    return [this.monsterFromTemplate(tpl, dungeonLevel, difficulty.monsterMult, true)];
  },

  generateDungeon(playerLevel, difficultyId){
    const difficulty = BALANCE.difficulties[difficultyId];
    const theme = U.pick(DUNGEON_THEMES);
    const roomCount = BALANCE.roomCount(playerLevel);
    const roomTypes = [];
    const weights = [
      {t:'battle', w:38},{t:'chest', w:18},{t:'merchant', w:10},
      {t:'gamble', w:9},{t:'trap', w:10},{t:'shrine', w:7},{t:'mystery', w:8},
    ];
    for(let i=0;i<roomCount-1;i++){
      roomTypes.push(U.weightedPick(weights, x=>x.w).t);
    }
    roomTypes.push('boss');
    return {
      theme, difficulty, difficultyId,
      dungeonLevel: playerLevel,
      roomTypes, roomCount,
      currentIndex: -1, // -1 = not yet entered first room
      cleared: false,
    };
  }
};
