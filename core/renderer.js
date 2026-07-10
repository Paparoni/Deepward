/* ============================================================
   [6] RENDERING (vanilla DOM strings — re-render on every action)
   ============================================================ */
function esc(s){ return String(s); }

function renderStatBlock(derived, weaponElement){
  const rows = CORE_STATS.map(s=>`<div class="stat-row"><span>${s.short}</span><b>${derived[s.id]}</b></div>`).join('');
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
      <div class="bar-track"><div class="bar-fill bar-hp" style="width:${U.clamp(s.player.hp/d.maxHp*100,0,100)}%"></div></div>
    </div>
    <div class="bar-wrap">
      <div class="bar-label"><span>MP</span><span>${s.player.mp}/${d.maxMp}</span></div>
      <div class="bar-track"><div class="bar-fill bar-mp" style="width:${U.clamp(s.player.mp/d.maxMp*100,0,100)}%"></div></div>
    </div>
    <div class="bar-wrap">
      <div class="bar-label"><span>XP</span><span>${s.player.xp}/${xpNeed}</span></div>
      <div class="bar-track"><div class="bar-fill bar-xp" style="width:${U.clamp(s.player.xp/xpNeed*100,0,100)}%"></div></div>
    </div>
    ${diffLabel? `<div class="hud-diff">${diffLabel}</div>`:''}
    <div class="hud-gold">⛁ ${s.player.gold} gold</div>
  </div>`;
}

function renderSlots(s){
  const html = SLOTS.map(slot=>{
    const item = s.equipment[slot.id];
    const t = item ? TIER_BY_ID[item.tier] : null;
    return `<div class="slot" onclick="onSlotClick('${slot.id}')">
      <div class="slot-label">${slot.label}</div>
      ${item ? `<div class="slot-item" style="color:${t.color}">${item.name}</div>` : `<div class="slot-empty">— empty —</div>`}
    </div>`;
  }).join('');
  return `<div class="panel"><div class="panel-title">Equipment<span><span class="small" style="cursor:pointer;color:var(--ember);margin-right:10px;" onclick="toggleSkills()">Skills (${s.player.skillPoints})</span><span class="small" style="cursor:pointer;color:var(--ember)" onclick="toggleInventory()">Inventory (${s.inventory.length})</span></span></div><div class="slots">${html}</div></div>`;
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
  const monsterHtml = c.monsters.map(m=>`
    <div class="combatant ${m.hp<=0?'dead':''}">
      <div class="combatant-name">${m.icon} ${m.name}</div>
      <div class="bar-track" style="margin-top:4px;"><div class="bar-fill bar-hp" style="width:${U.clamp(m.hp/m.maxHp*100,0,100)}%"></div></div>
      <div class="combatant-hp-num">${Math.max(0,m.hp)}/${m.maxHp} HP</div>
    </div>`).join('');
  const alive = c.monsters.some(m=>m.hp>0);
  const cls = CLASS_BY_ID[s.player.classId];
  const activeSkills = cls.skillTree.filter(sk=>sk.kind==='active' && s.player.unlockedSkills.includes(sk.id));
  const skillButtons = activeSkills.map(sk=>{
    const disabled = !alive || s.player.mp < sk.manaCost;
    return `<button class="btn" title="${sk.desc}" onclick="onUseSkill('${sk.id}')" ${disabled?'disabled':''}>${sk.name} <span class="small">(${sk.manaCost} MP)</span></button>`;
  }).join('');
  const buffNote = c.buffs.length ? `<div class="small" style="margin:6px 0;">Active this battle: ${c.buffs.map(b=>`+${b.pct}% ${STAT_BY_ID[b.stat].short} (${b.name})`).join(', ')}</div>` : '';
  return `
    <div class="combatants">${monsterHtml}</div>
    ${buffNote}
    ${renderLog(s)}
    <div class="btn-row" style="margin-top:14px;">
      <button class="btn btn-primary" onclick="onCombatAction('attack')" ${alive?'':'disabled'}>Attack</button>
      <button class="btn" onclick="onCombatAction('cast')" ${alive?'':'disabled'}>Cast (Magic)</button>
      <button class="btn btn-danger" onclick="onCombatAction('flee')" ${alive?'':'disabled'}>Flee</button>
      ${skillButtons}
    </div>`;
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

function renderTitle(){
  const classCards = CLASSES.map(c=>{
    const selected = c.id===PENDING_CLASS;
    return `<div class="slot" style="cursor:pointer;text-align:left;${selected?'border-color:var(--ember);background:#2a2115;':''}" onclick="selectClass('${c.id}')">
      <div class="slot-label">${c.icon} ${c.name.toUpperCase()}${selected?' ✓':''}</div>
      <div class="slot-empty" style="color:var(--ink-dim);font-style:normal;">${c.desc}</div>
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

function renderSkillsOverlay(s){
  if(!s.ui.skillsOpen) return '';
  const cls = CLASS_BY_ID[s.player.classId];
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
  return `<div class="overlay" onclick="if(event.target===this) toggleSkills()">
    <div class="panel overlay-panel">
      <div class="panel-title">${cls.icon} ${cls.name} Skill Tree <span class="small" style="cursor:pointer;color:var(--ember)" onclick="toggleSkills()">Close ✕</span></div>
      <div class="overlay-body">
        <div class="small" style="margin-bottom:10px;">Skill points available: <b style="color:var(--gold)">${s.player.skillPoints}</b></div>
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
      <div class="panel"><div class="panel-title">Character</div>${renderStatBlock(s.derived, weaponElement)}</div>
    </div>
    ${renderInventoryOverlay(s)}
    ${renderSkillsOverlay(s)}
  `;
}
