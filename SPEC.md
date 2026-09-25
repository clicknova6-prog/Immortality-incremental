# Build Prompt: "Ascension Incremental" — a cultivation idle/incremental web game

> Paste everything below into Claude Code (or save it as `SPEC.md` in an empty repo and tell Claude Code: "Read SPEC.md and build it milestone by milestone. Stop after each milestone so I can test.")

---

## 0. Role & ground rules

You are a senior game developer building a browser-based **cultivation-themed incremental (idle/clicker) game**, inspired by the gameplay loop of the Roblox game _Immortality Incremental_. The game is a fresh, original implementation:

- Use **original names, text, UI and art** (CSS/SVG/emoji only — no copied assets, logos or branding from the Roblox game). Generic genre terms (Qi, Jade, Breakthrough, Realm, Sect, Scripture, Spirit Root) are fine.
- **No real-money purchases, no ads.** Anything the original sells for Robux becomes earnable in-game.
- Single-player, runs fully offline in the browser. No backend.

Work in **milestones** (section 10). After each milestone: run the build, run tests, fix errors, then stop and summarize what to test manually.

---

## 1. Tech stack

- **Vite + React 18 + TypeScript (strict)**
- **Zustand** for game state (with `immer` middleware)
- **break_eternity.js** (`Decimal`) for ALL numeric resources — values will exceed 1e308
- **Tailwind CSS** for styling
- **Vitest** for unit tests of formulas and save/load
- **framer-motion** for small juice animations (number pops, breakthrough flash)
- No other runtime dependencies unless justified in a comment.

Folder layout:

```
src/
  core/        # game loop, tick, offline progress, save/load, Decimal helpers, formatting
  data/        # ALL content as typed config: upgrades, realms, marks, beasts, worlds, potions, codes
  systems/     # one file per system: qi.ts, breakthrough.ts, layers.ts, marks.ts, beasts.ts, ...
  store/       # zustand store, slices per system
  ui/          # components, one folder per panel
  tests/
```

Rule: **systems are pure functions** `(state, dt) => newState` or `(state, action) => newState`. UI never contains game math. All balance numbers live in `src/data/`.

---

## 2. Core engine

1. **Game loop**: `requestAnimationFrame`-driven, fixed logical tick of 50 ms, accumulates real delta. When tab is hidden, fall back to `setInterval(1000)`.
2. **Offline progress**: on load, compute elapsed time (cap 12 h, upgradeable later). Simulate in chunks of up to 1,000 steps. Show a "While you were away…" modal with gains.
3. **Save/Load**: autosave to `localStorage` every 15 s and on `beforeunload`. Serialize Decimals as strings. Versioned schema with a `migrations` array. Export/import save as base64 string. Hard reset with double confirmation.
4. **Number formatting**: `format(Decimal)` → `123`, `12.3K`, `4.56M` … up to `Dc`, then scientific `1.23e45`, then `e1.2e10` for huge. Setting to switch to pure scientific.
5. **Multiplier pipeline**: every production value is computed as `base × Π(multipliers from each source)`. Implement a `getMultiplierBreakdown(stat)` that returns each source and its value — show it in a tooltip ("Why is my Qi/s this number?").

---

## 3. Currencies & resources

| Resource                                                                                                                                      | Source                                                                         | Used for                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **Qi**                                                                                                                                        | clicking + passive/sec                                                         | Qi upgrades, Breakthroughs                                                         |
| **Jade**                                                                                                                                      | milestones, beast drops, codes, achievements                                   | opening Marks, Jade upgrades                                                       |
| **Tickets**                                                                                                                                   | passive over time while playing (e.g. 1 per 60 s online, reduced offline rate) | Ticket shop (permanent/utility boosts)                                             |
| **Potions**                                                                                                                                   | codes, drops, Ticket shop                                                      | timed buffs (Qi, Luck, Beast damage, 2× Coins, Ore) — stack duration, not strength |
| **Layer points** (one per reset layer)                                                                                                        | resets                                                                         | permanent multipliers                                                              |
| **Beast Cores / Greater Cores**                                                                                                               | beast stages                                                                   | Spirit Root rolls, beast upgrades                                                  |
| **Stardust** (World 2), **Alloy / Ash / Miasma** (World 4), **Anima / Vitality** (World 5), **Soulfire** (World 6), **Dao Insight** (World 7) | world-specific systems                                                         | world-specific boards                                                              |
| **Luck** (stat)                                                                                                                               | upgrades, marks, potions                                                       | shifts rarity weights in every RNG roll                                            |
| **Insight** (stat)                                                                                                                            | late upgrades, a specific mark                                                 | speeds up late-game systems                                                        |

Potions must sit in an **inventory** and only take effect when the player clicks "Use" (show active buffs with countdown timers in the HUD).

---

## 4. Systems (in unlock order)

### 4.1 Qi & Clicking (World 1)

- Big central "Cultivate" button. Click = `qiPerClick`. Passive `qiPerSec`.
- Built-in **autoclicker** toggle (on by default, clicks N times/sec; N upgradeable).
- **Qi upgrade rows**: each upgrade has `baseCost`, `costGrowth` (1.15–1.5), `effect(level)`, optional max level. Buy ×1 / ×10 / Max buttons (use geometric-series formula for Max, not a loop).
- **Jade upgrades** (small separate board) for permanent-ish utility.

### 4.2 Breakthrough & Realms

- Cultivation **tier** (0, 1, 2, …). Breakthrough cost: `baseCost × growth^tier` with growth stepping up every realm (e.g. 2.2 → 2.6 → 3.0).
- Every 10 tiers = a new **Realm** with an original name ladder (e.g. Qi Gathering → Foundation → Golden Core → Nascent Soul → Spirit Severing → Void Refining → Tribulation → Immortal Ascension …).
- Each tier gives a multiplier to Qi; each Realm unlocks a new upgrade row or system.
- Breakthrough animation (screen flash + realm title card).
- **Auto-Breakthrough** unlock (toggle, fires whenever affordable).

### 4.3 Reset Layers (prestige, multiple stacked layers)

- **Layer 1 — "Rebirth"**: resets Qi, Qi upgrades, tier. Gain `L1 = floor((totalQiThisRun / 1e9)^0.45)`. Each point = +x% Qi (additive within layer, multiplicative with others). Unlocks L1 upgrade board.
- **Layer 2 — "Reincarnation"**: resets Layer 1 too. Gain based on L1 points earned this run.
- **Layer 3 — "Transmigration"** (later world): resets L1+L2.
- UI shows: "Reset now for **+X** points" and a live **break-even hint** ("rebuild time estimate vs. current gain rate") so the player learns when to reset.
- Each layer has milestones (e.g. "5 Rebirths: keep autoclicker upgrades", "25 Rebirths: auto-Rebirth unlock").
- Implement a generic `ResetLayer` config so adding layers is data-only.

### 4.4 Marks (gacha passive bonuses)

- **Mark types** unlock over worlds: Star (W2), Nebula, Quasar, Law (W4), Ash, Miasma, then luck-marks, an Insight mark ("Far Sight"), and a secret expensive late mark ("Karma").
- Open with Jade (rarer marks cost Tickets or world currency). **Bulk open** ×10 / ×100 with a cost discount.
- Each open rolls a **rarity** (Common, Uncommon, Rare, Epic, Legendary, Mythic, Divine) using weights modified by Luck: `weight_i × (1 + luck)^(rarityIndex × k)`, then normalized.
- A mark's bonus = **highest rarity ever rolled** for that type (+ small stacking bonus per duplicate). Show a collection/index screen with odds displayed.
- Roll animation (card flip / reel), skippable; "auto-open" unlock later.
- Seeded RNG utility (`mulberry32`) so tests are deterministic.

### 4.5 Beasts & Stages (World 3)

- Auto-battler: player **Power** (derived from Qi, tier, marks) vs beast HP at stage `s` (`hp = 10 × 1.18^s`, boss every 10 stages ×8 HP).
- Killing beasts drops **Cores**; bosses drop **Greater Cores**. Farm mode (stay on stage) vs Push mode.
- **Beast upgrades** board, including **Luck upgrades**.
- **Spirit Roots** unlock at stage ~110: spend Greater Cores to roll a root (elements + rare "Ancient" and ultra-rare "Chaos" roots). Root = big permanent multiplier set. Keep best, allow re-rolls.
- **Scriptures**: unlockable manuals (by stage milestones) giving long-term multipliers; can be leveled with world currencies.

### 4.6 World 4 — Law, Alloy, Ash, Miasma

- Three stacked currencies generated by separate generators, each with its own upgrade board and mark. Alloy board pairs with the Law mark. Show resource bars side by side — this world is about juggling.

### 4.7 World 5 — Anima, Sects, Vitality, Dungeon

- **Anima crafting**: recipes combining world currencies into items that grant permanent bonuses or consumables.
- **Sects**: choose 1 of 3 sects (different bonus focus; switchable with cooldown). Sect has its own level, tasks (e.g. "kill 500 beasts", "open 50 marks") and a sect upgrade tree.
- **Vitality**: a slow-growing stat that multiplies beast Power and dungeon stats.
- **Dungeon**: separate wave-based auto-battler with a hero, **Gear slots** (weapon, armor, ring, talisman), gear drops with rarity + random substats, **Gear boards** (upgrade trees), keys required to enter (earned from a secret spot + drops). A second dungeon ("Crypt") unlocked later, entered with **Ore Potions**, dropping ores for gear upgrades.

### 4.8 World 6 — Soulfire & Ascended Beasts

- Ascended beast stages (harder variant) drop **Soulfire**; Soulfire scriptures; Karma mark synergy.

### 4.9 World 7 — Dao Path & Constellations

- **Dao Path**: a skill tree (canvas/SVG graph) with branching nodes bought with Dao Insight.
- **Constellations**: connect-the-stars mini-system — unlock stars in a pattern, completed constellations give set bonuses. Introduces Layer 3 reset.

### 4.10 Worlds & Map

- Top-level **World selector** (portal travel). Each world has a 2D scene panel (CSS/SVG background) with clickable spots: upgrade boards, systems, and **hidden secret upgrades** (e.g. a faint shimmer behind a waterfall in World 1, a crack in a wall near World 2's portal). Secrets give a one-time permanent boost and an achievement.
- World unlock gates: realm reached + previous world milestone.

### 4.11 Meta systems

- **Achievements** (100+ generated from templates: reach tier X, total Qi Y, open N marks…), each giving small Jade or % bonuses.
- **Codes**: shop box where player types a code; codes defined in `data/codes.ts` with rewards and one-time use. Seed with a few fun original codes.
- **Ticket shop**: permanent boosts, potion bundles, autoclicker speed, offline cap.
- **Statistics** page (total clicks, play time, resets per layer, best stage…).
- **Local leaderboard**: personal bests history (no network).
- **Settings**: number notation, animations on/off, autosave interval, export/import/hard reset.

---

## 5. UI / UX

- Dark "celestial jade" theme: deep navy/ink background, jade-green & gold accents, subtle animated particles (CSS only, toggleable).
- Layout: **Top HUD** (Qi, Qi/s, Jade, Tickets, active potion timers) · **Left sidebar** (Cultivate, Upgrades, Breakthrough, Layers, Marks, Beasts, World-specific, Shop, Achievements, Stats, Settings — locked items show "???" until unlocked) · **Center** active panel · **Right** notifications/log.
- Unlocks trigger a toast + a pulsing "NEW" badge on the sidebar item.
- Every number has a tooltip with its multiplier breakdown.
- Responsive: works on mobile (sidebar becomes bottom tab bar).
- Keyboard shortcuts: Space = cultivate, B = breakthrough, M = buy max on hovered upgrade.

---

## 6. Balance targets (pacing)

Tune `data/` so a fresh player hits roughly:

- First Breakthrough: ~30 s · first Realm: ~5 min · first Rebirth available: ~15 min
- World 2: ~1 h · World 3: ~3 h · World 4: ~8 h · World 5+: multi-day
  Add a **dev panel** (only when `import.meta.env.DEV`) with: time-skip (1 min/1 h/1 day), add currency, unlock all, and a "pacing simulator" that runs an idealized bot for N hours and logs when each milestone is hit — use it to tune numbers.

---

## 7. Content as data

Every upgrade, realm, mark, rarity table, beast, scripture, recipe, sect, gear item, world, potion, code and achievement is a typed object in `src/data/`. Example:

```ts
export const qiUpgrades: UpgradeDef[] = [
  {
    id: 'meditation',
    name: 'Still Mind Meditation',
    currency: 'qi',
    baseCost: 10,
    costGrowth: 1.15,
    maxLevel: null,
    effect: (lvl) => ({ qiPerSec: { add: lvl * 1 } }),
    unlock: (s) => true,
  },
];
```

Adding a new world should require only new data files + one system file.

---

## 8. Testing

Vitest tests for: cost formulas and buy-max, Decimal formatting at every scale, prestige gain formulas, luck-weighted rarity distribution (seeded, 100k rolls within tolerance), offline progress equals the same time simulated online (±1%), save → load round-trip and migration from v1.

---

## 9. Code quality

- Strict TS, no `any`. ESLint + Prettier.
- Small components, memoized selectors (avoid re-rendering the whole app every tick — HUD numbers subscribe to narrow slices; tick updates batched at most 10 UI renders/sec).
- `README.md` with how to run, folder map and "how to add a world".
- `CLAUDE.md` summarizing architecture rules for future sessions.

---

## 10. Milestones (stop after each)

1. **Scaffold + engine**: Vite/React/TS/Tailwind/Zustand, Decimal helpers, formatter, game loop, save/load/export, offline progress, dev panel, tests.
2. **World 1**: Qi, clicking, autoclicker, Qi & Jade upgrades, Breakthrough & Realms, auto-Breakthrough, potions + inventory, Tickets, codes, HUD & sidebar, waterfall secret.
3. **Reset Layer 1 & 2** with boards, milestones, break-even hint.
4. **World 2 + Marks**: gacha, rarities, luck, bulk open, collection screen, portal-wall secret.
5. **World 3**: Beasts/stages, cores, beast upgrades, Spirit Roots, Scriptures.
6. **World 4**: Alloy/Ash/Miasma + Law/Ash/Miasma marks.
7. **World 5**: Anima crafting, Sects, Vitality, Dungeon + Gear, Crypt dungeon.
8. **Worlds 6–7**: Soulfire, ascended beasts, Dao Path tree, Constellations, Layer 3.
9. **Polish**: achievements, stats, settings, animations, mobile layout, pacing pass with the simulator, final README/CLAUDE.md.

Start with Milestone 1 now.
