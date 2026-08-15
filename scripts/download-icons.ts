import { mkdirSync, writeFileSync, existsSync, statSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { Calc } from '../src/engine/calc.ts';
import { iconDir, iconFileName } from '../src/lib/iconDir.ts';

const RENDER = 'https://render.albiononline.com/v1/item';
const OUT = join(process.cwd(), 'public', 'icons');
const CONCURRENCY = 12;
const SIZE = 217;
const RETRIES = 2;

const families = [
  ...Object.keys(Calc.FAMILIES),
  ...Object.keys(Calc.JOURNAL).map(p => `JOURNAL_${p}`),
];

const variants: Array<{ fam: string; tier: string; enchant: number; quality: number }> = [];
for (const fam of families) {
  for (const tier of Calc.TIERS) {
    for (const enchant of Calc.ENCHANTS) {
      for (let quality = 1; quality <= 5; quality++) {
        variants.push({ fam, tier, enchant, quality });
      }
    }
  }
}

const renderId = (fam: string, tier: string, enchant: number): string =>
  `${tier}_${fam}${enchant > 0 ? `@${enchant}` : ''}`;

let done = 0;
let missing = 0;
let failed = 0;

const results: Record<string, string[]> = {};

async function fetchIcon(url: string): Promise<Buffer | null> {
  for (let i = 0; i <= RETRIES; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) return null;
      return buf;
    } catch {
      if (i === RETRIES) return null;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return null;
}

async function worker(queue: typeof variants): Promise<void> {
  while (queue.length) {
    const v = queue.pop();
    if (!v) break;
    const dir = iconDir(v.fam);
    const file = iconFileName(v.fam, { tier: v.tier as never, enchant: v.enchant, quality: v.quality });
    const target = join(OUT, dir, file);
    if (existsSync(target) && statSync(target).size > 100) {
      (results[v.fam] ??= []).push(file);
      done++;
      continue;
    }
    const url = `${RENDER}/${renderId(v.fam, v.tier, v.enchant)}.png?quality=${v.quality}&size=${SIZE}`;
    const buf = await fetchIcon(url);
    if (buf) {
      mkdirSync(join(OUT, dir), { recursive: true });
      writeFileSync(target, buf);
      (results[v.fam] ??= []).push(file);
    } else {
      missing++;
    }
    done++;
    if (done % 200 === 0) console.log(`${done}/${variants.length} (missing: ${missing})`);
  }
}

async function download(): Promise<void> {
  const queue = [...variants];
  console.log(`Familles : ${families.length}, variantes : ${variants.length}`);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
  console.log(`Terminé : ${done}/${variants.length}, manquantes (404/erreur) : ${missing}`);
}

function writeFallbacks(): void {
  for (const fam of families) {
    const dir = iconDir(fam);
    const fallback = join(OUT, dir, `${fam}.png`);
    if (existsSync(fallback) && statSync(fallback).size > 100) continue;
    const candidates = (results[fam] ?? []).filter(f => f !== `${fam}.png`);
    const pick = candidates[0];
    if (pick) {
      const src = join(OUT, dir, pick);
      if (existsSync(src)) {
        copyFileSync(src, fallback);
      }
    } else {
      failed++;
      console.log(`Aucune icône pour ${fam} (dossier vide) — fallback absent`);
    }
  }
}

function writeManifest(): void {
  const manifest = join(OUT, 'manifest.json');
  writeFileSync(manifest, JSON.stringify(results, null, 0));
  console.log(`Manifest écrit : ${join('public/icons', 'manifest.json')}`);
}

await download();
writeFallbacks();
writeManifest();
console.log(`Fallbacks manquants : ${failed}`);
