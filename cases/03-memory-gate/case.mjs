// Use case: before paying an LLM to extract "memories" from a batch of team chat, ask Jev whether
// the batch holds anything durable at all, and skip the extraction when it confidently does not.
// Skip rule: noul <= 0.15 AND score confidence >= 0.50 AND most likely level is the lowest one.
import { callJev, noul, score } from '../../lib/jev-client.mjs';
import { callGemini } from '../../lib/gemini-client.mjs';

const SKIP_THRESHOLD = Number(process.env.SKIP_THRESHOLD ?? 0.15);
const MIN_CONFIDENCE = Number(process.env.MIN_CONFIDENCE ?? 0.5);

const questions = {
  has_durable_context: noul(
    'Would a teammate reading this chat batch a month from now still need anything in it for their work?',
    'it records a decision, a rule or convention, a preference, a project fact, a root cause, a change of owner, or a task still left open',
    'it only has greetings, thanks, jokes, food, meeting times, build or deploy status updates, or questions that were already answered',
  ),
  // Short one-word labels on purpose: the article shows that Jev reads such labels its own way.
  durability_level: score('How long will the useful content in this batch stay useful?', ['noise', 'short-lived', 'long-lived']),
};

const ALLOWED = ['people', 'projects', 'decisions', 'todos', 'preferences', 'events'];
const extractionPrompt = `You maintain the long-term memory of a team assistant. Read the chat messages below and write down only facts the team will still need weeks from now.
Keep: decisions, conventions, preferences, project facts, owners, root causes, open todos.
Skip: small talk, jokes, scheduling, status updates, questions already answered, anything you are unsure about, and any secret or personal data (passwords, keys, phone numbers, addresses, health or money details).
Return a JSON array. Each item: {"type": one of ${ALLOWED.join('|')}, "summary": one short sentence, "topics": [...], "entities": [...], "confidence": 0-1}.
Return [] when nothing qualifies.`;
const extractionSchema = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      type: { type: 'STRING', enum: ALLOWED }, summary: { type: 'STRING' },
      topics: { type: 'ARRAY', items: { type: 'STRING' } }, entities: { type: 'ARRAY', items: { type: 'STRING' } },
      confidence: { type: 'NUMBER' },
    },
    required: ['type', 'summary'],
  },
};

// Same noul, but every score level is described by what the batch contains, so "scheduling" or
// "status update" no longer sits between two vague labels.
const questionsDescriptive = {
  has_durable_context: questions.has_durable_context,
  durability_level: score('Which description best fits the most durable content in this batch of chat messages?', [
    'nothing to remember: greetings, thanks, jokes, lunch, meeting times, build or deploy status, questions already answered',
    'useful only for today: in-progress status or a plan that will be obsolete after this session',
    'worth remembering for weeks: a decision, rule, preference, project fact, root cause, owner change, or open todo',
  ]),
};

const topLevel = (probabilities) => Number(Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0][0]);

export function veto(answers, skipThreshold = SKIP_THRESHOLD, minConfidence = MIN_CONFIDENCE, skipLevel = 0) {
  const p = answers?.has_durable_context?.noul;
  const s = answers?.durability_level;
  if (p === undefined || !s) return false; // fail open
  return p <= skipThreshold && s.confidence >= minConfidence && topLevel(s.probabilities) <= skipLevel;
}

const before = {
  name: 'Trước: luôn gọi LLM extraction',
  async fetch(item) {
    const call = await callGemini({ prompt: `${extractionPrompt}\n\n${item.batch}`, schema: extractionSchema });
    return { calls: [call], items: call.json };
  },
  decide: () => 'extract',
};

const after = {
  name: 'Sau: Jev gate trước extraction',
  async fetch(item) {
    const call = await callJev({ state: item.batch, questions });
    return { calls: [call], answers: call.answers };
  },
  decide: (raw) => (raw.answers && veto(raw.answers) ? 'skip' : 'extract'),
};

const afterDescriptive = {
  name: 'Sau: Jev gate, rubric mô tả rõ',
  async fetch(item) {
    const call = await callJev({ state: item.batch, questions: questionsDescriptive });
    return { calls: [call], answers: call.answers };
  },
  decide: after.decide,
};

export default {
  variants: [before, after, afterDescriptive],
  isCorrect: (d, expected) => d === expected,
  extraMetrics(rows) {
    const B = before.name;
    const A = after.name;
    const extractCost = (r) => r.raw[B]?.calls?.[0]?.costUsd ?? 0;
    const beforeCost = rows.reduce((a, r) => a + extractCost(r), 0);
    const pipelineCost = (name) => rows.reduce((a, r) => a + (r.raw[name]?.calls?.[0]?.costUsd ?? 0) + (r.decisions[name] === 'skip' ? 0 : extractCost(r)), 0);
    const llmEmpty = rows.filter((r) => Array.isArray(r.raw[B]?.items) && r.raw[B].items.length === 0);
    // Memories the LLM wrote from batches labelled "nothing durable": stored noise, not just wasted spend.
    const junkItems = rows.filter((r) => r.expected === 'skip').reduce((a, r) => a + (r.raw[B]?.items?.length ?? 0), 0);
    const sweepFor = (name) => {
      const out = [];
      for (const [t, c, lvl] of [[0.15, 0.5, 0], [0.15, 0.5, 1], [0.15, 0, 2], [0.3, 0, 2], [0.05, 0.7, 0]]) {
        const skipped = rows.filter((r) => r.raw[name]?.answers && veto(r.raw[name].answers, t, c, lvl));
        const falseSkips = skipped.filter((r) => r.expected === 'extract').length;
        out.push(`noul≤${t}, conf≥${c}, level≤${lvl}: skip ${skipped.length}/${rows.length}, skip nhầm ${falseSkips}`);
      }
      return out;
    };
    const D = afterDescriptive.name;
    const skipped = rows.filter((r) => r.decisions[A] === 'skip');
    const skippedD = rows.filter((r) => r.decisions[D] === 'skip');
    const confAvg = (name, exp) => {
      const xs = rows.filter((r) => r.expected === exp && r.raw[name]?.answers).map((r) => r.raw[name].answers.durability_level.confidence);
      return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : 'n/a';
    };
    return {
      'Jev gate (rubric mô tả rõ) bỏ qua extraction': `${skippedD.length}/${rows.length}, skip nhầm ${skippedD.filter((r) => r.expected === 'extract').length}`,
      'Confidence TB của score trên batch rác: rubric nhãn ngắn / rubric mô tả rõ': `${confAvg(A, 'skip')} / ${confAvg(D, 'skip')}`,
      'Sweep rubric nhãn ngắn (replay)': sweepFor(A),
      'Sweep rubric mô tả rõ (replay)': sweepFor(D),
      'Batch không có gì bền vững (nhãn skip)': `${rows.filter((r) => r.expected === 'skip').length}/${rows.length}`,
      'LLM extraction trả [] (trả tiền mà không thu được gì)': `${llmEmpty.length}/${rows.length}`,
      'Jev gate bỏ qua extraction': `${skipped.length}/${rows.length}`,
      'Skip nhầm batch có nội dung bền vững (lỗi nguy hiểm)': `${skipped.filter((r) => r.expected === 'extract').length}`,
      'Memory LLM trích ra từ batch rác (bị lưu nếu không có gate)': `${junkItems}`,
      'Chi phí pipeline trước (USD, cả bộ)': beforeCost.toFixed(6),
      'Chi phí pipeline sau, rubric nhãn ngắn = Jev + extraction còn lại (USD)': pipelineCost(A).toFixed(6),
      'Chi phí pipeline sau, rubric mô tả rõ (USD)': pipelineCost(D).toFixed(6),
    };
  },
};
