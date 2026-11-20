// news-image-20261119 v2 — "The World in One Day" (19 Nov 2026 poster).
// Node 22, standard library only. The program renders the entry poster:
// it reads the base artwork (entry.png, committed beside this file),
// applies the documented correction below, verifies the result, and writes
// a deterministic PNG to /output/entry.png (or MAKEFUN_OUTPUT_DIR when
// set, for local runs). No network, no randomness: two runs write
// identical bytes.
//
// CORRECTION (v2 revision, 20 Nov 2026):
// The timeline panel ("THE DAY BY THE CLOCK — ALL TIMES UTC") printed
// "16:28" under the "ICJ: Myanmar guilty" event. The source for that
// verdict states no timezone, so a UTC time derived from it is only
// accurate to about +/-1 hour — false precision on a poster that claims
// every time is UTC. The fix removes the asserted time: the glyphs in
// rect x 313..353, y 838..848 are painted over with the panel's own
// background colour. The event keeps its dot on the line and its label
// above the line, so nothing else on the page moves. Measured before
// patching (20 Nov 2026): glyph pixels span x 315..351, y 839..847;
// rows y 838 and y 848 and columns x 313..314 / 352..353 are already
// background, and the gold event dot starts at y 858 — the rect touches
// nothing but the "16:28" glyphs and background. The transform is
// idempotent: if the source art already has the label removed, zero
// pixels change and the program still verifies and writes the poster.
//
// Local run:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { join } from 'node:path';

const WIDTH = 1024;
const HEIGHT = 1024;
const PANEL_BG = [19, 38, 66]; // timeline panel background (measured)
// Rect covering the "16:28" glyphs (x0, y0, x1, y1, exclusive end).
const PATCH = { x0: 313, y0: 838, x1: 354, y1: 849 };

// --- minimal PNG codec (8-bit, non-interlaced, colour types 2/6) --------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buf) {
  if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('not a PNG file');
  }
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG not supported');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(
      `unsupported PNG: bitDepth ${bitDepth}, colorType ${colorType}`,
    );
  }
  const channels = colorType === 2 ? 3 : 4;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length !== height * (stride + 1)) {
    throw new Error(`unexpected inflated size ${raw.length}`);
  }
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v = row[i];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) v = (v + paeth(a, b, c)) & 0xff;
      else if (filter !== 0) throw new Error(`unknown filter ${filter}`);
      out[i] = v;
    }
  }
  return { width, height, channels, px };
}

function encodePng({ width, height, channels, px }) {
  const colorType = channels === 3 ? 2 : 6;
  const stride = width * channels;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    // Filter 0 (None) on every scanline: simplest, fully deterministic.
    px.subarray(y * stride, (y + 1) * stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- render -------------------------------------------------------------

const src = new URL('./entry.png', import.meta.url);
const { width, height, channels, px } = decodePng(readFileSync(src));
if (width !== WIDTH || height !== HEIGHT) {
  throw new Error(`poster must be ${WIDTH}x${HEIGHT}, got ${width}x${height}`);
}

// Apply the ICJ timeline correction: paint the "16:28" glyph rect with
// the panel background. Count changed pixels so a no-op (source art
// already corrected) is visible in the log instead of silent.
let changed = 0;
for (let y = PATCH.y0; y < PATCH.y1; y++) {
  for (let x = PATCH.x0; x < PATCH.x1; x++) {
    const i = (y * WIDTH + x) * channels;
    for (let c = 0; c < 3; c++) {
      if (px[i + c] !== PANEL_BG[c]) changed++;
      px[i + c] = PANEL_BG[c];
    }
  }
}

// Verify the correction: no non-background pixel may remain in the rect.
for (let y = PATCH.y0; y < PATCH.y1; y++) {
  for (let x = PATCH.x0; x < PATCH.x1; x++) {
    const i = (y * WIDTH + x) * channels;
    if (
      px[i] !== PANEL_BG[0] ||
      px[i + 1] !== PANEL_BG[1] ||
      px[i + 2] !== PANEL_BG[2]
    ) {
      throw new Error(`timeline patch incomplete at ${x},${y}`);
    }
  }
}

const img = { width, height, channels, px };
const out1 = encodePng(img);
// Determinism self-check: encoding the same pixels twice must give
// identical bytes, otherwise two runs would ship different files.
const out2 = encodePng(img);
if (!out1.equals(out2)) {
  throw new Error('encoder is not deterministic');
}
if (out1.length > 1024 * 1024) {
  throw new Error(`poster exceeds 1 MiB: ${out1.length} bytes`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const dst = join(outDir, 'entry.png');
writeFileSync(dst, out1);
const sha = createHash('sha256').update(out1).digest('hex');

// Round-trip verification: decode what actually landed on disk and check
// the shipped file itself — not just the in-memory buffer. This catches
// encoder bugs and truncated writes that the in-memory checks cannot see.
const shipped = decodePng(readFileSync(dst));
if (shipped.width !== WIDTH || shipped.height !== HEIGHT) {
  throw new Error(
    `shipped poster is ${shipped.width}x${shipped.height}, expected ${WIDTH}x${HEIGHT}`,
  );
}
for (let y = PATCH.y0; y < PATCH.y1; y++) {
  for (let x = PATCH.x0; x < PATCH.x1; x++) {
    const i = (y * WIDTH + x) * shipped.channels;
    if (
      shipped.px[i] !== PANEL_BG[0] ||
      shipped.px[i + 1] !== PANEL_BG[1] ||
      shipped.px[i + 2] !== PANEL_BG[2]
    ) {
      throw new Error(`shipped poster still shows the old label at ${x},${y}`);
    }
  }
}
const shippedSha = createHash('sha256').update(readFileSync(dst)).digest('hex');
if (shippedSha !== sha) {
  throw new Error('shipped file differs from the encoded bytes');
}
console.log(`wrote ${dst} (${out1.length} bytes, sha256 ${sha})`);
console.log(
  `timeline correction: ${changed} channel values repainted ` +
    `(ICJ "16:28" label removed; dot and event label untouched)`,
);
