/* ============================================================
   VERSIONED LOCAL + PORTABLE SAVE SYSTEM
   ============================================================ */
const SaveSystem = {
  key:'deepward-save-v1',
  version:1,

  snapshot(state){
    if(!state?.player) throw new Error('No active game to save.');
    const player={...state.player, skillCooldowns:{}};
    delete player._revivedThisDungeon; delete player._revivedThisFight; delete player._stunned;
    return {
      game:'DEEPWARD', version:this.version, savedAt:new Date().toISOString(),
      player, equipment:state.equipment, inventory:state.inventory,
    };
  },

  validate(data){
    if(!data || data.game!=='DEEPWARD' || !Number.isInteger(data.version)) throw new Error('This is not a Deepward save file.');
    if(data.version>this.version) throw new Error('This save was created by a newer version of Deepward.');
    if(!data.player || !CLASS_BY_ID[data.player.classId]) throw new Error('The save contains an unknown character class.');
    if(!data.equipment || !Array.isArray(data.inventory)) throw new Error('The save is missing equipment or inventory data.');
    return data;
  },

  save(state){
    try{
      localStorage.setItem(this.key,JSON.stringify(this.snapshot(state)));
      return true;
    }catch(error){ console.error('Deepward save failed:',error); return false; }
  },

  hasSave(){ try{return !!localStorage.getItem(this.key);}catch(_){return false;} },

  readLocal(){
    const raw=localStorage.getItem(this.key);
    if(!raw) throw new Error('No local save exists.');
    return this.validate(JSON.parse(raw));
  },

  restore(data){
    data=this.validate(data);
    const p=data.player;
    const cleanText=value=>String(value??'').replace(/[<>]/g,'').slice(0,160);
    const cleanItem=item=>{
      if(!item || !TIER_BY_ID[item.tier] || !SLOTS.some(slot=>slot.id===item.slot)) return null;
      return {...item,name:cleanText(item.name),slotLabel:cleanText(item.slotLabel),
        stats:Object.fromEntries(Object.entries(item.stats||{}).filter(([id,value])=>STAT_BY_ID[id]&&Number.isFinite(Number(value))).map(([id,value])=>[id,Number(value)])),
        uniqueTraits:(Array.isArray(item.uniqueTraits)?item.uniqueTraits:[]).map(t=>({...t,name:cleanText(t.name),desc:cleanText(t.desc)})),
        mythicTrait:item.mythicTrait?{...item.mythicTrait,name:cleanText(item.mythicTrait.name),desc:cleanText(item.mythicTrait.desc)}:null,
      };
    };
    const player={...p,
      name:cleanText(p.name||'Wanderer').slice(0,18),
      level:Math.max(1,Number(p.level)||1), xp:Math.max(0,Number(p.xp)||0), gold:Math.max(0,Number(p.gold)||0),
      skillPoints:Math.max(0,Number(p.skillPoints)||0), unlockedSkills:Array.isArray(p.unlockedSkills)?p.unlockedSkills:[],
      recipes:Array.isArray(p.recipes)?p.recipes:[], materials:p.materials||{}, skillCooldowns:{}, hp:1, mp:1,
    };
    const equipment=Object.fromEntries(SLOTS.map(slot=>[slot.id,cleanItem(data.equipment[slot.id])]));
    const inventory=data.inventory.map(cleanItem).filter(Boolean);
    const state={
      screen:'town',player,equipment,inventory,dungeon:null,mode:'explore',combat:null,log:[],
      ui:{choices:null,invOpen:false,skillsOpen:false,craftOpen:false,merchantStock:null,pendingItem:null,slotOverlay:null,saveNotice:'Game loaded.'},
    };
    Engine.refreshDerived(state);
    player.hp=state.derived.maxHp; player.mp=state.derived.maxMp;
    STATE=state; PENDING_CLASS=player.classId;
    this.save(state); render();
  },

  loadLocal(){ try{this.restore(this.readLocal());}catch(error){alert(`Could not load save: ${error.message}`);} },

  export(state){
    try{
      const data=JSON.stringify(this.snapshot(state),null,2);
      const blob=new Blob([data],{type:'application/json'});
      const url=URL.createObjectURL(blob), link=document.createElement('a');
      link.href=url; link.download=`deepward-${state.player.name.replace(/[^a-z0-9_-]+/gi,'_')}-lvl${state.player.level}.json`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    }catch(error){alert(`Could not export save: ${error.message}`);}
  },

  importFile(file){
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{ try{this.restore(JSON.parse(reader.result));}catch(error){alert(`Could not import save: ${error.message}`);} };
    reader.onerror=()=>alert('The selected save file could not be read.');
    reader.readAsText(file);
  },
};
