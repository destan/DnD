// Wraps src/cheatsheet.html (artifact body, no doctype) into a standalone dist/index.html
// that mirrors the skeleton the claude.ai Artifact host adds at publish time.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const body = readFileSync(new URL("../src/cheatsheet.html", import.meta.url), "utf8");
const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${body}
</body></html>
`;
mkdirSync(new URL("../dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("../dist/index.html", import.meta.url), html);
console.log("wrote dist/index.html");
