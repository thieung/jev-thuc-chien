# Kết quả: 03-memory-gate

| Chỉ số | Trước: luôn gọi LLM extraction | Sau: Jev gate trước extraction | Sau: Jev gate, rubric mô tả rõ |
| --- | --- | --- | --- |
| Đúng / tổng | 15/30 (50.0%) | 15/30 (50.0%) | 27/30 (90.0%) |
| Lượt gọi API (lỗi) | 29 (0) | 30 (0) | 30 (0) |
| Latency mỗi mục p50 / p95 (ms) | 1493 / 4452 | 293 / 674 | 252 / 825 |
| Input token TB / mục | 241 | 498 | 562 |
| Chi phí / 1.000 mục (USD) | $0.1536 | $0.0209 | $0.0236 |

## Chỉ số riêng của use case

- Jev gate (rubric mô tả rõ) bỏ qua extraction: 12/30, skip nhầm 0
- Confidence TB của score trên batch rác: rubric nhãn ngắn / rubric mô tả rõ: 0.84 / 0.77
- Sweep rubric nhãn ngắn (replay): ["noul≤0.15, conf≥0.5, level≤0: skip 0/30, skip nhầm 0","noul≤0.15, conf≥0.5, level≤1: skip 11/30, skip nhầm 0","noul≤0.15, conf≥0, level≤2: skip 12/30, skip nhầm 0","noul≤0.3, conf≥0, level≤2: skip 15/30, skip nhầm 0","noul≤0.05, conf≥0.7, level≤0: skip 0/30, skip nhầm 0"]
- Sweep rubric mô tả rõ (replay): ["noul≤0.15, conf≥0.5, level≤0: skip 12/30, skip nhầm 0","noul≤0.15, conf≥0.5, level≤1: skip 12/30, skip nhầm 0","noul≤0.15, conf≥0, level≤2: skip 13/30, skip nhầm 0","noul≤0.3, conf≥0, level≤2: skip 15/30, skip nhầm 0","noul≤0.05, conf≥0.7, level≤0: skip 4/30, skip nhầm 0"]
- Batch không có gì bền vững (nhãn skip): 15/30
- LLM extraction trả [] (trả tiền mà không thu được gì): 12/30
- Jev gate bỏ qua extraction: 0/30
- Skip nhầm batch có nội dung bền vững (lỗi nguy hiểm): 0
- Memory LLM trích ra từ batch rác (bị lưu nếu không có gate): 3
- Chi phí pipeline trước (USD, cả bộ): 0.004608
- Chi phí pipeline sau, rubric nhãn ngắn = Jev + extraction còn lại (USD): 0.005235
- Chi phí pipeline sau, rubric mô tả rõ (USD): 0.004407

## Ca sai

- Trước: luôn gọi LLM extraction: skip → extract ×15
- Sau: Jev gate trước extraction: skip → extract ×15
- Sau: Jev gate, rubric mô tả rõ: skip → extract ×3

## Từng mục

| id | expected | Trước: luôn gọi LLM extraction | Sau: Jev gate trước extraction | Sau: Jev gate, rubric mô tả rõ |
| --- | --- | --- | --- | --- |
| b01 | extract | extract | extract | extract |
| b02 | extract | extract | extract | extract |
| b03 | extract | extract | extract | extract |
| b04 | extract | extract | extract | extract |
| b05 | extract | extract | extract | extract |
| b06 | extract | extract | extract | extract |
| b07 | extract | extract | extract | extract |
| b08 | extract | extract | extract | extract |
| b09 | extract | extract | extract | extract |
| b10 | extract | extract | extract | extract |
| b11 | extract | extract | extract | extract |
| b12 | extract | extract | extract | extract |
| b13 | extract | extract | extract | extract |
| b14 | extract | extract | extract | extract |
| b15 | extract | extract | extract | extract |
| b16 | skip | **extract** ✗ | **extract** ✗ | skip |
| b17 | skip | **extract** ✗ | **extract** ✗ | **extract** ✗ |
| b18 | skip | **extract** ✗ | **extract** ✗ | skip |
| b19 | skip | **extract** ✗ | **extract** ✗ | skip |
| b20 | skip | **extract** ✗ | **extract** ✗ | skip |
| b21 | skip | **extract** ✗ | **extract** ✗ | skip |
| b22 | skip | **extract** ✗ | **extract** ✗ | skip |
| b23 | skip | **extract** ✗ | **extract** ✗ | skip |
| b24 | skip | **extract** ✗ | **extract** ✗ | **extract** ✗ |
| b25 | skip | **extract** ✗ | **extract** ✗ | skip |
| b26 | skip | **extract** ✗ | **extract** ✗ | skip |
| b27 | skip | **extract** ✗ | **extract** ✗ | skip |
| b28 | skip | **extract** ✗ | **extract** ✗ | **extract** ✗ |
| b29 | skip | **extract** ✗ | **extract** ✗ | skip |
| b30 | skip | **extract** ✗ | **extract** ✗ | skip |
