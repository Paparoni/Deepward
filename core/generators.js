/* ============================================================
   GENERATORS: items, monsters, dungeons
   ============================================================ */
const Generators = {

  rollTier(lootBonus=0){
    const adjusted = TIERS.map(t=>{
      const rarityRank = TIERS.indexOf(t);
      // Difficulty meaningfully moves probability mass upward instead of merely
      // adding a small bonus to every tier.
      const rank = rarityRank/(TIERS.length-1);
      const boost = Math.pow(1 + lootBonus*1.35, rank*2.2) * (rarityRank===0 ? 1/(1+lootBonus*.55) : 1);
      return {t, w: t.weight*boost};
    });
    return U.weightedPick(adjusted, x=>x.w).t;
  },

  pickSlot(){
    const weights = SLOTS.map(s=> s.rareSlot ? 6 : 20);
    return U.weightedPick(SLOTS, (s,i)=>weights[SLOTS.indexOf(s)]);
  },

  rollStatsForSlot(slot, tier, dungeonLevel, affinities={}){
    const pool = [...ALL_STATS];
    const primary = slot.primary || [];
    const chosen = [];
    const available = [...pool];
    for(let i=0;i<tier.statCount && available.length;i++){
      const weighted = available.map(s=>({s, w:(primary.includes(s.id)?3:1)*(affinities[s.id]||1)}));
      const pickObj = U.weightedPick(weighted, x=>x.w);
      chosen.push(pickObj.s);
      available.splice(available.indexOf(pickObj.s),1);
    }
    const [rollMin, rollMax] = tier.rollRange || [0.85, 1.15];
    const stats = {};
    for(const s of chosen){
      const scalar = s.kind==='pct' ? BALANCE.itemStatScalar.elementDmg : (BALANCE.itemStatScalar[s.id] ?? 1);
      const raw = scalar * dungeonLevel * tier.mult * U.rand(rollMin, rollMax);
      stats[s.id] = s.kind==='pct' ? Math.max(1, Math.round(raw)) : Math.max(1, Math.round(raw));
    }
    return stats;
  },

  rollTraits(tier, dungeonLevel, pool, slot=null){
    const count = tier.uniqueTraits ?? 0;
    const picked = [];
    const avail = pool.filter(t=>(!t.tier||t.tier===tier.id)&&(!t.allowedSlots||t.allowedSlots.includes(slot?.id)));
    const tvm = tier.traitValueMult ?? 1;
    for(let i=0;i<count && avail.length;i++){
      const t = U.pick(avail);
      avail.splice(avail.indexOf(t),1);
      const value = Math.round((t.base + t.perLvl*dungeonLevel)*tvm*10)/10;
      picked.push({id:t.id, name:t.name, type:t.type, value, desc:t.desc(value), source:t.source, target:t.target, element:t.element});
    }
    return picked;
  },

  rollMythicTrait(tier, dungeonLevel){
    if(!tier.mythicTraits) return null;
    const t = U.pick(MYTHIC_TRAITS);
    const tvm = tier.traitValueMult ?? 1;
    const value = Math.round((t.base + t.perLvl*dungeonLevel)*tvm*10)/10;
    return {id:t.id, name:t.name, type:t.type, value, desc:t.desc(value)};
  },

  nameItem(slot, tier){
    const prefix = U.pick(NAME_PARTS.prefixByTier[tier.id]);
    const noun = U.pick(NAME_PARTS.nounBySlot[slot.id]);
    let name = `${prefix} ${noun}`;
    if(tier.uniqueTraits>0){
      const suffixPool = NAME_PARTS.suffixesByTier[tier.id] || NAME_PARTS.suffixes;
      name += ` ${U.pick(suffixPool)}`;
    }
    return name;
  },

  generateItem(dungeonLevel, opts={}){
    const tier = opts.forcedTier
      ? TIER_BY_ID[opts.forcedTier]
      : opts.forcedMinTier
        ? TIERS[Math.max(TIERS.findIndex(t=>t.id===opts.forcedMinTier), TIERS.indexOf(this.rollTier(opts.lootBonus||0)))]
        : this.rollTier(opts.lootBonus||0);
    const slot = opts.forcedSlot ? SLOTS.find(s=>s.id===opts.forcedSlot) : this.pickSlot();
    const stats = this.rollStatsForSlot(slot, tier, dungeonLevel, opts.affinities||{});
    const uniqueTraits = this.rollTraits(tier, dungeonLevel, GEAR_TRAITS, slot);
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

  rollCraftingMaterial(isBoss=false){
    if(Math.random() > (isBoss ? 0.85 : 0.28)) return null;
    return U.pick(CRAFTING_MATERIALS);
  },

  monsterIdentity(tpl,isBoss=false){
    const tags=[];
    if(tpl.spd>=1.2) tags.push('Swift');
    if(tpl.def>=1.2||tpl.mdef>=1.25) tags.push('Armored');
    if(tpl.matk>tpl.atk*1.25) tags.push('Caster');
    if(tpl.atk>=1.25) tags.push('Brutal');
    if(tpl.moves?.some(move=>move.kind==='heal')) tags.push('Regenerator');
    if(tpl.moves?.some(move=>move.dotPct)) tags.push('Afflictor');
    if(tpl.moves?.some(move=>move.kind==='debuff'||move.debuffStat)) tags.push('Controller');
    if(!tags.length) tags.push('Skirmisher');
    return `${isBoss?'Boss · ':''}${tags.join(' · ')}`;
  },

  monsterFromTemplate(tpl, dungeonLevel, mult=1, isBoss=false){
    // convex (level^exponent) growth keeps late dungeons scaling up faster than early
    // ones, so late game doesn't trivialize once players stack compounding gear tiers.
    const scale = Math.pow(dungeonLevel, BALANCE.monsterLevelExponent) * mult * (isBoss?1.2:1);
    const variance=(min=.94,max=1.06)=>U.rand(min,max);
    const identity=ENEMY_IDENTITIES[tpl.id]||{name:this.monsterIdentity(tpl,isBoss),desc:tpl.flavor,mods:{},charge:1,utility:1};
    const mod=stat=>identity.mods?.[stat]||1;
    const hp = Math.floor(((isBoss?82:31) + scale*(isBoss?14.2:8.1))*mod('hp')*variance(.96,1.05));
    const mercy = BALANCE.monsterEarlyMercy(dungeonLevel);
    return {
      uid:U.uid(), tplId:tpl.id, name: isBoss ? `${tpl.name}, ${tpl.title}` : tpl.name,
      icon:tpl.icon, element:tpl.element, flavor:tpl.flavor, isBoss, identity:identity.name, identityDesc:identity.desc,
      moves: tpl.moves || [],
      _chargeBias:identity.charge||1, _utilityBias:identity.utility||1,
      _charging:false, _chargingMove:null, _utilityCooldown:0, _phaseUsed:false,
      atk: Math.round((6.5 + scale*tpl.atk*1.92)*mercy*mod('atk')*variance()),
      def: Math.round((2 + scale*tpl.def*1.46)*mod('def')*variance()),
      matk: Math.round((6 + scale*tpl.matk*1.92)*mercy*mod('matk')*variance()),
      mdef: Math.round((2 + scale*tpl.mdef*1.46)*mod('mdef')*variance()),
      spd: Math.round((4.5 + scale*tpl.spd*1.15)*mod('spd')*variance(.92,1.08)),
      hitEff: Math.round((6 + scale*0.9)*mod('hitEff')*variance()),
      hitRes: Math.round((5 + scale*0.8)*mod('hitRes')*variance()),
      hp, maxHp:hp,
      goldDrop: Math.floor((isBoss?48:10) + scale*(isBoss?8.2:1.9)),
      xpDrop: Math.floor((isBoss?72:17) + scale*(isBoss?10.5:2.65)),
    };
  },

  generateBattleGroup(dungeonLevel, difficulty){
    const packSize = Math.random()<0.44 ? U.randInt(2,3) : 1;
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

  // room types that guarantee a fight breaks out (boss is handled separately and
  // is always appended, so it isn't included here).
  COMBAT_ROOM_TYPES: new Set(['battle', 'ambush', 'guarded_cache']),

  // post-processes a generated room list so a run can never be cleared without
  // fighting: breaks up long non-combat streaks and tops up a minimum combat quota.
  enforceCombatPacing(roomTypes){
    const types = [...roomTypes];
    const isCombat = t => this.COMBAT_ROOM_TYPES.has(t);
    const maxStreak = BALANCE.maxNonCombatStreak;

    // pass 1: no more than `maxStreak` non-combat rooms in a row
    let streak = 0;
    for(let i=0;i<types.length;i++){
      if(isCombat(types[i])){ streak = 0; continue; }
      streak++;
      if(streak > maxStreak){ types[i] = 'battle'; streak = 0; }
    }

    // pass 2: make sure a minimum share of the floor is combat, spread out evenly
    const minCombat = Math.max(1, Math.ceil(types.length * BALANCE.minCombatFraction));
    const combatCount = types.filter(isCombat).length;
    if(combatCount < minCombat){
      const nonCombatIdx = types.map((t,i)=>({t,i})).filter(x=>!isCombat(x.t)).map(x=>x.i);
      const need = Math.min(minCombat - combatCount, nonCombatIdx.length);
      const step = Math.max(1, Math.floor(nonCombatIdx.length/Math.max(1,need)));
      for(let k=0, idx=0; k<need && idx<nonCombatIdx.length; k++, idx+=step){
        types[nonCombatIdx[idx]] = 'battle';
      }
    }
    return types;
  },

  generateDungeon(playerLevel, difficultyId){
    const difficulty = BALANCE.difficulties[difficultyId];
    const theme = U.pick(DUNGEON_THEMES);
    const roomCount = BALANCE.roomCount(playerLevel);
    let roomTypes = [];
    const weights = [
      {t:'battle', w:26},{t:'chest', w:15},{t:'merchant', w:8},
      {t:'gamble', w:6},{t:'trap', w:7},{t:'shrine', w:5},{t:'mystery', w:6},
      {t:'ambush', w:9},{t:'archive', w:5},{t:'wishing_well', w:5},
      {t:'collapse', w:5},{t:'wandering_healer', w:5},{t:'cursed_altar', w:4},
      {t:'bonfire', w:6},{t:'black_market', w:5},{t:'puzzle_door', w:6},
      {t:'foraging', w:6},{t:'guarded_cache', w:8},{t:'deep_pool', w:5},
      {t:'abandoned_camp', w:5},
    ];
    for(let i=0;i<roomCount-1;i++){
      roomTypes.push(U.weightedPick(weights, x=>x.w).t);
    }
    roomTypes = this.enforceCombatPacing(roomTypes);
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
