# Sol Starglance cheatsheet

Interactive cheatsheet and turn simulator for Sol, an Armorer artificer (level 5) in a Dragonlance 5e campaign.

- Loadout toggles (armor model, infusions, Enhanced Weapon target, shield) that drive AC, attack numbers and available options
- Editable HP for Sol and the homunculus, with concentration-save prompts
- Turn simulator: pick an option per slot, see what to roll, what to add and what to compare against
- Ongoing-effects reminders (e.g. Caustic Brew acid each round) and a resource tracker

Live: https://destan.github.io/DnD/ (GitHub Pages, deployed from `main` by `.github/workflows/pages.yml`)
Artifact version: https://claude.ai/artifact/Grs1tdXE2i9FkjKQyay9dr

```sh
npm install && npm run build && npm test
open dist/index.html
```

See `CLAUDE.md` for rules decisions and a code map.
