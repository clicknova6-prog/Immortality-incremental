# Ascension Incremental

A cultivation-themed idle/incremental browser game. Gather Qi, break through realms, reset
through stacked prestige layers, and travel across worlds. Single-player, fully offline, no
real-money purchases or ads.

The full design lives in [`SPEC.md`](SPEC.md). It is built milestone by milestone
(see §10 of the spec).

**Status:** Milestone 1 (scaffold + engine) done.

## Running

```bash
npm install
npm run dev          # http://localhost:5173 — includes the 🛠 Dev panel
npm test             # Vitest unit tests
npm run build        # typecheck + production build into dist/
npm run lint         # ESLint
npm run format       # Prettier
```

## Stack

Vite · React 18 · TypeScript (strict) · Zustand + immer · break_eternity.js (`Decimal`) ·
Tailwind CSS v4 · framer-motion · Vitest.

## Folder map

```
src/
  core/      engine: Decimal helpers, formatting, cost math, RNG, state shape, tick,
             game loop, offline progress, save/load, multiplier pipeline, pacing sim,
             engine bootstrap
  data/      ALL content & balance numbers as typed config (stats, modifier sources,
             resources, pacing milestones…)
  systems/   pure game logic, one file per system: (state, dt) => state or
             (state, …args) => state. `systems/index.ts` lists per-tick systems.
  store/     Zustand store: game state + transient UI state + actions
  ui/        React components, one folder per panel. No game math here.
  tests/     Vitest tests
```

## Engine overview

- **Loop** (`core/loop.ts`): `requestAnimationFrame` accumulates real time into fixed 50 ms
  ticks and commits to the store at most 10×/s. Hidden tabs fall back to a 1 s interval.
  Stalls longer than 60 s (e.g. laptop sleep) are handed to the offline simulator.
- **Offline** (`core/offline.ts`): elapsed time since the last save, capped
  (`meta.offlineCapHours`, default 12 h), simulated in ≤1000 steps. Shows a
  "While you were away…" modal.
- **Save** (`core/save.ts`): autosave every 15 s (configurable) and on `beforeunload`.
  Decimals serialize as `"$D:<value>"` strings. Versioned with a `migrations` array; loaded
  data is overlaid onto a fresh default state so new fields get defaults automatically.
  Export/import as base64; hard reset needs two confirmations. A save that fails to load is
  backed up under `ascension-incremental-save-corrupt-backup`.
- **Multipliers** (`core/multipliers.ts`): every stat is `(base + Σadd) × Πmult` over the
  sources in `data/modifiers.ts`. `getMultiplierBreakdown` powers the hover tooltips.
- **Formatting** (`core/format.ts`): `123 · 12.3K · 4.56M … 999Dc · 1.23e45 · e1.20e10`,
  with a scientific-only setting.

## Dev panel

Only in `npm run dev`: time skip (+1 min / +1 h / +1 day), add any resource, unlock-all and
×1000 boost flags, and a **pacing simulator** that runs an idealized bot (`systems/bot.ts`)
for N hours and reports when each milestone in `data/pacing.ts` is reached.

## How to add a world (or any new system)

1. **State**: add the new fields to `GameState` / `createInitialState` in `core/state.ts`.
   Adding fields needs no migration (defaults fill in); renaming/restructuring does — append
   to `migrations` in `core/save.ts` and bump `SAVE_VERSION`.
2. **Data**: create `src/data/<world>.ts` with the typed content (upgrades, currencies,
   rarity tables…). Register new currencies in `data/resources.ts` and stats in
   `data/stats.ts`.
3. **System**: create `src/systems/<world>.ts` with pure functions. Register its per-tick
   function in `systems/index.ts` and its stat contributions in `data/modifiers.ts`.
4. **Store**: expose player actions in `store/gameStore.ts` (thin wrappers around system
   functions).
5. **UI**: add a panel folder under `src/ui/` and a sidebar entry.
6. **Pacing**: add milestones to `data/pacing.ts` and teach the bot in `systems/bot.ts`.
7. **Tests**: cover the new formulas in `src/tests/`.
