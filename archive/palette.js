// palette.js — ESM, zero-dependency palette generator + browser preview

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- helpers -------------------------------------------------
const rand = (min, max) => {
  const minC = Math.ceil(min);
  const maxF = Math.floor(max);
  return Math.floor(Math.random() * (maxF - minC + 1) + minC);
};

const normHue = (h) => ((h % 360) + 360) % 360;

// --- hue generation ------------------------------------------
let h1 = 0, h2 = 0, h3 = 0, h4 = 0, h5 = 0;

const hueSeed  = rand(0, 360);
const hueRange = rand(1, 10);

const generateHues = () => {
  if (hueRange === 1)  { h1 = hueSeed - 130; h2 = hueSeed - 110; h3 = hueSeed; h4 = hueSeed + 110; h5 = hueSeed + 130; } // triadic
  if (hueRange === 2)  { h1 = hueSeed + 130; h2 = hueSeed + 110; h3 = hueSeed; h4 = hueSeed - 110; h5 = hueSeed - 130; } // triadic
  if (hueRange === 3)  { h1 = hueSeed + 60;  h2 = hueSeed + 35;  h3 = hueSeed; h4 = hueSeed - 35;  h5 = hueSeed - 60;  } // analogous
  if (hueRange === 4)  { h1 = hueSeed - 60;  h2 = hueSeed - 35;  h3 = hueSeed; h4 = hueSeed + 35;  h5 = hueSeed + 60;  } // analogous
  if (hueRange === 5)  { h1 = hueSeed + 190; h2 = hueSeed + 170; h3 = hueSeed; h4 = hueSeed - 20;  h5 = hueSeed - 40;  } // complementary
  if (hueRange === 6)  { h1 = hueSeed - 40;  h2 = hueSeed - 20;  h3 = hueSeed; h4 = hueSeed + 170; h5 = hueSeed + 190; } // complementary
  if (hueRange === 7)  { h1 = hueSeed + 30;  h2 = hueSeed + 15;  h3 = hueSeed; h4 = hueSeed - 15;  h5 = hueSeed - 30;  } // mono
  if (hueRange === 8)  { h1 = hueSeed - 30;  h2 = hueSeed - 15;  h3 = hueSeed; h4 = hueSeed + 15;  h5 = hueSeed + 30;  } // mono
  if (hueRange === 9)  { h1 = hueSeed + 145; h2 = hueSeed + 70;  h3 = hueSeed; h4 = hueSeed - 70;  h5 = hueSeed - 145; } // rainbow
  if (hueRange === 10) { h1 = hueSeed - 145; h2 = hueSeed - 70;  h3 = hueSeed; h4 = hueSeed + 70;  h5 = hueSeed + 145; } // rainbow
};

const hueFix = () => {
  h1 = normHue(h1);
  h2 = normHue(h2);
  h3 = normHue(h3);
  h4 = normHue(h4);
  h5 = normHue(h5);
};

// --- saturation / lightness patterns -------------------------
let sata = 0, satb = 0, satc = 0, satd = 0, sate = 0;
const satSeed = rand(1, 36);

const genSaturations = () => {
  if (satSeed === 1)  { sata=95; satb=95; satc=95; satd=95; sate=95; }
  if (satSeed === 2)  { sata=85; satb=85; satc=85; satd=85; sate=85; }
  if (satSeed === 3)  { sata=75; satb=75; satc=75; satd=75; sate=75; }
  if (satSeed === 4)  { sata=66; satb=66; satc=66; satd=66; sate=66; }
  if (satSeed === 5)  { sata=50; satb=50; satc=50; satd=50; sate=50; }
  if (satSeed === 6)  { sata=40; satb=40; satc=40; satd=40; sate=40; }
  if (satSeed === 7)  { sata=30; satb=30; satc=30; satd=30; sate=30; }
  if (satSeed === 8)  { sata=20; satb=20; satc=20; satd=20; sate=20; }
  if (satSeed === 9)  { sata=30; satb=40; satc=50; satd=60; sate=70; }
  if (satSeed === 10) { sata=70; satb=60; satc=50; satd=40; sate=30; }
  if (satSeed === 11) { sata=33; satb=50; satc=70; satd=50; sate=33; }
  if (satSeed === 12) { sata=33; satb=70; satc=50; satd=70; sate=33; }
  if (satSeed === 13) { sata=50; satb=70; satc=33; satd=70; sate=50; }
  if (satSeed === 14) { sata=50; satb=33; satc=70; satd=33; sate=50; }
  if (satSeed === 15) { sata=70; satb=50; satc=33; satd=50; sate=70; }
  if (satSeed === 16) { sata=70; satb=33; satc=50; satd=33; sate=70; }
  if (satSeed === 17) { sata=30; satb=40; satc=50; satd=40; sate=30; }
  if (satSeed === 18) { sata=30; satb=50; satc=40; satd=50; sate=30; }
  if (satSeed === 19) { sata=40; satb=30; satc=50; satd=30; sate=40; }
  if (satSeed === 20) { sata=40; satb=50; satc=30; satd=50; sate=40; }
  if (satSeed === 21) { sata=50; satb=40; satc=30; satd=40; sate=50; }
  if (satSeed === 22) { sata=50; satb=30; satc=40; satd=30; sate=50; }
  if (satSeed === 23) { sata=50; satb=60; satc=70; satd=60; sate=50; }
  if (satSeed === 24) { sata=50; satb=70; satc=60; satd=70; sate=50; }
  if (satSeed === 25) { sata=60; satb=50; satc=70; satd=50; sate=60; }
  if (satSeed === 26) { sata=60; satb=70; satc=50; satd=70; sate=60; }
  if (satSeed === 27) { sata=70; satb=60; satc=50; satd=60; sate=70; }
  if (satSeed === 28) { sata=70; satb=50; satc=60; satd=50; sate=70; }
  if (satSeed === 29) { sata=95; satb=85; satc=75; satd=66; sate=55; }
  if (satSeed === 30) { sata=55; satb=66; satc=75; satd=85; sate=95; }
  if (satSeed === 31) { sata=75; satb=85; satc=95; satd=85; sate=75; }
  if (satSeed === 32) { sata=75; satb=95; satc=85; satd=95; sate=75; }
  if (satSeed === 33) { sata=85; satb=95; satc=75; satd=95; sate=85; }
  if (satSeed === 34) { sata=85; satb=75; satc=95; satd=75; sate=85; }
  if (satSeed === 35) { sata=95; satb=85; satc=75; satd=85; sate=95; }
  if (satSeed === 36) { sata=95; satb=75; satc=85; satd=75; sate=95; }
};

let lita = 0, litb = 0, litc = 0, litd = 0, lite = 0;
const litSeed = rand(1, 40);

const genLightnesses = () => {
  if (litSeed === 1)  { lita=85; litb=85; litc=85; litd=85; lite=85; }
  if (litSeed === 2)  { lita=75; litb=75; litc=75; litd=75; lite=75; }
  if (litSeed === 3)  { lita=66; litb=66; litc=66; litd=66; lite=66; }
  if (litSeed === 4)  { lita=50; litb=50; litc=50; litd=50; lite=50; }
  if (litSeed === 5)  { lita=40; litb=40; litc=40; litd=40; lite=40; }
  if (litSeed === 6)  { lita=30; litb=30; litc=30; litd=30; lite=30; }
  if (litSeed === 7)  { lita=40; litb=50; litc=60; litd=70; lite=80; }
  if (litSeed === 8)  { lita=80; litb=70; litc=60; litd=50; lite=40; }
  if (litSeed === 9)  { lita=80; litb=66; litc=50; litd=66; lite=80; }
  if (litSeed === 10) { lita=80; litb=50; litc=66; litd=50; lite=80; }
  if (litSeed === 11) { lita=66; litb=80; litc=50; litd=80; lite=66; }
  if (litSeed === 12) { lita=66; litb=50; litc=80; litd=50; lite=66; }
  if (litSeed === 13) { lita=50; litb=66; litc=80; litd=66; lite=50; }
  if (litSeed === 14) { lita=50; litb=80; litc=66; litd=80; lite=50; }
  if (litSeed === 15) { lita=80; litb=70; litc=60; litd=70; lite=80; }
  if (litSeed === 16) { lita=80; litb=60; litc=70; litd=60; lite=80; }
  if (litSeed === 17) { lita=70; litb=60; litc=80; litd=60; lite=70; }
  if (litSeed === 18) { lita=70; litb=80; litc=60; litd=80; lite=70; }
  if (litSeed === 19) { lita=60; litb=70; litc=80; litd=70; lite=60; }
  if (litSeed === 20) { lita=60; litb=80; litc=70; litd=80; lite=60; }
  if (litSeed === 21) { lita=20; litb=30; litc=40; litd=50; lite=60; }
  if (litSeed === 22) { lita=60; litb=50; litc=40; litd=30; lite=20; }
  if (litSeed === 23) { lita=30; litb=40; litc=50; litd=40; lite=30; }
  if (litSeed === 24) { lita=30; litb=50; litc=40; litd=50; lite=30; }
  if (litSeed === 25) { lita=40; litb=50; litc=30; litd=50; lite=40; }
  if (litSeed === 26) { lita=40; litb=30; litc=50; litd=30; lite=40; }
  if (litSeed === 27) { lita=50; litb=40; litc=30; litd=40; lite=50; }
  if (litSeed === 28) { lita=50; litb=30; litc=40; litd=30; lite=50; }
  if (litSeed === 29) { lita=40; litb=50; litc=60; litd=50; lite=40; }
  if (litSeed === 30) { lita=40; litb=60; litc=50; litd=60; lite=40; }
  if (litSeed === 31) { lita=50; litb=40; litc=60; litd=40; lite=50; }
  if (litSeed === 32) { lita=50; litb=60; litc=40; litd=60; lite=50; }
  if (litSeed === 33) { lita=60; litb=50; litc=40; litd=50; lite=60; }
  if (litSeed === 34) { lita=60; litb=40; litc=50; litd=40; lite=60; }
  if (litSeed === 35) { lita=70; litb=60; litc=50; litd=60; lite=70; }
  if (litSeed === 36) { lita=70; litb=50; litc=60; litd=50; lite=70; }
  if (litSeed === 37) { lita=60; litb=70; litc=50; litd=70; lite=60; }
  if (litSeed === 38) { lita=60; litb=50; litc=70; litd=50; lite=60; }
  if (litSeed === 39) { lita=50; litb=60; litc=70; litd=60; lite=50; }
  if (litSeed === 40) { lita=50; litb=70; litc=60; litd=70; lite=50; }
};

// --- conversions & contrast ----------------------------------
const hslToHex = (h, s, l) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
};

const getContrastingColor = (rgb) =>
  (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 125 ? "black" : "white";

// --- run generation ------------------------------------------
generateHues();
hueFix();
genSaturations();
genLightnesses();

const hexCola = hslToHex(h1, sata, lita);
const hexColb = hslToHex(h2, satb, litb);
const hexColc = hslToHex(h3, satc, litc);
const hexCold = hslToHex(h4, satd, litd);
const hexCole = hslToHex(h5, sate, lite);

const hexColaContrast = getContrastingColor(hexToRgb(hexCola));
const hexColbContrast = getContrastingColor(hexToRgb(hexColb));
const hexColcContrast = getContrastingColor(hexToRgb(hexColc));
const hexColdContrast = getContrastingColor(hexToRgb(hexCold));
const hexColeContrast = getContrastingColor(hexToRgb(hexCole));

// Console output (still handy)
console.log("🎲 Rollin' dice & makin' colors! 🌈");
console.log(`🎨 hueSeed:${hueSeed}, hueRange:${hueRange}, satSeed:${satSeed}, litSeed:${litSeed}`);
console.log("Palette (HEX):", [hexCola, hexColb, hexColc, hexCold, hexCole]);
console.log("Recommended text color per swatch:", [
  hexColaContrast, hexColbContrast, hexColcContrast, hexColdContrast, hexColeContrast
]);

// --- HTML preview --------------------------------------------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Color Roll</title>
<style>
  :root { --gap: 14px; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    background: #0b0b0c; color: #e8e8ea;
    display: grid; place-items: start center; min-height: 100dvh;
  }
  .wrap { width: min(840px, 92vw); }
  h1 { margin: 0 0 10px 0; font-size: 22px; font-weight: 700; letter-spacing: .2px; }
  .meta { opacity: .75; font-size: 13px; margin-bottom: 18px; }
  .row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--gap);
  }
  .swatch {
    border-radius: 16px;
    padding: 18px;
    aspect-ratio: 4/5;
    display: flex; align-items: end; justify-content: space-between;
    box-shadow: 0 3px 14px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08);
  }
  .tag {
    font-size: 13px; font-weight: 700; padding: 6px 10px; border-radius: 10px;
    background: rgba(0,0,0,.25);
  }
  .hex { font-variant-numeric: tabular-nums; font-weight: 700; }
  .footer { margin-top: 16px; font-size: 12px; opacity: .7 }
  @media (max-width: 680px) {
    .row { grid-template-columns: 1fr 1fr; }
    .swatch { aspect-ratio: 5/3; }
  }
</style>
</head>
<body>
  <div class="wrap" aria-label="a block of five horizontal color swatches in ${hexCola}, ${hexColb}, ${hexColc}, ${hexCold}, and ${hexCole}">
    <h1>🎲 Rolled Palette</h1>
    <div class="meta">hueSeed: <b>${hueSeed}</b> · hueRange: <b>${hueRange}</b> · satSeed: <b>${satSeed}</b> · litSeed: <b>${litSeed}</b></div>
    <div class="row">
      ${[
        {hex: hexCola, txt: hexColaContrast, i: 1},
        {hex: hexColb, txt: hexColbContrast, i: 2},
        {hex: hexColc, txt: hexColcContrast, i: 3},
        {hex: hexCold, txt: hexColdContrast, i: 4},
        {hex: hexCole, txt: hexColeContrast, i: 5},
      ].map(({hex, txt, i}) => `
        <div class="swatch" style="background:${hex}; color:${txt}">
          <span class="tag">#${i}</span>
          <span class="hex">${hex}</span>
        </div>
      `).join('')}
    </div>
    <div class="footer">Text color per swatch is chosen for contrast: black/white.</div>
  </div>
</body>
</html>`;

// write file & open
const outPath = path.join(__dirname, 'preview.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`🖼  Wrote ${outPath}`);

// Open in default browser (macOS 'open'; Windows 'start'; Linux 'xdg-open')
const opener =
  process.platform === 'darwin' ? 'open' :
  process.platform === 'win32'  ? 'start ""' :
  'xdg-open';

exec(`${opener} "${outPath}"`);
