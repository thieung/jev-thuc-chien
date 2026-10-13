// Lets a reader's own coding agent (Claude Code, Codex, Cursor...) stand in for the Gemini baseline
// of a case without seeing the labels. Neither command calls any API.
//   export: runs the "Trước" (before) variants with a capturing transport and writes the exact
//           prompts the baseline gets, one file per prompt, with no ids, labels or results.
//   score:  replays the author's saved run (results/raw.jsonl) with the agent's answers in place of
//           Gemini, then scores it with the case's own decide/isCorrect/extraMetrics.
//
// Usage:
//   node lib/agent-baseline.mjs export cases/<case-dir>
//   node lib/agent-baseline.mjs score cases/<case-dir> --label="Claude Code, <model>, subagent per prompt"
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setBaselineTransport } from './gemini-client.mjs';
import { summarize, renderMarkdown } from './metrics.mjs';

const [cmd, caseDir, ...flags] = process.argv.slice(2);
if (!['export', 'score'].includes(cmd) || !caseDir) {
  console.error('usage: node lib/agent-baseline.mjs export|score cases/<case-dir> [--label=...]');
  process.exit(2);
}
const dir = resolve(caseDir);
const caseName = basename(dir);
const workDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'agent-baseline', caseName);
const promptsDir = join(workDir, 'prompts');
const answersDir = join(workDir, 'answers');
const show = (p) => relative(process.cwd(), p) || '.';
const spec = (await import(pathToFileURL(join(dir, 'case.mjs')).href)).default;
const items = readFileSync(join(dir, 'dataset.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

// Same prompt and schema always map to the same file, so answers survive a re-export.
const promptId = ({ prompt, schema }) =>
  createHash('sha256').update(`${prompt}\n${JSON.stringify(schema)}`).digest('hex').slice(0, 16);
// Gemini schemas use OBJECT/STRING; lower-case them so any model reads them as plain JSON Schema.
const jsonSchema = (s) => JSON.parse(JSON.stringify(s), (k, v) => (k === 'type' && typeof v === 'string' ? v.toLowerCase() : v));
const promptFile = ({ prompt, schema }) =>
  `${prompt}\n\n---\nAnswer with one JSON value that matches this JSON Schema, and nothing else:\n\n${JSON.stringify(jsonSchema(schema), null, 2)}\n`;

if (cmd === 'export') {
  const prompts = new Map();
  const used = new Set();
  let current = null;
  setBaselineTransport(async (args) => {
    prompts.set(promptId(args), args);
    used.add(current);
    return { ok: false, status: 'export' };
  });
  for (const v of spec.variants.filter((x) => x.name.startsWith('Trước'))) {
    current = v.name;
    for (const item of items) await v.fetch(item);
  }
  rmSync(promptsDir, { recursive: true, force: true });
  mkdirSync(promptsDir, { recursive: true });
  mkdirSync(answersDir, { recursive: true });
  for (const [id, args] of prompts) writeFileSync(join(promptsDir, `${id}.md`), promptFile(args));
  writeFileSync(join(workDir, 'variants.json'), `${JSON.stringify([...used], null, 2)}\n`);
  console.log(`${prompts.size} prompt cho: ${[...used].join(' | ')}`);
  console.log(`Prompt: ${show(promptsDir)}/<id>.md`);
  console.log(`Ghi câu trả lời vào: ${show(answersDir)}/<id>.json (cùng <id>, chỉ có JSON)`);
  process.exit(0);
}

// ---- score ----
const rawPath = join(dir, 'results', 'raw.jsonl');
const variantsPath = join(workDir, 'variants.json');
if (!existsSync(rawPath)) { console.error(`không có lần chạy đã lưu ở ${show(rawPath)}`); process.exit(1); }
if (!existsSync(variantsPath)) { console.error(`chưa export: chạy node lib/agent-baseline.mjs export ${caseDir}`); process.exit(1); }
const label = flags.find((f) => f.startsWith('--label='))?.slice('--label='.length) || 'coding agent';
const agentNames = JSON.parse(readFileSync(variantsPath, 'utf8'));
const byId = new Map(items.map((it) => [it.id, it]));
const saved = readFileSync(rawPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const missing = new Set();
const invalid = new Set();
setBaselineTransport(async (args) => {
  const id = promptId(args);
  const file = join(answersDir, `${id}.json`);
  if (!existsSync(file)) { missing.add(id); return { ok: false, status: 'missing' }; }
  let json = null;
  try { json = JSON.parse(readFileSync(file, 'utf8')); } catch { invalid.add(id); }
  return { ok: json !== null, status: json === null ? 'invalid' : 200, model: label, json };
});

const rows = [];
for (const s of saved) {
  const row = { ...s, raw: { ...s.raw } };
  for (const v of spec.variants.filter((x) => agentNames.includes(x.name))) row.raw[v.name] = await v.fetch(byId.get(s.id));
  rows.push(row);
}
if (missing.size) {
  console.error(`còn thiếu ${missing.size} câu trả lời trong ${show(answersDir)}, ví dụ: ${[...missing].slice(0, 5).join(', ')}`);
  process.exit(1);
}

function decideAll(list) {
  for (const r of list) {
    r.decisions = {};
    for (const v of spec.variants) if (r.raw[v.name]) r.decisions[v.name] = v.decide(r.raw[v.name], byId.get(r.id));
  }
  return summarize(list, spec, spec.variants);
}
const author = decideAll(saved.map((s) => ({ ...s })));
const mine = decideAll(rows);
// Latency, tokens and cost of a coding agent are not measured here, so they are shown as "-".
for (const n of agentNames) Object.assign(mine.variants[n], { latencyP50: null, latencyP95: null, avgInputTokensPerItem: null, costPer1000ItemsUsd: null });

const authorModel = saved.flatMap((r) => agentNames.flatMap((n) => r.raw[n]?.calls ?? [])).find((c) => c.model)?.model ?? 'Gemini';
const acc = (s) => `${s.correct}/${s.items} (${s.accuracy})`;
const header = [
  `# Kết quả: ${caseName}, cách làm "trước" chạy bằng ${label}`,
  '',
  `| Cách làm | Tác giả (${authorModel}) | ${label} |`,
  '| --- | --- | --- |',
  ...agentNames.map((n) => `| ${n} | ${acc(author.variants[n])} | ${acc(mine.variants[n])} |`),
  '',
  `- Chỉ các cách làm trong bảng trên được chạy lại bằng agent của bạn (${rows.length} mục, ${invalid.size} câu trả lời không phải JSON hợp lệ, được tính như một lượt gọi lỗi). Các cách làm khác lấy nguyên kết quả đã lưu trong \`results/raw.jsonl\`, không gọi API.`,
  '- Latency, token và chi phí của agent không đo được nên để "-". Chỉ số riêng nào dựa trên chi phí của cách làm "trước" cũng không còn ý nghĩa.',
  `- Bản của tác giả: \`cases/${caseName}/results/summary.md\`.`,
  '',
].join('\n');
const md = header + renderMarkdown(mine, rows, spec, spec.variants, { caseName, replay: false }).replace(/^# .*\n/, '');
writeFileSync(join(workDir, 'summary.md'), md);
console.log(md);
console.error(`Đã ghi ${show(join(workDir, 'summary.md'))}`);
