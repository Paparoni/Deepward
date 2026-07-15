# Deepward

> **A modular, open-source, browser-based text RPG built with HTML, CSS, and JavaScript.**

Deepward is a classic text-based dungeon crawler focused on meaningful character progression, strategic combat, randomized loot, and expandable game systems. Inspired by old-school RPGs and roguelikes, every expedition into the depths offers new enemies, equipment, and opportunities to create unique builds.

### About the Project

Deepward is a fun little passion project created out of a love for classic dungeon crawlers, roguelikes, and old-school RPGs. Built entirely with HTML, CSS, and vanilla JavaScript, it serves as both a creative hobby and a way to experiment with game design.
The project is actively developed in my spare time and will continue to grow with new content, features, and gameplay systems over time.

---

## Features

- Turn-based battle system
- Six playable classes with four subclasses each
- 120-node constellation skill tree per class, 720 nodes total
- Active skills, passives, branching paths, notables, and capstones
- Inventory and ten equipment slots
- Randomized loot with seven rarity tiers
- Experience, leveling, gold, and stat progression
- Procedurally generated dungeon encounters and events
- Normal, Hard, and Nightmare difficulty
- Shops and merchants
- Boss encounters with phases and unique behavior
- Crafting
- Developer Codex covering architecture, APIs, schemas, and extension examples
- Dungeon defeat penalties for gold, current-level XP, carried items, and crafting materials
- Automatic local saving
- JSON save export and import
- Modular architecture for adding new content
- Runs entirely in the browser
- Crafting *(Work in Progress)*

## Roadmap

- [ ] Achievements
- [ ] Additional classes
- [ ] Additional difficulty modifiers
- [ ] Advanced crafting and enchanting
- [x] Boss fights
- [x] Classes
- [x] Core combat system
- [x] Crafting
- [ ] Dynamic events
- [ ] Endgame content
- [x] Equipment
- [x] Inventory
- [ ] Localization
- [x] Loot generation
- [x] Merchants
- [ ] Multiplayer systems including asynchronous challenges, leaderboards, trading, and cooperative play
- [ ] Pets and companion system
- [ ] Player-versus-player (PvP) combat
- [ ] Prestige system
- [x] Procedural dungeons
- [ ] Quests
- [x] Save system
- [ ] Seasonal content
- [x] Skill trees
- [ ] Story campaign

---

## Play Now

The latest playable development build of **Deepward** is available below.

**Play here:** https://paparoni.github.io/Deepward/

> **Note:** This is the latest development version and may contain unfinished features, balance changes, or bugs as new content is actively being added.

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

No frameworks.  
No build tools.  
No dependencies.

Simply clone the repository and open `index.html`.

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Paparoni/Deepward.git
```

Open the project:

```text
index.html
```

Or host it with any static web server.

---

## Character Progression

Players can:

- Choose from unique classes
- Explore four subclasses per class
- Spend skill points across large connected skill trees
- Unlock powerful active skills and passives
- Build around different playstyles
- Find increasingly rare equipment
- Customize their character through gear and talents
- Experiment with different builds across multiple playthroughs

---

## Loot System

Deepward features randomized equipment with rarity tiers:

- Common
- Uncommon
- Rare
- Ultra Rare
- Unique
- Legendary
- Mythic Legendary

Equipment includes:

- Weapons
- Helmets
- Chest Armor
- Leg Armor
- Arm Guards
- Off-Hands
- Boots
- Accessories
- Artifacts

---

## Saving

- Automatic browser saving through `localStorage`
- Manual local save control
- JSON save export
- JSON save import
- Loading resumes safely in town
- Character progression, equipment, inventory, recipes, and materials are preserved

---

## Contributing

Contributions are welcome!

Detailed Documentation here: 
https://paparoni.github.io/Deepward/developer.html

Ideas include:

- New enemies
- New classes
- Skills
- Items
- Dungeon events
- Bosses
- UI improvements
- Bug fixes
- Performance improvements

Feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the Apache License 2.0.
