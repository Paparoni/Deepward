const A = (name, manaCost, action, desc, extra = {}) => ({
  name,
  kind: 'active',
  manaCost,
  action,
  desc,
  ...extra,
});
const P = (name, effect, desc) => ({ name, kind: 'passive', effect, desc });
function advancedNodes(route) {
  const elementalSkill = [...route.nodes].reverse().find((node) => node.forcedElement);
  const element = elementalSkill?.forcedElement || 'physical';
  const magic = route.nodes.some((node) => node.magic);
  const primaryStat = magic ? 'matk' : 'atk';
  const damageStat = `${element}Dmg`;
  const damageLabel = element === 'physical' ? 'physical' : element;
  return [
    P(
      `${route.name} Mastery`,
      { type: 'statBonus', stat: primaryStat, value: 7 },
      `+7 ${primaryStat.toUpperCase()} permanently.`,
    ),
    A(`${route.name} Counterstroke`, 15, 'nuke', `A perfected 150% ${damageLabel} attack.`, {
      power: 1.5,
      magic,
      forcedElement: element,
    }),
    P(
      `${route.name} Attunement`,
      { type: 'statBonus', stat: damageStat, value: 12 },
      `+12% ${damageLabel} damage.`,
    ),
    A(`${route.name} Ascendance`, 23, 'aoe', `Unleash 135% ${damageLabel} damage against every enemy.`, {
      power: 1.35,
      magic,
      forcedElement: element,
    }),
    P(`${route.name} Paragon`, { type: 'bonusDamagePct', value: 15 }, '+15% damage dealt.'),
  ];
}

function expansionNodes(route) {
  const elementalSkill = [...route.nodes].reverse().find((node) => node.forcedElement);
  const element = elementalSkill?.forcedElement || 'physical';
  const magic = route.nodes.some((node) => node.magic);
  const power = magic ? 'matk' : 'atk';
  const guard = magic ? 'mdef' : 'def';
  const label = element[0].toUpperCase() + element.slice(1);
  return [
    P(`${route.name} Foundation`, { type: 'statBonus', stat: power, value: 4 }, `+4 ${power.toUpperCase()}.`),
    P(`${route.name} Footwork`, { type: 'statBonus', stat: 'spd', value: 3 }, '+3 SPD.'),
    P(`${route.name} Wardcraft`, { type: 'statBonus', stat: guard, value: 5 }, `+5 ${guard.toUpperCase()}.`),
    P(`${route.name} Economy`, { type: 'manaCostReduction', value: 8 }, 'Skills cost 8% less MP.'),
    P(`${label} Resonance`, { type: 'statBonus', stat: `${element}Dmg`, value: 9 }, `+9% ${element} damage.`),
    P(`${route.name} Precision`, { type: 'critChanceBonus', value: 7 }, '+7% critical-hit chance.'),
    P(
      `${route.name} Recovery`,
      magic ? { type: 'manaOnHit', value: 2 } : { type: 'hpOnKill', value: 6 },
      magic ? 'Restore 2 MP on hit.' : 'Restore 6 HP on kill.',
    ),
    A(`${route.name} Breakthrough`, 14, 'nuke', `A focused 165% ${element} technique.`, {
      power: 1.65,
      magic,
      forcedElement: element,
    }),
  ];
}
function deepExpansionNodes(route) {
  const elementalSkill = [...route.nodes].reverse().find((node) => node.forcedElement);
  const element = elementalSkill?.forcedElement || 'physical';
  const magic = route.nodes.some((node) => node.magic);
  const power = magic ? 'matk' : 'atk';
  const defense = magic ? 'mdef' : 'def';
  return [
    A(`${route.name} Onslaught`, 17, 'aoe', `Strike every enemy for 110% ${element} damage.`, {
      power: 1.1,
      magic,
      forcedElement: element,
    }),
    P(
      `${route.name} Aftershock`,
      { type: 'doubleHitChance', value: 8 },
      '8% chance for attacks to strike twice.',
    ),
    A(`${route.name} Severance`, 13, 'debuff', `Break an enemy's ${defense.toUpperCase()} by 28%.`, {
      debuffStat: defense,
      debuffValue: 28,
    }),
    P(`${route.name} Predation`, { type: 'lifesteal', value: 6 }, 'Heal for 6% of damage dealt.'),
    A(`${route.name} Exaltation`, 18, 'buff', `Gain +36% ${power.toUpperCase()} for the battle.`, {
      buffStat: power,
      buffValue: 36,
    }),
    P(
      `${route.name} Defiance`,
      { type: 'lowHpDamageBonus', value: 18 },
      'Deal 18% more damage below half HP.',
    ),
    P(
      `${route.name} Grand Ward`,
      { type: 'statBonus', stat: defense, value: 8 },
      `+8 ${defense.toUpperCase()}.`,
    ),
    A(`${route.name} Final Art`, 26, 'nuke', `A devastating 225% ${element} capstone technique.`, {
      power: 2.25,
      magic,
      forcedElement: element,
      executeThreshold: 20,
    }),
  ];
}
function elementalNodes(route) {
  const elementalSkill = [...route.nodes].reverse().find((node) => node.forcedElement);
  const element = elementalSkill?.forcedElement || 'physical';
  const magic = route.nodes.some((node) => node.magic);
  const label = element[0].toUpperCase() + element.slice(1);
  const ailment = ELEMENTAL_AILMENTS[element].name;
  return [
    P(
      `${label} Catalyst`,
      { type: 'elementProcChance', element, value: 10 },
      `+10% chance to trigger ${ailment}.`,
    ),
    P(
      `${ailment} Savant`,
      { type: 'elementStatusPower', element, value: 30 },
      `${ailment} effects are 30% stronger.`,
    ),
    A(`${route.name} Affliction`, 18, 'nuke', `Deal 145% ${element} damage and guarantee ${ailment}.`, {
      power: 1.45,
      magic,
      forcedElement: element,
      guaranteedStatus: true,
    }),
    A(
      `${route.name} Cataclysm`,
      29,
      'aoe',
      `Deal 125% ${element} damage to all enemies and guarantee ${ailment}.`,
      { power: 1.25, magic, forcedElement: element, guaranteedStatus: true },
    ),
  ];
}

const WEB_ROUTE_MOTIFS = {
  warrior: { battle: 'Tempered Edge', guard: 'Gatewall', berserker: 'Red Wake', warlord: 'Iron Standard' },
  mage: { pyre: 'Cinder Crown', frost: 'Rimeglass', storm: 'Skywire', chrono: 'Broken Hour' },
  rogue: { duel: 'Answering Blade', shadow: 'Gloamstep', venom: 'Viper Psalm', raider: 'Black Pennant' },
  paladin: {
    devotion: 'Last Grace',
    wrath: 'Final Sentence',
    aegis: 'Sun Rampart',
    inquisitor: 'Ashen Censure',
  },
  elementalist: { flame: 'First Ember', frost: 'Deep Glacier', storm: 'Tempest Heart', earth: 'Worldstone' },
  necromancer: { blight: 'Patient Rot', soul: 'Open Veil', grave: 'Sepulcher Host', bone: 'Ivory Marrow' },
};

function refineRouteNodes(classId, route, nodes) {
  const profile = routeProfile(route),
    motif = WEB_ROUTE_MOTIFS[classId]?.[route.id] || route.name,
    statusRoutes = new Set(['pyre', 'frost', 'storm', 'venom', 'inquisitor', 'flame', 'blight']),
    defensiveRoutes = new Set(['guard', 'devotion', 'aegis', 'earth', 'bone']),
    bloodRoutes = new Set(['berserker', 'wrath', 'soul']),
    tempoRoutes = new Set(['battle', 'warlord', 'chrono', 'duel', 'shadow', 'raider']),
    isStatus = statusRoutes.has(route.id),
    isDefensive = defensiveRoutes.has(route.id),
    isBlood = bloodRoutes.has(route.id),
    isTempo = tempoRoutes.has(route.id),
    element = profile.element,
    magic = profile.magic,
    powerStat = magic ? 'matk' : 'atk',
    defenseStat = magic ? 'mdef' : 'def',
    ailment = ELEMENTAL_AILMENTS[element].name;

  nodes[7] = P(
    `${motif} Opportunist`,
    { type: 'afflictedDamage', value: 14 },
    `Deal 14% more damage to enemies carrying any affliction.`,
  );
  nodes[8] = A(
    `${motif} Convergence`,
    23,
    'aoe',
    `Strike every enemy for 115% ${element} damage and inflict ${ailment}.`,
    {
      power: 1.15,
      magic,
      forcedElement: element,
      guaranteedStatus: true,
    },
  );
  nodes[9] = isDefensive
    ? P(
        `${motif} Reprisal`,
        { type: 'retaliationCharge', value: 12 },
        'Taking damage stores a charge; your next hit gains 12% damage per charge, up to three.',
      )
    : isStatus
      ? P(
          `${motif} Cruelty`,
          { type: 'statusCountDamage', value: 9, cap: 36 },
          'Deal 9% more damage for each different affliction on the target, up to 36%.',
        )
      : isBlood
        ? P(
            `${motif} Desperation`,
            { type: 'missingHpPower', value: 38 },
            'Deal up to 38% more damage as your HP is lost.',
          )
        : isTempo
          ? P(
              `${motif} Momentum`,
              { type: 'momentumDamage', value: 5, cap: 30 },
              'Consecutive hits gain 5% damage, up to 30%; taking damage breaks the momentum.',
            )
          : P(
              `${motif} Executioner`,
              { type: 'executioner', value: 28, threshold: 50 },
              'Deal 28% more damage to enemies below half HP.',
            );
  nodes[13] = magic
    ? P(
        `${motif} Mana Battery`,
        { type: 'manaBattery', value: 24 },
        'Skills gain up to 24% damage from your unspent MP.',
      )
    : P(
        `${motif} Battle Rhythm`,
        { type: 'battleRhythm', cadence: 3, cooldown: 1 },
        'Every third basic attack reduces all skill cooldowns by 1 round.',
      );
  nodes[15] = P(
    `${motif} Perfect Measure`,
    { type: 'perfectTiming', cadence: 4 },
    'Every fourth damaging hit is guaranteed to critically strike.',
  );
  nodes[16] = magic
    ? P(`${motif} Soul Draw`, { type: 'manaOnKill', value: 9 }, 'Killing an enemy restores 9% maximum MP.')
    : P(`${motif} Harvest`, { type: 'killHarvest', value: 4 }, 'Kills restore 4% of maximum HP and MP.');
  nodes[17] = A(
    `${motif} Breach`,
    16,
    'nuke',
    `A 170% ${element} strike that ignores 28% of the target's defenses.`,
    {
      power: 1.7,
      magic,
      forcedElement: element,
      defensePierce: 28,
      restoreMpPct: magic ? 4 : 0,
    },
  );
  nodes[18] = A(
    `${motif} Wake`,
    19,
    'aoe',
    `Carve through every enemy for 108% ${element} damage, leaving ${ailment} behind.`,
    {
      power: 1.08,
      magic,
      forcedElement: element,
      guaranteedStatus: true,
    },
  );
  nodes[19] = isDefensive
    ? P(
        `${motif} Answer`,
        { type: 'counterStrike', value: 38 },
        'Return 38% of incoming damage to its source.',
      )
    : isStatus
      ? P(
          `${motif} Contagion`,
          { type: 'afflictionBurst', value: 45 },
          'Killing an afflicted enemy spreads its strongest affliction to another enemy and deals 45% splash damage.',
        )
      : isTempo
        ? P(
            `${motif} Flow State`,
            { type: 'momentumDamage', value: 4, cap: 24 },
            'Each uninterrupted hit adds 4% damage, up to 24%; taking damage ends the chain.',
          )
        : P(
            `${motif} Twin Stroke`,
            { type: 'doubleHitChance', value: 12 },
            'Hits have a 12% chance to repeat for half damage.',
          );
  nodes[21] = isDefensive
    ? P(
        `${motif} Pain Ledger`,
        { type: 'damageBank', value: 28 },
        'Store 28% of damage taken and release it through your next hit.',
      )
    : isStatus
      ? P(
          `${motif} Hunger`,
          { type: 'ailmentLeech', value: 6 },
          'Damage against afflicted enemies restores 6% of that damage as HP.',
        )
      : magic
        ? P(`${motif} Feedback`, { type: 'manaOnHit', value: 2 }, 'Damaging hits restore 2 MP.')
        : P(`${motif} Predation`, { type: 'lifesteal', value: 7 }, 'Restore HP equal to 7% of damage dealt.');
  nodes[22] = magic
    ? A(`${motif} Channel`, 11, 'channel', 'Give up the attack to empower your next skill by 75%.', {
        channelPower: 75,
      })
    : A(`${motif} Ascendant Stance`, 18, 'buff', `Gain 42% ${powerStat.toUpperCase()} for the battle.`, {
        buffStat: powerStat,
        buffValue: 42,
        hpCostPct: isBlood ? 7 : 0,
      });
  nodes[23] = isDefensive
    ? P(
        `${motif} Last Wall`,
        { type: 'lowHpReduction', value: 24 },
        'Take 24% less damage while below 35% HP.',
      )
    : isStatus
      ? P(
          `${motif} Catalytic Hunger`,
          { type: 'statusCountDamage', value: 11, cap: 44 },
          'Deal 11% more damage per different affliction on the target, up to 44%.',
        )
      : magic
        ? P(
            `${motif} Deep Reservoir`,
            { type: 'manaBattery', value: 32 },
            'Skills gain up to 32% damage from your unspent MP.',
          )
        : isBlood
          ? P(
              `${motif} Last Stand`,
              { type: 'missingHpPower', value: 45 },
              'Deal up to 45% more damage as your HP is lost.',
            )
          : P(
              `${motif} Headsman`,
              { type: 'executioner', value: 34, threshold: 50 },
              'Deal 34% more damage to enemies below half HP.',
            );
  nodes[24] = P(
    `${motif} Foundation`,
    { type: 'statBonus', stat: defenseStat, value: 9 },
    `+9 ${defenseStat.toUpperCase()}.`,
  );
  nodes[25] = A(
    `${motif} Collapse`,
    27,
    'catalyst',
    `Deal 150% ${element} damage, then consume every affliction on the target for a violent burst.`,
    {
      power: 1.5,
      magic,
      forcedElement: element,
      catalystPower: 1,
    },
  );
  nodes[26] = P(
    `${motif} Instability`,
    { type: 'elementalInstability', value: 18 },
    'Targets carrying two or more different afflictions take 18% more damage.',
  );
  nodes[27] = P(
    `${ailment} Inheritance`,
    { type: 'afflictionBurst', value: 55 },
    `When an afflicted enemy dies, ${ailment} seeks another victim and the death deals 55% splash damage.`,
  );
  nodes[28] = A(`${motif} Brand`, 18, 'nuke', `Deal 150% ${element} damage and guarantee ${ailment}.`, {
    power: 1.5,
    magic,
    forcedElement: element,
    guaranteedStatus: true,
    defensePierce: 12,
  });
  nodes[29] = A(
    `${motif} Grand Collapse`,
    31,
    'catalyst',
    `Strike every enemy for 120% ${element} damage and collapse every existing affliction.`,
    {
      power: 1.2,
      magic,
      forcedElement: element,
      catalystPower: 0.8,
      allTargets: true,
    },
  );
  return nodes;
}

const SKILL_WEB_LAYOUT = {
  width: 3000,
  height: 3000,
  center: { x: 1500, y: 1500 },
  routeAngles: [-90, 0, 90, 180],
  rings: [
    { radius: 240, offsets: [0] },
    { radius: 390, offsets: [-24, -8, 8, 24] },
    { radius: 550, offsets: [-32, -16, 0, 16, 32] },
    { radius: 710, offsets: [-37, -22, -7, 7, 22, 37] },
    { radius: 870, offsets: [-40, -27, -13, 0, 13, 27, 40] },
    { radius: 1030, offsets: [-40, -27, -13, 0, 13, 27, 40] },
  ],
};

const WEB_HYBRID_ARCHETYPES = [
  {
    title: 'Crosscurrent',
    effect: { type: 'elementRelay', value: 28 },
    text: (a, b) => `Alternating damage elements between ${a} and ${b} empowers the new element by 28%.`,
  },
  {
    title: 'Ruinous Accord',
    effect: { type: 'afflictedDamage', value: 22 },
    text: (a, b) => `${a} and ${b} techniques deal 22% more damage to afflicted enemies.`,
  },
  {
    title: 'Warded Confluence',
    effect: { type: 'afflictionWard', value: 4, cap: 30 },
    text: (a, b) => `Hitting an afflicted enemy through ${a} or ${b} builds a ward worth 4% maximum HP.`,
  },
  {
    title: 'Hungry Circuit',
    effect: { type: 'ailmentLeech', value: 6 },
    text: (a, b) => `Damage against afflicted enemies from ${a} or ${b} restores 6% of that damage as HP.`,
  },
];

const WEB_KEYSTONES = {
  warrior: {
    battle: {
      name: 'The Unbroken Tempo',
      effect: { type: 'assaultCadence', cadence: 3, value: 35, cooldown: 1 },
      desc: 'Every third basic attack deals 35% more damage and reduces all skill cooldowns by 1 round.',
    },
    guard: {
      name: 'Walking Fortress',
      effect: { type: 'fortressOath', reduction: 25, drawback: 12 },
      desc: 'Take 25% less damage, but deal 12% less damage. Defense becomes a permanent battle stance.',
    },
    berserker: {
      name: 'Red Horizon',
      effect: { type: 'bloodFrenzy', threshold: 50, echo: 70, incoming: 15 },
      desc: 'Below 50% HP, attacks echo for 70% damage. You take 15% more damage at all times.',
    },
    warlord: {
      name: 'Doctrine of Many Blades',
      effect: { type: 'actionWeave', value: 35 },
      desc: 'Changing action type between rounds empowers the new action by 35%. Repeating an action breaks the chain.',
    },
  },
  mage: {
    pyre: {
      name: 'Crown of Living Cinders',
      effect: { type: 'pyreSovereign', value: 30 },
      desc: 'Fire hits always Burn and deal 30% more damage to Burning enemies.',
    },
    frost: {
      name: 'The Winter Throne',
      effect: { type: 'frozenDominion', value: 35 },
      desc: 'Ice hits always Chill, Freeze ordinary enemies at 2 Chill, and deal 35% more damage to chilled targets.',
    },
    storm: {
      name: 'Heaven-Split Circuit',
      effect: { type: 'stormSovereign', value: 38 },
      desc: 'Lightning hits arc 38% of their damage into every other living enemy.',
    },
    chrono: {
      name: 'Borrowed Tomorrow',
      effect: { type: 'timeDebt', cadence: 4, hpCostPct: 5 },
      desc: 'Every fourth skill repeats immediately, but the repetition costs 5% maximum HP.',
    },
  },
  rogue: {
    duel: {
      name: 'Perfect Answer',
      effect: { type: 'perfectRiposte', value: 80 },
      desc: 'Guarded or completely evaded hits immediately return 80% of their damage to the attacker.',
    },
    shadow: {
      name: 'The Last Unseen Step',
      effect: { type: 'shadowExecution', threshold: 30, bossBonus: 35 },
      desc: 'Critical hits execute ordinary enemies below 30% HP and deal 35% more damage to bosses in that range.',
    },
    venom: {
      name: 'Death Without End',
      effect: { type: 'toxinSovereign', value: 14, detonate: 70 },
      desc: 'Poison hits always add Toxin, gain 14% damage per existing stack, and detonate at maximum stacks.',
    },
    raider: {
      name: 'No Pause for the Dead',
      effect: { type: 'killMomentum', healPct: 7, cooldown: 1 },
      desc: 'Kills restore 7% maximum HP and reduce every skill cooldown by 1 round.',
    },
  },
  paladin: {
    devotion: {
      name: 'The Last Guardian',
      effect: { type: 'reviveOncePerFight', value: 35 },
      desc: 'Once per battle, fatal damage restores you to 35% maximum HP instead.',
    },
    wrath: {
      name: 'Judgment Without Mercy',
      effect: { type: 'judgmentDoctrine', value: 45, afflicted: 20 },
      desc: 'Deal up to 45% more damage as HP is lost, plus 20% more against afflicted enemies.',
    },
    aegis: {
      name: 'Bastion Retort',
      effect: { type: 'perfectRiposte', value: 110 },
      desc: 'Guarded or completely evaded hits immediately return 110% of their damage to the attacker.',
    },
    inquisitor: {
      name: 'Purging Radiance',
      effect: { type: 'purgeDoctrine', value: 30 },
      desc: 'Holy and Dark hits always trigger their secondary effect and deal 30% more damage to afflicted enemies.',
    },
  },
  elementalist: {
    flame: {
      name: 'Heart of the First Pyre',
      effect: { type: 'pyreSovereign', value: 38 },
      desc: 'Fire hits always Burn and deal 38% more damage to Burning enemies.',
    },
    frost: {
      name: 'Absolute Winter',
      effect: { type: 'frozenDominion', value: 42 },
      desc: 'Ice hits always Chill, Freeze ordinary enemies at 2 Chill, and deal 42% more damage to chilled targets.',
    },
    storm: {
      name: 'A Sky Made Weapon',
      effect: { type: 'stormSovereign', value: 48 },
      desc: 'Lightning hits arc 48% of their damage into every other living enemy.',
    },
    earth: {
      name: 'The Mountain Answers',
      effect: { type: 'stoneConduit', value: 32, reduction: 12 },
      desc: 'Hits gain bonus damage equal to 32% of your lower defense; incoming damage is reduced by 12%.',
    },
  },
  necromancer: {
    blight: {
      name: 'The Patient Apocalypse',
      effect: { type: 'toxinSovereign', value: 12, detonate: 85 },
      desc: 'Poison hits always add Toxin, gain 12% damage per existing stack, and violently detonate at maximum stacks.',
    },
    soul: {
      name: 'Covenant of Open Veins',
      effect: { type: 'soulCovenant', value: 7 },
      desc: 'Damage against afflicted enemies restores 7% of damage as HP and 3% as MP.',
    },
    grave: {
      name: 'Empire of the Fallen',
      effect: { type: 'killMomentum', healPct: 5, cooldown: 2 },
      desc: 'Kills restore 5% maximum HP and reduce every skill cooldown by 2 rounds.',
    },
    bone: {
      name: 'The Ivory Citadel',
      effect: { type: 'fortressOath', reduction: 30, drawback: 15 },
      desc: 'Take 30% less damage, but deal 15% less damage. Your bones become the dungeon wall.',
    },
  },
};

function routeProfile(route) {
  const elementalSkill = [...route.nodes].reverse().find((node) => node.forcedElement);
  return {
    element: elementalSkill?.forcedElement || 'physical',
    magic: route.nodes.some((node) => node.magic),
  };
}

function webPoint(radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.round(SKILL_WEB_LAYOUT.center.x + Math.cos(radians) * radius),
    y: Math.round(SKILL_WEB_LAYOUT.center.y + Math.sin(radians) * radius),
  };
}

function webNodePosition(index, routeAngle) {
  let cursor = 0;
  for (let ring = 0; ring < SKILL_WEB_LAYOUT.rings.length; ring++) {
    const layout = SKILL_WEB_LAYOUT.rings[ring];
    if (index < cursor + layout.offsets.length) {
      const point = webPoint(layout.radius, routeAngle + layout.offsets[index - cursor]);
      return { ...point, webRing: ring };
    }
    cursor += layout.offsets.length;
  }
  return { ...webPoint(1030, routeAngle), webRing: SKILL_WEB_LAYOUT.rings.length - 1 };
}

function buildSkillWeb(classId, className, statMods, routes, routeNodes) {
  const coreId = `${classId}_web_core`;
  const coreStat = Object.entries(statMods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'atk';
  const core = {
    id: coreId,
    name: `${className} Instinct`,
    kind: 'passive',
    effect: { type: 'statBonus', stat: coreStat, value: 2 },
    desc: `The center of the web. +2 ${coreStat.toUpperCase()}.`,
    cost: 0,
    tier: 0,
    branch: 'Class Core',
    region: null,
    regions: [],
    requires: null,
    choiceGroup: null,
    nodeRole: 'core',
    tags: ['Core', coreStat.toUpperCase()],
    ...SKILL_WEB_LAYOUT.center,
  };
  const buckets = routes.map((route, routeIndex) => {
    const angle = SKILL_WEB_LAYOUT.routeAngles[routeIndex],
      profile = routeProfile(route),
      nodes = routeNodes.filter((node) => node.region === route.id);
    for (let index = 0; index < nodes.length; index++) {
      Object.assign(nodes[index], webNodePosition(index, angle));
      nodes[index].routeIndex = routeIndex;
      const mechanic = nodes[index].effect?.type || nodes[index].action;
      nodes[index].tags = [
        nodes[index].kind === 'active' ? 'Active' : 'Passive',
        profile.element,
        mechanic?.replace(/([a-z])([A-Z])/g, '$1 $2'),
      ].filter(Boolean);
      if (index === 0) nodes[index].requires = coreId;
    }
    const label = webPoint(1310, angle),
      zone = webPoint(650, angle);
    return {
      id: route.id,
      name: route.name,
      angle,
      element: profile.element,
      magic: profile.magic,
      nodes,
      labelX: label.x,
      labelY: label.y,
      zoneX: zone.x,
      zoneY: zone.y,
    };
  });
  const hybrids = buckets.map((bucket, index) => {
    const next = buckets[(index + 1) % buckets.length],
      archetype = WEB_HYBRID_ARCHETYPES[index],
      point = webPoint(620, bucket.angle + 45),
      id = `${classId}_web_hybrid_${index + 1}`,
      hybrid = {
        id,
        name: `${archetype.title}: ${bucket.name} / ${next.name}`,
        kind: 'passive',
        effect: { ...archetype.effect },
        desc: archetype.text(bucket.name, next.name),
        cost: 4,
        tier: 7,
        branch: `${bucket.name} + ${next.name}`,
        region: null,
        regions: [bucket.id, next.id],
        requiresAll: [bucket.nodes[14].id, next.nodes[14].id],
        choiceGroup: null,
        nodeRole: 'hybrid',
        tags: ['Hybrid', bucket.element, next.element],
        x: point.x,
        y: point.y,
        webRing: 3,
      };
    for (const exit of [bucket.nodes[22], next.nodes[23]]) {
      exit.requiresAny = [...new Set([exit.requires, id].filter(Boolean))];
    }
    return hybrid;
  });
  const keystones = buckets.map((bucket) => {
    const blueprint = WEB_KEYSTONES[classId]?.[bucket.id] || {
        name: `${bucket.name} Apotheosis`,
        effect: { type: 'bonusDamagePct', value: 25 },
        desc: `${bucket.name} damage is increased by 25%.`,
      },
      point = webPoint(1220, bucket.angle);
    return {
      id: `${classId}_${bucket.id}_keystone`,
      name: blueprint.name,
      kind: 'passive',
      effect: { ...blueprint.effect },
      desc: blueprint.desc,
      cost: 5,
      tier: 12,
      branch: bucket.name,
      region: bucket.id,
      regions: [bucket.id],
      requiresAll: [bucket.nodes[25].id, bucket.nodes[29].id],
      choiceGroup: null,
      nodeRole: 'keystone',
      tags: ['Keystone', bucket.element, bucket.name],
      x: point.x,
      y: point.y,
      webRing: 6,
    };
  });
  return {
    nodes: [core, ...routeNodes, ...hybrids, ...keystones],
    meta: {
      version: 2,
      width: SKILL_WEB_LAYOUT.width,
      height: SKILL_WEB_LAYOUT.height,
      center: { ...SKILL_WEB_LAYOUT.center },
      coreId,
      regions: buckets.map(({ nodes, ...region }) => region),
      hybridIds: hybrids.map((node) => node.id),
      keystoneIds: keystones.map((node) => node.id),
    },
  };
}

function makeClass(id, name, icon, desc, statMods, routes, innate = {}) {
  const choiceGroup = null;
  const innatePassive = innate.passive
    ? { ...innate.passive, id: `${id}_innate_passive`, kind: 'passive' }
    : null;
  const innateActive = innate.active ? { ...innate.active, id: `${id}_innate_active`, kind: 'active' } : null;
  const routeNodes = routes.flatMap((route) =>
    refineRouteNodes(id, route, [
      ...route.nodes,
      ...advancedNodes(route),
      ...expansionNodes(route),
      ...deepExpansionNodes(route),
      ...elementalNodes(route),
    ]).map((node, index) => {
      const isBranch = index >= 10;
      const branchIndex = index - 10;
      const anchors = [1, 2, 3, 4, 5, 6, 7, 8, 2, 3, 4, 5, 6, 7, 8, 9, 4, 5, 7, 8];
      const outer = branchIndex >= 8;
      const ailmentBranch = branchIndex >= 16;
      const cost = isBranch
        ? ailmentBranch
          ? branchIndex === 19
            ? 3
            : 2
          : outer
            ? branchIndex >= 14
              ? 3
              : 2
            : branchIndex >= 6
              ? 2
              : 1
        : index >= 8
          ? 3
          : index >= 4
            ? 2
            : 1;
      return {
        ...node,
        id: isBranch ? `${id}_${route.id}_x${branchIndex + 1}` : `${id}_${route.id}_${index + 1}`,
        tier: isBranch ? anchors[branchIndex] + 1 : index + 1,
        cost,
        cooldown: node.kind === 'active' ? U.clamp(2 + Math.floor((cost - 1) / 2), 2, 4) : undefined,
        branch: route.name,
        region: route.id,
        regions: [route.id],
        requires: isBranch
          ? branchIndex % 2
            ? `${id}_${route.id}_x${branchIndex}`
            : ailmentBranch
              ? `${id}_${route.id}_x${branchIndex - 7}`
              : outer
                ? `${id}_${route.id}_x${branchIndex - 7}`
                : `${id}_${route.id}_${anchors[branchIndex]}`
          : index
            ? `${id}_${route.id}_${index}`
            : null,
        choiceGroup: null,
        nodeRole: isBranch
          ? [15, 19].includes(branchIndex)
            ? 'capstone'
            : node.kind === 'active'
              ? 'notable'
              : 'minor'
          : index === 9
            ? 'capstone'
            : index === 0
              ? 'root'
              : 'spine',
      };
    }),
  );
  const web = buildSkillWeb(id, name, statMods, routes, routeNodes);
  return {
    id,
    name,
    icon,
    desc,
    statMods,
    innatePassive,
    innateActive,
    skillTree: web.nodes,
    skillWeb: web.meta,
  };
}

const CLASSES = [
  makeClass(
    'warrior',
    'Warrior',
    '⚔️',
    'A frontline fighter who can master one discipline or weave several together.',
    { atk: 4, def: 3, hitRes: 2 },
    [
      {
        id: 'battle',
        name: 'Battlemaster',
        nodes: [
          A('Cleave', 6, 'aoe', 'Strike every enemy for 70% weapon damage.', {
            power: 0.7,
          }),
          P('Weapon Drill', { type: 'statBonus', stat: 'atk', value: 5 }, '+5 ATK permanently.'),
          A('Sundering Blow', 10, 'debuff', "Shatter a foe's guard, reducing DEF by 22%.", {
            debuffStat: 'def',
            debuffValue: 22,
          }),
          P("Killer's Rhythm", { type: 'critChanceBonus', value: 12 }, '+12% critical-hit chance.'),
          A("Executioner's Arc", 18, 'aoe', 'A decisive sweep for 145% weapon damage.', {
            power: 1.45,
            executeThreshold: 18,
          }),
        ],
      },
      {
        id: 'guard',
        name: 'Iron Guard',
        nodes: [
          A('Shield Bash', 5, 'debuff', "Reduce a foe's ATK by 18%.", {
            debuffStat: 'atk',
            debuffValue: 18,
          }),
          P('Ironhide', { type: 'statBonus', stat: 'def', value: 7 }, '+7 DEF permanently.'),
          A('Hold the Line', 9, 'buff', '+25% DEF for the battle.', {
            buffStat: 'def',
            buffValue: 25,
          }),
          P('Barbed Plate', { type: 'thorns', value: 14 }, 'Reflect 14% of incoming damage.'),
          A('Last Stand', 16, 'heal', 'Recover 42% of maximum HP.', {
            healPct: 42,
          }),
        ],
      },
      {
        id: 'berserker',
        name: 'Berserker',
        nodes: [
          A('Bloodlust', 7, 'nuke', 'A flaming strike for 105% weapon damage.', {
            power: 1.05,
            forcedElement: 'fire',
          }),
          P('Battle Scars', { type: 'lowHpDamageBonus', value: 16 }, '+16% damage below half HP.'),
          A('Warcry', 11, 'aoe', 'Burn all enemies for 80% weapon damage.', {
            power: 0.8,
            forcedElement: 'fire',
          }),
          P('Furyborn', { type: 'comboDamage', value: 6 }, 'Each consecutive hit gains 6% damage.'),
          A('Apex Rage', 20, 'nuke', 'A brutal 195% fire strike.', {
            power: 1.95,
            forcedElement: 'fire',
            executeThreshold: 22,
          }),
        ],
      },
      {
        id: 'warlord',
        name: 'Warlord',
        nodes: [
          A('Rallying Cry', 7, 'buff', '+24% ATK for the battle.', {
            buffStat: 'atk',
            buffValue: 24,
          }),
          P(
            'Commanding Presence',
            { type: 'statBonus', stat: 'hitRes', value: 6 },
            '+6 HIT RES permanently.',
          ),
          A('Crushing Advance', 11, 'nuke', 'A 130% weapon-damage strike.', {
            power: 1.3,
          }),
          P('Giant Slayer', { type: 'bossDamageBonus', value: 18 }, '+18% damage to bosses.'),
          A("Conqueror's Banner", 18, 'buff', '+42% ATK for the battle.', {
            buffStat: 'atk',
            buffValue: 42,
          }),
        ],
      },
    ],
    {
      passive: {
        name: 'Unshakable Resolve',
        effect: { type: 'guardFury', value: 12 },
        desc: 'Every time you Defend, also gain +12% ATK for the rest of the battle (stacks).',
      },
      active: {
        name: "Warrior's Second Wind",
        manaCost: 6,
        cooldown: 4,
        action: 'heal',
        healPct: 22,
        desc: 'Restore 22% of your maximum HP. Available regardless of discipline.',
      },
    },
  ),
  makeClass(
    'mage',
    'Mage',
    '🔮',
    'A scholar of dangerous arcane disciplines.',
    { matk: 5, mdef: 2, spd: 1 },
    [
      {
        id: 'pyre',
        name: 'Pyromancer',
        nodes: [
          A('Firebolt', 8, 'nuke', 'A fire bolt for 115% magic damage.', {
            power: 1.15,
            magic: true,
            forcedElement: 'fire',
          }),
          P('Ember Mind', { type: 'statBonus', stat: 'fireDmg', value: 12 }, '+12% fire damage.'),
          A('Flame Wave', 12, 'aoe', 'Scorch all enemies for 75% magic damage.', {
            power: 0.75,
            magic: true,
            forcedElement: 'fire',
          }),
          P('Cinderheart', { type: 'critDmgBonus', value: 26 }, '+26% critical damage.'),
          A('Meteorfall', 22, 'aoe', 'Call down meteors for 165% magic damage.', {
            power: 1.65,
            magic: true,
            forcedElement: 'fire',
          }),
        ],
      },
      {
        id: 'frost',
        name: 'Cryomancer',
        nodes: [
          A('Frost Lance', 8, 'nuke', 'Pierce a foe for 110% ice damage.', {
            power: 1.1,
            magic: true,
            forcedElement: 'ice',
          }),
          P('Winter Veil', { type: 'statBonus', stat: 'iceDmg', value: 12 }, '+12% ice damage.'),
          A('Frost Nova', 12, 'aoe', 'Freeze every foe for 70% magic damage.', {
            power: 0.7,
            magic: true,
            forcedElement: 'ice',
          }),
          P('Glacial Ward', { type: 'damageCapPct', value: 16 }, 'Single hits cannot exceed 16% max HP.'),
          A('Absolute Zero', 20, 'nuke', 'A 175% ice spell that executes weakened foes.', {
            power: 1.75,
            magic: true,
            forcedElement: 'ice',
            executeThreshold: 18,
          }),
        ],
      },
      {
        id: 'storm',
        name: 'Stormcaller',
        nodes: [
          A('Shock', 8, 'nuke', 'A lightning bolt for 110% magic damage.', {
            power: 1.1,
            magic: true,
            forcedElement: 'lightning',
          }),
          P('Static Field', { type: 'stunChance', value: 8 }, '8% chance to stun on hit.'),
          A('Chain Lightning', 13, 'aoe', 'Lightning arcs for 72% magic damage.', {
            power: 0.72,
            magic: true,
            forcedElement: 'lightning',
          }),
          P('Overcharge', { type: 'critChanceBonus', value: 14 }, '+14% critical-hit chance.'),
          A("Stormlord's Call", 21, 'aoe', 'A tempest for 160% magic damage.', {
            power: 1.6,
            magic: true,
            forcedElement: 'lightning',
          }),
        ],
      },
      {
        id: 'chrono',
        name: 'Chronomancer',
        nodes: [
          A('Time Slice', 7, 'nuke', 'A precise arcane cut for 100% magic damage.', {
            power: 1,
            magic: true,
            forcedElement: 'dark',
          }),
          P('Accelerated Thought', { type: 'statBonus', stat: 'spd', value: 5 }, '+5 SPD permanently.'),
          A('Temporal Drag', 10, 'debuff', "Reduce a foe's SPD by 32%.", {
            debuffStat: 'spd',
            debuffValue: 32,
          }),
          P('Mana Loop', { type: 'manaCostReduction', value: 16 }, 'Skills cost 16% less MP.'),
          A('Epoch Surge', 18, 'buff', '+45% MATK for the battle.', {
            buffStat: 'matk',
            buffValue: 45,
          }),
        ],
      },
    ],
    {
      passive: {
        name: 'Arcane Reservoir',
        effect: { type: 'mpRegenPerTurn', value: 6 },
        desc: 'Regenerate 6 MP every round, in or out of your chosen discipline.',
      },
      active: {
        name: 'Arcane Surge',
        manaCost: 5,
        cooldown: 1,
        action: 'nuke',
        power: 0.9,
        magic: true,
        desc: "A quick 90% magic bolt in your weapon's element. Available regardless of discipline.",
      },
    },
  ),
  makeClass(
    'rogue',
    'Rogue',
    '🗡️',
    'A quick killer who crosses lethal crafts to create an answer for every opening.',
    { spd: 5, hitEff: 3 },
    [
      {
        id: 'duel',
        name: 'Duelist',
        nodes: [
          A('Quick Strike', 5, 'nuke', 'A fast 95% weapon-damage attack.', {
            power: 0.95,
          }),
          P('Fleet Footed', { type: 'statBonus', stat: 'spd', value: 6 }, '+6 SPD permanently.'),
          A('Backstab', 9, 'nuke', 'A 140% strike that executes wounded targets.', {
            power: 1.4,
            executeThreshold: 16,
          }),
          P('Deadly Precision', { type: 'critChanceBonus', value: 16 }, '+16% critical-hit chance.'),
          A("Duelist's Finale", 17, 'nuke', 'A 205% weapon-damage finisher.', {
            power: 2.05,
            executeThreshold: 25,
          }),
        ],
      },
      {
        id: 'shadow',
        name: 'Shadowblade',
        nodes: [
          A('Smoke Bomb', 6, 'debuff', "Reduce a foe's HIT EFF by 24%.", {
            debuffStat: 'hitEff',
            debuffValue: 24,
          }),
          P('Veil Step', { type: 'dodgeChance', value: 10 }, '10% chance to evade completely.'),
          A('Ambush', 10, 'nuke', 'A 125% weapon-damage strike from the dark.', { power: 1.25 }),
          P('Opportunist', { type: 'comboDamage', value: 5 }, 'Each consecutive hit gains 5% damage.'),
          A('Nightfall', 18, 'aoe', 'Strike all enemies for 115% weapon damage.', { power: 1.15 }),
        ],
      },
      {
        id: 'venom',
        name: 'Venomcrafter',
        nodes: [
          A('Venomstrike', 6, 'nuke', 'A 100% poison weapon strike.', {
            power: 1,
            forcedElement: 'poison',
          }),
          P('Toxic Veins', { type: 'statBonus', stat: 'poisonDmg', value: 12 }, '+12% poison damage.'),
          A('Epidemic', 11, 'aoe', 'Spread poison for 75% weapon damage.', {
            power: 0.75,
            forcedElement: 'poison',
          }),
          P('Lethal Chemistry', { type: 'critDmgBonus', value: 24 }, '+24% critical damage.'),
          A('Black Lotus', 18, 'nuke', 'A 180% poison strike.', {
            power: 1.8,
            forcedElement: 'poison',
            executeThreshold: 20,
          }),
        ],
      },
      {
        id: 'raider',
        name: 'Raider',
        nodes: [
          A('Dirty Trick', 5, 'debuff', "Reduce a foe's DEF by 20%.", {
            debuffStat: 'def',
            debuffValue: 20,
          }),
          P('Light Fingers', { type: 'goldFind', value: 20 }, '+20% gold found.'),
          A('Blade Flurry', 12, 'aoe', 'A flurry for 82% weapon damage.', {
            power: 0.82,
          }),
          P('Twinned Blades', { type: 'doubleHitChance', value: 14 }, '14% chance to strike twice.'),
          A("Highwayman's Gambit", 17, 'buff', '+40% ATK for the battle.', {
            buffStat: 'atk',
            buffValue: 40,
          }),
        ],
      },
    ],
    {
      passive: {
        name: "Predator's Instinct",
        effect: { type: 'critChanceBonus', value: 10 },
        desc: '+10% critical hit chance, always — no discipline required.',
      },
      active: {
        name: 'Second Chance',
        manaCost: 10,
        cooldown: 5,
        action: 'resetCooldowns',
        desc: 'Instantly clear every skill cooldown. Available regardless of discipline.',
      },
    },
  ),
  makeClass(
    'paladin',
    'Paladin',
    '🛡️',
    'A holy warrior who binds sacred oaths into a personal doctrine.',
    { def: 4, mdef: 2, hitRes: 2 },
    [
      {
        id: 'devotion',
        name: 'Devotion',
        nodes: [
          A('Smite', 7, 'nuke', 'A holy strike for 105% magic damage.', {
            power: 1.05,
            magic: true,
            forcedElement: 'holy',
          }),
          P('Devotion', { type: 'statBonus', stat: 'holyDmg', value: 12 }, '+12% holy damage.'),
          A('Lay on Hands', 10, 'heal', 'Restore 32% maximum HP.', {
            healPct: 32,
          }),
          P('Holy Vigor', { type: 'regenPerTurn', value: 9 }, 'Regenerate 9 HP each turn.'),
          A('Judgment', 19, 'nuke', 'A 185% holy execution.', {
            power: 1.85,
            magic: true,
            forcedElement: 'holy',
            executeThreshold: 18,
          }),
        ],
      },
      {
        id: 'wrath',
        name: 'Avenger',
        nodes: [
          A('Righteous Fury', 8, 'buff', '+24% ATK for the battle.', {
            buffStat: 'atk',
            buffValue: 24,
          }),
          P('Zealotry', { type: 'bossDamageBonus', value: 16 }, '+16% damage to bosses.'),
          A('Consecrated Blade', 11, 'nuke', 'A 140% holy weapon strike.', {
            power: 1.4,
            forcedElement: 'holy',
          }),
          P('Burning Zeal', { type: 'critChanceBonus', value: 12 }, '+12% critical-hit chance.'),
          A('Wrath of Heaven', 21, 'aoe', 'Holy fire for 150% magic damage.', {
            power: 1.5,
            magic: true,
            forcedElement: 'holy',
          }),
        ],
      },
      {
        id: 'aegis',
        name: 'Aegis',
        nodes: [
          A('Shield of Faith', 7, 'buff', '+28% DEF for the battle.', {
            buffStat: 'def',
            buffValue: 28,
          }),
          P('Sanctuary', { type: 'damageImmuneChance', value: 7 }, '7% chance to take no damage.'),
          A('Radiance', 12, 'aoe', 'A burst of light for 68% magic damage.', {
            power: 0.68,
            magic: true,
            forcedElement: 'holy',
          }),
          P('Bulwark', { type: 'thorns', value: 13 }, 'Reflect 13% of incoming damage.'),
          A('Divine Fortress', 17, 'heal', 'Recover 48% maximum HP.', {
            healPct: 48,
          }),
        ],
      },
      {
        id: 'inquisitor',
        name: 'Inquisitor',
        nodes: [
          A('Brand the Heretic', 7, 'debuff', "Reduce a foe's MDEF by 24%.", {
            debuffStat: 'mdef',
            debuffValue: 24,
          }),
          P('Unblinking Eye', { type: 'statBonus', stat: 'hitEff', value: 6 }, '+6 HIT EFF permanently.'),
          A('Purge', 12, 'nuke', 'A 135% holy spell.', {
            power: 1.35,
            magic: true,
            forcedElement: 'holy',
          }),
          P('Relentless Verdict', { type: 'critDmgBonus', value: 25 }, '+25% critical damage.'),
          A('Final Inquisition', 20, 'nuke', 'A 190% holy sentence.', {
            power: 1.9,
            magic: true,
            forcedElement: 'holy',
            executeThreshold: 24,
          }),
        ],
      },
    ],
    {
      passive: {
        name: 'Sanctified Guard',
        effect: { type: 'guardMitigationBonus', value: 15 },
        desc: 'Defend mitigates an additional 15 percentage points of incoming damage, always.',
      },
      active: {
        name: 'Cleansing Light',
        manaCost: 8,
        cooldown: 4,
        action: 'cleanse',
        desc: 'Strip every debuff and damage-over-time effect off yourself. Available regardless of discipline.',
      },
    },
  ),
  makeClass(
    'elementalist',
    'Elementalist',
    '🌪️',
    'A conduit who can deepen one element or make several collide.',
    { matk: 4, spd: 2, hitEff: 1 },
    [
      {
        id: 'flame',
        name: 'Flamecaller',
        nodes: [
          A('Ignite', 7, 'nuke', 'A 105% fire spell.', {
            power: 1.05,
            magic: true,
            forcedElement: 'fire',
          }),
          P('Ember Core', { type: 'statBonus', stat: 'fireDmg', value: 14 }, '+14% fire damage.'),
          A('Wildfire', 12, 'aoe', 'Flames spread for 78% magic damage.', {
            power: 0.78,
            magic: true,
            forcedElement: 'fire',
          }),
          P('Combustion', { type: 'bonusDamagePct', value: 12 }, '+12% damage dealt.'),
          A('Inferno', 21, 'aoe', 'An inferno for 170% magic damage.', {
            power: 1.7,
            magic: true,
            forcedElement: 'fire',
          }),
        ],
      },
      {
        id: 'frost',
        name: 'Frostweaver',
        nodes: [
          A('Frostbolt', 7, 'nuke', 'A 105% ice spell.', {
            power: 1.05,
            magic: true,
            forcedElement: 'ice',
          }),
          P('Permafrost', { type: 'statBonus', stat: 'iceDmg', value: 14 }, '+14% ice damage.'),
          A('Blizzard', 12, 'aoe', 'A blizzard for 76% magic damage.', {
            power: 0.76,
            magic: true,
            forcedElement: 'ice',
          }),
          P('Glacial Armor', { type: 'damageCapPct', value: 15 }, 'Single hits cannot exceed 15% max HP.'),
          A("Winter's End", 20, 'nuke', 'A 180% ice execution.', {
            power: 1.8,
            magic: true,
            forcedElement: 'ice',
            executeThreshold: 20,
          }),
        ],
      },
      {
        id: 'storm',
        name: 'Tempest',
        nodes: [
          A('Spark', 7, 'nuke', 'A 105% lightning spell.', {
            power: 1.05,
            magic: true,
            forcedElement: 'lightning',
          }),
          P(
            'Charged Blood',
            { type: 'statBonus', stat: 'lightningDmg', value: 14 },
            '+14% lightning damage.',
          ),
          A('Thunderhead', 12, 'aoe', 'Lightning for 76% magic damage.', {
            power: 0.76,
            magic: true,
            forcedElement: 'lightning',
          }),
          P('Living Current', { type: 'doubleHitChance', value: 12 }, '12% chance to strike twice.'),
          A('Cataclysm', 21, 'aoe', 'A storm for 165% magic damage.', {
            power: 1.65,
            magic: true,
            forcedElement: 'lightning',
          }),
        ],
      },
      {
        id: 'earth',
        name: 'Geomancer',
        nodes: [
          A('Tremor', 6, 'nuke', 'An earth strike for 95% magic damage.', {
            power: 0.95,
            magic: true,
            forcedElement: 'physical',
          }),
          P('Stoneskin', { type: 'statBonus', stat: 'def', value: 8 }, '+8 DEF permanently.'),
          A('Quake', 11, 'aoe', 'A quake for 70% magic damage.', {
            power: 0.7,
            magic: true,
            forcedElement: 'physical',
          }),
          P('Bulwark of Stone', { type: 'thorns', value: 12 }, 'Reflect 12% of incoming damage.'),
          A('Worldbreaker', 19, 'nuke', 'A 175% earth spell.', {
            power: 1.75,
            magic: true,
            forcedElement: 'physical',
          }),
        ],
      },
    ],
    {
      passive: {
        name: 'Arcane Momentum',
        effect: { type: 'arcaneMomentum', value: 3 },
        desc: 'Each hit you land grants +3% MATK for the rest of the battle (stacks), regardless of discipline.',
      },
      active: {
        name: 'Elemental Shift',
        manaCost: 7,
        cooldown: 2,
        action: 'nukeRandomElement',
        power: 1.0,
        magic: true,
        desc: 'A 100% magic bolt in a random element. Available regardless of discipline.',
      },
    },
  ),
  makeClass(
    'necromancer',
    'Necromancer',
    '☠️',
    'A master of death who stitches forbidden arts into a living covenant.',
    { matk: 3, mdef: 3, hitRes: 2 },
    [
      {
        id: 'blight',
        name: 'Blight',
        nodes: [
          A('Curse', 7, 'nuke', 'A withering 100% dark spell.', {
            power: 1,
            magic: true,
            forcedElement: 'dark',
          }),
          P('Decay', { type: 'statBonus', stat: 'darkDmg', value: 14 }, '+14% dark damage.'),
          A('Plague', 11, 'aoe', 'A spreading disease for 70% magic damage.', {
            power: 0.7,
            magic: true,
            forcedElement: 'poison',
          }),
          P('Withering Mark', { type: 'bossDamageBonus', value: 16 }, '+16% damage to bosses.'),
          A('Death Mark', 19, 'nuke', 'A 175% dark execution.', {
            power: 1.75,
            magic: true,
            forcedElement: 'dark',
            executeThreshold: 22,
          }),
        ],
      },
      {
        id: 'soul',
        name: 'Soulbinder',
        nodes: [
          A('Soul Drain', 6, 'nuke', 'Drain life for 95% magic damage.', {
            power: 0.95,
            magic: true,
            forcedElement: 'dark',
          }),
          P('Leeching Touch', { type: 'lifesteal', value: 9 }, 'Heal for 9% of damage dealt.'),
          A('Soulchain', 12, 'nuke', 'Bind a foe for 130% magic damage.', {
            power: 1.3,
            magic: true,
            forcedElement: 'dark',
          }),
          P('Dark Pact', { type: 'manaCostReduction', value: 17 }, 'Skills cost 17% less MP.'),
          A('Soul Harvest', 20, 'aoe', 'Reap all enemies for 125% magic damage.', {
            power: 1.25,
            magic: true,
            forcedElement: 'dark',
          }),
        ],
      },
      {
        id: 'grave',
        name: 'Gravecaller',
        nodes: [
          A('Reap', 8, 'nuke', 'A 105% dark execution spell.', {
            power: 1.05,
            magic: true,
            forcedElement: 'dark',
            executeThreshold: 12,
          }),
          P('Graverobber', { type: 'goldFind', value: 22 }, '+22% gold found.'),
          A('Soul Siphon', 13, 'nuke', 'A 140% dark spell.', {
            power: 1.4,
            magic: true,
            forcedElement: 'dark',
          }),
          P('Forbidden Lore', { type: 'xpBonus', value: 18 }, '+18% experience earned.'),
          A("Death's Domain", 20, 'aoe', 'The dead strike for 130% magic damage.', {
            power: 1.3,
            magic: true,
            forcedElement: 'dark',
          }),
        ],
      },
      {
        id: 'bone',
        name: 'Bonewarden',
        nodes: [
          A('Bone Spear', 7, 'nuke', 'A 105% physical magic strike.', {
            power: 1.05,
            magic: true,
            forcedElement: 'physical',
          }),
          P('Ossuary Armor', { type: 'statBonus', stat: 'mdef', value: 7 }, '+7 MDEF permanently.'),
          A('Grave Shackles', 10, 'debuff', "Reduce a foe's SPD by 28%.", {
            debuffStat: 'spd',
            debuffValue: 28,
          }),
          P(
            'Undying Bond',
            { type: 'reviveOncePerFight', value: 30 },
            'Survive one killing blow each battle at 30% HP.',
          ),
          A('Bone Colossus', 18, 'buff', '+44% MATK for the battle.', {
            buffStat: 'matk',
            buffValue: 44,
          }),
        ],
      },
    ],
    {
      passive: {
        name: "Death's Due",
        effect: { type: 'manaOnKill', value: 20 },
        desc: 'Restore 20% of your max MP on every killing blow, regardless of discipline.',
      },
      active: {
        name: 'Soul Tap',
        manaCost: 0,
        cooldown: 3,
        action: 'manaTap',
        hpCostPct: 8,
        manaPct: 30,
        desc: 'Trade 8% of your max HP for 30% of your max MP. Available regardless of discipline.',
      },
    },
  ),
];

const CLASS_BY_ID = Object.fromEntries(CLASSES.map((c) => [c.id, c]));
