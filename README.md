# Jev thực chiến: demo

Script để tự chạy lại các thí nghiệm trong series "Jev thực chiến" với TypeSafe Jev (`jev-1.13.0`). Hiện repo có case của bài 01; các case sau sẽ được thêm dần.

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
