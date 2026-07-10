/* ============================================================
   EVENT WIRING (called from inline onclick handlers)
   ============================================================ */
function selectClass(classId){ PENDING_CLASS = classId; render(); }
function startFromTitle(){
  const val = document.getElementById('nameInput').value.trim();
  newGame(val || 'Wanderer', PENDING_CLASS);
}
function toggleInventory(){ STATE.ui.invOpen = !STATE.ui.invOpen; render(); }
function toggleCrafting(){ STATE.ui.craftOpen = !STATE.ui.craftOpen; render(); }
function toggleSkills(){ STATE.ui.skillsOpen = !STATE.ui.skillsOpen; render(); }
function onUnlockSkill(skillId){ Engine.unlockSkill(STATE, skillId); render(); }
function onUseSkill(skillId){ Engine.useSkill(STATE, skillId); render(); }
function onSlotClick(slotId){
  STATE.ui.slotOverlay = {slotId, mode:'view'};
  render();
}
function closeSlotOverlay(){ STATE.ui.slotOverlay = null; render(); }
function onChangeEquipClick(){
  if(STATE.ui.slotOverlay) STATE.ui.slotOverlay.mode = 'change';
  render();
}
function onBackToSlotView(){
  if(STATE.ui.slotOverlay) STATE.ui.slotOverlay.mode = 'view';
  render();
}
function onRemoveEquip(slotId){
  Engine.unequip(STATE, slotId);
  STATE.ui.slotOverlay = null;
  render();
}
function onEquipToSlot(uid, slotId){
  const item = STATE.inventory.find(i=>i.uid===uid);
  if(item) Engine.equipToSlot(STATE, item, slotId);
  STATE.ui.slotOverlay = null;
  render();
}
function onEquipItem(uid){
  const item = STATE.inventory.find(i=>i.uid===uid);
  if(item) Engine.equip(STATE, item);
  render();
}
function onSellItem(uid){
  const item = STATE.inventory.find(i=>i.uid===uid);
  if(item) Engine.sell(STATE, item);
  render();
}
function onCraftItem(recipeId){
  Crafting.craft(STATE, recipeId);
  render();
}
function onChoiceClick(i){
  const choice = STATE.ui.choices[i];
  if(choice) choice.act(STATE);
  render();
}
function onCombatAction(kind){ Engine.playerAction(STATE, kind); render(); }
function onBuyItem(i, price){
  const s = STATE;
  const item = s.ui.merchantStock[i];
  if(!item || s.player.gold<price){ Engine.log(s,'Not enough gold.', 'bad'); render(); return; }
  s.player.gold -= price;
  Engine.grantItem(s, item);
  s.ui.merchantStock.splice(i,1);
  Engine.log(s, `Purchased ${item.name}.`, 'good');
  render();
}
function onLeaveMerchant(){ Engine.finishRoom(STATE); render(); }
function onDefeatContinue(){
  STATE.player.gold = Math.floor(STATE.player.gold*0.7);
  returnToTown();
}
function onDungeonComplete(){ returnToTown(); }

render();
