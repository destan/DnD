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

assert.deepEqual(errors, []);
await browser.close();
console.log("smoke: ok");
