> **Scope:** Paste-ready Composer 2.5 and GPT-5.6 Luna prompts for the performance leftovers that are still measured. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/performance-residual-00-index.md`](../../.cursor/prompts/performance-residual-00-index.md) through [`.cursor/prompts/performance-residual-03-prompt-cache-prefix-ratchet.md`](../../.cursor/prompts/performance-residual-03-prompt-cache-prefix-ratchet.md)

# Performance residual — Composer / Luna prompts (PP-01–PP-03)

**Created:** 2026-09-26 · **Status:** ready to paste · **Audience:** Composer 2.5 (PP-01, PP-02) and GPT-5.6 Luna (PP-03)

Paste **one** `.cursor/prompts/performance-residual-0N-*.md` file per session. **Do not implement from this document.**

Earlier performance waves already shipped hot-path caching, prompt-cache prefix ordering, conditional GET, async Real execute, operations polling, and the operator-home proxy budget. This set does not reopen those waves.

| ID | Model | Prompt | Intent |
|----|--------|--------|--------|
| **PP-01** | Composer 2.5 | [performance-residual-01-review-detail-first-load.md](../../.cursor/prompts/performance-residual-01-review-detail-first-load.md) | Cut `/architecture/reviews/[reviewId]` initial JS by ≥ 400 kB from the number measured at session start. Baseline on file is **4588.8 kB**. |
| **PP-02** | Composer 2.5 | [performance-residual-02-alerts-inbox-first-load.md](../../.cursor/prompts/performance-residual-02-alerts-inbox-first-load.md) | Cut `/governance/alerts` initial JS by ≥ 200 kB. Baseline on file is **2149.9 kB**. After PP-01. |
| **PP-03** | GPT-5.6 Luna | [performance-residual-03-prompt-cache-prefix-ratchet.md](../../.cursor/prompts/performance-residual-03-prompt-cache-prefix-ratchet.md) | Lock a byte-stable static prefix ahead of run ids. Stop if the lock already exists. |

## Run order

**PP-01** and **PP-03** can run in parallel. **PP-02** waits until **PP-01** has merged, because both write `archlucid-ui/performance/first-load-js-baseline.v1.json`.

## Explicit non-work

- **TB-2302** `GET /v1/operator/bootstrap` — no-go after the TB-2304 proxy budget.
- Paid cold-start levers (`min_replicas`, ReadyToRun, CPU, trim) — no-go until a staging Phase B baseline says otherwise.
- More API replicas as a fix for Azure OpenAI 429s.
- LOB-to-blob offload, a new run-progress URL, or collapsing review workspace tabs.
- Daytime-wait **DW-001–DW-024** — already a separate prompt set.
- GTM **M-90 / M-44 / M-91 / M-92**. Closed assurance **TB-135 / TB-136**.
