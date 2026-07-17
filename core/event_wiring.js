function selectClass(classId) {
  PENDING_CLASS = classId;
  render();
}
function startFromTitle() {
  const val = document.getElementById('nameInput').value.trim();
  newGame(val || 'Wanderer', PENDING_CLASS);
}
function saveGame() {
  if (STATE && SaveSystem.save(STATE)) {
    STATE.ui.saveNotice = 'Saved locally.';
    render();
  }
}
function loadGame() {
  SaveSystem.loadLocal();
}
function exportSave() {
  if (STATE) SaveSystem.export(STATE);
}
function chooseSaveImport() {
  document.getElementById('saveImportInput')?.click();
}
function importSave(input) {
  SaveSystem.importFile(input.files?.[0]);
  input.value = '';
}
function toggleInventory() {
  if (STATE.mode !== 'combat' || STATE.ui.invOpen) STATE.ui.invOpen = !STATE.ui.invOpen;
  render();
}
function toggleCrafting() {
  STATE.ui.craftOpen = !STATE.ui.craftOpen;
  render();
}
function toggleSkills() {
  if (STATE.mode !== 'combat' || STATE.ui.skillsOpen) {
    STATE.ui.skillsOpen = !STATE.ui.skillsOpen;
    if (STATE.ui.skillsOpen) {
      const cls = CLASS_BY_ID[STATE.player.classId];
      STATE.ui.selectedSkillNode ||= cls.skillWeb?.coreId || cls.skillTree[0]?.id;
      STATE.ui.skillWebScroll = null;
    }
  }
  render();
}
function rememberSkillWebScroll(viewport) {
  if (STATE?.ui) STATE.ui.skillWebScroll = { left: viewport.scrollLeft, top: viewport.scrollTop };
}
function selectSkillNode(skillId) {
  const viewport = document.getElementById('skillWebViewport');
  if (viewport) rememberSkillWebScroll(viewport);
  STATE.ui.selectedSkillNode = skillId;
  render();
}
function focusSkillRegion(regionId) {
  const cls = CLASS_BY_ID[STATE.player.classId],
    viewport = document.getElementById('skillWebViewport'),
    point =
      regionId === 'core'
        ? cls.skillWeb.center
        : cls.skillWeb.regions.find((region) => region.id === regionId);
  if (!viewport || !point) return;
  const x = point.x ?? point.zoneX,
    y = point.y ?? point.zoneY;
  viewport.scrollTo({
    left: Math.max(0, x - viewport.clientWidth / 2),
    top: Math.max(0, y - viewport.clientHeight / 2),
    behavior: STATE.settings?.reduceMotion ? 'auto' : 'smooth',
  });
}
function toggleCharacter() {
  STATE.ui.characterOpen = !STATE.ui.characterOpen;
  render();
}
function toggleSystemMenu() {
  STATE.ui.systemOpen = !STATE.ui.systemOpen;
  render();
}
function setCombatPace(pace) {
  if (['fast', 'normal', 'cinematic'].includes(pace)) STATE.settings.combatPace = pace;
  render();
}
function toggleReduceMotion() {
  STATE.settings.reduceMotion = !STATE.settings.reduceMotion;
  render();
}
function exportMetrics() {
  Metrics.export();
}
function resetMetrics() {
  Metrics.reset();
}
function onUnlockSkill(skillId) {
  const viewport = document.getElementById('skillWebViewport');
  if (viewport) rememberSkillWebScroll(viewport);
  Engine.unlockSkill(STATE, skillId);
  render();
}
function onUseSkill(skillId) {
  Engine.useSkill(STATE, skillId);
  render();
}
function toggleCombatSkills() {
  if (STATE.combat && !STATE.combat.resolving) STATE.combat.skillMenuOpen = !STATE.combat.skillMenuOpen;
  render();
}
function onSlotClick(slotId) {
  if (STATE.mode === 'combat') {
    Engine.log(STATE, 'Equipment cannot be changed during combat.', 'bad');
    render();
    return;
  }
  STATE.ui.slotOverlay = { slotId, mode: 'view' };
  render();
}
function closeSlotOverlay() {
  STATE.ui.slotOverlay = null;
  render();
}
function onChangeEquipClick() {
  if (STATE.ui.slotOverlay) STATE.ui.slotOverlay.mode = 'change';
  render();
}
function onBackToSlotView() {
  if (STATE.ui.slotOverlay) STATE.ui.slotOverlay.mode = 'view';
  render();
}
function onRemoveEquip(slotId) {
  Engine.unequip(STATE, slotId);
  STATE.ui.slotOverlay = null;
  render();
}
function onEquipToSlot(uid, slotId) {
  const item = STATE.inventory.find((i) => i.uid === uid);
  if (item) Engine.equipToSlot(STATE, item, slotId);
  STATE.ui.slotOverlay = null;
  render();
}
function onEquipItem(uid) {
  const item = STATE.inventory.find((i) => i.uid === uid);
  if (item) Engine.equip(STATE, item);
  render();
}
function onSellItem(uid) {
  const item = STATE.inventory.find((i) => i.uid === uid);
  if (item) Engine.sell(STATE, item);
  render();
}
function onCraftItem(recipeId) {
  Crafting.craft(STATE, recipeId);
  render();
}
function onChoiceClick(i) {
  const choice = STATE.ui.choices[i];
  if (choice) choice.act(STATE);
  render();
}
function onCombatAction(kind) {
  Engine.playerAction(STATE, kind);
  render();
}
function onSelectTarget(monsterUid) {
  Engine.setTarget(STATE, monsterUid);
  render();
}
function onBuyItem(i, price) {
  const s = STATE;
  const item = s.ui.merchantStock[i];
  price = item ? Engine.itemPrice(item) : 0;
  if (!item || s.player.gold < price) {
    Engine.log(s, 'Not enough gold.', 'bad');
    render();
    return;
  }
  s.player.gold -= price;
  Engine.grantItem(s, item);
  s.ui.merchantStock.splice(i, 1);
  Engine.log(s, `Purchased ${item.name}.`, 'good');
  render();
}
function onLeaveMerchant() {
  Engine.finishRoom(STATE);
  render();
}
function openTownView(view) {
  STATE.ui.townView = view;
  render();
}
function buyTownItem(index) {
  const item = STATE.town.merchantStock[index];
  if (!item) return;
  const price = Engine.itemPrice(item);
  if (STATE.player.gold < price) return (Engine.log(STATE, 'Not enough gold.', 'bad'), render());
  STATE.player.gold -= price;
  Engine.grantItem(STATE, item);
  STATE.town.merchantStock.splice(index, 1);
  Engine.log(STATE, `Purchased ${item.name}.`, 'good');
  render();
}
function buyChurchBlessing() {
  const cost = Math.round(35 + Math.pow(STATE.player.level, 1.22) * 9);
  if (STATE.town.blessing) return (Engine.log(STATE, 'You already carry a blessing.', 'bad'), render());
  if (STATE.player.gold < cost)
    return (Engine.log(STATE, 'Not enough gold for an offering.', 'bad'), render());
  STATE.player.gold -= cost;
  STATE.town.blessing = U.pick(TOWN_BLESSINGS);
  Metrics.count('townBlessings', STATE.town.blessing.id);
  Engine.log(STATE, `The church grants <b>${STATE.town.blessing.name}</b>.`, 'good');
  render();
}
function buyMaterialBundle() {
  const cost = BALANCE.materialBundleCost(STATE.player.level);
  if (STATE.player.gold < cost) return (Engine.log(STATE, 'Not enough gold for supplies.', 'bad'), render());
  STATE.player.gold -= cost;
  const picks = [...CRAFTING_MATERIALS].sort(() => Math.random() - 0.5).slice(0, 2);
  let totalMaterials = 0;
  for (const material of picks) {
    const amount = U.randInt(1, 3);
    Engine.grantMaterial(STATE, material.id, amount);
    Metrics.count('purchasedMaterials', material.id, amount);
    totalMaterials += amount;
  }
  Metrics.addTotal('materialBundleGoldSpent', cost);
  Metrics.addTotal('materialsPurchased', totalMaterials);
  Metrics.count('townServices', 'materialBundle');
  Engine.log(STATE, `Packed ${picks.map((item) => item.name).join(' and ')}.`, 'good');
  render();
}
function onDefeatContinue() {
  const penalty = Engine.applyDeathPenalty(STATE);
  if (penalty) {
    const losses = [`${penalty.goldLost} gold`, `${penalty.xpLost} XP`];
    if (penalty.itemName) losses.push(penalty.itemName);
    const materialCount = Object.values(penalty.materialLosses || {}).reduce((sum, count) => sum + count, 0);
    if (materialCount) losses.push(`${materialCount} crafting material${materialCount === 1 ? '' : 's'}`);
    Engine.log(STATE, `The depths claim ${losses.join(', ')}.`, 'bad');
  }
  returnToTown();
}
function onDungeonComplete() {
  returnToTown();
}

render();
