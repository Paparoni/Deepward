/* ============================================================
  RENDERING (vanilla DOM strings — re-render on every action)
   ============================================================ */
function esc(s){ return String(s); }

function animatedBar(state,key,pct,kind){
  state.ui.barHistory ||= {};
  const now=U.clamp(pct,0,100), before=state.ui.barHistory[key]??now;
  state.ui.barHistory[key]=now;
  const changed=Math.abs(now-before)>.01;
  return `<div class="bar-fill ${kind}${changed?' bar-changing':''}" style="width:${now}%;--bar-from:${before}%;--bar-to:${now}%"></div>`;
}

function renderStatBlock(state, weaponElement){
  const derived = state.derived;
  const rows = CORE_STATS.map(stat=>{
    const mods = Engine.statModifiers(state,stat.id);
    const pct = mods.reduce((sum,m)=>sum+(m.pct||0),0);
    const flat = mods.reduce((sum,m)=>sum+(m.flat||0),0);
    const details = mods.map(m=>`${m.name}: ${m.pct!=null?U.fmtSigned(m.pct)+'%':U.fmtSigned(m.flat)+' '+stat.short}`).join('\n');
    const badges = `${pct?`<span class="stat-mod ${pct<0?'negative':'positive'}" title="${U.escapeHtml(details)}">${U.fmtSigned(pct)}%</span>`:''}${flat?`<span class="stat-mod ${flat<0?'negative':'positive'}" title="${U.escapeHtml(details)}">${U.fmtSigned(flat)}</span>`:''}`;
    const value = state.mode==='combat' ? Engine.effectiveStat(state,stat.id) : derived[stat.id];
    return `<div class="stat-row"><span>${stat.short}</span><b>${value} ${badges}</b></div>`;
  }).join('');
  const elemRows = ELEMENT_STATS.map(s=>{
    const active = s.element===weaponElement;
    return `<div class="stat-row" style="${active?'color:var(--ember)':''}"><span>${s.short}${active?' ★':''}</span><b>+${derived[s.id]||0}%</b></div>`;
  }).join('');
  const traits = derived.traits.map(t=>`<span class="trait-tag" title="${typeof t.desc==='function'?'':t.desc}">${t.name}</span>`).join('');
  return `
    <div class="statsheet">
      ${rows}
      <div class="panel-title" style="border:none;padding:10px 0 4px;font-size:10.5px;">Bonus Damage <span class="small">(★ active with your weapon)</span></div>
      ${elemRows}
      ${derived.traits.length? `<div style="margin-top:8px;">${traits}</div>`:''}
    </div>`;
}

function tierGlowStyle(tierId){
  const t = TIER_BY_ID[tierId];
  return `style="--glow:${t.color};border-color:${t.color}"`;
}

function renderItemCard(item, actions){
  const t = TIER_BY_ID[item.tier];
  const coreEntries = Object.entries(item.stats).filter(([k])=>!k.endsWith('Dmg'));
  const elemEntries = Object.entries(item.stats).filter(([k])=>k.endsWith('Dmg'));
  const statLines = coreEntries.map(([k,v])=>{
    const s = STAT_BY_ID[k];
    return `<div>${s.short}: ${U.fmtSigned(v)}</div>`;
  }).join('');
  const bonusLines = elemEntries.map(([k,v])=>{
    const s = STAT_BY_ID[k];
    return `<div>${s.short}: +${v}%</div>`;
  }).join('');
  const traitLines = item.uniqueTraits.map(t2=>`<div class="item-trait uniquetrait">✦ ${t2.name} — ${t2.desc}</div>`).join('');
  const mythicLine = item.mythicTrait ? `<div class="item-trait mythictrait">★ ${item.mythicTrait.name} — ${item.mythicTrait.desc}</div>` : '';
  const glowClass = item.tier==='mythic_legendary' ? 'tier-glow mythic-border' : (['unique','legendary'].includes(item.tier) ? 'tier-glow' : '');
  return `
    <div class="item-card ${glowClass}" ${tierGlowStyle(item.tier)}>
      <div class="item-name" style="color:${t.color}">${item.name}</div>
      <div class="item-meta">${t.name.toUpperCase()} · ${item.slotLabel} · ilvl ${item.ilvl}${item.slot==='weapon'?' · '+item.element.toUpperCase()+' DMG':''}</div>
      <div class="item-stats">${statLines || '<span class="small">(no core stats)</span>'}</div>
      ${elemEntries.length? `<div class="item-stats" style="margin-top:5px;color:var(--ember)"><b>Bonus Damage:</b>${bonusLines}</div>` : ''}
      ${traitLines}${mythicLine}
      ${actions? `<div class="item-actions">${actions}</div>` : ''}
    </div>`;
}

function renderHud(s){
  const d = s.derived;
  const xpNeed = BALANCE.xpToNext(s.player.level);
  const diffLabel = s.dungeon ? BALANCE.difficulties[s.dungeon.difficultyId].label : '';
  return `
  <div class="panel hud">
    <div>
      <div class="hud-name">${s.player.name}</div>
      <div class="hud-sub">Level ${s.player.level} Delver</div>
    </div>
    <div class="bar-wrap">
      <div class="bar-label"><span>HP</span><span>${s.player.hp}/${d.maxHp}</span></div>
      <div class="bar-track">${animatedBar(s,'player-hp',s.player.hp/d.maxHp*100,'bar-hp')}</div>
    </div>
    <div class="bar-wrap">
      <div class="bar-label"><span>MP</span><span>${s.player.mp}/${d.maxMp}</span></div>
      <div class="bar-track">${animatedBar(s,'player-mp',s.player.mp/d.maxMp*100,'bar-mp')}</div>
    </div>
    <div class="bar-wrap">
      <div class="bar-label"><span>XP</span><span>${s.player.xp}/${xpNeed}</span></div>
      <div class="bar-track">${animatedBar(s,'player-xp',s.player.xp/xpNeed*100,'bar-xp')}</div>
    </div>
    ${diffLabel? `<div class="hud-diff">${diffLabel}</div>`:''}
    <div class="hud-gold">⛁ ${s.player.gold} gold</div>
  </div>`;
}

function slotTooltip(slot, item){
  if(!item) return `${slot.label} — empty. Click to equip something.`;
  const t = TIER_BY_ID[item.tier];
  const coreEntries = Object.entries(item.stats).filter(([k])=>!k.endsWith('Dmg'));
  const elemEntries = Object.entries(item.stats).filter(([k])=>k.endsWith('Dmg'));
  const statLines = coreEntries.map(([k,v])=>`${STAT_BY_ID[k].short} ${U.fmtSigned(v)}`).join(', ');
  const bonusLines = elemEntries.map(([k,v])=>`${STAT_BY_ID[k].short} +${v}%`).join(', ');
  const traitLines = item.uniqueTraits.map(t2=>`${t2.name}: ${t2.desc}`).join(' | ');
  const mythicLine = item.mythicTrait ? `${item.mythicTrait.name}: ${item.mythicTrait.desc}` : '';
  return [
    `${item.name} (${t.name})`,
    statLines,
    bonusLines,
    traitLines,
    mythicLine,
    'Click to view, remove, or change.',
  ].filter(Boolean).join('\n');
}

function renderSlots(s){
  const html = SLOTS.map(slot=>{
    const item = s.equipment[slot.id];
    const t = item ? TIER_BY_ID[item.tier] : null;
    return `<div class="slot" onclick="onSlotClick('${slot.id}')" title="${U.escapeHtml(slotTooltip(slot, item))}">
      <div class="slot-label">${slot.label}</div>
      ${item ? `<div class="slot-item" style="color:${t.color}">${item.name}</div>` : `<div class="slot-empty">— empty —</div>`}
    </div>`;
  }).join('');
  const tabs = `<div class="panel-tabs">
      <span class="panel-tab" onclick="toggleSkills()">Skills <span class="tab-count">${s.player.skillPoints}</span></span>
      <span class="panel-tab" onclick="toggleCrafting()">Soulforge <span class="tab-count">${s.player.recipes.length}/${MYTHIC_RECIPES.length}</span></span>
      <span class="panel-tab" onclick="toggleInventory()">Inventory <span class="tab-count">${s.inventory.length}</span></span>
    </div>`;
  return `<div class="panel">
      <div class="panel-title">Equipment</div>
      ${tabs}
      <div class="slots">${html}</div>
    </div>`;
}

function renderDepthTrack(s){
  if(!s.dungeon) return '';
  const nodes = s.dungeon.roomTypes.map((type,i)=>{
    let cls='depth-node';
    if(i<s.dungeon.currentIndex) cls+=' done';
    else if(i===s.dungeon.currentIndex) cls+=' current';
    if(type==='boss') cls+=' boss';
    return `<div class="${cls}" title="${type}"></div>`;
  }).join('');
  return `<div class="depth-track">${nodes}</div>`;
}

function renderLog(s){
  return `<div class="log-feed">${s.log.map(l=>`<p class="log-${l.cls}">${l.html}</p>`).join('')}</div>`;
}

function renderCombat(s){
  const c = s.combat;
  const monsterHtml = c.monsters.map(m=>{
    const targeted = m.hp>0 && m.uid===c.targetUid;
    const clickable = m.hp>0;
    const classes = ['combatant', m.hp<=0?'dead':'', targeted?'targeted':'', m._charging?'charging':'', c.activeActor===m.uid?'acting':''].filter(Boolean).join(' ');
    const chargeName = m._chargingMove ? m._chargingMove.name : 'a heavy blow';
    return `
    <div class="${classes}" ${clickable?`onclick="onSelectTarget('${m.uid}')" title="Target ${m.name}"`:''}>
      <div class="combatant-name">${m.icon} ${m.name}${targeted?' <span class="target-mark">🎯</span>':''}</div>
      <div class="enemy-element">${m.element.toUpperCase()} AFFINITY</div>
      <div class="enemy-identity" title="${U.escapeHtml(m.identityDesc||m.flavor)}">${U.escapeHtml(m.identity||'Skirmisher')}</div>
      <div class="bar-track" style="margin-top:4px;">${animatedBar(s,`monster-${m.uid}`,m.hp/m.maxHp*100,'bar-hp')}</div>
      <div class="combatant-hp-num">${Math.max(0,m.hp)}/${m.maxHp} HP</div>
      ${m._charging? `<div class="charge-tag">⚡ Channeling <b>${U.escapeHtml(chargeName)}</b> — Defend or burst it down!</div>` : ''}
    </div>`;
  }).join('');
  const alive = c.monsters.some(m=>m.hp>0);

  // initiative preview for this round — mirrors the sort resolveRound() uses,
  // without the per-round jitter (the jitter can swap close ties in practice).
  const order = [
    {name:'You', spd: Engine.effectiveStat(s,'spd'), you:true},
    ...c.monsters.filter(m=>m.hp>0).map(m=>({name:m.name, spd:m.spd, icon:m.icon})),
  ].sort((a,b)=>b.spd-a.spd);
  const orderHtml = order.map(o=>`<span class="init-chip${o.you?' init-you':''}">${o.you?'🧍':o.icon} ${o.you?'You':o.name}</span>`).join('<span class="init-arrow">→</span>');

  // player-facing affliction tags: negative buffs (monster debuffs) plus active DoTs
  const debuffTags = c.buffs.filter(b=>b.pct<0).map(b=>`<span class="affliction-tag bad-tag">${U.escapeHtml(b.name)}: ${b.pct}% ${STAT_BY_ID[b.stat]?.short||b.stat}</span>`);
  const dotTags = c.playerDots.map(d=>`<span class="affliction-tag bad-tag">${U.escapeHtml(d.name)}: ${d.dmgPerTurn}/turn (${d.turnsLeft} left)</span>`);
  const afflictionRow = (debuffTags.length||dotTags.length) ? `<div class="affliction-row">${debuffTags.join('')}${dotTags.join('')}</div>` : '';

  const cls = CLASS_BY_ID[s.player.classId];
  const activeSkills = [
    ...(cls.innateActive ? [cls.innateActive] : []),
    ...cls.skillTree.filter(sk=>sk.kind==='active' && s.player.unlockedSkills.includes(sk.id)),
  ];
  const skillButtons = activeSkills.map(sk=>{
    const cd = s.player.skillCooldowns[sk.id]||0;
    const manaReduction = Math.min(75,s.derived.traits.filter(t=>t.type==='manaCostReduction').reduce((sum,t)=>sum+t.value,0));
    const cost = Math.max(0,Math.round(sk.manaCost*(1-manaReduction/100)));
    const disabled = !alive || s.player.mp < cost || cd>0 || c.resolving;
    const status = cd>0 ? `Ready in ${cd} round${cd===1?'':'s'}` : s.player.mp<cost ? 'Not enough MP' : 'Ready';
    return `<button class="skill-choice" title="${U.escapeHtml(sk.desc)}" onclick="onUseSkill('${sk.id}')" ${disabled?'disabled':''}><span><b>${sk.name}</b><small>${U.escapeHtml(sk.desc)}</small></span><span class="skill-cost">${cost} MP<br><em>${status}</em></span></button>`;
  }).join('');
  const buffNote = c.buffs.length ? `<div class="small" style="margin:6px 0;">Active this battle: ${c.buffs.map(b=>`+${b.pct}% ${STAT_BY_ID[b.stat].short} (${b.name})`).join(', ')}</div>` : '';
  return `
    <div class="round-label">Round ${c.round}${c.resolving?'<span class="resolving-tag">Resolving…</span>':''}<span class="init-strip">${orderHtml}</span></div>
    <div class="combatants">${monsterHtml}</div>
    ${buffNote}
    ${afflictionRow}
    ${renderLog(s)}
    <div class="btn-row" style="margin-top:14px;">
      <button class="btn btn-primary" onclick="onCombatAction('attack')" ${alive&&!c.resolving?'':'disabled'}>Attack</button>
      <button class="btn" onclick="onCombatAction('cast')" ${alive&&!c.resolving?'':'disabled'}>Cast (Magic)</button>
      <button class="btn skill-menu-btn" onclick="toggleCombatSkills()" ${alive&&!c.resolving&&activeSkills.length?'':'disabled'}>Skills <span class="small">(${activeSkills.length})</span></button>
      <button class="btn" onclick="onCombatAction('defend')" ${alive&&!c.resolving?'':'disabled'} title="Sharply reduce all damage you take this round; restores a little MP.">Defend</button>
      <button class="btn btn-danger" onclick="onCombatAction('flee')" ${alive&&!c.resolving?'':'disabled'}>Flee</button>
    </div>
    ${c.skillMenuOpen?`<div class="combat-skill-menu"><div class="skill-menu-head"><b>Choose a skill</b><button onclick="toggleCombatSkills()">×</button></div>${skillButtons||'<div class="empty-note">No active skills learned.</div>'}</div>`:''}`;
}

function renderMerchantPanel(s){
  const stock = s.ui.merchantStock || [];
  const cards = stock.map((item,i)=>{
    const price = Math.round((10+item.ilvl*3) * (1+TIERS.findIndex(t=>t.id===item.tier)*0.9));
    return renderItemCard(item, `<button class="btn" onclick="onBuyItem(${i}, ${price})">Buy — ${price}g</button>`);
  }).join('');
  return `
    ${renderLog(s)}
    <div style="margin-top:12px;">${cards || '<div class="empty-note">The stall is bare today.</div>'}</div>
    <div class="btn-row" style="margin-top:12px;"><button class="btn" onclick="onLeaveMerchant()">Leave the stall</button></div>`;
}

function renderChoices(s){
  if(s.ui.choices==='merchant') return renderMerchantPanel(s);
  const choices = s.ui.choices || [];
  const itemCard = s.ui.pendingItem ? renderItemCard(s.ui.pendingItem, '') : '';
  return `
    ${renderLog(s)}
    ${itemCard}
    <div class="choices">${choices.map((c,i)=>`<button class="btn" onclick="onChoiceClick(${i})">${c.label}</button>`).join('')}</div>`;
}

function renderScene(s){
  let inner='';
  if(s.mode==='combat') inner = renderCombat(s);
  else if(s.mode==='defeat') inner = `${renderLog(s)}<div class="choices"><p class="log-bad">You wake later, dragged from the dungeon by unseen hands. Some gold was lost.</p><button class="btn btn-primary" onclick="onDefeatContinue()">Return to Town</button></div>`;
  else if(s.mode==='complete') inner = `${renderLog(s)}<div class="choices"><p class="log-good">The dungeon falls silent. You've cleared it.</p><button class="btn btn-primary" onclick="onDungeonComplete()">Return to Town</button></div>`;
  else inner = renderChoices(s);
  return `<div class="panel scene">
      <div class="panel-title">${s.dungeon ? s.dungeon.theme.icon+' '+s.dungeon.theme.name : 'Town of Last Light'}</div>
      ${renderDepthTrack(s)}
      <div class="scene-body">${inner}</div>
    </div>`;
}

function renderTown(s){
  return `<div class="panel scene">
    <div class="panel-title">Town of Last Light</div>
    <div class="scene-body">
      <div class="log-feed"><p class="log-flavor">The town is quiet. Torches gutter along the wall. Somewhere below, the dungeon waits — and it will not have gotten any easier.</p>
      <p>Choose your descent, ${s.player.name}.</p></div>
      <div class="choices">
        <button class="btn btn-primary" onclick="descend('normal')">Descend — Normal</button>
        <button class="btn" onclick="descend('hard')">Descend — Hard <span class="small">(tougher foes, better loot)</span></button>
        <button class="btn btn-danger" onclick="descend('nightmare')">Descend — Nightmare <span class="small">(brutal, best loot)</span></button>
      </div>
    </div>
  </div>`;
}

function renderInventoryOverlay(s){
  if(!s.ui.invOpen) return '';
  const items = s.inventory;
  const cards = items.map(item=>{
    const equipLabel = (item.slot==='accessory1'||item.slot==='accessory2') ? 'Equip' : 'Equip';
    return renderItemCard(item, `
      <button class="btn" onclick="onEquipItem('${item.uid}')">${equipLabel}</button>
      <button class="btn btn-danger" onclick="onSellItem('${item.uid}')">Sell</button>`);
  }).join('');
  return `<div class="overlay" onclick="if(event.target===this) toggleInventory()">
    <div class="panel overlay-panel">
      <div class="panel-title">Inventory<span class="small" style="cursor:pointer;color:var(--ember)" onclick="toggleInventory()">Close ✕</span></div>
      <div class="overlay-body">${cards || '<div class="empty-note">Your pack is empty. Explore the dungeon to find gear.</div>'}</div>
    </div>
  </div>`;
}

function renderSlotOverlay(s){
  const so = s.ui.slotOverlay;
  if(!so) return '';
  const slot = SLOTS.find(sl=>sl.id===so.slotId);
  const equipped = s.equipment[so.slotId];
  let body;
  if(so.mode==='change'){
    const matches = s.inventory.filter(item=>
      slot.group==='accessory' ? (item.slot==='accessory1'||item.slot==='accessory2') : item.slot===slot.id
    );
    const cards = matches.map(item=>renderItemCard(item,
      `<button class="btn btn-primary" onclick="onEquipToSlot('${item.uid}','${slot.id}')">Equip</button>`
    )).join('');
    body = `
      <div class="small" style="margin-bottom:10px;">Choose a ${slot.label.toLowerCase()} from your pack to equip here.</div>
      ${cards || `<div class="empty-note">No ${slot.label.toLowerCase()} items in your pack. Explore the dungeon or visit a merchant.</div>`}
      <div class="btn-row" style="margin-top:12px;"><button class="btn" onclick="onBackToSlotView()">← Back</button></div>`;
  } else {
    body = equipped
      ? `${renderItemCard(equipped,'')}
         <div class="btn-row" style="margin-top:10px;">
           <button class="btn btn-primary" onclick="onChangeEquipClick()">Change Equip</button>
           <button class="btn btn-danger" onclick="onRemoveEquip('${slot.id}')">Remove Equip</button>
         </div>`
      : `<div class="empty-note">Nothing equipped in this slot.</div>
         <div class="btn-row" style="margin-top:10px;">
           <button class="btn btn-primary" onclick="onChangeEquipClick()">Equip Item</button>
         </div>`;
  }
  return `<div class="overlay" onclick="if(event.target===this) closeSlotOverlay()">
    <div class="panel overlay-panel">
      <div class="panel-title">${slot.label}<span class="small" style="cursor:pointer;color:var(--ember)" onclick="closeSlotOverlay()">Close ✕</span></div>
      <div class="overlay-body">${body}</div>
    </div>
  </div>`;
}

function renderCraftingOverlay(s){
  if(!s.ui.craftOpen) return '';
  const materials = CRAFTING_MATERIALS.map(material=>{
    const count = s.player.materials[material.id]||0;
    return `<span class="trait-tag" style="opacity:${count?1:.45}">${material.name} ×${count}</span>`;
  }).join('');
  const known = MYTHIC_RECIPES.filter(recipe=>s.player.recipes.includes(recipe.id));
  const cards = known.map(recipe=>{
    const canCraft = Crafting.canCraft(s,recipe);
    const requirements = Object.entries(recipe.requirements).map(([id,count])=>{
      const owned = s.player.materials[id]||0;
      return `<span style="color:${owned>=count?'var(--good)':'var(--bad)'}">${MATERIAL_BY_ID[id].name} ${owned}/${count}</span>`;
    }).join('<br>');
    const trait = CRAFTED_MYTHIC_TRAITS.find(entry=>entry.id===recipe.mythicTrait);
    return `<div class="item-card mythic-border" style="--glow:var(--t-mythic1);border-color:var(--t-mythic1)">
      <div class="item-name" style="color:var(--t-mythic1)">${recipe.name}</div>
      <div class="item-meta">MYTHIC ${SLOTS.find(slot=>slot.id===recipe.slot).label.toUpperCase()} · SOULFORGE ONLY</div>
      <div class="item-stats">${requirements}</div>
      <div class="item-trait mythictrait">★ ${trait.name} — ${trait.desc(trait.base)}</div>
      <div class="item-actions"><button class="btn btn-primary" onclick="onCraftItem('${recipe.id}')" ${canCraft?'':'disabled'}>Forge Mythic</button></div>
    </div>`;
  }).join('');
  const unknownCount = MYTHIC_RECIPES.length-known.length;
  return `<div class="overlay" onclick="if(event.target===this) toggleCrafting()">
    <div class="panel overlay-panel">
      <div class="panel-title">Soulforge <span class="small" style="cursor:pointer;color:var(--ember)" onclick="toggleCrafting()">Close ×</span></div>
      <div class="overlay-body">
        <div class="small" style="margin-bottom:10px;">Bosses rarely yield new mythic recipes. Materials are collected automatically from defeated enemies. Each recipe has its own exact requirements.</div>
        <div style="margin-bottom:14px;line-height:2">${materials}</div>
        <div class="panel-title" style="border:none;padding:4px 0;">Known Recipes (${known.length}/${MYTHIC_RECIPES.length})</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${cards || '<div class="empty-note">No mythic recipes known. Defeat dungeon bosses to uncover one.</div>'}</div>
        ${unknownCount? `<div class="small" style="margin-top:10px;color:var(--ink-dim);">${unknownCount} undiscovered recipe${unknownCount===1?'':'s'} remain.</div>`:''}
      </div>
    </div>
  </div>`;
}

function renderTitle(){
  const classCards = CLASSES.map(c=>{
    const selected = c.id===PENDING_CLASS;
    return `<div class="slot" style="cursor:pointer;text-align:left;${selected?'border-color:var(--ember);background:#2a2115;':''}" onclick="selectClass('${c.id}')">
      <div class="slot-label">${c.icon} ${c.name.toUpperCase()}${selected?' ✓':''}</div>
      <div class="slot-empty" style="color:var(--ink-dim);font-style:normal;">${c.desc}</div>
      ${c.innatePassive ? `<div class="small" style="color:var(--gold);margin-top:4px;">Innate: ${c.innatePassive.name}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="title-screen">
    <h1>DEEPWARD</h1>
    <div class="sub">a dungeon does not remember your name until you die in it</div>
    <div><input id="nameInput" placeholder="Enter your name" maxlength="18" onkeydown="if(event.key==='Enter') startFromTitle()"/></div>
    <div class="panel" style="max-width:560px;margin:22px auto 0;text-align:left;">
      <div class="panel-title">Choose your class</div>
      <div class="slots" style="grid-template-columns:1fr;">${classCards}</div>
    </div>
    <div><button class="btn btn-primary" onclick="startFromTitle()">Begin the Descent</button></div>
  </div>`;
}

function renderSkillGraph(s, cls){
  const width=3050, height=1260;
  const byId=Object.fromEntries(cls.skillTree.map(node=>[node.id,node]));
  const lines=cls.skillTree.filter(node=>node.requires&&byId[node.requires]).map(node=>{
    const parent=byId[node.requires];
    const active=s.player.unlockedSkills.includes(parent.id)&&s.player.unlockedSkills.includes(node.id);
    const available=s.player.unlockedSkills.includes(parent.id)&&!s.player.unlockedSkills.includes(node.id);
    return `<line x1="${parent.x}" y1="${parent.y}" x2="${node.x}" y2="${node.y}" class="tree-link ${active?'active':available?'available':''}"/>`;
  }).join('');
  const branches=[...new Set(cls.skillTree.map(node=>node.branch))];
  const headers=branches.map(branch=>{
    const nodes=cls.skillTree.filter(node=>node.branch===branch);
    const x=Math.round(nodes.reduce((sum,node)=>sum+node.x,0)/nodes.length);
    return `<div class="tree-branch-title" style="left:${x}px">${branch}</div>`;
  }).join('');
  const nodes=cls.skillTree.map(node=>{
    const unlocked=s.player.unlockedSkills.includes(node.id);
    const can=Engine.canUnlock(s,node);
    const parent=node.requires?byId[node.requires]:null;
    const reason=!unlocked&&!can?(parent&&!s.player.unlockedSkills.includes(parent.id)?`Requires ${parent.name}`:s.player.skillPoints<node.cost?`Requires ${node.cost} points`:'Locked'):'';
    const icon=node.kind==='active'?'⚡':node.nodeRole==='capstone'?'★':node.nodeRole==='notable'?'✦':'◆';
    const title=`${node.name}\n${node.kind.toUpperCase()} · ${node.cost} point${node.cost===1?'':'s'}\n${node.desc}${reason?'\n'+reason:''}`;
    return `<button class="tree-node ${node.nodeRole||''} ${node.kind} ${unlocked?'unlocked':can?'available':'locked'}" style="left:${node.x}px;top:${node.y}px" title="${U.escapeHtml(title)}" onclick="onUnlockSkill('${node.id}')" ${unlocked||!can?'disabled':''}><span>${icon}</span><small>${node.name}</small><em>${unlocked?'✓':node.cost}</em></button>`;
  }).join('');
  const learned=s.player.unlockedSkills.filter(id=>byId[id]).length;
  return `<div class="overlay skill-tree-overlay" onclick="if(event.target===this) toggleSkills()">
    <div class="panel skill-tree-panel">
      <div class="panel-title tree-toolbar"><span>${cls.icon} ${cls.name} Constellation <small>${learned}/${cls.skillTree.length} learned</small></span><span>Points: <b>${s.player.skillPoints}</b> <button onclick="toggleSkills()">Close ×</button></span></div>
      <div class="tree-legend"><span class="legend-dot available"></span>Available <span class="legend-dot unlocked"></span>Learned <span>⚡ Active</span><span>★ Capstone</span><span>Drag the scrollbars to explore · hover any node for details</span></div>
      <div class="skill-tree-viewport">
        <div class="skill-tree-canvas" style="width:${width}px;height:${height}px">
          <svg width="${width}" height="${height}" aria-hidden="true">${lines}</svg>${headers}${nodes}
        </div>
      </div>
    </div>
  </div>`;
}

function renderSkillsOverlay(s){
  if(!s.ui.skillsOpen) return '';
  const cls = CLASS_BY_ID[s.player.classId];
  return renderSkillGraph(s,cls);
  /* Legacy tier renderer retained below for save-compatible data diagnostics. */
  const maxTier = Math.max(...cls.skillTree.map(sk=>sk.tier));
  const byTier = Array.from({length:maxTier}, (_,i)=>cls.skillTree.filter(sk=>sk.tier===i+1));
  const tierHtml = byTier.map((skills,i)=>{
    const cards = skills.map(sk=>{
      const unlocked = s.player.unlockedSkills.includes(sk.id);
      const can = Engine.canUnlock(s, sk);
      const prerequisite = sk.requires && !s.player.unlockedSkills.includes(sk.requires)
        ? `<div class="small">Requires: ${cls.skillTree.find(x=>x.id===sk.requires).name}</div>` : '';
      const chosenRoot = sk.choiceGroup && cls.skillTree.find(x=>x.choiceGroup===sk.choiceGroup && s.player.unlockedSkills.includes(x.id));
      const routeLock = chosenRoot && chosenRoot.id!==sk.id
        ? `<div class="small" style="color:var(--bad);">Committed to ${chosenRoot.branch}</div>` : '';
      return `<div class="item-card" style="${unlocked?'border-color:var(--good);':''}">
        <div class="item-name" style="font-size:13px;color:${sk.kind==='active'?'var(--ember)':'var(--ink)'}">${sk.kind==='active'?'⚡':'◆'} ${sk.name}</div>
        <div class="item-meta">${sk.kind.toUpperCase()}${sk.kind==='active'?' · '+sk.manaCost+' MP':''} · cost ${sk.cost} pt</div>
        <div class="item-stats" style="color:var(--ink-dim);margin-top:5px;">${sk.desc}</div>
        <div class="small" style="color:var(--gold);">${sk.branch}</div>
        ${prerequisite}${routeLock}
        <div class="item-actions">${unlocked? '<span class="small" style="color:var(--good);">Learned</span>' : `<button class="btn" onclick="onUnlockSkill('${sk.id}')" ${can?'':'disabled'}>Unlock</button>`}</div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px;"><div class="panel-title" style="border:none;padding:4px 0;">Tier ${i+1}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${cards}</div></div>`;
  }).join('');
  const innateHtml = (cls.innatePassive || cls.innateActive) ? `
    <div style="margin-bottom:14px;">
      <div class="panel-title" style="border:none;padding:4px 0;">Class Innate <span class="small">(no discipline required, always active)</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${cls.innatePassive ? `<div class="item-card" style="border-color:var(--good);">
          <div class="item-name" style="font-size:13px;">◆ ${cls.innatePassive.name}</div>
          <div class="item-meta">INNATE PASSIVE</div>
          <div class="item-stats" style="color:var(--ink-dim);margin-top:5px;">${cls.innatePassive.desc}</div>
        </div>` : ''}
        ${cls.innateActive ? `<div class="item-card" style="border-color:var(--good);">
          <div class="item-name" style="font-size:13px;color:var(--ember);">⚡ ${cls.innateActive.name}</div>
          <div class="item-meta">INNATE ACTIVE · ${cls.innateActive.manaCost} MP</div>
          <div class="item-stats" style="color:var(--ink-dim);margin-top:5px;">${cls.innateActive.desc}</div>
        </div>` : ''}
      </div>
    </div>` : '';
  return `<div class="overlay" onclick="if(event.target===this) toggleSkills()">
    <div class="panel overlay-panel">
      <div class="panel-title">${cls.icon} ${cls.name} Skill Tree <span class="small" style="cursor:pointer;color:var(--ember)" onclick="toggleSkills()">Close ✕</span></div>
      <div class="overlay-body">
        <div class="small" style="margin-bottom:10px;">Skill points available: <b style="color:var(--gold)">${s.player.skillPoints}</b></div>
        ${innateHtml}
        ${tierHtml}
      </div>
    </div>
  </div>`;
}

function render(){
  const app = document.getElementById('app');
  if(!STATE){ app.innerHTML = renderTitle(); return; }
  const s = STATE;
  const scene = s.screen==='town' ? renderTown(s) : renderScene(s);
  const weaponElement = (s.equipment.weapon && s.equipment.weapon.element) || 'physical';
  app.innerHTML = `
    ${renderHud(s)}
    <div class="layout">
      ${renderSlots(s)}
      ${scene}
      <div class="panel"><div class="panel-title">Character</div>${renderStatBlock(s, weaponElement)}</div>
    </div>
    ${renderInventoryOverlay(s)}
    ${renderCraftingOverlay(s)}
    ${renderSkillsOverlay(s)}
    ${renderSlotOverlay(s)}
  `;
}
