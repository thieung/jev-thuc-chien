# Jev thực chiến: demo

Script để tự chạy lại các thí nghiệm trong series "Jev thực chiến" với TypeSafe Jev (`jev-1.13.0`). Hiện repo có case của bài 01, 02, 03, 04, 05 và 06; các case sau sẽ được thêm dần.

- Bài 06, bản trực quan: https://sites.slopengineer.dev/jev-thuc-chien-06/
- Bài 05, bản trực quan: https://sites.slopengineer.dev/jev-thuc-chien-05/
- Bài 04, bản trực quan: https://sites.slopengineer.dev/jev-thuc-chien-04/
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
- Chạy prompt coding agent ở cuối bài bằng Claude Code trên một repo mẫu 3 lần (11/10 và hai lần 14/10): agent tự viết câu hỏi dài 730–835 token mỗi lượt gọi Jev (câu hỏi trong bài khoảng 560), cả 3 lần 0 bỏ nhầm, và gate làm chi phí tăng 19–37%. Số từng lần ở `cases/03-memory-gate/results/e2e-agent-runs.json`. Repo mẫu và log của agent không nằm trong repo này.

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


## Bài 04: chọn memory đưa vào context

Retrieval trả về 8 memory ứng viên cho mỗi câu hỏi, context chỉ nhận tối đa 5 memory và 200 token. Jev chấm từng ứng viên bằng một câu `score` 3 mức, cả 8 câu trong một request. Code chuẩn hóa `score / 2` về 0..1, giữ ứng viên khi điểm chuẩn hóa ≥ `ADMIT_THRESHOLD` hoặc khi `confidence` < `MIN_CONFIDENCE` (không chắc thì giữ), xếp theo điểm rồi cắt theo ngân sách; Jev lỗi thì quay về thứ tự retrieval. 12 câu hỏi, 96 memory, 35 memory cần thiết, chạy qua 3 cách làm: top-5 theo thứ tự retrieval, LLM chọn memory, Jev chấm từng ứng viên.

### Cần có

- Node.js 20 trở lên. Không có dependency, không cần `npm install`.
- `--replay` và `agent-baseline.mjs`: không cần key nào.
- Chạy lại Jev: key TypeSafe. Chạy lại LLM chọn memory: thêm `GEMINI_API_KEY` (free key ở aistudio.google.com).

### Chạy

```bash
git clone https://github.com/thieung/jev-thuc-chien.git && cd jev-thuc-chien

# Không gọi API: áp lại policy lên kết quả đã lưu trong results/raw.jsonl
node lib/run-case.mjs cases/04-retrieval-admission --replay
ADMIT_THRESHOLD=0.75 MIN_CONFIDENCE=0 node lib/run-case.mjs cases/04-retrieval-admission --replay   # gọn: 22/35 cần thiết, 4 nhiễu

# Gọi API thật
export TYPESAFE_API_KEY=... GEMINI_API_KEY=...
node lib/run-case.mjs cases/04-retrieval-admission                                         # cả 3 cách làm: 12 Jev + 12 Gemini
node lib/run-case.mjs cases/04-retrieval-admission "--only=Sau: Jev chấm từng candidate"   # chỉ Jev, 12 request, chỉ cần TYPESAFE_API_KEY
```

Policy chỉ nằm trong `decide`, nên đổi ngưỡng rồi `--replay` không tốn request nào. Kết quả ghi vào `cases/04-retrieval-admission/results/`: `raw.jsonl` (response thô của Jev và danh sách id LLM chọn), `summary.md` và `summary.json`. Mọi lệnh trên đều ghi đè các file này, nên dùng `git diff` để so và `git checkout -- cases/04-retrieval-admission/results` để lấy lại bản gốc.

| Biến | Mặc định | Tác dụng |
| --- | --- | --- |
| `ADMIT_THRESHOLD` | `0.25` | Giữ ứng viên khi `score / 2` lớn hơn hoặc bằng giá trị này |
| `MIN_CONFIDENCE` | `0.5` | Giữ ứng viên khi `confidence` nhỏ hơn giá trị này. Đặt `0` để tắt luật "không chắc thì giữ" |
| `JEV_MODEL` | `jev-1.13.0` | Model Jev |
| `BASELINE_MODEL` | `gemini-3.1-flash-lite` | Model LLM chọn memory |
| `GEMINI_MIN_GAP_MS` | `6700` | Khoảng cách tối thiểu giữa 2 lần gọi Gemini (free tier: 10 request/phút) |

### Kết quả của tác giả

Lần chạy ngày 11/10/2026 (bản đang nằm trong `results/`), policy mặc định:

| | Top-5 theo retrieval | LLM chọn memory | Jev, ngưỡng 0,25 |
| --- | --- | --- | --- |
| Câu hỏi có đủ memory cần thiết | 3/12 | 7/12 | 11/12 |
| Memory cần thiết được đưa vào | 25/35 | 28/35 | 34/35 |
| Tổng đưa vào / nhiễu | 60 / 35 | 29 / 1 | 60 / 26 |
| Latency p50 / p95 | | 2218 / 3773 ms | 403 / 898 ms |
| Chi phí / 1.000 câu hỏi | $0 | $0,0851 | $0,0506 |

- Quét ngưỡng bằng `--replay`: ngưỡng 0,25 hoặc 0,5 khi giữ ứng viên không chắc đều ra 34/35; tắt luật đó thì 0,25 ra 34/35 (56 đưa vào, 22 nhiễu), 0,5 ra 31/35 (45/14), 0,75 ra 22/35 (26/4). Jev có confidence < 0,5 ở 49/96 ứng viên, nên luật "không chắc thì giữ" quyết định gần hết.
- Ca sai duy nhất ở ngưỡng mặc định là q10: memory "Dedup dựa trên event_id, giữ 24h" có điểm chuẩn hóa 0,04 với confidence 0,90. Nó chỉ liên quan qua một memory khác, mà mỗi câu `score` chỉ thấy state và đúng một ứng viên.
- Dataset cố ý đặt memory cần thiết ở cả vị trí sâu trong danh sách retrieval, nên top-5 thua nặng; vector search thật xếp hạng tốt hơn thì khoảng cách sẽ nhỏ hơn.
- LLM chạy trên Gemini free tier; chi phí quy theo giá paid tier.
- Đo 4 lần (11/10 một lần, 15/10 ba lần, lần nào cũng gọi lại đủ Jev và Gemini; số từng lần ở `results/repeat-runs.json`): ba hàng độ chính xác giống hệt nhau cả 4 lần, số memory cần thiết ở mọi dòng quét ngưỡng cũng vậy, chỉ số nhiễu lệch 1 đến 2. Latency thì không: p50 Gemini 1158–2218 ms, Jev 403–743 ms, tức Jev nhanh hơn 1,6 đến 5,5 lần tùy lần đo. Jev không chắc ở 48–49/96 ứng viên; memory dedup ở q10 ra 0,04–0,055 và bị loại cả 4 lần.

Jev không cam kết trả cùng một số ở mọi lần chạy. 12 câu hỏi do tác giả tự viết và tự gắn nhãn; phép đo chỉ xét memory có được đưa vào context hay không, chưa đo chất lượng câu trả lời cuối cùng.

### So với LLM bạn đang dùng

Cùng cách làm như bài 02: dùng prompt mẫu ở mục "So với LLM bạn đang dùng" của bài 02, thay `02-intent-khi-agent-ban` bằng `04-retrieval-admission` ở mọi chỗ.

```bash
node lib/agent-baseline.mjs export cases/04-retrieval-admission    # 12 prompt chọn memory, không có nhãn
node lib/agent-baseline.mjs score cases/04-retrieval-admission --label="<tool>, <model>, <cách chạy>"
```

### Lỗi thường gặp

| Lỗi | Cách sửa |
| --- | --- |
| `TYPESAFE_API_KEY is not set` hoặc `GEMINI_API_KEY is not set` | Export key trong cùng terminal. Nếu chỉ muốn chấm lại, dùng `--replay`, không cần key. |
| Gemini `429` liên tục | Hết quota phút hoặc ngày của free tier. Tăng `GEMINI_MIN_GAP_MS`, đổi `BASELINE_MODEL`, hoặc chờ sang ngày. |
| `unknown variant in --only` | Copy nguyên tên cách làm từ `case.mjs`, đặt trong dấu nháy kép. |
| Tăng `ADMIT_THRESHOLD` mà kết quả không đổi | Ứng viên có `confidence` < `MIN_CONFIDENCE` vẫn được giữ. Đặt `MIN_CONFIDENCE=0` để chỉ lọc theo điểm. |
| So `score` thô với ngưỡng | `score` của câu 3 mức chạy từ 0 đến 2. Chia cho (số mức − 1) trước khi so. |


## Bài 05: lọc bài đáng đọc khi lướt X

Ẩn post không đáng mở khi lướt feed coding agent. Thay vì hỏi một LLM "keep hay hide", Jev trả lời 4 câu trong một request: `on_topic`, `actionable`, `engagement_bait` (`noul`) và `reading_value` (`score` 3 mức). Sở thích của người dùng nằm trong state. Code ẩn post khi `engagement_bait` ≥ 0,5, `on_topic` < 0,5 hoặc `actionable` < 0,5, và hiện post khi Jev lỗi. Hai cách làm: LLM keep/hide và Jev 4 câu hỏi + luật. `drafts.mjs` so thêm một câu `noul` gộp "worth reading" với 4 câu tách.

**`dataset.jsonl` ở đây là bộ tổng hợp.** Bài viết đo trên 51 post thật trên X (25/09–10/10/2026), nhưng đó là nội dung của người khác nên không đưa lên repo. Bộ trong repo gồm 51 post do tác giả viết (`"source": "synthetic"`): mỗi post mô phỏng một loại post trong bộ thật bằng lời khác, không giữ câu chữ gốc, và cùng phân bố với bộ thật: 19 `keep`, 32 `hide`, 6 `copypasta`, 7 `borderline`, 12 post không phải tiếng Anh (5 vi, 3 ja, 2 zh, 1 es, 1 th). `results/` là lần chạy của tác giả trên bộ tổng hợp ngày 16/10/2026 (xem "Kết quả của tác giả trên bộ tổng hợp"). Bộ này dễ hơn bộ thật, nên số khác số trong bài.

### Cần có

- Node.js 20 trở lên. Không có dependency, không cần `npm install`.
- Chạy Jev: key TypeSafe. Chạy LLM keep/hide: thêm `GEMINI_API_KEY` (free key ở aistudio.google.com).
- `--replay` và `agent-baseline.mjs score`: không cần key nào, dùng `results/raw.jsonl` có sẵn.

### Chạy

```bash
git clone https://github.com/thieung/jev-thuc-chien.git && cd jev-thuc-chien
export TYPESAFE_API_KEY=...

node lib/run-case.mjs cases/05-loc-bai-x "--only=Sau: Jev 4 câu hỏi + policy"   # 51 request Jev, dưới $0,01
node lib/run-case.mjs cases/05-loc-bai-x --replay                              # 0 request: áp lại luật lên raw.jsonl
node cases/05-loc-bai-x/drafts.mjs                                             # 1 câu gộp so với 4 câu tách, ~51 request Jev

export GEMINI_API_KEY=...
node lib/run-case.mjs cases/05-loc-bai-x "--only=Trước: LLM phân loại"         # 51 request Gemini, giữ kết quả Jev đã có
```

Luật nằm trong `keepFromAnswers` của `case.mjs`. Đổi ngưỡng ở đó rồi chạy `--replay` thì không tốn request nào. Kết quả ghi vào `cases/05-loc-bai-x/results/` (`raw.jsonl`, `summary.md`, `summary.json`, và `drafts.json` nếu chạy `drafts.mjs`). Lần chạy của bạn sẽ ghi đè các file này, nên dùng `git diff` để so, và `git checkout -- cases/05-loc-bai-x/results` để lấy lại bản gốc.

Muốn thử với feed của bạn: sửa `INTEREST` trong `case.mjs`, thay `dataset.jsonl` bằng post bạn tự gom và gắn nhãn. Mỗi dòng cần `id`, `text`, `expected` (`keep` hoặc `hide`) và `tags`; `extraMetrics` dùng tag `en` để đếm post không phải tiếng Anh.

### Kết quả của tác giả trên bộ tổng hợp

Lần chạy ngày 16/10/2026 trên `jev-1.13.0` (bản đang nằm trong `results/`). Jev chạy một lần; Gemini chạy hai lần vì free tier trả `503` (model quá tải), số dưới đây là lần thứ hai.

| | LLM keep/hide (`gemini-3.1-flash-lite`) | Jev 4 câu hỏi + luật |
| --- | --- | --- |
| Đúng | 43/51 (3 request lỗi `503`, tính là hiện) | 48/51 |
| Đúng trên 48 post Gemini trả lời được | 42/48 | 45/48 |
| Post đáng đọc bị ẩn nhầm | 1/19 | 2/19 |
| Post được hiện mà đúng là đáng đọc | 18/25 (72%) | 17/18 (94%) |
| Copypasta bị giữ nhầm | 5/6 (1 trong đó do lỗi `503`) | 0/6 |
| Input token / post | 151 | 683 |
| Chi phí / 1.000 post | $0,0534 | $0,0287 |
| Latency p50 / p95 | 4140 / 26270 ms | 266 / 606 ms |

- Bộ tổng hợp dễ hơn bộ thật, nhất là với Jev: Jev ẩn đủ 6 copypasta tổng hợp, trong khi trên bộ thật cả hai cách làm cùng giữ nhầm 6 copypasta. Bộ này không tái tạo được điểm khó đó, nên đừng dùng nó để kết luận Jev xử lý được copypasta.
- Lần chạy Gemini đầu lỗi 9/51 (`503`). Trên 39 post mà cả hai lần đều trả lời được, hai lần cho cùng quyết định; 3 post lỗi ở lần hai đều được trả lời đúng ở lần đầu.
- `drafts.mjs`: câu gộp đúng 45/51 ở 0,5 (ẩn nhầm 0/19), tốt nhất 46/51 ở 0,55; ở 0,7 còn 44/51 và ẩn nhầm 6/19. Giá trị câu gộp của post đáng đọc là 0,55–0,88, của post nên ẩn là 0,03–0,72.
- Hạ ngưỡng `engagement_bait` xuống 0,4 không đổi kết quả trên bộ này (48/51).

### Kết quả của tác giả (bộ post thật, không công khai)

Lần chạy ngày 11/10/2026 trên `jev-1.13.0`, 51 post thật:

| | LLM keep/hide (`gemini-3.1-flash-lite`) | Jev 4 câu hỏi + luật |
| --- | --- | --- |
| Đúng | 42/51 | 42/51 |
| Post đáng đọc bị ẩn nhầm | 0/19 | 1/19 |
| Post được hiện mà đúng là đáng đọc | 19/28 (68%) | 18/26 (69%) |
| Input token / post | 264 | 802 |
| Chi phí / 1.000 post | $0,0826 | $0,0337 |
| Latency p50 / p95 | 7832 / 17079 ms | 255 / 471 ms |

- Hạ ngưỡng `engagement_bait` xuống 0,4 bằng replay: 46/51, phần được hiện đúng là đáng đọc 82%, vẫn ẩn nhầm 1/19. Ngưỡng chọn trên chính 51 post này nên con số lạc quan.
- `drafts.mjs`, 1 lần chạy: câu gộp đúng 41/51 ở 0,5; tốt nhất 42/51 ở 0,6; ở 0,7 còn 41/51 và ẩn nhầm 7/19. Giá trị câu gộp của post đáng đọc là 0,50–0,87, của post nên ẩn là 0,03–0,73.
- Hai cách làm cùng giữ nhầm 8 post, 6 trong đó là copypasta. Khử trùng lặp là việc của code, không phải của Jev.
- LLM chạy trên Gemini free tier, chi phí quy theo giá paid tier; latency Gemini vì vậy không so được với Jev.

Jev không cam kết trả cùng một số ở mọi lần chạy. Nhãn "đáng đọc" là đánh giá của một người.

### So với LLM bạn đang dùng

Cùng cách làm như bài 02: dùng prompt mẫu ở mục "So với LLM bạn đang dùng" của bài 02, thay `02-intent-khi-agent-ban` bằng `05-loc-bai-x` ở mọi chỗ. `score` chấm lại trên `results/raw.jsonl`, có sẵn trong repo hoặc do lệnh Jev ở trên ghi ra.

```bash
node lib/agent-baseline.mjs export cases/05-loc-bai-x    # 51 prompt keep/hide, không có nhãn
node lib/agent-baseline.mjs score cases/05-loc-bai-x --label="<tool>, <model>, <cách chạy>"
```

### Lỗi thường gặp

| Lỗi | Cách sửa |
| --- | --- |
| `no saved run at .../results/raw.jsonl` | `results/raw.jsonl` đã bị xóa. Lấy lại bằng `git checkout -- cases/05-loc-bai-x/results`, hoặc chạy lệnh Jev `--only=...` trước. |
| Cột Gemini báo lỗi, `summary.md` ghi `Lượt gọi API (lỗi)` khác 0 | Gemini free tier trả `503 UNAVAILABLE` khi model quá tải, script đã retry 5 lần. Request lỗi bị tính là hiện post. Chạy lại lệnh Gemini sau ít phút; kết quả Jev được giữ nguyên. |
| `TYPESAFE_API_KEY is not set` hoặc `GEMINI_API_KEY is not set` | Export key trong cùng terminal. |
| `unknown variant in --only` | Copy nguyên tên cách làm từ `case.mjs`, đặt trong dấu nháy kép. |
| Số khác bài viết | Đúng như dự kiến: bài đo trên bộ post thật, repo chỉ có bộ tổng hợp, và bộ tổng hợp dễ hơn. So với bảng "Kết quả của tác giả trên bộ tổng hợp". |

## Bài 06: chọn tool cho agent

Agent hỗ trợ khách hàng có 4 tool: `lookup_order`, `create_refund`, `search_faq`, `handoff_human`. Thay vì để LLM sinh tool call, Jev trả lời một câu `choice` "tool nào nên gọi tiếp theo" (option là tên tool do code đưa vào) và một câu `noul` phụ `order_id_present`. Code đọc `confidence`: dưới 0,6 thì chuyển người thật, `create_refund` dưới 0,9 thì hỏi khách xác nhận, `lookup_order` không có số đơn thì hỏi lại. Số đơn lấy bằng regex, không hỏi Jev.

`run.mjs` chạy 3 bản mô tả tool (v1, v2, v3) trên cùng 10 tin nhắn, chỉ đổi `criteria`. 10 tin nhắn do tác giả viết. Pattern "chọn trong danh sách do code liệt kê" lấy từ repo [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast); phần browser agent không nằm trong repo này.

### Cần có

- Node.js 20 trở lên. Không có dependency, không cần `npm install`.
- Key TypeSafe. Case này chỉ dùng Jev, không có cách làm LLM để so.

### Chạy

```bash
git clone https://github.com/thieung/jev-thuc-chien.git && cd jev-thuc-chien
export TYPESAFE_API_KEY=...

node cases/06-chon-tool/run.mjs     # 3 bản × 10 tin nhắn = 30 request Jev, dưới $0,001
```

Kết quả ghi vào `cases/06-chon-tool/results/drafts.json`. Lần chạy của bạn sẽ ghi đè file này, nên dùng `git diff` để so, và `git checkout -- cases/06-chon-tool/results` để lấy lại bản gốc.

Muốn thử với agent của bạn: thay `MESSAGES` bằng 20–30 tin nhắn thật có nhãn tool đúng, thay `BASE` bằng mô tả tool của bạn, rồi thêm các bản sửa như v2, v3.

### Kết quả của tác giả

Lần chạy ngày 11/10/2026 trên `jev-1.13.0` (bản đang nằm trong `results/`):

| Bản | Đổi gì | Đúng | Confidence ≥ 0,6 / trong đó đúng | Ca sai |
| --- | --- | --- | --- | --- |
| v1 | Mô tả ngắn | 7/10 | 9 / 7 | 3 ca hoàn tiền thành `lookup_order`, 2 ca với confidence 0,91–0,96 |
| v2 | `create_refund` liệt kê lý do hoàn tiền thật (vỡ, sai, thiếu, không vừa) kèm ví dụ | 8/10 | 8 / 8 | 2 ca hoàn tiền thành `lookup_order`, confidence 0,45–0,55 |
| v3 | `lookup_order` thêm "NOT when they want a return or their money back, even if they give an order number" | 10/10 | 10 / 10 | Không có |

- 30 request dùng 469–549 input token và 230–779 ms mỗi request, tổng khoảng 15.300 token (dưới $0,001).
- Ở v2, 2 ca sai đều bị `lookup_order` hút về: một ca có số đơn (#9031), một ca không có. Sửa mô tả của option đang hút ca sai (v3) mới xử lý được cả hai.
- v3 được chỉnh trên chính 10 tin này, nên 10/10 là con số lạc quan. Hãy kiểm lại trên một bộ tin nhắn khác.

Jev không cam kết trả cùng một số ở mọi lần chạy.

### Lỗi thường gặp

| Lỗi | Cách sửa |
| --- | --- |
| `TYPESAFE_API_KEY is not set` | Export key trong cùng terminal. |
| Dòng kết quả in `undefined` thay vì tên tool và confidence | Request đó bị lỗi (key sai, hết quota, timeout) nên không có `answers`, và bị tính là sai. Kiểm tra key rồi chạy lại. |
| Số khác bảng trên vài phần trăm confidence | Bình thường giữa các lần chạy. So số ca đúng và ca sai mà tự tin, không so từng con số. |
