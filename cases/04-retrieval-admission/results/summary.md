# Kết quả: 04-retrieval-admission (replay policy, không gọi API)

| Chỉ số | Trước: top-5 theo thứ tự retrieval | Trước+: LLM chọn memory | Sau: Jev chấm từng candidate |
| --- | --- | --- | --- |
| Đúng / tổng | 3/12 (25.0%) | 7/12 (58.3%) | 11/12 (91.7%) |
| Lượt gọi API (lỗi) | 0 (0) | 12 (0) | 12 (0) |
| Latency mỗi mục p50 / p95 (ms) | 0 / 0 | 2218 / 3773 | 403 / 898 |
| Input token TB / mục | 0 | 182 | 1205 |
| Chi phí / 1.000 mục (USD) | $0 | $0.0851 | $0.0506 |

## Chỉ số riêng của use case

- Trước: top-5 theo thứ tự retrieval: memory cần thiết được đưa vào 25/35 (recall 71%); đưa vào tổng 60, trong đó nhiễu 35; recall TB/câu 73%
- Trước+: LLM chọn memory: memory cần thiết được đưa vào 28/35 (recall 80%); đưa vào tổng 29, trong đó nhiễu 1; recall TB/câu 84%
- Sau: Jev chấm từng candidate: memory cần thiết được đưa vào 34/35 (recall 97%); đưa vào tổng 60, trong đó nhiễu 26; recall TB/câu 98%

## Ca sai

- Trước: top-5 theo thứ tự retrieval: m1,m5,m7 → m1,m2,m3,m4,m5 ×1, m2,m4,m6 → m1,m2,m3,m4,m5 ×1, m2,m6 → m1,m2,m3,m4,m5 ×2, m1,m3,m5,m6 → m1,m2,m3,m4,m5 ×2, m1,m2,m4,m8 → m1,m2,m3,m4,m5 ×1, m1,m2,m6,m8 → m1,m2,m3,m4,m5 ×1, m1,m2,m7 → m1,m2,m3,m4,m5 ×1
- Trước+: LLM chọn memory: m2,m4,m6 → m2 ×1, m1,m3,m5,m6 → m1,m3,m6 ×1, m1,m2,m4,m8 → m1,m2,m8 ×1, m1,m2,m6,m8 → m1,m6 ×1, m1,m3,m5,m6 → m1,m5,m3 ×1
- Sau: Jev chấm từng candidate: m1,m3,m5,m6 → m1,m6,m2,m3,m4 ×1

## Từng mục

| id | expected | Trước: top-5 theo thứ tự retrieval | Trước+: LLM chọn memory | Sau: Jev chấm từng candidate |
| --- | --- | --- | --- | --- |
| q01 | m1,m5,m7 | **m1,m2,m3,m4,m5** ✗ | m1,m5,m7 | m1,m5,m7,m3,m4 |
| q02 | m2,m4,m6 | **m1,m2,m3,m4,m5** ✗ | **m2** ✗ | m2,m4,m6,m5,m3 |
| q03 | m2,m6 | **m1,m2,m3,m4,m5** ✗ | m2,m6 | m6,m2,m1,m7,m4 |
| q04 | m1,m3,m5,m6 | **m1,m2,m3,m4,m5** ✗ | **m1,m3,m6** ✗ | m3,m1,m6,m5,m8 |
| q05 | m1,m2,m4,m8 | **m1,m2,m3,m4,m5** ✗ | **m1,m2,m8** ✗ | m1,m2,m8,m4,m7 |
| q06 | m2,m6 | **m1,m2,m3,m4,m5** ✗ | m2,m6 | m2,m6,m7,m1,m5 |
| q07 | m2,m4 | m1,m2,m3,m4,m5 | m4,m2 | m4,m6,m2,m1,m5 |
| q08 | m1,m2,m6,m8 | **m1,m2,m3,m4,m5** ✗ | **m1,m6** ✗ | m1,m4,m2,m6,m8 |
| q09 | m1,m2,m7 | **m1,m2,m3,m4,m5** ✗ | m1,m2,m7 | m1,m7,m2,m3,m6 |
| q10 | m1,m3,m5,m6 | **m1,m2,m3,m4,m5** ✗ | **m1,m5,m3** ✗ | **m1,m6,m2,m3,m4** ✗ |
| q11 | m1,m2,m4 | m1,m2,m3,m4,m5 | m3,m1,m2,m4 | m5,m2,m1,m3,m4 |
| q12 | m1 | m1,m2,m3,m4,m5 | m1 | m1,m7,m8,m3,m4 |
