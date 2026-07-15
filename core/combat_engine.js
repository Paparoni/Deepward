/* ============================================================
   COMBAT ENGINE
   ============================================================ */
const EFFECT_HANDLERS = {
  lifesteal:(ctx,v)=>{ ctx.attacker.hp = Math.min(ctx.maxHp, ctx.attacker.hp + Math.round(ctx.damage*v/100)); },
  stunChance:(ctx,v)=>{ if(Math.random()*100<v){ ctx.target._stunned = true; ctx.notes.push(`${ctx.targetName} is stunned!`); } },
  critDmgBonus:()=>{}, // applied inline during damage calc
  critChanceBonus:()=>{}, // applied inline during damage calc
  thorns:(ctx,v)=>{ if(ctx.direction==='incoming'){ const reflect=Math.round(ctx.damage*v/100); ctx.source.hp -= reflect; ctx.notes.push(`Thorns reflect ${reflect} damage!`); } },
  regenPerTurn:(ctx,v)=>{ ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + Math.round(v)); },
  goldFind:()=>{}, // applied at reward time
  xpBonus:()=>{}, // applied at reward time
  dodgeChance:(ctx,v)=>{ if(ctx.direction==='incoming' && Math.random()*100<v){ ctx.dodged = true; ctx.notes.push(`Evaded completely!`); } },
  doubleHitChance:(ctx,v)=>{ if(ctx.direction==='outgoing' && Math.random()*100<v){ ctx.extraHit = true; } },
  revive:(ctx,v)=>{ if(ctx.player.hp<=0 && !ctx.player._revivedThisDungeon){ ctx.player._revivedThisDungeon=true; ctx.player.hp=Math.round(ctx.maxHp*v/100); ctx.notes.push('A deathless vow refuses to let you fall!'); } },
  doubleDamageFirstTurn:(ctx)=>{ if(ctx.direction==='outgoing' && !ctx.combat._firstStrikeUsed){ ctx.combat._firstStrikeUsed=true; ctx.damage*=2; ctx.notes.push('Opening Requiem doubles the blow!'); } },
  executeThreshold:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.target.hp>0 && (ctx.target.hp/ctx.target.maxHp*100)<=v){ ctx.damage = ctx.target.hp; ctx.notes.push('A merciless finishing blow!'); } },
  damageImmuneChance:(ctx,v)=>{ if(ctx.direction==='incoming' && Math.random()*100<v){ ctx.damage=0; ctx.notes.push('The blow simply fails to land.'); } },
  statDrainOnHit:(ctx,v)=>{ if(ctx.direction==='outgoing'){ const drain=Math.round(ctx.target.atk*v/100); ctx.target.atk=Math.max(1,ctx.target.atk-drain); ctx.attacker._drained=(ctx.attacker._drained||0)+drain; ctx.notes.push(`Siphoned ${drain} ATK from ${ctx.targetName}.`); } },
  echoStrike:(ctx,v)=>{ if(ctx.direction==='outgoing' && Math.random()*100<v){ ctx.echo = Math.round(ctx.damage*0.4); } },
  bonusDamagePct:(ctx,v)=>{ if(ctx.direction==='outgoing'){ ctx.damage=Math.round(ctx.damage*(1+v/100)); } },
  lowHpDamageBonus:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.maxHp && (ctx.player.hp/ctx.maxHp*100)<50){ ctx.damage=Math.round(ctx.damage*(1+v/100)); } },
  reviveOncePerFight:(ctx,v)=>{ if(ctx.player.hp<=0 && !ctx.player._revivedThisFight){ ctx.player._revivedThisFight=true; ctx.player.hp=Math.round(ctx.maxHp*v/100); ctx.notes.push('Second Wind pulls you back from the brink!'); } },
  comboDamage:(ctx,v)=>{ if(ctx.direction==='outgoing'){ ctx.damage=Math.round(ctx.damage*(1+(ctx.combo||0)*v/100)); } },
  bossDamageBonus:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.target.isBoss){ ctx.damage=Math.round(ctx.damage*(1+v/100)); } },
  critInstantKillChance:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.isCrit && ctx.target && !ctx.target.isBoss && Math.random()*100<v){ ctx.damage=ctx.target.hp; ctx.notes.push('Annihilated!'); } },
  damageCapPct:(ctx,v)=>{ if(ctx.direction==='incoming' && ctx.maxHp){ const cap=Math.round(ctx.maxHp*v/100); if(ctx.damage>cap) ctx.damage=cap; } },
  manaOnHit:(ctx,v)=>{ if(ctx.direction==='outgoing'){ ctx.player.mp = Math.min(ctx.maxMp, ctx.player.mp + v); } },
  hpOnKill:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.target.hp<=ctx.damage){ ctx.player.hp = Math.min(ctx.maxHp, ctx.player.hp + v); ctx.notes.push(`The killing blow restores ${v} HP.`); } },
  manaOnKill:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.target.hp<=ctx.damage){ const amt=Math.round(ctx.maxMp*v/100); ctx.player.mp = Math.min(ctx.maxMp, ctx.player.mp + amt); ctx.notes.push('Mana surges back into you.'); } },
  defShred:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.target.def!=null){ const shred=Math.round(ctx.target.def*v/100); ctx.target.def=Math.max(0, ctx.target.def-shred); ctx.notes.push(`${ctx.targetName}'s armor shreds.`); } },
  mdefShred:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.target.mdef!=null){ const shred=Math.round(ctx.target.mdef*v/100); ctx.target.mdef=Math.max(0, ctx.target.mdef-shred); ctx.notes.push(`${ctx.targetName}'s wards crack.`); } },
  adrenaline:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.combat){ ctx.combat.buffs.push({stat:'spd', pct:v, name:'Adrenaline'}); } },
  arcaneMomentum:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.combat){ ctx.combat.buffs.push({stat:'matk', pct:v, name:'Arcane Momentum'}); } },
  missingHpPower:(ctx,v)=>{ if(ctx.direction==='outgoing') ctx.damage=Math.round(ctx.damage*(1+(1-ctx.player.hp/ctx.maxHp)*v/100)); },
  highHpDamage:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.player.hp/ctx.maxHp>.8) ctx.damage=Math.round(ctx.damage*(1+v/100)); },
  highManaDamage:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.maxMp && ctx.player.mp/ctx.maxMp>.7) ctx.damage=Math.round(ctx.damage*(1+v/100)); },
  lowManaDamage:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.maxMp && ctx.player.mp/ctx.maxMp<.3) ctx.damage=Math.round(ctx.damage*(1+v/100)); },
  healOnCrit:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.isCrit) ctx.player.hp=Math.min(ctx.maxHp,ctx.player.hp+Math.round(ctx.maxHp*v/100)); },
  manaOnCrit:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.isCrit) ctx.player.mp=Math.min(ctx.maxMp,ctx.player.mp+Math.round(ctx.maxMp*v/100)); },
  soloEnemyDamage:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.combat.monsters.filter(m=>m.hp>0).length===1) ctx.damage=Math.round(ctx.damage*(1+v/100)); },
  crowdDamage:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.combat.monsters.filter(m=>m.hp>0).length>=3) ctx.damage=Math.round(ctx.damage*(1+v/100)); },
  roundDamage:(ctx,v)=>{ if(ctx.direction==='outgoing') ctx.damage=Math.round(ctx.damage*(1+Math.max(0,ctx.combat.round-1)*v/100)); },
  earlyRoundDamage:(ctx,v)=>{ if(ctx.direction==='outgoing' && ctx.combat.round<=2) ctx.damage=Math.round(ctx.damage*(1+v/100)); },
  manaGuard:(ctx,v)=>{ if(ctx.direction==='incoming' && ctx.maxMp && ctx.player.mp/ctx.maxMp>.5) ctx.damage=Math.round(ctx.damage*(1-v/100)); },
  lowHpReduction:(ctx,v)=>{ if(ctx.direction==='incoming' && ctx.player.hp/ctx.maxHp<.35) ctx.damage=Math.round(ctx.damage*(1-v/100)); },
  damageReductionFromPower:(ctx,v)=>{ if(ctx.direction==='incoming'){ const power=Math.max(ctx.derived.atk,ctx.derived.matk); ctx.damage=Math.round(ctx.damage*(1-Math.min(25,Math.floor(power/v))/100)); } },
  glassCannon:(ctx,v)=>{ ctx.damage=Math.round(ctx.damage*(ctx.direction==='outgoing'?1+v/100:1.12)); },
  goldAndXp:()=>{},
};

// -- active-skill action types (used by class skill trees, see [1] CLASSES) --------
// To add a new active-skill behavior, add a case here and reference it from a
// skill's `action` field. `nuke`/`aoe` reuse resolveAttack under the hood so they
// automatically benefit from crit, elemental bonus stats, and item/skill traits.
const SKILL_ACTION_HANDLERS = {
  nuke(state, skill){
    const target = Engine.getTarget(state);
    if(!target) return;
    Engine.resolveAttack(state, state.derived, target, 'skill', true, null, {
      powerMult:skill.power||1, forcedElement:skill.forcedElement, executeThreshold:skill.executeThreshold, skillName:skill.name, magic:!!skill.magic,
    });
    if(target.hp<=0) Engine.log(state, `${target.name} falls.`, 'good');
  },
  aoe(state, skill){
    const targets = state.combat.monsters.filter(m=>m.hp>0);
    for(const t of targets){
      Engine.resolveAttack(state, state.derived, t, 'skill', true, null, {
        powerMult:skill.power||1, forcedElement:skill.forcedElement, skillName:skill.name, magic:!!skill.magic,
      });
      if(t.hp<=0) Engine.log(state, `${t.name} falls.`, 'good');
    }
  },
  heal(state, skill){
    const amt = Math.round(state.derived.maxHp*(skill.healPct||0)/100);
    const actual=Math.min(amt,state.derived.maxHp-state.player.hp);
    state.player.hp = Math.min(state.derived.maxHp, state.player.hp+amt);
    Metrics.addTotal('healing',actual);
    Metrics.healing(state.combat,actual);
    Engine.log(state, `${skill.name} restores <b>${amt} HP</b>.`, 'good');
  },
  buff(state, skill){
    state.combat.buffs.push({stat:skill.buffStat, pct:skill.buffValue, name:skill.name});
    Engine.log(state, `${skill.name} takes hold — +${skill.buffValue}% ${STAT_BY_ID[skill.buffStat].short} for the rest of the battle.`, 'good');
  },
  debuff(state, skill){
    // extension point: e.g. {id:'x', action:'debuff', debuffStat:'def', debuffValue:20}
    const target = Engine.getTarget(state);
    if(!target) return;
    target[skill.debuffStat] = Math.max(1, Math.round(target[skill.debuffStat]*(1-skill.debuffValue/100)));
    Engine.log(state, `${skill.name} weakens ${target.name}'s ${skill.debuffStat.toUpperCase()}.`, 'good');
  },
  // Paladin innate: strips every negative buff (monster debuffs) and DoT off the player.
  cleanse(state, skill){
    const c = state.combat;
    const hadAny = c.buffs.some(b=>b.pct<0) || c.playerDots.length>0;
    c.buffs = c.buffs.filter(b=>b.pct>=0);
    c.playerDots = [];
    Engine.log(state, hadAny ? `${skill.name} burns away every affliction weighing on you.` : `${skill.name} finds nothing to cleanse.`, 'good');
  },
  // Rogue innate: instantly clears every skill cooldown for another go at your rotation.
  resetCooldowns(state, skill){
    // The reset skill keeps its own recovery period, preventing a self-reset loop.
    for(const id of Object.keys(state.player.skillCooldowns)) if(id!==skill.id) state.player.skillCooldowns[id] = 0;
    Engine.log(state, `${skill.name} resets your whole kit — everything is ready again.`, 'good');
  },
  // Necromancer innate: converts a sliver of your own life into mana.
  manaTap(state, skill){
    const hpCost = Math.round(state.derived.maxHp*(skill.hpCostPct||8)/100);
    const mpGain = Math.round(state.derived.maxMp*(skill.manaPct||30)/100);
    state.player.hp = Math.max(1, state.player.hp - hpCost);
    state.player.mp = Math.min(state.derived.maxMp, state.player.mp + mpGain);
    Engine.log(state, `${skill.name} trades <b>${hpCost} HP</b> for <b>${mpGain} MP</b>.`, 'good');
  },
  // Elementalist innate: a versatile bolt that picks a random element each cast.
  nukeRandomElement(state, skill){
    const target = Engine.getTarget(state);
    if(!target) return;
    const element = U.pick(ELEMENTS).id;
    Engine.resolveAttack(state, state.derived, target, 'skill', true, null, {
      powerMult:skill.power||1, forcedElement:element, skillName:skill.name, magic:!!skill.magic,
    });
    if(target.hp<=0) Engine.log(state, `${target.name} falls.`, 'good');
  },
};

const Engine = {
  log(state, html, cls='combat'){ state.log.push({html, cls}); if(state.log.length>60) state.log.shift(); },

  // ---- derived stats (base + gear + class + skill passives applied at query time) ----
  computeDerived(state){
    const p = state.player;
    const cls = CLASS_BY_ID[p.classId];
    const totals = {};
    for(const s of CORE_STATS) totals[s.id] = BALANCE.playerBaseStat[s.id] + (cls.statMods[s.id]||0) + Math.round(BALANCE.playerStatPerLevel[s.id]*(p.level-1));
    for(const s of ELEMENT_STATS) totals[s.id]=0;
    const allTraits = [];
    for(const slotId of Object.keys(state.equipment)){
      const item = state.equipment[slotId];
      if(!item) continue;
      for(const [k,v] of Object.entries(item.stats)) totals[k]=(totals[k]||0)+v;
      for(const t of item.uniqueTraits) allTraits.push(t);
      if(item.mythicTrait) allTraits.push(item.mythicTrait);
    }
    // class skill passives: direct stat bonuses apply here, everything else reuses EFFECT_HANDLERS via the trait list
    for(const skillId of p.unlockedSkills){
      const skill = cls.skillTree.find(sk=>sk.id===skillId);
      if(!skill || skill.kind!=='passive') continue;
      if(skill.effect.type==='statBonus'){
        totals[skill.effect.stat] = (totals[skill.effect.stat]||0) + skill.effect.value;
      } else {
        allTraits.push({id:skill.id, name:skill.name, type:skill.effect.type, value:skill.effect.value, desc:skill.desc});
      }
    }
    // class-innate passive: baked into the discipline itself, active regardless of which
    // route was chosen or how many skill points have been spent.
    if(cls.innatePassive){
      const ip = cls.innatePassive;
      if(ip.effect.type==='statBonus'){
        totals[ip.effect.stat] = (totals[ip.effect.stat]||0) + ip.effect.value;
      } else {
        allTraits.push({id:ip.id, name:ip.name, type:ip.effect.type, value:ip.effect.value, desc:ip.desc});
      }
    }
    // generic dungeon-wide flat stat buffs (bonfire, deep_pool, etc. push onto this);
    // applied here so they survive refreshDerived recalculation for the rest of the dungeon.
    if(state.dungeon && state.dungeon._buffs){
      for(const b of state.dungeon._buffs) totals[b.stat] = (totals[b.stat]||0) + b.flat;
    }
    let maxHp = BALANCE.maxHp(p.level, totals.def) + (totals.hp||0);
    let maxMp = BALANCE.maxMp(p.level, totals.mdef) + (totals.mp||0);
    // Apply build-defining conversions after ordinary additive stats, making the
    // item sheet deterministic and allowing focused gear to compound coherently.
    for(const trait of allTraits){
      if(trait.type==='statConversion'){
        const source = trait.source==='maxHp' ? maxHp : trait.source==='maxMp' ? maxMp : (totals[trait.source]||0);
        totals[trait.target] = Math.round((totals[trait.target]||0) + source*trait.value/100);
      } else if(trait.type==='elementMastery'){
        const best = ELEMENT_STATS.reduce((a,s)=>(totals[s.id]||0)>(totals[a.id]||0)?s:a, ELEMENT_STATS[0]);
        totals[best.id] = Math.round((totals[best.id]||0)*(1+trait.value/100));
      } else if(trait.type==='critFromPower'){
        totals.critChance += Math.floor(Math.max(totals.atk,totals.matk)/Math.max(1,trait.value));
      } else if(trait.type==='maxHpPercent'){
        maxHp = Math.round(maxHp*(1+trait.value/100));
      } else if(trait.type==='maxMpPercent'){
        maxMp = Math.round(maxMp*(1+trait.value/100));
      } else if(trait.type==='elementFromCore'){
        const best = ELEMENT_STATS.reduce((a,s)=>(totals[s.id]||0)>(totals[a.id]||0)?s:a, ELEMENT_STATS[0]);
        totals[best.id] += Math.round(Math.max(totals.atk,totals.matk)*trait.value/100);
      } else if(trait.type==='balancedPower' && Math.min(totals.atk,totals.matk)/Math.max(totals.atk,totals.matk)>=.8){
        totals.atk=Math.round(totals.atk*(1+trait.value/100)); totals.matk=Math.round(totals.matk*(1+trait.value/100));
      } else if(trait.type==='balancedDefense' && Math.min(totals.def,totals.mdef)/Math.max(totals.def,totals.mdef)>=.8){
        totals.def=Math.round(totals.def*(1+trait.value/100)); totals.mdef=Math.round(totals.mdef*(1+trait.value/100));
      } else if(trait.type==='allCorePercent'){
        for(const id of ['atk','def','matk','mdef','spd','hitEff','hitRes']) totals[id]=Math.round(totals[id]*(1+trait.value/100));
      } else if(trait.type==='elementAllPercent'){
        for(const stat of ELEMENT_STATS) totals[stat.id]=Math.round(totals[stat.id]*(1+trait.value/100));
      }
    }
    // dungeon-wide risk/reward pact from the cursed_altar event (see EVENT_HANDLERS);
    // applied here so it survives refreshDerived recalculation for the rest of the dungeon.
    if(state.dungeon && state.dungeon._altarPact){
      totals.atk = Math.round(totals.atk*1.3);
      totals.matk = Math.round(totals.matk*1.3);
      maxHp = Math.max(1, Math.round(maxHp*0.85));
    }
    return {...totals, maxHp, maxMp, traits:allTraits};
  },

  refreshDerived(state){ state.derived = this.computeDerived(state); },

  grantItem(state, item){ state.inventory.push(item); },

  grantMaterial(state, materialId, amount=1){
    state.player.materials[materialId] = (state.player.materials[materialId]||0) + amount;
  },

  lootAffinities(state){
    const cls=CLASS_BY_ID[state.player.classId];
    const weights={};
    for(const [stat,value] of Object.entries(cls.statMods)) if(value>0) weights[stat]=1.55;
    // Learned subclass nodes progressively bias drops toward their damage engine.
    for(const id of state.player.unlockedSkills){
      const skill=cls.skillTree.find(node=>node.id===id);
      if(!skill) continue;
      if(skill.magic) weights.matk=(weights.matk||1)+.22;
      else if(skill.kind==='active') weights.atk=(weights.atk||1)+.18;
      if(skill.forcedElement) weights[`${skill.forcedElement}Dmg`]=(weights[`${skill.forcedElement}Dmg`]||1)+.32;
      if(skill.effect?.type==='statBonus') weights[skill.effect.stat]=(weights[skill.effect.stat]||1)+.16;
    }
    for(const stat of Object.keys(weights)) weights[stat]=Math.min(2.8,weights[stat]);
    return weights;
  },

  equip(state, item){
    if(state.mode==='combat'){ this.log(state,'Equipment cannot be changed during combat.', 'bad'); return false; }
    let slotId = item.slot;
    if(slotId==='accessory1' || slotId==='accessory2'){
      slotId = state.equipment.accessory1 ? 'accessory2' : 'accessory1';
    }
    const prev = state.equipment[slotId];
    state.equipment[slotId] = item;
    state.inventory = state.inventory.filter(i=>i.uid!==item.uid);
    if(prev) state.inventory.push(prev);
    this.refreshDerived(state);
    return true;
  },

  equipToSlot(state, item, slotId){
    if(state.mode==='combat'){ this.log(state,'Equipment cannot be changed during combat.', 'bad'); return false; }
    const prev = state.equipment[slotId];
    state.equipment[slotId] = item;
    state.inventory = state.inventory.filter(i=>i.uid!==item.uid);
    if(prev) state.inventory.push(prev);
    this.refreshDerived(state);
    return true;
  },

  unequip(state, slotId){
    if(state.mode==='combat'){ this.log(state,'Equipment cannot be changed during combat.', 'bad'); return false; }
    const item = state.equipment[slotId];
    if(!item) return;
    state.equipment[slotId] = null;
    state.inventory.push(item);
    this.refreshDerived(state);
    return true;
  },

  sell(state, item){
    const tierIdx = TIERS.findIndex(t=>t.id===item.tier);
    const value = Math.round((8 + item.ilvl*2.2) * (1+tierIdx*.92));
    state.player.gold += value;
    state.inventory = state.inventory.filter(i=>i.uid!==item.uid);
    this.log(state, `Sold ${item.name} for ${value} gold.`, 'good');
  },

  // ---- battle lifecycle ----
  // Combat resolves in ROUNDS. Each round the player locks in one action
  // (attack / cast / a skill / defend / flee), then every combatant still
  // standing — player included — acts once in SPD-based initiative order.
  // Monsters occasionally telegraph a heavy "charge" attack a full round
  // before it lands, so a build's SPD (who reacts to what first) and its
  // Defend action (mitigates a round's incoming damage, and mitigates a
  // charged hit especially hard) both become real tactical levers.
  startCombat(state, monsters, opts={}){
    this.refreshDerived(state);
    state.mode='combat';
    state.ui.invOpen=false; state.ui.skillsOpen=false; state.ui.craftOpen=false; state.ui.slotOverlay=null;
    state.player._revivedThisFight = false;
    state.player._stunned = false;
    state.player.skillCooldowns = {};
    const dlvl = state.dungeon?.dungeonLevel || 1;
    const chargeChance = BALANCE.monsterChargeChance(dlvl);
    const utilityChance = BALANCE.monsterUtilityChance(dlvl);
    const bossCadence = BALANCE.bossChargeCadence(dlvl);
    for(const m of monsters){
      m._charging = false; m._chargingMove = null; m._utilityCooldown = 0; m._phaseUsed = false;
      if(m.isBoss) m._chargeCountdown = Math.max(2,Math.round(bossCadence/(m._chargeBias||1))) - 1;
    }
    state.combat = {
      monsters, isBoss: !!opts.isBoss, bonusLoot: !!opts.bonusLoot, round:1, _combo:0, _firstStrikeUsed:false,
      playerElement: (state.equipment.weapon?.element) || 'physical',
      buffs: [], // {stat, pct, name} — from player 'buff' skills OR monster debuffs (negative pct), lasts the whole fight
      playerDots: [], // {name, dmgPerTurn, turnsLeft} — poison/bleed-style damage over time on the player
      playerGuarding: false,
      resolving: false,
      skillMenuOpen: false,
      activeActor: null,
      targetUid: monsters[0] ? monsters[0].uid : null,
      // resolved once per fight from the dungeon's strategy ramp (see BALANCE) — how
      // often monsters charge/use their utility move, and how tight the boss's pattern is.
      chargeChance, utilityChance, bossCadence,
    };
    state.combat._metrics=Metrics.battleStarted(state,monsters);
  },

  // reads a stat with any active combat buffs (from skills) layered on top
  effectiveStat(state, statId){
    let v = state.derived[statId] || 0;
    if(state.mode==='combat' && state.combat){
      const totalPct = state.combat.buffs.filter(b=>b.stat===statId).reduce((sum,b)=>sum+b.pct,0);
      v *= 1+totalPct/100;
    }
    return Math.round(v);
  },

  // Returns every temporary source affecting a stat. Percent modifiers stack
  // additively, so -15% and -5% are presented and resolved as -20%.
  statModifiers(state, statId){
    const mods=[];
    if(state.mode==='combat' && state.combat){
      for(const b of state.combat.buffs) if(b.stat===statId) mods.push({name:b.name, pct:b.pct});
    }
    if(state.dungeon?._buffs){
      for(const b of state.dungeon._buffs) if(b.stat===statId) mods.push({name:b.name||'Dungeon preparation', flat:b.flat});
    }
    if(state.dungeon?._altarPact && (statId==='atk'||statId==='matk')) mods.push({name:'Cursed Altar pact', pct:30, baked:true});
    return mods;
  },

  // mythic 'extraTurnChance' trait: a chance to immediately repeat the action for free
  maybeExtraAction(state, actionFn){
    const t = state.derived.traits.find(x=>x.type==='extraTurnChance');
    if(t && Math.random()*100<t.value){
      this.log(state, 'Time loops back — you act again!', 'good');
      actionFn();
    }
  },

  // ---- targeting ----
  getTarget(state){
    const c = state.combat;
    if(!c) return null;
    return c.monsters.find(m=>m.uid===c.targetUid && m.hp>0) || c.monsters.find(m=>m.hp>0) || null;
  },

  setTarget(state, monsterUid){
    const c = state.combat;
    if(!c) return;
    const m = c.monsters.find(m=>m.uid===monsterUid && m.hp>0);
    if(m) c.targetUid = m.uid;
  },

  // ---- player round actions ----
  // Attack / Cast / Flee call straight in. Skills go through useSkill (which
  // validates mana + cooldown) but both end up here to lock in the round.
  playerAction(state, kind){
    const c = state.combat;
    if(!c || c.resolving || state.player.hp<=0) return;
    Metrics.count('actions',kind);
    if(kind==='flee'){
      // faster delvers slip away more easily than slower ones
      const fastestFoe = Math.max(0, ...c.monsters.filter(m=>m.hp>0).map(m=>m.spd));
      const chance = U.clamp(50 + (this.effectiveStat(state,'spd')-fastestFoe)*0.6, 15, 90);
      if(Math.random()*100<chance){ this.log(state,'You slip away from the fight.', 'flavor'); this.endCombat(state,'fled'); return; }
      this.log(state, 'You fail to escape!', 'bad');
      this.resolveRound(state, {kind:'flee-failed'});
      return;
    }
    if(!['attack','cast','defend'].includes(kind)) return;
    this.resolveRound(state, {kind});
  },

  // finds an active skill by id: a route skill (must be unlocked) or the
  // class's always-available innate active.
  findActiveSkill(state, skillId){
    const cls = CLASS_BY_ID[state.player.classId];
    if(cls.innateActive && cls.innateActive.id===skillId) return cls.innateActive;
    const skill = cls.skillTree.find(sk=>sk.id===skillId);
    return (skill && skill.kind==='active') ? skill : null;
  },

  useSkill(state, skillId){
    const c = state.combat;
    if(!c || c.resolving || state.player.hp<=0) return;
    const cls = CLASS_BY_ID[state.player.classId];
    const skill = this.findActiveSkill(state, skillId);
    if(!skill) return;
    const isInnate = cls.innateActive && cls.innateActive.id===skillId;
    if(!isInnate && !state.player.unlockedSkills.includes(skillId)) return;
    if(!c.monsters.some(m=>m.hp>0)) return;
    if((state.player.skillCooldowns[skillId]||0) > 0){ this.log(state, `${skill.name} is still recovering.`, 'bad'); return; }
    const manaReduction = Math.min(75,state.derived.traits.filter(t=>t.type==='manaCostReduction').reduce((sum,t)=>sum+t.value,0));
    const cost = Math.max(0, Math.round(skill.manaCost*(1-manaReduction/100)));
    if(state.player.mp < cost){ this.log(state, "Not enough MP for that.", 'bad'); return; }
    Metrics.count('actions','skill'); Metrics.count('skills',skillId);
    c.skillMenuOpen = false;
    this.resolveRound(state, {kind:'skill', skill, cost});
  },

  // executes the player's locked-in action (their single slot within the
  // round's initiative order)
  executePlayerAction(state, action){
    const c = state.combat;
    if(action.kind==='attack' || action.kind==='cast'){
      const target = this.getTarget(state);
      if(!target) return;
      this.resolveAttack(state, state.derived, target, action.kind, true);
      if(target.hp<=0) this.log(state, `${target.name} falls.`, 'good');
      this.maybeExtraAction(state, ()=>{
        const t2 = this.getTarget(state);
        if(t2){ this.resolveAttack(state, state.derived, t2, action.kind, true); if(t2.hp<=0) this.log(state, `${t2.name} falls.`, 'good'); }
      });
    } else if(action.kind==='skill'){
      const hpBefore=c.monsters.reduce((sum,m)=>sum+Math.max(0,m.hp),0), killsBefore=c.monsters.filter(m=>m.hp<=0).length, playerHpBefore=state.player.hp;
      state.player.mp -= action.cost;
      state.player.skillCooldowns[action.skill.id] = (action.skill.cooldown || 2) + 1;
      const handler = SKILL_ACTION_HANDLERS[action.skill.action];
      if(handler) handler(state, action.skill);
      this.maybeExtraAction(state, ()=>{ if(handler) handler(state, action.skill); });
      const hpAfter=c.monsters.reduce((sum,m)=>sum+Math.max(0,m.hp),0), killsAfter=c.monsters.filter(m=>m.hp<=0).length;
      Metrics.skillPerformance(action.skill,{damage:Math.max(0,hpBefore-hpAfter),healing:Math.max(0,state.player.hp-playerHpBefore),kills:Math.max(0,killsAfter-killsBefore),mana:action.cost});
    } else if(action.kind==='defend'){
      c.playerGuarding = true;
      c._combo = 0;
      const mpBack = Math.round(state.derived.maxMp*BALANCE.guardManaRestorePct);
      state.player.mp = Math.min(state.derived.maxMp, state.player.mp+mpBack);
      this.log(state, `You brace behind your guard, steadying your breath.${mpBack?` <b>+${mpBack} MP</b>.`:''}`, 'flavor');
      const guardFury = state.derived.traits.find(t=>t.type==='guardFury');
      if(guardFury){
        c.buffs.push({stat:'atk', pct:guardFury.value, name:guardFury.name});
        this.log(state, `${guardFury.name} turns your guard into leverage — +${guardFury.value}% ATK for the rest of the fight.`, 'good');
      }
    }
    // 'flee-failed' spends the round doing nothing further
  },

  // applies a monster move's non-damage effects. `hitResult` is what
  // resolveAttack returned (only present for 'strike' moves that connected).
  applyMonsterMoveExtras(state, m, move, hitResult){
    const c = state.combat;
    if(move.debuffStat && (!hitResult || hitResult.hit)){
      c.buffs.push({stat:move.debuffStat, pct:-move.debuffValue, name:move.name});
      this.log(state, `${m.name}'s ${move.name} saps your ${STAT_BY_ID[move.debuffStat]?.short||move.debuffStat}.`, 'bad');
    }
    if(move.lifestealPct && hitResult && hitResult.hit && hitResult.damage>0){
      const heal = Math.max(1, Math.round(hitResult.damage*move.lifestealPct/100));
      m.hp = Math.min(m.maxHp, m.hp+heal);
      this.log(state, `${m.name} drains <b>${heal}</b> HP from the blow.`, 'bad');
    }
    if(move.dotPct && hitResult && hitResult.hit && hitResult.damage>0){
      const dmgPerTurn = Math.max(1, Math.round(hitResult.damage*move.dotPct/100));
      c.playerDots.push({name:move.name, dmgPerTurn, turnsLeft:move.dotTurns||2});
      this.log(state, `${move.name} leaves you afflicted!`, 'bad');
    }
    if(move.stunChance && hitResult && hitResult.hit && Math.random()*100<move.stunChance){
      state.player._stunned = true;
      this.log(state, `${move.name} leaves you reeling!`, 'bad');
    }
  },

  // executes a non-strike monster move (buff/heal/pure debuff) or a strike
  // move (delegates to resolveAttack, then layers on its extras).
  executeMonsterMove(state, m, move, opts={}){
    const c = state.combat;
    if(move.kind==='buff'){
      m[move.buffStat] = Math.round((m[move.buffStat]||0) * (1+move.buffValue/100));
      this.log(state, `${m.name} uses <b>${move.name}</b>, growing stronger!`, 'bad');
      return;
    }
    if(move.kind==='heal'){
      const amt = Math.round(m.maxHp*move.healPct/100);
      m.hp = Math.min(m.maxHp, m.hp+amt);
      this.log(state, `${m.name} uses <b>${move.name}</b>, recovering <b>${amt}</b> HP!`, 'bad');
      return;
    }
    if(move.kind==='debuff'){
      c.buffs.push({stat:move.debuffStat, pct:-move.debuffValue, name:move.name});
      this.log(state, `${m.name} uses <b>${move.name}</b>, weakening you!`, 'bad');
      return;
    }
    // 'strike'
    const result = this.resolveAttack(state, m, {hp:state.player.hp}, 'attack', false, m, {
      powerMult:(move.power||1)*(opts.chargeBonus||1), forcedElement:move.forcedElement, charged:!!opts.charged, skillName:move.name,
    });
    this.applyMonsterMoveExtras(state, m, move, result);
  },

  // decides and executes one monster's turn: stun check → one-time low-HP
  // phase move → release a telegraphed charge → maybe start a new charge →
  // maybe reach for the cooldown-gated utility move → plain attack.
  monsterTurn(state, m){
    const c = state.combat;
    if(m.hp<=0) return;
    Metrics.mobAction(m,'turn');
    if(m._stunned){ m._stunned=false; this.log(state, `${m.name} is stunned and cannot act.`, 'flavor'); return; }

    const phaseMove = m.moves[2];
    if(phaseMove && !m._phaseUsed && (m.hp/m.maxHp*100)<=40){
      m._phaseUsed = true;
      m._charging = false; // a phase move interrupts any in-progress wind-up
      this.executeMonsterMove(state, m, phaseMove);
      return;
    }

    if(m._charging){
      Metrics.mobAction(m,'charge');
      const move = m._chargingMove || m.moves[0] || {kind:'strike', power:1};
      m._charging = false; m._chargingMove = null;
      if(m.isBoss) m._chargeCountdown = Math.max(2,Math.round(c.bossCadence/(m._chargeBias||1)));
      this.log(state, `${m.name} unleashes ${move.name || 'the blow'} it's been building!`, 'bad');
      this.executeMonsterMove(state, m, move, {chargeBonus:BALANCE.chargeDamageMult, charged:true});
      return;
    }

    let startsCharge = false;
    if(m.isBoss){
      m._chargeCountdown--;
      startsCharge = m._chargeCountdown<=0;
    } else {
      startsCharge = Math.random() < c.chargeChance*(m._chargeBias||1);
    }
    if(startsCharge && m.moves[0]){
      m._charging = true; m._chargingMove = m.moves[0];
      this.log(state, `${m.name} begins channeling <b>${m.moves[0].name}</b> — brace yourself!`, 'bad');
      return;
    }

    const utilityMove = m.moves[1];
    if(utilityMove && m._utilityCooldown<=0 && Math.random()<c.utilityChance*(m._utilityBias||1)){
      Metrics.mobAction(m,'utility');
      m._utilityCooldown = BALANCE.monsterUtilityCooldown;
      this.executeMonsterMove(state, m, utilityMove);
      return;
    }

    this.resolveAttack(state, m, {hp:state.player.hp}, 'attack', false, m);
  },

  // resolves one full round: player's locked-in action plus every surviving
  // monster's turn, all ordered by SPD (with a little jitter for near-ties).
  resolveRound(state, action){
    const c = state.combat;
    if(!c || c.resolving) return;
    c.resolving = true;
    c.skillMenuOpen = false;
    c.playerGuarding = action.kind==='defend';
    const jitter = ()=> (Math.random()*2-1) * BALANCE.initiativeJitter;
    const combatants = [
      {type:'player', spd:this.effectiveStat(state,'spd')+jitter()},
      ...c.monsters.filter(m=>m.hp>0).map(m=>({type:'monster', ref:m, spd:m.spd+jitter()})),
    ].sort((a,b)=>b.spd-a.spd);

    const runNext = index => {
      if(state.combat!==c) return;
      if(index>=combatants.length || state.player.hp<=0 || c.monsters.every(m=>m.hp<=0)){
        c.activeActor = 'round-end';
        this.endOfRound(state);
        if(state.combat===c){ c.resolving=false; c.activeActor=null; }
        render();
        return;
      }
      const combatant = combatants[index];
      if(combatant.type==='player'){
        c.activeActor = 'player';
        if(state.player._stunned){ state.player._stunned=false; this.log(state, "You're reeling and can't act this round!", 'bad'); }
        else this.executePlayerAction(state, action);
      } else if(combatant.ref.hp>0){
        c.activeActor = combatant.ref.uid;
        this.monsterTurn(state, combatant.ref);
      }
      render();
      const pace={fast:.55,normal:1,cinematic:1.55}[state.settings?.combatPace]||1;
      setTimeout(()=>runNext(index+1), BALANCE.combatActionDelayMs*pace);
    };
    const pace={fast:.55,normal:1,cinematic:1.55}[state.settings?.combatPace]||1;
    setTimeout(()=>runNext(0), Math.round(BALANCE.combatActionDelayMs*.55*pace));
  },

  // regen, DoT ticks, cooldown ticks, guard reset, retargeting, and the defeat/victory checks
  endOfRound(state){
    const c = state.combat;
    if(!c) return;
    for(const t of state.derived.traits){
      if(t.type==='regenPerTurn') state.player.hp = Math.min(state.derived.maxHp, state.player.hp + Math.round(t.value));
      if(t.type==='mpRegenPerTurn') state.player.mp = Math.min(state.derived.maxMp, state.player.mp + Math.round(t.value));
    }
    if(state.player.hp>0 && c.playerDots.length){
      for(const dot of c.playerDots){
        if(dot.turnsLeft<=0) continue;
        state.player.hp = Math.max(0, state.player.hp - dot.dmgPerTurn);
        this.log(state, `${dot.name} gnaws at you for <b>${dot.dmgPerTurn}</b> damage.`, 'bad');
        dot.turnsLeft--;
      }
      c.playerDots = c.playerDots.filter(d=>d.turnsLeft>0);
    }
    state.player.hp = U.clamp(state.player.hp, 0, state.derived.maxHp);
    c.playerGuarding = false;
    for(const id of Object.keys(state.player.skillCooldowns)){
      state.player.skillCooldowns[id] = Math.max(0, state.player.skillCooldowns[id]-1);
    }
    for(const m of c.monsters){
      if(m.hp>0 && m._utilityCooldown>0) m._utilityCooldown--;
    }
    if(!c.monsters.find(m=>m.uid===c.targetUid && m.hp>0)){
      const nextAlive = c.monsters.find(m=>m.hp>0);
      c.targetUid = nextAlive ? nextAlive.uid : null;
    }
    if(state.player.hp<=0){
      let revived=false;
      for(const t of state.derived.traits){
        if(t.type==='revive' || t.type==='reviveOncePerFight'){
          const ctx={player:state.player, maxHp:state.derived.maxHp};
          EFFECT_HANDLERS[t.type](ctx, t.value);
          if(ctx.player.hp>0) revived=true;
        }
      }
      if(!revived){ this.log(state,'You collapse — the dungeon has beaten you.', 'bad'); this.endCombat(state,'defeat'); return; }
    }
    if(c.monsters.every(m=>m.hp<=0)){ this.endCombat(state,'victory'); return; }
    c.round++;
  },

  // unified damage resolution; attacker/defender are stat-bearing objects.
  // opts: {powerMult, forcedElement, executeThreshold, skillName, charged} — used by active skills & monster charge attacks.
  resolveAttack(state, attackerStats, targetRef, kind, isPlayer, monsterObj=null, opts={}){
    const c = state.combat;
    const traits = isPlayer ? state.derived.traits : [];
    const useMagic = kind==='cast' || (kind==='skill' && !!opts.magic);
    const powerMult = opts.powerMult || 1;
    const atkStat = isPlayer
      ? this.effectiveStat(state, useMagic ? 'matk' : 'atk') * powerMult
      : (useMagic ? attackerStats.matk : attackerStats.atk) * powerMult;
    const defStat = isPlayer ? (targetRef.def||0) : this.effectiveStat(state,'def');
    const mdefStat = isPlayer ? (targetRef.mdef||0) : this.effectiveStat(state,'mdef');
    let relevantDef = useMagic ? mdefStat : defStat;
    if(!isPlayer && opts.charged) relevantDef *= (1-BALANCE.chargeDefPiercePct);
    const element = opts.forcedElement || (isPlayer ? c.playerElement : monsterObj.element);
    const elemBonusStat = element+'Dmg';
    const elemBonus = isPlayer ? (state.derived[elemBonusStat]||0) : 0;
    const verb = opts.skillName ? `use ${opts.skillName} on` : (useMagic?'cast a spell at':'strike');

    let hitEff = isPlayer ? state.derived.hitEff : attackerStats.hitEff;
    let hitRes = isPlayer ? (targetRef.hitRes||0) : this.effectiveStat(state,'hitRes');
    const hitChance = U.clamp(85 + (hitEff-hitRes)*0.5, 55, 98);
    const ctxBase = {notes:[], combat:c, player:state.player, derived:state.derived, maxHp: state.derived.maxHp, maxMp: state.derived.maxMp, combo: (c._combo||0)};

    if(Math.random()*100 > hitChance){
      if(isPlayer) Metrics.addTotal('misses');
      this.log(state, isPlayer ? `Your attack misses!` : `${monsterObj.name}'s attack misses!`, 'flavor');
      return {hit:false};
    }

    let critChance = 5 + hitEff*0.2;
    let critMult = 1.5;
    if(isPlayer){
      critChance += (state.derived.critChance||0);
      critMult += (state.derived.critDamage||0)/100;
    }
    if(isPlayer) for(const t of traits){
      if(t.type==='critChanceBonus') critChance += t.value;
      if(t.type==='critDmgBonus') critMult += t.value/100;
      if(t.type==='firstHitCrit' && !c._firstAttackResolved) critChance += t.value;
    }
    const isCrit = Math.random()*100 < critChance;
    if(isPlayer && isCrit) Metrics.addTotal('crits');
    if(isPlayer) c._firstAttackResolved = true;

    let dmg = Math.max(1, Math.round((atkStat*1.0 - relevantDef*0.5) * U.rand(0.85,1.15)));
    dmg = Math.round(dmg * (1+elemBonus/100));
    let matchupNote='';
    if(isPlayer && element!=='physical' && targetRef.element && targetRef.element!=='physical'){
      if(BALANCE.elementalPreysOn[element]===targetRef.element){
        dmg=Math.round(dmg*BALANCE.elementalStrongMult); matchupNote='Elemental weakness!'; Metrics.count('elemental','strong');
      } else if(BALANCE.elementalPreysOn[targetRef.element]===element){
        dmg=Math.round(dmg*BALANCE.elementalResistMult); matchupNote=`${targetRef.name} resists the element.`; Metrics.count('elemental','resisted');
      }
    }
    if(isCrit) dmg = Math.round(dmg*critMult);

    const ctx = {...ctxBase, attacker:isPlayer?state.player:monsterObj, target:isPlayer?targetRef:state.player,
      targetName:isPlayer?targetRef.name:'You', damage:dmg, direction:'outgoing', source:isPlayer?state.player:monsterObj, isCrit};
    if(matchupNote) ctx.notes.push(matchupNote);

    // outgoing trait effects (only player has trait list currently)
    if(isPlayer){
      for(const t of traits){
        const h = EFFECT_HANDLERS[t.type];
        if(h) h({...ctx, direction:'outgoing'}, t.value);
      }
      if(opts.executeThreshold!=null && ctx.target.hp>0 && (ctx.target.hp/ctx.target.maxHp*100)<=opts.executeThreshold){
        ctx.damage = ctx.target.hp;
        ctx.notes.push('A merciless finishing blow!');
      }
    }
    dmg = ctx.damage;

    // apply to defender, with incoming-direction defensive traits if defender is player
    if(isPlayer){
      targetRef.hp = Math.max(0, targetRef.hp - dmg);
      Metrics.addTotal('damageDealt',dmg);
      Metrics.combatFlow(c,'dealt',dmg,targetRef);
      this.log(state, `You ${verb} ${targetRef.name} for <b>${dmg}</b>${isCrit?' (critical!)':''} damage.${ctx.notes.length? ' '+ctx.notes.join(' '):''}`, 'combat');
      if(ctx.extraHit){
        const extra = Math.max(1, Math.round(dmg*0.5));
        targetRef.hp = Math.max(0, targetRef.hp-extra);
        Metrics.addTotal('damageDealt',extra);
        Metrics.combatFlow(c,'dealt',extra,targetRef);
        this.log(state, `A twinned strike lands for another <b>${extra}</b> damage!`, 'combat');
      }
      if(ctx.echo){
        targetRef.hp = Math.max(0, targetRef.hp-ctx.echo);
        Metrics.addTotal('damageDealt',ctx.echo);
        Metrics.combatFlow(c,'dealt',ctx.echo,targetRef);
        this.log(state, `An echo of the strike deals <b>${ctx.echo}</b> more damage.`, 'combat');
      }
      c._combo = (c._combo||0)+1;
      return {hit:true, damage:dmg, crit:isCrit};
    } else {
      const incomingCtx = {...ctxBase, direction:'incoming', damage:dmg, attacker:monsterObj, target:state.player, targetName:'You', source:monsterObj};
      for(const t of state.derived.traits){
        const h = EFFECT_HANDLERS[t.type];
        if(h) h(incomingCtx, t.value);
      }
      let finalDmg = incomingCtx.dodged ? 0 : incomingCtx.damage;
      if(!incomingCtx.dodged && c.playerGuarding){
        let mit = opts.charged ? BALANCE.guardMitigationVsCharge : BALANCE.guardMitigation;
        const guardBonus = state.derived.traits.find(t=>t.type==='guardMitigationBonus');
        if(guardBonus) mit = Math.min(0.95, mit + guardBonus.value/100);
        finalDmg = Math.round(finalDmg*(1-mit));
        incomingCtx.notes.push('Your guard absorbs much of the blow.');
      }
      state.player.hp = Math.max(0, state.player.hp - finalDmg);
      Metrics.addTotal('damageTaken',finalDmg);
      Metrics.combatFlow(c,'taken',finalDmg,monsterObj);
      const monsterVerb = opts.skillName ? `uses ${opts.skillName} on` : (useMagic?'casts a spell at':(opts.charged?'unleashes a charged blow on':'strikes'));
      this.log(state, `${monsterObj.name} ${monsterVerb} you for <b>${finalDmg}</b>${isCrit?' (critical!)':''} damage.${incomingCtx.notes.length? ' '+incomingCtx.notes.join(' '):''}`, 'bad');
      return {hit:!incomingCtx.dodged, damage:finalDmg, crit:isCrit};
    }
  },

  endCombat(state, result){
    const c = state.combat;
    Metrics.battleEnded(state,result,c);
    if(result==='defeat'||result==='fled'||(result==='victory'&&c.isBoss)) Metrics.dungeonOutcome(state.dungeon?.difficultyId,result);
    if(result==='victory'){
      let gold=0, xp=0;
      for(const m of c.monsters){ gold+=m.goldDrop; xp+=m.xpDrop; }
      const sharedBonus = state.derived.traits.filter(t=>t.type==='goldAndXp').reduce((sum,t)=>sum+t.value, 0);
      const goldBonus = sharedBonus + state.derived.traits.filter(t=>t.type==='goldFind').reduce((sum,t)=>sum+t.value, 0);
      const xpBonus = sharedBonus + state.derived.traits.filter(t=>t.type==='xpBonus').reduce((sum,t)=>sum+t.value, 0);
      gold = Math.round(gold*(1+goldBonus/100));
      xp = Math.round(xp*(1+xpBonus/100));
      state.player.gold += gold;
      state.player.xp += xp;
      Metrics.reward(gold,xp);
      this.log(state, `Victory! You gain <b>${gold} gold</b> and <b>${xp} XP</b>.`, 'good');
      this.checkLevelUp(state);
      const isBoss = c.isBoss;
      const materialDrops = [];
      for(const monster of c.monsters){
        const material = Generators.rollCraftingMaterial(isBoss);
        if(!material) continue;
        this.grantMaterial(state, material.id);
        materialDrops.push(material.name);
      }
      if(materialDrops.length) this.log(state, `You recover crafting material: <b>${materialDrops.join(', ')}</b>.`, 'good');
      if(isBoss && Math.random()<0.22){
        const unknownRecipes = MYTHIC_RECIPES.filter(recipe=>!state.player.recipes.includes(recipe.id));
        if(unknownRecipes.length){
          const recipe = U.pick(unknownRecipes);
          state.player.recipes.push(recipe.id);
          this.log(state, `<b style="color:var(--t-mythic1)">Rare recipe discovered:</b> ${recipe.name}. Visit the Soulforge in town.`, 'good');
        }
      }
      let drop=null;
      const dropChance = isBoss ? 1.0 : (c.bonusLoot ? 0.7 : 0.4);
      if(Math.random()<dropChance){
        drop = Generators.generateItem(state.dungeon.dungeonLevel, {
          lootBonus: state.dungeon.difficulty.lootBonus + (isBoss?0.8: (c.bonusLoot?0.35:0)),
          forcedMinTier: isBoss ? 'rare' : (c.bonusLoot ? 'uncommon' : undefined),
          affinities:this.lootAffinities(state),
        });
      }
      state.combat=null;
      const proceed = (s)=>{ if(isBoss){ s.mode='complete'; } else { s.mode='explore'; this.finishRoom(s); } };
      if(drop){
        this.log(state, `The fallen carried something.`, 'flavor');
        this.presentItemDrop(state, drop, proceed);
      } else {
        proceed(state);
      }
    } else if(result==='fled'){
      state.combat=null; state.mode='explore';
    } else if(result==='defeat'){
      state.combat=null; state.mode='defeat';
    }
  },

  // shows an item card with Pick up / Leave choices; afterFn(state) runs once resolved
  presentItemDrop(state, item, afterFn){
    Metrics.loot(item,'offered');
    state.ui.pendingItem = item;
    state.ui.choices = [
      {label:'Pick it up', act:(s)=>{
        Metrics.loot(item,'taken');
        this.grantItem(s, item);
        this.log(s, `You take the <b style="color:${TIER_BY_ID[item.tier].color}">${item.name}</b> (${TIER_BY_ID[item.tier].name}).`, 'good');
        s.ui.pendingItem = null;
        afterFn(s);
      }},
      {label:'Leave it behind', act:(s)=>{
        Metrics.loot(item,'left');
        this.log(s, `You leave the ${item.name} where it lies.`, 'flavor');
        s.ui.pendingItem = null;
        afterFn(s);
      }},
    ];
    state.mode='event';
  },

  // rolls a varied chest outcome — gear, gold, materials, a small bundle, nothing,
  // or (rarely) a mimic that springs to attack instead of opening.
  resolveChest(state){
    const dlvl = state.dungeon.dungeonLevel;
    const lootBonus = state.dungeon.difficulty.lootBonus;
    const outcomes = [
      {t:'gear', w:34}, {t:'gold', w:22}, {t:'materials', w:16},
      {t:'bundle', w:11}, {t:'empty', w:7}, {t:'mimic', w:10},
    ];
    const outcome = U.weightedPick(outcomes, x=>x.w).t;

    if(outcome==='gear'){
      const item = Generators.generateItem(dlvl, {lootBonus,affinities:this.lootAffinities(state)});
      this.log(state, `Inside you find something.`, 'flavor');
      this.presentItemDrop(state, item, (s2)=>{ this.finishRoom(s2); });
    } else if(outcome==='gold'){
      const gold = Math.round(U.randInt(20,45) * (1+dlvl*0.12));
      state.player.gold += gold;
      this.log(state, `The chest holds no gear — just coin. Plenty of it: <b>${gold} gold</b>.`, 'good');
      this.finishRoom(state);
    } else if(outcome==='materials'){
      const count = U.randInt(1,3);
      const names = [];
      for(let i=0;i<count;i++){
        const m = U.pick(CRAFTING_MATERIALS);
        this.grantMaterial(state, m.id);
        names.push(m.name);
      }
      this.log(state, `Wrapped in oilcloth: <b>${names.join(', ')}</b>.`, 'good');
      this.finishRoom(state);
    } else if(outcome==='bundle'){
      const gold = Math.round(U.randInt(10,20) * (1+dlvl*0.1));
      const mat = U.pick(CRAFTING_MATERIALS);
      state.player.gold += gold;
      this.grantMaterial(state, mat.id);
      this.log(state, `A little of everything: <b>${gold} gold</b> and a <b>${mat.name}</b>.`, 'good');
      this.finishRoom(state);
    } else if(outcome==='empty'){
      this.log(state, `The chest creaks open — empty. Someone beat you to it.`, 'flavor');
      this.finishRoom(state);
    } else if(outcome==='mimic'){
      const tpl = {
        id:'mimic', name:'Mimic', title:'the Betrayer Chest', icon:'📦', element:'physical',
        flavor:'wood and iron peeling back to reveal teeth',
        atk:1.25, def:0.9, matk:0.3, mdef:0.6, spd:0.75,
      };
      const monster = Generators.monsterFromTemplate(tpl, dlvl, state.dungeon.difficulty.monsterMult, false);
      monster.goldDrop = Math.round(monster.goldDrop*1.5);
      monster.xpDrop = Math.round(monster.xpDrop*1.5);
      this.log(state, `The lid splits open into a maw of teeth — it was never a chest at all!`, 'bad');
      this.startCombat(state, [monster], {bonusLoot:true});
    }
  },

  checkLevelUp(state){
    let leveled=false;
    while(state.player.xp >= BALANCE.xpToNext(state.player.level)){
      state.player.xp -= BALANCE.xpToNext(state.player.level);
      state.player.level++;
      state.player.skillPoints += 2;
      Metrics.addTotal('levelsGained');
      leveled=true;
    }
    this.refreshDerived(state);
    if(leveled){
      state.player.hp = state.derived.maxHp;
      state.player.mp = state.derived.maxMp;
      this.log(state, `<b style="color:var(--gold)">Level up!</b> You are now level ${state.player.level}. (+2 skill points)`, 'good');
    }
  },

  // ---- skill tree ----
  canUnlock(state, skill){
    if(state.mode==='combat') return false;
    if(state.player.unlockedSkills.includes(skill.id)) return false;
    if(state.player.skillPoints < skill.cost) return false;
    if(skill.requires && !state.player.unlockedSkills.includes(skill.requires)) return false;
    if(skill.choiceGroup){
      const cls = CLASS_BY_ID[state.player.classId];
      const chosenRoot = cls.skillTree.find(candidate =>
        candidate.choiceGroup===skill.choiceGroup && state.player.unlockedSkills.includes(candidate.id)
      );
      if(chosenRoot) return false;
    }
    return true;
  },

  unlockSkill(state, skillId){
    if(state.mode==='combat'){ this.log(state,'New skills cannot be learned during combat.', 'bad'); return false; }
    const cls = CLASS_BY_ID[state.player.classId];
    const skill = cls.skillTree.find(sk=>sk.id===skillId);
    if(!skill || !this.canUnlock(state, skill)) return;
    state.player.skillPoints -= skill.cost;
    state.player.unlockedSkills.push(skillId);
    this.refreshDerived(state);
    this.log(state, `Learned <b>${skill.name}</b>.`, 'good');
    return true;
  },

  // ---- room / dungeon flow ----
  setChoices(state, choices){ state.ui.choices = choices; state.mode='event'; },
  renderCurrentChoices(state){ /* no-op hook for future animation */ },

  enterNextRoom(state){
    const d = state.dungeon;
    d.currentIndex++;
    state.log = [];
    state.ui.choices = null;
    state.ui.merchantStock = null;
    state.ui.pendingItem = null;
    if(d.currentIndex >= d.roomTypes.length){ state.mode='complete'; return; }
    const type = d.roomTypes[d.currentIndex];
    const isLast = d.currentIndex === d.roomTypes.length-1;
    this.log(state, `<span class="log-flavor">— ${isLast? 'The final chamber' : 'Room '+(d.currentIndex+1)+' of '+d.roomCount} —</span>`, 'flavor');
    const handler = EVENT_HANDLERS[type];
    const tookOverRender = handler(state);
    if(!tookOverRender && state.mode!=='combat') state.mode='event';
  },

  finishRoom(state){
    state.ui.choices = [{label:'Move deeper →', act:(s)=>{ this.enterNextRoom(s); }}];
    state.mode='event';
  },

  renderMerchant(state){
    state.ui.choices = 'merchant';
    state.mode='event';
  }
};
