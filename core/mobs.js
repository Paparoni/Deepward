// -- monster templates -----------------------------------------------------------
// baseline values are PER DUNGEON LEVEL multipliers; combat scales them up.
const MONSTER_TEMPLATES = [
  {id:'rat_swarm',    name:'Ravenous Rat Swarm',   element:'poison',    icon:'🐀', atk:0.9, def:0.6, matk:0.2, mdef:0.4, spd:1.2, flavor:'a chittering tide of teeth and fur'},
  {id:'crypt_wraith', name:'Crypt Wraith',         element:'dark',      icon:'👻', atk:0.6, def:0.5, matk:1.1, mdef:0.9, spd:1.0, flavor:'a cold shape that drinks the torchlight'},
  {id:'goblin_raider',name:'Goblin Raider',        element:'physical',  icon:'🗡️', atk:1.1, def:0.8, matk:0.2, mdef:0.4, spd:1.0, flavor:'snarling, rusted blade in hand'},
  {id:'frost_stalker',name:'Frost Stalker',        element:'ice',       icon:'🧊', atk:0.9, def:0.9, matk:0.7, mdef:0.9, spd:1.1, flavor:'breath fogging in air gone suddenly cold'},
  {id:'ember_imp',    name:'Ember Imp',            element:'fire',      icon:'👹', atk:0.8, def:0.5, matk:1.2, mdef:0.6, spd:1.3, flavor:'giggling, wreathed in guttering flame'},
  {id:'storm_harpy',  name:'Storm Harpy',          element:'lightning', icon:'🦅', atk:1.0, def:0.6, matk:0.9, mdef:0.6, spd:1.4, flavor:'shrieking on wings that crackle with static'},
  {id:'stone_golem',  name:'Stone Golem',          element:'physical',  icon:'🗿', atk:1.2, def:1.6, matk:0.1, mdef:1.0, spd:0.5, flavor:'grinding forward, slow and immense'},
  {id:'shade_priest',name:'Shade Priest',          element:'dark',     icon:'🕯️', atk:0.5, def:0.7, matk:1.3, mdef:1.1, spd:0.8, flavor:'chanting something better left unheard'},
  {id:'venom_spider', name:'Venom Spider',         element:'poison',    icon:'🕷️', atk:1.0, def:0.7, matk:0.3, mdef:0.5, spd:1.2, flavor:'eight eyes catching the last of the light'},
  {id:'holy_construct',name:'Broken Sentinel',     element:'holy',      icon:'⚜️', atk:1.1, def:1.2, matk:0.8, mdef:1.2, spd:0.7, flavor:'a temple guardian, still faithful, still armed'},
  {id:'plague_rat',   name:'Plague-Bearer',        element:'poison',    icon:'🦠', atk:0.7, def:0.5, matk:0.6, mdef:0.5, spd:0.9, flavor:'sores weeping something that used to be blood'},
  {id:'bog_witch',    name:'Bog Witch',            element:'poison',    icon:'🧙', atk:0.6, def:0.6, matk:1.3, mdef:0.9, spd:0.9, flavor:'muttering curses into the reeking mist'},
  {id:'iron_wraith',  name:'Iron Wraith',          element:'dark',      icon:'⚙️', atk:1.2, def:1.1, matk:0.5, mdef:0.8, spd:0.9, flavor:'a suit of armor that walks alone now'},
  {id:'sand_reaper',  name:'Sand Reaper',          element:'physical',  icon:'🏜️', atk:1.3, def:0.7, matk:0.2, mdef:0.5, spd:1.3, flavor:'a scythe-limbed thing that swims through dust'},
];

const BOSS_TEMPLATES = [
  {id:'bone_tyrant',    name:'The Bone Tyrant',      title:'Warden of the Lower Crypts', element:'dark',      icon:'💀', atk:1.6, def:1.3, matk:1.0, mdef:1.1, spd:0.9, flavor:'a crowned skeleton, patient as the grave'},
  {id:'inferno_hound',  name:'Cinderjaw',            title:'the Inferno Hound',          element:'fire',      icon:'🐕‍🦺', atk:1.7, def:1.0, matk:1.3, mdef:0.9, spd:1.3, flavor:'three heads, none of them merciful'},
  {id:'glacier_queen',  name:'The Glacier Queen',     title:'Bride of the White Hollow',  element:'ice',       icon:'❄️', atk:1.2, def:1.5, matk:1.6, mdef:1.4, spd:0.8, flavor:'frost creeping outward with every breath'},
  {id:'storm_titan',    name:'Kael the Stormbound',   title:'Titan of the Riven Sky',     element:'lightning', icon:'⚡', atk:1.6, def:1.1, matk:1.4, mdef:1.0, spd:1.4, flavor:'lightning arcing between his broken chains'},
  {id:'venom_matriarch',name:'The Venom Matriarch',   title:'Mother of the Deep Web',     element:'poison',    icon:'🕸️', atk:1.4, def:1.2, matk:1.2, mdef:1.1, spd:1.1, flavor:'a thousand young stirring beneath her'},
  {id:'fallen_seraph',  name:'Ashariel',              title:'the Fallen Seraph',          element:'holy',      icon:'😇', atk:1.5, def:1.4, matk:1.5, mdef:1.3, spd:1.0, flavor:'wings burned black, halo still burning'},
  {id:'void_sovereign', name:'The Void Sovereign',    title:'That Which Waits Below',     element:'dark',      icon:'🌑', atk:1.8, def:1.6, matk:1.8, mdef:1.6, spd:1.2, flavor:'a silence with a shape and a hunger'},
  {id:'abyssal_leviathan',name:'The Abyssal Leviathan',title:'Drowner of the Deep Roads', element:'ice',       icon:'🐋', atk:1.5, def:1.7, matk:1.3, mdef:1.4, spd:0.7, flavor:'a vast shape surfacing where no water should be'},
  {id:'frozen_monarch', name:'The Frozen Monarch',   title:'Last King of the White Court',element:'lightning', icon:'👑', atk:1.7, def:1.3, matk:1.6, mdef:1.2, spd:1.1, flavor:'a crown of ice sparking with trapped lightning'},
];
