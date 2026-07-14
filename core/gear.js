// -- rarity tiers -------------------------------------------------------------
// statCount now strictly increases tier-over-tier (old table tied ultra_rare/unique
// at 4 and legendary/mythic at 5, so those pairs didn't feel different). rollRange
// both narrows and shifts upward with tier, so a higher tier's *floor* roll tends to
// beat a lower tier's *ceiling* roll — not just "more stats" but "better stats".
// traitValueMult scales unique/mythic trait magnitudes so a Legendary's traits hit
// harder than a Unique's, and a Mythic's harder still, at the same item level.
const TIERS = [
  {id:'common',           name:'Common',           color:'var(--t-common)',    statCount:1, uniqueTraits:0, mythicTraits:0, mult:1.00, weight:100,  rollRange:[0.80,1.05], traitValueMult:1.00},
  {id:'uncommon',         name:'Uncommon',         color:'var(--t-uncommon)',  statCount:2, uniqueTraits:0, mythicTraits:0, mult:1.28, weight:55,   rollRange:[0.85,1.10], traitValueMult:1.00},
  {id:'rare',             name:'Rare',             color:'var(--t-rare)',      statCount:3, uniqueTraits:0, mythicTraits:0, mult:1.62, weight:26,   rollRange:[0.90,1.15], traitValueMult:1.00},
  {id:'ultra_rare',       name:'Ultra Rare',       color:'var(--t-ultra)',     statCount:4, uniqueTraits:0, mythicTraits:0, mult:2.05, weight:11,   rollRange:[0.95,1.20], traitValueMult:1.00},
  {id:'unique',           name:'Unique',           color:'var(--t-unique)',    statCount:5, uniqueTraits:1, mythicTraits:0, mult:2.60, weight:5,    rollRange:[1.00,1.25], traitValueMult:1.00},
  {id:'legendary',        name:'Legendary',        color:'var(--t-legendary)', statCount:6, uniqueTraits:2, mythicTraits:0, mult:3.30, weight:1.6,  rollRange:[1.05,1.30], traitValueMult:1.12},
  {id:'mythic_legendary', name:'Mythic Legendary', color:'var(--t-mythic1)',   statCount:7, uniqueTraits:2, mythicTraits:1, mult:4.20, weight:0.28, rollRange:[1.10,1.35], traitValueMult:1.25},
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
