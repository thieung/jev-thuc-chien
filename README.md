# Jev thực chiến: demo

Script để tự chạy lại các thí nghiệm trong series "Jev thực chiến" với TypeSafe Jev (`jev-1.13.0`). Hiện repo có case của bài 01, 02 và 03; các case sau sẽ được thêm dần.

- Bài 03, bản trực quan: https://sites.slopengineer.dev/jev-thuc-chien-03/
- Bài 02, bản trực quan: https://sites.slopengineer.dev/jev-thuc-chien-02/
- Bài 01, bản trực quan: https://sites.slopengineer.dev/jev-thuc-chien-01/
- Bài 0 (Jev là gì, đặt vào đâu trong agent): https://sites.slopengineer.dev/jev-thuc-chien-00/

## Bài 01: đặt câu hỏi cho Jev

Năm thí nghiệm, mỗi thí nghiệm giữ nguyên dữ liệu và chỉ đổi cách hỏi: `count`, `dates`, `criteria`, `compound`, `injection`.

### Cần có

- Node.js 20 trở lên. Không có dependency, không cần `npm install`.
- Key TypeSafe, tạo tại console.typesafe.ai.

### Chạy

```bash
git clone https://github.com/thieung/jev-thuc-chien.git
cd jev-thuc-chien
export TYPESAFE_API_KEY=...
node cases/01-cach-dat-cau-hoi/run.mjs            # cả 5 thí nghiệm, khoảng 115 request, dưới $0,01
node cases/01-cach-dat-cau-hoi/run.mjs count      # một thí nghiệm: count | compound | dates | criteria | injection
```

Mỗi thí nghiệm in một dòng tóm tắt, ví dụ `{"experiment":"count","badCorrect":"11/12","goodCorrect":"12/12"}`, và ghi chi tiết từng mục vào `cases/01-cach-dat-cau-hoi/results/<tên>.json`.

### Kết quả của tác giả

`results/*.json` trong repo là lần chạy ngày 11/10/2026. Lần chạy của bạn sẽ ghi đè các file này, nên dùng `git diff` để so, và `git checkout -- cases/01-cach-dat-cau-hoi/results` để lấy lại bản gốc.

| Thí nghiệm | Cách hỏi sai | Cách hỏi đúng |
| --- | --- | --- |
| `count` | 11/12 | 12/12 |
| `dates` | 9/10 | 10/10 |
| `criteria` | 11/12 | 12/12 |
| `compound` | 16/16 | 16/16 |
| `injection` | không chấm đúng/sai, so noul trước và sau khi chèn | |

Jev không cam kết trả cùng một số ở mọi lần chạy, nên hãy so xu hướng, đừng so từng chữ số. Mỗi thí nghiệm chỉ 8–16 mẫu do tác giả tự viết và tự gắn nhãn: đủ để thấy cơ chế lỗi, chưa đủ để nói tỉ lệ lỗi trên dữ liệu của bạn.

### Lỗi thường gặp

| Lỗi | Cách sửa |
| --- | --- |
| `TYPESAFE_API_KEY is not set` | `export TYPESAFE_API_KEY=...` trong cùng terminal rồi chạy lại. Script dừng trước khi ghi file, nên kết quả cũ không bị mất. |
| Lỗi cú pháp hoặc thiếu `fetch` | Kiểm tra `node --version`, cần 20 trở lên. |

Đổi model bằng `JEV_MODEL=... node cases/01-cach-dat-cau-hoi/run.mjs`.

## Bài 02: phân loại tin nhắn khi agent đang bận

User nhắn thêm khi agent đang chạy một task. Tin đó là hỏi tiến độ (`status_query`), hủy (`cancel`), sửa task đang chạy (`steer`) hay việc mới (`new_task`)? 40 tin nhắn tiếng Việt và tiếng Anh, chạy qua 5 cách làm: keyword + LLM, LLM kèm task đang chạy, Jev chỉ đọc tin nhắn, Jev kèm task, và Active (Jev quyết định khi tự tin, dưới ngưỡng thì gọi LLM).

### Cần có

- Node.js 20 trở lên. Không có dependency, không cần `npm install`.
- `--replay` và `agent-baseline.mjs`: không cần key nào.
- Chạy lại cách làm "sau": key TypeSafe. Chạy lại cách làm "trước": thêm `GEMINI_API_KEY` (free key ở aistudio.google.com).

### Chạy

```bash
git clone https://github.com/thieung/jev-thuc-chien.git
cd jev-thuc-chien

# Không gọi API: áp lại policy lên kết quả đã lưu trong results/raw.jsonl
node lib/run-case.mjs cases/02-intent-khi-agent-ban --replay
INTENT_FLOOR=0.6 node lib/run-case.mjs cases/02-intent-khi-agent-ban --replay   # thử ngưỡng confidence khác

# Gọi API thật
export TYPESAFE_API_KEY=... GEMINI_API_KEY=...
node lib/run-case.mjs cases/02-intent-khi-agent-ban                             # cả 5 cách làm: 108 Jev + ~73 Gemini, ~10 phút
node lib/run-case.mjs cases/02-intent-khi-agent-ban "--only=Sau: Jev (chỉ message)"   # chỉ một cách làm, ~36 Jev
node cases/02-intent-khi-agent-ban/drafts.mjs                                   # 4 bản nháp câu hỏi v0–v3, ~160 Jev
```

`--only` nhận tên cách làm đúng như trong `case.mjs`, ngăn cách bằng `|`; các cách làm còn lại giữ kết quả cũ. Ngưỡng chỉ được dùng trong `decide`, nên đổi `INTENT_FLOOR` rồi `--replay` không tốn request nào. Riêng cột Active: khi replay với ngưỡng cao hơn 0,75, những tin lúc chạy thật không gọi LLM sẽ không có kết quả fallback và bị tính là `new_task`.

Kết quả ghi vào `cases/02-intent-khi-agent-ban/results/`: `raw.jsonl` (response thô), `summary.md` và `summary.json` (bảng so sánh, ca sai, từng mục), `drafts.json` (4 bản nháp). Mọi lệnh trên đều ghi đè các file này, nên dùng `git diff` để so và `git checkout -- cases/02-intent-khi-agent-ban/results` để lấy lại bản gốc.

| Biến | Mặc định | Tác dụng |
| --- | --- | --- |
| `INTENT_FLOOR` | `0.75` | Sàn confidence để chấp nhận câu trả lời của Jev |
| `JEV_MODEL` | `jev-1.13.0` | Model Jev |
| `BASELINE_MODEL` | `gemini-3.1-flash-lite` | Model LLM cho cách làm "trước" |
| `GEMINI_MIN_GAP_MS` | `6700` | Khoảng cách tối thiểu giữa 2 lần gọi Gemini (free tier: 10 request/phút) |

### Kết quả của tác giả

Lần chạy ngày 11/10/2026, ngưỡng 0,75:

| | Keyword + LLM | Jev chỉ tin nhắn | Jev + task | Active: Jev + task, dưới ngưỡng thì LLM |
| --- | --- | --- | --- | --- |
| Đúng | 39/40 | 36/40 | 38/40 | 39/40 |
| Latency p50 / p95 | 1.357 / 4.849 ms | 255 / 632 ms | 262 / 768 ms | 266 / 739 ms |
| Chi phí / 1.000 tin | $0,064 | $0,020 | $0,021 | $0,023 |

- Ca sai chung của mọi cột là "dừng ở bước 3": fast-path keyword trong `case.mjs` cố ý để rộng, nên bắt nhầm thành `cancel` trước khi model kịp đọc.
- Các ca Jev "sai" còn lại đều là tin Jev báo confidence dưới ngưỡng (`abstain`), không có ca nào Jev sai mà tự tin.
- LLM chạy trên Gemini free tier; chi phí quy theo giá paid tier. Latency không phải so sánh công bằng.

Jev không cam kết trả cùng một số ở mọi lần chạy, nên số của bạn có thể lệch 1–2 ca quanh ngưỡng. 40 tin do tác giả tự viết và tự gắn nhãn, câu hỏi được sửa dựa trên chính 40 tin này: đủ để thấy cơ chế, chưa đủ để nói độ chính xác trên dữ liệu của bạn.

### So với LLM bạn đang dùng (Claude Code, Codex, Cursor...)

Cách làm "trước" được đo bằng `gemini-3.1-flash-lite` (free key, `temperature: 0`, JSON schema, không bật thinking): đại diện cho "một LLM rẻ trả JSON", không phải model mạnh nhất. Bạn có thể thay nó bằng model trong coding agent của mình, không cần `GEMINI_API_KEY` và không gọi API nào:

```bash
node lib/agent-baseline.mjs export cases/02-intent-khi-agent-ban    # 72 prompt Gemini đã nhận, không có id hay nhãn
# agent trả lời từng file agent-baseline/02-intent-khi-agent-ban/prompts/<id>.md vào answers/<id>.json
node lib/agent-baseline.mjs score cases/02-intent-khi-agent-ban --label="Claude Code, <model>, subagent mỗi prompt"
```

`score` lấy lần chạy đã lưu, thay phần Gemini bằng câu trả lời của agent, rồi chấm bằng đúng `decide` của case. Kết quả nằm ở `agent-baseline/02-intent-khi-agent-ban/summary.md` (thư mục này nằm trong `.gitignore`). Ba điều cần giữ:

1. Chỉ so độ chính xác. Latency và chi phí qua coding agent gồm cả phần của agent và gói subscription.
2. Không để agent thấy nhãn: agent chỉ đọc prompt đã tách khỏi dataset, mỗi prompt một lượt riêng.
3. Ghi lại model và cách chạy. Subagent hay lệnh CLI vẫn mang system prompt và file hướng dẫn của tool, nên mỗi lượt không giống một lượt gọi API trần. Số của bạn là số của bạn, đừng ghép vào bảng của bài.

Prompt mẫu, copy vào coding agent đang mở ở thư mục repo:

```text
Tôi muốn đo cách làm "trước" của case 02-intent-khi-agent-ban trong repo này bằng chính model bạn đang chạy, thay cho Gemini mà tác giả đã dùng. Không cần API key, không gọi API nào.

Luật chống lộ đáp án, quan trọng nhất:
- Không mở cases/02-intent-khi-agent-ban/dataset.jsonl, thư mục results/ nào, file summary nào, README.md, và không đọc code của case để đoán đáp án. Các file đó chứa nhãn hoặc kết quả.
- Để trả lời, chỉ đọc file trong agent-baseline/02-intent-khi-agent-ban/prompts/.

Các bước:
1. Chạy: node lib/agent-baseline.mjs export cases/02-intent-khi-agent-ban
2. Với mỗi file agent-baseline/02-intent-khi-agent-ban/prompts/<id>.md: trả lời prompt đó như một lượt gọi model độc lập, rồi ghi câu trả lời vào agent-baseline/02-intent-khi-agent-ban/answers/<id>.json (cùng <id>).
   - Ưu tiên mỗi file một context riêng: subagent, hoặc lệnh không tương tác của tool bạn nếu có. Truyền nguyên nội dung file, không thêm hướng dẫn nào khác. Phiên chính được đọc prompt để chuyển đi, nhưng không tự trả lời.
   - Ghi câu trả lời vào đúng <id> của file đã giao cho lượt đó, không ghép theo thứ tự khởi chạy hay thứ tự trả về.
   - Nếu không có cách đó, xử lý tuần tự: đọc một file, trả lời, ghi, rồi mới mở file kế tiếp. Không đọc trước file khác, không sửa câu trả lời cũ.
   - Không viết script, regex hay rule để trả lời thay model. Mỗi câu trả lời phải là phán đoán của model trên đúng prompt đó.
   - File trả lời chỉ chứa JSON khớp schema ở cuối prompt, không kèm chữ nào khác.
3. Khi đủ file, chạy: node lib/agent-baseline.mjs score cases/02-intent-khi-agent-ban --label="<tên tool>, <model>, <cách chạy ở bước 2>"
   Nếu lệnh báo còn thiếu câu trả lời, trả lời nốt các prompt đó rồi chạy lại. Lệnh này in cả nhãn, nên sau khi chạy thì không sửa câu trả lời nào nữa.
4. Báo lại cho tôi: tool, model và cách chạy đã dùng, số prompt, bảng so sánh ở đầu agent-baseline/02-intent-khi-agent-ban/summary.md, và các ca sai. Không tự kết luận model nào tốt hơn.
```

### Lỗi thường gặp

| Lỗi | Cách sửa |
| --- | --- |
| `TYPESAFE_API_KEY is not set` hoặc `GEMINI_API_KEY is not set` | Export key trong cùng terminal. Nếu chỉ muốn chấm lại, dùng `--replay`, không cần key. |
| Gemini `429` liên tục | Hết quota phút hoặc ngày của free tier. Tăng `GEMINI_MIN_GAP_MS`, đổi `BASELINE_MODEL`, hoặc chờ sang ngày nếu lỗi có `PerDay`. |
| Gemini `503 high demand` | Model quá tải. Chạy lại sau bằng `--only` cho đúng cách làm đó. |
| `unknown variant in --only` | Copy nguyên tên cách làm từ `case.mjs`, đặt trong dấu nháy kép. |
| `còn thiếu N câu trả lời` khi chạy `agent-baseline.mjs score` | Trả lời nốt các `<id>` được liệt kê; tên file phải là `<id>.json`. |

## Bài 03: memory gate trước khi gọi LLM

Agent đọc chat của team và gọi LLM để trích memory sau mỗi batch tin nhắn. Jev được đặt làm cổng trước lượt gọi đó: một câu `noul` ("batch này có gì đáng nhớ không") cộng một câu `score` 3 mức để có `confidence`. Chỉ bỏ qua LLM khi `noul ≤ 0,15`, `confidence ≥ 0,5` và mức có xác suất cao nhất là mức 0; Jev lỗi thì vẫn gọi LLM. 30 batch chat ngắn (15 có nội dung đáng nhớ, 15 rác), chạy qua 3 cách làm: luôn gọi LLM extraction, Jev gate với rubric `score` nhãn ngắn, Jev gate với rubric mô tả rõ.

### Cần có

- Node.js 20 trở lên. Không có dependency, không cần `npm install`.
- `--replay` và `agent-baseline.mjs`: không cần key nào.
- Chạy lại Jev gate: key TypeSafe. Chạy lại LLM extraction: thêm `GEMINI_API_KEY` (free key ở aistudio.google.com).

### Chạy

```bash
git clone https://github.com/thieung/jev-thuc-chien.git && cd jev-thuc-chien

# Không gọi API: áp lại luật bỏ qua lên kết quả đã lưu trong results/raw.jsonl
node lib/run-case.mjs cases/03-memory-gate --replay
SKIP_THRESHOLD=0.3 MIN_CONFIDENCE=0.2 node lib/run-case.mjs cases/03-memory-gate --replay   # nới ngưỡng: bỏ qua 13/30, vẫn 0 bỏ nhầm

# Gọi API thật
export TYPESAFE_API_KEY=... GEMINI_API_KEY=...
node lib/run-case.mjs cases/03-memory-gate                                          # cả 3 cách làm: 60 Jev + ít nhất 30 Gemini
node lib/run-case.mjs cases/03-memory-gate "--only=Sau: Jev gate, rubric mô tả rõ"   # chỉ Jev gate bản sửa, 30 Jev, chỉ cần TYPESAFE_API_KEY
```

Luật bỏ qua chỉ nằm trong `decide`, nên đổi ngưỡng rồi `--replay` không tốn request nào. `summary.md` có sẵn bảng quét 5 tổ hợp ngưỡng cho cả hai rubric. Bản nới ngưỡng ở trên chỉ đúng trên chính 30 batch dùng để viết rubric; đừng lấy nó làm ngưỡng production khi chưa chạy shadow.

Kết quả ghi vào `cases/03-memory-gate/results/`: `raw.jsonl` (response thô của Jev và memory LLM trích ra), `summary.md` và `summary.json`. Mọi lệnh trên đều ghi đè các file này, nên dùng `git diff` để so và `git checkout -- cases/03-memory-gate/results` để lấy lại bản gốc.

| Biến | Mặc định | Tác dụng |
| --- | --- | --- |
| `SKIP_THRESHOLD` | `0.15` | Bỏ qua chỉ khi `noul` nhỏ hơn hoặc bằng giá trị này |
| `MIN_CONFIDENCE` | `0.5` | Bỏ qua chỉ khi `confidence` của câu `score` lớn hơn hoặc bằng giá trị này |
| `JEV_MODEL` | `jev-1.13.0` | Model Jev |
| `BASELINE_MODEL` | `gemini-3.1-flash-lite` | Model LLM extraction |
| `GEMINI_MIN_GAP_MS` | `6700` | Khoảng cách tối thiểu giữa 2 lần gọi Gemini (free tier: 10 request/phút) |

### Kết quả của tác giả

Lần chạy ngày 14/10/2026 (bản đang nằm trong `results/`), luật mặc định:

| | Luôn gọi LLM | Jev gate, rubric nhãn ngắn | Jev gate, rubric mô tả rõ |
| --- | --- | --- | --- |
| Batch rác được bỏ qua | 0/15 | 0/15 | 12/15 |
| Batch đáng nhớ bị bỏ nhầm | 0 | 0 | 0 |
| Memory rác bị lưu | 3 | 3 | 1 |
| Lượt gọi LLM extraction | 30 | 30 | 18 |
| Latency gate p50 / p95 | | 293 / 674 ms | 252 / 825 ms |
| Chi phí cả bộ 30 batch | $0,0046 | $0,0052 | $0,0044 |

- Rubric nhãn ngắn (`noise`, `short-lived`, `long-lived`) xếp cả 15 batch rác vào mức 1 với confidence trung bình 0,84, nên luật "mức cao nhất phải là mức 0" chặn hết. Rubric mô tả mỗi mức bằng nội dung cụ thể thì bỏ qua được 12/15.
- Ba batch rác gate để lọt: lịch họp (`noul` 0,20, confidence 0,15), "đang review PR" (`noul` 0,17, mức cao nhất là mức 1), tin OpenAI (confidence 0,34).
- Đo 5 lần (11/10 một lần, 14/10 bốn lần; ba lần cuối chỉ gọi lại Jev, giữ kết quả Gemini): rubric mô tả rõ bỏ qua 12/15 ở 4 lần, 11/15 ở 1 lần, 0 bỏ nhầm cả 5 lần. Lần 11/15 là do batch hỏi link Figma có `noul` 0,16 thay vì 0,15; lần đó chi phí chỉ giảm 1,6%. Số từng lần ở `cases/03-memory-gate/results/repeat-runs.json`.
- Một batch có nội dung (b12) làm Gemini timeout 30 giây ở cả 5 lần thử, ở cả hai lần gọi Gemini (11/10 và 14/10), nên cột "luôn gọi LLM" có 29 lượt gọi thành công và chi phí không tính lượt đó. Cả ba cột đều thiếu cùng một lượt.
- LLM chạy trên Gemini free tier; chi phí quy theo giá paid tier. Gate gần như không tiết kiệm tiền ở case này (khoảng 4%), vì với batch rác LLM chỉ trả `[]`.

Jev không cam kết trả cùng một số ở mọi lần chạy. 30 batch do tác giả tự viết và tự gắn nhãn, rubric mô tả rõ được viết sau khi xem kết quả trên chính 30 batch này: đủ để thấy cơ chế, chưa đủ để nói tỉ lệ bỏ qua trên dữ liệu của bạn.

### So với LLM bạn đang dùng

Cùng cách làm như bài 02: dùng prompt mẫu ở mục "So với LLM bạn đang dùng" của bài 02, thay `02-intent-khi-agent-ban` bằng `03-memory-gate` ở mọi chỗ.

```bash
node lib/agent-baseline.mjs export cases/03-memory-gate    # 30 prompt LLM extraction, không có id hay nhãn
node lib/agent-baseline.mjs score cases/03-memory-gate --label="<tool>, <model>, <cách chạy>"
```

Cách làm "trước" luôn gọi extraction nên cột đúng trên tổng không đổi. Hãy so dòng "Memory LLM trích ra từ batch rác" và "LLM extraction trả []" trong `agent-baseline/03-memory-gate/summary.md`.

### Lỗi thường gặp

| Lỗi | Cách sửa |
| --- | --- |
| `TYPESAFE_API_KEY is not set` hoặc `GEMINI_API_KEY is not set` | Export key trong cùng terminal. Nếu chỉ muốn chấm lại, dùng `--replay`, không cần key. |
| `TimeoutError` ở cột "luôn gọi LLM" | Gemini không trả lời trong 30 giây sau 5 lần thử. Tác giả gặp ở 1/30 batch, chưa rõ nguyên nhân. Chạy lại cột đó bằng `--only`. |
| Gemini `429` liên tục | Hết quota phút hoặc ngày của free tier. Tăng `GEMINI_MIN_GAP_MS`, đổi `BASELINE_MODEL`, hoặc chờ sang ngày. |
| `unknown variant in --only` | Copy nguyên tên cách làm từ `case.mjs`, đặt trong dấu nháy kép. |
| Đổi ngưỡng mà kết quả không đổi | Ba điều kiện phải cùng đúng. Ví dụ chỉ tăng `SKIP_THRESHOLD` lên 0.3 vẫn bỏ qua 12/30, vì các batch còn lại bị chặn bởi `MIN_CONFIDENCE` hoặc mức cao nhất. |
