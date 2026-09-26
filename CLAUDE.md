# Sol Starglance cheatsheet

Single-page D&D 5e cheatsheet + turn simulator for **Solethis "Sol" Starglance**, Qualinesti high elf, Artificer 5 (Armorer), in a Dragonlance campaign.

## Files

- `src/cheatsheet.html` — the whole app (HTML + inline CSS + inline JS). It is an Artifact *body*: no `<!doctype>`, `<html>`, `<head>` or `<body>`; the host adds the skeleton at publish time. Keep it that way.
- `scripts/build.mjs` — wraps the body into `dist/index.html` for local preview/tests.
- `tests/smoke.mjs` — Playwright smoke test against `dist/index.html`.
- `reference/` — gitignored, local only, never commit: `Solethis_5.pdf` (character sheet, source of truth for numbers) and `dragonlance-journal.txt` (session journal by Malakai). Not present in a fresh clone; ask the user if you need it.

## Commands

```sh
npm install          # playwright (pinned to 1.56.1, matches the Chromium preinstalled in Claude Code cloud sessions)
npm run build        # -> dist/index.html
npm test             # builds, then runs the smoke test
```

## Publishing

GitHub Pages: https://dorukdestan.com/DnD/. `.github/workflows/pages.yml` runs the smoke test on every push/PR and deploys `dist/` on push to `main`. The build wrapper is the page skeleton, so keep `scripts/build.mjs` in sync with anything the page needs in `<head>`.

Artifact page: https://claude.ai/artifact/Grs1tdXE2i9FkjKQyay9dr (private, owned by destan@destan.dev).
Republish by passing that URL as `url` to the Artifact tool with `file_path: src/cheatsheet.html`. Read it first (`action: "read"`) in a new session; the tool refuses a publish to an artifact the session hasn't read. Omit `icon` on republish.
A duplicate "(Copy)" artifact exists (Y6VckNyFX8Y16Hrzd9dksX); it is stale, not updated.

## Rules decisions

- **Tasha's (TCE) Armorer**, not the 2025 Eberron: Forge of the Artificer version (5e.tools defaults to the newer one: Thunder Pulse, Dreadnaught). Guardian = Thunder Gauntlets 1d8 thunder; Infiltrator = Lightning Launcher 1d6 lightning + 1d6 once per turn, 90/300.
- **2014 PHB spells** (e.g. Mirror Image d20 6+/8+/11+). Verified: Mirror Image, Command, Sanctuary (dnd5e.wikidot.com); Caustic Brew, Mind Sliver (TCE), Absorb Elements (XGE) via 5e.tools. Not yet verified against source: Thunderwave, Shatter, Grease, Faerie Fire, Magic Missile, Misty Step, Feather Fall, Mage Hand.
- Homunculus Servant stats from 5e.tools TCE bestiary: AC 13, HP 1+INT+level = 11, walk 20 / fly 30, DEX save +5, Stealth +5, Perception +6, Force Strike = spell attack (+8), 1d4+PB force, 30 ft.
- Enhanced Weapon on the armor's weapons is a DM call; the UI allows gauntlets, launcher or shortsword.
- Sheet numbers: spell DC 16, spell attack +8, PB +3, CON save +5, Stealth +5, Athletics −1, shortsword +5 1d6+2, base AC 18 (scale 14 + DEX 2 + shield 2).

## Design principles (from the user)

- **Nothing toggleable is hardcoded.** Model, active infusions (2 of 4), Enhanced Weapon target, shield, HP: every dependent number/text derives from state (`AC()`, `W(k)`, `HS()`, `MSH()`, `refresh()`).
- Options that don't apply to the current loadout are **hidden**; options blocked by a rule are disabled with the reason **inside the option**.
- Spells vs cantrips are visually distinct (brass edge + level badge vs green edge + "Cantrip").
- User is a software engineer: concise, concrete.

## Code map (inside the `<script>`)

- `state` persisted in `localStorage["sol-sheet-v1"]` (per device): `model`, `inf[]`, `ew`, `shield`, `used{}` (resource pips), `round`, `conc`, `fx[]` (ongoing effects), `hp{cur,max,temp}`, `hhp`, `eq[]` (equipment `{id,name,qty,kind:gear|heal|use,detail}`).
- Loadout: `INF`, `W()`, `renderLoadout()`; tracker: `refreshRes()`, `renderTrack()`; HP: `renderHP()`, `damage()`.
- Simulator: `OPTS[slot]()` option factories, `SLOTS` (with `when`), `whyDisabled()`, `sim()`, `renderSummary()`, `endTurn()`.
- Equipment: `renderEq()`, `hasItem(re)` (e.g. smith's tools warning in the model note); `itemOpts()` adds one action option per heal/use item with qty > 0; `endTurn()` decrements it and applies a self-heal roll (`turn.action.who/amt`). Seed inventory is a guess, not from the sheet.
- Ongoing effects: `LAST[optionId](lv)` → `{len, text, acid, dice}`; created in `endTurn()`, pruned when `state.round > until`; `dropConc()` clears concentration effects.
