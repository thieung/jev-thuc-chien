// Usage: node cases/02-intent-khi-agent-ban/drafts.mjs (needs TYPESAFE_API_KEY, ~160 Jev requests).
// Measure question drafts for the intent use case on the same 40 messages (Jev only).
import { readFileSync, writeFileSync } from 'node:fs';
import { callJev, choice } from '../../lib/jev-client.mjs';
const items = readFileSync(new URL('./dataset.jsonl', import.meta.url), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
import { INTENT_INSTRUCTIONS, INTENT_OPTIONS } from './case.mjs';
// v1: descriptions with examples, but the instructions do not say the assistant is busy.
// v2: the question used by case.mjs (adds "in the middle of a task").
// v3: v2 plus the cancel/steer boundary found by reading v2's confident mistakes.
const drafts = {
  'v0: chỉ tên option': choice('Classify this message.', { status_query: 'status query', cancel: 'cancel', steer: 'steer', new_task: 'new task' }),
  'v1: có mô tả, thiếu bối cảnh': choice('Which label fits this message best?', INTENT_OPTIONS),
  'v2: thêm bối cảnh đang bận': choice(INTENT_INSTRUCTIONS, INTENT_OPTIONS),
  'v3: thêm ranh giới cancel/steer': choice(INTENT_INSTRUCTIONS, {
    ...INTENT_OPTIONS,
    cancel: 'wants the whole task in progress dropped, with nothing more done on it (e.g. "dừng lại", "thôi bỏ đi", "cancel it")',
    steer: 'keeps the task in progress but changes it: adds a requirement, removes or limits one part, ' +
      'stops after a certain point, or changes direction (e.g. "thêm test cho case rỗng", "bỏ phần UI đi", ' +
      '"chỉ làm tới bước 2 thôi", "use Postgres instead")',
  }),
};
const out = {};
for (const [name, q] of Object.entries(drafts)) {
  const rows = await Promise.all(items.map(async (it) => {
    const r = await callJev({ state: it.message, questions: { intent: q } });
    const a = r.answers?.intent;
    return { id: it.id, msg: it.message, expected: it.expected, choice: a?.choice, conf: a?.confidence };
  }));
  const right = rows.filter((r) => r.choice === r.expected).length;
  const conf = rows.filter((r) => r.conf >= 0.75);
  const confRight = conf.filter((r) => r.choice === r.expected).length;
  const wrong = rows.filter((r) => r.choice !== r.expected).map((r) => `${r.msg} → ${r.choice} (${r.conf?.toFixed(2)})`);
  out[name] = { right, total: rows.length, confident: conf.length, confidentRight: confRight, wrong };
  console.log(name, `đúng ${right}/${rows.length}; conf≥0.75: ${conf.length}, đúng ${confRight}`);
  for (const w of wrong) console.log('   ✗', w);
}
writeFileSync(new URL('./results/drafts.json', import.meta.url), JSON.stringify(out, null, 2));
