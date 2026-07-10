// -- rarity tiers -------------------------------------------------------------
const TIERS = [
  {id:'common',           name:'Common',           color:'var(--t-common)',    statCount:1, uniqueTraits:0, mythicTraits:0, mult:1.00, weight:100},
  {id:'uncommon',         name:'Uncommon',         color:'var(--t-uncommon)',  statCount:2, uniqueTraits:0, mythicTraits:0, mult:1.30, weight:55},
  {id:'rare',             name:'Rare',             color:'var(--t-rare)',      statCount:3, uniqueTraits:0, mythicTraits:0, mult:1.70, weight:26},
  {id:'ultra_rare',       name:'Ultra Rare',       color:'var(--t-ultra)',     statCount:4, uniqueTraits:0, mythicTraits:0, mult:2.20, weight:11},
  {id:'unique',           name:'Unique',           color:'var(--t-unique)',    statCount:4, uniqueTraits:1, mythicTraits:0, mult:2.80, weight:5},
  {id:'legendary',        name:'Legendary',        color:'var(--t-legendary)', statCount:5, uniqueTraits:2, mythicTraits:0, mult:3.60, weight:1.6},
  {id:'mythic_legendary', name:'Mythic Legendary', color:'var(--t-mythic1)',   statCount:5, uniqueTraits:2, mythicTraits:1, mult:4.80, weight:0.28},
];
const TIER_BY_ID = Object.fromEntries(TIERS.map(t=>[t.id,t]));

// -- gear slots ----------------------------------------------------------------
const SLOTS = [
  {id:'weapon',      label:'Weapon',       group:'weapon',    primary:['atk','matk']},
  {id:'helmet',      label:'Helmet',       group:'armor',     primary:['def','mdef']},
  {id:'chest',       label:'Chest Armor',  group:'armor',     primary:['def','hitRes']},
  {id:'legs',        label:'Leg Armor',    group:'armor',     primary:['def','spd']},
  {id:'arms',        label:'Arm Guards',   group:'armor',     primary:['atk','def']},
  {id:'offhand',     label:'Off-Hand',     group:'weapon',    primary:['def','mdef']},
  {id:'boots',       label:'Boots',        group:'armor',     primary:['spd','hitEff']},
  {id:'accessory1',  label:'Accessory',    group:'accessory', primary:null},
  {id:'accessory2',  label:'Accessory',    group:'accessory', primary:null},
  {id:'artifact',    label:'Artifact',     group:'artifact',  primary:null, rareSlot:true},
];
