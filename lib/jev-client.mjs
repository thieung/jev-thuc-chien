// Minimal TypeSafe Jev client: one POST, no retries, so every call in a report is a real, counted call.
export const JEV_MODEL = process.env.JEV_MODEL || 'jev-1.13.0';
export const JEV_PRICE_INPUT_PER_M = 0.042; // USD, docs.typesafe.ai/models, checked 2026-10-11; output is free

export async function callJev({ state, questions, model = JEV_MODEL, timeoutMs = 15000 }) {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error('TYPESAFE_API_KEY is not set');
  const started = performance.now();
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, state, questions }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const latencyMs = Math.round(performance.now() - started);
  const body = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, status: res.status, latencyMs, error: body };
  const inputTokens = body?.usage?.input_tokens ?? 0;
  return {
    ok: true,
    status: res.status,
    latencyMs,
    model: body.model,
    answers: body.answers,
    usage: body.usage,
    costUsd: (inputTokens / 1e6) * JEV_PRICE_INPUT_PER_M,
  };
}

// Question builders mirror the API shape so case files read like the JSON that goes over the wire.
export const noul = (instructions, whenTrue, whenFalse) => ({
  type: 'noul',
  instructions,
  ...(whenTrue || whenFalse ? { criteria: { true: whenTrue, false: whenFalse } } : {}),
});
export const score = (instructions, levels) => ({ type: 'score', instructions, criteria: levels });
export const choice = (instructions, options) => ({ type: 'choice', instructions, criteria: options });
