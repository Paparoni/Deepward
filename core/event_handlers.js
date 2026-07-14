/* ============================================================
   EVENT HANDLERS (room content registry)
   Each handler returns { text:[string], choices:[{label, act}] }
   `act(state)` mutates state and returns nothing; UI re-renders after.
   ============================================================ */
const EVENT_HANDLERS = {

  battle(state){
    const dlvl = state.dungeon.dungeonLevel;
    const monsters = Generators.generateBattleGroup(dlvl, state.dungeon.difficulty);
    Engine.log(state, `You round a corner and ${monsters.length>1?'a pack of foes':'a lone foe'} blocks the path: <b>${monsters.map(m=>m.name).join(', ')}</b>.`, 'flavor');
    Engine.startCombat(state, monsters);
    return true; // combat takes over rendering
  },

  chest(state){
    Engine.log(state, `A weathered chest sits half-buried in rubble.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Open the chest', act:(s)=>{ Engine.resolveChest(s); }},
      {label:'Leave it — could be trapped', act:(s)=>{
        Engine.log(s, `You decide it isn't worth the risk and move on.`, 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  merchant(state){
    const dlvl = state.dungeon.dungeonLevel;
    const stock = [1,2,3].map(()=>Generators.generateItem(dlvl, {lootBonus:0}));
    state.ui.merchantStock = stock;
    Engine.log(state, `A hooded merchant has set up a small stall between the pillars. "Something for the journey?"`, 'flavor');
    Engine.renderMerchant(state);
    return true;
  },

  gamble(state){
    Engine.log(state, `A grinning figure crouches over a set of worn bone dice. "Wager some gold?"`, 'flavor');
    const stakes = [10,25,50].filter(s=>s<=state.player.gold+9999);
    const choices = stakes.map(amt=>({
      label:`Wager ${amt} gold`,
      act:(s)=>{
        if(s.player.gold<amt){ Engine.log(s,"You don't have enough gold for that.", 'bad'); Engine.renderCurrentChoices(s); return; }
        s.player.gold -= amt;
        const win = Math.random()<0.47;
        if(win){
          const payout = Math.round(amt*2.1);
          s.player.gold += payout;
          Engine.log(s, `The dice favor you! You win <b>${payout} gold</b>.`, 'good');
        } else {
          Engine.log(s, `The dice betray you. The gold vanishes into the merchant's coat.`, 'bad');
        }
        Engine.finishRoom(s);
      }
    }));
    choices.push({label:'Walk away', act:(s)=>{ Engine.log(s,'You keep your coin and keep moving.', 'flavor'); Engine.finishRoom(s); }});
    Engine.setChoices(state, choices);
    return false;
  },

  trap(state){
    Engine.log(state, `You hear a faint click underfoot — a trap!`, 'bad');
    Engine.setChoices(state, [
      {label:'Try to dodge (uses SPD)', act:(s)=>{
        const chance = U.clamp(40 + s.derived.spd*0.9, 20, 92);
        if(Math.random()*100 < chance){
          Engine.log(s, `You throw yourself clear just in time.`, 'good');
        } else {
          const dmg = Math.round(U.rand(8,16) * (1+s.dungeon.dungeonLevel*0.12));
          s.player.hp = Math.max(1, s.player.hp - dmg);
          Engine.log(s, `The trap catches you — you take <b>${dmg} damage</b>.`, 'bad');
        }
        Engine.finishRoom(s);
      }},
      {label:'Brace and push through', act:(s)=>{
        const dmg = Math.round(U.rand(4,9) * (1+s.dungeon.dungeonLevel*0.12));
        s.player.hp = Math.max(1, s.player.hp - dmg);
        Engine.log(s, `You brace against the wall. It still hurts — <b>${dmg} damage</b> — but you're through.`, 'bad');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  shrine(state){
    Engine.log(state, `A quiet shrine glows faintly, untouched by the dust around it.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Rest at the shrine (restore HP & MP)', act:(s)=>{
        s.player.hp = s.derived.maxHp;
        s.player.mp = s.derived.maxMp;
        Engine.log(s, `Warmth spreads through your limbs. You are fully restored.`, 'good');
        Engine.finishRoom(s);
      }},
      {label:'Leave an offering (small gold cost, minor blessing)', act:(s)=>{
        const cost = Math.min(s.player.gold, 15);
        s.player.gold -= cost;
        s.player.hp = Math.min(s.derived.maxHp, s.player.hp + Math.round(s.derived.maxHp*0.3));
        Engine.log(s, `You leave ${cost} gold. Something unseen nods in approval. Partial healing received.`, 'good');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  mystery(state){
    const flavors = [
      {t:'Faded murals line the walls, depicting a war no living scholar remembers.', choice:'Study the murals', reward:s=>{s.player.gold+=U.randInt(3,10);}, res:'You notice a few coins wedged in a crack.'},
      {t:'A cold draft carries a sound like distant singing.', choice:'Follow the sound', reward:s=>{ s.derived.hitEffTemp=(s.derived.hitEffTemp||0)+2; }, res:'You feel oddly sharpened — your next fight should go smoother.'},
      {t:'An old journal lies open on a stone slab, ink long since dried.', choice:'Read the journal', reward:s=>{ s.player.xp += Math.round(BALANCE.xpToNext(s.player.level)*0.05); Engine.checkLevelUp(s); }, res:'The writing teaches you something useful. Minor experience gained.'},
    ];
    const f = U.pick(flavors);
    Engine.log(state, f.t, 'flavor');
    Engine.setChoices(state, [
      {label:f.choice, act:(s)=>{ f.reward(s); Engine.log(s, f.res, 'good'); Engine.finishRoom(s); }},
      {label:'Ignore it and move on', act:(s)=>{ Engine.log(s,'Curiosity can wait. You press onward.', 'flavor'); Engine.finishRoom(s); }},
    ]);
    return false;
  },

  boss(state){
    const dlvl = state.dungeon.dungeonLevel;
    const monsters = Generators.generateBoss(dlvl, state.dungeon.difficulty);
    Engine.log(state, `The corridor opens into a vast chamber. <b>${monsters[0].name}</b> rises to meet you — ${monsters[0].flavor}.`, 'bad');
    Engine.startCombat(state, monsters, {isBoss:true});
    return true;
  },

  ambush(state){
    const dlvl = state.dungeon.dungeonLevel;
    Engine.log(state, `Shapes peel away from the dark before you're ready — an ambush!`, 'bad');
    Engine.setChoices(state, [
      {label:'Fight through it', act:(s)=>{
        const monsters = Generators.generateBattleGroup(dlvl, s.dungeon.difficulty);
        for(const m of monsters){
          m.atk = Math.round(m.atk*1.2); m.spd = Math.round(m.spd*1.15);
          m.goldDrop = Math.round(m.goldDrop*1.35); m.xpDrop = Math.round(m.xpDrop*1.35);
        }
        Engine.log(s, `Caught off guard, <b>${monsters.map(m=>m.name).join(', ')}</b> close in fast — they hit harder than usual, but carry better spoils.`, 'bad');
        Engine.startCombat(s, monsters);
      }},
    ]);
    return false;
  },

  archive(state){
    Engine.log(state, `Shelves of collapsed stone hold what might once have been scrolls. Most have rotted to dust — but not all.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Study the surviving texts (uses time, grants XP)', act:(s)=>{
        const xp = Math.round(BALANCE.xpToNext(s.player.level)*0.09);
        s.player.xp += xp;
        Engine.checkLevelUp(s);
        Engine.log(s, `Dense, careful notes teach you something real. You gain <b>${xp} XP</b>.`, 'good');
        Engine.finishRoom(s);
      }},
      {label:'Search for a hidden cache instead', act:(s)=>{
        if(Math.random()<0.5){
          const gold = U.randInt(15,40);
          s.player.gold += gold;
          Engine.log(s, `Tucked behind a false panel: <b>${gold} gold</b>.`, 'good');
        } else {
          Engine.log(s, `Just dust and silence. Nothing here.`, 'flavor');
        }
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  wishing_well(state){
    Engine.log(state, `A well sinks into darkness, coins glinting faintly on its rim. It feels like it is owed something.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Toss in a coin (10 gold, uncertain fortune)', act:(s)=>{
        if(s.player.gold<10){ Engine.log(s,"You don't have enough gold for that.", 'bad'); Engine.renderCurrentChoices(s); return; }
        s.player.gold -= 10;
        const roll = Math.random();
        if(roll<0.4){
          const heal = Math.round(s.derived.maxHp*0.35);
          s.player.hp = Math.min(s.derived.maxHp, s.player.hp+heal);
          Engine.log(s, `Warm water rises around your hand. You recover <b>${heal} HP</b>.`, 'good');
        } else if(roll<0.75){
          const gold = U.randInt(20,45);
          s.player.gold += gold;
          Engine.log(s, `Something bright surfaces and you scoop it out: <b>${gold} gold</b>.`, 'good');
        } else {
          Engine.log(s, `The coin sinks. Nothing answers.`, 'flavor');
        }
        Engine.finishRoom(s);
      }},
      {label:'Leave the well undisturbed', act:(s)=>{
        Engine.log(s,'Some debts aren\'t worth incurring. You move on.', 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  collapse(state){
    Engine.log(state, `The passage ahead has caved in. A narrow gap remains — and a longer way around.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Squeeze through the gap (uses SPD, risk of injury)', act:(s)=>{
        const chance = U.clamp(45 + s.derived.spd*1.1, 25, 95);
        if(Math.random()*100 < chance){
          Engine.log(s, `You slip through without a scratch, saving time.`, 'good');
        } else {
          const dmg = Math.round(U.rand(5,12) * (1+s.dungeon.dungeonLevel*0.1));
          s.player.hp = Math.max(1, s.player.hp - dmg);
          Engine.log(s, `Loose stone catches you on the way through — <b>${dmg} damage</b>.`, 'bad');
        }
        Engine.finishRoom(s);
      }},
      {label:'Take the long way around (safe, no risk)', act:(s)=>{
        Engine.log(s, `Slower, but safe. You find your way through.`, 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  wandering_healer(state){
    Engine.log(state, `A robed figure tends a small fire, humming something old. "Wounds, traveler? I can mend what's mendable."`, 'flavor');
    const cost = Math.round(12 + state.dungeon.dungeonLevel*1.5);
    Engine.setChoices(state, [
      {label:`Pay ${cost} gold for a full restoration`, act:(s)=>{
        if(s.player.gold<cost){ Engine.log(s,"You don't have enough gold for that.", 'bad'); Engine.renderCurrentChoices(s); return; }
        s.player.gold -= cost;
        s.player.hp = s.derived.maxHp;
        s.player.mp = s.derived.maxMp;
        Engine.log(s, `The healer's hands are sure and warm. You are fully restored.`, 'good');
        Engine.finishRoom(s);
      }},
      {label:'Accept a free, partial blessing instead', act:(s)=>{
        const heal = Math.round(s.derived.maxHp*0.2);
        s.player.hp = Math.min(s.derived.maxHp, s.player.hp+heal);
        Engine.log(s, `"On the house." A small warmth spreads through you. Recovered <b>${heal} HP</b>.`, 'good');
        Engine.finishRoom(s);
      }},
      {label:'Decline and move on', act:(s)=>{
        Engine.log(s,'You thank them and continue into the dark.', 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  cursed_altar(state){
    Engine.log(state, `A black altar hums with old, hungry power. It offers strength — for a price.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Make the pact (+30% ATK & MATK, -15% max HP for the rest of this dungeon)', act:(s)=>{
        if(s.dungeon._altarPact){ Engine.log(s, `The altar has nothing left to offer you.`, 'flavor'); Engine.finishRoom(s); return; }
        s.dungeon._altarPact = true;
        Engine.refreshDerived(s);
        s.player.hp = Math.min(s.player.hp, s.derived.maxHp);
        Engine.log(s, `Power floods your limbs — cold, eager, not entirely yours. You feel stronger, and thinner for it.`, 'bad');
        Engine.finishRoom(s);
      }},
      {label:'Refuse and step back', act:(s)=>{
        Engine.log(s, `Some power isn't worth what it asks. You leave the altar cold and silent.`, 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  bonfire(state){
    Engine.log(state, `A dying campfire still smolders in a side chamber — abandoned, but not cold. There's time to prepare here.`, 'flavor');
    const dlvl = state.dungeon.dungeonLevel;
    const boosts = [
      {stat:'atk', flat: Math.round(3+dlvl*0.6), label:'Sharpen your blade'},
      {stat:'def', flat: Math.round(3+dlvl*0.6), label:'Reinforce your guard'},
      {stat:'spd', flat: Math.round(2+dlvl*0.4), label:'Stretch and steady your footing'},
    ];
    const choices = boosts.map(b=>({
      label:`${b.label} (+${b.flat} ${STAT_BY_ID[b.stat].short} for the dungeon)`,
      act:(s)=>{
        s.dungeon._buffs = s.dungeon._buffs || [];
        s.dungeon._buffs.push({stat:b.stat, flat:b.flat});
        Engine.refreshDerived(s);
        Engine.log(s, `The preparation settles into your bones. <b>+${b.flat} ${STAT_BY_ID[b.stat].short}</b> for the rest of this dungeon.`, 'good');
        Engine.finishRoom(s);
      }
    }));
    choices.push({label:'Rest instead (restore some HP & MP)', act:(s)=>{
      const healHp = Math.round(s.derived.maxHp*0.25);
      const healMp = Math.round(s.derived.maxMp*0.25);
      s.player.hp = Math.min(s.derived.maxHp, s.player.hp+healHp);
      s.player.mp = Math.min(s.derived.maxMp, s.player.mp+healMp);
      Engine.log(s, `You rest a while by the embers. Recovered <b>${healHp} HP</b> and <b>${healMp} MP</b>.`, 'good');
      Engine.finishRoom(s);
    }});
    Engine.setChoices(state, choices);
    return false;
  },

  black_market(state){
    Engine.log(state, `A hooded stranger crouches beside a case of curious reagents. "Materials, traveler — if the price is right."`, 'flavor');
    const dlvl = state.dungeon.dungeonLevel;
    const offers = [1,2,3].map(()=>U.pick(CRAFTING_MATERIALS));
    const choices = offers.map(mat=>{
      const price = Math.round(14 + dlvl*1.8);
      return {label:`Buy ${mat.name} — ${price} gold`, act:(s)=>{
        if(s.player.gold<price){ Engine.log(s,"You don't have enough gold for that.", 'bad'); Engine.renderCurrentChoices(s); return; }
        s.player.gold -= price;
        Engine.grantMaterial(s, mat.id);
        Engine.log(s, `The stranger hands over a <b>${mat.name}</b>, wrapped in cloth.`, 'good');
        Engine.finishRoom(s);
      }};
    });
    choices.push({label:'Decline and move on', act:(s)=>{
      Engine.log(s, 'You keep your coin. The stranger shrugs and fades back into the dark.', 'flavor');
      Engine.finishRoom(s);
    }});
    Engine.setChoices(state, choices);
    return false;
  },

  puzzle_door(state){
    Engine.log(state, `An ancient lock covered in shifting runes bars the way forward. The pattern feels almost readable.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Study the pattern (uses HIT EFF)', act:(s)=>{
        const chance = U.clamp(35 + s.derived.hitEff*1.1, 20, 90);
        if(Math.random()*100 < chance){
          const item = Generators.generateItem(s.dungeon.dungeonLevel, {lootBonus:s.dungeon.difficulty.lootBonus, forcedMinTier:'uncommon'});
          Engine.log(s, `The runes click into place. A hidden compartment slides open.`, 'good');
          Engine.presentItemDrop(s, item, (s2)=>{ Engine.finishRoom(s2); });
        } else {
          Engine.log(s, `The runes flare red — a hidden ward triggers!`, 'bad');
          const monsters = Generators.generateBattleGroup(s.dungeon.dungeonLevel, s.dungeon.difficulty);
          Engine.log(s, `<b>${monsters.map(m=>m.name).join(', ')}</b> spill from a concealed alcove.`, 'bad');
          Engine.startCombat(s, monsters);
        }
      }},
      {label:'Force it open (guaranteed, minor damage)', act:(s)=>{
        const dmg = Math.round(U.rand(6,13) * (1+s.dungeon.dungeonLevel*0.1));
        s.player.hp = Math.max(1, s.player.hp - dmg);
        Engine.log(s, `You wrench it open by force. It gives way, but not gently — <b>${dmg} damage</b>.`, 'bad');
        Engine.finishRoom(s);
      }},
      {label:'Leave the door sealed', act:(s)=>{
        Engine.log(s, 'Some locks are best left closed. You move on.', 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  foraging(state){
    Engine.log(state, `Clusters of luminous fungus and mineral veins glint along the walls — worth harvesting.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Harvest carefully', act:(s)=>{
        const mat1 = U.pick(CRAFTING_MATERIALS);
        Engine.grantMaterial(s, mat1.id);
        let msg = `You carefully extract <b>${mat1.name}</b>.`;
        if(Math.random()<0.35){
          const mat2 = U.pick(CRAFTING_MATERIALS);
          Engine.grantMaterial(s, mat2.id);
          msg += ` A second vein yields <b>${mat2.name}</b> too.`;
        }
        Engine.log(s, msg, 'good');
        Engine.finishRoom(s);
      }},
      {label:'Skip it and move on', act:(s)=>{
        Engine.log(s, 'Not worth the time. You press onward.', 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  guarded_cache(state){
    const dlvl = state.dungeon.dungeonLevel;
    Engine.log(state, `A reinforced cache sits behind a sealed grate — and something is already curled up beside it.`, 'bad');
    const monsters = Generators.generateBattleGroup(dlvl, state.dungeon.difficulty);
    for(const m of monsters){ m.def = Math.round(m.def*1.15); m.mdef = Math.round(m.mdef*1.15); m.hp = Math.round(m.hp*1.15); m.maxHp = m.hp; }
    Engine.log(state, `<b>${monsters.map(m=>m.name).join(', ')}</b> guards the cache fiercely — better loot if you can take it down.`, 'bad');
    Engine.startCombat(state, monsters, {bonusLoot:true});
    return true;
  },

  deep_pool(state){
    Engine.log(state, `A still black pool reflects no light, though torches burn all around it.`, 'flavor');
    Engine.setChoices(state, [
      {label:'Drink from the pool', act:(s)=>{
        const roll = Math.random();
        if(roll<0.35){
          const heal = Math.round(s.derived.maxHp*0.4);
          s.player.hp = Math.min(s.derived.maxHp, s.player.hp+heal);
          Engine.log(s, `The water is impossibly cold and impossibly clean. You recover <b>${heal} HP</b>.`, 'good');
        } else if(roll<0.55){
          const dmg = Math.round(U.rand(5,11) * (1+s.dungeon.dungeonLevel*0.08));
          s.player.hp = Math.max(1, s.player.hp-dmg);
          Engine.log(s, `Something in the water disagrees with you — <b>${dmg} damage</b>.`, 'bad');
        } else if(roll<0.8){
          const stat = Math.random()<0.5 ? 'atk' : 'matk';
          const flat = Math.round(2+s.dungeon.dungeonLevel*0.4);
          s.dungeon._buffs = s.dungeon._buffs || [];
          s.dungeon._buffs.push({stat, flat});
          Engine.refreshDerived(s);
          Engine.log(s, `Strength you don't recognize floods your limbs. <b>+${flat} ${STAT_BY_ID[stat].short}</b> for the rest of this dungeon.`, 'good');
        } else {
          Engine.log(s, `Nothing happens. The water is only water, this time.`, 'flavor');
        }
        Engine.finishRoom(s);
      }},
      {label:"Search the pool's edge instead", act:(s)=>{
        if(Math.random()<0.5){
          const gold = U.randInt(15,40);
          s.player.gold += gold;
          Engine.log(s, `Something catches the torchlight in the shallows: <b>${gold} gold</b>.`, 'good');
        } else {
          Engine.log(s, `Just wet stone. Nothing here.`, 'flavor');
        }
        Engine.finishRoom(s);
      }},
      {label:'Leave it undisturbed', act:(s)=>{
        Engine.log(s, 'You give the pool a wide berth.', 'flavor');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },

  abandoned_camp(state){
    Engine.log(state, `The ashes of a cold campfire surround a pack that its owner never came back for.`, 'flavor');
    Engine.setChoices(state, [
      {label:"Search the delver's pack (find their gear)", act:(s)=>{
        const item = Generators.generateItem(s.dungeon.dungeonLevel, {lootBonus:s.dungeon.difficulty.lootBonus, forcedMinTier: Math.random()<0.5?'common':'uncommon'});
        Engine.log(s, `Whatever happened to them, they left something behind.`, 'flavor');
        Engine.presentItemDrop(s, item, (s2)=>{ Engine.finishRoom(s2); });
      }},
      {label:'Take supplies instead (small heal + material)', act:(s)=>{
        const heal = Math.round(s.derived.maxHp*0.15);
        s.player.hp = Math.min(s.derived.maxHp, s.player.hp+heal);
        const mat = U.pick(CRAFTING_MATERIALS);
        Engine.grantMaterial(s, mat.id);
        Engine.log(s, `You patch yourself up (+${heal} HP) and pocket a <b>${mat.name}</b>.`, 'good');
        Engine.finishRoom(s);
      }},
    ]);
    return false;
  },
};
