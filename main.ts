// news-image-20261119 v2 — "The World in One Day" (19 Nov 2026 poster).
// Node 22, standard library only. The entry image sits beside this file as
// entry.png; the program copies it to /output/entry.png (or to
// MAKEFUN_OUTPUT_DIR when set, for local runs). No network, no randomness:
// two runs write identical bytes.
//
// Local run:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const src = new URL('./entry.png', import.meta.url);
const dst = join(outDir, 'entry.png');
copyFileSync(src, dst);
// Verify the copy is complete: a truncated write must fail loudly instead
// of silently shipping a broken image.
const srcBytes = statSync(src).size;
const dstBytes = statSync(dst).size;
if (srcBytes !== dstBytes) {
  throw new Error(
    `entry.png copy incomplete: ${dstBytes} of ${srcBytes} bytes written`,
  );
}
console.log(`wrote ${dst} (${dstBytes} bytes)`);
