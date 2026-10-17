// Usage: node cases/06-chon-tool/run.mjs (needs TYPESAFE_API_KEY, 30 Jev requests).
// Tool selection with one `choice` + a helper `noul`, three drafts of the tool descriptions on the same messages.
import { writeFileSync } from 'node:fs';
import { callJev, choice, noul } from '../../lib/jev-client.mjs';

const MESSAGES = [
  { msg: 'Đơn #8812 của tôi giao chưa vậy?', expected: 'lookup_order' },
  { msg: 'Phí ship ra Đà Nẵng bao nhiêu?', expected: 'search_faq' },
  { msg: 'Tôi sẽ kiện các người nếu không xử lý', expected: 'handoff_human' },
  { msg: 'Hàng bị vỡ, tôi muốn trả lại lấy tiền', expected: 'create_refund' },
  { msg: 'Áo size M mặc chật quá, cho em trả lại hoàn tiền nhé, đơn #9031', expected: 'create_refund' },
  { msg: 'Shop có giao hàng vào chủ nhật không?', expected: 'search_faq' },
  { msg: 'Tại sao đơn 7720 vẫn đang ở kho vậy', expected: 'lookup_order' },
  { msg: 'Nhân viên giao hàng thái độ quá tệ, tôi muốn gặp quản lý', expected: 'handoff_human' },
  { msg: 'Tôi nhận được hàng nhưng thiếu 1 món, giờ muốn lấy lại tiền món đó', expected: 'create_refund' },
  { msg: 'Có mã giảm giá cho khách mới không?', expected: 'search_faq' },
];

const BASE = {
  lookup_order: 'look up the status of a specific order the customer mentions',
  create_refund: 'start a refund for an order the customer wants their money back for',
  search_faq: 'answer a general question about policies, shipping times, or the product',
  handoff_human: 'the request is a complaint, legal threat, or anything the tools cannot handle',
};
const DRAFTS = {
  'v1: mô tả ngắn': BASE,
  'v2: create_refund có ví dụ': {
    ...BASE,
    create_refund: 'the customer wants money back for an order: item arrived broken, damaged, wrong, missing or does not fit, and they ask to return it or be refunded (for example "hàng bị vỡ, muốn trả lại lấy tiền", "hoàn tiền giúp tôi")',
  },
};
DRAFTS['v3: lookup_order chỉ để xem trạng thái'] = {
  ...DRAFTS['v2: create_refund có ví dụ'],
  lookup_order: 'the customer only wants to know where an order is or its delivery status; NOT when they want a return or their money back, even if they give an order number',
};
const INSTR = "Which single tool should the assistant call next to handle the customer's message?";
const orderId = noul('Does `message` contain a specific order number?', 'an explicit order number like #1234 appears', 'no order number is given');

const out = {};
for (const [name, criteria] of Object.entries(DRAFTS)) {
  const rows = await Promise.all(MESSAGES.map(async ({ msg, expected }) => {
    const r = await callJev({ state: { message: msg, customer_tier: 'gold' }, questions: { tool: choice(INSTR, criteria), order_id_present: orderId } });
    const t = r.answers?.tool;
    return { msg, expected, choice: t?.choice, confidence: t?.confidence, order_id_present: r.answers?.order_id_present?.noul, latencyMs: r.latencyMs, inputTokens: r.usage?.input_tokens };
  }));
  const right = rows.filter((r) => r.choice === r.expected).length;
  const sure = rows.filter((r) => r.confidence >= 0.6);
  out[name] = { right, total: rows.length, confident: sure.length, confidentRight: sure.filter((r) => r.choice === r.expected).length, rows };
  console.log(`${name}: đúng ${right}/${rows.length}; confidence ≥ 0.6: ${sure.length}, đúng ${out[name].confidentRight}`);
  for (const r of rows) console.log(`  ${r.choice === r.expected ? '✓' : '✗'} ${r.msg} → ${r.choice} ${r.confidence?.toFixed(2)} (order# ${r.order_id_present?.toFixed(2)}, ${r.latencyMs} ms, ${r.inputTokens} tok)`);
}
writeFileSync(new URL('./results/drafts.json', import.meta.url), JSON.stringify(out, null, 2));
