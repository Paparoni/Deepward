/* ============================================================
   [3] EVENT HANDLERS (room content registry)
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
      {label:'Open the chest', act:(s)=>{
        const item = Generators.generateItem(s.dungeon.dungeonLevel, {lootBonus:s.dungeon.difficulty.lootBonus});
        Engine.log(s, `Inside you find something.`, 'flavor');
        Engine.presentItemDrop(s, item, (s2)=>{ Engine.finishRoom(s2); });
      }},
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
  }
};
