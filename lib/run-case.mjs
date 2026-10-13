// Runs one case: every labelled item goes through each variant (e.g. "before: LLM", "after: Jev"),
// then writes raw API results and a Markdown summary.
//
// A case exports { variants: [{ name, fetch(item) -> raw, decide(raw, item) -> label }], isCorrect }.
// `fetch` does the API calls and records them in raw.calls; `decide` is pure policy code, so
// --replay can change thresholds and re-score without paying for a single new call.
//
// Usage:
//   node lib/run-case.mjs cases/<case-dir>                 # live run
//   node lib/run-case.mjs cases/<case-dir> --replay        # re-apply policy to the saved run
//   node lib/run-case.mjs cases/<case-dir> --only='<a>|<b>'  # re-run some variants, keep the rest
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { summarize, renderMarkdown } from './metrics.mjs';

const [caseDir, ...flags] = process.argv.slice(2);
if (!caseDir) { console.error('usage: node lib/run-case.mjs cases/<case-dir> [--replay] [--only=<variant>]'); process.exit(2); }
const replay = flags.includes('--replay');
const nfc = (s) => s.normalize('NFC');
const only = flags.find((f) => f.startsWith('--only='))?.split('=')[1]?.split('|').map(nfc);
const concurrency = Number(flags.find((f) => f.startsWith('--concurrency='))?.split('=')[1] ?? 4);

const dir = resolve(caseDir);
const spec = (await import(pathToFileURL(join(dir, 'case.mjs')).href)).default;
const items = readFileSync(join(dir, 'dataset.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const seen = new Set();
for (const it of items) {
  if (!it.id || !('expected' in it)) throw new Error(`item missing id/expected: ${JSON.stringify(it).slice(0, 80)}`);
  if (seen.has(it.id)) throw new Error(`duplicate id ${it.id}`);
  seen.add(it.id);
}
// --only re-runs some variants and keeps the saved results of the others, so the report always
// covers every variant without paying twice.
const toRun = spec.variants.filter((v) => !only || only.includes(nfc(v.name)));
if (only && toRun.length !== only.length) {
  console.error(`unknown variant in --only; known: ${spec.variants.map((v) => v.name).join(' | ')}`);
  process.exit(2);
}
const variants = spec.variants;

const resultsDir = join(dir, 'results');
mkdirSync(resultsDir, { recursive: true });
const rawPath = join(resultsDir, 'raw.jsonl');

async function pool(list, n, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < list.length) { const i = next++; out[i] = await fn(list[i]); }
  }));
  return out;
}

let rows;
if (replay) {
  if (!existsSync(rawPath)) { console.error(`no saved run at ${rawPath}`); process.exit(1); }
  rows = readFileSync(rawPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
} else {
  const previous = only && existsSync(rawPath)
    ? new Map(readFileSync(rawPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((r) => [r.id, r.raw]))
    : new Map();
  rows = await pool(items, concurrency, async (item) => {
    const row = { id: item.id, expected: item.expected, tags: item.tags ?? [], raw: { ...(previous.get(item.id) ?? {}) } };
    for (const v of toRun) {
      try { row.raw[v.name] = await v.fetch(item); } catch (e) { row.raw[v.name] = { calls: [], error: String(e) }; }
    }
    process.stderr.write('.');
    return row;
  });
  process.stderr.write('\n');
  writeFileSync(rawPath, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

const byId = new Map(items.map((it) => [it.id, it]));
for (const r of rows) {
  r.decisions = {};
  for (const v of variants) if (r.raw[v.name]) r.decisions[v.name] = v.decide(r.raw[v.name], byId.get(r.id));
}

const summary = summarize(rows, spec, variants);
const md = renderMarkdown(summary, rows, spec, variants, { caseName: basename(dir), replay });
writeFileSync(join(resultsDir, 'summary.json'), JSON.stringify(summary, null, 2));
writeFileSync(join(resultsDir, 'summary.md'), md);
console.log(md);
