# Kết quả: 05-loc-bai-x (replay policy, không gọi API)

| Chỉ số | Trước: LLM phân loại | Sau: Jev 4 câu hỏi + policy |
| --- | --- | --- |
| Đúng / tổng | 43/51 (84.3%) | 48/51 (94.1%) |
| Lượt gọi API (lỗi) | 51 (3) | 51 (0) |
| Latency mỗi mục p50 / p95 (ms) | 4140 / 26270 | 266 / 606 |
| Input token TB / mục | 151 | 683 |
| Chi phí / 1.000 mục (USD) | $0.0534 | $0.0287 |

## Chỉ số riêng của use case

- Trước: LLM phân loại: hiện 25/51 post (precision 72%); ẩn nhầm 1/19 post đáng đọc; đúng trên post không phải tiếng Anh 11/12
- Sau: Jev 4 câu hỏi + policy: hiện 18/51 post (precision 94%); ẩn nhầm 2/19 post đáng đọc; đúng trên post không phải tiếng Anh 11/12

## Ca sai

- Trước: LLM phân loại: hide → keep ×7, keep → hide ×1
- Sau: Jev 4 câu hỏi + policy: hide → keep ×1, keep → hide ×2

## Từng mục

| id | expected | Trước: LLM phân loại | Sau: Jev 4 câu hỏi + policy |
| --- | --- | --- | --- |
| s00 | hide | hide | hide |
| s01 | hide | hide | hide |
| s02 | keep | keep | keep |
| s03 | keep | keep | keep |
| s04 | hide | **keep** ✗ | hide |
| s05 | hide | **keep** ✗ | hide |
| s06 | hide | hide | **keep** ✗ |
| s07 | keep | keep | keep |
| s08 | keep | keep | keep |
| s09 | hide | hide | hide |
| s10 | keep | keep | keep |
| s11 | hide | hide | hide |
| s12 | keep | keep | keep |
| s13 | keep | keep | keep |
| s14 | keep | keep | keep |
| s15 | hide | **keep** ✗ | hide |
| s16 | keep | keep | keep |
| s17 | hide | **keep** ✗ | hide |
| s18 | hide | hide | hide |
| s19 | hide | hide | hide |
| s20 | hide | hide | hide |
| s21 | keep | keep | keep |
| s22 | hide | hide | hide |
| s23 | hide | hide | hide |
| s24 | hide | **keep** ✗ | hide |
| s25 | hide | hide | hide |
| s26 | hide | hide | hide |
| s27 | hide | hide | hide |
| s28 | hide | **keep** ✗ | hide |
| s29 | hide | hide | hide |
| s30 | hide | hide | hide |
| s31 | hide | hide | hide |
| s32 | keep | **hide** ✗ | **hide** ✗ |
| s33 | keep | keep | keep |
| s34 | keep | keep | keep |
| s35 | hide | hide | hide |
| s36 | hide | hide | hide |
| s37 | hide | hide | hide |
| s38 | hide | **keep** ✗ | hide |
| s39 | hide | hide | hide |
| s40 | keep | keep | keep |
| s41 | keep | keep | keep |
| s42 | keep | keep | keep |
| s43 | hide | hide | hide |
| s44 | keep | keep | keep |
| s45 | hide | hide | hide |
| s46 | hide | hide | hide |
| s47 | keep | keep | **hide** ✗ |
| s48 | keep | keep | keep |
| s49 | hide | hide | hide |
| s50 | hide | hide | hide |
