// Smoke test: loads dist/index.html in Chromium and exercises loadout, HP, simulator and ongoing effects.
// Run: npm run build && npm test
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const url = "file://" + fileURLToPath(new URL("../dist/index.html", import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url);

// Loadout: Enhanced Defense raises AC; Homunculus toggle removes its sim step
assert.equal(await page.textContent("#ac"), "18");
await page.click("#infToggles button:nth-child(1)"); // Enhanced Defense on (HS already on => 2/2)
assert.equal(await page.textContent("#ac"), "19");
await page.click("#infToggles button:nth-child(3)"); // Homunculus off
const steps = await page.$$eval("#simSteps button", (b) => b.map((x) => x.firstChild.textContent));
assert.ok(!steps.includes("Homunculus"));

// Enhanced Weapon on gauntlets => +9 / 1d8 + 6
await page.click("#infToggles button:nth-child(2)");
await page.click("#ewSeg button:nth-child(1)");
await page.click("#simNext");
await page.click('.opt[data-o="attack"]');
await page.click("#simNext");
await page.click('.opt[data-o="strike"]');
const card = await page.textContent("#simPanel");
assert.match(card, /d20 \+ 9/);
assert.match(card, /1d8 \+ 6/);

// HP: temp absorbs first
await page.click("#simNew");
await page.fill("#hpTemp", "5"); await page.dispatchEvent("#hpTemp", "change");
await page.fill("#hpAmt", "12"); await page.click("#hpDmg");
assert.equal(await page.textContent("#hpStat"), "31/38");

// Caustic Brew at 2nd level => ongoing 4d4 reminder + concentration
await page.click("#simNext");
await page.click('.opt[data-o="brew"]');
await page.click('[data-lv="2"]');
for (let i = 0; i < 8; i++) { const t = await page.textContent("#simNext"); await page.click("#simNext"); if (t === "End turn") break; }
assert.match(await page.textContent("#simFx"), /roll 4d4 acid/);
assert.match(await page.textContent("#simConc"), /Caustic Brew/);

// Equipment: sheet has no consumables, so no item options until one is added
await page.click("#simNew");
await page.click("#simNext");
assert.equal(await page.$('.opt[data-o^="item-"]'), null);
await page.fill("#eqName", "Potion of <healing>"); await page.fill("#eqQty", "1");
await page.selectOption("#eqKind", "heal");
await page.click("#eqAdd button[type=submit]");
// drinking it heals on end turn and uses it up; the option then disappears.
// Typing alone records the roll; the name is escaped; Defensive Field's message doesn't overwrite the potion's.
await page.click("#simNew");
await page.click("#simNext");
await page.click('.opt[data-o^="item-"]');
await page.fill("#itemAmt", "6");
await page.click("#simSteps li:nth-child(3) button"); // Bonus action
await page.click('.opt[data-o="df"]');
for (let i = 0; i < 8; i++) { const t = await page.textContent("#simNext"); await page.click("#simNext"); if (t === "End turn") break; }
assert.equal(await page.textContent("#hpStat"), "37+5/38");
assert.equal(await page.textContent("#hpMsg"), "Potion of <healing>: healed 6. Defensive Field: temp HP set to 5.");
assert.match(await page.textContent("#eqList"), /Potion of <healing>−0\+/);
await page.click("#simNext");
assert.equal(await page.$('.opt[data-o^="item-"]'), null);
// Adding a consumable makes it usable
await page.fill("#eqName", "Alchemist's fire"); await page.fill("#eqQty", "2");
await page.selectOption("#eqKind", "use"); await page.fill("#eqDetail", "1d4 fire per turn");
await page.click("#eqAdd button[type=submit]");
assert.ok(await page.$('.opt[data-o^="item-"]'));
// Editing an item reuses the add form and updates in place
await page.click('.eqn:has-text("Alchemist\'s fire")');
assert.equal(await page.inputValue("#eqDetail"), "1d4 fire per turn");
await page.fill("#eqQty", "5"); await page.click("#eqSubmit");
assert.equal((await page.textContent("#eqList")).match(/Alchemist's fire/g).length, 1);
assert.match(await page.textContent("#eqList"), /Alchemist's fire−5\+/);
assert.equal(await page.textContent("#eqSubmit"), "Add item");

// Shortsword follows equipment: removing it hides the sim option and the Enhanced Weapon choice
await page.click('[data-m="i"]');
await page.click("#ewSeg button:nth-child(3)"); // Enhanced Weapon on the shortsword
await page.click('[aria-label="Remove Shortsword"]');
assert.equal(await page.$$eval("#ewSeg button", (b) => b.length), 3); // still the target: kept, with a warning
assert.match(await page.textContent("#infList"), /shortsword isn't in your equipment/);
await page.click("#ewSeg button:nth-child(1)");
assert.equal(await page.$$eval("#ewSeg button", (b) => b.length), 2);
await page.click("#simNew"); await page.click("#simNext");
await page.click('.opt[data-o="attack"]'); await page.click("#simNext");
assert.equal(await page.$('.opt[data-o="sword"]'), null);

// Migration from the first equipment build: untouched guessed potion dropped, edits kept, sheet items merged in
await page.evaluate(() => localStorage.setItem("sol-sheet-v1", JSON.stringify({ eq: [
  { id: "e1", name: "Potion of healing", qty: 1, kind: "heal", detail: "2d4 + 2" },
  { id: "e2", name: "Smith's tools", qty: 1, kind: "gear" },
  { id: "e6", name: "Crossbow bolts", qty: 7, kind: "gear" },
  { id: "x1", name: "Rope", qty: 1, kind: "gear" }] })));
await page.reload();
const inv = await page.textContent("#eqList");
assert.doesNotMatch(inv, /Potion of healing/);
assert.match(inv, /Crossbow bolts−7\+/);
assert.match(inv, /Rope/);
assert.match(inv, /Bedroll/);
assert.equal(inv.match(/Smith's tools/g).length, 1);

assert.deepEqual(errors, []);
await browser.close();
console.log("smoke: ok");
