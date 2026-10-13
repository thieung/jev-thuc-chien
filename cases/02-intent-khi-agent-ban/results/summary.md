# Kết quả: 02-intent-khi-agent-ban

| Chỉ số | Trước: keyword + LLM | Trước: LLM + ngữ cảnh task | Sau: Jev (chỉ message) | Sau: Jev + ngữ cảnh task | Active: Jev + ngữ cảnh, fallback LLM |
| --- | --- | --- | --- | --- | --- |
| Đúng / tổng | 39/40 (97.5%) | 39/40 (97.5%) | 36/40 (90.0%) | 38/40 (95.0%) | 39/40 (97.5%) |
| Lượt gọi API (lỗi) | 36 (0) | 36 (0) | 36 (0) | 36 (0) | 37 (0) |
| Latency mỗi mục p50 / p95 (ms) | 1357 / 4849 | 1370 / 5214 | 255 / 632 | 262 / 768 | 266 / 739 |
| Input token TB / mục | 197 | 212 | 471 | 499 | 505 |
| Chi phí / 1.000 mục (USD) | $0.0635 | $0.0675 | $0.0198 | $0.0209 | $0.0228 |

## Chỉ số riêng của use case

- Đi fast-path keyword (không gọi model): 4/40
- Jev chỉ message: 37/40 mục Jev đủ tự tin (≥ 0.75); đúng 36/37 trong số đó
- Jev + ngữ cảnh: 39/40 mục Jev đủ tự tin (≥ 0.75); đúng 38/39 trong số đó
- Active phải fallback sang LLM: 1/40

## Ca sai

- Trước: keyword + LLM: steer → cancel ×1
- Trước: LLM + ngữ cảnh task: steer → cancel ×1
- Sau: Jev (chỉ message): steer → cancel ×1, steer → abstain ×1, new_task → abstain ×2
- Sau: Jev + ngữ cảnh task: steer → cancel ×1, new_task → abstain ×1
- Active: Jev + ngữ cảnh, fallback LLM: steer → cancel ×1

## Từng mục

| id | expected | Trước: keyword + LLM | Trước: LLM + ngữ cảnh task | Sau: Jev (chỉ message) | Sau: Jev + ngữ cảnh task | Active: Jev + ngữ cảnh, fallback LLM |
| --- | --- | --- | --- | --- | --- | --- |
| s01 | status_query | status_query | status_query | status_query | status_query | status_query |
| s02 | status_query | status_query | status_query | status_query | status_query | status_query |
| s03 | status_query | status_query | status_query | status_query | status_query | status_query |
| s04 | status_query | status_query | status_query | status_query | status_query | status_query |
| s05 | status_query | status_query | status_query | status_query | status_query | status_query |
| s06 | status_query | status_query | status_query | status_query | status_query | status_query |
| s07 | status_query | status_query | status_query | status_query | status_query | status_query |
| s08 | status_query | status_query | status_query | status_query | status_query | status_query |
| c01 | cancel | cancel | cancel | cancel | cancel | cancel |
| c02 | cancel | cancel | cancel | cancel | cancel | cancel |
| c03 | cancel | cancel | cancel | cancel | cancel | cancel |
| c04 | cancel | cancel | cancel | cancel | cancel | cancel |
| c05 | cancel | cancel | cancel | cancel | cancel | cancel |
| c06 | cancel | cancel | cancel | cancel | cancel | cancel |
| c07 | cancel | cancel | cancel | cancel | cancel | cancel |
| c08 | cancel | cancel | cancel | cancel | cancel | cancel |
| t01 | steer | **cancel** ✗ | **cancel** ✗ | **cancel** ✗ | **cancel** ✗ | **cancel** ✗ |
| t02 | steer | steer | steer | steer | steer | steer |
| t03 | steer | steer | steer | steer | steer | steer |
| t04 | steer | steer | steer | steer | steer | steer |
| t05 | steer | steer | steer | steer | steer | steer |
| t06 | steer | steer | steer | steer | steer | steer |
| t07 | steer | steer | steer | **abstain** ✗ | steer | steer |
| t08 | steer | steer | steer | steer | steer | steer |
| t09 | steer | steer | steer | steer | steer | steer |
| t10 | steer | steer | steer | steer | steer | steer |
| t11 | steer | steer | steer | steer | steer | steer |
| t12 | steer | steer | steer | steer | steer | steer |
| n01 | new_task | new_task | new_task | new_task | new_task | new_task |
| n02 | new_task | new_task | new_task | new_task | new_task | new_task |
| n03 | new_task | new_task | new_task | **abstain** ✗ | new_task | new_task |
| n04 | new_task | new_task | new_task | new_task | new_task | new_task |
| n05 | new_task | new_task | new_task | new_task | new_task | new_task |
| n06 | new_task | new_task | new_task | new_task | new_task | new_task |
| n07 | new_task | new_task | new_task | new_task | new_task | new_task |
| n08 | new_task | new_task | new_task | new_task | new_task | new_task |
| n09 | new_task | new_task | new_task | new_task | new_task | new_task |
| n10 | new_task | new_task | new_task | new_task | new_task | new_task |
| n11 | new_task | new_task | new_task | **abstain** ✗ | **abstain** ✗ | new_task |
| n12 | new_task | new_task | new_task | new_task | new_task | new_task |
