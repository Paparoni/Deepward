const DUNGEON_MUTATORS = [
  {id:'blood_moon',name:'Blood Moon',desc:'Enemies deal 18% more damage; gold and XP rewards increase by 25%.',enemyPower:1.18,rewardMult:1.25},
  {id:'iron_depth',name:'Iron Depth',desc:'Enemies have 30% more HP; gear choices gain additional rarity weight.',enemyHp:1.30,lootBonus:.30},
  {id:'quickening',name:'The Quickening',desc:'You gain 20% SPD, enemies gain 15% SPD, and rewards increase by 10%.',playerPct:{spd:20},enemySpd:1.15,rewardMult:1.10},
  {id:'glass_oath',name:'Glass Oath',desc:'You gain 22% ATK and MATK but lose 18% maximum HP.',playerPct:{atk:22,matk:22},maxHpMult:.82},
  {id:'gilded_teeth',name:'Gilded Teeth',desc:'Enemies deal 12% more damage; gear choices gain substantial rarity weight.',enemyPower:1.12,lootBonus:.48},
  {id:'warded_halls',name:'Warded Halls',desc:'You gain 18% DEF and MDEF, but enemies have 20% more HP.',playerPct:{def:18,mdef:18},enemyHp:1.20},
  {id:'predators_clock',name:"Predator's Clock",desc:'Both sides gain 25% SPD; gold and XP rewards increase by 15%.',playerPct:{spd:25},enemySpd:1.25,rewardMult:1.15},
  {id:'prismatic_fault',name:'Prismatic Fault',desc:'All elemental damage bonuses increase by 20%; enemies deal 10% more damage.',elementPct:20,enemyPower:1.10},
];
const DUNGEON_BOONS = [
  {id:'hercules',name:"Hercules' Boon",desc:'+10% ATK for the remainder of the dungeon.',effect:{type:'statPercent',stat:'atk',value:10}},
  {id:'phoenix_seed',name:'Phoenix Seed',desc:'Once this dungeon, survive a killing blow with 30% HP.',effect:{type:'revive',value:30,dungeonLimited:true}},
  {id:'mirror_step',name:'Mirror Step',desc:'The first incoming hit of every battle misses completely.',effect:{type:'firstHitImmunity',value:1}},
  {id:'ember_crown',name:'Ember Crown',desc:'Killing an enemy spreads a three-stack Burn to every survivor.',effect:{type:'emberCommunion',value:8}},
  {id:'reapers_invitation',name:"Reaper's Invitation",desc:'Instantly execute non-boss enemies below 18% HP.',effect:{type:'reaperSeal',value:18}},
  {id:'time_splinter',name:'Time Splinter',desc:'Actions have a 14% chance to occur a second time.',effect:{type:'extraTurnChance',value:14}},
  {id:'storm_heart',name:'Storm Heart',desc:'Every hit restores missing MP and arcs into another enemy.',effect:{type:'stormcaller',value:5}},
  {id:'affliction_choir',name:'Affliction Choir',desc:'Elemental secondary effects are 35% stronger and may echo.',effects:[{type:'elementStatusPower',element:'all',value:35},{type:'statusEcho',value:25}]},
  {id:'colossus_memory',name:'Colossus Memory',desc:'Hits cannot exceed 24% max HP; prevented damage empowers your next attack.',effect:{type:'colossusLaw',value:24}},
  {id:'fortune_eater',name:'Fortune Eater',desc:'All future gear drafts gain significant rarity weight.',effect:{type:'lootBonus',value:.42}},
  {id:'blood_rite',name:'Blood Rite',desc:'Gain a temporary skill that sacrifices HP for a devastating dark strike.',skill:{id:'boon_blood_rite',name:'Blood Rite',kind:'active',action:'nuke',manaCost:0,hpCostPct:12,cooldown:3,power:2.35,forcedElement:'dark',desc:'Sacrifice 12% max HP for a 235% dark strike that guarantees a Doom Mark.',guaranteedStatus:true}},
  {id:'tempest_nova',name:'Tempest Nova',desc:'Gain a temporary skill that shocks every enemy and guarantees Static Arc.',skill:{id:'boon_tempest_nova',name:'Tempest Nova',kind:'active',action:'aoe',manaCost:18,cooldown:4,power:1.25,magic:true,forcedElement:'lightning',guaranteedStatus:true,desc:'Deal 125% lightning damage to all enemies and guarantee Static Arc.'}},
  {id:'sanctuary',name:'Portable Sanctuary',desc:'Gain a temporary skill that restores 40% maximum HP.',skill:{id:'boon_sanctuary',name:'Portable Sanctuary',kind:'active',action:'heal',manaCost:20,cooldown:4,healPct:40,desc:'Restore 40% of maximum HP.'}},
  {id:'war_trance',name:'War Trance',desc:'Gain a temporary skill that grants +45% ATK for the battle.',skill:{id:'boon_war_trance',name:'War Trance',kind:'active',action:'buff',manaCost:14,cooldown:4,buffStat:'atk',buffValue:45,desc:'Gain +45% ATK for the rest of the battle.'}},
  {id:'perfect_clarity',name:'Perfect Clarity',desc:'Gain a temporary skill that clears all debuffs and damage-over-time effects.',skill:{id:'boon_perfect_clarity',name:'Perfect Clarity',kind:'active',action:'cleanse',manaCost:12,cooldown:3,desc:'Remove every negative combat effect from yourself.'}},
  {id:'echo_script',name:'Echo Script',desc:'The first skill used each battle repeats for free.',effect:{type:'firstSkillEcho',value:1}},
  {id:'many_handed',name:'Many-Handed Stance',desc:'Basic attacks echo for 45% damage.',effect:{type:'relentlessEcho',value:45}},
  {id:'rolling_ruin',name:'Rolling Ruin',desc:'60% of overkill damage carries into another enemy.',effect:{type:'overkillSplash',value:60}},
  {id:'answering_steel',name:'Answering Steel',desc:'Return 35% of incoming damage to its source.',effect:{type:'counterStrike',value:35}},
  {id:'mana_carapace',name:'Mana Carapace',desc:'Begin every battle with a ward worth 12% maximum HP.',effect:{type:'startingWardPct',value:12}},
  {id:'doom_clock',name:'Doom Clock',desc:'Every fourth round, erupt for 50% of your highest attack against all enemies.',effect:{type:'countdownNova',value:4,power:50}},
  {id:'hush_brand',name:'Hush Brand',desc:'Hits delay enemy utility abilities by 2 rounds.',effect:{type:'utilityLock',value:2}},
  {id:'flow_state',name:'Flow State',desc:'Each MP spent adds 0.8% damage to that skill, up to 40%.',effect:{type:'manaFlow',value:.8,cap:40}},
  {id:'bone_lanterns',name:'Bone Lanterns',desc:'The first two hits each battle deal 35% less damage.',effect:{type:'boneShield',value:35,charges:2}},
  {id:'sealed_cataclysm',name:'Sealed Cataclysm',desc:'Gain a once-per-battle skill that deals 210% fire damage to every enemy.',skill:{id:'boon_sealed_cataclysm',name:'Sealed Cataclysm',kind:'active',action:'aoe',manaCost:0,cooldown:99,power:2.1,magic:true,forcedElement:'fire',guaranteedStatus:true,oncePerBattle:true,desc:'Once per battle, deal 210% fire damage to every enemy and guarantee Burn.'}},
];
const BOON_POWER_TIERS={
  lesser:{name:'Lesser',weight:10,color:'#9fc6a2'},
  greater:{name:'Greater',weight:4,color:'#7eb8ee'},
  mythic:{name:'Mythic',weight:1,color:'#d99bff'},
};
const BOON_RANK_WEIGHTS={1:1,2:.14,3:.035};
const BOON_OWNED_UPGRADE_MULT=10;
const BOON_POWER_BY_ID={
  hercules:'lesser',many_handed:'lesser',rolling_ruin:'lesser',mana_carapace:'lesser',flow_state:'lesser',bone_lanterns:'lesser',war_trance:'lesser',
  ember_crown:'greater',storm_heart:'greater',affliction_choir:'greater',fortune_eater:'greater',blood_rite:'greater',tempest_nova:'greater',sanctuary:'greater',perfect_clarity:'greater',answering_steel:'greater',doom_clock:'greater',hush_brand:'greater',
  phoenix_seed:'mythic',mirror_step:'mythic',reapers_invitation:'mythic',time_splinter:'mythic',colossus_memory:'mythic',echo_script:'mythic',sealed_cataclysm:'mythic',
};
const BOON_UPGRADE_TEXT={
  hercules:[`+25% ATK for the remainder of the dungeon.`,`+45% ATK for the remainder of the dungeon.`],
  phoenix_seed:[`Revive once this dungeon with 45% HP.`,`Revive once this dungeon with 65% HP.`],
  mirror_step:[`The first two incoming hits of every battle miss.`,`The first three incoming hits of every battle miss.`],
  ember_crown:[`Kills spread three-stack Burn and restore 14% HP.`,`Kills spread three-stack Burn and restore 22% HP.`],
  reapers_invitation:[`Execute non-boss enemies below 25% HP.`,`Execute non-boss enemies below 33% HP.`],
  time_splinter:[`Actions have a 23% chance to occur a second time.`,`Actions have a 32% chance to occur a second time.`],
  storm_heart:[`Hits restore more missing MP and launch a stronger arc.`,`Hits restore substantially more MP and launch a devastating arc.`],
  affliction_choir:[`Secondary effects are 55% stronger with a 40% echo chance.`,`Secondary effects are 80% stronger with a 60% echo chance.`],
  colossus_memory:[`Hits cannot exceed 18% max HP; prevented damage empowers your next attack.`,`Hits cannot exceed 13% max HP; prevented damage empowers your next attack.`],
  fortune_eater:[`Future gear drafts gain greatly increased rarity weight.`,`Future gear drafts gain immense rarity weight.`],
  blood_rite:[`Blood Rite deals 290% damage, costs less HP, and recovers faster.`,`Blood Rite deals 360% damage, costs less HP, and recovers faster.`],
  tempest_nova:[`Tempest Nova deals 155% damage and recovers faster.`,`Tempest Nova deals 195% damage and recovers faster.`],
  sanctuary:[`Portable Sanctuary restores 58% maximum HP and recovers faster.`,`Portable Sanctuary restores 78% maximum HP and recovers faster.`],
  war_trance:[`War Trance grants +65% ATK and recovers faster.`,`War Trance grants +90% ATK and recovers faster.`],
  perfect_clarity:[`Perfect Clarity costs less MP and recovers faster.`,`Perfect Clarity becomes nearly free and recovers faster.`],
  echo_script:[`The first two skills used each battle repeat for free.`,`The first three skills used each battle repeat for free.`],
  many_handed:[`Basic attacks echo for 70% damage.`,`Basic attacks repeat at full damage.`],
  rolling_ruin:[`All overkill damage carries into another enemy.`,`150% of overkill damage crashes through the enemy line.`],
  answering_steel:[`Return 60% of incoming damage.`,`Return 90% of incoming damage and build a small ward.`],
  mana_carapace:[`Begin battle with a 22% max-HP ward.`,`Begin battle with a 35% max-HP ward.`],
  doom_clock:[`Every third round, erupt for 80% of your highest attack.`,`Every second round, erupt for 115% of your highest attack.`],
  hush_brand:[`Hits delay enemy utility abilities by 3 rounds.`,`Hits delay utility abilities by 4 rounds and interrupt charging.`],
  flow_state:[`Each MP spent adds 1.2% damage to that skill, up to 60%.`,`Each MP spent adds 1.8% damage to that skill, up to 90%.`],
  bone_lanterns:[`The first three hits deal 50% less damage.`,`The first four hits deal 65% less damage.`],
  sealed_cataclysm:[`Sealed Cataclysm deals 275% damage and costs no MP.`,`Sealed Cataclysm deals 350% damage and may be used twice per battle.`],
};
function upgradedDungeonBoon(base,tier){
  const powerTier=BOON_POWER_BY_ID[base.id]||'lesser';
  if(tier<=1)return {...base,baseId:base.id,tier:1,powerTier};
  const scale=tier===2?1.65:2.3,boon={...base,baseId:base.id,tier,powerTier,name:`${base.name} ${tier===2?'II':'III'}`,desc:BOON_UPGRADE_TEXT[base.id]?.[tier-2]||base.desc};
  const upgradeEffect=effect=>{
    const out={...effect};
    if(base.id==='hercules')out.value=tier===2?25:45;
    else if(base.id==='mirror_step')out.value=tier;
    else if(base.id==='colossus_memory')out.value=tier===2?18:13;
    else if(base.id==='affliction_choir')out.value=effect.type==='statusEcho'?(tier===2?40:60):(tier===2?55:80);
    else if(base.id==='reapers_invitation')out.value=tier===2?25:33;
    else if(base.id==='phoenix_seed')out.value=tier===2?45:65;
    else if(base.id==='echo_script')out.value=tier;
    else if(base.id==='many_handed')out.value=tier===2?70:100;
    else if(base.id==='rolling_ruin')out.value=tier===2?100:150;
    else if(base.id==='answering_steel')out.value=tier===2?60:90;
    else if(base.id==='mana_carapace')out.value=tier===2?22:35;
    else if(base.id==='doom_clock'){out.value=tier===2?3:2;out.power=tier===2?80:115;}
    else if(base.id==='hush_brand')out.value=tier===2?3:4;
    else if(base.id==='flow_state'){out.value=tier===2?1.2:1.8;out.cap=tier===2?60:90;}
    else if(base.id==='bone_lanterns'){out.value=tier===2?50:65;out.charges=tier===2?3:4;}
    else out.value=Math.round(effect.value*scale*100)/100;
    return out;
  };
  if(base.effect)boon.effect=upgradeEffect(base.effect);
  if(base.effects)boon.effects=base.effects.map(upgradeEffect);
  if(base.skill){
    boon.skill={...base.skill,id:base.skill.id,name:boon.name,cooldown:Math.max(2,base.skill.cooldown-(tier-1)),manaCost:Math.max(0,Math.round(base.skill.manaCost*(tier===2?.8:.6)))};
    if(base.id==='blood_rite'){boon.skill.power=tier===2?2.9:3.6;boon.skill.hpCostPct=tier===2?10:8;}
    else if(base.id==='tempest_nova')boon.skill.power=tier===2?1.55:1.95;
    else if(base.id==='sanctuary')boon.skill.healPct=tier===2?58:78;
    else if(base.id==='war_trance')boon.skill.buffValue=tier===2?65:90;
    else if(base.id==='sealed_cataclysm'){boon.skill.power=tier===2?2.75:3.5;boon.skill.maxUses=tier===3?2:1;boon.skill.cooldown=tier===3?3:99;}
    boon.skill.desc=boon.desc;
  }
  return boon;
}

/* ============================================================
   GENERATORS: items, monsters, dungeons
   ============================================================ */
const Generators = {

  rollTier(lootBonus=0, rarityPenalty=0){
    const adjusted = TIERS.map(t=>{
      const rarityRank = TIERS.indexOf(t);
      // Difficulty meaningfully moves probability mass upward instead of merely
      // adding a small bonus to every tier.
      const rank = rarityRank/(TIERS.length-1);
      const boost = Math.pow(1 + lootBonus*1.35, rank*2.2) * (rarityRank===0 ? 1/(1+lootBonus*.55) : 1);
      const choiceTax=Math.pow(Math.max(.25,1-rarityPenalty),rarityRank*1.75);
      return {t, w: t.weight*boost*choiceTax};
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
    const levelLootBonus=U.clamp((Math.max(1,dungeonLevel)-1)*.03,0,1.4);
    const effectiveLootBonus=(opts.lootBonus||0)+levelLootBonus;
    const tier = opts.forcedTier
      ? TIER_BY_ID[opts.forcedTier]
      : opts.forcedMinTier
        ? TIERS[Math.max(TIERS.findIndex(t=>t.id===opts.forcedMinTier), TIERS.indexOf(this.rollTier(effectiveLootBonus,opts.rarityPenalty||0)))]
        : this.rollTier(effectiveLootBonus,opts.rarityPenalty||0);
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
    const mutatorPool=[...DUNGEON_MUTATORS],mutators=[];
    while(mutators.length<2&&mutatorPool.length){const picked=U.pick(mutatorPool);mutators.push(picked);mutatorPool.splice(mutatorPool.indexOf(picked),1);}
    return {
      theme, difficulty, difficultyId,
      dungeonLevel: playerLevel,
      roomTypes, roomCount, mutators, boons:[], boonMilestones:[],
      currentIndex: -1, // -1 = not yet entered first room
      cleared: false,
    };
  }
};
