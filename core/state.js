let STATE = null;
let PENDING_CLASS = CLASSES[0].id;
const TOWN_BLESSINGS = [
  {
    id: 'valor',
    name: "Martyr's Valor",
    desc: '+15% ATK and MATK next dungeon.',
    playerPct: { atk: 15, matk: 15 },
  },
  {
    id: 'aegis',
    name: 'Sainted Aegis',
    desc: '+18% DEF and MDEF next dungeon.',
    playerPct: { def: 18, mdef: 18 },
  },
  { id: 'pilgrim', name: "Pilgrim's Haste", desc: '+16% SPD next dungeon.', playerPct: { spd: 16 } },
  { id: 'vitality', name: 'Litany of Vitality', desc: '+22% maximum HP next dungeon.', maxHpMult: 1.22 },
  {
    id: 'wellspring',
    name: 'Hymn of the Wellspring',
    desc: '+25% maximum MP next dungeon.',
    maxMpMult: 1.25,
  },
  { id: 'providence', name: 'Providence', desc: 'Better gear rarity next dungeon.', lootBonus: 0.28 },
];
function restockTown(state) {
  state.town ||= {};
  state.town.merchantStock = Array.from({ length: 5 }, () =>
    Generators.generateItem(state.player.level, {
      lootBonus: 0.18,
      affinities: Engine.lootAffinities(state),
    }),
  );
}

function newGame(name, classId) {
  const player = {
    name,
    classId,
    level: 1,
    xp: 0,
    gold: 40,
    hp: 1,
    mp: 1,
    skillPoints: 3,
    unlockedSkills: [],
    recipes: [],
    materials: {},
    skillCooldowns: {},
  };
  const equipment = {
    weapon: Generators.generateItem(1, {
      forcedSlot: 'weapon',
      forcedTier: 'common',
    }),
    helmet: null,
    chest: Generators.generateItem(1, {
      forcedSlot: 'chest',
      forcedTier: 'common',
    }),
    legs: null,
    arms: null,
    offhand: null,
    boots: null,
    accessory1: null,
    accessory2: null,
    artifact: null,
  };
  const state = {
    screen: 'town',
    player,
    equipment,
    inventory: [],
    town: { merchantStock: [], blessing: null, descents: 0 },
    dungeon: null,
    mode: 'explore',
    combat: null,
    log: [],
    settings: { combatPace: 'normal', reduceMotion: false },
    ui: {
      choices: null,
      invOpen: false,
      skillsOpen: false,
      craftOpen: false,
      characterOpen: false,
      systemOpen: false,
      merchantStock: null,
      pendingItem: null,
      slotOverlay: null,
      townView: 'square',
    },
  };
  restockTown(state);
  Engine.refreshDerived(state);
  state.player.hp = state.derived.maxHp;
  state.player.mp = state.derived.maxMp;
  STATE = state;
  render();
}

function descend(difficultyId) {
  const s = STATE;
  Metrics.dungeonStarted(difficultyId);
  s.player._revivedThisDungeon = false;
  s.dungeon = Generators.generateDungeon(s.player.level, difficultyId);
  if (s.town?.blessing) {
    s.dungeon.blessing = s.town.blessing;
    s.town.blessing = null;
  }
  s.town.descents = (s.town.descents || 0) + 1;
  restockTown(s);
  s.screen = 'dungeon';
  Engine.refreshDerived(s);
  s.player.hp = s.derived.maxHp;
  s.player.mp = s.derived.maxMp;
  for (const law of s.dungeon.mutators || []) {
    Engine.log(s, `<b>Depth Law — ${law.name}:</b> ${law.desc}`, 'flavor');
    Metrics.count('dungeonMutators', law.id);
  }
  Engine.enterNextRoom(s);
  render();
}

function returnToTown() {
  STATE.screen = 'town';
  STATE.dungeon = null;
  STATE.mode = 'explore';
  Engine.refreshDerived(STATE);
  STATE.player.hp = STATE.derived.maxHp;
  STATE.player.mp = STATE.derived.maxMp;
  render();
}
