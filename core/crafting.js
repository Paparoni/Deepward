const CRAFTING_MATERIALS = [
  ['void_amber', 'Void Amber'],
  ['wyrm_scale', 'Wyrm Scale'],
  ['starsteel', 'Starsteel Ingot'],
  ['ember_heart', 'Ember Heart'],
  ['frost_bloom', 'Frost Bloom'],
  ['storm_core', 'Storm Core'],
  ['venom_gland', 'Venom Gland'],
  ['sunshard', 'Sunshard'],
  ['grave_ash', 'Grave Ash'],
  ['titan_bone', 'Titan Bone'],
  ['moon_silk', 'Moon Silk'],
  ['obsidian', 'Obsidian Shard'],
  ['leviathan_ink', 'Leviathan Ink'],
  ['phoenix_feather', 'Phoenix Feather'],
  ['runic_circuit', 'Runic Circuit'],
  ['echo_crystal', 'Echo Crystal'],
  ['ashglass', 'Ashglass'],
  ['shadow_thread', 'Shadow Thread'],
  ['gilded_fang', 'Gilded Fang'],
  ['celestial_ore', 'Celestial Ore'],
  ['black_lotus', 'Black Lotus'],
  ['ancient_bark', 'Ancient Bark'],
  ['rift_splinter', 'Rift Splinter'],
  ['king_sap', 'Kingsap Resin'],
  ['rusted_core', 'Rusted Core'],
  ['plague_ichor', 'Plague Ichor'],
  ['ashen_relic', 'Ashen Reliquary Dust'],
  ['drowned_pearl', 'Drowned Pearl'],
  ['nightloom_silk', 'Nightloom Silk'],
  ['reliquary_gold', 'Reliquary Gold'],
  ['starglass', 'Starglass Shard'],
  ['boneknit_thread', 'Boneknit Thread'],
].map(([id, name]) => ({ id, name }));
const MATERIAL_BY_ID = Object.fromEntries(CRAFTING_MATERIALS.map((m) => [m.id, m]));

const MYTHIC_RECIPES = [
  {
    id: 'worldsplitter',
    name: 'Worldsplitter',
    slot: 'weapon',
    element: 'physical',
    mythicTrait: 'soulforge_fury',
    uniqueTraits: ['crit_dmg', 'giant_slayer'],
    requirements: { starsteel: 6, titan_bone: 3, void_amber: 2 },
    stats: { atk: 29, def: 9, hitEff: 9, physicalDmg: 14, hitRes: 8 },
  },
  {
    id: 'dawnkeep',
    name: 'Dawnkeep Visor',
    slot: 'helmet',
    element: 'holy',
    mythicTrait: 'dawnward',
    uniqueTraits: ['regen', 'thorns'],
    requirements: { sunshard: 6, celestial_ore: 4, ancient_bark: 2 },
    stats: { def: 19, mdef: 15, hitRes: 10, holyDmg: 15, spd: 5 },
  },
  {
    id: 'stormveil',
    name: 'Stormveil Mantle',
    slot: 'chest',
    element: 'lightning',
    mythicTrait: 'tempest_step',
    uniqueTraits: ['dodge', 'crit_chance'],
    requirements: { storm_core: 5, moon_silk: 4, runic_circuit: 3 },
    stats: { def: 18, mdef: 16, spd: 11, lightningDmg: 16, hitEff: 7 },
  },
  {
    id: 'mourning',
    name: 'Mourning Covenant',
    slot: 'accessory1',
    element: 'dark',
    mythicTrait: 'grave_pact',
    uniqueTraits: ['lifesteal', 'mana_eff'],
    requirements: { grave_ash: 6, shadow_thread: 4, void_amber: 2 },
    stats: { matk: 24, mdef: 12, darkDmg: 18, hitRes: 8, spd: 6 },
  },
  {
    id: 'basilisk',
    name: 'Basilisk Signet',
    slot: 'accessory1',
    element: 'poison',
    mythicTrait: 'plague_crown',
    uniqueTraits: ['stun_chance', 'double_hit'],
    requirements: { venom_gland: 6, black_lotus: 3, gilded_fang: 3 },
    stats: { atk: 20, matk: 20, poisonDmg: 19, hitEff: 10, spd: 7 },
  },
  {
    id: 'phoenix',
    name: 'Phoenix-Heart Greaves',
    slot: 'legs',
    element: 'fire',
    mythicTrait: 'phoenix_ward',
    uniqueTraits: ['regen', 'vengeful'],
    requirements: { phoenix_feather: 4, ember_heart: 6, ashglass: 3 },
    stats: { def: 17, spd: 12, fireDmg: 18, atk: 14, mdef: 10 },
  },
  {
    id: 'riftsong',
    name: 'Riftsong Blade',
    slot: 'weapon',
    element: 'ice',
    mythicTrait: 'riftsong',
    uniqueTraits: ['crit_chance', 'piercing'],
    requirements: { rift_splinter: 5, echo_crystal: 4, frost_bloom: 5 },
    stats: { atk: 27, matk: 18, iceDmg: 19, spd: 9, hitEff: 9 },
  },
  {
    id: 'colossus',
    name: 'Colossus Armguards',
    slot: 'arms',
    element: 'physical',
    mythicTrait: 'titan_oath',
    uniqueTraits: ['thorns', 'second_wind'],
    requirements: { titan_bone: 5, obsidian: 5, king_sap: 3 },
    stats: { def: 22, mdef: 14, atk: 16, hitRes: 11, physicalDmg: 11 },
  },
  {
    id: 'abyssal',
    name: 'Abyssal Reliquary',
    slot: 'artifact',
    element: 'dark',
    mythicTrait: 'void_hunger',
    uniqueTraits: ['xp_bonus', 'gold_find'],
    requirements: { leviathan_ink: 4, void_amber: 5, echo_crystal: 3 },
    stats: { matk: 25, atk: 18, darkDmg: 20, hitEff: 9, hitRes: 9 },
  },
  {
    id: 'reaper',
    name: "Reaper's Compass",
    slot: 'accessory1',
    element: 'poison',
    mythicTrait: 'reaper_seal',
    uniqueTraits: ['crit_dmg', 'giant_slayer'],
    requirements: { gilded_fang: 4, black_lotus: 5, grave_ash: 4 },
    stats: { atk: 21, matk: 21, poisonDmg: 17, hitEff: 10, spd: 8 },
  },
  {
    id: 'voidwrought',
    name: 'Voidwrought Sabatons',
    slot: 'boots',
    element: 'lightning',
    mythicTrait: 'voidwrought_haste',
    uniqueTraits: ['dodge', 'double_hit'],
    requirements: { rusted_core: 5, runic_circuit: 4, starglass: 3 },
    stats: { spd: 17, hitEff: 11, lightningDmg: 13, def: 9, atk: 8 },
  },
  {
    id: 'ember_hearth',
    name: 'Ember Hearth Buckler',
    slot: 'offhand',
    element: 'fire',
    mythicTrait: 'ember_communion',
    uniqueTraits: ['regen', 'thorns'],
    requirements: { ember_heart: 5, ashen_relic: 4, phoenix_feather: 3 },
    stats: { def: 20, mdef: 13, fireDmg: 12, hitRes: 9, atk: 7 },
  },
  {
    id: 'frostbite',
    name: 'Frostbite Greatplate',
    slot: 'chest',
    element: 'ice',
    mythicTrait: 'frostbite_ward',
    uniqueTraits: ['piercing', 'crit_chance'],
    requirements: { frost_bloom: 6, drowned_pearl: 4, obsidian: 3 },
    stats: { def: 21, mdef: 14, iceDmg: 15, spd: 6, hitRes: 8 },
  },
  {
    id: 'stormcaller',
    name: "Stormcaller's Circlet",
    slot: 'helmet',
    element: 'lightning',
    mythicTrait: 'stormcaller_pact',
    uniqueTraits: ['mana_eff', 'xp_bonus'],
    requirements: { storm_core: 6, reliquary_gold: 3, nightloom_silk: 4 },
    stats: { matk: 23, mdef: 12, lightningDmg: 16, hitEff: 9, spd: 6 },
  },
];
const RECIPE_BY_ID = Object.fromEntries(MYTHIC_RECIPES.map((recipe) => [recipe.id, recipe]));

const Crafting = {
  canCraft(state, recipe) {
    return (
      state.player.recipes.includes(recipe.id) &&
      Object.entries(recipe.requirements).every(
        ([material, count]) => (state.player.materials[material] || 0) >= count,
      )
    );
  },

  createItem(recipe, level) {
    const scaleStat = (stat, value) => Math.round(value + level * (stat.endsWith('Dmg') ? 0.7 : 1.25));
    const trait = (definition) => {
      const value = Math.round((definition.base + definition.perLvl * level) * 10) / 10;
      return { ...definition, value, desc: definition.desc(value) };
    };
    const slot = SLOTS.find((s) => s.id === recipe.slot);
    return {
      uid: U.uid(),
      name: recipe.name,
      slot: recipe.slot,
      slotLabel: slot.label,
      tier: 'mythic_legendary',
      ilvl: level,
      crafted: true,
      element: recipe.element,
      stats: Object.fromEntries(
        Object.entries(recipe.stats).map(([stat, value]) => [stat, scaleStat(stat, value)]),
      ),
      uniqueTraits: recipe.uniqueTraits.map((id) => trait(UNIQUE_TRAITS.find((entry) => entry.id === id))),
      mythicTrait: trait(CRAFTED_MYTHIC_TRAITS.find((entry) => entry.id === recipe.mythicTrait)),
    };
  },

  craft(state, recipeId) {
    const recipe = RECIPE_BY_ID[recipeId];
    if (!recipe || !this.canCraft(state, recipe)) return false;
    for (const [material, count] of Object.entries(recipe.requirements))
      state.player.materials[material] -= count;
    const item = this.createItem(recipe, Math.max(1, state.player.level));
    Engine.grantItem(state, item);
    Engine.log(
      state,
      `The Soulforge creates <b style="color:${TIER_BY_ID[item.tier].color}">${item.name}</b>.`,
      'good',
    );
    return true;
  },
};
