// -- dungeon themes ---------------------------------------------------------------
const DUNGEON_THEMES = [
  {id:'crypt',    name:'The Sunken Crypt',      icon:'⚰️', desc:'Damp stone corridors thick with the smell of old bones.'},
  {id:'warren',   name:'The Goblin Warren',     icon:'🪓', desc:'Crude tunnels, torch smoke, and the barking of raiders.'},
  {id:'cavern',   name:'The Frozen Cavern',     icon:'🧊', desc:'Ice-slick passages that groan under their own weight.'},
  {id:'foundry',  name:'The Ember Foundry',     icon:'🔥', desc:'Abandoned forges still glowing faintly in the dark.'},
  {id:'sanctum',  name:'The Shadow Sanctum',    icon:'🕯️', desc:'A temple to something the wall-carvings refuse to name.'},
  {id:'web',      name:'The Sunken Web',        icon:'🕸️', desc:'Silk curtains hang between pillars swallowed by roots.'},
];

// -- name flavor parts --------------------------------------------------------------
const NAME_PARTS = {
  prefixByTier: {
    common: ['Worn','Plain','Dull','Simple','Chipped'],
    uncommon: ['Sturdy','Honed','Reinforced','Sound','Weighted'],
    rare: ['Gleaming','Runed','Tempered','Warded','Etched'],
    ultra_rare: ['Radiant','Blessed','Storm-forged','Deepcut','Resonant'],
    unique: ['Whispering','Bloodbound','Sundered','Hollowed','Grave-Kissed'],
    legendary: ['Godless','Worldsplitter','Ashborn','Eternal','Skybreaker'],
    mythic_legendary: ['Reality-Torn','Apocalyptic','Star-Eaten','Doomcaller','Worldsend'],
  },
  nounBySlot: {
    weapon: ['Blade','Cleaver','Fang','Warhammer','Scepter','Dagger','Maul','Glaive'],
    helmet: ['Circlet','Greathelm','Hood','Faceguard','Diadem'],
    chest:  ['Cuirass','Hauberk','Robe','Breastplate','Vestment'],
    legs:   ['Greaves','Legwraps','Cuisses','Chausses'],
    arms:   ['Vambraces','Gauntlets','Bracers','Cuffs'],
    accessory1: ['Ring','Talisman','Charm','Sigil','Amulet'],
    accessory2: ['Ring','Talisman','Charm','Sigil','Amulet'],
    artifact: ['Relic','Idol','Shard','Core','Reliquary'],
  },
  // suffixes only appear on Unique tier and above, to make top-end drops feel distinct
  suffixes: [
    'of the Hollow King', 'of Ember Wraiths', 'of the Last Vigil', 'of the Drowned Choir',
    'of Undying Frost', 'of the Void Between', 'of the Forgotten Star', 'of Widows Grief',
    'of the Silent Chorus', 'of the Ashen Throne',
  ],
};
