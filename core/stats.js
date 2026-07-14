// -- core combat stats ------------------------------------------------------
const CORE_STATS = [
  {id:'atk',        label:'Attack',            short:'ATK',      kind:'flat', weapon:true},
  {id:'def',        label:'Defense',           short:'DEF',      kind:'flat'},
  {id:'matk',       label:'Magic Attack',      short:'MATK',     kind:'flat', weapon:true},
  {id:'mdef',       label:'Magic Defense',     short:'MDEF',     kind:'flat'},
  {id:'spd',        label:'Speed',             short:'SPD',      kind:'flat'},
  {id:'hitEff',     label:'Hit Efficiency',    short:'HIT EFF',  kind:'flat'},
  {id:'hitRes',     label:'Hit Resistance',    short:'HIT RES',  kind:'flat'},
  {id:'critChance', label:'Critical Chance',   short:'CRIT %',   kind:'flat'},
  {id:'critDamage', label:'Critical Damage',   short:'CRIT DMG', kind:'flat'},
  {id:'hp',         label:'Bonus HP',          short:'HP+',      kind:'flat'},
  {id:'mp',         label:'Bonus MP',          short:'MP+',      kind:'flat'},
];

// -- elemental damage-bonus stats (percent-based) ---------------------------
const ELEMENTS = [
  {id:'physical',  label:'Physical'},
  {id:'fire',      label:'Fire'},
  {id:'ice',       label:'Ice'},
  {id:'lightning', label:'Lightning'},
  {id:'poison',    label:'Poison'},
  {id:'holy',      label:'Holy'},
  {id:'dark',      label:'Dark'},
];
const ELEMENT_STATS = ELEMENTS.map(e => ({
  id:e.id+'Dmg', label:e.label.toUpperCase()+' DMG BONUS', short:e.label.slice(0,4).toUpperCase()+' DMG', kind:'pct', element:e.id
}));

const ALL_STATS = [...CORE_STATS, ...ELEMENT_STATS];
const STAT_BY_ID = Object.fromEntries(ALL_STATS.map(s=>[s.id,s]));
