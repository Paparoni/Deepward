// Class disciplines are deliberately exclusive: the first node chosen commits a
// character to that route. Each route is a five-tier progression, so a build has
// a clear identity rather than being a collection of every available bonus.
const A = (name, manaCost, action, desc, extra={}) => ({name, kind:'active', manaCost, action, desc, ...extra});
const P = (name, effect, desc) => ({name, kind:'passive', effect, desc});

// Every discipline continues beyond its signature skill into a mastery arc. The
// arc inherits its route's damage type and combat style, keeping the late tree
// coherent without duplicating a separate set of definitions for every class.
function advancedNodes(route){
  const elementalSkill = [...route.nodes].reverse().find(node=>node.forcedElement);
  const element = elementalSkill?.forcedElement || 'physical';
  const magic = route.nodes.some(node=>node.magic);
  const primaryStat = magic ? 'matk' : 'atk';
  const damageStat = `${element}Dmg`;
  const damageLabel = element==='physical' ? 'physical' : element;
  return [
    P(`${route.name} Mastery`, {type:'statBonus', stat:primaryStat, value:7}, `+7 ${primaryStat.toUpperCase()} permanently.`),
    A(`${route.name} Counterstroke`, 15, 'nuke', `A perfected 150% ${damageLabel} attack.`, {power:1.5, magic, forcedElement:element}),
    P(`${route.name} Attunement`, {type:'statBonus', stat:damageStat, value:12}, `+12% ${damageLabel} damage.`),
    A(`${route.name} Ascendance`, 23, 'aoe', `Unleash 135% ${damageLabel} damage against every enemy.`, {power:1.35, magic, forcedElement:element}),
    P(`${route.name} Paragon`, {type:'bonusDamagePct', value:15}, '+15% damage dealt.'),
  ];
}

function makeClass(id, name, icon, desc, statMods, routes, innate={}){
  const choiceGroup = `${id}-discipline`;
  const innatePassive = innate.passive ? {...innate.passive, id:`${id}_innate_passive`, kind:'passive'} : null;
  const innateActive = innate.active ? {...innate.active, id:`${id}_innate_active`, kind:'active'} : null;
  return {
    id, name, icon, desc, statMods, innatePassive, innateActive,
    skillTree: routes.flatMap(route => [...route.nodes, ...advancedNodes(route)].map((node, index) => {
      const cost = index >= 8 ? 3 : index >= 4 ? 2 : 1;
      return {
        ...node,
        id: `${id}_${route.id}_${index + 1}`,
        tier: index + 1,
        cost,
        // active skills go on cooldown after use (rounds) so the strongest
        // nuke in a build can't just be spammed every turn — deeper skills
        // hit harder but also sit out longer, forcing a rotation.
        cooldown: node.kind === 'active' ? U.clamp(2 + Math.floor((cost-1)/2), 2, 4) : undefined,
        branch: route.name,
        requires: index ? `${id}_${route.id}_${index}` : null,
        choiceGroup: index === 0 ? choiceGroup : null,
      };
    })),
  };
}

const CLASSES = [
  makeClass('warrior', 'Warrior', '⚔️', 'A frontline fighter who chooses one discipline and masters it.', {atk:4, def:3, hitRes:2}, [
    {id:'battle', name:'Battlemaster', nodes:[
      A('Cleave', 6, 'aoe', 'Strike every enemy for 70% weapon damage.', {power:.7}),
      P('Weapon Drill', {type:'statBonus', stat:'atk', value:5}, '+5 ATK permanently.'),
      A('Sundering Blow', 10, 'debuff', 'Shatter a foe\'s guard, reducing DEF by 22%.', {debuffStat:'def', debuffValue:22}),
      P('Killer\'s Rhythm', {type:'critChanceBonus', value:12}, '+12% critical-hit chance.'),
      A('Executioner\'s Arc', 18, 'aoe', 'A decisive sweep for 145% weapon damage.', {power:1.45, executeThreshold:18}),
    ]},
    {id:'guard', name:'Iron Guard', nodes:[
      A('Shield Bash', 5, 'debuff', 'Reduce a foe\'s ATK by 18%.', {debuffStat:'atk', debuffValue:18}),
      P('Ironhide', {type:'statBonus', stat:'def', value:7}, '+7 DEF permanently.'),
      A('Hold the Line', 9, 'buff', '+25% DEF for the battle.', {buffStat:'def', buffValue:25}),
      P('Barbed Plate', {type:'thorns', value:14}, 'Reflect 14% of incoming damage.'),
      A('Last Stand', 16, 'heal', 'Recover 42% of maximum HP.', {healPct:42}),
    ]},
    {id:'berserker', name:'Berserker', nodes:[
      A('Bloodlust', 7, 'nuke', 'A flaming strike for 105% weapon damage.', {power:1.05, forcedElement:'fire'}),
      P('Battle Scars', {type:'lowHpDamageBonus', value:16}, '+16% damage below half HP.'),
      A('Warcry', 11, 'aoe', 'Burn all enemies for 80% weapon damage.', {power:.8, forcedElement:'fire'}),
      P('Furyborn', {type:'comboDamage', value:6}, 'Each consecutive hit gains 6% damage.'),
      A('Apex Rage', 20, 'nuke', 'A brutal 195% fire strike.', {power:1.95, forcedElement:'fire', executeThreshold:22}),
    ]},
    {id:'warlord', name:'Warlord', nodes:[
      A('Rallying Cry', 7, 'buff', '+24% ATK for the battle.', {buffStat:'atk', buffValue:24}),
      P('Commanding Presence', {type:'statBonus', stat:'hitRes', value:6}, '+6 HIT RES permanently.'),
      A('Crushing Advance', 11, 'nuke', 'A 130% weapon-damage strike.', {power:1.3}),
      P('Giant Slayer', {type:'bossDamageBonus', value:18}, '+18% damage to bosses.'),
      A('Conqueror\'s Banner', 18, 'buff', '+42% ATK for the battle.', {buffStat:'atk', buffValue:42}),
    ]},
  ], {
    passive: {name:'Unshakable Resolve', effect:{type:'guardFury', value:12}, desc:'Every time you Defend, also gain +12% ATK for the rest of the battle (stacks).'},
    active: {name:"Warrior's Second Wind", manaCost:6, cooldown:4, action:'heal', healPct:22, desc:'Restore 22% of your maximum HP. Available regardless of discipline.'},
  }),
  makeClass('mage', 'Mage', '🔮', 'A scholar of dangerous arcane disciplines.', {matk:5, mdef:2, spd:1}, [
    {id:'pyre', name:'Pyromancer', nodes:[
      A('Firebolt', 8, 'nuke', 'A fire bolt for 115% magic damage.', {power:1.15, magic:true, forcedElement:'fire'}),
      P('Ember Mind', {type:'statBonus', stat:'fireDmg', value:12}, '+12% fire damage.'),
      A('Flame Wave', 12, 'aoe', 'Scorch all enemies for 75% magic damage.', {power:.75, magic:true, forcedElement:'fire'}),
      P('Cinderheart', {type:'critDmgBonus', value:26}, '+26% critical damage.'),
      A('Meteorfall', 22, 'aoe', 'Call down meteors for 165% magic damage.', {power:1.65, magic:true, forcedElement:'fire'}),
    ]},
    {id:'frost', name:'Cryomancer', nodes:[
      A('Frost Lance', 8, 'nuke', 'Pierce a foe for 110% ice damage.', {power:1.1, magic:true, forcedElement:'ice'}),
      P('Winter Veil', {type:'statBonus', stat:'iceDmg', value:12}, '+12% ice damage.'),
      A('Frost Nova', 12, 'aoe', 'Freeze every foe for 70% magic damage.', {power:.7, magic:true, forcedElement:'ice'}),
      P('Glacial Ward', {type:'damageCapPct', value:16}, 'Single hits cannot exceed 16% max HP.'),
      A('Absolute Zero', 20, 'nuke', 'A 175% ice spell that executes weakened foes.', {power:1.75, magic:true, forcedElement:'ice', executeThreshold:18}),
    ]},
    {id:'storm', name:'Stormcaller', nodes:[
      A('Shock', 8, 'nuke', 'A lightning bolt for 110% magic damage.', {power:1.1, magic:true, forcedElement:'lightning'}),
      P('Static Field', {type:'stunChance', value:8}, '8% chance to stun on hit.'),
      A('Chain Lightning', 13, 'aoe', 'Lightning arcs for 72% magic damage.', {power:.72, magic:true, forcedElement:'lightning'}),
      P('Overcharge', {type:'critChanceBonus', value:14}, '+14% critical-hit chance.'),
      A('Stormlord\'s Call', 21, 'aoe', 'A tempest for 160% magic damage.', {power:1.6, magic:true, forcedElement:'lightning'}),
    ]},
    {id:'chrono', name:'Chronomancer', nodes:[
      A('Time Slice', 7, 'nuke', 'A precise arcane cut for 100% magic damage.', {power:1, magic:true, forcedElement:'dark'}),
      P('Accelerated Thought', {type:'statBonus', stat:'spd', value:5}, '+5 SPD permanently.'),
      A('Temporal Drag', 10, 'debuff', 'Reduce a foe\'s SPD by 32%.', {debuffStat:'spd', debuffValue:32}),
      P('Mana Loop', {type:'manaCostReduction', value:16}, 'Skills cost 16% less MP.'),
      A('Epoch Surge', 18, 'buff', '+45% MATK for the battle.', {buffStat:'matk', buffValue:45}),
    ]},
  ], {
    passive: {name:'Arcane Reservoir', effect:{type:'mpRegenPerTurn', value:6}, desc:'Regenerate 6 MP every round, in or out of your chosen discipline.'},
    active: {name:'Arcane Surge', manaCost:5, cooldown:1, action:'nuke', power:0.9, magic:true, desc:'A quick 90% magic bolt in your weapon\'s element. Available regardless of discipline.'},
  }),
  makeClass('rogue', 'Rogue', '🗡️', 'A quick killer who commits to a single lethal craft.', {spd:5, hitEff:3}, [
    {id:'duel', name:'Duelist', nodes:[
      A('Quick Strike', 5, 'nuke', 'A fast 95% weapon-damage attack.', {power:.95}),
      P('Fleet Footed', {type:'statBonus', stat:'spd', value:6}, '+6 SPD permanently.'),
      A('Backstab', 9, 'nuke', 'A 140% strike that executes wounded targets.', {power:1.4, executeThreshold:16}),
      P('Deadly Precision', {type:'critChanceBonus', value:16}, '+16% critical-hit chance.'),
      A('Duelist\'s Finale', 17, 'nuke', 'A 205% weapon-damage finisher.', {power:2.05, executeThreshold:25}),
    ]},
    {id:'shadow', name:'Shadowblade', nodes:[
      A('Smoke Bomb', 6, 'debuff', 'Reduce a foe\'s HIT EFF by 24%.', {debuffStat:'hitEff', debuffValue:24}),
      P('Veil Step', {type:'dodgeChance', value:10}, '10% chance to evade completely.'),
      A('Ambush', 10, 'nuke', 'A 125% weapon-damage strike from the dark.', {power:1.25}),
      P('Opportunist', {type:'comboDamage', value:5}, 'Each consecutive hit gains 5% damage.'),
      A('Nightfall', 18, 'aoe', 'Strike all enemies for 115% weapon damage.', {power:1.15}),
    ]},
    {id:'venom', name:'Venomcrafter', nodes:[
      A('Venomstrike', 6, 'nuke', 'A 100% poison weapon strike.', {power:1, forcedElement:'poison'}),
      P('Toxic Veins', {type:'statBonus', stat:'poisonDmg', value:12}, '+12% poison damage.'),
      A('Epidemic', 11, 'aoe', 'Spread poison for 75% weapon damage.', {power:.75, forcedElement:'poison'}),
      P('Lethal Chemistry', {type:'critDmgBonus', value:24}, '+24% critical damage.'),
      A('Black Lotus', 18, 'nuke', 'A 180% poison strike.', {power:1.8, forcedElement:'poison', executeThreshold:20}),
    ]},
    {id:'raider', name:'Raider', nodes:[
      A('Dirty Trick', 5, 'debuff', 'Reduce a foe\'s DEF by 20%.', {debuffStat:'def', debuffValue:20}),
      P('Light Fingers', {type:'goldFind', value:20}, '+20% gold found.'),
      A('Blade Flurry', 12, 'aoe', 'A flurry for 82% weapon damage.', {power:.82}),
      P('Twinned Blades', {type:'doubleHitChance', value:14}, '14% chance to strike twice.'),
      A('Highwayman\'s Gambit', 17, 'buff', '+40% ATK for the battle.', {buffStat:'atk', buffValue:40}),
    ]},
  ], {
    passive: {name:"Predator's Instinct", effect:{type:'critChanceBonus', value:10}, desc:'+10% critical hit chance, always — no discipline required.'},
    active: {name:'Second Chance', manaCost:10, cooldown:5, action:'resetCooldowns', desc:'Instantly clear every skill cooldown. Available regardless of discipline.'},
  }),
  makeClass('paladin', 'Paladin', '🛡️', 'A holy warrior defined by one sacred oath.', {def:4, mdef:2, hitRes:2}, [
    {id:'devotion', name:'Devotion', nodes:[
      A('Smite', 7, 'nuke', 'A holy strike for 105% magic damage.', {power:1.05, magic:true, forcedElement:'holy'}),
      P('Devotion', {type:'statBonus', stat:'holyDmg', value:12}, '+12% holy damage.'),
      A('Lay on Hands', 10, 'heal', 'Restore 32% maximum HP.', {healPct:32}),
      P('Holy Vigor', {type:'regenPerTurn', value:9}, 'Regenerate 9 HP each turn.'),
      A('Judgment', 19, 'nuke', 'A 185% holy execution.', {power:1.85, magic:true, forcedElement:'holy', executeThreshold:18}),
    ]},
    {id:'wrath', name:'Avenger', nodes:[
      A('Righteous Fury', 8, 'buff', '+24% ATK for the battle.', {buffStat:'atk', buffValue:24}),
      P('Zealotry', {type:'bossDamageBonus', value:16}, '+16% damage to bosses.'),
      A('Consecrated Blade', 11, 'nuke', 'A 140% holy weapon strike.', {power:1.4, forcedElement:'holy'}),
      P('Burning Zeal', {type:'critChanceBonus', value:12}, '+12% critical-hit chance.'),
      A('Wrath of Heaven', 21, 'aoe', 'Holy fire for 150% magic damage.', {power:1.5, magic:true, forcedElement:'holy'}),
    ]},
    {id:'aegis', name:'Aegis', nodes:[
      A('Shield of Faith', 7, 'buff', '+28% DEF for the battle.', {buffStat:'def', buffValue:28}),
      P('Sanctuary', {type:'damageImmuneChance', value:7}, '7% chance to take no damage.'),
      A('Radiance', 12, 'aoe', 'A burst of light for 68% magic damage.', {power:.68, magic:true, forcedElement:'holy'}),
      P('Bulwark', {type:'thorns', value:13}, 'Reflect 13% of incoming damage.'),
      A('Divine Fortress', 17, 'heal', 'Recover 48% maximum HP.', {healPct:48}),
    ]},
    {id:'inquisitor', name:'Inquisitor', nodes:[
      A('Brand the Heretic', 7, 'debuff', 'Reduce a foe\'s MDEF by 24%.', {debuffStat:'mdef', debuffValue:24}),
      P('Unblinking Eye', {type:'statBonus', stat:'hitEff', value:6}, '+6 HIT EFF permanently.'),
      A('Purge', 12, 'nuke', 'A 135% holy spell.', {power:1.35, magic:true, forcedElement:'holy'}),
      P('Relentless Verdict', {type:'critDmgBonus', value:25}, '+25% critical damage.'),
      A('Final Inquisition', 20, 'nuke', 'A 190% holy sentence.', {power:1.9, magic:true, forcedElement:'holy', executeThreshold:24}),
    ]},
  ], {
    passive: {name:'Sanctified Guard', effect:{type:'guardMitigationBonus', value:15}, desc:'Defend mitigates an additional 15 percentage points of incoming damage, always.'},
    active: {name:'Cleansing Light', manaCost:8, cooldown:4, action:'cleanse', desc:'Strip every debuff and damage-over-time effect off yourself. Available regardless of discipline.'},
  }),
  makeClass('elementalist', 'Elementalist', '🌪️', 'A conduit who dedicates their craft to one element.', {matk:4, spd:2, hitEff:1}, [
    {id:'flame', name:'Flamecaller', nodes:[
      A('Ignite', 7, 'nuke', 'A 105% fire spell.', {power:1.05, magic:true, forcedElement:'fire'}),
      P('Ember Core', {type:'statBonus', stat:'fireDmg', value:14}, '+14% fire damage.'),
      A('Wildfire', 12, 'aoe', 'Flames spread for 78% magic damage.', {power:.78, magic:true, forcedElement:'fire'}),
      P('Combustion', {type:'bonusDamagePct', value:12}, '+12% damage dealt.'),
      A('Inferno', 21, 'aoe', 'An inferno for 170% magic damage.', {power:1.7, magic:true, forcedElement:'fire'}),
    ]},
    {id:'frost', name:'Frostweaver', nodes:[
      A('Frostbolt', 7, 'nuke', 'A 105% ice spell.', {power:1.05, magic:true, forcedElement:'ice'}),
      P('Permafrost', {type:'statBonus', stat:'iceDmg', value:14}, '+14% ice damage.'),
      A('Blizzard', 12, 'aoe', 'A blizzard for 76% magic damage.', {power:.76, magic:true, forcedElement:'ice'}),
      P('Glacial Armor', {type:'damageCapPct', value:15}, 'Single hits cannot exceed 15% max HP.'),
      A('Winter\'s End', 20, 'nuke', 'A 180% ice execution.', {power:1.8, magic:true, forcedElement:'ice', executeThreshold:20}),
    ]},
    {id:'storm', name:'Tempest', nodes:[
      A('Spark', 7, 'nuke', 'A 105% lightning spell.', {power:1.05, magic:true, forcedElement:'lightning'}),
      P('Charged Blood', {type:'statBonus', stat:'lightningDmg', value:14}, '+14% lightning damage.'),
      A('Thunderhead', 12, 'aoe', 'Lightning for 76% magic damage.', {power:.76, magic:true, forcedElement:'lightning'}),
      P('Living Current', {type:'doubleHitChance', value:12}, '12% chance to strike twice.'),
      A('Cataclysm', 21, 'aoe', 'A storm for 165% magic damage.', {power:1.65, magic:true, forcedElement:'lightning'}),
    ]},
    {id:'earth', name:'Geomancer', nodes:[
      A('Tremor', 6, 'nuke', 'An earth strike for 95% magic damage.', {power:.95, magic:true, forcedElement:'physical'}),
      P('Stoneskin', {type:'statBonus', stat:'def', value:8}, '+8 DEF permanently.'),
      A('Quake', 11, 'aoe', 'A quake for 70% magic damage.', {power:.7, magic:true, forcedElement:'physical'}),
      P('Bulwark of Stone', {type:'thorns', value:12}, 'Reflect 12% of incoming damage.'),
      A('Worldbreaker', 19, 'nuke', 'A 175% earth spell.', {power:1.75, magic:true, forcedElement:'physical'}),
    ]},
  ], {
    passive: {name:'Arcane Momentum', effect:{type:'arcaneMomentum', value:3}, desc:'Each hit you land grants +3% MATK for the rest of the battle (stacks), regardless of discipline.'},
    active: {name:'Elemental Shift', manaCost:7, cooldown:2, action:'nukeRandomElement', power:1.0, magic:true, desc:'A 100% magic bolt in a random element. Available regardless of discipline.'},
  }),
  makeClass('necromancer', 'Necromancer', '☠️', 'A master of death who follows one forbidden art.', {matk:3, mdef:3, hitRes:2}, [
    {id:'blight', name:'Blight', nodes:[
      A('Curse', 7, 'nuke', 'A withering 100% dark spell.', {power:1, magic:true, forcedElement:'dark'}),
      P('Decay', {type:'statBonus', stat:'darkDmg', value:14}, '+14% dark damage.'),
      A('Plague', 11, 'aoe', 'A spreading disease for 70% magic damage.', {power:.7, magic:true, forcedElement:'poison'}),
      P('Withering Mark', {type:'bossDamageBonus', value:16}, '+16% damage to bosses.'),
      A('Death Mark', 19, 'nuke', 'A 175% dark execution.', {power:1.75, magic:true, forcedElement:'dark', executeThreshold:22}),
    ]},
    {id:'soul', name:'Soulbinder', nodes:[
      A('Soul Drain', 6, 'nuke', 'Drain life for 95% magic damage.', {power:.95, magic:true, forcedElement:'dark'}),
      P('Leeching Touch', {type:'lifesteal', value:9}, 'Heal for 9% of damage dealt.'),
      A('Soulchain', 12, 'nuke', 'Bind a foe for 130% magic damage.', {power:1.3, magic:true, forcedElement:'dark'}),
      P('Dark Pact', {type:'manaCostReduction', value:17}, 'Skills cost 17% less MP.'),
      A('Soul Harvest', 20, 'aoe', 'Reap all enemies for 125% magic damage.', {power:1.25, magic:true, forcedElement:'dark'}),
    ]},
    {id:'grave', name:'Gravecaller', nodes:[
      A('Reap', 8, 'nuke', 'A 105% dark execution spell.', {power:1.05, magic:true, forcedElement:'dark', executeThreshold:12}),
      P('Graverobber', {type:'goldFind', value:22}, '+22% gold found.'),
      A('Soul Siphon', 13, 'nuke', 'A 140% dark spell.', {power:1.4, magic:true, forcedElement:'dark'}),
      P('Forbidden Lore', {type:'xpBonus', value:18}, '+18% experience earned.'),
      A('Death\'s Domain', 20, 'aoe', 'The dead strike for 130% magic damage.', {power:1.3, magic:true, forcedElement:'dark'}),
    ]},
    {id:'bone', name:'Bonewarden', nodes:[
      A('Bone Spear', 7, 'nuke', 'A 105% physical magic strike.', {power:1.05, magic:true, forcedElement:'physical'}),
      P('Ossuary Armor', {type:'statBonus', stat:'mdef', value:7}, '+7 MDEF permanently.'),
      A('Grave Shackles', 10, 'debuff', 'Reduce a foe\'s SPD by 28%.', {debuffStat:'spd', debuffValue:28}),
      P('Undying Bond', {type:'reviveOncePerFight', value:30}, 'Survive one killing blow each battle at 30% HP.'),
      A('Bone Colossus', 18, 'buff', '+44% MATK for the battle.', {buffStat:'matk', buffValue:44}),
    ]},
  ], {
    passive: {name:"Death's Due", effect:{type:'manaOnKill', value:20}, desc:'Restore 20% of your max MP on every killing blow, regardless of discipline.'},
    active: {name:'Soul Tap', manaCost:0, cooldown:3, action:'manaTap', hpCostPct:8, manaPct:30, desc:'Trade 8% of your max HP for 30% of your max MP. Available regardless of discipline.'},
  }),
];

const CLASS_BY_ID = Object.fromEntries(CLASSES.map(c=>[c.id,c]));
