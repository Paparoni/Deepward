/* ============================================================
   GAME STATE + BOOTSTRAP
   ============================================================ */
let STATE = null;
let PENDING_CLASS = CLASSES[0].id;

function newGame(name, classId){
  const player = {name, classId, level:1, xp:0, gold:40, hp:1, mp:1, skillPoints:3, unlockedSkills:[], recipes:[], materials:{}, skillCooldowns:{}};
  const equipment = {
    weapon: Generators.generateItem(1, {forcedSlot:'weapon', forcedTier:'common'}),
    helmet:null, chest: Generators.generateItem(1, {forcedSlot:'chest', forcedTier:'common'}),
    legs:null, arms:null, offhand:null, boots:null, accessory1:null, accessory2:null, artifact:null,
  };
  const state = {
    screen:'town', player, equipment, inventory:[], dungeon:null, mode:'explore',
    combat:null, log:[], settings:{combatPace:'normal',reduceMotion:false}, ui:{choices:null, invOpen:false, skillsOpen:false, craftOpen:false, characterOpen:false,systemOpen:false,merchantStock:null, pendingItem:null, slotOverlay:null},
  };
  Engine.refreshDerived(state);
  state.player.hp = state.derived.maxHp;
  state.player.mp = state.derived.maxMp;
  STATE = state;
  render();
}

function descend(difficultyId){
  const s = STATE;
  Metrics.dungeonStarted(difficultyId);
  s.player._revivedThisDungeon = false;
  s.dungeon = Generators.generateDungeon(s.player.level, difficultyId);
  s.screen='dungeon';
  s.player.hp = s.derived.maxHp; s.player.mp = s.derived.maxMp;
  Engine.enterNextRoom(s);
  render();
}

function returnToTown(){
  STATE.screen='town';
  STATE.dungeon=null;
  STATE.mode='explore';
  STATE.player.hp = STATE.derived.maxHp;
  STATE.player.mp = STATE.derived.maxMp;
  render();
}
