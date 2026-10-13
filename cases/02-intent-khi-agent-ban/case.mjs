// Use case: the user sends a message while the agent is busy. Is it a status question, a cancel,
// a correction to the running task (steer), or a separate new task?
import { callJev, choice } from '../../lib/jev-client.mjs';
import { callGemini } from '../../lib/gemini-client.mjs';

const INTENTS = ['status_query', 'cancel', 'steer', 'new_task'];
const CONFIDENCE_FLOOR = Number(process.env.INTENT_FLOOR ?? 0.75);

// ---- before: a typical generative classifier prompt ----
// Carries the same information as the Jev question below (labels, meaning, examples), so the
// comparison is about the model and the output shape, not about who got the better description.
const intentSystemPrompt = `An AI assistant is in the middle of a task the user gave it earlier. The user has just sent another message.
Decide what the user wants and answer with exactly one label:
- status_query: wants an update on the task in progress: how far it is, what it is doing now, when it will finish (e.g. "xong chưa?", "đến đâu rồi", "progress?")
- cancel: wants the task in progress to stop (e.g. "dừng lại", "thôi bỏ đi", "cancel it")
- steer: keeps the task in progress but adds to it, corrects it, or changes its direction (e.g. "thêm test cho case rỗng", "use Postgres instead")
- new_task: asks for something separate that has nothing to do with the task in progress (e.g. "viết email cho khách", "review PR #12")
Answer with the label only.`;

// ---- shared fast path: naive keyword rule ----
// Deliberately broad: any message of at most 15 characters that contains a stop word is a cancel.
// The article uses this rule to show how a too-wide fast path breaks "dừng ở bước 3".
const STOP_WORDS = ['stop', 'cancel', 'abort', 'nevermind', 'never mind', 'dừng', 'hủy', 'thôi', '取消', '停'];
function quickClassify(msg) {
  const m = msg.trim().toLowerCase();
  if (m === '?') return 'status_query';
  if ([...m].length > 15) return null;
  const padded = ` ${m.replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const hit = STOP_WORDS.some((w) => (/\p{Script=Han}/u.test(w) ? m.includes(w) : padded.includes(` ${w} `)));
  return hit ? 'cancel' : null;
}

// ---- after: one Jev choice question (draft v2 in cases/02-intent-khi-agent-ban/drafts.mjs) ----
export const INTENT_INSTRUCTIONS =
  'An AI assistant is in the middle of a task the user gave it earlier. Read the latest user message ' +
  '(English, Vietnamese or Chinese). What does the user want the assistant to do about the task in progress?';
export const INTENT_OPTIONS = {
  status_query: 'wants an update on the task in progress: how far it is, what it is doing now, when it will finish ' +
    '(e.g. "xong chưa?", "đến đâu rồi", "progress?")',
  cancel: 'wants the task in progress to stop (e.g. "dừng lại", "thôi bỏ đi", "cancel it")',
  steer: 'keeps the task in progress but adds to it, corrects it, or changes its direction ' +
    '(e.g. "thêm test cho case rỗng", "use Postgres instead")',
  new_task: 'asks for something separate that has nothing to do with the task in progress ' +
    '(e.g. "viết email cho khách", "review PR #12")',
};
const intentQuestion = choice(INTENT_INSTRUCTIONS, INTENT_OPTIONS);

const schema = { type: 'OBJECT', properties: { intent: { type: 'STRING', enum: INTENTS } }, required: ['intent'] };

async function llm(item, withTask = false) {
  const context = withTask ? `Current task: ${item.task}\n` : '';
  const call = await callGemini({ prompt: `${intentSystemPrompt}\n\n${context}User message: ${item.message}`, schema });
  return { calls: [call], intent: call.json?.intent };
}

function jevVariant(name, buildState) {
  return {
    name,
    async fetch(item) {
      const fast = quickClassify(item.message);
      if (fast) return { calls: [], fast };
      const call = await callJev({ state: buildState(item), questions: { intent: intentQuestion } });
      return { calls: [call], answer: call.answers?.intent };
    },
    // Abstains below the confidence floor; the "active" variant decides what happens then.
    decide(raw) {
      if (raw.fast) return raw.fast;
      if (!raw.answer) return 'error';
      return raw.answer.confidence >= CONFIDENCE_FLOOR ? raw.answer.choice : 'abstain';
    },
  };
}

const before = {
  name: 'Trước: keyword + LLM',
  async fetch(item) {
    const fast = quickClassify(item.message);
    return fast ? { calls: [], fast } : llm(item);
  },
  // Fall back to new_task when the classifier fails, so the message is never dropped.
  decide: (raw) => raw.fast ?? raw.intent ?? 'new_task',
};

// Same LLM with the same task context Jev gets below, so context and model effects stay separable.
const beforeWithTask = {
  name: 'Trước: LLM + ngữ cảnh task',
  async fetch(item) {
    const fast = quickClassify(item.message);
    return fast ? { calls: [], fast } : llm(item, true);
  },
  decide: before.decide,
};

const jevMessageOnly = jevVariant('Sau: Jev (chỉ message)', (item) => item.message);
const jevWithTask = jevVariant('Sau: Jev + ngữ cảnh task', (item) => ({ current_task: item.task, new_message: item.message }));

// Active mode: accept Jev above the confidence floor, otherwise run the old LLM classifier.
const active = {
  name: 'Active: Jev + ngữ cảnh, fallback LLM',
  async fetch(item) {
    const raw = await jevWithTask.fetch(item);
    if (!raw.fast && !(raw.answer?.confidence >= CONFIDENCE_FLOOR)) {
      const fb = await llm(item, true);
      raw.calls.push(...fb.calls);
      raw.fallback = fb.intent;
    }
    return raw;
  },
  decide(raw) {
    const d = jevWithTask.decide(raw);
    return d === 'abstain' || d === 'error' ? raw.fallback ?? 'new_task' : d;
  },
};

export default {
  variants: [before, beforeWithTask, jevMessageOnly, jevWithTask, active],
  isCorrect: (decision, expected) => decision === expected,
  extraMetrics(rows) {
    const coverage = (name) => {
      const d = rows.map((r) => r.decisions[name]).filter(Boolean);
      const covered = rows.filter((r) => !['abstain', 'error'].includes(r.decisions[name]));
      const right = covered.filter((r) => r.decisions[name] === r.expected).length;
      return `${covered.length}/${d.length} mục Jev đủ tự tin (≥ ${CONFIDENCE_FLOOR}); đúng ${right}/${covered.length} trong số đó`;
    };
    const fastPath = rows.filter((r) => r.raw['Trước: keyword + LLM']?.fast).length;
    const fallbacks = rows.filter((r) => r.raw['Active: Jev + ngữ cảnh, fallback LLM']?.fallback !== undefined).length;
    return {
      'Đi fast-path keyword (không gọi model)': `${fastPath}/${rows.length}`,
      'Jev chỉ message': coverage('Sau: Jev (chỉ message)'),
      'Jev + ngữ cảnh': coverage('Sau: Jev + ngữ cảnh task'),
      'Active phải fallback sang LLM': `${fallbacks}/${rows.length}`,
    };
  },
};
