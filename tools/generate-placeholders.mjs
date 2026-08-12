#!/usr/bin/env node
/**
 * Generates one placeholder SVG per photo slot into assets/img/.
 *
 *   node tools/generate-placeholders.mjs
 *
 * Each placeholder carries the tone gradient used in the design plus the brief
 * describing the shot that belongs in that slot, so the layout reads correctly
 * before any real photography exists. Swap them out per the README.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'img');
const { tones, ratios, photos } = JSON.parse(readFileSync(join(root, 'tools', 'photos.json'), 'utf8'));

/** CSS `<angle>deg` (clockwise from "to top") → SVG objectBoundingBox coordinates. */
function gradientVector(deg) {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return {
    x1: (0.5 - dx / 2).toFixed(4),
    y1: (0.5 - dy / 2).toFixed(4),
    x2: (0.5 + dx / 2).toFixed(4),
    y2: (0.5 + dy / 2).toFixed(4),
  };
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function svgFor({ id, tone, ratio, brief = '' }) {
  const [w, h] = ratios[ratio];
  const { angle, stops } = tones[tone];
  const { x1, y1, x2, y2 } = gradientVector(angle);

  const stopTags = stops
    .map((s) => {
      const [color, offset] = s.split(' ');
      return `<stop offset="${offset}" stop-color="${color}"/>`;
    })
    .join('');

  const body = Math.round(w / 30);
  const small = Math.round(w / 52);
  /* Slots the design leaves unlabelled (the Instagram strip) get tone alone. */
  const lines = brief ? wrap(brief, 26) : [];
  const lead = body * 1.42;
  const top = h / 2 - ((lines.length - 1) * lead) / 2;
  const tspans = lines
    .map((l, i) => `<tspan x="${w / 2}" y="${(top + i * lead).toFixed(1)}">${esc(l)}</tspan>`)
    .join('');
  const caption = lines.length
    ? `<text text-anchor="middle" font-size="${body}" letter-spacing="${(body * 0.13).toFixed(2)}" opacity=".95" style="paint-order:stroke" stroke="rgba(0,0,0,.22)" stroke-width="${(body * 0.14).toFixed(2)}">${tspans}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(brief || 'Placeholder image')}">
  <defs>
    <linearGradient id="tone" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopTags}</linearGradient>
    <radialGradient id="key" cx="28%" cy="18%" r="72%">
      <stop offset="0" stop-color="#fff" stop-opacity=".42"/>
      <stop offset="0.58" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#tone)"/>
  <rect width="${w}" height="${h}" fill="url(#key)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".14"/>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" fill="#fff">
    <text x="${Math.round(w * 0.045)}" y="${Math.round(w * 0.045) + small}" font-size="${small}" letter-spacing="${(small * 0.16).toFixed(2)}" opacity=".62">PLACEHOLDER</text>
    ${caption}
    <text x="${Math.round(w * 0.045)}" y="${h - Math.round(w * 0.04)}" font-size="${small}" letter-spacing="${(small * 0.16).toFixed(2)}" opacity=".55">${id.toUpperCase()} · ${w}×${h}</text>
  </g>
</svg>
`;
}

mkdirSync(outDir, { recursive: true });

const seen = new Set();
for (const photo of photos) {
  if (seen.has(photo.id)) throw new Error(`Duplicate photo id: ${photo.id}`);
  seen.add(photo.id);
  if (!tones[photo.tone]) throw new Error(`Unknown tone "${photo.tone}" on ${photo.id}`);
  if (!ratios[photo.ratio]) throw new Error(`Unknown ratio "${photo.ratio}" on ${photo.id}`);
  writeFileSync(join(outDir, `${photo.id}.svg`), svgFor(photo));
}

console.log(`Wrote ${photos.length} placeholders to assets/img/`);
