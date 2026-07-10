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
};

// -- active-skill action types (used by class skill trees, see [1] CLASSES) --------
// To add a new active-skill behavior, add a case here and reference it from a
// skill's `action` field. `nuke`/`aoe` reuse resolveAttack under the hood so they
// automatically benefit from crit, elemental bonus stats, and item/skill traits.
const SKILL_ACTION_HANDLERS = {
  nuke(state, skill){
    const target = state.combat.monsters.find(m=>m.hp>0);
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
    state.player.hp = Math.min(state.derived.maxHp, state.player.hp+amt);
    Engine.log(state, `${skill.name} restores <b>${amt} HP</b>.`, 'good');
  },
  buff(state, skill){
    state.combat.buffs.push({stat:skill.buffStat, pct:skill.buffValue, name:skill.name});
    Engine.log(state, `${skill.name} takes hold — +${skill.buffValue}% ${STAT_BY_ID[skill.buffStat].short} for the rest of the battle.`, 'good');
  },
  debuff(state, skill){
    // extension point: e.g. {id:'x', action:'debuff', debuffStat:'def', debuffValue:20}
    const target = state.combat.monsters.find(m=>m.hp>0);
    if(!target) return;
    target[skill.debuffStat] = Math.max(1, Math.round(target[skill.debuffStat]*(1-skill.debuffValue/100)));
    Engine.log(state, `${skill.name} weakens ${target.name}'s ${skill.debuffStat.toUpperCase()}.`, 'good');
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
    const maxHp = BALANCE.maxHp(p.level, totals.def);
    const maxMp = BALANCE.maxMp(p.level, totals.mdef);
    return {...totals, maxHp, maxMp, traits:allTraits};
  },

  refreshDerived(state){ state.derived = this.computeDerived(state); },

  grantItem(state, item){ state.inventory.push(item); },

  grantMaterial(state, materialId, amount=1){
    state.player.materials[materialId] = (state.player.materials[materialId]||0) + amount;
  },

  equip(state, item){
    let slotId = item.slot;
    if(slotId==='accessory1' || slotId==='accessory2'){
      slotId = state.equipment.accessory1 ? 'accessory2' : 'accessory1';
    }
    const prev = state.equipment[slotId];
    state.equipment[slotId] = item;
    state.inventory = state.inventory.filter(i=>i.uid!==item.uid);
    if(prev) state.inventory.push(prev);
    this.refreshDerived(state);
  },

  equipToSlot(state, item, slotId){
    const prev = state.equipment[slotId];
    state.equipment[slotId] = item;
    state.inventory = state.inventory.filter(i=>i.uid!==item.uid);
    if(prev) state.inventory.push(prev);
    this.refreshDerived(state);
  },

  unequip(state, slotId){
    const item = state.equipment[slotId];
    if(!item) return;
    state.equipment[slotId] = null;
    state.inventory.push(item);
    this.refreshDerived(state);
  },

  sell(state, item){
    const tierIdx = TIERS.findIndex(t=>t.id===item.tier);
    const value = Math.round((8 + item.ilvl*2) * (1+tierIdx*0.9));
    state.player.gold += value;
    state.inventory = state.inventory.filter(i=>i.uid!==item.uid);
    this.log(state, `Sold ${item.name} for ${value} gold.`, 'good');
  },

  // ---- battle lifecycle ----
  startCombat(state, monsters, opts={}){
    this.refreshDerived(state);
    state.mode='combat';
    state.player._revivedThisFight = false;
    state.combat = {
      monsters, isBoss: !!opts.isBoss, playerStunned:false, _firstStrikeUsed:false, round:1, _combo:0,
      playerElement: (state.equipment.weapon?.element) || 'physical',
      buffs: [], // {stat, pct, name} — from 'buff' type active skills, lasts the whole fight
    };
  },

  // reads a stat with any active combat buffs (from skills) layered on top
  effectiveStat(state, statId){
    let v = state.derived[statId] || 0;
    if(state.combat){
      for(const b of state.combat.buffs) if(b.stat===statId) v = v*(1+b.pct/100);
    }
    return Math.round(v);
  },

  // mythic 'extraTurnChance' trait: a chance to immediately repeat the action for free
  maybeExtraAction(state, actionFn){
    const t = state.derived.traits.find(x=>x.type==='extraTurnChance');
    if(t && Math.random()*100<t.value){
      this.log(state, 'Time loops back — you act again!', 'good');
      actionFn();
    }
  },

  playerAction(state, kind){
    const c = state.combat;
    if(!c || state.player.hp<=0) return;
    const target = c.monsters.find(m=>m.hp>0);
    if(!target) return;

    if(kind==='flee'){
      if(Math.random()<0.5){ this.log(state,'You slip away from the fight.', 'flavor'); this.endCombat(state,'fled'); return; }
      this.log(state, 'You fail to escape!', 'bad');
      this.resolveMonsterPhase(state);
      return;
    }
    this.resolveAttack(state, state.derived, target, kind, true);
    if(target.hp<=0) this.log(state, `${target.name} falls.`, 'good');
    this.maybeExtraAction(state, ()=>{
      const t2 = c.monsters.find(m=>m.hp>0);
      if(t2){ this.resolveAttack(state, state.derived, t2, kind, true); if(t2.hp<=0) this.log(state, `${t2.name} falls.`, 'good'); }
    });
    this.resolveMonsterPhase(state);
  },

  useSkill(state, skillId){
    const c = state.combat;
    if(!c || state.player.hp<=0) return;
    const cls = CLASS_BY_ID[state.player.classId];
    const skill = cls.skillTree.find(sk=>sk.id===skillId);
    if(!skill || skill.kind!=='active') return;
    if(!state.player.unlockedSkills.includes(skillId)) return;
    if(!c.monsters.some(m=>m.hp>0)) return;
    const manaTrait = state.derived.traits.find(t=>t.type==='manaCostReduction');
    const cost = manaTrait ? Math.max(1, Math.round(skill.manaCost*(1-manaTrait.value/100))) : skill.manaCost;
    if(state.player.mp < cost){ this.log(state, "Not enough MP for that.", 'bad'); return; }
    state.player.mp -= cost;
    const handler = SKILL_ACTION_HANDLERS[skill.action];
    if(handler) handler(state, skill);
    this.maybeExtraAction(state, ()=>{ if(handler) handler(state, skill); });
    this.resolveMonsterPhase(state);
  },

  // shared post-player-action phase: monster turns, regen, defeat/victory checks
  resolveMonsterPhase(state){
    const c = state.combat;
    if(!c) return;
    for(const m of c.monsters){
      if(m.hp<=0 || state.player.hp<=0) continue;
      if(m._stunned){ m._stunned=false; this.log(state, `${m.name} is stunned and cannot act.`, 'flavor'); continue; }
      this.resolveAttack(state, m, {hp:state.player.hp}, 'attack', false, m);
    }
    for(const t of state.derived.traits){
      if(t.type==='regenPerTurn') EFFECT_HANDLERS.regenPerTurn({player:state.player}, t.value);
    }
    state.player.hp = U.clamp(state.player.hp, 0, state.derived.maxHp);
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
  // opts: {powerMult, forcedElement, executeThreshold, skillName} — used by active skills.
  resolveAttack(state, attackerStats, targetRef, kind, isPlayer, monsterObj=null, opts={}){
    const c = state.combat;
    const traits = isPlayer ? state.derived.traits : [];
    const useMagic = kind==='cast' || (kind==='skill' && !!opts.magic);
    const powerMult = opts.powerMult || 1;
    const atkStat = isPlayer
      ? this.effectiveStat(state, useMagic ? 'matk' : 'atk') * powerMult
      : (useMagic ? attackerStats.matk : attackerStats.atk) * powerMult;
    const defStat = isPlayer ? (targetRef.def||0) : state.derived.def;
    const mdefStat = isPlayer ? (targetRef.mdef||0) : state.derived.mdef;
    const relevantDef = useMagic ? mdefStat : defStat;
    const element = opts.forcedElement || (isPlayer ? c.playerElement : monsterObj.element);
    const elemBonusStat = element+'Dmg';
    const elemBonus = isPlayer ? (state.derived[elemBonusStat]||0) : 0;
    const verb = opts.skillName ? `use ${opts.skillName} on` : (useMagic?'cast a spell at':'strike');

    let hitEff = isPlayer ? state.derived.hitEff : attackerStats.hitEff;
    let hitRes = isPlayer ? (targetRef.hitRes||0) : state.derived.hitRes;
    const hitChance = U.clamp(85 + (hitEff-hitRes)*0.5, 55, 98);
    const ctxBase = {notes:[], combat:c, player:state.player, maxHp: state.derived.maxHp, combo: (c._combo||0)};

    if(Math.random()*100 > hitChance){
      this.log(state, isPlayer ? `Your attack misses!` : `${monsterObj.name}'s attack misses!`, 'flavor');
      return;
    }

    let critChance = 5 + hitEff*0.2;
    let critMult = 1.5;
    if(isPlayer) for(const t of traits){
      if(t.type==='critChanceBonus') critChance += t.value;
      if(t.type==='critDmgBonus') critMult += t.value/100;
    }
    const isCrit = Math.random()*100 < critChance;

    let dmg = Math.max(1, Math.round((atkStat*1.0 - relevantDef*0.5) * U.rand(0.85,1.15)));
    dmg = Math.round(dmg * (1+elemBonus/100));
    if(isCrit) dmg = Math.round(dmg*critMult);

    const ctx = {...ctxBase, attacker:isPlayer?state.player:monsterObj, target:isPlayer?targetRef:state.player,
      targetName:isPlayer?targetRef.name:'You', damage:dmg, direction:'outgoing', source:isPlayer?state.player:monsterObj, isCrit};

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
      this.log(state, `You ${verb} ${targetRef.name} for <b>${dmg}</b>${isCrit?' (critical!)':''} damage.${ctx.notes.length? ' '+ctx.notes.join(' '):''}`, 'combat');
      if(ctx.extraHit){
        const extra = Math.max(1, Math.round(dmg*0.5));
        targetRef.hp = Math.max(0, targetRef.hp-extra);
        this.log(state, `A twinned strike lands for another <b>${extra}</b> damage!`, 'combat');
      }
      if(ctx.echo){
        targetRef.hp = Math.max(0, targetRef.hp-ctx.echo);
        this.log(state, `An echo of the strike deals <b>${ctx.echo}</b> more damage.`, 'combat');
      }
      c._combo = (c._combo||0)+1;
    } else {
      const incomingCtx = {...ctxBase, direction:'incoming', damage:dmg, attacker:monsterObj, target:state.player, targetName:'You', source:monsterObj};
      for(const t of state.derived.traits){
        const h = EFFECT_HANDLERS[t.type];
        if(h) h(incomingCtx, t.value);
      }
      let finalDmg = incomingCtx.dodged ? 0 : incomingCtx.damage;
      state.player.hp = Math.max(0, state.player.hp - finalDmg);
      this.log(state, `${monsterObj.name} ${useMagic?'casts at':'strikes'} you for <b>${finalDmg}</b>${isCrit?' (critical!)':''} damage.${incomingCtx.notes.length? ' '+incomingCtx.notes.join(' '):''}`, 'bad');
    }
  },

  endCombat(state, result){
    const c = state.combat;
    if(result==='victory'){
      let gold=0, xp=0;
      for(const m of c.monsters){ gold+=m.goldDrop; xp+=m.xpDrop; }
      const goldTrait = state.derived.traits.find(t=>t.type==='goldFind');
      const xpTrait = state.derived.traits.find(t=>t.type==='xpBonus');
      if(goldTrait) gold = Math.round(gold*(1+goldTrait.value/100));
      if(xpTrait) xp = Math.round(xp*(1+xpTrait.value/100));
      state.player.gold += gold;
      state.player.xp += xp;
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
      const dropChance = isBoss ? 1.0 : 0.4;
      if(Math.random()<dropChance){
        drop = Generators.generateItem(state.dungeon.dungeonLevel, {
          lootBonus: state.dungeon.difficulty.lootBonus + (isBoss?0.8:0),
          forcedMinTier: isBoss ? 'rare' : undefined,
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
    state.ui.pendingItem = item;
    state.ui.choices = [
      {label:'Pick it up', act:(s)=>{
        this.grantItem(s, item);
        this.log(s, `You take the <b style="color:${TIER_BY_ID[item.tier].color}">${item.name}</b> (${TIER_BY_ID[item.tier].name}).`, 'good');
        s.ui.pendingItem = null;
        afterFn(s);
      }},
      {label:'Leave it behind', act:(s)=>{
        this.log(s, `You leave the ${item.name} where it lies.`, 'flavor');
        s.ui.pendingItem = null;
        afterFn(s);
      }},
    ];
    state.mode='event';
  },

  checkLevelUp(state){
    let leveled=false;
    while(state.player.xp >= BALANCE.xpToNext(state.player.level)){
      state.player.xp -= BALANCE.xpToNext(state.player.level);
      state.player.level++;
      state.player.skillPoints++;
      leveled=true;
    }
    this.refreshDerived(state);
    if(leveled){
      state.player.hp = state.derived.maxHp;
      state.player.mp = state.derived.maxMp;
      this.log(state, `<b style="color:var(--gold)">Level up!</b> You are now level ${state.player.level}. (+1 skill point)`, 'good');
    }
  },

  // ---- skill tree ----
  canUnlock(state, skill){
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
    const cls = CLASS_BY_ID[state.player.classId];
    const skill = cls.skillTree.find(sk=>sk.id===skillId);
    if(!skill || !this.canUnlock(state, skill)) return;
    state.player.skillPoints -= skill.cost;
    state.player.unlockedSkills.push(skillId);
    this.refreshDerived(state);
    this.log(state, `Learned <b>${skill.name}</b>.`, 'good');
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
