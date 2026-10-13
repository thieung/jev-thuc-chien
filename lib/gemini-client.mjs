// Baseline "before" classifier: a cheap general LLM asked for structured JSON, the way most teams do it today.
export const GEMINI_MODEL = process.env.BASELINE_MODEL || 'gemini-3.1-flash-lite';
// USD per 1M tokens, ai.google.dev/gemini-api/docs/pricing, checked 2026-10-11 (paid tier, text).
// Runs may use the free tier; cost is projected at paid-tier prices so it reflects production.
const PRICES = {
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
};
export const GEMINI_PRICE = PRICES[GEMINI_MODEL];

// The free tier allows 10 requests/minute per model, so calls are spaced out and a 429 is retried
// after the server's retryDelay. A 503 (model overloaded) or a timeout is retried after a pause.
// Latency below is measured on the successful attempt only.
const MIN_GAP_MS = Number(process.env.GEMINI_MIN_GAP_MS ?? 6700);
let nextSlot = 0;
async function waitForSlot() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + MIN_GAP_MS;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

// lib/agent-baseline.mjs swaps in a transport that exports prompts or answers them from files,
// so a reader's own coding agent can stand in for Gemini without calling the API.
let transport = null;
export function setBaselineTransport(fn) { transport = fn; }

export async function callGemini(args) {
  if (transport) return transport(args);
  for (let attempt = 0; ; attempt++) {
    await waitForSlot();
    let result;
    try { result = await callGeminiOnce(args); } catch (e) {
      if (e?.name !== 'TimeoutError' || attempt >= 4) throw e;
      result = { status: 'timeout' };
    }
    if (![429, 503, 'timeout'].includes(result.status) || attempt >= 4) return result;
    const delay = result.status === 429
      ? Number(/"retryDelay":\s*"(\d+)/.exec(JSON.stringify(result.error))?.[1] ?? 30)
      : 10 * (attempt + 1);
    await new Promise((r) => setTimeout(r, (delay + 1) * 1000));
  }
}

async function callGeminiOnce({ prompt, schema, model = GEMINI_MODEL, timeoutMs = 30000 }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  const started = performance.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const latencyMs = Math.round(performance.now() - started);
  const body = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, status: res.status, latencyMs, error: body };
  const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  const u = body?.usageMetadata ?? {};
  const inputTokens = u.promptTokenCount ?? 0;
  const outputTokens = (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0);
  let json = null;
  try { json = JSON.parse(text); } catch { /* reported as invalid below */ }
  return {
    ok: json !== null,
    status: res.status,
    latencyMs,
    model,
    json,
    raw: json === null ? text : undefined,
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    costUsd: (inputTokens / 1e6) * PRICES[model].input + (outputTokens / 1e6) * PRICES[model].output,
  };
}
