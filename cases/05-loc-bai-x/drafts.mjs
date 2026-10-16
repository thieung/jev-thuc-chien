// Usage: node cases/05-loc-bai-x/drafts.mjs (needs TYPESAFE_API_KEY, ~51 Jev requests; reads results/raw.jsonl,
// so run `node lib/run-case.mjs cases/05-loc-bai-x "--only=Sau: Jev 4 câu hỏi + policy"` first).
// Compare one combined "worth reading" noul against the 4 atomic questions on the same 51 posts (Jev only).
import { readFileSync, writeFileSync } from 'node:fs';
import { callJev, noul } from '../../lib/jev-client.mjs';
import { keepFromAnswers } from './case.mjs';
const items = readFileSync(new URL('./dataset.jsonl', import.meta.url), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const raw = readFileSync(new URL('./results/raw.jsonl', import.meta.url), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const INTEREST = 'Building with AI coding agents (Claude Code, Codex, Cursor, MCP, hooks, subagents, AGENTS.md): concrete settings, commands, tools, measurements, postmortems.';
const combined = noul('Is `post` worth reading for `interest`?', 'worth reading', 'not worth reading');
const rows = await Promise.all(items.map(async (it) => {
  const r = await callJev({ state: { interest: INTEREST, post: it.text }, questions: { worth: combined } });
  const v = r.answers?.worth?.noul;
  return { id: it.id, expected: it.expected, v, action: v >= 0.5 ? 'keep' : 'hide' };
}));
const stats = (acts) => {
  const right = acts.filter((a, i) => a === items[i].expected).length;
  const kept = acts.filter((a) => a === 'keep');
  const keptRight = acts.filter((a, i) => a === 'keep' && items[i].expected === 'keep').length;
  const lost = acts.filter((a, i) => a === 'hide' && items[i].expected === 'keep').length;
  return { right, kept: kept.length, precision: Math.round(100 * keptRight / kept.length), lost };
};
const one = stats(rows.map((r) => r.action));
const fourActs = items.map((it) => {
  const rec = raw.find((x) => x.id === it.id);
  return keepFromAnswers(rec.raw['Sau: Jev 4 câu hỏi + policy'].answers);
});
const four = stats(fourActs);
// same atomic answers, bait threshold lowered to 0.4 (tuned on this same data, so optimistic)
const fourTuned = stats(items.map((it) => {
  const a = raw.find((x) => x.id === it.id).raw['Sau: Jev 4 câu hỏi + policy'].answers;
  return a.on_topic.noul >= 0.5 && a.actionable.noul >= 0.5 && a.engagement_bait.noul < 0.4 ? 'keep' : 'hide';
}));
const hideV = rows.filter((r) => r.expected === 'hide').map((r) => r.v);
const keepV = rows.filter((r) => r.expected === 'keep').map((r) => r.v);
const range = (a) => `${Math.min(...a).toFixed(2)}–${Math.max(...a).toFixed(2)}`;
console.log('1 câu gộp:', one, 'noul nhóm keep', range(keepV), 'nhóm hide', range(hideV));
console.log('4 câu tách (replay):', four);
console.log('4 câu tách, bait < 0.4:', fourTuned);
// best threshold for combined, to show a single number cannot be fixed by tuning
let best = null;
for (let t = 0.05; t < 1; t += 0.05) { const s = stats(rows.map((r) => (r.v >= t ? 'keep' : 'hide'))); if (!best || s.right > best.right) best = { t: +t.toFixed(2), ...s }; }
console.log('1 câu gộp, ngưỡng tốt nhất:', best);
console.log('sai (1 câu, 0.5):', rows.filter((r) => r.action !== r.expected).map((r) => `${r.id}:${r.expected}:${r.v.toFixed(2)}`).join(' '));
writeFileSync(new URL('./results/drafts.json', import.meta.url), JSON.stringify({ one, four, fourTuned, best, rows }, null, 2));
