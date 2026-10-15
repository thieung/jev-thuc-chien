// Use case: vector search returns 8 candidate memories; which ones go into the model's context?
// Before: the first 5 in retrieval order.
// After: read-side admission. One request per turn, one score question per candidate, admit when
// the normalized score >= ADMIT_THRESHOLD or when confidence < 0.5 (recall bias), rank by score,
// cap at 5 entries and a 200-token budget. Jev's score is a level position (0..levels-1), so it is
// divided by (levels - 1) before any threshold is applied.
import { callJev, score } from '../../lib/jev-client.mjs';
import { callGemini } from '../../lib/gemini-client.mjs';

const MAX_ENTRIES = 5;
const MAX_TOKENS = 200;
const ADMIT_THRESHOLD = Number(process.env.ADMIT_THRESHOLD ?? 0.25); // on the normalized 0-1 scale
const MIN_CONFIDENCE = Number(process.env.MIN_CONFIDENCE ?? 0.5);
const LEVELS = [
  'no: the note is about something else, even if it shares a word or a table name with the request',
  'a little: same area, but the assistant would do this request just as well without it',
  'yes: a fact, rule or constraint the assistant needs to do this request correctly',
];
const INSTRUCTION = 'Would showing this note to the assistant help it handle the user request in `Query`?';

// Rough token estimate (≈ 4 chars/token) used only to apply the injection budget the same way for every variant.
const tokens = (s) => Math.ceil(s.length / 4);
function fillBudget(ids, item) {
  const out = [];
  let used = 0;
  for (const id of ids) {
    const t = tokens(item.candidates.find((c) => c.id === id).content);
    if (out.length >= MAX_ENTRIES || used + t > MAX_TOKENS) break;
    out.push(id);
    used += t;
  }
  return out;
}

const legacy = {
  name: 'Trước: top-5 theo thứ tự retrieval',
  fetch: async () => ({ calls: [] }),
  decide: (raw, item) => fillBudget(item.candidates.map((c) => c.id), item),
};

const llmRerank = {
  name: 'Trước+: LLM chọn memory',
  async fetch(item) {
    const list = item.candidates.map((c) => `${c.id}: ${c.content}`).join('\n');
    const prompt = `Pick the notes the assistant needs in order to handle the user request correctly. List their ids, most important first. Return an empty list if none are needed.\n\nRecent context: ${item.context || '(none)'}\nUser request: ${item.query}\n\nCandidate memories:\n${list}`;
    const call = await callGemini({ prompt, schema: { type: 'OBJECT', properties: { ids: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['ids'] } });
    return { calls: [call], ids: call.json?.ids };
  },
  // Fail open to the retrieval order when admission cannot run.
  decide: (raw, item) => fillBudget(raw.ids ?? item.candidates.map((c) => c.id), item),
};

const jevAdmit = {
  name: 'Sau: Jev chấm từng candidate',
  async fetch(item) {
    const questions = Object.fromEntries(item.candidates.map((c, i) => [
      `candidate_${i}`, score(`${INSTRUCTION} Note: ${c.content}`, LEVELS),
    ]));
    const state = `Context: ${item.context}\nQuery: ${item.query}`;
    const call = await callJev({ state, questions });
    return { calls: [call], answers: call.answers };
  },
  decide(raw, item) {
    if (!raw.answers) return legacy.decide(raw, item);
    const norm = (a) => a.score / (LEVELS.length - 1);
    const scored = item.candidates.map((c, i) => ({ id: c.id, i, a: raw.answers[`candidate_${i}`] }));
    const accepted = scored.filter(({ a }) => a && (a.confidence < MIN_CONFIDENCE || norm(a) >= ADMIT_THRESHOLD));
    accepted.sort((x, y) => norm(y.a) - norm(x.a) || x.i - y.i);
    return fillBudget(accepted.map((x) => x.id), item);
  },
};

const recallOf = (ids, expected) => (expected.length ? expected.filter((e) => ids.includes(e)).length / expected.length : 1);

export default {
  variants: [legacy, llmRerank, jevAdmit],
  // "Correct" means every memory the request needs made it into context.
  isCorrect: (ids, expected) => Array.isArray(ids) && expected.every((e) => ids.includes(e)),
  extraMetrics(rows) {
    const out = {};
    for (const name of [legacy.name, llmRerank.name, jevAdmit.name]) {
      const rs = rows.filter((r) => r.decisions[name]);
      if (!rs.length) continue;
      const needed = rs.reduce((a, r) => a + r.expected.length, 0);
      const found = rs.reduce((a, r) => a + r.expected.filter((e) => r.decisions[name].includes(e)).length, 0);
      const injected = rs.reduce((a, r) => a + r.decisions[name].length, 0);
      const noise = rs.reduce((a, r) => a + r.decisions[name].filter((id) => !r.expected.includes(id)).length, 0);
      out[name] = `memory cần thiết được đưa vào ${found}/${needed} (recall ${(100 * found / needed).toFixed(0)}%); đưa vào tổng ${injected}, trong đó nhiễu ${noise}; recall TB/câu ${(100 * rs.reduce((a, r) => a + recallOf(r.decisions[name], r.expected), 0) / rs.length).toFixed(0)}%`;
    }
    return out;
  },
};
