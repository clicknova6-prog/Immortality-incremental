# CLAUDE.md

Cultivation idle game. Full spec: `SPEC.md` (build milestone by milestone, §10). README has
the folder map and "how to add a world".

## Architecture rules

- **All numeric resources are `Decimal`** (break_eternity.js) — never `number` for currencies.
  Use `D()` from `core/decimal.ts`. Decimals are immutable values; never mutate them in place.
- **Systems are pure**: `(state, dt) => newState` or `(state, …args) => newState`, in
  `src/systems/`. They return new objects and never touch the store, DOM, or `Date.now()`.
- **UI contains no game math.** Components read state via narrow Zustand selectors and call
  store actions. Derived values go through `core/` or `systems/` helpers (e.g. `useStat`).
- **All balance numbers live in `src/data/`** as typed config.
- **Every stat goes through the multiplier pipeline** (`core/multipliers.ts`): contribute by
  adding a `ModifierSource` in `data/modifiers.ts`, so it shows in the breakdown tooltip.
- **Randomness** uses `mulberry32` from `core/rng.ts` with a seed so tests are deterministic.
- **Save compatibility**: new state fields just need defaults in `createInitialState`.
  Renames/restructures need a new entry in `migrations` (`core/save.ts`) + `SAVE_VERSION` bump.
  Never edit an existing migration.
- Store selectors must return stable references (select a slice, then `useMemo` derived
  objects) — Zustand v5 loops forever on selectors that build new objects.
- Tick is 50 ms; UI commits ≤10/s. Keep per-tick work cheap.
- No `any`, strict TS. Original names/art only — nothing copied from the Roblox game.

## Commands

`npm test` · `npm run lint` · `npx tsc -b` · `npm run build` · `npx prettier --check .`
Run all of them before committing.
