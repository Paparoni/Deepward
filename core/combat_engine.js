const EFFECT_HANDLERS = {
  lifesteal: (ctx, v) => {
    ctx.attacker.hp = Math.min(ctx.maxHp, ctx.attacker.hp + Math.round((ctx.damage * v) / 100));
  },
  stunChance: (ctx, v) => {
    if (Math.random() * 100 < v) {
      ctx.target._stunned = true;
      ctx.notes.push(`${ctx.targetName} is stunned!`);
    }
  },
  critDmgBonus: () => {}, // applied inline during damage calc
  critChanceBonus: () => {}, // applied inline during damage calc
  thorns: (ctx, v) => {
    if (ctx.direction === 'incoming') {
      const reflect = Math.round((ctx.damage * v) / 100);
      ctx.source.hp -= reflect;
      ctx.notes.push(`Thorns reflect ${reflect} damage!`);
    }
  },
  regenPerTurn: (ctx, v) => {
    ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + Math.round(v));
  },
  goldFind: () => {}, // applied at reward time
  xpBonus: () => {}, // applied at reward time
  dodgeChance: (ctx, v) => {
    if (ctx.direction === 'incoming' && Math.random() * 100 < v) {
      ctx.dodged = true;
      ctx.notes.push(`Evaded completely!`);
    }
  },
  doubleHitChance: (ctx, v) => {
    if (ctx.direction === 'outgoing' && Math.random() * 100 < v) {
      ctx.extraHit = true;
    }
  },
  revive: (ctx, v) => {
    if (ctx.player.hp <= 0 && !ctx.player._revivedThisDungeon) {
      ctx.player._revivedThisDungeon = true;
      ctx.player.hp = Math.round((ctx.maxHp * v) / 100);
      ctx.notes.push('A deathless vow refuses to let you fall!');
    }
  },
  doubleDamageFirstTurn: (ctx) => {
    if (ctx.direction === 'outgoing' && !ctx.combat._firstStrikeUsed) {
      ctx.combat._firstStrikeUsed = true;
      ctx.damage *= 2;
      ctx.notes.push('Opening Requiem doubles the blow!');
    }
  },
  executeThreshold: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.hp > 0 && (ctx.target.hp / ctx.target.maxHp) * 100 <= v) {
      ctx.damage = ctx.target.hp;
      ctx.notes.push('A merciless finishing blow!');
    }
  },
  damageImmuneChance: (ctx, v) => {
    if (ctx.direction === 'incoming' && Math.random() * 100 < v) {
      ctx.damage = 0;
      ctx.notes.push('The blow simply fails to land.');
    }
  },
  statDrainOnHit: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      const drain = Math.round((ctx.target.atk * v) / 100);
      ctx.target.atk = Math.max(1, ctx.target.atk - drain);
      ctx.attacker._drained = (ctx.attacker._drained || 0) + drain;
      ctx.notes.push(`Siphoned ${drain} ATK from ${ctx.targetName}.`);
    }
  },
  echoStrike: (ctx, v) => {
    if (ctx.direction === 'outgoing' && Math.random() * 100 < v) {
      ctx.echo = Math.round(ctx.damage * 0.4);
    }
  },
  bonusDamagePct: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
    }
  },
  lowHpDamageBonus: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.maxHp && (ctx.player.hp / ctx.maxHp) * 100 < 50) {
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
    }
  },
  reviveOncePerFight: (ctx, v) => {
    if (ctx.player.hp <= 0 && !ctx.player._revivedThisFight) {
      ctx.player._revivedThisFight = true;
      ctx.player.hp = Math.round((ctx.maxHp * v) / 100);
      ctx.notes.push('Second Wind pulls you back from the brink!');
    }
  },
  comboDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.damage = Math.round(ctx.damage * (1 + ((ctx.combo || 0) * v) / 100));
    }
  },
  bossDamageBonus: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.isBoss) {
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
    }
  },
  critInstantKillChance: (ctx, v) => {
    if (
      ctx.direction === 'outgoing' &&
      ctx.isCrit &&
      ctx.target &&
      !ctx.target.isBoss &&
      Math.random() * 100 < v
    ) {
      ctx.damage = ctx.target.hp;
      ctx.notes.push('Annihilated!');
    }
  },
  damageCapPct: (ctx, v) => {
    if (ctx.direction === 'incoming' && ctx.maxHp) {
      const cap = Math.round((ctx.maxHp * v) / 100);
      if (ctx.damage > cap) ctx.damage = cap;
    }
  },
  manaOnHit: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.player.mp = Math.min(ctx.maxMp, ctx.player.mp + v);
    }
  },
  hpOnKill: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.hp <= ctx.damage) {
      ctx.player.hp = Math.min(ctx.maxHp, ctx.player.hp + v);
      ctx.notes.push(`The killing blow restores ${v} HP.`);
    }
  },
  manaOnKill: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.hp <= ctx.damage) {
      const amt = Math.round((ctx.maxMp * v) / 100);
      ctx.player.mp = Math.min(ctx.maxMp, ctx.player.mp + amt);
      ctx.notes.push('Mana surges back into you.');
    }
  },
  defShred: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.def != null) {
      const shred = Math.round((ctx.target.def * v) / 100);
      ctx.target.def = Math.max(0, ctx.target.def - shred);
      ctx.notes.push(`${ctx.targetName}'s armor shreds.`);
    }
  },
  mdefShred: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.mdef != null) {
      const shred = Math.round((ctx.target.mdef * v) / 100);
      ctx.target.mdef = Math.max(0, ctx.target.mdef - shred);
      ctx.notes.push(`${ctx.targetName}'s wards crack.`);
    }
  },
  adrenaline: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.combat) {
      ctx.combat.buffs.push({ stat: 'spd', pct: v, name: 'Adrenaline' });
    }
  },
  arcaneMomentum: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.combat) {
      ctx.combat.buffs.push({ stat: 'matk', pct: v, name: 'Arcane Momentum' });
    }
  },
  missingHpPower: (ctx, v) => {
    if (ctx.direction === 'outgoing')
      ctx.damage = Math.round(ctx.damage * (1 + ((1 - ctx.player.hp / ctx.maxHp) * v) / 100));
  },
  highHpDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.player.hp / ctx.maxHp > 0.8)
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
  },
  highManaDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.maxMp && ctx.player.mp / ctx.maxMp > 0.7)
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
  },
  lowManaDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.maxMp && ctx.player.mp / ctx.maxMp < 0.3)
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
  },
  healOnCrit: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.isCrit)
      ctx.player.hp = Math.min(ctx.maxHp, ctx.player.hp + Math.round((ctx.maxHp * v) / 100));
  },
  manaOnCrit: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.isCrit)
      ctx.player.mp = Math.min(ctx.maxMp, ctx.player.mp + Math.round((ctx.maxMp * v) / 100));
  },
  soloEnemyDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.combat.monsters.filter((m) => m.hp > 0).length === 1)
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
  },
  crowdDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.combat.monsters.filter((m) => m.hp > 0).length >= 3)
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
  },
  roundDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing')
      ctx.damage = Math.round(ctx.damage * (1 + (Math.max(0, ctx.combat.round - 1) * v) / 100));
  },
  earlyRoundDamage: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.combat.round <= 2)
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
  },
  manaGuard: (ctx, v) => {
    if (ctx.direction === 'incoming' && ctx.maxMp && ctx.player.mp / ctx.maxMp > 0.5)
      ctx.damage = Math.round(ctx.damage * (1 - v / 100));
  },
  lowHpReduction: (ctx, v) => {
    if (ctx.direction === 'incoming' && ctx.player.hp / ctx.maxHp < 0.35)
      ctx.damage = Math.round(ctx.damage * (1 - v / 100));
  },
  damageReductionFromPower: (ctx, v) => {
    if (ctx.direction === 'incoming') {
      const power = Math.max(ctx.derived.atk, ctx.derived.matk);
      ctx.damage = Math.round(ctx.damage * (1 - Math.min(25, Math.floor(power / v)) / 100));
    }
  },
  glassCannon: (ctx, v) => {
    ctx.damage = Math.round(ctx.damage * (ctx.direction === 'outgoing' ? 1 + v / 100 : 1.12));
  },
  goldAndXp: () => {},
  openingForce: (ctx, v) => {
    if (ctx.direction === 'outgoing' && !ctx.combat._openingForceUsed) {
      ctx.combat._openingForceUsed = true;
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
      ctx.notes.push('First Motion surges.');
    }
  },
  firstImpactGuard: (ctx, v) => {
    if (ctx.direction === 'incoming' && !ctx.combat._firstImpactTaken) {
      ctx.combat._firstImpactTaken = true;
      ctx.damage = Math.round(ctx.damage * (1 - v / 100));
      ctx.notes.push('The first impact is blunted.');
    }
  },
  killHarvest: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.hp <= ctx.damage) {
      const hp = Math.round((ctx.maxHp * v) / 100),
        mp = Math.round((ctx.maxMp * v) / 100);
      ctx.player.hp = Math.min(ctx.maxHp, ctx.player.hp + hp);
      ctx.player.mp = Math.min(ctx.maxMp, ctx.player.mp + mp);
      ctx.notes.push('The kill feeds your reserves.');
    }
  },
  retaliationCharge: (ctx, v) => {
    if (ctx.direction === 'incoming' && ctx.damage > 0)
      ctx.combat._retaliation = Math.min(3, (ctx.combat._retaliation || 0) + 1);
    else if (ctx.direction === 'outgoing' && ctx.combat._retaliation) {
      ctx.damage = Math.round(ctx.damage * (1 + (ctx.combat._retaliation * v) / 100));
      ctx.notes.push(`Vengeance releases (${ctx.combat._retaliation}).`);
      ctx.combat._retaliation = 0;
    }
  },
  critWard: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.isCrit) {
      const ward = Math.round((ctx.maxHp * v) / 100),
        cap = Math.round(ctx.maxHp * 0.3);
      ctx.combat.elementalWard = Math.min(cap, (ctx.combat.elementalWard || 0) + ward);
      ctx.notes.push(`Critical Shelter grants ${ward} ward.`);
    }
  },
  guardedFury: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.player.hp / ctx.maxHp < 0.5) {
      ctx.combat._painStacks = Math.min(5, (ctx.combat._painStacks || 0) + 1);
      ctx.damage = Math.round(ctx.damage * (1 + (ctx.combat._painStacks * v) / 100));
    }
  },
  ailmentOnCrit: (ctx) => {
    if (ctx.direction === 'outgoing' && ctx.isCrit) ctx.forceAilment = true;
  },
  overkillSplash: (ctx, v) => {
    if (ctx.direction === 'outgoing') ctx.overkillSplash = v;
  },
  alternatingPower: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.combat.round % 2 === 1)
      ctx.damage = Math.round(ctx.damage * (1 + v / 100));
    if (ctx.direction === 'incoming' && ctx.combat.round % 2 === 0)
      ctx.damage = Math.round(ctx.damage * (1 - v / 100));
  },
  resourceWeave: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      const mp = Math.max(1, Math.round(((ctx.maxMp - ctx.player.mp) * v) / 100));
      ctx.player.mp = Math.min(ctx.maxMp, ctx.player.mp + mp);
      if (ctx.kind === 'skill') ctx.player.hp = Math.min(ctx.maxHp, ctx.player.hp + mp);
    }
  },
  damageBank: (ctx, v) => {
    if (ctx.direction === 'incoming' && ctx.damage > 0)
      ctx.combat._damageBank = (ctx.combat._damageBank || 0) + Math.round((ctx.damage * v) / 100);
    else if (ctx.direction === 'outgoing' && ctx.combat._damageBank) {
      ctx.damage += ctx.combat._damageBank;
      ctx.notes.push(`Stored Vengeance releases ${ctx.combat._damageBank} damage.`);
      ctx.combat._damageBank = 0;
    }
  },
  cooldownOnKill: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.hp <= ctx.damage)
      for (const id of Object.keys(ctx.player.skillCooldowns))
        ctx.player.skillCooldowns[id] = Math.max(0, ctx.player.skillCooldowns[id] - v);
  },
  fateMomentum: () => {},
  statusEcho: (ctx, v) => {
    if (ctx.direction === 'outgoing' && Math.random() * 100 < v) ctx.statusEcho = true;
  },
  firstHitImmunity: (ctx, v) => {
    if (ctx.direction === 'incoming' && (ctx.combat._mirrorStepUses || 0) < v) {
      ctx.combat._mirrorStepUses = (ctx.combat._mirrorStepUses || 0) + 1;
      ctx.damage = 0;
      ctx.dodged = true;
      ctx.notes.push('Mirror Step erases the blow.');
    }
  },
  firstSkillEcho: () => {},
  relentlessEcho: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.kind === 'attack') {
      ctx.extraHit = true;
      ctx.extraHitMult = v / 100;
    }
  },
  counterStrike: (ctx, v) => {
    if (ctx.direction === 'incoming' && ctx.source?.hp != null) {
      const returned = Math.max(1, Math.round((ctx.damage * v) / 100));
      ctx.source.hp = Math.max(0, ctx.source.hp - returned);
      ctx.notes.push(`Answering Steel returns ${returned} damage.`);
      if (v >= 90) ctx.combat.elementalWard = (ctx.combat.elementalWard || 0) + Math.round(ctx.maxHp * 0.03);
    }
  },
  startingWardPct: () => {},
  countdownNova: () => {},
  utilityLock: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target) {
      ctx.target._utilityCooldown = Math.max(ctx.target._utilityCooldown || 0, v);
      if (v >= 4 && ctx.target._charging) {
        ctx.target._charging = false;
        ctx.target._chargingMove = null;
        ctx.notes.push('Hush Brand interrupts the charge.');
      }
    }
  },
  manaFlow: (ctx) => {
    if (ctx.direction === 'outgoing' && ctx.combat._activeSkillDamageBonus)
      ctx.damage = Math.round(ctx.damage * (1 + ctx.combat._activeSkillDamageBonus / 100));
  },
  boneShield: (ctx, v) => {
    if (ctx.direction === 'incoming') {
      const trait = ctx.derived.traits.find((t) => t.type === 'boneShield'),
        charges = trait?.charges || 2;
      if ((ctx.combat._boneShieldUses || 0) < charges) {
        ctx.combat._boneShieldUses = (ctx.combat._boneShieldUses || 0) + 1;
        ctx.damage = Math.round(ctx.damage * (1 - v / 100));
        ctx.notes.push('A Bone Lantern absorbs the impact.');
      }
    }
  },
  worldsplitter: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.damage = Math.round(ctx.damage * (1 + ((ctx.combo || 0) * v) / 100));
      ctx.combat._worldHits = (ctx.combat._worldHits || 0) + 1;
      if (ctx.combat._worldHits % 3 === 0) {
        for (const enemy of ctx.combat.monsters)
          if (enemy.hp > 0 && enemy !== ctx.target) {
            const cleave = Math.max(1, Math.round(ctx.damage * 0.6));
            enemy.hp = Math.max(0, enemy.hp - cleave);
            Metrics.addTotal('damageDealt', cleave);
            Metrics.combatFlow(ctx.combat, 'dealt', cleave, enemy);
          }
        ctx.notes.push('Worldsplitter tears through the enemy line.');
      }
    }
  },
  dawnkeep: (ctx, v) => {
    if (ctx.direction === 'incoming' && ctx.combat._dawnkeepRound !== ctx.combat.round) {
      ctx.combat._dawnkeepRound = ctx.combat.round;
      ctx.damage = 0;
      ctx.combat.elementalWard = Math.min(
        Math.round(ctx.maxHp * 0.4),
        (ctx.combat.elementalWard || 0) + Math.round((ctx.maxHp * v) / 100),
      );
      ctx.notes.push('Dawnkeep converts the blow into radiant protection.');
    }
  },
  mourningCovenant: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.player.hp = Math.min(ctx.maxHp, ctx.player.hp + Math.round((ctx.damage * v) / 100));
      ctx.target._ailments ||= {};
      const doom = ctx.target._ailments.doom || {
        name: 'Doom Mark',
        stacks: 0,
      };
      doom.stacks = Math.min(5, doom.stacks + 1);
      ctx.target._ailments.doom = doom;
    }
  },
  basiliskCrown: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.target._ailments ||= {};
      const toxin = ctx.target._ailments.toxin || {
        name: 'Toxin',
        stacks: 0,
        damage: Math.max(1, Math.round(ctx.damage * 0.06)),
      };
      toxin.stacks = Math.min(5, toxin.stacks + v);
      ctx.target._ailments.toxin = toxin;
      if (toxin.stacks >= 5) {
        ctx.target._stunned = true;
        ctx.notes.push('Basilisk Apotheosis petrifies the poisoned target.');
      }
    }
  },
  phoenixAscension: (ctx, v) => {
    if (ctx.player.hp <= 0 && !ctx.player._revivedThisFight) {
      ctx.player._revivedThisFight = true;
      ctx.player.hp = Math.round((ctx.maxHp * v) / 100);
      for (const stat of ['atk', 'def', 'matk', 'mdef', 'spd', 'hitEff', 'hitRes'])
        ctx.combat.buffs.push({ stat, pct: 50, name: 'Phoenix Ascension' });
      ctx.notes.push('Phoenix Ascension raises every core stat by 50%!');
    }
  },
  riftsong: (ctx, v) => {
    if (ctx.direction === 'outgoing' && Math.random() * 100 < v) {
      ctx.echo = Math.round(ctx.damage * 0.5);
      ctx.target._ailments ||= {};
      const chill = ctx.target._ailments.chill || { name: 'Chill', stacks: 0 };
      chill.stacks++;
      ctx.target._ailments.chill = chill;
      if (chill.stacks >= 3) {
        ctx.target._stunned = true;
        delete ctx.target._ailments.chill;
      }
      ctx.notes.push('Riftsong answers in a freezing echo.');
    }
  },
  colossusLaw: (ctx, v) => {
    if (ctx.direction === 'incoming') {
      const cap = Math.round((ctx.maxHp * v) / 100);
      if (ctx.damage > cap) {
        ctx.combat._colossusBank = (ctx.combat._colossusBank || 0) + (ctx.damage - cap);
        ctx.damage = cap;
        ctx.notes.push('Colossus Law stores the prevented force.');
      }
    } else if (ctx.direction === 'outgoing' && ctx.combat._colossusBank) {
      ctx.damage += ctx.combat._colossusBank;
      ctx.combat._colossusBank = 0;
    }
  },
  abyssalHunger: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      const ailments = Object.keys(ctx.target._ailments || {}).length;
      ctx.damage = Math.round(ctx.damage * (1 + (ailments * v) / 100));
    }
  },
  reaperSeal: (ctx, v) => {
    if (ctx.direction === 'outgoing' && (ctx.target.hp / ctx.target.maxHp) * 100 <= v) {
      if (ctx.target.isBoss) ctx.damage = Math.round(ctx.damage * 1.35);
      else ctx.damage = ctx.target.hp;
      ctx.notes.push('Final Destination closes around its victim.');
    }
  },
  voidwroughtHaste: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.combat._voidHits = (ctx.combat._voidHits || 0) + 1;
      ctx.combat.buffs.push({
        stat: 'spd',
        pct: v,
        name: 'Voidwrought Velocity',
      });
      if (ctx.combat._voidHits % 5 === 0) ctx.combat._voidExtraReady = true;
    }
  },
  emberCommunion: (ctx, v) => {
    if (ctx.direction === 'outgoing' && ctx.target.hp <= ctx.damage) {
      ctx.player.hp = Math.min(ctx.maxHp, ctx.player.hp + Math.round((ctx.maxHp * v) / 100));
      for (const enemy of ctx.combat.monsters)
        if (enemy.hp > 0 && enemy !== ctx.target) {
          enemy._ailments ||= {};
          enemy._ailments.burn = {
            name: 'Burn',
            stacks: 3,
            turns: 3,
            damage: Math.max(1, Math.round(ctx.damage * 0.1)),
          };
        }
      ctx.notes.push('Ember Communion ignites every survivor.');
    }
  },
  absoluteZero: (ctx, v) => {
    if (ctx.direction === 'incoming') {
      ctx.damage = Math.round(ctx.damage * (1 - v / 100));
      ctx.combat._zeroHits = (ctx.combat._zeroHits || 0) + 1;
      if (ctx.combat._zeroHits % 3 === 0) {
        ctx.attacker._stunned = true;
        ctx.notes.push('Absolute Zero freezes the attacker.');
      }
    }
  },
  stormcaller: (ctx, v) => {
    if (ctx.direction === 'outgoing') {
      ctx.player.mp = Math.min(
        ctx.maxMp,
        ctx.player.mp + Math.max(1, Math.round(((ctx.maxMp - ctx.player.mp) * v) / 100)),
      );
      const other = ctx.combat.monsters.find((m) => m.hp > 0 && m !== ctx.target);
      if (other) {
        const arc = Math.max(1, Math.round(ctx.damage * 0.45));
        other.hp = Math.max(0, other.hp - arc);
        Metrics.addTotal('damageDealt', arc);
        Metrics.combatFlow(ctx.combat, 'dealt', arc, other);
        ctx.notes.push(`Stormcaller arcs ${arc} damage into ${other.name}.`);
      }
    }
  },
};
const SKILL_ACTION_HANDLERS = {
  nuke(state, skill) {
    const target = Engine.getTarget(state);
    if (!target) return;
    if (skill.hpCostPct && !state.combat?._freeSkillRepeat) {
      const cost = Math.max(1, Math.round((state.derived.maxHp * skill.hpCostPct) / 100));
      state.player.hp = Math.max(1, state.player.hp - cost);
      Engine.log(state, `${skill.name} consumes <b>${cost} HP</b>.`, 'bad');
    }
    Engine.resolveAttack(state, state.derived, target, 'skill', true, null, {
      powerMult: skill.power || 1,
      forcedElement: skill.forcedElement,
      executeThreshold: skill.executeThreshold,
      skillName: skill.name,
      magic: !!skill.magic,
      guaranteedStatus: !!skill.guaranteedStatus,
    });
    if (target.hp <= 0) Engine.log(state, `${target.name} falls.`, 'good');
  },
  aoe(state, skill) {
    const targets = state.combat.monsters.filter((m) => m.hp > 0);
    for (const t of targets) {
      Engine.resolveAttack(state, state.derived, t, 'skill', true, null, {
        powerMult: skill.power || 1,
        forcedElement: skill.forcedElement,
        skillName: skill.name,
        magic: !!skill.magic,
        guaranteedStatus: !!skill.guaranteedStatus,
      });
      if (t.hp <= 0) Engine.log(state, `${t.name} falls.`, 'good');
    }
  },
  heal(state, skill) {
    const amt = Math.round((state.derived.maxHp * (skill.healPct || 0)) / 100);
    const actual = Math.min(amt, state.derived.maxHp - state.player.hp);
    state.player.hp = Math.min(state.derived.maxHp, state.player.hp + amt);
    Metrics.addTotal('healing', actual);
    Metrics.healing(state.combat, actual);
    Engine.log(state, `${skill.name} restores <b>${amt} HP</b>.`, 'good');
  },
  buff(state, skill) {
    state.combat.buffs.push({
      stat: skill.buffStat,
      pct: skill.buffValue,
      name: skill.name,
    });
    Engine.log(
      state,
      `${skill.name} takes hold — +${skill.buffValue}% ${STAT_BY_ID[skill.buffStat].short} for the rest of the battle.`,
      'good',
    );
  },
  debuff(state, skill) {
    const target = Engine.getTarget(state);
    if (!target) return;
    target[skill.debuffStat] = Math.max(
      1,
      Math.round(target[skill.debuffStat] * (1 - skill.debuffValue / 100)),
    );
    Engine.log(state, `${skill.name} weakens ${target.name}'s ${skill.debuffStat.toUpperCase()}.`, 'good');
  },
  cleanse(state, skill) {
    const c = state.combat;
    const hadAny = c.buffs.some((b) => b.pct < 0) || c.playerDots.length > 0;
    c.buffs = c.buffs.filter((b) => b.pct >= 0);
    c.playerDots = [];
    Engine.log(
      state,
      hadAny
        ? `${skill.name} burns away every affliction weighing on you.`
        : `${skill.name} finds nothing to cleanse.`,
      'good',
    );
  },
  resetCooldowns(state, skill) {
    for (const id of Object.keys(state.player.skillCooldowns))
      if (id !== skill.id) state.player.skillCooldowns[id] = 0;
    Engine.log(state, `${skill.name} resets your whole kit — everything is ready again.`, 'good');
  },
  manaTap(state, skill) {
    const hpCost = Math.round((state.derived.maxHp * (skill.hpCostPct || 8)) / 100);
    const mpGain = Math.round((state.derived.maxMp * (skill.manaPct || 30)) / 100);
    state.player.hp = Math.max(1, state.player.hp - hpCost);
    state.player.mp = Math.min(state.derived.maxMp, state.player.mp + mpGain);
    Engine.log(state, `${skill.name} trades <b>${hpCost} HP</b> for <b>${mpGain} MP</b>.`, 'good');
  },
  nukeRandomElement(state, skill) {
    const target = Engine.getTarget(state);
    if (!target) return;
    const element = U.pick(ELEMENTS).id;
    Engine.resolveAttack(state, state.derived, target, 'skill', true, null, {
      powerMult: skill.power || 1,
      forcedElement: element,
      skillName: skill.name,
      magic: !!skill.magic,
    });
    if (target.hp <= 0) Engine.log(state, `${target.name} falls.`, 'good');
  },
};

const Engine = {
  log(state, html, cls = 'combat') {
    state.log.push({ html, cls });
    if (state.log.length > 60) state.log.shift();
  },
  computeDerived(state) {
    const p = state.player;
    const cls = CLASS_BY_ID[p.classId];
    const totals = {};
    for (const s of CORE_STATS)
      totals[s.id] =
        BALANCE.playerBaseStat[s.id] +
        (cls.statMods[s.id] || 0) +
        Math.round(BALANCE.playerStatPerLevel[s.id] * (p.level - 1));
    for (const s of ELEMENT_STATS) totals[s.id] = 0;
    const allTraits = [];
    for (const slotId of Object.keys(state.equipment)) {
      const item = state.equipment[slotId];
      if (!item) continue;
      for (const [k, v] of Object.entries(item.stats)) totals[k] = (totals[k] || 0) + v;
      for (const t of item.uniqueTraits) allTraits.push(t);
      if (item.mythicTrait) allTraits.push(item.mythicTrait);
    }
    for (const skillId of p.unlockedSkills) {
      const skill = cls.skillTree.find((sk) => sk.id === skillId);
      if (!skill || skill.kind !== 'passive') continue;
      if (skill.effect.type === 'statBonus') {
        totals[skill.effect.stat] = (totals[skill.effect.stat] || 0) + skill.effect.value;
      } else {
        allTraits.push({
          id: skill.id,
          name: skill.name,
          desc: skill.desc,
          ...skill.effect,
        });
      }
    }
    if (cls.innatePassive) {
      const ip = cls.innatePassive;
      if (ip.effect.type === 'statBonus') {
        totals[ip.effect.stat] = (totals[ip.effect.stat] || 0) + ip.effect.value;
      } else {
        allTraits.push({
          id: ip.id,
          name: ip.name,
          desc: ip.desc,
          ...ip.effect,
        });
      }
    }
    for (const boon of state.dungeon?.boons || []) {
      for (const effect of boon.effects || [boon.effect].filter(Boolean)) {
        if (effect.type === 'statPercent')
          totals[effect.stat] = Math.round((totals[effect.stat] || 0) * (1 + effect.value / 100));
        else if (effect.type !== 'lootBonus')
          allTraits.push({
            id: `boon_${boon.baseId || boon.id}`,
            name: boon.name,
            desc: boon.desc,
            ...effect,
          });
      }
    }
    if (state.dungeon && state.dungeon._buffs) {
      for (const b of state.dungeon._buffs) totals[b.stat] = (totals[b.stat] || 0) + b.flat;
    }
    let maxHp = BALANCE.maxHp(p.level, totals.def) + (totals.hp || 0);
    let maxMp = BALANCE.maxMp(p.level, totals.mdef) + (totals.mp || 0);
    for (const mutator of state.dungeon?.mutators || []) {
      for (const [stat, pct] of Object.entries(mutator.playerPct || {}))
        totals[stat] = Math.round((totals[stat] || 0) * (1 + pct / 100));
      if (mutator.elementPct)
        for (const stat of ELEMENT_STATS)
          totals[stat.id] = Math.round((totals[stat.id] || 0) * (1 + mutator.elementPct / 100));
      if (mutator.maxHpMult) maxHp = Math.max(1, Math.round(maxHp * mutator.maxHpMult));
    }
    const blessing = state.dungeon?.blessing;
    if (blessing) {
      for (const [stat, pct] of Object.entries(blessing.playerPct || {}))
        totals[stat] = Math.round((totals[stat] || 0) * (1 + pct / 100));
      if (blessing.maxHpMult) maxHp = Math.round(maxHp * blessing.maxHpMult);
      if (blessing.maxMpMult) maxMp = Math.round(maxMp * blessing.maxMpMult);
    }
    for (const trait of allTraits) {
      if (trait.type === 'statConversion') {
        const source =
          trait.source === 'maxHp' ? maxHp : trait.source === 'maxMp' ? maxMp : totals[trait.source] || 0;
        totals[trait.target] = Math.round((totals[trait.target] || 0) + (source * trait.value) / 100);
      } else if (trait.type === 'elementMastery') {
        const best = ELEMENT_STATS.reduce(
          (a, s) => ((totals[s.id] || 0) > (totals[a.id] || 0) ? s : a),
          ELEMENT_STATS[0],
        );
        totals[best.id] = Math.round((totals[best.id] || 0) * (1 + trait.value / 100));
      } else if (trait.type === 'critFromPower') {
        totals.critChance += Math.floor(Math.max(totals.atk, totals.matk) / Math.max(1, trait.value));
      } else if (trait.type === 'maxHpPercent') {
        maxHp = Math.round(maxHp * (1 + trait.value / 100));
      } else if (trait.type === 'maxMpPercent') {
        maxMp = Math.round(maxMp * (1 + trait.value / 100));
      } else if (trait.type === 'elementFromCore') {
        const best = ELEMENT_STATS.reduce(
          (a, s) => ((totals[s.id] || 0) > (totals[a.id] || 0) ? s : a),
          ELEMENT_STATS[0],
        );
        totals[best.id] += Math.round((Math.max(totals.atk, totals.matk) * trait.value) / 100);
      } else if (
        trait.type === 'balancedPower' &&
        Math.min(totals.atk, totals.matk) / Math.max(totals.atk, totals.matk) >= 0.8
      ) {
        totals.atk = Math.round(totals.atk * (1 + trait.value / 100));
        totals.matk = Math.round(totals.matk * (1 + trait.value / 100));
      } else if (
        trait.type === 'balancedDefense' &&
        Math.min(totals.def, totals.mdef) / Math.max(totals.def, totals.mdef) >= 0.8
      ) {
        totals.def = Math.round(totals.def * (1 + trait.value / 100));
        totals.mdef = Math.round(totals.mdef * (1 + trait.value / 100));
      } else if (trait.type === 'allCorePercent') {
        for (const id of ['atk', 'def', 'matk', 'mdef', 'spd', 'hitEff', 'hitRes'])
          totals[id] = Math.round(totals[id] * (1 + trait.value / 100));
      } else if (trait.type === 'elementAllPercent') {
        for (const stat of ELEMENT_STATS)
          totals[stat.id] = Math.round(totals[stat.id] * (1 + trait.value / 100));
      }
    }
    if (state.dungeon && state.dungeon._altarPact) {
      totals.atk = Math.round(totals.atk * 1.3);
      totals.matk = Math.round(totals.matk * 1.3);
      maxHp = Math.max(1, Math.round(maxHp * 0.85));
    }
    return { ...totals, maxHp, maxMp, traits: allTraits };
  },

  refreshDerived(state) {
    state.derived = this.computeDerived(state);
  },

  grantItem(state, item) {
    state.inventory.push(item);
  },

  grantMaterial(state, materialId, amount = 1) {
    state.player.materials[materialId] = (state.player.materials[materialId] || 0) + amount;
  },

  lootAffinities(state) {
    const cls = CLASS_BY_ID[state.player.classId];
    const weights = {};
    for (const [stat, value] of Object.entries(cls.statMods)) if (value > 0) weights[stat] = 1.55;
    for (const id of state.player.unlockedSkills) {
      const skill = cls.skillTree.find((node) => node.id === id);
      if (!skill) continue;
      if (skill.magic) weights.matk = (weights.matk || 1) + 0.22;
      else if (skill.kind === 'active') weights.atk = (weights.atk || 1) + 0.18;
      if (skill.forcedElement)
        weights[`${skill.forcedElement}Dmg`] = (weights[`${skill.forcedElement}Dmg`] || 1) + 0.32;
      if (skill.effect?.type === 'statBonus')
        weights[skill.effect.stat] = (weights[skill.effect.stat] || 1) + 0.16;
    }
    for (const stat of Object.keys(weights)) weights[stat] = Math.min(2.8, weights[stat]);
    return weights;
  },

  equip(state, item) {
    if (state.mode === 'combat') {
      this.log(state, 'Equipment cannot be changed during combat.', 'bad');
      return false;
    }
    let slotId = item.slot;
    if (slotId === 'accessory1' || slotId === 'accessory2') {
      slotId = state.equipment.accessory1 ? 'accessory2' : 'accessory1';
    }
    const prev = state.equipment[slotId];
    state.equipment[slotId] = item;
    state.inventory = state.inventory.filter((i) => i.uid !== item.uid);
    if (prev) state.inventory.push(prev);
    this.refreshDerived(state);
    return true;
  },

  equipToSlot(state, item, slotId) {
    if (state.mode === 'combat') {
      this.log(state, 'Equipment cannot be changed during combat.', 'bad');
      return false;
    }
    const prev = state.equipment[slotId];
    state.equipment[slotId] = item;
    state.inventory = state.inventory.filter((i) => i.uid !== item.uid);
    if (prev) state.inventory.push(prev);
    this.refreshDerived(state);
    return true;
  },

  unequip(state, slotId) {
    if (state.mode === 'combat') {
      this.log(state, 'Equipment cannot be changed during combat.', 'bad');
      return false;
    }
    const item = state.equipment[slotId];
    if (!item) return;
    state.equipment[slotId] = null;
    state.inventory.push(item);
    this.refreshDerived(state);
    return true;
  },

  sell(state, item) {
    const tierIdx = TIERS.findIndex((t) => t.id === item.tier);
    const value = Math.round((8 + item.ilvl * 2.2) * (1 + tierIdx * 0.92));
    state.player.gold += value;
    state.inventory = state.inventory.filter((i) => i.uid !== item.uid);
    this.log(state, `Sold ${item.name} for ${value} gold.`, 'good');
  },
  startCombat(state, monsters, opts = {}) {
    this.refreshDerived(state);
    const mutators = state.dungeon?.mutators || [];
    const enemyHp = mutators.reduce((v, m) => v * (m.enemyHp || 1), 1),
      enemyPower = mutators.reduce((v, m) => v * (m.enemyPower || 1), 1),
      enemySpd = mutators.reduce((v, m) => v * (m.enemySpd || 1), 1),
      rewardMult = mutators.reduce((v, m) => v * (m.rewardMult || 1), 1);
    for (const m of monsters)
      if (!m._depthLawsApplied) {
        m.maxHp = m.hp = Math.round(m.maxHp * enemyHp);
        m.atk = Math.round(m.atk * enemyPower);
        m.matk = Math.round(m.matk * enemyPower);
        m.spd = Math.round(m.spd * enemySpd);
        m.goldDrop = Math.round(m.goldDrop * rewardMult);
        m.xpDrop = Math.round(m.xpDrop * rewardMult);
        m._depthLawsApplied = true;
      }
    state.mode = 'combat';
    state.ui.invOpen = false;
    state.ui.skillsOpen = false;
    state.ui.craftOpen = false;
    state.ui.slotOverlay = null;
    state.player._revivedThisFight = false;
    state.player._stunned = false;
    state.player.skillCooldowns = {};
    const dlvl = state.dungeon?.dungeonLevel || 1;
    const chargeChance = BALANCE.monsterChargeChance(dlvl);
    const utilityChance = BALANCE.monsterUtilityChance(dlvl);
    const bossCadence = BALANCE.bossChargeCadence(dlvl);
    for (const m of monsters) {
      m._charging = false;
      m._chargingMove = null;
      m._utilityCooldown = 0;
      m._phaseUsed = false;
      if (m.isBoss) m._chargeCountdown = Math.max(2, Math.round(bossCadence / (m._chargeBias || 1))) - 1;
    }
    state.combat = {
      monsters,
      isBoss: !!opts.isBoss,
      bonusLoot: !!opts.bonusLoot,
      round: 1,
      _combo: 0,
      _firstStrikeUsed: false,
      playerElement: state.equipment.weapon?.element || 'physical',
      buffs: [], // {stat, pct, name} — from player 'buff' skills OR monster debuffs (negative pct), lasts the whole fight
      playerDots: [], // {name, dmgPerTurn, turnsLeft} — poison/bleed-style damage over time on the player
      playerGuarding: false,
      resolving: false,
      skillMenuOpen: false,
      activeActor: null,
      targetUid: monsters[0] ? monsters[0].uid : null,
      chargeChance,
      utilityChance,
      bossCadence,
    };
    for (const trait of state.derived.traits)
      if (trait.type === 'startingWardPct') {
        state.combat.elementalWard =
          (state.combat.elementalWard || 0) + Math.round((state.derived.maxHp * trait.value) / 100);
        if (trait.id?.startsWith('boon_'))
          Metrics.count('boonEffectProcs', `${trait.id.slice(5)}:${trait.type}`);
      }
    state.combat._metrics = Metrics.battleStarted(state, monsters);
  },
  effectiveStat(state, statId) {
    let v = state.derived[statId] || 0;
    if (state.mode === 'combat' && state.combat) {
      const totalPct = state.combat.buffs.filter((b) => b.stat === statId).reduce((sum, b) => sum + b.pct, 0);
      v *= 1 + totalPct / 100;
    }
    return Math.round(v);
  },
  statModifiers(state, statId) {
    const mods = [];
    if (state.mode === 'combat' && state.combat) {
      for (const b of state.combat.buffs) if (b.stat === statId) mods.push({ name: b.name, pct: b.pct });
    }
    if (state.dungeon?._buffs) {
      for (const b of state.dungeon._buffs)
        if (b.stat === statId) mods.push({ name: b.name || 'Dungeon preparation', flat: b.flat });
    }
    for (const law of state.dungeon?.mutators || []) {
      const pct = law.playerPct?.[statId];
      if (pct) mods.push({ name: `Depth Law: ${law.name}`, pct, baked: true });
      if (law.elementPct && ELEMENT_STATS.some((stat) => stat.id === statId))
        mods.push({
          name: `Depth Law: ${law.name}`,
          pct: law.elementPct,
          baked: true,
        });
    }
    const blessingPct = state.dungeon?.blessing?.playerPct?.[statId];
    if (blessingPct)
      mods.push({ name: `Blessing: ${state.dungeon.blessing.name}`, pct: blessingPct, baked: true });
    if (state.dungeon?._altarPact && (statId === 'atk' || statId === 'matk'))
      mods.push({ name: 'Cursed Altar pact', pct: 30, baked: true });
    return mods;
  },
  maybeExtraAction(state, actionFn) {
    const t = state.derived.traits.find((x) => x.type === 'extraTurnChance' || x.type === 'tempestStep');
    const voidReady = !!state.combat?._voidExtraReady;
    if (voidReady) state.combat._voidExtraReady = false;
    if (voidReady || (t && Math.random() * 100 < t.value)) {
      if (t?.id?.startsWith('boon_')) Metrics.count('boonEffectProcs', `${t.id.slice(5)}:${t.type}`);
      this.log(state, 'Time loops back — you act again!', 'good');
      actionFn();
    }
  },
  getTarget(state) {
    const c = state.combat;
    if (!c) return null;
    return (
      c.monsters.find((m) => m.uid === c.targetUid && m.hp > 0) || c.monsters.find((m) => m.hp > 0) || null
    );
  },

  setTarget(state, monsterUid) {
    const c = state.combat;
    if (!c) return;
    const m = c.monsters.find((m) => m.uid === monsterUid && m.hp > 0);
    if (m) c.targetUid = m.uid;
  },
  playerAction(state, kind) {
    const c = state.combat;
    if (!c || c.resolving || state.player.hp <= 0) return;
    Metrics.count('actions', kind);
    if (kind === 'flee') {
      const fastestFoe = Math.max(0, ...c.monsters.filter((m) => m.hp > 0).map((m) => m.spd));
      const chance = U.clamp(50 + (this.effectiveStat(state, 'spd') - fastestFoe) * 0.6, 15, 90);
      if (Math.random() * 100 < chance) {
        this.log(state, 'You slip away from the fight.', 'flavor');
        this.endCombat(state, 'fled');
        return;
      }
      this.log(state, 'You fail to escape!', 'bad');
      this.resolveRound(state, { kind: 'flee-failed' });
      return;
    }
    if (!['attack', 'cast', 'defend'].includes(kind)) return;
    this.resolveRound(state, { kind });
  },
  findActiveSkill(state, skillId) {
    const cls = CLASS_BY_ID[state.player.classId];
    if (cls.innateActive && cls.innateActive.id === skillId) return cls.innateActive;
    const boonSkill = state.dungeon?.boons?.find((boon) => boon.skill?.id === skillId)?.skill;
    if (boonSkill) return boonSkill;
    const skill = cls.skillTree.find((sk) => sk.id === skillId);
    return skill && skill.kind === 'active' ? skill : null;
  },

  useSkill(state, skillId) {
    const c = state.combat;
    if (!c || c.resolving || state.player.hp <= 0) return;
    const cls = CLASS_BY_ID[state.player.classId];
    const skill = this.findActiveSkill(state, skillId);
    if (!skill) return;
    const isInnate = cls.innateActive && cls.innateActive.id === skillId;
    const isBoon = !!state.dungeon?.boons?.some((boon) => boon.skill?.id === skillId);
    if (!isInnate && !isBoon && !state.player.unlockedSkills.includes(skillId)) return;
    if (!c.monsters.some((m) => m.hp > 0)) return;
    if ((state.player.skillCooldowns[skillId] || 0) > 0) {
      this.log(state, `${skill.name} is still recovering.`, 'bad');
      return;
    }
    if (skill.oncePerBattle && (c._skillUses?.[skillId] || 0) >= (skill.maxUses || 1)) {
      this.log(state, `${skill.name} has already been exhausted this battle.`, 'bad');
      return;
    }
    const manaReduction = Math.min(
      75,
      state.derived.traits.filter((t) => t.type === 'manaCostReduction').reduce((sum, t) => sum + t.value, 0),
    );
    const cost = Math.max(0, Math.round(skill.manaCost * (1 - manaReduction / 100)));
    if (state.player.mp < cost) {
      this.log(state, 'Not enough MP for that.', 'bad');
      return;
    }
    Metrics.count('actions', 'skill');
    Metrics.count('skills', skillId);
    c.skillMenuOpen = false;
    this.resolveRound(state, { kind: 'skill', skill, cost });
  },
  executePlayerAction(state, action) {
    const c = state.combat;
    if (action.kind === 'attack' || action.kind === 'cast') {
      const target = this.getTarget(state);
      if (!target) return;
      this.resolveAttack(state, state.derived, target, action.kind, true);
      if (target.hp <= 0) this.log(state, `${target.name} falls.`, 'good');
      this.maybeExtraAction(state, () => {
        const t2 = this.getTarget(state);
        if (t2) {
          this.resolveAttack(state, state.derived, t2, action.kind, true);
          if (t2.hp <= 0) this.log(state, `${t2.name} falls.`, 'good');
        }
      });
    } else if (action.kind === 'skill') {
      const hpBefore = c.monsters.reduce((sum, m) => sum + Math.max(0, m.hp), 0),
        killsBefore = c.monsters.filter((m) => m.hp <= 0).length,
        playerHpBefore = state.player.hp;
      state.player.mp -= action.cost;
      c._skillUses ||= {};
      c._skillUses[action.skill.id] = (c._skillUses[action.skill.id] || 0) + 1;
      state.player.skillCooldowns[action.skill.id] = (action.skill.cooldown || 2) + 1;
      const handler = SKILL_ACTION_HANDLERS[action.skill.action];
      if (state.dungeon?.boons?.some((boon) => boon.skill?.id === action.skill.id))
        Metrics.count('boonSkillUses', action.skill.id);
      const flow = state.derived.traits.find((t) => t.type === 'manaFlow');
      if (flow) c._activeSkillDamageBonus = Math.min(flow.cap || 50, action.cost * flow.value);
      if (handler) handler(state, action.skill);
      const echo = state.derived.traits.find((t) => t.type === 'firstSkillEcho');
      if (echo && (c._skillEchoUses || 0) < echo.value) {
        c._skillEchoUses = (c._skillEchoUses || 0) + 1;
        Metrics.count('boonEffectProcs', 'echo_script:firstSkillEcho');
        this.log(state, 'Echo Script repeats the skill for free!', 'good');
        c._freeSkillRepeat = true;
        if (handler) handler(state, action.skill);
        c._freeSkillRepeat = false;
      }
      this.maybeExtraAction(state, () => {
        c._freeSkillRepeat = true;
        if (handler) handler(state, action.skill);
        c._freeSkillRepeat = false;
      });
      c._activeSkillDamageBonus = 0;
      const hpAfter = c.monsters.reduce((sum, m) => sum + Math.max(0, m.hp), 0),
        killsAfter = c.monsters.filter((m) => m.hp <= 0).length;
      Metrics.skillPerformance(action.skill, {
        damage: Math.max(0, hpBefore - hpAfter),
        healing: Math.max(0, state.player.hp - playerHpBefore),
        kills: Math.max(0, killsAfter - killsBefore),
        mana: action.cost,
      });
    } else if (action.kind === 'defend') {
      c.playerGuarding = true;
      c._combo = 0;
      const mpBack = Math.round(state.derived.maxMp * BALANCE.guardManaRestorePct);
      state.player.mp = Math.min(state.derived.maxMp, state.player.mp + mpBack);
      this.log(
        state,
        `You brace behind your guard, steadying your breath.${mpBack ? ` <b>+${mpBack} MP</b>.` : ''}`,
        'flavor',
      );
      const guardFury = state.derived.traits.find((t) => t.type === 'guardFury');
      if (guardFury) {
        c.buffs.push({
          stat: 'atk',
          pct: guardFury.value,
          name: guardFury.name,
        });
        this.log(
          state,
          `${guardFury.name} turns your guard into leverage — +${guardFury.value}% ATK for the rest of the fight.`,
          'good',
        );
      }
    }
  },
  applyMonsterMoveExtras(state, m, move, hitResult) {
    const c = state.combat;
    if (move.debuffStat && (!hitResult || hitResult.hit)) {
      c.buffs.push({
        stat: move.debuffStat,
        pct: -move.debuffValue,
        name: move.name,
      });
      this.log(
        state,
        `${m.name}'s ${move.name} saps your ${STAT_BY_ID[move.debuffStat]?.short || move.debuffStat}.`,
        'bad',
      );
    }
    if (move.lifestealPct && hitResult && hitResult.hit && hitResult.damage > 0) {
      const heal = Math.max(1, Math.round((hitResult.damage * move.lifestealPct) / 100));
      m.hp = Math.min(m.maxHp, m.hp + heal);
      this.log(state, `${m.name} drains <b>${heal}</b> HP from the blow.`, 'bad');
    }
    if (move.dotPct && hitResult && hitResult.hit && hitResult.damage > 0) {
      const dmgPerTurn = Math.max(1, Math.round((hitResult.damage * move.dotPct) / 100));
      c.playerDots.push({
        name: move.name,
        dmgPerTurn,
        turnsLeft: move.dotTurns || 2,
      });
      this.log(state, `${move.name} leaves you afflicted!`, 'bad');
    }
    if (move.stunChance && hitResult && hitResult.hit && Math.random() * 100 < move.stunChance) {
      state.player._stunned = true;
      this.log(state, `${move.name} leaves you reeling!`, 'bad');
    }
  },
  executeMonsterMove(state, m, move, opts = {}) {
    const c = state.combat;
    if (move.kind === 'buff') {
      m[move.buffStat] = Math.round((m[move.buffStat] || 0) * (1 + move.buffValue / 100));
      this.log(state, `${m.name} uses <b>${move.name}</b>, growing stronger!`, 'bad');
      return;
    }
    if (move.kind === 'heal') {
      const amt = Math.round((m.maxHp * move.healPct) / 100);
      m.hp = Math.min(m.maxHp, m.hp + amt);
      this.log(state, `${m.name} uses <b>${move.name}</b>, recovering <b>${amt}</b> HP!`, 'bad');
      return;
    }
    if (move.kind === 'debuff') {
      c.buffs.push({
        stat: move.debuffStat,
        pct: -move.debuffValue,
        name: move.name,
      });
      this.log(state, `${m.name} uses <b>${move.name}</b>, weakening you!`, 'bad');
      return;
    }
    const result = this.resolveAttack(state, m, { hp: state.player.hp }, 'attack', false, m, {
      powerMult: (move.power || 1) * (opts.chargeBonus || 1),
      forcedElement: move.forcedElement,
      charged: !!opts.charged,
      skillName: move.name,
    });
    this.applyMonsterMoveExtras(state, m, move, result);
  },
  monsterTurn(state, m) {
    const c = state.combat;
    if (m.hp <= 0) return;
    Metrics.mobAction(m, 'turn');
    if (m._stunned) {
      m._stunned = false;
      this.log(state, `${m.name} is stunned and cannot act.`, 'flavor');
      return;
    }

    const phaseMove = m.moves[2];
    if (phaseMove && !m._phaseUsed && (m.hp / m.maxHp) * 100 <= 40) {
      m._phaseUsed = true;
      m._charging = false; // a phase move interrupts any in-progress wind-up
      this.executeMonsterMove(state, m, phaseMove);
      return;
    }

    if (m._charging) {
      Metrics.mobAction(m, 'charge');
      const move = m._chargingMove || m.moves[0] || { kind: 'strike', power: 1 };
      m._charging = false;
      m._chargingMove = null;
      if (m.isBoss) m._chargeCountdown = Math.max(2, Math.round(c.bossCadence / (m._chargeBias || 1)));
      this.log(state, `${m.name} unleashes ${move.name || 'the blow'} it's been building!`, 'bad');
      this.executeMonsterMove(state, m, move, {
        chargeBonus: BALANCE.chargeDamageMult,
        charged: true,
      });
      return;
    }

    let startsCharge = false;
    if (m.isBoss) {
      m._chargeCountdown--;
      startsCharge = m._chargeCountdown <= 0;
    } else {
      startsCharge = Math.random() < c.chargeChance * (m._chargeBias || 1);
    }
    if (startsCharge && m.moves[0]) {
      m._charging = true;
      m._chargingMove = m.moves[0];
      this.log(state, `${m.name} begins channeling <b>${m.moves[0].name}</b> — brace yourself!`, 'bad');
      return;
    }

    const utilityMove = m.moves[1];
    if (utilityMove && m._utilityCooldown <= 0 && Math.random() < c.utilityChance * (m._utilityBias || 1)) {
      Metrics.mobAction(m, 'utility');
      m._utilityCooldown = BALANCE.monsterUtilityCooldown;
      this.executeMonsterMove(state, m, utilityMove);
      return;
    }

    this.resolveAttack(state, m, { hp: state.player.hp }, 'attack', false, m);
  },

  elementalProcChance(state, element) {
    const bonus = state.derived[`${element}Dmg`] || 0;
    const traitBonus = state.derived.traits
      .filter((t) => t.type === 'elementProcChance' && (t.element === element || t.element === 'all'))
      .reduce((sum, t) => sum + t.value, 0);
    return U.clamp(12 + bonus * 0.18 + traitBonus, 12, 65);
  },

  elementalStatusPower(state, element) {
    return (
      1 +
      state.derived.traits
        .filter((t) => t.type === 'elementStatusPower' && (t.element === element || t.element === 'all'))
        .reduce((sum, t) => sum + t.value, 0) /
        100
    );
  },

  applyElementalAilment(state, target, element, hitDamage, guaranteed = false) {
    if (
      !target ||
      target.hp <= 0 ||
      (!guaranteed && Math.random() * 100 >= this.elementalProcChance(state, element))
    )
      return false;
    Metrics.count('elementalAilments', element);
    target._ailments ||= {};
    const power = this.elementalStatusPower(state, element),
      name = ELEMENTAL_AILMENTS[element].name;
    if (element === 'physical' || element === 'fire') {
      const key = element === 'fire' ? 'burn' : 'bleed',
        base = Math.max(1, Math.round(hitDamage * (element === 'fire' ? 0.12 : 0.1) * power));
      const a = (target._ailments[key] ||= {
        name,
        stacks: 0,
        turns: 3,
        damage: 0,
      });
      a.stacks = Math.min(3, a.stacks + 1);
      a.turns = 3;
      a.damage = Math.max(a.damage, base);
      this.log(state, `${target.name} suffers <b>${name}</b> (${a.stacks}).`, 'good');
    } else if (element === 'ice') {
      const a = (target._ailments.chill ||= { name, stacks: 0 });
      a.stacks++;
      if (a.stacks >= 3) {
        target._stunned = true;
        delete target._ailments.chill;
        this.log(state, `${target.name} is <b>frozen</b> solid!`, 'good');
      } else this.log(state, `${target.name} gains Chill (${a.stacks}/3).`, 'good');
    } else if (element === 'lightning') {
      const other = state.combat.monsters.find((m) => m.hp > 0 && m.uid !== target.uid),
        arc = Math.max(1, Math.round(hitDamage * 0.35 * power));
      if (other) {
        other.hp = Math.max(0, other.hp - arc);
        Metrics.addTotal('damageDealt', arc);
        Metrics.combatFlow(state.combat, 'dealt', arc, other);
        this.log(state, `Static arcs into ${other.name} for <b>${arc}</b>.`, 'good');
      } else {
        const soloArc = Math.round(arc * 0.6);
        target.hp = Math.max(0, target.hp - soloArc);
        Metrics.addTotal('damageDealt', soloArc);
        Metrics.combatFlow(state.combat, 'dealt', soloArc, target);
        this.log(state, `Static discharges again for <b>${soloArc}</b>.`, 'good');
      }
    } else if (element === 'poison') {
      const a = (target._ailments.toxin ||= { name, stacks: 0, damage: 0 });
      a.stacks = Math.min(5, a.stacks + 1);
      a.damage = Math.max(a.damage, Math.max(1, Math.round(hitDamage * 0.055 * power)));
      this.log(state, `${target.name} gains Toxin (${a.stacks}/5).`, 'good');
    } else if (element === 'holy') {
      const ward = Math.max(1, Math.round(state.derived.maxHp * 0.055 * power)),
        cap = Math.round(state.derived.maxHp * 0.25);
      state.combat.elementalWard = Math.min(cap, (state.combat.elementalWard || 0) + ward);
      this.log(state, `Radiance grants a <b>${ward} HP ward</b>.`, 'good');
    } else if (element === 'dark') {
      const a = (target._ailments.doom ||= { name, stacks: 0 });
      a.stacks++;
      if (a.stacks >= 5) {
        const blast = Math.max(1, Math.round(hitDamage * 0.9 * power));
        target.hp = Math.max(0, target.hp - blast);
        Metrics.addTotal('damageDealt', blast);
        Metrics.combatFlow(state.combat, 'dealt', blast, target);
        delete target._ailments.doom;
        this.log(state, `Five Doom Marks detonate for <b>${blast}</b> dark damage!`, 'good');
      } else this.log(state, `${target.name} gains a Doom Mark (${a.stacks}/5).`, 'good');
    }
    return true;
  },

  tickEnemyAilments(state) {
    for (const m of state.combat.monsters) {
      if (m.hp <= 0 || !m._ailments) continue;
      for (const key of ['burn', 'bleed']) {
        const a = m._ailments[key];
        if (!a) continue;
        const dmg = a.damage * a.stacks;
        m.hp = Math.max(0, m.hp - dmg);
        Metrics.addTotal('damageDealt', dmg);
        Metrics.combatFlow(state.combat, 'dealt', dmg, m);
        this.log(state, `${a.name} deals <b>${dmg}</b> to ${m.name}.`, 'good');
        if (--a.turns <= 0) delete m._ailments[key];
      }
      const toxin = m._ailments.toxin;
      if (toxin) {
        const dmg = toxin.damage * toxin.stacks;
        m.hp = Math.max(0, m.hp - dmg);
        Metrics.addTotal('damageDealt', dmg);
        Metrics.combatFlow(state.combat, 'dealt', dmg, m);
        this.log(state, `Toxin deals <b>${dmg}</b> to ${m.name}.`, 'good');
      }
    }
  },
  resolveRound(state, action) {
    const c = state.combat;
    if (!c || c.resolving) return;
    c.resolving = true;
    c.skillMenuOpen = false;
    c.playerGuarding = action.kind === 'defend';
    const jitter = () => (Math.random() * 2 - 1) * BALANCE.initiativeJitter;
    const combatants = [
      { type: 'player', spd: this.effectiveStat(state, 'spd') + jitter() },
      ...c.monsters.filter((m) => m.hp > 0).map((m) => ({ type: 'monster', ref: m, spd: m.spd + jitter() })),
    ].sort((a, b) => b.spd - a.spd);

    const runNext = (index) => {
      if (state.combat !== c) return;
      if (index >= combatants.length || state.player.hp <= 0 || c.monsters.every((m) => m.hp <= 0)) {
        c.activeActor = 'round-end';
        this.endOfRound(state);
        if (state.combat === c) {
          c.resolving = false;
          c.activeActor = null;
        }
        render();
        return;
      }
      const combatant = combatants[index];
      if (combatant.type === 'player') {
        c.activeActor = 'player';
        if (state.player._stunned) {
          state.player._stunned = false;
          this.log(state, "You're reeling and can't act this round!", 'bad');
        } else this.executePlayerAction(state, action);
      } else if (combatant.ref.hp > 0) {
        c.activeActor = combatant.ref.uid;
        if (combatant.ref._stunned) {
          combatant.ref._stunned = false;
          this.log(state, `${combatant.ref.name} is frozen and loses its action!`, 'good');
        } else this.monsterTurn(state, combatant.ref);
      }
      render();
      const pace = { fast: 0.55, normal: 1, cinematic: 1.55 }[state.settings?.combatPace] || 1;
      setTimeout(() => runNext(index + 1), BALANCE.combatActionDelayMs * pace);
    };
    const pace = { fast: 0.55, normal: 1, cinematic: 1.55 }[state.settings?.combatPace] || 1;
    setTimeout(() => runNext(0), Math.round(BALANCE.combatActionDelayMs * 0.55 * pace));
  },
  endOfRound(state) {
    const c = state.combat;
    if (!c) return;
    for (const t of state.derived.traits) {
      if (t.type === 'regenPerTurn')
        state.player.hp = Math.min(state.derived.maxHp, state.player.hp + Math.round(t.value));
      if (t.type === 'mpRegenPerTurn')
        state.player.mp = Math.min(state.derived.maxMp, state.player.mp + Math.round(t.value));
    }
    if (state.player.hp > 0 && c.playerDots.length) {
      for (const dot of c.playerDots) {
        if (dot.turnsLeft <= 0) continue;
        state.player.hp = Math.max(0, state.player.hp - dot.dmgPerTurn);
        this.log(state, `${dot.name} gnaws at you for <b>${dot.dmgPerTurn}</b> damage.`, 'bad');
        dot.turnsLeft--;
      }
      c.playerDots = c.playerDots.filter((d) => d.turnsLeft > 0);
    }
    this.tickEnemyAilments(state);
    for (const trait of state.derived.traits)
      if (trait.type === 'countdownNova' && c.round % trait.value === 0) {
        const power = Math.max(this.effectiveStat(state, 'atk'), this.effectiveStat(state, 'matk')),
          dmg = Math.max(1, Math.round((power * (trait.power || 50)) / 100));
        for (const enemy of c.monsters)
          if (enemy.hp > 0) {
            enemy.hp = Math.max(0, enemy.hp - dmg);
            Metrics.addTotal('damageDealt', dmg);
            Metrics.combatFlow(c, 'dealt', dmg, enemy);
          }
        this.log(state, `Doom Clock erupts across the battlefield for <b>${dmg}</b> damage.`, 'good');
        Metrics.count('boonEffectProcs', 'doom_clock:countdownNova');
      }
    state.player.hp = U.clamp(state.player.hp, 0, state.derived.maxHp);
    c.playerGuarding = false;
    for (const id of Object.keys(state.player.skillCooldowns)) {
      state.player.skillCooldowns[id] = Math.max(0, state.player.skillCooldowns[id] - 1);
    }
    for (const m of c.monsters) {
      if (m.hp > 0 && m._utilityCooldown > 0) m._utilityCooldown--;
    }
    if (!c.monsters.find((m) => m.uid === c.targetUid && m.hp > 0)) {
      const nextAlive = c.monsters.find((m) => m.hp > 0);
      c.targetUid = nextAlive ? nextAlive.uid : null;
    }
    if (state.player.hp <= 0) {
      let revived = false;
      for (const t of state.derived.traits) {
        if (t.type === 'revive' || t.type === 'reviveOncePerFight' || t.type === 'phoenixAscension') {
          const ctx = {
            player: state.player,
            maxHp: state.derived.maxHp,
            maxMp: state.derived.maxMp,
            combat: c,
            derived: state.derived,
            notes: [],
          };
          EFFECT_HANDLERS[t.type](ctx, t.value);
          if (ctx.player.hp > 0) {
            revived = true;
            if (t.id?.startsWith('boon_')) Metrics.count('boonEffectProcs', `${t.id.slice(5)}:${t.type}`);
            if (ctx.notes.length) this.log(state, ctx.notes.join(' '), 'good');
          }
        }
      }
      if (!revived) {
        this.log(state, 'You collapse — the dungeon has beaten you.', 'bad');
        this.endCombat(state, 'defeat');
        return;
      }
    }
    if (c.monsters.every((m) => m.hp <= 0)) {
      this.endCombat(state, 'victory');
      return;
    }
    c.round++;
  },
  resolveAttack(state, attackerStats, targetRef, kind, isPlayer, monsterObj = null, opts = {}) {
    const c = state.combat;
    const traits = isPlayer ? state.derived.traits : [];
    const useMagic = kind === 'cast' || (kind === 'skill' && !!opts.magic);
    const powerMult = opts.powerMult || 1;
    const atkStat = isPlayer
      ? this.effectiveStat(state, useMagic ? 'matk' : 'atk') * powerMult
      : (useMagic ? attackerStats.matk : attackerStats.atk) * powerMult;
    const defStat = isPlayer ? targetRef.def || 0 : this.effectiveStat(state, 'def');
    const mdefStat = isPlayer ? targetRef.mdef || 0 : this.effectiveStat(state, 'mdef');
    let relevantDef = useMagic ? mdefStat : defStat;
    if (!isPlayer && opts.charged) relevantDef *= 1 - BALANCE.chargeDefPiercePct;
    const element = opts.forcedElement || (isPlayer ? c.playerElement : monsterObj.element);
    const elemBonusStat = element + 'Dmg';
    const elemBonus = isPlayer ? state.derived[elemBonusStat] || 0 : 0;
    const verb = opts.skillName ? `use ${opts.skillName} on` : useMagic ? 'cast a spell at' : 'strike';

    let hitEff = isPlayer ? state.derived.hitEff : attackerStats.hitEff;
    let hitRes = isPlayer ? targetRef.hitRes || 0 : this.effectiveStat(state, 'hitRes');
    const hitChance = U.clamp(85 + (hitEff - hitRes) * 0.5, 55, 98);
    const ctxBase = {
      notes: [],
      combat: c,
      player: state.player,
      derived: state.derived,
      maxHp: state.derived.maxHp,
      maxMp: state.derived.maxMp,
      combo: c._combo || 0,
    };

    if (Math.random() * 100 > hitChance) {
      if (isPlayer) Metrics.addTotal('misses');
      this.log(state, isPlayer ? `Your attack misses!` : `${monsterObj.name}'s attack misses!`, 'flavor');
      return { hit: false };
    }

    let critChance = 5 + hitEff * 0.2;
    let critMult = 1.5;
    if (isPlayer) {
      critChance += state.derived.critChance || 0;
      critMult += (state.derived.critDamage || 0) / 100;
    }
    if (isPlayer)
      for (const t of traits) {
        if (t.type === 'critChanceBonus') critChance += t.value;
        if (t.type === 'critDmgBonus') critMult += t.value / 100;
        if (t.type === 'firstHitCrit' && !c._firstAttackResolved) critChance += t.value;
        if (t.type === 'fateMomentum') critChance += c._fateCrit || 0;
      }
    const isCrit = Math.random() * 100 < critChance;
    if (isPlayer && isCrit) Metrics.addTotal('crits');
    if (isPlayer) c._firstAttackResolved = true;

    let dmg = Math.max(1, Math.round((atkStat * 1.0 - relevantDef * 0.5) * U.rand(0.85, 1.15)));
    dmg = Math.round(dmg * (1 + elemBonus / 100));
    let matchupNote = '';
    if (isPlayer && element !== 'physical' && targetRef.element && targetRef.element !== 'physical') {
      if (BALANCE.elementalPreysOn[element] === targetRef.element) {
        dmg = Math.round(dmg * BALANCE.elementalStrongMult);
        matchupNote = 'Elemental weakness!';
        Metrics.count('elemental', 'strong');
      } else if (BALANCE.elementalPreysOn[targetRef.element] === element) {
        dmg = Math.round(dmg * BALANCE.elementalResistMult);
        matchupNote = `${targetRef.name} resists the element.`;
        Metrics.count('elemental', 'resisted');
      }
    }
    if (isCrit) dmg = Math.round(dmg * critMult);

    const ctx = {
      ...ctxBase,
      attacker: isPlayer ? state.player : monsterObj,
      target: isPlayer ? targetRef : state.player,
      targetName: isPlayer ? targetRef.name : 'You',
      damage: dmg,
      direction: 'outgoing',
      source: isPlayer ? state.player : monsterObj,
      isCrit,
      element,
      kind,
    };
    if (matchupNote) ctx.notes.push(matchupNote);
    if (isPlayer) {
      for (const t of traits) {
        const h = EFFECT_HANDLERS[t.type];
        if (h) {
          const isBoon = t.id?.startsWith('boon_'),
            snapshot = () =>
              `${ctx.damage}|${ctx.notes.length}|${state.player.hp}|${state.player.mp}|${ctx.target.hp}|${ctx.statusEcho}|${ctx.extraHit}|${ctx.overkillSplash}|${ctx.forceAilment}|${ctx.target._utilityCooldown}|${ctx.target._charging}`,
            before = isBoon ? snapshot() : '';
          if (isBoon) Metrics.count('boonEffectEvaluations', `${t.id.slice(5)}:${t.type}`);
          h(ctx, t.value);
          if (isBoon && before !== snapshot()) Metrics.count('boonEffectProcs', `${t.id.slice(5)}:${t.type}`);
        }
      }
      if (
        opts.executeThreshold != null &&
        ctx.target.hp > 0 &&
        (ctx.target.hp / ctx.target.maxHp) * 100 <= opts.executeThreshold
      ) {
        ctx.damage = ctx.target.hp;
        ctx.notes.push('A merciless finishing blow!');
      }
    }
    dmg = ctx.damage;
    if (isPlayer) {
      const defenderHpBefore = targetRef.hp;
      targetRef.hp = Math.max(0, targetRef.hp - dmg);
      Metrics.addTotal('damageDealt', dmg);
      Metrics.combatFlow(c, 'dealt', dmg, targetRef);
      this.log(
        state,
        `You ${verb} ${targetRef.name} for <b>${dmg}</b>${isCrit ? ' (critical!)' : ''} damage.${ctx.notes.length ? ' ' + ctx.notes.join(' ') : ''}`,
        'combat',
      );
      const afflicted =
        targetRef.hp > 0 &&
        this.applyElementalAilment(
          state,
          targetRef,
          element,
          dmg,
          !!opts.guaranteedStatus || !!ctx.forceAilment,
        );
      if (afflicted && ctx.statusEcho) {
        const echoTarget = c.monsters.find((m) => m.hp > 0 && m.uid !== targetRef.uid);
        if (echoTarget) {
          this.applyElementalAilment(state, echoTarget, element, dmg, true);
          this.log(state, `${ELEMENTAL_AILMENTS[element].name} echoes into ${echoTarget.name}.`, 'good');
        }
      }
      if (ctx.overkillSplash && dmg > defenderHpBefore) {
        const excess = dmg - defenderHpBefore,
          splashTarget = c.monsters.find((m) => m.hp > 0 && m.uid !== targetRef.uid);
        if (splashTarget) {
          const splash = Math.max(1, Math.round((excess * ctx.overkillSplash) / 100));
          splashTarget.hp = Math.max(0, splashTarget.hp - splash);
          Metrics.addTotal('damageDealt', splash);
          Metrics.combatFlow(c, 'dealt', splash, splashTarget);
          this.log(state, `Violent Excess erupts into ${splashTarget.name} for <b>${splash}</b>.`, 'good');
        }
      }
      if (ctx.extraHit) {
        const extra = Math.max(1, Math.round(dmg * (ctx.extraHitMult || 0.5)));
        targetRef.hp = Math.max(0, targetRef.hp - extra);
        Metrics.addTotal('damageDealt', extra);
        Metrics.combatFlow(c, 'dealt', extra, targetRef);
        this.log(state, `A twinned strike lands for another <b>${extra}</b> damage!`, 'combat');
      }
      if (ctx.echo) {
        targetRef.hp = Math.max(0, targetRef.hp - ctx.echo);
        Metrics.addTotal('damageDealt', ctx.echo);
        Metrics.combatFlow(c, 'dealt', ctx.echo, targetRef);
        this.log(state, `An echo of the strike deals <b>${ctx.echo}</b> more damage.`, 'combat');
      }
      c._combo = (c._combo || 0) + 1;
      for (const t of traits)
        if (t.type === 'fateMomentum') c._fateCrit = isCrit ? 0 : Math.min(75, (c._fateCrit || 0) + t.value);
      return { hit: true, damage: dmg, crit: isCrit };
    } else {
      const incomingCtx = {
        ...ctxBase,
        direction: 'incoming',
        damage: dmg,
        attacker: monsterObj,
        target: state.player,
        targetName: 'You',
        source: monsterObj,
      };
      for (const t of state.derived.traits) {
        const h = EFFECT_HANDLERS[t.type];
        if (h) {
          const isBoon = t.id?.startsWith('boon_'),
            snapshot = () =>
              `${incomingCtx.damage}|${incomingCtx.notes.length}|${state.player.hp}|${state.player.mp}|${monsterObj?.hp}|${incomingCtx.dodged}|${c.elementalWard}`,
            before = isBoon ? snapshot() : '';
          if (isBoon) Metrics.count('boonEffectEvaluations', `${t.id.slice(5)}:${t.type}`);
          h(incomingCtx, t.value);
          if (isBoon && before !== snapshot()) Metrics.count('boonEffectProcs', `${t.id.slice(5)}:${t.type}`);
        }
      }
      let finalDmg = incomingCtx.dodged ? 0 : incomingCtx.damage;
      if (!incomingCtx.dodged && c.playerGuarding) {
        let mit = opts.charged ? BALANCE.guardMitigationVsCharge : BALANCE.guardMitigation;
        const guardBonus = state.derived.traits.find((t) => t.type === 'guardMitigationBonus');
        if (guardBonus) mit = Math.min(0.95, mit + guardBonus.value / 100);
        finalDmg = Math.round(finalDmg * (1 - mit));
        incomingCtx.notes.push('Your guard absorbs much of the blow.');
      }
      if (finalDmg > 0 && c.elementalWard > 0) {
        const absorbed = Math.min(c.elementalWard, finalDmg);
        c.elementalWard -= absorbed;
        finalDmg -= absorbed;
        incomingCtx.notes.push(`Radiant Ward absorbs ${absorbed} damage.`);
      }
      state.player.hp = Math.max(0, state.player.hp - finalDmg);
      Metrics.addTotal('damageTaken', finalDmg);
      Metrics.combatFlow(c, 'taken', finalDmg, monsterObj);
      const monsterVerb = opts.skillName
        ? `uses ${opts.skillName} on`
        : useMagic
          ? 'casts a spell at'
          : opts.charged
            ? 'unleashes a charged blow on'
            : 'strikes';
      this.log(
        state,
        `${monsterObj.name} ${monsterVerb} you for <b>${finalDmg}</b>${isCrit ? ' (critical!)' : ''} damage.${incomingCtx.notes.length ? ' ' + incomingCtx.notes.join(' ') : ''}`,
        'bad',
      );
      return { hit: !incomingCtx.dodged, damage: finalDmg, crit: isCrit };
    }
  },

  endCombat(state, result) {
    const c = state.combat;
    Metrics.battleEnded(state, result, c);
    if (result === 'defeat' || result === 'fled' || (result === 'victory' && c.isBoss))
      Metrics.dungeonOutcome(state.dungeon?.difficultyId, result);
    if (result === 'victory') {
      let gold = 0,
        xp = 0;
      for (const m of c.monsters) {
        gold += m.goldDrop;
        xp += m.xpDrop;
      }
      const sharedBonus = state.derived.traits
        .filter((t) => t.type === 'goldAndXp')
        .reduce((sum, t) => sum + t.value, 0);
      const goldBonus =
        sharedBonus +
        state.derived.traits.filter((t) => t.type === 'goldFind').reduce((sum, t) => sum + t.value, 0);
      const xpBonus =
        sharedBonus +
        state.derived.traits.filter((t) => t.type === 'xpBonus').reduce((sum, t) => sum + t.value, 0);
      gold = Math.round(gold * (1 + goldBonus / 100));
      xp = Math.round(xp * (1 + xpBonus / 100));
      state.player.gold += gold;
      state.player.xp += xp;
      Metrics.reward(gold, xp);
      this.log(state, `Victory! You gain <b>${gold} gold</b> and <b>${xp} XP</b>.`, 'good');
      this.checkLevelUp(state);
      const isBoss = c.isBoss;
      const materialDrops = [];
      for (const monster of c.monsters) {
        const material = Generators.rollCraftingMaterial(isBoss);
        if (!material) continue;
        this.grantMaterial(state, material.id);
        materialDrops.push(material.name);
      }
      if (materialDrops.length)
        this.log(state, `You recover crafting material: <b>${materialDrops.join(', ')}</b>.`, 'good');
      if (isBoss && Math.random() < 0.22) {
        const unknownRecipes = MYTHIC_RECIPES.filter((recipe) => !state.player.recipes.includes(recipe.id));
        if (unknownRecipes.length) {
          const recipe = U.pick(unknownRecipes);
          state.player.recipes.push(recipe.id);
          this.log(
            state,
            `<b style="color:var(--t-mythic1)">Rare recipe discovered:</b> ${recipe.name}. Visit the Soulforge in town.`,
            'good',
          );
        }
      }
      const mutatorLoot = (state.dungeon.mutators || []).reduce((sum, m) => sum + (m.lootBonus || 0), 0);
      const boonLoot = (state.dungeon.boons || []).reduce(
        (sum, b) => sum + (b.effect?.type === 'lootBonus' ? b.effect.value : 0),
        0,
      );
      if (boonLoot) Metrics.count('boonEffectProcs', 'fortune_eater:lootBonus');
      const drops = Array.from({ length: 3 }, () =>
        Generators.generateItem(state.dungeon.dungeonLevel, {
          lootBonus:
            state.dungeon.difficulty.lootBonus +
            mutatorLoot +
            boonLoot +
            (state.dungeon.blessing?.lootBonus || 0) +
            (isBoss ? 0.65 : c.bonusLoot ? 0.25 : 0),
          rarityPenalty: isBoss ? 0.18 : 0.42,
          forcedMinTier: isBoss ? 'rare' : c.bonusLoot ? 'uncommon' : undefined,
          affinities: this.lootAffinities(state),
        }),
      );
      state.combat = null;
      const proceed = (s) => {
        if (isBoss) {
          s.mode = 'complete';
        } else {
          s.mode = 'explore';
          this.finishRoom(s);
        }
      };
      this.log(state, `The fallen leave three possibilities. Choose one.`, 'flavor');
      this.presentItemChoices(state, drops, proceed);
    } else if (result === 'fled') {
      state.combat = null;
      state.mode = 'explore';
    } else if (result === 'defeat') {
      state.combat = null;
      state.mode = 'defeat';
      const eligible = state.inventory.filter((item) => !item.crafted && item.tier !== 'mythic_legendary');
      const lostItem = eligible.length ? U.pick(eligible) : null;
      const materialPool = [];
      for (const [id, count] of Object.entries(state.player.materials || {}))
        for (let i = 0; i < count; i++) materialPool.push(id);
      const materialLossCount = Math.min(materialPool.length, U.randInt(c.isBoss ? 2 : 1, c.isBoss ? 5 : 4));
      const materialLosses = {};
      for (let i = 0; i < materialLossCount; i++) {
        const index = U.randInt(0, materialPool.length - 1),
          id = materialPool.splice(index, 1)[0];
        materialLosses[id] = (materialLosses[id] || 0) + 1;
      }
      state.ui.deathPenalty = {
        goldLost: Math.floor(state.player.gold * 0.25),
        xpLost: Math.floor(state.player.xp * 0.2),
        itemUid: lostItem?.uid || null,
        itemName: lostItem?.name || null,
        materialLosses,
        bossDefeat: !!c.isBoss,
      };
    }
  },

  applyDeathPenalty(state) {
    const penalty = state.ui.deathPenalty;
    if (!penalty) return null;
    state.player.gold = Math.max(0, state.player.gold - penalty.goldLost);
    state.player.xp = Math.max(0, state.player.xp - penalty.xpLost);
    if (penalty.itemUid) state.inventory = state.inventory.filter((item) => item.uid !== penalty.itemUid);
    for (const [id, count] of Object.entries(penalty.materialLosses || {}))
      state.player.materials[id] = Math.max(0, (state.player.materials[id] || 0) - count);
    Metrics.count('deathPenalties', 'goldLost', penalty.goldLost);
    Metrics.count('deathPenalties', 'xpLost', penalty.xpLost);
    if (penalty.itemUid) Metrics.count('deathPenalties', 'itemsLost');
    for (const [id, count] of Object.entries(penalty.materialLosses || {}))
      Metrics.count('deathMaterialLosses', id, count);
    state.ui.deathPenalty = null;
    return penalty;
  },
  presentItemDrop(state, item, afterFn) {
    Metrics.loot(item, 'offered');
    state.ui.pendingItem = item;
    state.ui.choices = [
      {
        label: 'Pick it up',
        act: (s) => {
          Metrics.loot(item, 'taken');
          this.grantItem(s, item);
          this.log(
            s,
            `You take the <b style="color:${TIER_BY_ID[item.tier].color}">${item.name}</b> (${TIER_BY_ID[item.tier].name}).`,
            'good',
          );
          s.ui.pendingItem = null;
          afterFn(s);
        },
      },
      {
        label: 'Leave it behind',
        act: (s) => {
          Metrics.loot(item, 'left');
          this.log(s, `You leave the ${item.name} where it lies.`, 'flavor');
          s.ui.pendingItem = null;
          afterFn(s);
        },
      },
    ];
    state.mode = 'event';
  },

  presentItemChoices(state, items, afterFn) {
    for (const item of items) Metrics.loot(item, 'offered');
    state.ui.pendingItems = items;
    state.ui.pendingItem = null;
    state.ui.choices = [
      ...items.map((item, index) => ({
        label: `Choose ${item.name}`,
        act: (s) => {
          Metrics.loot(item, 'taken');
          for (const other of items) if (other !== item) Metrics.loot(other, 'left');
          this.grantItem(s, item);
          this.log(
            s,
            `You choose the <b style="color:${TIER_BY_ID[item.tier].color}">${item.name}</b> (${TIER_BY_ID[item.tier].name}).`,
            'good',
          );
          s.ui.pendingItems = null;
          s.ui.choices = null;
          afterFn(s);
        },
      })),
      {
        label: 'Leave all three',
        act: (s) => {
          for (const item of items) Metrics.loot(item, 'left');
          this.log(s, 'You leave all three pieces behind.', 'flavor');
          s.ui.pendingItems = null;
          s.ui.choices = null;
          afterFn(s);
        },
      },
    ];
    state.mode = 'event';
  },
  resolveChest(state) {
    const dlvl = state.dungeon.dungeonLevel;
    const lootBonus = state.dungeon.difficulty.lootBonus;
    const outcomes = [
      { t: 'gear', w: 34 },
      { t: 'gold', w: 22 },
      { t: 'materials', w: 16 },
      { t: 'bundle', w: 11 },
      { t: 'empty', w: 7 },
      { t: 'mimic', w: 10 },
    ];
    const outcome = U.weightedPick(outcomes, (x) => x.w).t;

    if (outcome === 'gear') {
      const item = Generators.generateItem(dlvl, {
        lootBonus,
        affinities: this.lootAffinities(state),
      });
      this.log(state, `Inside you find something.`, 'flavor');
      this.presentItemDrop(state, item, (s2) => {
        this.finishRoom(s2);
      });
    } else if (outcome === 'gold') {
      const gold = Math.round(U.randInt(20, 45) * (1 + dlvl * 0.12));
      state.player.gold += gold;
      this.log(state, `The chest holds no gear — just coin. Plenty of it: <b>${gold} gold</b>.`, 'good');
      this.finishRoom(state);
    } else if (outcome === 'materials') {
      const count = U.randInt(1, 3);
      const names = [];
      for (let i = 0; i < count; i++) {
        const m = U.pick(CRAFTING_MATERIALS);
        this.grantMaterial(state, m.id);
        names.push(m.name);
      }
      this.log(state, `Wrapped in oilcloth: <b>${names.join(', ')}</b>.`, 'good');
      this.finishRoom(state);
    } else if (outcome === 'bundle') {
      const gold = Math.round(U.randInt(10, 20) * (1 + dlvl * 0.1));
      const mat = U.pick(CRAFTING_MATERIALS);
      state.player.gold += gold;
      this.grantMaterial(state, mat.id);
      this.log(state, `A little of everything: <b>${gold} gold</b> and a <b>${mat.name}</b>.`, 'good');
      this.finishRoom(state);
    } else if (outcome === 'empty') {
      this.log(state, `The chest creaks open — empty. Someone beat you to it.`, 'flavor');
      this.finishRoom(state);
    } else if (outcome === 'mimic') {
      const tpl = {
        id: 'mimic',
        name: 'Mimic',
        title: 'the Betrayer Chest',
        icon: '📦',
        element: 'physical',
        flavor: 'wood and iron peeling back to reveal teeth',
        atk: 1.25,
        def: 0.9,
        matk: 0.3,
        mdef: 0.6,
        spd: 0.75,
      };
      const monster = Generators.monsterFromTemplate(tpl, dlvl, state.dungeon.difficulty.monsterMult, false);
      monster.goldDrop = Math.round(monster.goldDrop * 1.5);
      monster.xpDrop = Math.round(monster.xpDrop * 1.5);
      this.log(state, `The lid splits open into a maw of teeth — it was never a chest at all!`, 'bad');
      this.startCombat(state, [monster], { bonusLoot: true });
    }
  },

  checkLevelUp(state) {
    let leveled = false;
    while (state.player.xp >= BALANCE.xpToNext(state.player.level)) {
      state.player.xp -= BALANCE.xpToNext(state.player.level);
      state.player.level++;
      state.player.skillPoints += 2;
      Metrics.addTotal('levelsGained');
      leveled = true;
    }
    this.refreshDerived(state);
    if (leveled) {
      state.player.hp = state.derived.maxHp;
      state.player.mp = state.derived.maxMp;
      this.log(
        state,
        `<b style="color:var(--gold)">Level up!</b> You are now level ${state.player.level}. (+2 skill points)`,
        'good',
      );
    }
  },
  canUnlock(state, skill) {
    if (state.mode === 'combat') return false;
    if (state.player.unlockedSkills.includes(skill.id)) return false;
    if (state.player.skillPoints < skill.cost) return false;
    if (skill.requires && !state.player.unlockedSkills.includes(skill.requires)) return false;
    if (skill.choiceGroup) {
      const cls = CLASS_BY_ID[state.player.classId];
      const chosenRoot = cls.skillTree.find(
        (candidate) =>
          candidate.choiceGroup === skill.choiceGroup && state.player.unlockedSkills.includes(candidate.id),
      );
      if (chosenRoot) return false;
    }
    return true;
  },

  unlockSkill(state, skillId) {
    if (state.mode === 'combat') {
      this.log(state, 'New skills cannot be learned during combat.', 'bad');
      return false;
    }
    const cls = CLASS_BY_ID[state.player.classId];
    const skill = cls.skillTree.find((sk) => sk.id === skillId);
    if (!skill || !this.canUnlock(state, skill)) return;
    state.player.skillPoints -= skill.cost;
    state.player.unlockedSkills.push(skillId);
    this.refreshDerived(state);
    this.log(state, `Learned <b>${skill.name}</b>.`, 'good');
    return true;
  },
  setChoices(state, choices) {
    state.ui.choices = choices;
    state.mode = 'event';
  },
  renderCurrentChoices(state) {},

  enterNextRoom(state) {
    const d = state.dungeon;
    d.currentIndex++;
    state.log = [];
    state.ui.choices = null;
    state.ui.merchantStock = null;
    state.ui.pendingItem = null;
    if (d.currentIndex >= d.roomTypes.length) {
      state.mode = 'complete';
      return;
    }
    const type = d.roomTypes[d.currentIndex];
    const isLast = d.currentIndex === d.roomTypes.length - 1;
    this.log(
      state,
      `<span class="log-flavor">— ${isLast ? 'The final chamber' : 'Room ' + (d.currentIndex + 1) + ' of ' + d.roomCount} —</span>`,
      'flavor',
    );
    const handler = EVENT_HANDLERS[type];
    const tookOverRender = handler(state);
    if (!tookOverRender && state.mode !== 'combat') state.mode = 'event';
  },

  finishRoom(state) {
    const d = state.dungeon,
      cleared = d.currentIndex + 1;
    if (cleared % 2 === 0 && d.roomTypes[d.currentIndex] !== 'boss' && !d.boonMilestones.includes(cleared)) {
      d.boonMilestones.push(cleared);
      this.offerBoonChoices(state);
      return;
    }
    state.ui.choices = [
      {
        label: 'Move deeper →',
        act: (s) => {
          this.enterNextRoom(s);
        },
      },
    ];
    state.mode = 'event';
  },

  offerBoonChoices(state) {
    const owned = new Map(state.dungeon.boons.map((boon) => [boon.baseId || boon.id, boon]));
    const difficultyBonus = state.dungeon.difficulty.boonRarityBonus || 0;
    const affinities = this.lootAffinities(state),
      weaponElement = state.equipment.weapon?.element || 'physical';
    const boonAffinity = (boon) => {
      let weight = 1;
      const effects = boon.effects || [boon.effect].filter(Boolean),
        skill = boon.skill;
      for (const effect of effects) {
        if (effect.type === 'statPercent')
          weight *= 1 + Math.max(0, (affinities[effect.stat] || 1) - 1) * 0.28;
        if (['relentlessEcho', 'overkillSplash', 'reaperSeal', 'counterStrike'].includes(effect.type))
          weight *= 1 + Math.max(0, (affinities.atk || 1) - 1) * 0.18;
        if (['startingWardPct', 'boneShield', 'colossusLaw'].includes(effect.type))
          weight *= 1 + Math.max(0, Math.max(affinities.def || 1, affinities.mdef || 1) - 1) * 0.14;
        if (['manaFlow', 'statusEcho', 'elementStatusPower', 'stormcaller'].includes(effect.type))
          weight *= 1 + Math.max(0, (affinities.matk || 1) - 1) * 0.18;
      }
      if (skill) {
        const favored = skill.magic ? affinities.matk || 1 : affinities.atk || 1;
        weight *= 1 + Math.max(0, favored - 1) * 0.18;
      }
      const element = skill?.forcedElement;
      if (element && element !== 'physical')
        weight *=
          element === weaponElement ? 1.28 : 1 + Math.max(0, (affinities[`${element}Dmg`] || 1) - 1) * 0.35;
      return U.clamp(weight, 0.85, 1.55);
    };
    const pool = DUNGEON_BOONS.flatMap((base) => {
        const currentRank = owned.get(base.id)?.tier || 0;
        return [1, 2, 3].filter((rank) => rank > currentRank).map((rank) => upgradedDungeonBoon(base, rank));
      }).map((boon) => ({ ...boon, buildWeight: boonAffinity(boon) })),
      draft = [];
    while (draft.length < 3 && pool.length) {
      const boon = U.weightedPick(pool, (candidate) => {
        const baseWeight = BOON_POWER_TIERS[candidate.powerTier]?.weight || 1;
        const rarityWeight =
          candidate.powerTier === 'mythic'
            ? baseWeight * (1 + difficultyBonus * 1.4)
            : candidate.powerTier === 'greater'
              ? baseWeight * (1 + difficultyBonus * 0.65)
              : baseWeight / (1 + difficultyBonus * 0.35);
        const currentRank = owned.get(candidate.baseId)?.tier || 0;
        const followsOwnedRank = currentRank > 0 && candidate.tier === currentRank + 1;
        const rankWeight =
          (BOON_RANK_WEIGHTS[candidate.tier] || 0.01) * (followsOwnedRank ? BOON_OWNED_UPGRADE_MULT : 1);
        return rarityWeight * rankWeight * candidate.buildWeight;
      });
      draft.push(boon);
      for (let i = pool.length - 1; i >= 0; i--) if (pool[i].baseId === boon.baseId) pool.splice(i, 1);
    }
    Metrics.boonDraft(state.dungeon.difficultyId, draft);
    state.ui.boonChoices = draft;
    state.ui.choices = draft.map((boon) => ({
      label: `Claim ${boon.name}`,
      act: (s) => {
        const existing = s.dungeon.boons.findIndex((chosen) => (chosen.baseId || chosen.id) === boon.baseId);
        const previousRank = existing >= 0 ? s.dungeon.boons[existing].tier || 1 : 0;
        if (existing >= 0) s.dungeon.boons.splice(existing, 1, boon);
        else s.dungeon.boons.push(boon);
        Metrics.boonClaim(boon, draft, previousRank, s.dungeon.difficultyId);
        s.ui.boonChoices = null;
        this.refreshDerived(s);
        s.player.hp = Math.min(s.player.hp, s.derived.maxHp);
        s.player.mp = Math.min(s.player.mp, s.derived.maxMp);
        this.log(s, `You claim <b>${boon.name}</b>. ${boon.desc}`, 'good');
        this.enterNextRoom(s);
      },
    }));
    state.mode = 'event';
  },

  renderMerchant(state) {
    state.ui.choices = 'merchant';
    state.mode = 'event';
  },
};
