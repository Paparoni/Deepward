// -- rarity tiers -------------------------------------------------------------
// statCount now strictly increases tier-over-tier (old table tied ultra_rare/unique
// at 4 and legendary/mythic at 5, so those pairs didn't feel different). rollRange
// both narrows and shifts upward with tier, so a higher tier's *floor* roll tends to
// beat a lower tier's *ceiling* roll — not just "more stats" but "better stats".
// traitValueMult scales unique/mythic trait magnitudes so a Legendary's traits hit
// harder than a Unique's, and a Mythic's harder still, at the same item level.
const TIERS = [
  {id:'common',           name:'Common',           color:'var(--t-common)',    statCount:1, uniqueTraits:0, mythicTraits:0, mult:1.00, weight:100,  rollRange:[0.90,1.08], traitValueMult:1.00},
  {id:'uncommon',         name:'Uncommon',         color:'var(--t-uncommon)',  statCount:2, uniqueTraits:0, mythicTraits:0, mult:1.38, weight:55,   rollRange:[0.94,1.12], traitValueMult:1.00},
  {id:'rare',             name:'Rare',             color:'var(--t-rare)',      statCount:3, uniqueTraits:0, mythicTraits:0, mult:1.88, weight:26,   rollRange:[0.98,1.16], traitValueMult:1.00},
  {id:'ultra_rare',       name:'Ultra Rare',       color:'var(--t-ultra)',     statCount:4, uniqueTraits:0, mythicTraits:0, mult:2.52, weight:11,   rollRange:[1.02,1.20], traitValueMult:1.00},
  {id:'unique',           name:'Unique',           color:'var(--t-unique)',    statCount:5, uniqueTraits:1, mythicTraits:0, mult:3.32, weight:5,    rollRange:[1.06,1.24], traitValueMult:1.00},
  {id:'legendary',        name:'Legendary',        color:'var(--t-legendary)', statCount:6, uniqueTraits:2, mythicTraits:0, mult:4.30, weight:1.6,  rollRange:[1.10,1.28], traitValueMult:1.15},
  {id:'mythic_legendary', name:'Mythic Legendary', color:'var(--t-mythic1)',   statCount:7, uniqueTraits:2, mythicTraits:1, mult:5.50, weight:0.28, rollRange:[1.15,1.34], traitValueMult:1.32},
];
const TIER_BY_ID = Object.fromEntries(TIERS.map(t=>[t.id,t]));

// -- gear slots ----------------------------------------------------------------
// accessories/artifact are the dedicated crit & vitality slots; weapons lean into
// crit as a secondary offensive roll alongside raw attack power.
const SLOTS = [
  {id:'weapon',      label:'Weapon',       group:'weapon',    primary:['atk','matk','critChance']},
  {id:'helmet',      label:'Helmet',       group:'armor',     primary:['def','mdef']},
  {id:'chest',       label:'Chest Armor',  group:'armor',     primary:['def','hitRes']},
  {id:'legs',        label:'Leg Armor',    group:'armor',     primary:['def','spd']},
  {id:'arms',        label:'Arm Guards',   group:'armor',     primary:['atk','def']},
  {id:'offhand',     label:'Off-Hand',     group:'weapon',    primary:['def','mdef']},
  {id:'boots',       label:'Boots',        group:'armor',     primary:['spd','hitEff']},
  {id:'accessory1',  label:'Accessory',    group:'accessory', primary:['critChance','critDamage','hp','mp']},
  {id:'accessory2',  label:'Accessory',    group:'accessory', primary:['critChance','critDamage','hp','mp']},
  {id:'artifact',    label:'Artifact',     group:'artifact',  primary:['critDamage','hp','mp'], rareSlot:true},
];
