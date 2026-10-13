// Turns per-item rows into the numbers an article can quote: accuracy with its denominator,
// confusion pairs, end-to-end latency per item, tokens and projected cost per 1,000 items.
const pct = (n, d) => (d === 0 ? 'n/a' : `${((100 * n) / d).toFixed(1)}%`);

function percentile(values, p) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
}

function variantStats(rows, v, spec) {
  const decided = rows.filter((r) => r.decisions[v.name] !== undefined);
  const correct = decided.filter((r) => spec.isCorrect(r.decisions[v.name], r.expected, r));
  const calls = decided.flatMap((r) => r.raw[v.name].calls ?? []);
  const perItemLatency = decided.map((r) => (r.raw[v.name].calls ?? []).reduce((a, c) => a + (c.latencyMs ?? 0), 0));
  const cost = calls.reduce((a, c) => a + (c.costUsd ?? 0), 0);
  const tokensIn = calls.reduce((a, c) => a + (c.usage?.input_tokens ?? 0), 0);
  const errors = {};
  for (const r of decided) {
    if (!spec.isCorrect(r.decisions[v.name], r.expected, r)) {
      const k = `${r.expected} → ${r.decisions[v.name]}`;
      errors[k] = (errors[k] ?? 0) + 1;
    }
  }
  return {
    items: decided.length,
    correct: correct.length,
    accuracy: pct(correct.length, decided.length),
    apiCalls: calls.length,
    apiErrors: calls.filter((c) => !c.ok).length,
    latencyP50: percentile(perItemLatency, 50),
    latencyP95: percentile(perItemLatency, 95),
    avgInputTokensPerItem: decided.length ? Math.round(tokensIn / decided.length) : 0,
    costPer1000ItemsUsd: decided.length ? Number(((cost / decided.length) * 1000).toFixed(4)) : 0,
    errors,
  };
}

export function summarize(rows, spec, variants) {
  const out = { n: rows.length, variants: {} };
  for (const v of variants) out.variants[v.name] = variantStats(rows, v, spec);
  if (spec.extraMetrics) out.extra = spec.extraMetrics(rows);
  return out;
}

export function renderMarkdown(summary, rows, spec, variants, { caseName, replay }) {
  const cols = variants.map((v) => [v.name, summary.variants[v.name]]);
  const line = (label, f) => `| ${label} | ${cols.map(([, s]) => f(s)).join(' | ')} |`;
  const out = [
    `# Kết quả: ${caseName}${replay ? ' (replay policy, không gọi API)' : ''}`,
    '',
    `| Chỉ số | ${cols.map(([n]) => n).join(' | ')} |`,
    `| --- | ${cols.map(() => '---').join(' | ')} |`,
    line('Đúng / tổng', (s) => `${s.correct}/${s.items} (${s.accuracy})`),
    line('Lượt gọi API (lỗi)', (s) => `${s.apiCalls} (${s.apiErrors})`),
    line('Latency mỗi mục p50 / p95 (ms)', (s) => `${s.latencyP50 ?? '-'} / ${s.latencyP95 ?? '-'}`),
    line('Input token TB / mục', (s) => `${s.avgInputTokensPerItem ?? '-'}`),
    line('Chi phí / 1.000 mục (USD)', (s) => (s.costPer1000ItemsUsd == null ? '-' : `$${s.costPer1000ItemsUsd}`)),
    '',
  ];
  if (summary.extra) {
    out.push('## Chỉ số riêng của use case', '');
    for (const [k, v] of Object.entries(summary.extra)) out.push(`- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    out.push('');
  }
  out.push('## Ca sai', '');
  for (const [name, s] of cols) {
    const e = Object.entries(s.errors);
    out.push(`- ${name}: ${e.length ? e.map(([k, v]) => `${k} ×${v}`).join(', ') : 'không có'}`);
  }
  out.push('', '## Từng mục', '', `| id | expected | ${cols.map(([n]) => n).join(' | ')} |`, `| --- | --- | ${cols.map(() => '---').join(' | ')} |`);
  for (const r of rows) {
    const cell = (d) => (d === undefined ? '-' : spec.isCorrect(d, r.expected, r) ? `${d}` : `**${d}** ✗`);
    out.push(`| ${r.id} | ${r.expected} | ${cols.map(([n]) => cell(r.decisions[n])).join(' | ')} |`);
  }
  return out.join('\n') + '\n';
}
