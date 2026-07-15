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
    state.player.hp = Math.min(state.derived.maxHp, state.player.hp+amt);
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
    // generic dungeon-wide flat stat buffs (bonfire, deep_pool, etc. push onto this);
    // applied here so they survive refreshDerived recalculation for the rest of the dungeon.
    if(state.dungeon && state.dungeon._buffs){
      for(const b of state.dungeon._buffs) totals[b.stat] = (totals[b.stat]||0) + b.flat;
    }
    let maxHp = BALANCE.maxHp(p.level, totals.def) + (totals.hp||0);
    const maxMp = BALANCE.maxMp(p.level, totals.mdef) + (totals.mp||0);
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
    state.player._revivedThisFight = false;
    state.player.skillCooldowns = {};
    for(const m of monsters){
      m._charging = false;
      if(m.isBoss) m._chargeCountdown = BALANCE.bossChargeCadence - 1;
    }
    state.combat = {
      monsters, isBoss: !!opts.isBoss, bonusLoot: !!opts.bonusLoot, round:1, _combo:0, _firstStrikeUsed:false,
      playerElement: (state.equipment.weapon?.element) || 'physical',
      buffs: [], // {stat, pct, name} — from 'buff' type active skills, lasts the whole fight
      playerGuarding: false,
      targetUid: monsters[0] ? monsters[0].uid : null,
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
    if(!c || state.player.hp<=0) return;
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

  useSkill(state, skillId){
    const c = state.combat;
    if(!c || state.player.hp<=0) return;
    const cls = CLASS_BY_ID[state.player.classId];
    const skill = cls.skillTree.find(sk=>sk.id===skillId);
    if(!skill || skill.kind!=='active') return;
    if(!state.player.unlockedSkills.includes(skillId)) return;
    if(!c.monsters.some(m=>m.hp>0)) return;
    if((state.player.skillCooldowns[skillId]||0) > 0){ this.log(state, `${skill.name} is still recovering.`, 'bad'); return; }
    const manaTrait = state.derived.traits.find(t=>t.type==='manaCostReduction');
    const cost = manaTrait ? Math.max(1, Math.round(skill.manaCost*(1-manaTrait.value/100))) : skill.manaCost;
    if(state.player.mp < cost){ this.log(state, "Not enough MP for that.", 'bad'); return; }
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
      state.player.mp -= action.cost;
      state.player.skillCooldowns[action.skill.id] = action.skill.cooldown || 1;
      const handler = SKILL_ACTION_HANDLERS[action.skill.action];
      if(handler) handler(state, action.skill);
      this.maybeExtraAction(state, ()=>{ if(handler) handler(state, action.skill); });
    } else if(action.kind==='defend'){
      c.playerGuarding = true;
      c._combo = 0;
      const mpBack = Math.round(state.derived.maxMp*BALANCE.guardManaRestorePct);
      state.player.mp = Math.min(state.derived.maxMp, state.player.mp+mpBack);
      this.log(state, `You brace behind your guard, steadying your breath.${mpBack?` <b>+${mpBack} MP</b>.`:''}`, 'flavor');
    }
    // 'flee-failed' spends the round doing nothing further
  },

  // decides and executes one monster's turn
  monsterTurn(state, m){
    const c = state.combat;
    if(m.hp<=0) return;
    if(m._stunned){ m._stunned=false; this.log(state, `${m.name} is stunned and cannot act.`, 'flavor'); return; }

    if(m._charging){
      m._charging = false;
      if(m.isBoss) m._chargeCountdown = BALANCE.bossChargeCadence;
      this.log(state, `${m.name} unleashes the blow it's been building!`, 'bad');
      this.resolveAttack(state, m, {hp:state.player.hp}, 'attack', false, m, {powerMult:BALANCE.chargeDamageMult, charged:true});
      return;
    }

    let startsCharge = false;
    if(m.isBoss){
      m._chargeCountdown--;
      startsCharge = m._chargeCountdown<=0;
    } else {
      startsCharge = Math.random() < BALANCE.monsterChargeChance;
    }

    if(startsCharge){
      m._charging = true;
      this.log(state, `${m.name} winds up for a devastating strike — brace yourself!`, 'bad');
      return;
    }
    this.resolveAttack(state, m, {hp:state.player.hp}, 'attack', false, m);
  },

  // resolves one full round: player's locked-in action plus every surviving
  // monster's turn, all ordered by SPD (with a little jitter for near-ties).
  resolveRound(state, action){
    const c = state.combat;
    if(!c) return;
    c.playerGuarding = action.kind==='defend';

    const jitter = ()=> (Math.random()*2-1) * BALANCE.initiativeJitter;
    const combatants = [
      {type:'player', spd:this.effectiveStat(state,'spd')+jitter()},
      ...c.monsters.filter(m=>m.hp>0).map(m=>({type:'monster', ref:m, spd:m.spd+jitter()})),
    ].sort((a,b)=>b.spd-a.spd);

    for(const combatant of combatants){
      if(state.player.hp<=0) break;
      if(c.monsters.every(m=>m.hp<=0)) break;
      if(combatant.type==='player'){
        this.executePlayerAction(state, action);
      } else if(combatant.ref.hp>0){
        this.monsterTurn(state, combatant.ref);
      }
    }
    this.endOfRound(state);
  },

  // regen, cooldown ticks, guard reset, retargeting, and the defeat/victory checks
  endOfRound(state){
    const c = state.combat;
    if(!c) return;
    for(const t of state.derived.traits){
      if(t.type==='regenPerTurn') state.player.hp = Math.min(state.derived.maxHp, state.player.hp + Math.round(t.value));
    }
    state.player.hp = U.clamp(state.player.hp, 0, state.derived.maxHp);
    c.playerGuarding = false;
    for(const id of Object.keys(state.player.skillCooldowns)){
      if(state.player.skillCooldowns[id]>0) state.player.skillCooldowns[id]--;
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
    const defStat = isPlayer ? (targetRef.def||0) : state.derived.def;
    const mdefStat = isPlayer ? (targetRef.mdef||0) : state.derived.mdef;
    let relevantDef = useMagic ? mdefStat : defStat;
    if(!isPlayer && opts.charged) relevantDef *= (1-BALANCE.chargeDefPiercePct);
    const element = opts.forcedElement || (isPlayer ? c.playerElement : monsterObj.element);
    const elemBonusStat = element+'Dmg';
    const elemBonus = isPlayer ? (state.derived[elemBonusStat]||0) : 0;
    const verb = opts.skillName ? `use ${opts.skillName} on` : (useMagic?'cast a spell at':'strike');

    let hitEff = isPlayer ? state.derived.hitEff : attackerStats.hitEff;
    let hitRes = isPlayer ? (targetRef.hitRes||0) : state.derived.hitRes;
    const hitChance = U.clamp(85 + (hitEff-hitRes)*0.5, 55, 98);
    const ctxBase = {notes:[], combat:c, player:state.player, maxHp: state.derived.maxHp, maxMp: state.derived.maxMp, combo: (c._combo||0)};

    if(Math.random()*100 > hitChance){
      this.log(state, isPlayer ? `Your attack misses!` : `${monsterObj.name}'s attack misses!`, 'flavor');
      return;
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
      if(!incomingCtx.dodged && c.playerGuarding){
        const mit = opts.charged ? BALANCE.guardMitigationVsCharge : BALANCE.guardMitigation;
        finalDmg = Math.round(finalDmg*(1-mit));
        incomingCtx.notes.push('Your guard absorbs much of the blow.');
      }
      state.player.hp = Math.max(0, state.player.hp - finalDmg);
      this.log(state, `${monsterObj.name} ${useMagic?'casts at':(opts.charged?'unleashes a charged blow on':'strikes')} you for <b>${finalDmg}</b>${isCrit?' (critical!)':''} damage.${incomingCtx.notes.length? ' '+incomingCtx.notes.join(' '):''}`, 'bad');
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
      const dropChance = isBoss ? 1.0 : (c.bonusLoot ? 0.7 : 0.4);
      if(Math.random()<dropChance){
        drop = Generators.generateItem(state.dungeon.dungeonLevel, {
          lootBonus: state.dungeon.difficulty.lootBonus + (isBoss?0.8: (c.bonusLoot?0.35:0)),
          forcedMinTier: isBoss ? 'rare' : (c.bonusLoot ? 'uncommon' : undefined),
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
      const item = Generators.generateItem(dlvl, {lootBonus});
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
